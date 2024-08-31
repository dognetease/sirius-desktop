import React, { useCallback, useEffect, useImperativeHandle, useRef, useState, useMemo } from 'react';
import { useUpdateEffect } from 'ahooks';
import { Divider, Dropdown, Menu, DropDownProps } from 'antd';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import debounce from 'lodash/debounce';
import { useAppSelector } from '@web-common/state/createStore';
import SiriusCheckbox from '@web-common/components/UI/SiriusContact/Checkbox/index';
import classnames from 'classnames';
import { AccountApi, api, apiHolder, apis, ContactAndOrgApi, PerformanceApi, LoggerApi } from 'api';
import { SearchGroupKey, StaticNodeKey, StaticRootNodeKey, ContactItem } from '@web-common/utils/contact_util';
import styles from '../../contact.module.scss';
import { getContact, getSearchContactAddressBook } from '../../_mock_';

import Tree from '@web-common/components/UI/SiriusContact/ContactModuleTree';
import { ContactOrgItem, ContactTreeDataNode, ContactTreeNode } from '@web-common/components/util/contact';
// import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { ContactTreeDecorateProp } from '@web-common/components/UI/SiriusContact/tree/data';
import { SearchResModel } from 'data';
import { transContactModel2ContactItem } from '@web-common/components/util/contact';
import SiriusCollapse from '@web-mail/components/SiriusCollapse';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import ContactTrackerIns from '../../tracker';
import { getIn18Text } from 'api';
import { personalOrgToYingxiao } from '../../util';

const storeApi = api.getDataStoreApi();
const performanceApi = apiHolder.api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
const dataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as LoggerApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const systemApi = api.getSystemApi();

const personalAllNode: ContactTreeNode = {
  key: StaticNodeKey.PERSON_ALL,
  title: getIn18Text('SUOYOULIANXIREN'),
  nodeType: 'personal',
  isLeaf: false,
  isOrg: true,
};

type SearchGroupItem = {
  key: SearchGroupKey;
  name: string;
  count?: number;
};

const SEARCH_GROUP_ALL: SearchGroupItem = {
  key: SearchGroupKey.ALL,
  name: getIn18Text('QUANBULIANXIREN'),
};
const SEARCH_GROUP_PERSON: SearchGroupItem = {
  key: SearchGroupKey.PERSON,
  name: getIn18Text('GERENTONGXUNLU'),
};
const SEARCH_GROUP_CORP: SearchGroupItem = {
  key: SearchGroupKey.CORP,
  name: getIn18Text('QIYETONGXUNLU'),
};

const searchGroup = [SEARCH_GROUP_ALL, SEARCH_GROUP_CORP, SEARCH_GROUP_PERSON];
const corpSearchGroup = [SEARCH_GROUP_ALL, SEARCH_GROUP_PERSON];
const personalOrgTipKey = 'personalOrgTip';

export interface ContactTreeRefProps {
  onSelectNode(node: ContactTreeDataNode, account: string, contactList?: ContactItem[]): void;
  debounceSearch(val: string): void;
}

interface ContactTreeProps {
  refreshAccountsCount?: number;
  // 搜索内容
  searchValue?: string;

  defaultSelectedDataNode?: ContactTreeNode;

  ref?: React.Ref<ContactTreeRefProps>;

  handleVisibleImportModal: (_account: string) => void;

  handleVisibleExportModal: (_account: string) => void;

  handleCreate: (_account: string) => void;

  handleCreateMark: (_account: string) => void;

  handleCreatePersonalOrg: (_account?: string) => void;

  handleEditPersonalOrg: (nodeKey: string, _account: string) => void;

  handleSelectedDataNode: (selectedNode: ContactTreeNode, _account: string) => void;

  handleContactListChange: (contactList: ContactOrgItem[], account?: string) => void;

  handleDataLoading: (isLoading: boolean) => void;
}

