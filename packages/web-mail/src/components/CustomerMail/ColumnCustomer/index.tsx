import React, { useRef, useState, useEffect, useMemo, CompositionEvent, useImperativeHandle, useContext } from 'react';
import { Input, Tooltip, Button, Spin, Menu, Dropdown, Skeleton } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { apiHolder as api, apis, MailApi, DataTrackerApi, AccountApi, getIn18Text, CustomerBoxModel } from 'api';
import { useActions, useAppDispatch, MailActions, useAppSelector } from '@web-common/state/createStore';
import NetWatcher from '@web-common/components/UI/NetWatcher';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import EditTree, { ExportRefProps } from '@web-mail/components/ColumnMailBox/EditTree';
import { AntTreeNodeProps } from '@web-mail/common/library/Tree';
import { CustomerTreeChildData, CustomerTreeData, loadEdmMailListParam } from '@web-mail/types';
import { AdRef, CustomerAdvancedSearch } from '@web-mail/components/CustomerMail/ColumnCustomer/CustomerAdvancedSearch';
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import { reduxMessage, setCurrentAccount, treeDFS } from '@web-mail/util';
import { MailTabModel, actions as mailTabActions, tabId, tabType } from '@web-common/state/reducer/mailTabReducer';
import classnames from 'classnames/bind';
import './index.scss';
import styles from './index.module.scss';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';
import VListTree from '@web-mail/common/components/VListTree/VListTree';
import MailSubTab from '../../ColumnMailBox/MailSubTab';
import { useState2CustomerSlice, ctSliceContext, useCustomerSliceTreeList } from '@web-mail/hooks/useState2SliceRedux';
import { formatCustomerTreeChild, genEdmMilTabModel } from '@web-mail/utils/slice';
import { CustomerAsideDetail } from '@web-mail/state/slice/customerMailReducer/types';
import { PrivilegeCheckForMailPlus } from '@/components/UI/PrivilegeEnhance';
import { doGetCustomersByIds } from '@web-common/state/reducer/contactReducer';
import { UniDrawerModuleId, showUniDrawer } from '@lxunit/app-l2c-crm';

const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const eventApi = api.api.getEventApi();

const DefaultSelectedMail = { id: '' };

