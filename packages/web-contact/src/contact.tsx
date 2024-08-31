import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useUpdateEffect } from 'ahooks';
import { InputProps, Skeleton } from 'antd';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import { AccountApi, api, apis, ContactAndOrgApi, inWindow, MailListConfig, ContactPersonalMarkNotifyEventData } from 'api';
import debounce from 'lodash/debounce';
import styles from './contact.module.scss';
import { syncAll } from './_mock_';
import ContactDetail from './component/Detail/detail';
import ContactMultOperPanel from './component/ContactMultOperPanel/ContactMultOperPanel';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import { PlusIcon } from '@web-common/components/UI/Icons/icons';
import { SiriusPageProps } from '@/components/Layout/model';
import Empty from './component/Empty/empty';
import NetWatcher, { useNetStatus } from '@web-common/components/UI/NetWatcher';
import useWindowSize from '@web-common/hooks/windowResize';
import { FIR_SIDE, SEC_SIDE } from '@web-common/utils/constant';
import PersonalOrgModal from '@web-common/components/UI/SiriusContact/personalOrgModal/personalOrg';
import ContactTrackerIns from '@web-contact/tracker';
import SyncLoading from './component/SyncLoading';
import { useAppSelector, ContactActions, useAppDispatch } from '@web-common/state/createStore';
import { StaticNodeKey, ContactItem, StaticRootNodeKey } from '@web-common/utils/contact_util';
import { PersonalModal } from '@web-common/components/UI/SiriusContact/personal/personalModal';
import PersonalMarkModalProps from '@web-common/components/UI/SiriusContact/personalMark/modal';
import { MailListModal } from '@web-common/components/UI/SiriusContact/mailListModal/mailListModal';
import { ChooseGroupModal } from '@web-contact/component/EditPersonalOrg/chooseGroup';
import ContactTree, { ContactTreeRefProps } from './component/ContactTree/ContactTree';
import { getValidStoreWidth } from '@web-common/utils/utils';

import { ContactMaillistHeader, MailListKeyType } from './contactMaillistHeader';
import useMsgCallback from '@web-common/hooks/useMsgCallback';
import { ContactOrgItem, ContactTreeNode, SelectedContactOrgMap, isMainAccount } from '@web-common/components/util/contact';
import { ContactOrgList } from './component/ContactList/ContactOrgList';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import InputContextMenu from '@web-common/components/UI/InputContextMenu/InputContextMenu';
// import { Input as LxInput } from '@web-common/components/UI/Input';
import LxInput from '@lingxi-common-component/sirius-ui/Input';
import { doUpdateContactMap } from '@web-common/state/reducer/contactReducer';

import { ContactImportModal } from './component/ContactImport/modal';
import ImportSelect from './component/ContactImport/importSelect';
import { getIn18Text } from 'api';
import lodashGet from 'lodash/get';

const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const systemApi = api.getSystemApi();
const eventApi = api.getEventApi();
const storeApi = api.getDataStoreApi();

const STORE_CONTACT_FOLDER_WIDTH = 'STORE_CONTACT_FOLDER_WIDTH';
const STORE_CONTACT_LIST_WIDTH = 'STORE_CONTACT_LIST_WIDTH';

const CONTACT_LIST_PERSONAL_MARK_TIP = 'CONTACT_LIST_PERSONAL_MARK_TIP';

// ui要求设置的最小距离顶部的高度
const defaultlPlaceholderHeight = 16;

const personalAllNode: ContactTreeNode = {
  key: StaticNodeKey.PERSON_ALL,
  isLeaf: false,
  isOrg: true,
  title: getIn18Text('SUOYOULIANXIREN'),
  nodeType: 'personal',
};

const personalMarkNode: ContactTreeNode = {
  key: StaticNodeKey.PERSON_MARK_LIST,
  isLeaf: true,
  isOrg: true,
  title: getIn18Text('markContactAndOrg'),
  nodeType: 'personal',
};

