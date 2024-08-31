import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Spin, Checkbox, Button } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox';
import { apiHolder, CustomerApi, ILabelData, ICustomerData, ICustomerContactData, ISearchCustomerFromPersonalClueReq } from 'api';
import { View, ViewChangeParams } from './customer';
import ContactItem from './contactItem';
import CustomerItem from './customerItem';
import { debounce } from 'lodash';
import style from './pickerView.module.scss';

const customerApi = apiHolder.api.requireLogicalApi('customerApiImpl') as CustomerApi;

interface CustomerViewProps {
  searchCondition: ISearchCustomerFromPersonalClueReq;
  defaultCheckedKeys: string[];
  onPickedChange: (contacts: ICustomerContactData[]) => void;
  onViewChange: (view: View, params?: ViewChangeParams) => void;
  openCustomerFilterModal: () => void;
}

const CustomerViewFromModal: React.FC<CustomerViewProps> = props => {
  const { defaultCheckedKeys: defaultCheckedKeysFromProps, onPickedChange, onViewChange } = props;

  const [searchKey, setSearchKey] = useState<string>('');
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [customers, setCustomers] = useState<ICustomerData[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [contactNum, setContactum] = useState(0);

  const lastFetchTime = useRef(0);

  const debouncedSearch = useRef(
    debounce(
      searchCondition => {
        const fetchTime = (lastFetchTime.current = Date.now());
        const { activeTab = '1', ...payload } = searchCondition;
        setSearching(true);
        let promise;
        if (activeTab === '2') {
          promise = customerApi.searchCustomerFromClue(payload).then(data => {
            data.company_list = data.part_info_list;
            return data;
          });
        } else if (activeTab === '3') {
          promise = customerApi.searchCustomerFromOpenSea(payload).then(data => {
            data.company_list = data.part_info_list;
            return data;
          });
        } else {
          promise = Promise.resolve(searchCondition);
        }
        promise
          .then(data => {
            if (fetchTime === lastFetchTime.current) {
              data.company_list.forEach(customer => {
                customer.contacts = customer.contact_list;
                customer.labels = [];
                const { company_id, contacts } = customer;

                contacts.forEach(contact => (contact.company_id = company_id));
              });

              setCustomers(data.company_list);
              setContactum(data.contact_num);
            }
          })
          .finally(() => {
            if (fetchTime === lastFetchTime.current) {
              setSearching(false);
            }
          });
      },
      400,
      { leading: true }
    )
  );

  useEffect(() => {
    debouncedSearch.current(props.searchCondition);
  }, [props.searchCondition]);

  useEffect(() => {
    setCheckedKeys([]);
  }, [props.searchCondition]);

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
  const handleAdd = async () => {
    setAdding(true);
    let list = contacts.filter(contact => checkedKeys.includes(contact.email));
    if (checkedKeys.length > 0 && checkedKeys.length + defaultCheckedKeys.length === contacts.length) {
      const { activeTab, ...params } = props.searchCondition;
      const payload = {
        ...params,
        return_all: true,
      };
      let data;
      if (activeTab === '2') {
        data = await customerApi.searchCustomerFromClue(payload);
        data.company_list = data.part_info_list;
      } else if (activeTab === '3') {
        data = await customerApi.searchCustomerFromOpenSea(payload);
        data.company_list = data.part_info_list;
      } else {
        data = props.searchCondition;
      }
      data.company_list.forEach(customer => {
        customer.contacts = customer.contact_list;
        customer.labels = [];
        const { company_id, contacts } = customer;

        contacts.forEach(contact => (contact.company_id = company_id));
      });
      list = data.company_list.reduce((accumulator, customer) => [...accumulator, ...customer.contacts], [] as ICustomerContactData[]);
    }
    onPickedChange(list);
    setCheckedKeys([]);
    setAdding(false);
  };

  return (
    <div className={style.pickerView}>
      <div className={style.body}>
        {searching ? (
          <Spin className={style.searching} />
        ) : (
          <>
            <div className={style.filterRow}>
              <p className={style.filterText}>
                按此筛选条件，已筛选<span className={style.filterCount}>{contactNum}</span>人
              </p>
              <Button
                type="link"
                className={style.clearFilterBtn}
                onClick={() => {
                  props.openCustomerFilterModal();
                }}
              >
                重新筛选
              </Button>
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
          全选
        </Checkbox>
        <Button type="primary" loading={adding} disabled={searching || !checkedKeys.length} onClick={handleAdd}>
          添加
        </Button>
      </div>
    </div>
  );
};

CustomerViewFromModal.defaultProps = {
  defaultCheckedKeys: [],
};

export default CustomerViewFromModal;
