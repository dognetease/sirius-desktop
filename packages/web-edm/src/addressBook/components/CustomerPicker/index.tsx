import React, { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import { Select, Spin } from 'antd';
import { apiHolder, CustomerApi } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './index.module.scss';
import { getIn18Text } from 'api';
const { Option } = Select;
const customerApi = apiHolder.api.requireLogicalApi('customerApiImpl') as CustomerApi;
export interface CustomerPickerProps {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onOk: (companyId: string) => void;
}
interface Customer {
  companyId: string;
  companyName: string;
}
const CustomerPicker: React.FC<CustomerPickerProps> = props => {
  const { visible, title, onCancel, onOk } = props;
  const [customerName, setCustomerName] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const [fetching, setFetching] = useState<boolean>(false);
  const lastFetchTime = useRef<number>(0);
  const handleCustomersFetch = useCallback(
    debounce((customerName: string) => {
      const fetchTime = Date.now();
      lastFetchTime.current = fetchTime;
      setFetching(true);
      customerApi
        .companyMyList({
          page: 1,
          page_size: 500,
          search_key: customerName,
        } as any)
        .then(data => {
          if (lastFetchTime.current === fetchTime) {
            setCustomers(
              data.content.map(item => ({
                companyId: item.company_id,
                companyName: item.company_name,
              }))
            );
          }
        })
        .finally(() => {
          if (lastFetchTime.current === fetchTime) {
            setFetching(false);
          }
        });
    }, 300),
    []
  );
  useEffect(() => {
    if (!visible) {
      setCustomerName('');
      setCustomers([]);
      setCompanyId(undefined);
    }
  }, [visible]);
  useEffect(() => {
    if (visible) {
      handleCustomersFetch(customerName);
    }
  }, [visible, customerName]);
  return (
    <Modal
      className={style.customerPicker}
      width={480}
      visible={visible}
      title={title}
      onCancel={onCancel}
      onOk={() => companyId && onOk(companyId)}
      okButtonProps={{
        loading: fetching,
        disabled: !companyId,
      }}
    >
      <Select
        placeholder={getIn18Text('QINGXUANZEKEHU')}
        className={style.select}
        allowClear
        showSearch
        searchValue={customerName}
        onSearch={setCustomerName}
        value={companyId}
        onChange={setCompanyId}
        filterOption={false}
        notFoundContent={fetching ? <Spin /> : null}
      >
        {customers.map(item => (
          <Option value={item.companyId}>{item.companyName}</Option>
        ))}
      </Select>
    </Modal>
  );
};
export default CustomerPicker;