const Contact: React.FC<SiriusPageProps> = () => {
  const dispatch = useAppDispatch();
  // 当前是否联网状态
  const offline = !useNetStatus();
  // 企业通讯录邮箱列表配置
  const mailListConfig = useAppSelector(state => state.contactReducer.mailListConfig);
  // 企业通讯录邮箱列表我管理的邮箱地址
  const [manageEmails, setManageEmails] = useState<Set<string>>(new Set());
  //  企业通讯录邮箱列表我管理的可编辑的邮箱地址
  const [editManageEmails, setEditManageEmails] = useState<Set<string>>(new Set());
  //  企业通讯录邮箱列表我管理的可删除的邮箱地址
  const [deleteManageEmails, setDeleteManageEmails] = useState<Set<string>>(new Set());
  // 第1栏的宽度（联系人组织树宽度）
  const [defaultFolderWidth, setDefaultFolderWidth] = useState<number>(220);
  // 第2栏宽度
  const [defaultListWidth, setDefaultListWidth] = useState<number>(324);
  // 搜索存储搜索前选中的联系人和已经勾选的联系人列表
  const historyListRef = useRef<{ selectedContact?: ContactItem; checkedContactList: SelectedContactOrgMap }>();
  // 联系人列表的宽度
  const [listWidth, setListWidth] = useState(defaultListWidth);
  // 联系人列表的高度
  const { height: listHeight } = useWindowSize(!0);
  // localstorage 是否关闭过新建分组提示
  // 当前选中的联系人组织树的某个节点
  const [selectedDataNode, setSelectedDataNode] = useState<ContactTreeNode>(personalAllNode);
  // 组织树默认选择节点
  const [treeDefaultSelectedDataNode, setTreeDefaultSelectedDataNode] = useState<ContactTreeNode>(personalAllNode);
  // 用来刷新联系人组织树组件（每次+1，联系人组织树执行初始化操作）
  const [refreshAccountsCount, setRefreshAccountsCount] = useState<number>(0);
  // 多账号情况下当前操作的账号
  const [currentAccount, setCurrentAccount] = useState<string>(systemApi.getCurrentUser()?.id || '');
  // 当前选中的联系人列表中的某个联系人
  const [selectedContact, setSelectedContact] = useState<ContactItem>();
  // 勾选的所有联系人（组织）集合
  const [checkedContacts, setCheckedContacts] = useState<SelectedContactOrgMap>(new Map());
  // 搜索的值
  const [searchValue, setSearchValue] = useState<string>('');
  // 点击编辑个人分组弹窗的个人分组id
  const [selectedPersonalOrgId, setSelectedPersonalOrgId] = useState<string>();
  // 是否展示个人分组（添加/编辑）弹窗
  const [personalOrgModalVisible, setPersonalOrgModalVisible] = useState<boolean>(false);
  // 是否展示个人（添加/编辑）弹窗
  const [personalModalVisible, setPersonalModalVisible] = useState<boolean>(false);
  // 是否展示导入导出
  const [visibleImportContact, setVisibleImportContact] = useState<boolean>(false);
  // 个人星标提示
  const [personalMarkSortTip, setPersonalMarkSortTip] = useState<boolean>(storeApi.getSync(CONTACT_LIST_PERSONAL_MARK_TIP).data !== 'true');
  // 是否展示添加到个人分组的弹窗
  const [visibleChoosePersonalGroup, setVisibleChoosePersonalGroup] = useState(false);
  // 是否展示个人星标联系人（添加）弹窗
  const [personalMarkModalVisible, setPersonalMarkModalVisible] = useState<boolean>(false);
  // 是否展示企业通讯录邮箱列表（添加/编辑）弹窗
  const [mailListModalVisible, setMailListModalVisible] = useState<boolean>(false);
  // 企业通讯录邮箱列表当前是（全部/我管理的）
  const [activeMailListType, setActiveMailListType] = useState<MailListKeyType>('all');
  // 通讯录列表是否在加载中
  const [listLoading, setListLoading] = useState<boolean>(true);
  // 选中组织树的某个节点后对应的联系人数据
  const [contactList, setContactList] = useState<ContactOrgItem[]>([]);
  // 我管理的邮件列表对应的联系人数据
  const [myManagerContactList, setMyManagerContactList] = useState<ContactOrgItem[]>([]);
  // 个人通讯录导入导出选择
  const [importSelectType, setImportSelectType] = useState<'import' | 'export'>();
  // 组织树组件的ref
  const contactTreeRef = useRef<ContactTreeRefProps>();

  const [maillistsizetimestamp, setMaillistsizetimestamp] = useState(0);

  const searchInputRef = useRef(null);

  // 监听api层发送的通讯录数据发生变化
  useMsgCallback(
    'contactAccountNotify',
    useCreateCallbackForEvent(({ _account: account }) => {
      console.log('[contact.tsx] MailList contactAccountNotify', currentAccount, account);
      if (currentAccount !== account) {
        return;
      }
      if (!searchValue && isMailList) {
        fetchUserMailList();
      }
    })
  );

  // 星标联系人标星的时候，当前选中的是星标节点需要刷新列表
  useMsgCallback(
    'contactPersonalMarkNotify',
    useCreateCallbackForEvent(e => {
      const eventData = e.eventData as ContactPersonalMarkNotifyEventData;
      if (!searchValue && selectedDataNode.key === StaticNodeKey.PERSON_MARK_LIST && !eventData?.noNewMarkData) {
        refreshSelectedNodeData();
      }
    })
  );

  // 进入页面带跳转参数
  useEffect(() => {
    if (inWindow()) {
      const selectNodeKey = history?.state?.selectNodeKey;
      if (selectNodeKey === StaticNodeKey.PERSON_MARK_LIST) {
        setTreeDefaultSelectedDataNode(personalMarkNode);
        // contactTreeRef.current?.onSelectNode(personalMarkNode, currentAccount);
      }
    }
  }, []);

  // 初始化设置第一栏，第二栏的宽度
  useEffect(() => {
    const storeContactFolderWidth = getValidStoreWidth(storeApi.getSync(STORE_CONTACT_FOLDER_WIDTH, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' }));
    const storeContactListWidth = getValidStoreWidth(storeApi.getSync(STORE_CONTACT_LIST_WIDTH, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' }));
    if (storeContactFolderWidth > 0) {
      setDefaultFolderWidth(storeContactFolderWidth);
    }
    if (storeContactListWidth > 0) {
      setDefaultListWidth(storeContactListWidth);
      setListWidth(storeContactListWidth);
    }
  }, []);

  // 是否处于邮件列表
  const isMailList = useMemo(() => {
    const type = selectedDataNode?.data?.type;
    const companyId = selectedDataNode?.data?.enterpriseId;
    return type === 2 && companyId === systemApi.getCurrentCompanyId();
  }, [selectedDataNode]);

  const updateMaillistContactModel = useCallback((emails: string[]) => {
    contactApi.doGetServerContactByEmails(emails).then(list => {
      if (!list || !list.length) {
        return;
      }

      const formattedList = list.map(item => {
        return contactApi.transContactModel2ContactItem(item);
      });
      // 更新数据到redux
      // dispatch(
      //   ContactActions.doUpdateContactMap(
      //     list.map(item => {
      //       item.contact.position = [['邮件列表']];
      //       item.contact.enableIM = false;
      //       return item;
      //     })
      //   )
      // );

      doUpdateContactMap(
        list.map(item => {
          item.contact.position = [['邮件列表']];
          item.contact.enableIM = false;
          return item;
        })
      );

      setMyManagerContactList(formattedList);
    });
  }, []);

  // 从服务端拉取我管理的邮件列表信息(通讯录设置不可见的情况下本地取不到)
  useEffect(() => {
    // 如果我管理的邮件列表均不可见 从服务端拉取数据
    if (isMailList && manageEmails.size && activeMailListType === 'manager') {
      updateMaillistContactModel([...manageEmails]);
    }
  }, [activeMailListType, manageEmails.size, isMailList, maillistsizetimestamp]);

  // 联系人展示的列表数据
  const displayContactList = useMemo(() => {
    // 管理员
    if (isMailList && manageEmails.size && activeMailListType === 'manager') {
      return myManagerContactList;
    }
    return contactList;
  }, [activeMailListType, manageEmails, contactList, isMailList, myManagerContactList]);

  // 进入邮件列表 即获取配置权限
  useUpdateEffect(() => {
    if (isMailList) {
      maillistInit();
    } else {
      setActiveMailListType('all');
    }
  }, [isMailList]);

  // 当前选中的邮箱是否是我管理可编辑的邮件列表
  const isEditManageMailList = useMemo(() => {
    return isMailList && selectedContact && (editManageEmails.has(selectedContact.email) || deleteManageEmails.has(selectedContact.email));
  }, [isMailList, editManageEmails, selectedContact]);

  // 当前选中的邮箱是否是我管理可删除的邮件列表
  const isDeleteManageMailList = useMemo(() => {
    return isMailList && selectedContact && deleteManageEmails.has(selectedContact.email);
  }, [isMailList, deleteManageEmails, deleteManageEmails, selectedContact]);

  // 展示新建邮件列表按钮
  const showNewMailListButton = useMemo(() => {
    if (!mailListConfig) return false;
    const { maillist_config } = mailListConfig;
    const { create_maillist, has_maillist_quota } = maillist_config;
    return !!create_maillist && !!has_maillist_quota;
  }, [mailListConfig]);

  // 获取用户邮件列表基本信息
  const reqMaillistConfig = useCallback(async () => {
    try {
      const configRes = await contactApi.getMaillistConfig();
      const { success, data: data0 } = configRes;
      if (!!success && !!data0) {
        const { data: data1 } = data0;
        dispatch(ContactActions.doUpdateMailListConfig(data1 as MailListConfig));
        return data1;
      }
    } catch (error) {
      console.log('获取用户邮件列表基本信息失败', error);
    }
  }, []);

  // 联系人列表数据发生变化
  const handleContactListChange = useCallback((contactList: ContactOrgItem[], account?: string) => {
    if (account) {
      setCurrentAccount(account);
    }
    setContactList(contactList);
    setListLoading(false);
  }, []);

  // 编辑分组确认按钮点击
  const onPersonalOrgConfirm = useCallback((key: string, title: string, _account) => {
    setPersonalOrgModalVisible(false);
    contactTreeRef.current?.onSelectNode(
      {
        key,
        title,
        nodeType: 'personal',
        isLeaf: false,
        isOrg: true,
      },
      _account || currentAccount
    );
  }, []);

  /**
   * 搜索事件
   * 需要处理以下几点：
   * 1、当用户输入时，保存历史列表（即非搜索列表）的相关值，以便重置搜索时复原列表状态
   * 2、当用户清空时，从历史列表复原非搜索列表状态（包括选中值、复选值、列表滚动位置），并清空历史列表
   */
  const handleSearch: InputProps['onChange'] = useCallback(
    async e => {
      if (e.target.value && !searchValue) {
        ContactTrackerIns.tracker_contact_search_input();
      }
      setSearchValue(e.target.value);
      if (e.target.value) {
        if (historyListRef.current === undefined) {
          historyListRef.current = {
            selectedContact,
            checkedContactList: checkedContacts,
          };
        }
        setCheckedContacts(new Map());
      } else {
        if (historyListRef.current !== undefined) {
          const selected = historyListRef.current.selectedContact;
          const contacts = historyListRef.current.checkedContactList;
          setCheckedContacts(contacts);
          setSelectedContact(selected);
          historyListRef.current = undefined;
        }
      }
    },
    [checkedContacts, displayContactList, selectedContact]
  );

  // 联系人第一栏（联系人组织树）宽度修改回调函数
  const debounceResizeContactFolder = useCallback(
    debounce((_, data) => {
      // TODO 调整左侧宽度，保存width into storage
      const {
        size: { width },
      } = data;
      // TODO 判断如果是分栏模式
      // TODO 邮件列表宽度保存到storage
      storeApi.putSync(STORE_CONTACT_FOLDER_WIDTH, width, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' });
      // setTableSize();
    }, 600),
    []
  );

  // 联系人第二栏（联系人列表）宽度修改回调函数
  const debounceResizeContactList = useCallback(
    debounce((_, data) => {
      // TODO 调整左侧宽度，保存width into storage
      // setTableSize();
      const {
        size: { width },
      } = data;
      setListWidth(width);
      storeApi.putSync(STORE_CONTACT_LIST_WIDTH, width, { prefix: 'layout_storage_cache', storeMethod: 'localStorage' });
    }, 600),
    []
  );

  // 个人通讯录新建联系人
  const handleCreate = useCallback((_account: string) => {
    setCurrentAccount(_account);
    setPersonalModalVisible(true);
    ContactTrackerIns.tracker_contact_add_click();
  }, []);

  // 个人通讯录添加星标联系人
  const handleCreateMark = useCallback((source: string, _account?: string) => {
    if (_account) {
      setCurrentAccount(_account);
    }
    setPersonalMarkModalVisible(true);
    ContactTrackerIns.tracker_contact_personal_mark_add(source);
  }, []);

  // 新建邮件列表
  const handleCreateMailList = useCallback((_account: string) => {
    setCurrentAccount(_account);
    setMailListModalVisible(true);
    ContactTrackerIns.tracker_mail_list_top_click('新建邮件列表');
  }, []);

  // 新建个人分组
  const handleCreatePersonalOrg = useCallback((_account: string = systemApi.getCurrentUser()?.id || '') => {
    setCurrentAccount(_account);
    setSelectedPersonalOrgId(undefined);
    setPersonalOrgModalVisible(true);
  }, []);

  // 编辑个人分组
  const handleEditPersonalOrg = useCallback((key: string, _account: string) => {
    setCurrentAccount(_account);
    setSelectedPersonalOrgId(key);
    setPersonalOrgModalVisible(true);
  }, []);

  // 联系人组织树加载中
  const handleDataLoading = useCallback((isLoading: boolean) => {
    setListLoading(isLoading);
  }, []);

  // 批量删除联系人
  const handleDeletePersonal = useCallback(async () => {
    // accountApi.setCurrentAccount({ email: currentAccount });
    const success = await contactApi.doDeleteContact({
      accountIdList: [...checkedContacts.keys()],
      _account: currentAccount,
    });
    if (success) {
      Message.success(getIn18Text('SHANCHUCHENGGONG'));
      refreshSelectedNodeData();
      setCheckedContacts(new Map());
    } else {
      Message.error(getIn18Text('SHANCHUSHIBAI'));
    }
  }, [checkedContacts, currentAccount]);

  // 手动刷新
  const handleFetchData = useCallback(async () => {
    if (offline) {
      return false;
    }
    try {
      setRefreshAccountsCount(count => count + 1);

      // 如果有变化，会发起消息通知，所以不用主动去做reflesh
      const eventSubPromise = new Promise(resolve => {
        const $t = setTimeout(resolve, 10 * 1000);

        const eid = eventApi.registerSysEventObserver('changeCoreContactSyncStatus', {
          func: e => {
            const coreSyncStatus = lodashGet(e, 'eventData.status', 'start');

            if (coreSyncStatus !== 'cleanDone') {
              return;
            }
            $t && clearTimeout($t);
            eventApi.unregisterSysEventObserver('changeCoreContactSyncStatus', eid);
            resolve(true);
          },
          _account: systemApi.getCurrentUser()?.id || '',
        });
      });

      // 开始执行同步。核心数据删除完成之后才算是OK
      await Promise.all([eventSubPromise, syncAll(!0)]);

      return true;
    } catch (error) {
      throw new Error('Contact Sync error');
    }
  }, [offline]);

  // 获取我管理的邮件列表
  const fetchUserMailList = useCallback(async () => {
    const { success, data } = await contactApi.listUserMaillist();
    if (success && data) {
      const emailList: Set<string> = new Set();
      const editEmails: Set<string> = new Set();
      const deleteEmails: Set<string> = new Set();
      data.forEach(item => {
        const email = [item.account_name, item.domain].join('@');
        emailList.add(email);
        if (item.maintainer_type === 1) {
          editEmails.add(email);
          deleteEmails.add(email);
        }
        if (item.maintainer_type === 2) {
          editEmails.add(email);
        }
      });
      if (emailList.size === 0) {
        setActiveMailListType('all');
      }
      setManageEmails(emailList);
      setEditManageEmails(editEmails);
      setDeleteManageEmails(deleteEmails);
      return {
        updated: [...new Set([...editEmails, ...deleteEmails])],
        all: [...emailList],
      };
    }
    return [];
  }, []);

  // 节流初始化 邮件列表
  const maillistInit = useCallback(
    debounce(() => {
      try {
        Promise.all([reqMaillistConfig(), fetchUserMailList()]).then(resArr => {
          if (resArr && resArr[0] && resArr[1]) {
            const { maillist_config } = resArr[0];
            const { create_maillist, has_maillist_quota } = maillist_config;
            const createAble = !!create_maillist && !!has_maillist_quota;
            const manageAble = resArr[1].length > 0;
            let permission = '';
            if (createAble && manageAble) permission = '管理+新建权限';
            if (!createAble && manageAble) permission = '仅管理权限';
            if (createAble && !manageAble) permission = '仅新建权限';
            if (!createAble && !manageAble) permission = '无管理和新建权限';
            ContactTrackerIns.tracker_mail_list_view(permission);
          }
        });
      } catch (error) {
        console.log('查看邮件列表埋点错误', error);
      }
    }, 500),
    []
  );

  // 邮件列表下切换Tab（所有 我管理的）
  const onMyManagerEmails = useCallback((params: { type: MailListKeyType }) => {
    const { type } = params;
    setActiveMailListType(type);
  }, []);

  // 联系人组织树点击回调
  const handleContactTreeSelectNode = useCallback((selectedNode: ContactTreeNode, _account: string) => {
    setCurrentAccount(_account);
    setSelectedDataNode(selectedNode);
  }, []);

  // 更新选中的树节点数据
  const refreshSelectedNodeData = useCreateCallbackForEvent(
    debounce((dataNode?: ContactTreeNode) => {
      console.warn('[debounce] refreshSelectedNodeData', dataNode, selectedDataNode);
      contactTreeRef.current?.onSelectNode(dataNode || selectedDataNode, currentAccount);
      if (isMailList && manageEmails.size && activeMailListType === 'manager') {
        // 先更新邮件列表 更新之后不管我管理的邮件列表变更都拉一次详情信息(详情变更)
        fetchUserMailList().then(() => {
          setMaillistsizetimestamp(Date.now());
        });
      }
    }, 1000)
  );

  // 是否是主账号
  const isMain = isMainAccount(currentAccount);

  // 是否展示个人头部
  const visiblePersonal = useMemo(() => Boolean(!searchValue && selectedDataNode.nodeType === 'personal'), [searchValue, selectedDataNode]);

  const isPersonalNoGroup = selectedDataNode.key === StaticNodeKey.PERSON_NO_GROUP;

  // 展示无个人数据
  const visibleNoPersonalData = useMemo(() => {
    return visiblePersonal && !Boolean(visiblePersonal && displayContactList?.length);
  }, [visiblePersonal, displayContactList?.length]);

  // 暂无企业数据
  const visibleNoEnterpriseData = useMemo(() => selectedDataNode.nodeType === 'enterprise' && !displayContactList?.length, [selectedDataNode, displayContactList]);

  // 展示侧边批量操作栏
  const visibleContactMultPanel = useMemo(() => {
    return checkedContacts?.size > 0;
  }, [checkedContacts]);

  // 展示联系人列表
  const visibleList = useMemo(() => {
    const visibleSearchList = searchValue && displayContactList?.length;
    const visiblePersonalList = Boolean(visiblePersonal && displayContactList?.length);
    const visibleEnterpriseList = Boolean(displayContactList?.length);
    return visibleSearchList || visibleEnterpriseList || visiblePersonalList;
  }, [visiblePersonal, searchValue, displayContactList]);

  // 列表空数据文案
  const listEmptyTxt = useMemo(() => {
    if (!!searchValue) {
      return getIn18Text('WUFUHETIAOJIAN');
    }
    if (selectedDataNode.nodeType === 'enterprise') {
      return getIn18Text('ZANWULIANXIREN');
    }
    if (selectedDataNode.nodeType === 'personal') {
      if (selectedDataNode.key === StaticNodeKey.PERSON_MARK_LIST) {
        return getIn18Text('noMarkContact');
      }
      return getIn18Text('ZANWUZUCHENGYUAN11');
    }
    return getIn18Text('ZANWULIANXIREN');
  }, [selectedDataNode, searchValue]);

  // 空状态的文案
  const emptyTxt = useMemo(() => {
    let str = '';
    if (searchValue) {
      str = getIn18Text('WUFUHETIAOJIAN');
    } else if (visibleNoPersonalData) {
      str = getIn18Text('ZANWUZUCHENGYUAN');
    } else {
      str = getIn18Text('ZANWULIANXIREN');
    }
    return str;
  }, [searchValue, visibleNoPersonalData]);

  // 选中的节点的key
  const selectedNodeKey = selectedDataNode.key;

  const isSelectedPersoanlMark = selectedNodeKey === StaticNodeKey.PERSON_MARK_LIST;

  // 是否展示星标联系人排序提示
  const visiblePersonalMarkTip = isSelectedPersoanlMark && personalMarkSortTip && displayContactList?.length > 1;

  // 是否展示头部的添加联系人按钮
  const visibleAddPersonal = visiblePersonal && selectedNodeKey === StaticNodeKey.PERSON_ALL;

  // 是否展示头部的编辑分组按钮
  const visibleAddPersonalOrg =
    visiblePersonal && ![StaticNodeKey.PERSON_NO_GROUP, StaticNodeKey.PERSON_ALL, StaticNodeKey.PERSON_MARK_LIST].includes(selectedNodeKey as any);

  // 是否展示头部的添加星标联系人/分组按钮
  const visibleAddPersonalMark = visiblePersonal && isSelectedPersoanlMark;

  // 导入导出按钮
  const visibleImportBtn = visiblePersonal && ![StaticNodeKey.PERSON_NO_GROUP, StaticNodeKey.PERSON_MARK_LIST].includes(selectedNodeKey as any);

  // 是否展示联系人头部
  const visiblePersonalHeader = visibleAddPersonal || visibleAddPersonalOrg || visibleAddPersonalMark || visibleImportBtn;

  // 是否展示批量选中的分组按钮
  const visiblePersonalEdit = selectedNodeKey?.startsWith('personal') && !isSelectedPersoanlMark;

  // 是否展示批量选中的删除按钮
  const visiblePersonalDelete = selectedNodeKey?.startsWith('personal') && !isSelectedPersoanlMark;

  // 通讯录列表空余的高度
  const listPlaceholderHeight = !!searchValue
    ? defaultlPlaceholderHeight
    : ((visiblePersonalHeader || isMailList) && !checkedContacts?.size ? 60 : defaultlPlaceholderHeight) + (visiblePersonalMarkTip ? 76 : 0);

  // 无数据展示
  const emptyContent = useMemo(() => {
    const PersonalMarkEmptyContent = (
      <div className={styles.personalMarkEmptyWrap}>
        <div className={styles.image}></div>
        <div className={styles.title}>{getIn18Text('markContactEmptyTitle')}</div>
        <div className={styles.content}>
          <div>{getIn18Text('markContactEmptyContent')}</div>
          <div>{getIn18Text('markContactEmptyContent2')}</div>
        </div>
        <div className={styles.btn} onClick={() => handleCreateMark('通讯录模块-星标联系人空白页')}>
          {getIn18Text('addMarkContactAndOrg')}
        </div>
      </div>
    );
    const commonEmptyContent = (
      <Empty
        text={emptyTxt}
        imgClassName={visibleNoPersonalData ? 'sirius-empty-future' : ''}
        // onRefresh={searchValue ? undefined : handleFetchData}
        renderContent={() => {
          if (selectedDataNode.nodeType === 'enterprise' || searchValue) {
            return null;
          }
          return (
            <button style={{ marginTop: 8 }} className={styles.createBtn} onClick={() => handleCreate(currentAccount)} type="button">
              <PlusIcon className="dark-invert" />
              <span style={{ fontSize: 14, paddingLeft: 8 }}>{getIn18Text('XINJIANLIANXIREN')}</span>
            </button>
          );
        }}
      />
    );
    return isSelectedPersoanlMark ? PersonalMarkEmptyContent : commonEmptyContent;
  }, [isSelectedPersoanlMark, visibleNoPersonalData, selectedDataNode, searchValue, currentAccount]);

  return (
    /** 页面内容外出包裹PageContentLayout组件 */
    <>
      <PageContentLayout allowDark from="contact" className={`${systemApi.isWebWmEntry() && styles.pageContentWm}`}>
        {/* 内层用SideContentLayout包裹 */}
        <SideContentLayout
          borderRight
          minWidth={FIR_SIDE}
          className={`${styles.contactTreeContainer} web-contack-contact-tree-container`}
          defaultWidth={defaultFolderWidth}
          onResize={debounceResizeContactFolder}
        >
          <NetWatcher />
          <div className={`${styles.searchContainer} search-container`}>
            <InputContextMenu inputOutRef={searchInputRef}>
              <LxInput
                maxLength={100}
                className="sirius-no-drag"
                max={100}
                ref={searchInputRef}
                onFocus={() => {
                  ContactTrackerIns.tracker_contact_search_focus();
                }}
                data-test-id="contact_search_input"
                placeholder={getIn18Text('SOUSUOLIANXIREN')}
                onChange={handleSearch}
                prefix={<div className={`dark-invert searchIcon ${styles.searchIcon}`} />}
                allowClear
              />
            </InputContextMenu>
            <SyncLoading sync={handleFetchData} />
          </div>
          <div className={classnames(styles.contactTreeList, { [styles.contactTreeListOffline]: offline })}>
            {searchValue ? <p className={styles.contactTreeListSearchingTag}>{getIn18Text('SOUSUOJIEGUO')}</p> : ''}
            <ContactTree
              ref={contactTreeRef}
              searchValue={searchValue}
              defaultSelectedDataNode={treeDefaultSelectedDataNode}
              refreshAccountsCount={refreshAccountsCount}
              handleCreate={handleCreate}
              handleCreateMark={account => handleCreateMark('个人通讯录添加星标联系人', account)}
              handleDataLoading={handleDataLoading}
              handleEditPersonalOrg={handleEditPersonalOrg}
              handleCreatePersonalOrg={handleCreatePersonalOrg}
              handleSelectedDataNode={handleContactTreeSelectNode}
              handleContactListChange={handleContactListChange}
              handleVisibleImportModal={() => {
                setVisibleImportContact(true);
                setImportSelectType('import');
              }}
              handleVisibleExportModal={() => {
                setVisibleImportContact(true);
                setImportSelectType('export');
              }}
            />
          </div>
        </SideContentLayout>

        <SideContentLayout
          minWidth={SEC_SIDE}
          borderRight
          // component={StickyContainer}
          style={{
            display: 'block',
          }}
          className={styles.listLayout}
          defaultWidth={defaultListWidth}
          onResize={debounceResizeContactList}
        >
          {
            /** 展示各种列表头部 */
            !searchValue && (
              <>
                {/* 个人头部 */}
                {visiblePersonal && !isPersonalNoGroup && (
                  <div className={styles.fixHeader}>
                    <div className={styles.headerLeft}>
                      {visibleAddPersonal && (
                        <div className={styles.addBtn} data-test-id="contact_list_btn_add" onClick={() => handleCreate(currentAccount)}>
                          <i></i>
                          <span>{getIn18Text('XINJIANLIANXIREN')}</span>
                        </div>
                      )}
                      {visibleAddPersonalOrg && (
                        <div
                          className={styles.addBtn}
                          data-test-id="contact_list_btn_addPersonalOrg"
                          onClick={() => {
                            setSelectedPersonalOrgId(selectedDataNode.key);
                            setPersonalOrgModalVisible(true);
                          }}
                        >
                          <i></i>
                          <span>{getIn18Text('TIANJIAZUCHENGYUAN')}</span>
                        </div>
                      )}
                      {visibleAddPersonalMark && isMain && (
                        <div
                          data-test-id="contact_list_btn_addMark"
                          className={styles.addBtn}
                          onClick={() => {
                            handleCreateMark('星标联系人列表添加按钮');
                          }}
                        >
                          <i></i>
                          <span>{getIn18Text('TIANJIA')}</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.headerRight}>
                      {visibleImportBtn && isMain && (
                        <ImportSelect
                          onSelect={type => {
                            setVisibleImportContact(true);
                            setImportSelectType(type);
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
                {/** 星标联系人提示 */}
                {visiblePersonalMarkTip && (
                  <div className={styles.sortTip}>
                    <div
                      className={styles.sortTipClose}
                      onClick={e => {
                        e.stopPropagation();
                        storeApi.putSync(CONTACT_LIST_PERSONAL_MARK_TIP, 'true');
                        setPersonalMarkSortTip(false);
                      }}
                    />
                    <span>{getIn18Text('mouseMove')}</span>
                    <i className={styles.sortIcon}></i>
                    <span>{getIn18Text('markSortTip')}</span>
                  </div>
                )}
                {/* 邮件列表头部 */}
                {isMailList && (
                  <>
                    {/* 占位 */}
                    <div className={classnames([styles.fixHeader, styles.mailListHeader])}>
                      <ContactMaillistHeader onMyManagerEmails={onMyManagerEmails} visible={manageEmails.size > 0} activeKey={activeMailListType} />
                      {showNewMailListButton && (
                        <div className={styles.addBtn} data-test-id="contact_list_btn_addMailList" onClick={() => handleCreateMailList(currentAccount)}>
                          <i></i>
                          <span>{getIn18Text('XINJIANYOUJIANLIEBIAO')}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )
          }

          {/* 展示成员列表 */}
          <ContactOrgList
            loading={listLoading}
            hidden={!visibleList}
            onCheckItem={(item, all) => {
              setCheckedContacts(new Map(all));
            }}
            onCheckAll={all => {
              setCheckedContacts(new Map(all));
            }}
            onSelectItem={item => {
              setSelectedContact(item as ContactItem);
            }}
            onMarked={(marked: boolean) => {
              ContactTrackerIns.tracker_contact_personal_mark_startIcon_click('通讯录-联系人列表标星', marked);
            }}
            checkedData={checkedContacts}
            // ref={contactListRef}
            width={listWidth}
            height={listHeight}
            placeholderHeight={listPlaceholderHeight}
            selectedData={selectedContact}
            searchValue={searchValue}
            data={displayContactList}
            visibleSort={isSelectedPersoanlMark}
          />

          {/* 无个人分组成员展示 */}
          <div className={styles.noPersonalData} hidden={displayContactList?.length > 0}>
            {listEmptyTxt}
          </div>
        </SideContentLayout>

        {/* 无数据展示 */}
        {displayContactList.length === 0 && !selectedContact && emptyContent}

        {/* ContactDetail 详情 */}
        {visibleContactMultPanel && (
          <ContactMultOperPanel
            checkedContacts={checkedContacts}
            visiblePersonalEdit={visiblePersonalEdit}
            visiblePersonalDelete={visiblePersonalDelete}
            visiblePersonalMarkCancel={visibleAddPersonalMark}
            handleDeletePersonal={handleDeletePersonal}
            handlePersonalGroup={() => {
              setVisibleChoosePersonalGroup(true);
              // refreshSelectedNodeData();
            }}
          />
        )}
        {selectedContact && !visibleContactMultPanel && (
          <div
            className={styles.contactDetailBox + ' sirius-scroll'}
            style={{
              // todo 可能会改 根据整体大小计算
              // minWidth: 500,
              minWidth: 345,
              height: '100%',
            }}
          >
            <Skeleton active loading={listLoading} avatar>
              <ContactDetail
                _account={currentAccount}
                onOperateSuccess={() => {
                  if (!searchValue) {
                    refreshSelectedNodeData();
                  } else {
                    contactTreeRef.current?.debounceSearch(searchValue);
                  }
                }}
                contactId={selectedContact.id}
                isMailList={isMailList}
                isSelectedPersoanlMark={isSelectedPersoanlMark}
                isDeleteManageMailList={isDeleteManageMailList}
                isEditManageMailList={isEditManageMailList}
                from="contact"
                branch
                containerStyle={{ paddingTop: 120, width: 430 }}
              />
            </Skeleton>
          </div>
        )}
      </PageContentLayout>
      {personalOrgModalVisible && (
        <PersonalOrgModal
          personalOrgId={selectedPersonalOrgId}
          _account={currentAccount}
          onCancel={() => setPersonalOrgModalVisible(false)}
          onSure={onPersonalOrgConfirm}
        />
      )}
      {visibleChoosePersonalGroup && (
        <ChooseGroupModal
          confirmCallback={async orgIds => {
            const idList = checkedContacts.keys();
            // accountApi.setCurrentAccount({ email: currentAccount });
            const { success, message } = await contactApi.doInsertContactByPersonalOrgId({
              // orgIds, [...idList]
              orgIdList: orgIds,
              idList: [...idList],
              _account: currentAccount,
            });
            setVisibleChoosePersonalGroup(false);
            if (success) {
              Message.success(getIn18Text('FENZUCHENGGONG'));
              setCheckedContacts(new Map());
            } else {
              Message.error(message || getIn18Text('FENZUSHIBAI'));
            }
          }}
          cancelCallback={() => {
            setVisibleChoosePersonalGroup(false);
          }}
          disableOrgIds={selectedNodeKey ? [selectedNodeKey] : []}
          _account={currentAccount}
        />
      )}
      {personalModalVisible && (
        <PersonalModal
          _account={currentAccount}
          onCancel={() => {
            setPersonalModalVisible(false);
          }}
          onSuccess={item => {
            setPersonalModalVisible(false);
            refreshSelectedNodeData();
          }}
        />
      )}
      {personalMarkModalVisible && (
        <PersonalMarkModalProps
          _account={currentAccount}
          onCancel={() => {
            setPersonalMarkModalVisible(false);
          }}
          onSure={() => {
            setPersonalMarkModalVisible(false);
            refreshSelectedNodeData(personalMarkNode);
          }}
        />
      )}
      {visibleImportContact && (
        <ContactImportModal
          onClose={success => {
            setVisibleImportContact(false);
            if (success) {
              refreshSelectedNodeData();
            }
          }}
          type={importSelectType}
        />
      )}
      {mailListModalVisible && (
        <MailListModal
          purpose="create"
          onCancel={() => setMailListModalVisible(false)}
          onSuccess={() => {
            setMailListModalVisible(false);
            refreshSelectedNodeData();
          }}
        />
      )}
    </>
  );
};
export default Contact;
