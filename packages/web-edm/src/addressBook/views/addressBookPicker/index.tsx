import React, { useState, useEffect } from 'react';
import BreadCrumb, { BreadcrumbProps } from './breadcrumb';
import LabelItem from './labelItem';
import ContactItem from './contactItem';
import styles from './index.module.scss';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import List from 'react-virtualized/dist/es/List';
import { Checkbox, Button } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { apis, apiHolder, AddressBookNewApi, BusinessContactVO, QuickMarktingGroup, MarktingContactGroup, ProductAuthApi, ErrorReportApi } from 'api';
import classnames from 'classnames';
import { getIn18Text } from 'api';
import { convertGroup2Filter } from '../../utils';
import lodashZip from 'lodash/zip';

const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;
const productAuthApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as unknown as ProductAuthApi;
const sentryReportApi = apiHolder.api.requireLogicalApi(apis.errorReportImpl) as unknown as ErrorReportApi;
export type IAddressContact = {
  contactName: string;
  contactEmail: string;
};

export interface IAddressBookPickerProps {
  pickedContacts: IAddressContact[];
  onPickedChange: (contacts: IAddressContact[]) => void;
  height: number;
  className?: string;
  style?: React.CSSProperties;
  disabledBtn?: boolean;
}

export function AddressBookPicker(props: IAddressBookPickerProps) {
  const { pickedContacts, onPickedChange, height, className = '', style, disabledBtn = false } = props;
  const [originGroupFilterList, setOriginGroupFilterList] = useState<QuickMarktingGroup[]>([]);
  const [viewType, setViewType] = useState<'group' | 'groupedFilter' | 'contact'>('group');
  const [loading, setLoading] = useState(false);

  const [curGroupId, setCurGroupId] = useState(0);
  const [checkedGroupSet, setCheckedGroupSet] = useState<Set<number>>(new Set());
  const [groups, setGroups] = useState<MarktingContactGroup[]>([]);

  const [curViewContacts, setCurViewContacts] = useState<BusinessContactVO[]>([]);
  const [checkedContactSet, setCheckedContacSet] = useState<Set<string>>(new Set());

  const [groupFilterList, setGroupFilterList] = useState<(QuickMarktingGroup & { groupId: number; checked?: boolean })[]>([]);
  const [checkedGroupFilterList, setCheckedGroupFilterList] = useState<Map<number, Set<number>>>(new Map());
  const [groupedFilterCountMap, setGroupedFilterCountMap] = useState<Map<number, Map<number, number>>>(new Map());
  const [groupCountMap, setGroupCountMap] = useState<Map<number, number>>(new Map());

  const [allChecked, setAllChecked] = useState(false);
  const [disableBtn, setDisableBtn] = useState(false);
  const [detectSelectAll, setDetectSelectAll] = useState<{ type: 'group' | 'groupedFilter' | 'contact'; timestamp: number } | null>(null);

  // 获取分群人数
  useEffect(() => {
    if (viewType !== 'group' || !groups.length) {
      return;
    }
    Promise.all(
      groups.map(groupItem => {
        const filter = convertGroup2Filter(groupItem, undefined, true);
        return addressBookNewApi.getGroupCountByFilter({ filter });
      })
    ).then(list => {
      const groupIds = groups.map(item => {
        return item.id;
      });
      setGroupCountMap(new Map(lodashZip(groupIds, list) as [number, number][]));
    });
  }, [viewType, groups.length]);

  const detectCheckAllStatus = (viewType: 'group' | 'groupedFilter' | 'contact', flag: boolean) => {
    if (!flag) {
      setAllChecked(false);
      return;
    }
    let checked = false;
    switch (viewType) {
      case 'group':
        checked = checkedGroupSet.size === groups.length;
        break;
      case 'groupedFilter':
        checked =
          checkedGroupFilterList.get(curGroupId)?.size ===
          groupFilterList.filter(item => {
            return (groupedFilterCountMap.get(curGroupId)?.get(item.group_id) || 0) > 0;
          }).length;
        break;
      case 'contact':
        let checkedCount = 0;
        let totalCount = 0;
        curViewContacts.forEach(item => {
          if (!item.email || !item.email.length) {
            return;
          }
          totalCount += 1;
          checkedCount += checkedContactSet.has(item.email) ? 1 : 0;

          return checkedContactSet.has(item.email);
        });
        checked = checkedCount >= totalCount;
        break;
    }
    setAllChecked(checked);
  };

  useEffect(() => {
    let flag = false;
    switch (viewType) {
      case 'group':
        flag = checkedGroupSet.size === groups.length;
        break;
      case 'groupedFilter':
        flag = checkedGroupFilterList.get(curGroupId)?.size === groupFilterList.length;
        break;
      case 'contact':
        flag =
          curViewContacts.filter(item => {
            return checkedContactSet.has(item.email);
          }).length === curViewContacts.length;
        break;
    }
    setAllChecked(flag);
  }, [viewType, groups.length, curViewContacts.length]);

  useEffect(() => {
    let enable = true;
    switch (viewType) {
      case 'group':
        enable = checkedGroupSet.size !== 0;
        break;
      case 'groupedFilter':
        enable = checkedGroupFilterList.get(curGroupId)?.size !== 0;
        break;
      case 'contact':
        enable = curViewContacts.some(item => {
          return checkedContactSet.has(item.email);
        });
        break;
    }
    setDisableBtn(!enable);
  }, [viewType, checkedGroupSet.size, checkedGroupFilterList.get(curGroupId)?.size, curViewContacts.length, checkedContactSet.size]);

  // 获取分组信息
  useEffect(() => {
    addressBookNewApi.getAllContactGroupList(false).then(list => {
      setGroups(list);
    });
  }, []);

  // 离开通讯录页面 清空通讯录列表数据
  useEffect(() => {
    if (viewType !== 'contact') {
      setCurViewContacts([]);
    }
  }, [viewType]);

  useEffect(() => {
    if (viewType !== 'groupedFilter') {
      return;
    }

    const groupFilterIds = originGroupFilterList.map(item => {
      return item.group_id;
    });
    const group = groups.find(item => {
      return item.id === curGroupId;
    });
    Promise.all(
      groupFilterList.map(item => {
        const filter = convertGroup2Filter(group, item.group_filter_settings.grouped_filter, true);
        return addressBookNewApi.getGroupCountByFilter({
          filter,
        });
      })
    ).then(countList => {
      setGroupedFilterCountMap(oldMap => {
        const newMap = new Map(oldMap);
        const countMap = new Map(lodashZip(groupFilterIds, countList) as [number, number][]);
        newMap.set(curGroupId, countMap);
        return newMap;
      });
    });
  }, [viewType, curGroupId]);

  // 初始化进来就获取分群设置
  useEffect(() => {
    // 添加灰度服务开关
    const flag = productAuthApi.getABSwitchSync('address_transfer2_crm_done');
    addressBookNewApi.getQuickMarktingList().then(list => {
      setOriginGroupFilterList(
        list.filter(item => {
          if (item.group_id === 1) {
            return true;
          }

          if (!flag) {
            return false;
          }

          return item.type === 'INITITAL';
        })
      );
    });
  }, []);

  const setGroupView = () => {
    setBreadCrumbs([
      {
        name: getIn18Text('YINGXIAOLIANXIREN'),
        key: 'address',
        highlight: true,
      },
      {
        name: getIn18Text('FENZU'),
        key: 'group',
        highlight: true,
        onClick: setGroupView,
      },
    ]);
    setViewType('group');
  };

  const setGroupedFilterView = (_groupId?: number) => {
    const groupId = _groupId || curGroupId;
    setBreadCrumbs([
      {
        name: getIn18Text('YINGXIAOLIANXIREN'),
        key: 'address',
        highlight: true,
      },
      {
        name: getIn18Text('FENZU'),
        key: 'group',
        highlight: true,
        onClick: setGroupView,
      },
      {
        name:
          groups.find(item => {
            return item.id === groupId;
          })?.group_name || getIn18Text('BIANLIANGCESHI'),
        key: 'groupedFilter',
      },
    ]);
    setViewType('groupedFilter');
  };
  const setContactView = (ruleName: string) => {
    setBreadCrumbs([
      {
        name: getIn18Text('YINGXIAOLIANXIREN'),
        key: 'address',
        highlight: true,
      },
      {
        name: getIn18Text('FENZU'),
        key: 'group',
        highlight: true,
        onClick: setGroupView,
      },
      {
        name:
          groups.find(item => {
            return item.id === curGroupId;
          })?.group_name || getIn18Text('BIANLIANGCESHI'),
        key: 'groupedFilter',
        highlight: true,
        onClick() {
          setGroupedFilterView(curGroupId);
        },
      },
      {
        name: ruleName,
        key: ruleName,
      },
    ]);
    setViewType('contact');
  };
  const [breadCrumbs, setBreadCrumbs] = useState<BreadcrumbProps['list']>([
    {
      name: getIn18Text('YINGXIAOLIANXIREN'),
      key: 'address',
      highlight: true,
    },
    {
      name: getIn18Text('FENZU'),
      key: 'group',
      onClick: setGroupView,
    },
  ]);

  useEffect(() => {
    if (!pickedContacts || !pickedContacts.length) {
      return;
    }
    setCheckedContacSet(oldSet => {
      const newSet = new Set(oldSet);
      pickedContacts.forEach(item => {
        newSet.add(item.contactEmail);
      });
      return newSet;
    });
  }, [pickedContacts?.length]);

  useEffect(() => {
    if (!detectSelectAll || !detectSelectAll.timestamp) {
      return;
    }
    detectCheckAllStatus(detectSelectAll.type, true);
  }, [detectSelectAll?.timestamp]);

  // 查询当前分组对应的联系人
  const groupItemChange = async (groupId: number, checked: boolean) => {
    setCheckedGroupSet(_list => {
      const checkedGroupMap = new Set(_list);
      if (checked) {
        checkedGroupMap.add(groupId);
      } else {
        checkedGroupMap.delete(groupId);
      }
      return checkedGroupMap;
    });
    if (!checked) {
      setAllChecked(false);
    } else {
      setDetectSelectAll({
        type: 'group',
        timestamp: Date.now(),
      });
    }
  };

  // 选中当前规则分组
  const groupedFilterItemChange = async (groupId: number, params: { ruleId: number; ruleName: string }, checked: boolean) => {
    const { ruleId, ruleName } = params;
    setCheckedGroupFilterList(oldMap => {
      const newMap = new Map(oldMap);
      if (!newMap.has(curGroupId)) {
        newMap.set(groupId, new Set());
      }
      newMap.get(groupId)![checked ? 'add' : 'delete'](ruleId);
      return newMap;
    });

    if (!checked) {
      setAllChecked(false);
    } else {
      setDetectSelectAll({
        type: 'groupedFilter',
        timestamp: Date.now(),
      });
    }
    // setContactView(ruleName);
  };

  // 点击分组 切换到营销分组界面
  const groupItemClick = async (groupId: number, checked?: boolean) => {
    // 设置分群列表
    setGroupFilterList(
      originGroupFilterList.map(item => {
        return {
          ...item,
          groupId: groupId,
          checked,
        };
      })
    );
    setCurGroupId(groupId);
    setGroupedFilterView(groupId);

    // 设置分组规则是否被选中
    if (checked) {
      setCheckedGroupFilterList(oldMap => {
        const newMap = new Map(oldMap);
        newMap.set(
          groupId,
          new Set(
            originGroupFilterList.map(item => {
              return item.group_id;
            })
          )
        );
        return newMap;
      });
    }
  };

  const toggleContactCheck = (email: string) => {
    const container = checkedContactSet.has(email);
    setCheckedContacSet(oldSet => {
      const checkedMap = new Set(oldSet);
      if (container) {
        checkedMap.delete(email);
      } else {
        checkedMap.add(email);
      }
      return checkedMap;
    });

    if (container) {
      setAllChecked(false);
    } else {
      setDetectSelectAll({
        type: 'contact',
        timestamp: Date.now(),
      });
    }
  };

  // 如果点击当前分群窗口
  const groupedFilterClick = async (item: QuickMarktingGroup, groupId: number, checked: boolean) => {
    const group = groups.find(item => {
      return item.id === groupId;
    });

    const groupedFilter = convertGroup2Filter(group, item.group_filter_settings.grouped_filter);
    const list = await addressBookNewApi.getMarktingFiltedEmails(
      {
        groupedFilter,
      },
      { timeout: 30000, hideErrorToast: true, errorTitle: '添加联系人过多，请减少后重试' }
    );

    setCurViewContacts(list);
    // 如果当前分组被选中 则当规则下所有的通讯录都是选中状态
    if (checked) {
      setCheckedContacSet(oldSet => {
        const checkedMap = new Set(oldSet);
        list.forEach(item => {
          if (item.email && item.email.length) {
            return checkedMap.add(item.email);
          }
        });
        return checkedMap;
      });
    }
    setContactView(item.group_name);
  };

  const checkAll = (e: CheckboxChangeEvent) => {
    const { checked } = e.target;
    setAllChecked(checked);

    switch (viewType) {
      case 'group':
        setCheckedGroupSet(
          checked
            ? new Set(
                groups.map(item => {
                  return item.id;
                })
              )
            : new Set()
        );
        break;
      case 'groupedFilter':
        const list = new Set(
          groupFilterList
            .filter(item => {
              return groupedFilterCountMap.get(curGroupId)?.get(item.group_id) || 0;
            })
            .map(item => {
              return item.group_id;
            })
        );
        setCheckedGroupFilterList(oldMap => {
          const newMap = new Map(oldMap);

          if (checked) {
            newMap.set(curGroupId, list);
          } else if (!checked) {
            newMap.set(curGroupId, new Set());
          }
          return newMap;
        });
        break;
      case 'contact':
        setCheckedContacSet(oldContactSet => {
          const newContactSet = new Set(oldContactSet);
          curViewContacts.forEach(({ email }) => {
            return newContactSet[checked ? 'add' : 'delete'](email);
          });
          return newContactSet;
        });
        break;
    }
  };
  const addContacts = () => {
    switch (viewType) {
      case 'group':
        addFromGroup();
        break;
      case 'groupedFilter':
        addFromGroupedFilter();
        break;
      case 'contact':
        addFromContacts();
        break;
    }
  };

  // 从联系人种添加分组
  const addFromGroup = async () => {
    const groupIds: number[] = [];
    checkedGroupSet.forEach(item => {
      groupIds.push(item);
    });

    if (groupIds.length === 0) {
      return;
    }
    const taskId = sentryReportApi.startTransaction({ name: 'marketing_addressbookpicker_add', op: 'click' });
    let realCount = 0;
    setLoading(true);
    try {
      const resultList = await Promise.all(
        groupIds.map(groupId => {
          const group = groups.find(item => {
            return item.id === groupId;
          });
          const groupedFilter = convertGroup2Filter(group);
          return addressBookNewApi.getMarktingFiltedEmails(
            {
              groupedFilter,
            },
            { timeout: 30000, hideErrorToast: true, errorTitle: '添加联系人过多，请减少后重试' }
          );
        })
      );

      const formatted = resultList.flat();
      pumpContact(formatted);
      realCount = formatted.length;
    } catch (ex) {
    } finally {
      setLoading(false);
    }
    sentryReportApi.endTransaction({
      id: taskId,
      data: {
        type: 'from_group',
        count: groupIds.length,
        realcount: realCount,
      },
    });
  };

  const addFromGroupedFilter = async () => {
    if (!checkedGroupFilterList.get(curGroupId)?.size) {
      return;
    }

    const taskId = sentryReportApi.startTransaction({ name: 'marketing_addressbookpicker_add', op: 'click' });

    const checkedRuleIds = checkedGroupFilterList.get(curGroupId);
    const curGroup = groups.find(item => item.id === curGroupId);
    const resultList = await Promise.all(
      groupFilterList
        .filter(item => {
          return checkedRuleIds?.has(item.group_id);
        })
        .map(item => {
          const groupedFilter = convertGroup2Filter(curGroup, item.group_filter_settings.grouped_filter);
          return addressBookNewApi.getMarktingFiltedEmails(
            {
              groupedFilter,
            },
            { timeout: 30000, hideErrorToast: true, errorTitle: '添加联系人过多，请减少后重试' }
          );
        })
    );

    const formatted = resultList.flat();
    pumpContact(formatted);
    sentryReportApi.endTransaction({
      id: taskId,
      data: {
        type: 'from_groupfilter',
        count: groupFilterList.length,
        realcount: formatted.length,
      },
    });
  };

  const addFromContacts = () => {
    const checkedContact: BusinessContactVO[] = [];
    const taskId = sentryReportApi.startTransaction({ name: 'marketing_addressbookpicker_add', op: 'click' });

    curViewContacts.map(item => {
      if (checkedContactSet.has(item.email)) {
        checkedContact.push(item);
      }
    });

    if (!checkedContact || !checkedContact.length) {
      return;
    }
    pumpContact(checkedContact);
    sentryReportApi.endTransaction({
      id: taskId,
      data: {
        type: 'from_contact',
        realcount: checkedContact.length,
        count: checkedContact.length,
      },
    });
  };

  const pumpContact = (data: BusinessContactVO[]) => {
    onPickedChange(
      data.map(el => ({
        ...el,
        contactEmail: el.email,
        contactName: el.contact_name,
        companyName: el.leads_company_name,
        continent: el.continent,
        country: el.country,
        city: el.city,
        province: el.province,
        // 需要确认
        // sourceName: AddressBookContactSourceType[el.source_name],
      }))
    );
  };

  // css 设置max-height为526px
  const actualHeight = Math.min(526, height);
  return (
    <div className={classnames(styles.address, className)} style={style}>
      <div className={styles.addressBread}>
        <BreadCrumb list={breadCrumbs} />
      </div>
      {viewType === 'group' ? (
        <div style={{ height: actualHeight - 108, overflow: 'auto' }} className={styles.addressGroup}>
          {groups.map(each => {
            const { id } = each;
            const checked = checkedGroupSet.has(id) || false;
            const count = groupCountMap.get(id) || 0;
            return (
              <div className={styles.addressGroupEach} key={id}>
                <LabelItem
                  checked={checked}
                  checkable={true}
                  name={each.group_name}
                  count={count}
                  disabled={false}
                  onCheckedChange={e => groupItemChange(id, e.target.checked)}
                  onClick={() => groupItemClick(id, checked)}
                />
              </div>
            );
          })}
        </div>
      ) : null}

      {/* 如果当前分群窗口 */}
      {viewType === 'groupedFilter' ? (
        <div style={{ height: actualHeight - 108, overflow: 'auto' }} className={styles.addressGroup}>
          {originGroupFilterList.map(each => {
            const { group_id: ruleId, group_name: ruleName } = each;
            const groupId = curGroupId;
            const count = groupedFilterCountMap.get(groupId)?.get(ruleId) || 0;
            const checked = !!checkedGroupFilterList.get(groupId)?.has(ruleId);
            return (
              <div className={styles.addressGroupEach} key={each.group_id}>
                <LabelItem
                  checked={checked}
                  checkable={true}
                  name={ruleName}
                  count={count}
                  disabled={!count}
                  onCheckedChange={e =>
                    groupedFilterItemChange(
                      groupId,
                      {
                        ruleId: each.group_id,
                        ruleName: each.group_name,
                      },
                      e.target.checked
                    )
                  }
                  onClick={() => groupedFilterClick(each, groupId, checked)}
                />
              </div>
            );
          })}
        </div>
      ) : null}

      {viewType === 'contact' ? (
        <div className={styles.addressContact} style={{ height: actualHeight - 108, overflow: 'auto' }}>
          {curViewContacts && curViewContacts.length > 1000 ? (
            <AutoSizer disableHeight>
              {({ width }) => (
                <List
                  width={width}
                  height={actualHeight - 108}
                  rowCount={curViewContacts.length}
                  rowHeight={48}
                  rowRenderer={({ index, isScrolling, key, style }) => {
                    const contact = curViewContacts[index];
                    const { email } = contact;
                    if (isScrolling) {
                      return (
                        <div key={contact.contact_id} style={style}>
                          {getIn18Text('GUNDONGZHONG...')}
                        </div>
                      );
                    }

                    return (
                      <div key={contact.contact_id} className={styles.addressContactEach} style={style}>
                        <ContactItem
                          name={contact.contact_name}
                          email={email}
                          checkable={true}
                          checked={checkedContactSet.has(email)}
                          disabled={!email || !email.length}
                          onClick={() => {
                            toggleContactCheck(email);
                          }}
                        />
                      </div>
                    );
                  }}
                />
              )}
            </AutoSizer>
          ) : (
            curViewContacts.map((item, index) => {
              const { email, contact_id: id, contact_name: name } = item;
              return (
                <div className={styles.addressContactEach} key={id}>
                  <ContactItem
                    name={name}
                    email={email}
                    checkable={true}
                    checked={checkedContactSet.has(email)}
                    disabled={!email || !email.length}
                    onClick={() => {
                      toggleContactCheck(email);
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
      ) : null}
      <div className={styles.addressFooter}>
        <Checkbox onChange={checkAll} checked={allChecked} indeterminate={allChecked}>
          {getIn18Text('QUANXUAN')}
        </Checkbox>
        <Button className={styles.addressFooterBtn} onClick={addContacts} loading={loading} type="primary" disabled={disableBtn || disabledBtn}>
          {getIn18Text('TIANJIA')}
        </Button>
      </div>
    </div>
  );
}
