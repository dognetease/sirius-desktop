import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Input, Spin, Checkbox, Button } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox';
import { apiHolder, CustomerApi, ICustomerData, ICustomerContactData, View, ViewChangeParams } from 'api';
// import { View, ViewChangeParams } from './customer';
import Breadcrumb from './breadcrumb';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import ContactItem from './contactItem';
import CustomerItem from './customerItem';
import { debounce } from 'lodash';
import style from './pickerView.module.scss';
import { getIn18Text } from 'api';

const customerApi = apiHolder.api.requireLogicalApi('customerApiImpl') as CustomerApi;

interface LabelDetailViewProps {
  labelId: string;
  labelName: string;
  defaultCheckedKeys: string[];
  onPickedChange: (contacts: ICustomerContactData[]) => void;
  onViewChange: (view: View, params?: ViewChangeParams) => void;
}

const LabelDetailView: React.FC<LabelDetailViewProps> = props => {
  const { labelId, labelName, defaultCheckedKeys: defaultCheckedKeysFromProps, onPickedChange, onViewChange } = props;

  const [searchKey, setSearchKey] = useState<string>('');
  const [searching, setSearching] = useState(false);
  const [customers, setCustomers] = useState<ICustomerData[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

  const breadcrumbList = [
    { name: getIn18Text('KEHULIEBIAO'), highlight: true, onClick: () => onViewChange('customer') },
    { name: getIn18Text('KEHUBIAOQIAN'), highlight: true, onClick: () => onViewChange('label') },
    { name: labelName },
  ];

  const lastFetchTime = useRef(0);

  const debouncedSearch = useRef(
    debounce(
      (key: string) => {
        const fetchTime = (lastFetchTime.current = Date.now());

        setSearching(true);

        customerApi
          .search({
            key,
            range: 'LABEL',
            label_id_limit: labelId,
          })
          .then(data => {
            if (fetchTime === lastFetchTime.current) {
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
          placeholder={`请输入"${labelName}"下的客户或联系人信息`}
          prefix={<SearchIcon />}
          allowClear
        />
      </div>
      <Breadcrumb className={style.breadcrumb} list={breadcrumbList} />
      <div className={style.body}>
        {searching ? (
          <Spin className={style.searching} />
        ) : (
          <>
            {!customers.length && <div className={style.empty}>{getIn18Text('ZANWUSHUJU')}</div>}
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

LabelDetailView.defaultProps = {
  defaultCheckedKeys: [],
};

export default LabelDetailView;
