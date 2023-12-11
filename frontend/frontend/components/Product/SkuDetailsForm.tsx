import React, { FC, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Dropdown,
  DropdownButton,
  Form,
  InputGroup,
} from 'react-bootstrap';
import { useToasts } from 'react-toast-notifications';
import { getFormatedStringFromDays } from '../../helper/utils';
import { Products } from '../../services/product.service';

interface ISkuDetailsFormProps {
  setSkuDetailsFormShow: React.Dispatch<React.SetStateAction<boolean>>;
  productId: string;
  setAllSkuDetails: React.Dispatch<React.SetStateAction<any[]>>;
  allSkuDetails: any[];
  skuIdForUpdate: string;
  setSkuIdForUpdate: React.Dispatch<React.SetStateAction<string>>;
}

interface ISkuFormState {
  skuName: string;
  price: number;
  validity: number;
  validityType: string;
  lifetime: boolean;
}

const initialState: ISkuFormState = {
  skuName: '',
  price: 0,
  validity: 0,
  validityType: 'Select Type',
  lifetime: false,
};

const SkuDetailsForm: FC<ISkuDetailsFormProps> = ({
  setSkuDetailsFormShow,
  productId,
  setAllSkuDetails,
  allSkuDetails,
  skuIdForUpdate,
  setSkuIdForUpdate,
}) => {
  const { addToast } = useToasts();
  const [isLoading, setIsLoading] = useState(false);
  const [skuForm, setSkuForm] = useState<ISkuFormState>(initialState);

  const handleCancel = () => {
    setSkuIdForUpdate('');
    setSkuForm(initialState);
    setSkuDetailsFormShow(false);
  };

  useEffect(() => {
    if (skuIdForUpdate) {
      const sku = allSkuDetails.find((sku) => sku._id === skuIdForUpdate);
      const periodTimes = getFormatedStringFromDays(sku?.validity);
      setSkuForm({
        ...initialState,
        ...sku,
        validity: periodTimes.split(' ')[0] || 0,
        validityType: periodTimes.split(' ')[1] || 'Select Type',
      });
    }
  }, [skuIdForUpdate, allSkuDetails]);

  const handleErrors = (error: any | Error) => {
    if (error.response) {
      if (Array.isArray(error.response?.data?.message)) {
        error.response.data.message.forEach((message: any) => {
          addToast(message, { appearance: 'error', autoDismiss: true });
        });
      } else {
        addToast(error.response.data.message, { appearance: 'error', autoDismiss: true });
      }
    } else {
      addToast(error.message, { appearance: 'error', autoDismiss: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { skuName, price, validity, lifetime } = skuForm;
      if (!skuName || !price) {
        throw new Error('Invalid data');
      }
      if (!lifetime && !validity) {
        throw new Error('Invalid data');
      }
      if (!lifetime && skuForm.validityType === 'Select Type') {
        throw new Error('Invalid data');
      }

      if (!lifetime) {
        skuForm.validity =
          skuForm.validityType === 'months' ? skuForm.validity * 30 : skuForm.validity * 365;
      } else {
        skuForm.validity = Number.MAX_SAFE_INTEGER;
      }

      setIsLoading(true);
      const skuDetailsRes = skuIdForUpdate
        ? await Products.updateSku(productId, skuIdForUpdate, skuForm)
        : await Products.addSku(productId, { skuDetails: [skuForm] });

      if (!skuDetailsRes.success) {
        throw new Error(skuDetailsRes.message);
      }

      setSkuDetailsFormShow(false);
      setSkuIdForUpdate('');
      setAllSkuDetails(skuDetailsRes.result?.skuDetails);
    } catch (error: any | Error) {
      handleErrors(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card style={{ padding: '10px' }}>
      <h6 style={{ color: 'green' }}>SKU information ::</h6>
      <Form>
        <Form.Group controlId='formBasicEmail'>
          <Form.Label>SKU Name</Form.Label>
          <Form.Control
            type='text'
            placeholder='Enter SKU Name'
            value={skuForm.skuName}
            onChange={(e) => setSkuForm({ ...skuForm, skuName: e.target.value })}
          />
        </Form.Group>
        <Form.Group controlId='formBasicPassword'>
          <Form.Label>SKU Price For Each License</Form.Label>
          <Form.Control
            type='number'
            placeholder='Enter SKU Price'
            value={skuForm.price}
            onChange={(e) => setSkuForm({ ...skuForm, price: parseFloat(e.target.value) })}
          />
        </Form.Group>
        <Form.Group controlId='formBasicPassword'>
          <Form.Label>SKU Validity</Form.Label>{' '}
          <small style={{ color: 'grey' }}>
            (If validity is lifetime then check the box)
            <Form.Check
              type='switch'
              id='custom-switch'
              label='Lifetime'
              checked={skuForm.lifetime}
              onChange={(e) =>
                e.target.checked
                  ? setSkuForm({
                      ...skuForm,
                      lifetime: e.target.checked,
                      validity: 0,
                      validityType: 'Select Type',
                    })
                  : setSkuForm({
                      ...skuForm,
                      validity: 0,
                      lifetime: e.target.checked,
                      validityType: 'Select Type',
                    })
              }
            />
          </small>
          <InputGroup className='mb-3'>
            <Form.Control
              aria-label='Text input with checkbox'
              disabled={skuForm.lifetime}
              type='number'
              value={skuForm.validity}
              onChange={(e) => setSkuForm({ ...skuForm, validity: parseInt(e.target.value) })}
            />
            <DropdownButton
              variant='outline-secondary'
              title={skuForm.validityType}
              id='input-group-dropdown-9'
              disabled={skuForm.lifetime}
              align='end'
              onSelect={(e) => setSkuForm({ ...skuForm, validityType: e || '' })}
            >
              <Dropdown.Item href='#' eventKey={'months'}>
                Months
              </Dropdown.Item>
              <Dropdown.Item href='#' eventKey={'years'}>
                Years
              </Dropdown.Item>
            </DropdownButton>
          </InputGroup>
        </Form.Group>

        <div style={{ marginTop: '10px' }}>
          <Button variant='outline-info' onClick={handleCancel}>
            Cancel
          </Button>{' '}
          <Button
            variant='outline-primary'
            type='submit'
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading && (
              <span
                className='spinner-border spinner-border-sm'
                role='status'
                aria-hidden='true'
              ></span>
            )}
            Submit
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default SkuDetailsForm;
