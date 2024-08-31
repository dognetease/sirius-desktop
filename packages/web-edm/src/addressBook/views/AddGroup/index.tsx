import React, { useState, useEffect } from 'react';
import { Input, Checkbox, Button, Table } from 'antd';
import { IBaseModalType } from '../baseType';
import { FilterContacts, IFilterContactsProps } from '../../components/FilterContacts/index';
import { ColumnsType } from 'antd/es/table';
import { ReactComponent as CloseIcon } from '../../assets/modalClose.svg';
import { ReactComponent as ArrowLeftIcon } from '../../assets/arrowLeft.svg';
import classnames from 'classnames';
import { apis, apiHolder, CustomerApi, AddressBookApi, TSearchContactsReq, TSearchContactsResp } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import message from '@web-common/components/UI/Message/SiriusMessage';
import styles from './index.module.scss';
import { getIn18Text } from 'api';
export interface IAddGroupProps extends IBaseModalType {
  title?: string;
  initContacts?: TTableResult[];
  initGroupName?: string;
}
interface IAreaItem {
  label: string;
  value: string;
  children: {
    label: string;
    value: string;
  }[];
}
export interface TTableResult {
  info: string;
  name: string;
  contactId: number;
  addressId: number;
  contactType: number;
}
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
export function AddGroup(props: IAddGroupProps) {
  const { visible, onClose, id, onSuccess, onError, title = getIn18Text('XINJIANFENZU'), initContacts = [], initGroupName = '' } = props;
  const [groupName, setGroupName] = useState('');
  const [checkContact, setCheckContact] = useState(false);
  const [isFilter, setIsFilter] = useState(false);
  const [tableResult, setTableResult] = useState<TTableResult[]>([]);
  const tableColumn: ColumnsType<TTableResult> = [
    {
      title: getIn18Text('YOUJIANDEZHI'),
      key: 'email',
      align: 'left',
      render(text: string, record) {
        // contactType 1 -> email ; 2 -> whatsapp
        const { info, contactType } = record;
        return <div>{contactType === 1 ? info : '-'}</div>;
      },
    },
    {
      title: getIn18Text('XINGMING'),
      dataIndex: 'name',
      key: 'name',
      align: 'left',
    },
    {
      title: getIn18Text('CAOZUO'),
      key: 'op',
      align: 'left',
      render(text: string, record: TTableResult) {
        const { addressId } = record;
        return (
          <div className={styles.tableRemove} onClick={() => removeContactById(addressId)}>
            {getIn18Text('YICHU')}
          </div>
        );
      },
    },
  ];
  const [conditions, setConditions] = useState<IFilterContactsProps['conditions']>([
    {
      id: 0,
      type: 'email',
      logicalCondition: 'include',
      values: [],
      options: [],
    },
  ]);
  const [conditionSnapShot, setConditionSnapShot] = useState<IFilterContactsProps['conditions']>([
    {
      id: 0,
      type: 'email',
      logicalCondition: 'include',
      values: [],
      options: [],
    },
  ]);
  const [conditionType, setConditionType] = useState<IFilterContactsProps['conditionType']>('and');
  const [conditionTypeSnapShot, setConditionTypeSnapShot] = useState<IFilterContactsProps['conditionType']>('and');
  const [conditionId, setConditionId] = useState(1);
  const [globalArea, setGlobalArea] = useState<IAreaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const initViewState = () => {
    setGroupName(initGroupName);
    setCheckContact(initContacts.length > 0 ? true : false);
    setIsFilter(false);
    setTableResult(initContacts);
    setConditionId(1);
    setConditionType('and');
    setConditions([
      {
        id: 0,
        type: 'email',
        logicalCondition: 'include',
        values: [],
        options: [],
      },
    ]);
    initSnapShot();
  };
  const removeContactById = (id: number) => {
    setTableResult(pre => {
      return pre.filter(el => el.addressId !== id);
    });
  };
  const addFilter = () => {
    if (conditions.length >= 10) {
      return;
    }
    setConditions(pre => {
      const turnId = conditionId;
      setConditionId(preId => preId + 1);
      return [
        ...pre,
        {
          id: turnId,
          type: 'email',
          logicalCondition: 'include',
          values: [],
          options: [],
        },
      ];
    });
  };
  const subFilter = (condId: number) => {
    setConditions(pre => {
      return pre.filter(each => each.id !== condId);
    });
  };
  const allCondChange: IFilterContactsProps['onAllCondChange'] = value => {
    setConditionType(value);
  };
  const condLogicChange: IFilterContactsProps['onCondLogicChange'] = (id, value) => {
    setConditions(pre => {
      return pre.map(each => {
        if (each.id === id) {
          return {
            ...each,
            logicalCondition: value,
          };
        }
        return each;
      });
    });
  };
  const condTypeChange: IFilterContactsProps['onCondTypeChange'] = (id, type) => {
    const optionsMap: any = {
      name: [],
      email: [],
      country: globalArea,
      company: [],
    };
    const valueMap: any = {
      name: [],
      email: [],
      country: [''],
      company: [],
    };
    setConditions(pre => {
      return pre.map(each => {
        if (id === each.id) {
          return {
            ...each,
            type,
            values: valueMap[type],
            options: optionsMap[type],
          };
        }
        return each;
      });
    });
  };
  const valueChange: IFilterContactsProps['onValueChange'] = (id, values) => {
    if (Array.isArray(values)) {
      values = values.slice(0, 5);
    }
    setConditions(pre => {
      return pre.map(each => {
        if (each.id === id) {
          return {
            ...each,
            values,
          };
        }
        return each;
      });
    });
  };
  const continentChange: IFilterContactsProps['onContinentChange'] = (id, value) => {
    setConditions(pre => {
      return pre.map(el => {
        if (el.id !== id) {
          return el;
        }
        const newEle = {
          ...el,
        };
        newEle.values = [value];
        return newEle;
      });
    });
  };
  const countryChange: IFilterContactsProps['onCountryChange'] = (id, value) => {
    const foundIndex = conditions.findIndex(el => el.id === id);
    if (foundIndex !== -1) {
      const copy = Object.assign({}, conditions[foundIndex]);
      const { values } = copy;
      if (values.length === 0) {
        values.push('');
        values.push(value);
      } else if (values.length === 1) {
        values.push(value);
      } else {
        values[1] = value;
      }
      const newConditions = conditions.slice();
      newConditions[foundIndex] = copy;
      setConditions(newConditions);
    }
  };
  const goBack = () => {
    resetFromSnapShot();
    setIsFilter(false);
  };
  const saveSnapShot = () => {
    setConditionSnapShot([...conditions]);
    setConditionTypeSnapShot(conditionType);
  };
  const initSnapShot = () => {
    setConditionSnapShot([
      {
        id: 0,
        type: 'email',
        logicalCondition: 'include',
        values: [],
        options: [],
      },
    ]);
    setConditionTypeSnapShot('and');
  };
  const resetFromSnapShot = () => {
    setConditions([...conditionSnapShot]);
    setConditionType(conditionTypeSnapShot);
  };
  const titleJSX = (
    <div className={styles.modalTitle}>
      {isFilter ? (
        <>
          <ArrowLeftIcon onClick={goBack} />
          <span>{getIn18Text('SHAIXUANLIANXIREN')}</span>
        </>
      ) : (
        title
      )}
      <div className={styles.modalTitleClose} onClick={() => onClose(id)}>
        <CloseIcon />
      </div>
    </div>
  );
  // 提交：确认筛选条件 或者 确认添加分组
  const onConfirmBtn = () => {
    if (isFilter) {
      saveSnapShot();
      setLoading(true);
      getFilterContacts()
        .then(data => {
          const formatted = formatTableResult(data);
          setTableResult(formatted);
          setIsFilter(false);
        })
        .finally(() => setLoading(false));
    } else {
      add2Group();
    }
  };
  const formatTableResult = (data: TSearchContactsResp[]) => {
    const result: TTableResult[] = data.map(el => {
      return {
        addressId: el.id,
        contactId: el.contactId,
        name: el.contactName,
        info: el.contactAddressInfo,
        contactType: el.contactAddressType,
      };
    });
    return result;
  };
  const getFilterContacts = () => {
    const relation = conditionType === 'and' ? 'AND' : 'OR';
    let searchItems = [] as {
      field: string;
      rule: 'LIKE' | 'NOT_LIKE';
      searchKeys: string[];
      module: 'address';
    }[];
    for (const el of conditions) {
      const { type, logicalCondition, values } = el;
      const rule = logicalCondition === 'include' ? 'LIKE' : 'NOT_LIKE';
      switch (type) {
        case 'name':
          searchItems.push({
            rule,
            field: 'contactName',
            module: 'address',
            searchKeys: values,
          });
          break;
        case 'email':
          searchItems.push({
            rule,
            field: 'contactAddressInfo',
            module: 'address',
            searchKeys: values,
          });
          break;
        case 'company':
          searchItems.push({
            rule,
            field: 'companyName',
            module: 'address',
            searchKeys: values,
          });
          break;
        case 'country':
          const [continent = '', country = ''] = values;
          searchItems.push({
            rule,
            field: 'continent',
            module: 'address',
            searchKeys: [continent],
          });
          searchItems.push({
            rule,
            field: 'country',
            module: 'address',
            searchKeys: [country],
          });
          break;
      }
      searchItems = searchItems
        .filter(el => el.searchKeys && el.searchKeys.length > 0)
        .filter(el => {
          if (el.field === 'continent' || el.field === 'country') {
            const { searchKeys } = el;
            return searchKeys[0] && searchKeys[0].length > 0;
          }
          return true;
        });
    }
    const params: TSearchContactsReq = {
      contactAddressType: 1,
      searchParam: {
        relation,
        searchItems,
      },
    };
    return addressBookApi.addressBookSearchContacts(params);
  };
  const add2Group = () => {
    if (groupName.length === 0) {
      message.warn(getIn18Text('QINGSHURUFENZUMINGCHENG\uFF01'));
      return;
    }
    if (groupName.length > 20) {
      message.warn(getIn18Text('FENZUMINGCHENGZUIDUOSHURU20GEZI\uFF01'));
      return;
    }
    const addressList = checkContact ? tableResult.map(el => el.addressId) : [];
    setLoading(true);
    addressBookApi
      .addNewGroup({
        groupName,
        addressIdList: [...new Set(addressList)],
      })
      .then(() => {
        setGroupName('');
        onSuccess && onSuccess(id, groupName);
      })
      .catch(err => onError && onError(id, err))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    initViewState();
    customerApi.getGlobalArea().then(({ area }) => {
      setGlobalArea(
        area.map(each => {
          return {
            value: each.value,
            label: each.label,
            children: each.children.map(ele => ({
              value: ele.value,
              label: ele.label,
            })),
          };
        })
      );
    });
  }, []);
  return (
    <Modal
      visible={visible}
      title={titleJSX}
      afterClose={initViewState}
      footer={[
        <Button
          onClick={() => {
            if (isFilter) {
              goBack();
              return;
            }
            onClose(id);
          }}
        >
          {getIn18Text('QUXIAO')}
        </Button>,
        <Button onClick={onConfirmBtn} loading={loading} type="primary">
          {getIn18Text('QUEDING')}
        </Button>,
      ]}
      onCancel={() => onClose(id)}
      width={620}
      closable={false}
      maskClosable={false}
      className={styles.group}
      style={{ height: '600px' }}
    >
      <div className={styles.groupBody}>
        {isFilter ? (
          <FilterContacts
            conditions={conditions}
            conditionType={conditionType}
            onAddFilter={addFilter}
            onSubFilter={subFilter}
            onAllCondChange={allCondChange}
            onCondLogicChange={condLogicChange}
            onCondTypeChange={condTypeChange}
            onValueChange={valueChange}
            onContinentChange={continentChange}
            onCountryChange={countryChange}
          />
        ) : (
          <div className={styles.groupBodyDisplay}>
            <div className={styles.name}>{getIn18Text('FENZUMINGCHENG')}</div>
            <div className={styles.input}>
              <Input placeholder={getIn18Text('QINGSHURU20ZIYINEIDEFENZUMINGCHENG')} onChange={e => setGroupName(e.target.value)} maxLength={20} value={groupName} />
            </div>
            <div className={styles.checkbox}>
              <Checkbox
                onChange={e => {
                  setCheckContact(e.target.checked);
                }}
                checked={checkContact}
              >
                {getIn18Text('TIANJIALIANXIREN')}
              </Checkbox>
              <div className={styles.checkboxWrapper}>
                {tableResult.length > 0 && checkContact ? (
                  <div className={styles.checkboxWrapperCount}>
                    {getIn18Text('GONG')}
                    {tableResult.length}
                    {getIn18Text('GE')}
                  </div>
                ) : null}
                <div
                  onClick={() => {
                    if (!checkContact) {
                      return;
                    }
                    setIsFilter(true);
                  }}
                  className={classnames(
                    {
                      [styles.checkboxWrapperBtnDisable]: !checkContact,
                    },
                    styles.checkboxWrapperBtn
                  )}
                >
                  {getIn18Text('SHAIXUAN')}
                </div>
              </div>
            </div>
            {tableResult.length > 0 && checkContact ? (
              <div className={styles.table}>
                <Table
                  size="small"
                  pagination={{
                    pageSize: 5,
                    hideOnSinglePage: true,
                    showSizeChanger: false,
                  }}
                  dataSource={tableResult}
                  columns={tableColumn}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
}