const ColumnMailBox: React.ForwardRefRenderFunction<any> = (_props, ref) => {
  const dispatch = useAppDispatch();
  const reducer = useActions(MailActions);
  const sliceId = useContext(ctSliceContext);
  // uni弹窗
  // const [, setUniCustomerParam] = useState2RM('uniCustomerParam');
  /*
   * 本地状态 Ref
   */
  const inputRef = useRef<Input>(null);
  // 写邮件-按钮-超时计时器
  const btnWriteMailLoadingTimer = useRef<number | null>(null);
  // 处在拼音输入法的输入中
  const isComposition = useRef(false);
  // 客户列表ref
  const customerFolderRef = useRef<ExportRefProps>(null);
  // 高级搜索
  const adSearch = useRef<AdRef | null>(null);

  /*
   * 本地状态 State
   */
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const [inputHover, setInputHover] = useState<boolean>(false);
  const [btnWriteMailLoading, setBtnWriteMailLoading] = useState(false);
  const [adSearchFromValue, setAdSearchFromValue] = useState<any>(undefined);

  /*
   * redux
   */
  // 当前页签
  const currentTabType = useAppSelector(state => state.mailTabReducer.currentTab.type);
  // 当前id
  const currentTabId = useAppSelector(state => state.mailTabReducer.currentTab.id);
  // 分栏通栏
  const [configMailLayout] = useState2RM('configMailLayout', 'doUpdateConfigMailLayout');
  // 未读数map
  const [unReadMap] = useState2RM('unReadMap_cm');

  /*
   * redux - slice
   */
  // 搜索类型
  const [mailSearching, setMailSearching] = useState2CustomerSlice('mailSearching');
  // 搜索状态
  const [, setSearchState] = useState2CustomerSlice('mailSearchStateMap');
  // 搜索关键字
  const [mailSearchKey] = useState2CustomerSlice('mailSearchKey');
  // 搜索列表-文件夹-选中的key
  const [selectedSearchKeys, setSelectedSearchKeys] = useState2CustomerSlice('selectedSearchKeys');
  // 搜索列表-文件夹-选中的联系人Email
  const [, setSelectedSearchContacts] = useState2CustomerSlice('selectedSearchContacts');
  // 搜索列表-文件夹-树形结构-list
  const [searchTreeList, setSearchTreeList] = useState2CustomerSlice('searchTreeList');
  // 搜索列表-文件夹-树形结构-分页大小
  const [searchTreeListPageSize] = useState2CustomerSlice('searchTreeListPageSize');
  // 搜索列表-文件夹-树形结构-分页页码
  const [searchTreeListPageNum] = useState2CustomerSlice('searchTreeListPageNum');
  // 搜索-文件夹树-展开的key
  const [expandedSearchKeys, setExpandedSearchKeys] = useState2CustomerSlice('expandedSearchKeys');
  // 搜索-选中的邮件id
  // const [, setSearchMail] = useState2CustomerSlice( 'activeSearchMailId');
  // 选中的邮件id
  const [, setSelectedMail] = useState2CustomerSlice('selectedMailId');
  // 搜索-高级弹窗
  const [adSearchVisible, setAdSearchVisible] = useState2CustomerSlice('advancedSearchVisible');
  // 客户列表是否处于loading
  const [customerListLoading] = useState2CustomerSlice('customerListLoading');
  // 客户列表是否处于loading
  const [customerSearchListLoading, setCustomerSearchListLoading] = useState2CustomerSlice('customerSearchListLoading');
  // 文件夹-选中的key
  const [selectedKeys, setSelectedKeys] = useState2CustomerSlice('selectedKeys');
  // 文件夹-选中的联系人Email
  const [, setSelectedContacts] = useState2CustomerSlice('selectedContacts');
  // 收信按钮-loading状态
  const [refreshBtnLoading, setRefreshBtnLoading] = useState2CustomerSlice('refreshBtnLoading');
  // 邮件-文件夹树-展开的key
  const [expandedKeys, setExpandKeys] = useState2CustomerSlice('expandedKeys');
  // 搜索列表-上部-二级tab选中
  const [, setFilterSearchSelected] = useState2CustomerSlice('searchListStateTab');
  // 邮件列表-上部-二级tab选中
  const [, setFilterSelected] = useState2CustomerSlice('mailListStateTab');
  // 客户列表-是否还有更多
  const [customerTreeListHasMore] = useState2CustomerSlice('customerTreeListHasMore');
  // 客户列表-搜索列表-是否还有更多
  const [searchTreeListHasMore] = useState2CustomerSlice('searchTreeListHasMore');
  // 客户列表Menu的选中
  const [, setTabMenuSelected] = useState2CustomerSlice('mailListTabMenu');
  // 搜索客户列表的menu选中
  const [, setTabMenuSelectedSearch] = useState2CustomerSlice('mailListTabMenuSearch');
  // 客户列表-搜索的关键词
  const [, setSearchValue] = useState2CustomerSlice('searchValue');
  // 客户侧边栏数据
  const [customerAsideDetailData] = useState2CustomerSlice('customerAsideDetail');

  // 客户列表
  const treeList = useCustomerSliceTreeList(sliceId);
  const treeIdList = useMemo(() => treeList.map(node => node.key).join('_'), [treeList]);

  /**
   * 操作主tab的redux状态
   */
  // const [, setCustomDetailAccountName_main] = useState2CustomerSlice('customDetailAccountName', undefined, tabId.readCustomer);
  // 搜索列表-文件夹-选中的key
  const [, setSelectedSearchKeys_main] = useState2CustomerSlice('selectedSearchKeys', undefined, tabId.readCustomer);
  // 搜索列表-上部-二级tab选中
  const [, setFilterSearchSelected_main] = useState2CustomerSlice('searchListStateTab', undefined, tabId.readCustomer);
  // 搜索客户列表的menu选中
  const [, setTabMenuSelectedSearch_main] = useState2CustomerSlice('mailListTabMenuSearch', undefined, tabId.readCustomer);
  // 文件夹-选中的key
  const [, setSelectedKeys_main] = useState2CustomerSlice('selectedKeys', undefined, tabId.readCustomer);
  // 邮件列表-上部-二级tab选中
  const [, setFilterSelected_main] = useState2CustomerSlice('mailListStateTab', undefined, tabId.readCustomer);
  // 客户列表Menu的选中
  const [, setTabMenuSelected_main] = useState2CustomerSlice('mailListTabMenu', undefined, tabId.readCustomer);
  // 搜索列表-文件夹-选中的联系人Email
  const [, setSelectedSearchContacts_main] = useState2CustomerSlice('selectedSearchContacts', undefined, tabId.readCustomer);
  // 文件夹-选中的联系人Email
  const [, setSelectedContacts_main] = useState2CustomerSlice('selectedContacts', undefined, tabId.readCustomer);
  // 搜索类型
  const [, setMailSearching_mail] = useState2CustomerSlice('mailSearching', undefined, tabId.readCustomer);
  // 搜索关键字
  const [searchValue_main, setSearchValue_mail] = useState2CustomerSlice('searchValue', undefined, tabId.readCustomer);

  /*
   * 衍生状态
   */
  // 是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
  const isLeftRight = useMemo(() => configMailLayout === '1', [configMailLayout]);

  useEffect(() => {
    if (adSearchVisible && inputRef.current) {
      inputRef.current.blur();
    }
  }, [adSearchVisible, inputRef]);

  const onSearchMail = useDebounceForEvent((value: string) => {
    const searchValue = value.toLowerCase();
    setSearchValue(searchValue);
    dispatch(
      Thunks.doSearchCustomers_useMailPlusApi({
        query: searchValue,
        pageSize: searchTreeListPageSize,
        pageNum: 1,
        sliceId,
      })
    );
  }, 500);

  // 用于在客户页签返回的时候同步页签的搜索值
  useEffect(() => {
    if (!searchValue_main || searchValue_main == '') {
      setInputValue('');
    }
  }, [searchValue_main]);

  const setCustomDetail = (sliceId: string, data: CustomerAsideDetail) => {
    dispatch(MailActions.updateCustomerAsideDetail_cm({ sliceId, data }));
  };

  const loopTreeData = (data: CustomerTreeData[], searchValue: string, isLeaf = false): CustomerTreeData[] =>
    data.map(item => {
      const strTitle = item.title as string;
      const index = strTitle.toLowerCase().indexOf(searchValue.toLowerCase());
      const beforeStr = strTitle.substring(0, index);
      const afterStr = strTitle.slice(index + searchValue.length);
      const targetStr = strTitle.slice(index, index + searchValue.length);
      const title =
        index > -1 ? (
          <span>
            {beforeStr}
            <span style={{ color: '#386ee7' }}>{targetStr}</span>
            {afterStr}
          </span>
        ) : (
          <span>{strTitle}</span>
        );
      if (item.children) {
        return { ...item, title, isLeaf, children: loopTreeData(item.children, searchValue, true) as CustomerTreeChildData[] };
      }
      return {
        ...item,
        title,
      };
    });

  // 当搜索关键词发生变化的时候
  const onSearchChange = useDebounceForEvent((value: string = '', isAdvancedSearch?: boolean) => {
    // 未考虑多账号搜索的情况
    const currentAccount = accountApi.getCurrentAccount();
    const accountKey = currentAccount ? currentAccount.email : 'default';
    reducer.doStartMailSearch_cm({ data: value, sliceId });
    if (!value) {
      reducer.doResetMailSearch_cm({ sliceId });
      activeCustomerTab();
    } else {
      if (isAdvancedSearch) {
        setSearchState({ [accountKey]: 'advanced' });
        setMailSearching('advanced');
      } else {
        setCustomerSearchListLoading(true);
        setSearchState({ [accountKey]: 'local' });
        setMailSearching('normal');
        onSearchMail(value);
        1;
      }
    }
  }, 500);

  const expandFolder = async (keys: any, params: any) => {
    isSearching ? setExpandedSearchKeys(keys) : setExpandKeys(keys);
    const { expanded, node } = params;
    if (isSearching && expanded) {
      // 根据客户id获取联系人,然后更新邮件列表，和侧边栏
      const [customerModel] = await doGetCustomersByIds([node.key]);
      // 更新到searchTreeList，主要是补充children和manageList
      if (customerModel) {
        const { contactList, managerList, id } = customerModel;
        const children = formatCustomerTreeChild(contactList, managerList);
        const searchTreeListNew = searchTreeList.map(i => {
          const obj = { ...i };
          if (obj.key === id) {
            obj.children = children;
            obj.managerList = managerList;
          }
          return obj;
        });
        setSearchTreeList(searchTreeListNew);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    changeInputValue: (v: string) => {
      setInputValue(v);
    },
  }));

  const handleWriteBtnClick = useDebounceForEvent(() => {
    // 唤起写信页
    // setCurrentAccount();
    mailApi.doWriteMailToContact();
    // 打点
    trackApi.track('pcMail_click_writeMailButton_topBar', { source: 'theCustomerMail' });
    setBtnWriteMailLoading(true);
    // 新标签方式打开，1.5秒足够
    if (!btnWriteMailLoadingTimer.current) {
      btnWriteMailLoadingTimer.current = setTimeout(() => {
        setBtnWriteMailLoading(false);
        btnWriteMailLoadingTimer.current = null;
      }, 1500) as any;
    }
  }, 200);

  const onPressEnter = (value: string) => {
    isComposition.current = false;
    if (inputRef.current) {
      inputRef.current.blur();
    }
    if (value !== inputValue) {
      onSearchChange && onSearchChange(value);
    }
  };

  const onSearchInputChange = (inputValue: string) => {
    setSelectedMail(DefaultSelectedMail);
    setInputValue(inputValue);
    if (!isComposition.current) {
      onSearchChange && onSearchChange(inputValue);
    }
  };

  const onCompositionStart = () => {
    isComposition.current = true;
  };

  const onCompositionEnd = (e: CompositionEvent<HTMLInputElement>) => {
    isComposition.current = false;
    onSearchChange && onSearchChange((e.target as HTMLInputElement).value);
  };

  const onSearchInputFocus = () => {
    setAdSearchVisible(false);
  };

  const SearchInputSuffix = useMemo(() => {
    if (inputHover || isSearching) {
      return (
        <Tooltip title={getIn18Text('GAOJISOUSUO')} placement="right">
          <span>
            <i
              className="u-mail-search-advanced-icon"
              onClick={e => {
                e.stopPropagation();
                setAdSearchVisible(true);
              }}
            />
          </span>
        </Tooltip>
      );
    }
    return null;
  }, [inputHover, isSearching]);

  const activeCustomerTab = () => {
    // 通栏模式下点击文件夹进行跳转
    if (!isLeftRight) {
      dispatch(mailTabActions.doChangeCurrentTab(tabId.readCustomer));
    }
  };

  // 处理主邮件tab的Select事件
  const handleMainCtSelected = (treeSelectedKeys: string[], node: CustomerTreeData) => {
    // 其跳转逻辑现在独立读信页是一样的
    handleCtReadMailSelected(treeSelectedKeys, node);
  };

  const treeNodeMap = useMemo(() => {
    const map: { [key: string]: CustomerTreeData } = {};
    treeDFS(treeList, (node: CustomerTreeData) => {
      if (node) {
        map[node?.key] = node;
      }
    });
    return map;
  }, [treeList]);

  // 如果客户列表变化，则根据当前选中的客户，设置右侧边栏，但是不监听selectedKeys的变化，防止多次渲染
  useEffect(() => {
    if (treeList.length && selectedKeys.id) {
      const currentNode = treeNodeMap[selectedKeys.id];
      // 如果选中的节点被删除了，比如退回公海，则重新请求一次邮件列表
      if (!currentNode) {
        // 默认选中第一个客户，请求邮件列表
        const { key, managerList, nodeData, children } = treeList[0];
        setSelectedKeys({ id: key, managerList: managerList }); // 默认选中第一个客户
        const toList = children?.map(c => c.email);
        setSelectedContacts({ list: toList || [] }); // 设置默认选中的联系人
        if (Array.isArray(nodeData?.contacts) && nodeData?.contacts.length) {
          const contactHasEmail = nodeData?.contacts.find(n => !!n.email);
          const contactEmail = contactHasEmail ? contactHasEmail.email : '';
          setCustomDetail(sliceId, { email: contactEmail, type: '' }); // 设置选中客户
        }
        // 重新请求一次邮件列表
        const params: loadEdmMailListParam = {
          noCache: false,
          startIndex: 0,
          type: 'customer',
          sliceId,
        };
        dispatch(Thunks.loadMailList_edm(params));
      } else {
        // 如果之前的选中还在，则设置一下有侧边栏即可
        const { email, nodeData } = currentNode;
        const nodeDataEmail =
          Array.isArray(nodeData?.contacts) && nodeData?.contacts.some(node => !!node.email) ? nodeData?.contacts.find(node => !!node.email)?.email : '';
        setCustomDetail(sliceId, { email: email || nodeDataEmail || '', type: '' });
      }
    }
  }, [treeIdList]);
  // 如果搜索客户列表空了，则清空邮件列表，不展示右侧边栏
  useEffect(() => {
    if (!searchTreeList.length) {
      setCustomDetail(sliceId, { email: '', type: '' });
      setSelectedSearchContacts({ list: [] });
      setSelectedSearchKeys({ id: '', managerList: [] });
      const params: loadEdmMailListParam = {
        noCache: isSearching,
        startIndex: 0,
        type: 'customer',
        sliceId,
      };
      dispatch(Thunks.loadMailList_edm(params));
    }
  }, [searchTreeList.length]);

  // 处理独立客户邮件页签下的selected事件
  const handleCtTabSelected = (treeSelectedKeys: string[], node: AntTreeNodeProps) => {
    // 根节点为联系人，点击修改当前状态，不跳转
    if (node) {
      // 查找是否是兄弟节点
      let isBrother = false;
      let isParent = false;
      try {
        const parentNode = treeNodeMap[node?._parentKey];
        const curNode = treeNodeMap[node?.key];
        if (!node?.isLeaf && curNode?.children && curNode.children.length) {
          const children = curNode?.children || [];
          children.forEach(node => {
            if (node.key === selectedKeys.id) {
              isParent = true;
            }
          });
        }
        if (parentNode) {
          const childrens = parentNode?.children;
          if (Array.isArray(childrens) && childrens.length) {
            childrens.forEach(node => {
              if (node.key === selectedKeys?.id) {
                isBrother = true;
              }
            });
          }
        }
      } catch (e) {
        console.error('[Error handleCtTabSelected]', e);
      }
      if ((node?._parentKey === selectedKeys?.id && node.isLeaf) || isParent || (node.isLeaf && isBrother) || node?.key === selectedKeys?.id) {
        if (node?.email) {
          setCustomDetail(sliceId, { email: node?.email, type: '' });
        } else {
          setCustomDetail(sliceId, { email: '', type: '' });
        }

        const { children, email, managerList } = node;
        if (isSearching) {
          setSelectedSearchKeys({ id: treeSelectedKeys[0], managerList: managerList });
          setFilterSearchSelected('ME');
          setTabMenuSelectedSearch('ALL');
        } else {
          setSelectedKeys({ id: treeSelectedKeys[0], managerList: managerList });
          setFilterSelected('ME');
          setTabMenuSelected('ALL');
          getUnRead([treeSelectedKeys[0]]);
        }

        let toList: string[];
        if (Array.isArray(children)) {
          toList = (children as CustomerTreeChildData[]).map(v => v.email);
        } else {
          toList = email ? [email] : [];
        }
        if (isSearching) {
          setSelectedSearchContacts({ list: toList });
        } else {
          setSelectedContacts({ list: toList });
        }
        const params: loadEdmMailListParam = {
          noCache: isSearching,
          startIndex: 0,
          type: 'customer',
          sliceId,
        };
        dispatch(Thunks.loadMailList_edm(params));
      } else {
        // 其他节点为客户，点击要跳转到客户列表，并修改对应主客户页签下的状态
        if (node?.nodeData?.contacts && node?.nodeData?.contacts.length) {
          const contactHasEmail = node?.nodeData?.contacts.find((n: { email: any; accountName: any }) => !!(n.email || n.accountName));
          const contactEmail = contactHasEmail ? contactHasEmail.accountName || contactHasEmail.email : '';
          setCustomDetail(tabId.readCustomer, { email: contactEmail, type: '' });
        } else {
          setCustomDetail(tabId.readCustomer, { email: '', type: '' });
        }

        const { children, email, managerList } = node;

        if (isSearching) {
          setSelectedSearchKeys_main({ id: treeSelectedKeys[0], managerList: managerList });
        } else {
          setSelectedKeys_main({ id: treeSelectedKeys[0], managerList: managerList });
          setFilterSelected_main('ME');
          setTabMenuSelected_main('ALL');
          getUnRead([treeSelectedKeys[0]]);
        }

        setFilterSearchSelected_main('ME');
        setTabMenuSelectedSearch_main('ALL');

        let toList: string[];
        if (Array.isArray(children)) {
          toList = (children as CustomerTreeChildData[]).map(v => v.email);
        } else {
          toList = email ? [email] : [];
        }
        if (isSearching) {
          setSelectedSearchContacts_main({ list: toList });
        } else {
          setSelectedContacts_main({ list: toList });
        }
        setMailSearching_mail('');
        setSearchValue_mail('');

        const params: loadEdmMailListParam = {
          noCache: isSearching,
          startIndex: 0,
          type: 'customer',
          sliceId: tabId.readCustomer,
        };
        dispatch(Thunks.loadMailList_edm(params));

        // 激活主邮件tab
        dispatch(mailTabActions.doChangeCurrentTab(tabId.readCustomer));
      }
    }
  };

  // 处理独立客户读信页下的selected事件
  const handleCtReadMailSelected = (treeSelectedKeys: string[], node: CustomerTreeData, propsSliceId?: string) => {
    const logicSliceId = propsSliceId ? propsSliceId : sliceId;
    // 修改重置主客户邮件模块中的状态。
    // 注意，必须先与激活页签设置状态
    if (node && node.isLeaf) {
      if (node.email) {
        setCustomDetail(logicSliceId, { email: node.email, type: '' });
      } else {
        setCustomDetail(logicSliceId, { email: '', type: '' });
      }
    } else {
      if (node?.nodeData?.contacts && node?.nodeData?.contacts.length && node?.nodeData?.contacts.some(n => !!n.email)) {
        const email = node?.nodeData?.contacts.find(n => !!n.email)?.email || '';
        setCustomDetail(logicSliceId, { email, type: '' });
      } else {
        setCustomDetail(logicSliceId, { email: '', type: '' });
      }
    }
    const { children, email, managerList } = node;

    if (isSearching) {
      setSelectedSearchKeys_main({ id: treeSelectedKeys[0], managerList: managerList });
    } else {
      setSelectedKeys_main({ id: treeSelectedKeys[0], managerList: managerList });
      setFilterSelected_main('ME');
      setTabMenuSelected_main('ALL');
      getUnRead([treeSelectedKeys[0]]);
    }
    setFilterSearchSelected_main('ME');
    setTabMenuSelectedSearch_main('ALL');

    let toList: string[];
    if (Array.isArray(children)) {
      toList = (children as CustomerTreeChildData[]).map(v => v.email);
    } else {
      toList = email ? [email] : [];
    }
    if (isSearching) {
      setSelectedSearchContacts_main({ list: toList });
    } else {
      setSelectedContacts_main({ list: toList });
    }

    const params: loadEdmMailListParam = {
      noCache: isSearching,
      startIndex: 0,
      type: 'customer',
      sliceId: tabId.readCustomer,
    };
    dispatch(Thunks.loadMailList_edm(params));
  };

  const onTreeSelect = async (treeSelectedKeys: string[], { node: treeNode }: { node: CustomerTreeData }) => {
    if (!treeSelectedKeys || treeSelectedKeys.length == 0) {
      return;
    }
    let node = treeNode;
    // 如果是搜索下选择客户，需要请求客户数据后再继续
    if (isSearching && node.isLeaf === false) {
      const [customerModel] = await doGetCustomersByIds([node.key]);
      // 更新到searchTreeList，主要是补充children和manageList
      if (customerModel) {
        const { contactList, managerList, id } = customerModel;
        const children = formatCustomerTreeChild(contactList, managerList);
        // node重新赋值一下
        const nodeData = Object.assign({}, node?.nodeData, { contacts: contactList });
        node = { ...node, children, managerList, nodeData };
        // 异步去更新redux，为下一次点击准备好
        setTimeout(() => {
          const searchTreeListNew = searchTreeList.map(i => {
            const obj = { ...i };
            if (obj.key === id) {
              obj.children = children;
              obj.managerList = managerList;
            }
            return obj;
          });
          setSearchTreeList(searchTreeListNew);
        }, 50);
      }
    }

    // 判断是否处于主客户模块中
    if (currentTabId == tabId.readCustomer) {
      handleMainCtSelected(treeSelectedKeys, node);
    } else if (currentTabType == tabType.customer) {
      // 是否处于独立客户模块中
      handleCtTabSelected(treeSelectedKeys, node);
    } else {
      // 处于客户独立读信页中
      handleCtReadMailSelected(treeSelectedKeys, node, tabId.readCustomer);
      setMailSearching_mail('');
      setSearchValue_mail('');
      // 激活主邮件tab
      dispatch(mailTabActions.doChangeCurrentTab(tabId.readCustomer));
    }
  };

  // 获取未读数
  const getUnRead = (customerIds?: string[]) => {
    dispatch(Thunks.getUnread_cm({ customerIds }));
  };

  const onTreeSelectDebounce = useDebounceForEvent(onTreeSelect, 300, {
    leading: true,
    trailing: false,
  });

  const onAdSearchOk = (res: any) => {
    const { stringFromValue, treeList, formValues } = res;
    setAdSearchVisible(false);
    onSearchChange(stringFromValue, true);
    setSearchTreeList(treeList);
    setInputValue(stringFromValue);
    setSearchValue(stringFromValue);
    setRefreshBtnLoading(false);
    setAdSearchFromValue(formValues);
    setCustomerSearchListLoading(false);
  };

  const onAdSearchCancel = () => {
    setAdSearchVisible(false);
  };

  // 调用uni弹窗，打开编辑客户，或者编辑客户联系人,或者客户详情
  const handleSidebar = (customerId: any, type: 'detail' | 'contactInfo', contactId?: string) => {
    if (customerId) {
      // 编辑客户
      if (type === 'detail') {
        showUniDrawer({
          moduleId: UniDrawerModuleId.CustomerDetail,
          moduleProps: {
            visible: true,
            onClose: () => {},
            onSuccess: () => {
              // 编辑成功后，发送事件，重新请求一次数据
              eventApi.sendSysEvent({
                eventName: 'mailMenuOper',
                eventStrData: 'headerCardVisible',
                eventData: { success: true, type: 'customer' },
              });
            },
            customerId: Number(customerId),
            source: 'waCustomer',
          },
        });
      } else if (type === 'contactInfo') {
        // 编辑联系人
        showUniDrawer({
          moduleId: UniDrawerModuleId.ContactDetail,
          moduleProps: {
            visible: true,
            customerId: Number(customerId),
            source: 'waCustomer',
            onClose: () => {},
            onSuccess: () => {
              eventApi.sendSysEvent({
                eventName: 'mailMenuOper',
                eventStrData: 'headerCardVisible',
                eventData: { success: true, type: 'contact' },
              });
            },
            contactId: Number(contactId),
          },
        });
      }
    }
  };

  // 记录上次打开的客户联系人id
  // const contactIdRef = useRef('');
  // 右键客户，点击编辑和详情调用的方法基本一致，提取公用方法
  const handleEditOrDetailCustom = (type: '' | 'detail' | 'contactInfo') => {
    if (menuActiveNode.current) {
      let id = ''; // 客户id
      let title = ''; // 客户页签title
      let email = ''; // 客户邮箱
      let contactId = ''; // 客户联系人id
      // 如果是客户
      if (!menuActiveNode.current?.isLeaf && menuActiveNode.current?.nodeData) {
        const nodeData = menuActiveNode.current?.nodeData;
        id = nodeData?.id || menuActiveNode.current?.key;
        title = nodeData?.orgName || menuActiveNode.current?.title;
        const contactHasEmail =
          Array.isArray(nodeData?.contacts) && nodeData?.contacts.find((contact: { email: any; accountName: any }) => !!(contact.email || contact.accountName));
        email = contactHasEmail ? contactHasEmail?.email || contactHasEmail?.accountName : '';
        contactId = '';
      } else if (!!menuActiveNode.current?.isLeaf) {
        // 如果是客户联系人，则去_parentKey
        id = menuActiveNode.current?._parentKey;
        const parentNode: CustomerTreeData = treeNodeMap[id];
        title = parentNode?.nodeData?.orgName || (parentNode?.title as string);
        const contactHasEmail = Array.isArray(parentNode?.nodeData?.contacts) && parentNode?.nodeData?.contacts.find(contact => !!contact.email);
        const parentNodeEmail = contactHasEmail ? contactHasEmail?.email : '';
        email = menuActiveNode.current?.email || parentNodeEmail;
        contactId = menuActiveNode.current.key;
      }
      const customNode = treeNodeMap[id];
      // 当前操作的客户或者联系人所属的客户，是否被选中
      const isSelectedCustom = id == selectedKeys?.id || customNode?.nodeData?.contacts?.some(c => +c.id === +selectedKeys?.id);
      if (isSelectedCustom) {
        // 设置侧边栏
        if (email) {
          setCustomDetail(sliceId, { email, type });
        }
      } else {
        // 新建客户页签
        dispatch(MailActions.doCreateNewSlice_cm({ sliceId: id }));
        const mailTabModel: MailTabModel = genEdmMilTabModel({
          id,
          title,
          type: 'customer',
          from: tabId.readCustomer,
        });
        // 填充列表请求参数
        try {
          let toList: string[];
          if (Array.isArray(menuActiveNode.current?.children)) {
            toList = (menuActiveNode.current?.children as CustomerTreeChildData[]).map(v => v.email);
          } else {
            toList = email ? [email] : [];
          }
          dispatch(MailActions.doUpdateSliceAny_cm({ sliceId: id, name: 'selectedContacts', data: { list: toList } }));
          // 如果新开页签，在新页签打开客户，并且选中联系人
          dispatch(MailActions.doUpdateSliceAny_cm({ sliceId: id, name: 'selectedKeys', data: { id: contactId || id } }));
          dispatch(MailActions.doUpdateSliceAny_cm({ sliceId: id, name: 'expandedKeys', data: [id] }));
        } catch (e) {
          console.error('[Error handleEditOrDetailCustom]', e);
        }
        // 选中当前页签
        dispatch(mailTabActions.doSetTab(mailTabModel));
        // 设置侧边栏
        if (email) {
          setCustomDetail(id, { email, type });
        }
      }
      // 如果是编辑客户，或者编辑联系人，则直接调用uni
      if (type === 'detail' || type === 'contactInfo') {
        handleSidebar(id, type, contactId);
      }

      // 编辑联系人和编辑客户使用uni弹窗，已经不需要再提示了，仅仅提示客户详情已展开
      if (!type && customerAsideDetailData.email === email && customerAsideDetailData.type === type) {
        message.warn({
          content: '客户详情已展开',
        });
      }
    }
  };

  const menuActiveNode = useRef<any>(null);
  // 客户编辑
  const handleEditCustom = (clickNode: any) => {
    menuActiveNode.current = clickNode;
    handleEditOrDetailCustom('detail');
  };

  // 展示客户详情,和编辑基本一致，仅type不同
  const handleDetailCustom = (clickNode: any) => {
    menuActiveNode.current = clickNode;
    handleEditOrDetailCustom('');
  };
  // 编辑联系人
  const handleEditContact = (clickNode: any) => {
    menuActiveNode.current = clickNode;
    handleEditOrDetailCustom('contactInfo');
  };

  // 获取客户列表邮件的菜单
  const getCustomFolderMenu = (clickNode: any) => {
    const itemList: React.ReactElement[] = [];
    // 如果是叶子节点则是客户联系人
    if (clickNode && clickNode.isLeaf) {
      itemList.push(
        <PrivilegeCheckForMailPlus accessLabel="OP" resourceLabel="CONTACT">
          <Menu.Item key="1" onClick={() => handleEditContact(clickNode)}>
            {getIn18Text('BIANJILIANXIREN')}
          </Menu.Item>
        </PrivilegeCheckForMailPlus>
      );
    } else {
      // 客户
      itemList.push(
        <PrivilegeCheckForMailPlus accessLabel="OP" resourceLabel="CONTACT">
          <Menu.Item key="1" onClick={() => handleEditCustom(clickNode)}>
            {getIn18Text('BIANJIKEHU')}
          </Menu.Item>
        </PrivilegeCheckForMailPlus>
      );
      itemList.push(
        <Menu.Item key="2" onClick={() => handleDetailCustom(clickNode)}>
          {getIn18Text('KEHUXIANGQING')}
        </Menu.Item>
      );
    }
    return itemList.length ? <Menu>{itemList}</Menu> : <></>;
  };

  // 客户列表右侧添加右键同功能菜单
  const renderTreeTitle = (data: any) => {
    const title = data.title;
    const key = data.isLeaf ? data._parentKey?.split('_')?.pop() + data.key : data.key?.split('_')?.pop();
    const unRead = data.isLeaf ? unReadMap.contentMap[key]?.unread : unReadMap.customerMap[key]?.unread;
    return (
      <div className={`tree-content-warp showOper`}>
        <span className="u-foldername">{title}</span>
        {!!unRead && <span className="u-unread">{unRead}</span>}
        <span
          className="oper-wrap"
          onClick={e => {
            e.stopPropagation();
          }}
          onContextMenu={e => {
            e.stopPropagation();
          }}
        >
          <Dropdown overlayClassName="u-tree-dropmenu" overlayStyle={{ width: 'auto' }} placement="topLeft" overlay={getCustomFolderMenu(data)} trigger={['click']}>
            <div className="more">...</div>
          </Dropdown>
        </span>
      </div>
    );
  };

  // 调用Uni新建客户
  const handleCreateCustomer = () => {
    showUniDrawer({
      moduleId: UniDrawerModuleId.CustomerDetail,
      moduleProps: {
        visible: true,
        onClose: () => {},
        onSuccess: () => {
          dispatch(Thunks.refreshPage_cm({ sliceId }));
        },
        customerData: {
          company_name: '',
        },
        source: 'mailCustomerList',
      },
    });
  };

  const onRefreshHandler = () => {
    if (refreshBtnLoading) {
      reduxMessage.success({ content: `${getIn18Text('SHUAXINZHONG')}` });
      return;
    }
    if (isSearching) {
      setCustomerSearchListLoading(true);
      setRefreshBtnLoading(true);
      if (mailSearching === 'advanced') {
        adSearch.current && adSearch.current?.startAdSearch(adSearchFromValue);
      } else {
        onSearchMail(inputValue);
      }
      return;
    }
    dispatch(Thunks.refreshPage_cm({ sliceId }));
  };

  return (
    <>
      <NetWatcher />
      <MailSubTab />
      <div className="m-edit-container">
        <Button
          type="primary"
          className="u-mail-btn sirius-no-drag"
          icon={
            <span className="icon">
              <ReadListIcons.EditSvg />
            </span>
          }
          onClick={handleWriteBtnClick}
          loading={btnWriteMailLoading}
        >
          <span className="text">{getIn18Text('XIEYOUJIAN')}</span>
        </Button>
        <Tooltip placement="bottom" title={refreshBtnLoading ? getIn18Text('SHUAXINZHONG') : getIn18Text('SHUAXIN')} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
          <div className={`u-refresh sirius-no-drag btn ${refreshBtnLoading ? 'sirius-spin' : ''}`} onClick={onRefreshHandler} />
        </Tooltip>
      </div>
      <div
        onClickCapture={() => {
          // 如果在非客户主页前下点击，则返回主页前搜索
          if (currentTabId != tabId.readCustomer) {
            dispatch(mailTabActions.doChangeCurrentTab(tabId.readCustomer));
          }
        }}
        onMouseEnter={() => setInputHover(true)}
        onMouseLeave={() => setInputHover(false)}
        className="m-search-container"
      >
        <Input
          ref={inputRef}
          placeholder={getIn18Text(['SOUSUO', 'KEHU'])}
          maxLength={100}
          value={currentTabId != tabId.readCustomer ? '' : typeof inputValue === 'string' ? inputValue : mailSearchKey}
          style={{ padding: 0, paddingLeft: 10 }}
          className="sirius-no-drag"
          onFocus={onSearchInputFocus}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          onPressEnter={e => onPressEnter((e.target as HTMLInputElement).value)}
          onChange={e => onSearchInputChange(e.target.value)}
          prefix={<i className="dark-invert m-search-icon" />}
          suffix={SearchInputSuffix}
          allowClear
        />
      </div>
      <div className={classnames('m-tree-container', 'edit-tree-padding0')} style={{ display: isSearching ? 'none' : 'block' }}>
        {/* 骨架屏 */}
        {customerListLoading && (
          <div className={styles.columnCustomerEmpty} style={{ justifyContent: 'flex-start' }}>
            <Skeleton
              active
              loading={customerListLoading}
              title={false}
              paragraph={{ rows: 15, width: [180, 180, 130, 180, 180, 130, 180, 180, 130, 180, 180, 130, 180, 180, 130] }}
            ></Skeleton>
          </div>
        )}
        {/* 无客户数据，新建客户 */}
        <div className={styles.columnCustomerEmpty} hidden={customerListLoading || treeList.length > 0}>
          <div className={styles.columnCustomerEmptyTxt}>{getIn18Text('WUKEHU')}</div>
          <PrivilegeCheckForMailPlus resourceLabel="CONTACT" accessLabel="OP">
            <div className={styles.columnCustomerEmptyBtn} onClick={handleCreateCustomer}>
              {getIn18Text('XINJIANKEHU')}
            </div>
          </PrivilegeCheckForMailPlus>
        </div>
        {!customerListLoading && !!treeList.length ? (
          <AutoSizer style={{ width: '100%', height: '100%' }}>
            {({ height, width }) => (
              <>
                <EditTree
                  ref={customerFolderRef}
                  customBaseTree={VListTree}
                  // loadData={onLoadData}
                  height={height}
                  width={width}
                  // blockNode
                  // showIcon
                  treeData={treeList}
                  expandedKeys={expandedKeys}
                  // defaultExpandedKeys={expandedKeys}
                  onExpand={expandFolder}
                  editAble={true}
                  selectedKeys={currentTabType === tabType.read ? null : [selectedKeys.id]}
                  onRightClick={({ node }: any) => {
                    menuActiveNode.current = node;
                  }}
                  // beforeRightClick={({ node }: any) => {
                  //   return !node.isLeaf;
                  // }}
                  onSelect={onTreeSelectDebounce}
                  draggable={false}
                  titleRender={renderTreeTitle}
                  overlayStyle={{ width: 'auto' }}
                  menu={getCustomFolderMenu}
                  hasMore={customerTreeListHasMore}
                  onLoadMoreNode={() => {
                    return dispatch(
                      Thunks.loadCustomerList_cm({
                        limit: 50,
                        lastMailTime: treeList[treeList.length - 1]?.nodeData?.lastMailTime,
                        lastId: treeList[treeList.length - 1]?.nodeData?.id,
                        sliceId,
                      })
                    );
                  }}
                />
              </>
            )}
          </AutoSizer>
        ) : (
          <></>
        )}
      </div>
      <div className={classnames('m-tree-container', 'customer-tree-container')} style={{ display: isSearching ? 'block' : 'none' }}>
        {customerSearchListLoading ? (
          <div className="u-loading" style={{ display: isSearching ? 'block' : 'none' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          </div>
        ) : (
          <></>
        )}
        <p className="m-search-res" style={{ display: customerSearchListLoading || searchTreeList.length > 0 ? 'none' : 'block' }}>
          {getIn18Text('WEISOUSUODAOXIANGGUANNEIRONG')}
        </p>
        {!customerSearchListLoading && (
          <AutoSizer style={{ width: '100%', height: '100%' }}>
            {({ height, width }) => {
              return (
                <>
                  <EditTree
                    height={height}
                    width={width}
                    blockNode
                    showIcon
                    customBaseTree={VListTree}
                    treeData={searchTreeList}
                    expandedKeys={expandedSearchKeys}
                    selectedKeys={[selectedSearchKeys.id]}
                    onExpand={expandFolder}
                    editAble={true}
                    onSelect={onTreeSelectDebounce}
                    onRightClick={({ node }: any) => {
                      menuActiveNode.current = node;
                    }}
                    overlayStyle={{ width: 'auto' }}
                    menu={getCustomFolderMenu}
                    draggable={false}
                    hasMore={searchTreeListHasMore}
                    onLoadMoreNode={() => {
                      return dispatch(
                        Thunks.doSearchCustomers_useMailPlusApi({
                          pageSize: searchTreeListPageSize,
                          pageNum: searchTreeListPageNum + 1,
                          sliceId,
                        })
                      );
                    }}
                  />
                </>
              );
            }}
          </AutoSizer>
        )}
      </div>
      <CustomerAdvancedSearch ref={adSearch} visible={adSearchVisible} onOk={onAdSearchOk} onCancel={onAdSearchCancel} />
    </>
  );
};

export default React.forwardRef(ColumnMailBox);