const ModalCheckContent = React.forwardRef(({ children }: any, ref) => {
  const [checked, setChecked] = useState<boolean>(false);
  useImperativeHandle(ref, () => ({
    checked,
  }));
  return (
    <div className={styles.modalCheckContentWrap} onClick={() => setChecked(b => !b)}>
      <SiriusCheckbox checked={checked} styles={{ width: '16px', height: '16px', display: 'inline-block' }} />
      {children}
    </div>
  );
});

const ContactTree = React.forwardRef((props: ContactTreeProps, ref) => {
  const {
    refreshAccountsCount: refreshId,
    searchValue,
    handleCreate,
    handleCreatePersonalOrg,
    handleEditPersonalOrg,
    handleSelectedDataNode,
    handleContactListChange,
    handleDataLoading,
    handleCreateMark,
    defaultSelectedDataNode,
    handleVisibleImportModal,
    handleVisibleExportModal,
  } = props;
  const [currentAccount, setCurrentAccount] = useState<string>(systemApi.getCurrentUser()?.id || '');
  // 是否是corp邮箱
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  // 是否展示分组标识
  const [personalOrgCloseTip, setPersonalOrgCloseTip] = useState<boolean>(storeApi.getSync(personalOrgTipKey).data === 'true');
  // 选中的搜索分组的key
  const [searchGroupKey, setSearchGroupKey] = useState<string>();
  // 组织树选中的node
  const [selectedDataNode, setSelectedDataNode] = useState<ContactTreeNode>(defaultSelectedDataNode || personalAllNode);
  const [rightClickNode, setRightClickNode] = useState<ContactTreeNode | null>(null);
  // 删除分组的选中框确认
  const checkContentRef = useRef<{ checked: boolean }>(null);

  // 数据加载loading
  const [listLoading, setLoading] = useState<boolean>(true);

  // 搜索列表集合
  const [searchContactMap, setSearchContactMap] = useState<SearchResModel>();

  useEffect(() => {
    if (defaultSelectedDataNode && defaultSelectedDataNode.key !== selectedDataNode.key) {
      setSelectedDataNode(defaultSelectedDataNode);
    }
  }, [defaultSelectedDataNode]);

  useEffect(() => {
    if (defaultSelectedDataNode && defaultSelectedDataNode.key !== personalAllNode.key) {
      getPersonalInitData();
    }
  }, []);

  // 搜索关键字发生变化
  useUpdateEffect(() => {
    if (searchValue) {
      setListLoading(!0);
      debounceSearch(searchValue);
    } else {
      setSearchContactMap(undefined);
      setSearchGroupKey(undefined);
      refreshCurrentSelectedList();
    }
  }, [searchValue]);

  const shouldShowSearchCount = !isCorpMail;
  const displaySearchGroup = isCorpMail ? corpSearchGroup : searchGroup;

  const refreshCurrentSelectedList = useCallback(() => {
    refreshSelectedList({ _account: currentAccount, orgId: selectedDataNode.key });
  }, [currentAccount, selectedDataNode]);

  const getPersonalInitData = useCallback(async (_account?: string) => {
    const list = await contactApi.doGetPersonalContact({ _account });
    handleContactListChange(list.map(transContactModel2ContactItem));
  }, []);

  const onInited = useCreateCallbackForEvent(async (_account: string) => {
    performanceApi.timeEnd({ statKey: 'contact_load_time' });
    if (_account === systemApi.getCurrentUser()?.id) {
      if (defaultSelectedDataNode) {
        onSelectNode && onSelectNode(defaultSelectedDataNode, _account);
      }
    }
  });

  /**
   * 搜索联系人
   * @param query
   */
  const doSearchContact = useCallback(async (query: string) => {
    performanceApi.time({ statKey: 'contact_search_time' });
    setListLoading(true);
    const res = await getSearchContactAddressBook(query);
    setListLoading(false);
    if (res) {
      setSearchContactMap(res);
      const currentAccount = systemApi.getCurrentUser()?.id || '';
      const mainAccountData = res[currentAccount];
      if (mainAccountData) {
        handleContactListChange(mainAccountData[SearchGroupKey.ALL]);
        setSearchGroupKey(currentAccount + '_' + SearchGroupKey.ALL);
      } else {
        handleContactListChange([]);
        setSearchGroupKey(undefined);
      }
    }
    performanceApi.timeEnd({ statKey: 'contact_search_time' });
  }, []);

  // 搜索debounce
  const debounceSearch = useCallback(
    debounce(
      val => {
        doSearchContact(val);
      },
      700,
      { leading: false, trailing: true }
    ),
    []
  );

  // 设置数据加载中loading，并通知上层
  const setListLoading = useCallback((bool: boolean) => {
    setLoading(bool);
    handleDataLoading(bool);
  }, []);

  // 刷新当前选中节点对应的值
  const refreshSelectedList = useCallback(async (params?: { _account?: string; orgId: string; type?: number }) => {
    const startTime = Date.now();
    const { _account, orgId } = params || {};
    setListLoading(true);
    let list: ContactOrgItem[] = [];
    if (orgId === StaticNodeKey.PERSON_MARK_LIST) {
      list = await contactApi.doGetContactPersonalMarkList();
    } else {
      list = await getContact({ orgId, _account });
    }

    // 如果是公共联系人 直接翻转一下排序
    if (params?.type === 1) {
      list = list.reverse();
    }

    handleContactListChange(list);
    setListLoading(false);

    const endTime = Date.now();
    if (endTime - startTime > 2000) {
      dataTrackerApi.track('pc_getcontactbyorg_performance', {
        _account: params?._account,
        duration: endTime - startTime,
        count: list.length,
        type: params?.type || 0,
        orgId: orgId,
      });
    }
  }, []);

  /** 监听通讯录是否有变化，有变化就刷新当前列表 */
  // useMsgRenderCallback('contactAccountNotify', ({ eventData, _account }) => {
  //   setTimeout(() => {
  //     const { syncStatus } = eventData || { syncStatus: {} };
  //     if ((!isCorpMail && syncStatus?.enterprise) || syncStatus?.personal) {
  //       if(currentAccount === _account) {
  //         refreshSelectedList({_account, orgId: selectedDataNode.key});
  //       }
  //     }
  //   }, 16);
  // });

  // 监听组织发生变化
  // useMsgRenderCallback('contactOrgNotify', ({ eventData, _account }) => {
  //   setTimeout(() => {
  //     const { syncStatus } = eventData || { syncStatus: {} };
  //     if (syncStatus?.personalOrg || syncStatus?.org) {
  //       if(currentAccount === _account) {
  //         refreshSelectedList({_account, orgId: selectedDataNode.key});
  //       }
  //     }
  //   }, 16);
  // });

  useImperativeHandle(ref, () => ({
    onSelectNode,
    debounceSearch,
  }));

  // 删除分组
  const handleDeletePersonalOrg = (nodeData: ContactTreeNode, _account: string) => {
    const { title: name, key: id } = nodeData;
    SiriusModal.error({
      title: getIn18Text('QUERENSHANCHU\u201C') + name + getIn18Text('\u201DFENZUMA\uFF1F'),
      needCheckContent: true,
      content: <span style={{ marginLeft: '4px' }}>{getIn18Text('TONGSHIJIANGGAIZU')}</span>,
      onOk: async (isChecked: boolean) => {
        // const deletePersonContact = checkContentRef.current?.checked;
        // accountApi.setCurrentAccount({ email: _account });
        const { success, message } = await contactApi.doDeletePersonalOrg({
          orgIdList: [id],
          deletePersonContact: isChecked,
          _account,
        });
        if (success) {
          Message.success(getIn18Text('SHANCHUCHENGGONG'));
          onSelectNode(personalAllNode, _account);
        } else {
          Message.error(message || getIn18Text('SHANCHUSHIBAI'));
        }
      },
      okType: 'danger',
      okText: getIn18Text('SHANCHU'),
    });
  };

  // 渲染title 后面的部分
  const renderTitleSuffix = useCallback(
    (nodeData: ContactTreeDataNode, _account: string) => {
      const { key: nodeKey, nodeType } = nodeData;
      const isPersonalRoot = nodeKey === StaticRootNodeKey.PERSON;
      const isPersonalAllKey = nodeKey === StaticNodeKey.PERSON_ALL;
      const isNoGroup = nodeKey === StaticNodeKey.PERSON_NO_GROUP;
      const isPersonalMark = nodeKey === StaticNodeKey.PERSON_MARK_LIST;
      const isPersonalOrg = nodeType === 'personal';
      let renderIcon: React.ReactElement = <></>;
      const mainAccount = systemApi.getCurrentUser()?.id;
      const visibleMenu = rightClickNode !== null && nodeKey === rightClickNode.key;
      if (isPersonalRoot) {
        // 个人通讯录根节点的icon下拉展示
        renderIcon = (
          <div className={styles.titleIcon} data-test-id="tree_personalRoot_addIcon" onClick={e => e.stopPropagation()}>
            <Dropdown
              overlayClassName={styles.titleIconDropMenu}
              placement="bottomRight"
              overlay={() => (
                <Menu>
                  <Menu.Item
                    attribute={{ 'data-test-id': 'tree_personalRoot_addIcon_personalContact' }}
                    key="1"
                    onClick={({ domEvent }) => {
                      domEvent.stopPropagation();
                      handleCreate(_account);
                    }}
                  >
                    {getIn18Text('XINJIANLIANXIREN')}
                  </Menu.Item>
                  <Menu.Item
                    attribute={{ 'data-test-id': 'tree_personalRoot_addIcon_personalOrg' }}
                    key="2"
                    onClick={({ domEvent }) => {
                      domEvent.stopPropagation();
                      handleCreatePersonalOrg(_account);
                    }}
                  >
                    {getIn18Text('XINJIANGERENFEN')}
                  </Menu.Item>
                  <Menu.Item
                    attribute={{ 'data-test-id': 'tree_personalRoot_addIcon_personalMark' }}
                    key="3"
                    onClick={({ domEvent }) => {
                      domEvent.stopPropagation();
                      handleCreateMark(_account);
                    }}
                  >
                    {getIn18Text('addMarkContactAndOrg')}
                  </Menu.Item>
                  {mainAccount === _account && (
                    <>
                      <Menu.Divider />
                      <Menu.Item
                        key="4"
                        onClick={({ domEvent }) => {
                          domEvent.stopPropagation();
                          handleVisibleExportModal(_account);
                        }}
                      >
                        {/* {getIn18Text('addMarkContactAndOrg')} */}
                        {'导出联系人'}
                      </Menu.Item>
                      <Menu.Item
                        key="5"
                        onClick={({ domEvent }) => {
                          domEvent.stopPropagation();
                          handleVisibleImportModal(_account);
                        }}
                      >
                        {'导入联系人'}
                        {/* {getIn18Text('addMarkContactAndOrg')} */}
                      </Menu.Item>
                    </>
                  )}
                </Menu>
              )}
              trigger={['hover']}
            >
              <span className={styles.addIcon} />
            </Dropdown>
          </div>
        );
      } else if (isPersonalOrg && !isNoGroup && !isPersonalAllKey && !isPersonalMark) {
        // 个人分组的icon下拉展示
        renderIcon = (
          <div className={styles.titleIcon} data-test-id="tree_personalOrg_addIcon" onClick={e => e.stopPropagation()}>
            <Dropdown
              overlayClassName={styles.titleIconDropMenu}
              placement="bottomRight"
              overlay={
                <Menu>
                  {process.env.BUILD_ISEDM ? (
                    <>
                      <Menu.Item
                        attribute={{ 'data-test-id': 'tree_personalOrg_btn_yingxiao' }}
                        key="003"
                        onClick={({ domEvent }) => {
                          domEvent.stopPropagation();
                          contactApi.doGetContactByOrgId({ orgId: nodeKey, _account }).then(res => {
                            if (res?.length) {
                              personalOrgToYingxiao(res.map(transContactModel2ContactItem));
                            }
                          });
                        }}
                      >
                        {' '}
                        {getIn18Text('YIJIANYINGXIAO')}
                      </Menu.Item>
                      <Menu.Divider style={{ margin: '4px 12px' }} />
                    </>
                  ) : null}
                  <Menu.Item
                    attribute={{ 'data-test-id': 'tree_personalOrg_btn_edit' }}
                    key="3"
                    onClick={({ domEvent }) => {
                      domEvent.stopPropagation();
                      handleEditPersonalOrg(nodeKey, _account);
                    }}
                  >
                    {getIn18Text('BIANJIZU')}
                  </Menu.Item>
                  <Menu.Item
                    attribute={{ 'data-test-id': 'tree_personalOrg_btn_del' }}
                    key="4"
                    onClick={({ domEvent }) => {
                      domEvent.stopPropagation();
                      handleDeletePersonalOrg(nodeData as ContactTreeNode, _account);
                    }}
                  >
                    {getIn18Text('SHANCHUZU')}
                  </Menu.Item>
                </Menu>
              }
              visible={visibleMenu}
              trigger={['hover', 'click']}
              onVisibleChange={open => {
                setRightClickNode(open ? (nodeData as ContactTreeNode) : null);
              }}
            >
              <span className={styles.moreIcon} />
            </Dropdown>
          </div>
        );
      }
      return renderIcon;
    },
    [rightClickNode]
  );

  // 分割线
  const renderDivider = useMemo(() => {
    return (
      <div className={styles.dividerContainer}>
        <Divider />
      </div>
    );
  }, []);

  // 树点击回调
  const onSelectNode = useCallback((nodeData: ContactTreeNode, _account: string) => {
    setSelectedDataNode(nodeData);
    refreshSelectedList({ _account, orgId: nodeData.key, type: nodeData.data?.type });
    handleSelectedDataNode(nodeData, _account);
    setCurrentAccount(_account);
  }, []);

  // 星标节点点击回调
  const onMarked = useCallback(
    (marked: boolean) => {
      ContactTrackerIns.tracker_contact_personal_mark_startIcon_click('通讯录-联系组标星', marked);
      if (selectedDataNode.key === StaticNodeKey.PERSON_MARK_LIST) {
        refreshSelectedList({ orgId: StaticNodeKey.PERSON_MARK_LIST });
      }
    },
    [selectedDataNode]
  );

  //提示创建个人分组
  const contactTreeDecorateMap = useMemo(() => {
    const map: ContactTreeDecorateProp = new Map();
    const personalOrgTip = (
      <div className={styles.personalTipWrap}>
        <div
          className={styles.close}
          onClick={() => {
            setPersonalOrgCloseTip(true);
            storeApi.putSync(personalOrgTipKey, 'true');
          }}
        />
        <div className={styles.tips}>{getIn18Text('JIANGLIANXIRENFEN11')}</div>
        <div className={styles.createPersonalOrg} onClick={() => handleCreatePersonalOrg()}>
          {getIn18Text('XINJIANGERENFEN')}
        </div>
      </div>
    );
    map.set(
      StaticRootNodeKey.ENTERPRISE,
      new Map([
        [
          'enterpriseRenderDivider',
          {
            element: renderDivider,
            height: 17,
            distance: -1,
            show: true,
          },
        ],
      ])
    );
    map.set(
      StaticNodeKey.PERSON_MARK_LIST,
      new Map([
        [
          'personalTip',
          {
            element: personalOrgTip,
            height: 112,
            distance: -1,
            show: !personalOrgCloseTip,
          },
        ],
        [
          'personalMarkListRenderDivider',
          {
            element: <div style={{ marginLeft: 23 }}>{renderDivider}</div>,
            height: 17,
            distance: -1,
            show: true,
          },
        ],
      ])
    );
    return map;
  }, [personalOrgCloseTip]);

  // 联系人树容器
  const TreeContent = (
    <div className={styles.treeWrapper} hidden={!!searchValue}>
      <div
        className={classnames([styles.treeContainer], {
          [styles.singleTree]: false,
        })}
      >
        <Tree
          selectedKeys={[selectedDataNode.key]}
          refreshId={refreshId}
          renderTitleSuffix={renderTitleSuffix}
          contactTreeDecorateMap={contactTreeDecorateMap}
          onSelectNode={onSelectNode}
          onContextMenu={nodeData => {
            setRightClickNode(nodeData);
          }}
          onMarked={onMarked}
          // selectDefaultNodeOnInited
          onInited={onInited}
          showPersonalMark
        />
      </div>
    </div>
  );

  // 搜索loading内容
  const SearchLoadingContent = useMemo(() => {
    let res = <></>;
    let noData = true;
    if (searchContactMap) {
      noData = !Object.values(searchContactMap).some(item => {
        if (item) {
          return Object.values(item).some(arr => arr.length > 0);
        } else {
          return false;
        }
      });
    }
    if (listLoading) {
      res = <p>{getIn18Text('SOUSUOZHONG\uFF0CQING')}</p>;
    } else if (noData) {
      res = <p>{getIn18Text('ZANWUJIEGUO')}</p>;
    }
    return res;
  }, [listLoading, searchContactMap]);

  // 搜素列表内容
  const SearchListContent = useMemo(() => {
    let res = <></>;
    if (!searchContactMap) {
      return res;
    }
    const accounts = Object.keys(searchContactMap);
    if (!accounts.length) {
      return res;
    }
    res = (
      <>
        <SiriusCollapse
          dataList={accounts.map(account => {
            const accountSearchData = searchContactMap[account];
            const hasData = accountSearchData[SearchGroupKey.ALL].length > 0;
            let children: React.ReactElement = <></>;
            if (hasData) {
              children = (
                <div className={styles.accountWrap} data-test-id="contact_search_result_account_item">
                  {displaySearchGroup.map(item => {
                    const currentContactList = accountSearchData[item.key];
                    const searchResultCount = accountSearchData[item.key]?.length;
                    if (!searchResultCount) {
                      return <></>;
                    }
                    const currentKey = account + '_' + item.key;
                    const getDataTestId = (key: SearchGroupKey) => {
                      const keyResult = {
                        [SearchGroupKey.ALL]: 'all',
                        [SearchGroupKey.CORP]: 'enterprise',
                        [SearchGroupKey.PERSON]: 'peronal',
                        [SearchGroupKey.TEAM]: 'team',
                      };
                      return 'contact_search_result_' + keyResult[key];
                    };
                    return (
                      <div
                        data-test-id={getDataTestId(item.key)}
                        onClick={() => {
                          setSearchGroupKey(currentKey);
                          handleContactListChange(currentContactList, account);
                        }}
                        className={classnames([styles.searchTabBtn], {
                          [styles.searchTabBtnFocus]: currentKey === searchGroupKey,
                        })}
                        key={currentKey}
                      >
                        {item.name}
                        {shouldShowSearchCount ? <span data-test-id="contact_search_result_count">（{searchResultCount}）</span> : <></>}
                      </div>
                    );
                  })}
                </div>
              );
            }
            return {
              key: account + '_search',
              title: account,
              type: 'NeteaseQiYeMail',
              count: '',
              children,
            };
          })}
        />
      </>
    );
    return res;
  }, [searchContactMap, searchGroupKey, shouldShowSearchCount]);

  // 搜索内容
  const SearchContent = (
    <div className={styles.searchTabContainer} hidden={!searchValue}>
      {SearchLoadingContent}
      {SearchListContent}
    </div>
  );

  return (
    <>
      {SearchContent}
      {TreeContent}
    </>
  );
});

export default ContactTree;
