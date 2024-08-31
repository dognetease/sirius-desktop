import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { Spin, Checkbox, Button } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox';
import { apiHolder, CustomerApi, ILabelData, ICustomerData, ICustomerContactData, ISearchCustomerFromPersonalClueReq, View, ViewChangeParams } from 'api';
import ContactItem from './contactItem';
import CustomerItem from './customerItem';
import { debounce } from 'lodash';
import style from './pickerView.module.scss';
import { UserGuideContext } from '../components/UserGuide/context';
import { getIn18Text } from 'api';
const customerApi = apiHolder.api.requireLogicalApi('customerApiImpl') as CustomerApi;
interface CustomerViewProps {
  searchCondition: ISearchCustomerFromPersonalClueReq;
  defaultCheckedKeys: string[];
  onPickedChange: (contacts: ICustomerContactData[]) => void;
  onViewChange: (view: View, params?: ViewChangeParams) => void;
  openCustomerFilterModal: () => void;
  showOwnTips?: boolean;
  calcDecreaseHeight?: number;
}
const CustomerViewFromModal: React.FC<CustomerViewProps> = props => {
  const { defaultCheckedKeys: defaultCheckedKeysFromProps, onPickedChange, onViewChange, showOwnTips = true, calcDecreaseHeight = 0 } = props;
  const [searchKey, setSearchKey] = useState<string>('');
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [customers, setCustomers] = useState<ICustomerData[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [contactNum, setContactum] = useState(0);
  const { state: userGuideState, dispatch: userGuideDispatch = () => {} } = useContext(UserGuideContext);
  const lastFetchTime = useRef(0);
  const debouncedSearch = useRef(
    debounce(
      searchCondition => {
        const fetchTime = (lastFetchTime.current = Date.now());
        setSearching(true);
        let promise = Promise.resolve(searchCondition);
        promise
          .then(data => {
            if (fetchTime === lastFetchTime.current) {
              data.company_list.forEach(customer => {
                customer.contacts = customer.contact_list;
                customer.labels = [];
                const { company_id, company_name, contacts } = customer;
                contacts.forEach(contact => {
                  contact.company_id = company_id;
                  contact.company_name = company_name;
                });
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
    userGuideDispatch({ payload: { shouldShow: false, hasOperate: true } });
    let list = contacts.filter(contact => checkedKeys.includes(contact.email));
    if (checkedKeys.length > 0 && checkedKeys.length + defaultCheckedKeys.length === contacts.length) {
      let data = props.searchCondition;
      data.company_list.forEach(customer => {
        customer.contacts = customer.contact_list;
        customer.labels = [];
        const { company_id, company_name, contacts } = customer;
        contacts.forEach(contact => {
          contact.company_id = company_id;
          contact.company_name = company_name;
        });
      });
      list = data.company_list.reduce((accumulator, customer) => [...accumulator, ...customer.contacts], [] as ICustomerContactData[]);
    }
    onPickedChange(list);
    setCheckedKeys([]);
    setAdding(false);
  };
  function isGroupChecked(customer: ICustomerData): boolean {
    const groupContacts = (customer?.contacts || []).map(concat => concat.email);
    return groupContacts.every(email => checkedKeys.includes(email) || defaultCheckedKeys.includes(email));
  }
  function isGroupDisabled(customer: ICustomerData): boolean {
    const groupContacts = (customer?.contacts || []).map(concat => concat.email);
    return groupContacts.every(email => defaultCheckedKeys.includes(email));
  }
  function isGroupIndeterminate(customer: ICustomerData): boolean {
    const groupContacts = (customer?.contacts || []).map(concat => concat.email);
    let checkAll = true;
    let hasCheck = false;
    groupContacts.forEach(email => {
      if (checkedKeys.includes(email) || defaultCheckedKeys.includes(email)) {
        hasCheck = true;
      } else {
        checkAll = false;
      }
    });
    if (checkAll) {
      return false;
    }
    return hasCheck;
  }
  function groupCheckChange(e: CheckboxChangeEvent, customer: ICustomerData) {
    const groupContacts = (customer?.contacts || []).map(concat => concat.email);
    if (e?.target?.checked) {
      setCheckedKeys([...new Set([...checkedKeys, ...groupContacts])]);
    } else {
      const newCheckedKeys = checkedKeys.filter(email => !groupContacts.includes(email));
      setCheckedKeys(newCheckedKeys);
    }
  }
  useEffect(() => {
    if (userGuideState?.currentStep >= 1) {
      return;
    }
    if (!searching && checkedKeys.length) {
      userGuideDispatch({ payload: { shouldShow: true, currentStep: 1, hasOperate: false } });
    }
  }, [searching, checkedKeys]);
  return (
    <div className={style.pickerView} style={{ height: `calc(100% - ${calcDecreaseHeight}px)` }}>
      <div className={style.body}>
        {searching ? (
          <Spin className={style.searching} />
        ) : (
          <>
            {showOwnTips && (
              <div className={style.filterRow}>
                <p className={style.filterText}>
                  {getIn18Text('ANCISHAIXUANTIAOJIAN\uFF0CYISHAIXUAN')}
                  <span className={style.filterCount}>{contactNum}</span>
                  {getIn18Text('REN')}
                </p>
                <Button
                  type="link"
                  className={style.clearFilterBtn}
                  onClick={() => {
                    userGuideDispatch({ payload: { shouldShow: false, hasOperate: true } });
                    props.openCustomerFilterModal();
                  }}
                >
                  {getIn18Text('ZHONGXINSHAIXUAN')}
                </Button>
              </div>
            )}

            <div className={style.contacts}>
              {customers.map(customer => (
                <CustomerItem
                  key={customer.company_id}
                  name={customer.company_name}
                  labels={customer.labels}
                  showCheckAll={true}
                  checked={isGroupChecked(customer)}
                  indeterminate={isGroupIndeterminate(customer)}
                  disabled={isGroupDisabled(customer)}
                  onChange={e => groupCheckChange(e, customer)}
                >
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
        <Button type="primary" loading={adding} disabled={searching || !checkedKeys.length} onClick={handleAdd}>
          {getIn18Text('TIANJIA')}
        </Button>
      </div>
    </div>
  );
};
CustomerViewFromModal.defaultProps = {
  defaultCheckedKeys: [],
};
export default CustomerViewFromModal;
