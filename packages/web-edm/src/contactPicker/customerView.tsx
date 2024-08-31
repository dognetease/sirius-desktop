import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Input, Spin, Checkbox, Button } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox';
import { apiHolder, CustomerApi, ILabelData, ICustomerData, ICustomerContactData, View, ViewChangeParams } from 'api';
// import { View, ViewChangeParams } from './customer';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import LabelItem from './labelItem';
import ContactItem from './contactItem';
import CustomerItem from './customerItem';
import { debounce } from 'lodash';
import style from './pickerView.module.scss';
import { getIn18Text } from 'api';

const customerApi = apiHolder.api.requireLogicalApi('customerApiImpl') as CustomerApi;

interface CustomerViewProps {
  defaultCheckedKeys: string[];
  onPickedChange: (contacts: ICustomerContactData[]) => void;
  onViewChange: (view: View, params?: ViewChangeParams) => void;
}

const CustomerView: React.FC<CustomerViewProps> = props => {
  const { defaultCheckedKeys: defaultCheckedKeysFromProps, onPickedChange, onViewChange } = props;

  const [searchKey, setSearchKey] = useState<string>('');
  const [searching, setSearching] = useState(false);
  const [labels, setLabels] = useState<ILabelData[]>([]);
  const [customers, setCustomers] = useState<ICustomerData[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

  const lastFetchTime = useRef(0);

  const debouncedSearch = useRef(
    debounce(
      (key: string) => {
        const fetchTime = (lastFetchTime.current = Date.now());

        setSearching(true);

        customerApi
          .search({ range: 'ALL', key })
          .then(data => {
            if (fetchTime === lastFetchTime.current) {
              setLabels(data.label_list);

              data.company_list.forEach(customer => {
                const { company_id, contacts } = customer;

                contacts.forEach(contact => (contact.company_id = company_id));
              });

              setCustomers(data.company_list);
            }
          })
          .finally(() => {
            fetchTime === lastFetchTime.current && setSearching(false);
          });
      },
      400,
      { leading: true }
    )
  );

  useEffect(() => {
    debouncedSearch.current(searchKey);
  }, [searchKey]);

  const contacts = useMemo<ICustomerContactData[]>(
    () => customers.reduce((accumulator, customer) => [...accumulator, ...customer.contacts], [] as ICustomerContactData[]),
    [customers]
  );

  const defaultCheckedKeys = useMemo(
    () => contacts.filter(contact => defaultCheckedKeysFromProps.includes(contact.email)).map(contact => contact.email),
    [defaultCheckedKeysFromProps, contacts]
  );

  const handleCheckAllChange = (event: CheckboxChangeEvent) => {
    event.target.checked ? setCheckedKeys(contacts.filter(contact => !defaultCheckedKeys.includes(contact.email)).map(contact => contact.email)) : setCheckedKeys([]);
  };

  const handleContactClick = (contactId: string) => {
    checkedKeys.includes(contactId) ? setCheckedKeys(checkedKeys.filter(key => key !== contactId)) : setCheckedKeys([...checkedKeys, contactId]);
  };

  return (
    <div className={style.pickerView}>
      <div className={style.header}>
        <Input
          value={searchKey}
          onChange={event => {
            setSearchKey(event.target.value);
            setCheckedKeys([]);
          }}
          placeholder={getIn18Text('QINGSHURUKEHUHUOBIAO')}
          prefix={<SearchIcon />}
          allowClear
        />
      </div>
      <div className={style.body}>
        {searching ? (
          <Spin className={style.searching} />
        ) : (
          <>
            {!labels.length && !contacts.length && <div className={style.empty}>{getIn18Text('ZANWUSHUJU')}</div>}
            <div className={style.labels}>
              {searchKey ? (
                labels.map(label => (
                  <LabelItem
                    key={label.label_id}
                    name={label.label_name}
                    count={label.label_company_count}
                    onClick={() => {
                      onViewChange('labelDetail', {
                        labelId: label.label_id,
                        labelName: label.label_name,
                      });
                    }}
                  />
                ))
              ) : (
                <LabelItem key="labels" name={getIn18Text('KEHUBIAOQIAN')} count={labels.length} onClick={() => onViewChange('label')} />
              )}
            </div>
            <div className={style.contacts}>
              {customers.map(customer => (
                <CustomerItem key={customer.company_id} name={customer.company_name} labels={customer.labels}>
                  {customer.contacts.map(({ contact_id, contact_name, email }) => (
                    <ContactItem
                      key={contact_id}
                      name={contact_name}
                      email={email}
                      interactive
                      checkable
                      checked={defaultCheckedKeys.includes(email) || checkedKeys.includes(email)}
                      disabled={defaultCheckedKeys.includes(email)}
                      onClick={() => handleContactClick(email)}
                    />
                  ))}
                </CustomerItem>
              ))}
            </div>
          </>
        )}
      </div>
      <div className={style.footer}>
        <Checkbox
          checked={checkedKeys.length > 0 && checkedKeys.length + defaultCheckedKeys.length === contacts.length}
          indeterminate={checkedKeys.length > 0 && checkedKeys.length + defaultCheckedKeys.length < contacts.length}
          disabled={searching || defaultCheckedKeys.length === contacts.length || contacts.length === 0}
          onChange={handleCheckAllChange}
        >
          {getIn18Text('QUANXUAN')}
        </Checkbox>
        <Button
          type="primary"
          loading={false}
          disabled={searching || !checkedKeys.length}
          onClick={() => {
            onPickedChange(contacts.filter(contact => checkedKeys.includes(contact.email)));
            setCheckedKeys([]);
          }}
        >
          {getIn18Text('TIANJIA')}
        </Button>
      </div>
    </div>
  );
};

CustomerView.defaultProps = {
  defaultCheckedKeys: [],
};

export default CustomerView;
