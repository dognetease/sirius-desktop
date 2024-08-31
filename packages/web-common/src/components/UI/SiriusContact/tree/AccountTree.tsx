import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ContactOrgItem,
  ContactTreeDataNode,
  ContactTreeLeaf,
  ContactTreeNode,
  getContactItemKey,
  getSelectedItemBySelectOrg,
  getTeamMembers,
  getTeams,
  isOrg,
  SelectedContactMap,
  SelectedContactOrgMap,
  transContactModel2ContactItem,
  transEntityOrg2OrgItem,
  transOrgItem2TreeNode,
  transTreeLeaf,
  transTreeNode,
} from '@web-common/components/util/contact';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import useMsgCallback from '@web-common/hooks/useMsgCallback';
import { selectBtnNameMap } from '@web-common/components/UI/SiriusContact/tree/BaseTree';
import {
  AccountApi,
  AccountNameAndContactName,
  api,
  apis,
  ContactAndOrgApi,
  ContactItem,
  ContactTreeType,
  EntityOrgTeamContact,
  EntityTeamOrg,
  OrgModel2,
  ProductTagEnum,
  recentContactListRes,
  syncRes,
  util,
  EntityOrg,
  ContactPersonalMarkNotifyEventData,
  LoggerApi,
  DataTrackerApi,
  CustomerMapChangeEvent,
} from 'api';
import { getValidEmail, StaticNodeKey, StaticRootNodeKey, updateOrgTreeData } from '@web-common/utils/contact_util';
import useContactItemEffect from '../useContactItemEffect';
import styles from './index.module.scss';
import classnames from 'classnames';
// @ts-ignore
import MemberList from '@web-contact/component/MemberList/MemberList';
// @ts-ignore
import Tree from '@web-mail/common/components/VListTree/VListTree';
import { Space, Tooltip, Button, Skeleton } from 'antd';
import Checkbox from '../Checkbox';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import ProductAuthTag from '@web-common/components/UI/ProductAuthTag/ProductAuthTag';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined';
import MailMainIcon from '@web-common/components/UI/Icons/svgs/MailMain';
import Mail163Icon from '@web-common/images/mail_163.png';
import MailQqIcon from '@web-common/images/mail_qq.png';
import MailOutlookIcon from '@web-common/images/mail_outlook.png';
import MailQiyeQQIcon from '@web-common/images/mail_qiye_qq.png';
import MailGmailIcon from '@web-common/images/mail_gmail.png';
import MailOtherIcon from '@web-common/components/UI/Icons/svgs/MailOther';
import PersonalMark from '@web-common/components/UI/SiriusContact/personalMark/mark';
import { transTreeName, ContactTreeAccountProp, isCurrentUser, treeTypeMap, ContactTreeDecorateProp } from './data';
import lodashGet from 'lodash/get';
import debounce from 'lodash/debounce';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { doGetMyCustomerListFromReducer } from '@web-common/state/reducer/contactReducer';
import { useMyCustomerListCallback } from '@web-common/hooks/useContactModel';

/**
 * 客户树
 * @param props
 * @constructor
 */
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const sysApi = api.getSystemApi();
const loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as LoggerApi;
const dataTrackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const loadTimeout = 3 * 1000;

// 多账号的账号icon
const mailIconList = new Map([
  ['NeteaseQiYeMail', <MailMainIcon />],
  ['163Mail', <img style={{ width: 16, height: 16 }} src={Mail163Icon} />],
  ['Gmail', <img src={MailGmailIcon} style={{ objectFit: 'contain', width: 16, height: 16 }} />],
  ['Outlook', <img src={MailOutlookIcon} style={{ width: 16, height: 16 }} />],
  ['TencentQiye', <img src={MailQiyeQQIcon} style={{ width: 16, height: 16 }} />],
  ['QQMail', <img style={{ width: 16, height: 16 }} src={MailQqIcon} />],
  ['Others', <MailOtherIcon />],
]);

// 初始化的树数据
const initTreeDataMap: treeTypeMap = {
  customer: [
    {
      key: StaticRootNodeKey.CUSTOMER,
      nodeType: 'customer',
      title: transTreeName('customer'),
      isLeaf: false,
      isOrg: true,
      children: [],
    },
  ],
  personal: [
    {
      key: StaticRootNodeKey.PERSON,
      nodeType: 'personal',
      title: transTreeName('personal'),
      isLeaf: false,
      isOrg: true,
      children: [],
    },
  ],
  enterprise: [
    {
      key: StaticRootNodeKey.ENTERPRISE,
      title: transTreeName('enterprise'),
      isLeaf: false,
      isOrg: true,
      nodeType: 'enterprise',
      children: [],
    },
  ],
  team: [
    {
      key: StaticRootNodeKey.TEAM,
      nodeType: 'team',
      isOrg: true,
      title: transTreeName('team'),
      isLeaf: false,
      children: [],
    },
  ],
  recent: [
    {
      key: StaticRootNodeKey.RECENT,
      nodeType: 'recent',
      isOrg: true,
      title: transTreeName('recent'),
      isLeaf: false,
      children: [],
    },
  ],
};

// 返回根节点树的装饰器内容
const renderRootKeyPrefix = (keys: string[], renderMap: ContactTreeDecorateProp) => {};

// 通过树节点key找到对应的节点
const getNodeDataByKey = (data: ContactTreeDataNode[], key: string) => {
  let res: ContactTreeDataNode | undefined;
  data.forEach(item => {
    if (!res) {
      if (item.key === key) {
        res = item;
      } else if (item.children) {
        res = getNodeDataByKey(item.children as ContactTreeDataNode[], key);
      }
    }
  });
  return res;
};

/**
 * 将各项类型数据处理成树结构
 */
const transTreeMap2TreeData = (treeDataMap: treeTypeMap, order: ContactTreeType[]): ContactTreeDataNode[] => {
  let arr: ContactTreeDataNode[] = [];
  order.forEach(item => {
    const curTreeData = treeDataMap[item];
    arr = arr.concat(curTreeData || []);
  });
  return arr;
};

export const treeRootKey: string[] = [
  StaticRootNodeKey.ENTERPRISE,
  StaticRootNodeKey.PERSON,
  StaticRootNodeKey.TEAM,
  StaticRootNodeKey.RECENT,
  StaticRootNodeKey.CUSTOMER,
];

const personalMarkKeyBlackList: string[] = [StaticRootNodeKey.PERSON, StaticNodeKey.PERSON_ALL, StaticNodeKey.PERSON_MARK_LIST, StaticNodeKey.PERSON_NO_GROUP];

/**
 * 账号树
 * @param props
 * @constructor
 */
const AccountTree: React.FC<ContactTreeAccountProp> = props => {
  const {
    treeWidth,
    treeHeight,
    accountRootKey,
    _account,
    rootTitle,
    onContactSelect,
    defaultSelectList = [],
    disableCheckList: defaultDisableCheckList,
    multiple,
    isIM = true,
    showAddOrgBtn,
    showAddTeamBtn,
    showAddPersonalBtn,
    showMailListEye,
    showPersonalMark,
    showNoDataPlaceholder,
    onExpand,
    onSelectNode,
    onInited,
    onMarked,
    onContextMenu,
    activeAccountKey,
    showContact = true,
    showAvatar = true,
    showCheckbox = true,
    type = ['personal', 'enterprise', 'team', 'recent'],
    order = ['customer', 'recent', 'personal', 'team', 'enterprise'],
    useContactId,
    useOrgUnit,
    excludeSelf = false,
    accountType,
    defaultExpandedKeys,
    noRelateEnterprise,
    isSingleAccount = true,
    isMainAccount,
    titleRenderMap,
    selectDefaultNodeOnInited,
    renderTitleSuffix,
    contactTreeDecorateMap,
    selectedKeys = [],
    showOrgMemberNum = false,
  } = props;

  /**
   * 根节点，不能被有填入组织属性
   */
  const rootKey = useMemo(() => {
    const keys: string[] = [...treeRootKey];
    if (accountRootKey) {
      keys.push(accountRootKey);
    }
    return keys;
  }, [accountRootKey]);

  /**
   * 根据type控制默认展示的树的数据
   */
  const defaultTreeDataMap: treeTypeMap = useMemo(() => {
    return type.reduce((ret, item) => {
      ret[item] = initTreeDataMap[item];
      return ret;
    }, {} as treeTypeMap);
  }, [type]);

  // 各个类型的树的数据集合（‘customer’, 'enterprise', 'personal', 'recent', 'team'）
  const [treeDataMap, setTreeDataMap] = useState<treeTypeMap>(defaultTreeDataMap);
  // 企业组织的数据集合
  const [orgModel, setOrgModel] = useState<OrgModel2>();
  // 个人分组的数据集合
  const [personalOrgMap, setPersonalOrgMap] = useState<Map<string, SelectedContactOrgMap>>(new Map());
  // 多选情况下已经选中的联系人集合
  const [selectedMap, setSelectedMap] = useState<SelectedContactOrgMap>(new Map());
  // 多选情况下不可选中的联系人集合
  const [disabledMap, setDisabledMap] = useState<SelectedContactOrgMap>(new Map());
  // 初始化加载数据的loading
  const [loading, setLoading] = useState<boolean>(true);
  // 选中组织loading
  const [selectOrgLoading, setSelectOrgLoading] = useState<boolean>(false);
  // 是否可以展示邮件列表的成员列表
  const [showMemberList, setShowMemberList] = useState(false);
  // 选中的邮件列表邮箱
  const [currentContact, setCurrentContact] = useState<ContactItem>();
  // 已经展开的节点
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const _defaultExpandedKeys = useMemo(() => {
    return defaultExpandedKeys || (isIM && isSingleAccount ? [StaticRootNodeKey.ENTERPRISE] : []);
  }, []);

  const [decorateRenderMap, setDecorateRenderMap] = useState<ContactTreeDecorateProp>(contactTreeDecorateMap || new Map());

  // 我的客户id列表
  const [customerIdList, setCustomerIdList] = useState<string[]>([]);
  // 我的客户列表是否可以加载
  const [customerLoadMore, setCustomerLoadMore] = useState<boolean>(true);

  // 我的客户列表最后的id
  const customerListLastId = customerIdList[customerIdList.length - 1];

  // 分页加载我的客户列表
  const loadCustomerData = useCallback(
    async (reset?: boolean) => {
      const lastId = reset ? '0' : customerListLastId;
      const { loadMore, idList } = await doGetMyCustomerListFromReducer({ lastId, limit: 30 });
      setCustomerIdList(originIdList => (reset ? [...idList] : [...originIdList, ...idList]));
      setCustomerLoadMore(loadMore);
    },
    [customerListLastId]
  );

  // 通过reducer获取我的客户列表详情
  useMyCustomerListCallback(customerIdList, customerList => {
    const customerChildren = customerList.map(item => {
      const currentChildren = item.contactList.reduce((arr, current) => {
        if (current) {
          const currentItem: ContactItem = {
            name: current.name || current.email,
            email: current.email,
            id: current.id,
            type: 'customer',
            customerRole: 'myCustomer',
          };
          arr.push(transTreeLeaf({ item: currentItem }));
        }
        return arr;
      }, [] as ContactTreeLeaf[]);
      return {
        ...transTreeNode(item, !showContact),
        children: currentChildren,
      };
    });
    trackerLoadDataLog('customer', customerList?.length);
    updateTreeMap(
      'customer',
      [
        {
          key: StaticRootNodeKey.CUSTOMER,
          nodeType: 'customer',
          title: transTreeName('customer'),
          isLeaf: false,
          isOrg: true,
          children: customerChildren,
          hasMore: customerLoadMore,
        },
      ] as ContactTreeNode[],
      false
    );
  });

  const trackerLoadDataError = useCallback(
    (treeType: string, message?: string) => {
      dataTrackerApi.track('contact_tree_load_data_error', {
        treeType,
        _account,
        message,
      });
    },
    [_account]
  );

  const trackerLoadDataLog = useCallback(
    (treeType: string, count?: number) => {
      loggerApi.track('contact_tree_load_data', {
        treeType,
        count,
        _account,
      });
    },
    [_account]
  );

  /**
   * 转换联系人结构
   * @param contactList
   */
  const transPersonalTree = (params: { item: ContactItem; parentKey?: string; useContactId?: boolean }): ContactTreeDataNode => {
    const { item, parentKey, useContactId } = params;
    const { id, name, type, emailList } = item;
    if (!useContactId && emailList && emailList.length > 1) {
      return {
        key: 'personal_info_' + (parentKey ? parentKey + '_' : '') + id,
        title: name,
        isLeaf: false,
        isOrg: true,
        nodeType: 'personal_info',
        children: emailList.map(_email => {
          return {
            key: id + '&' + _email,
            title: _email,
            isLeaf: true,
            isOrg: false,
            data: {
              id,
              type,
              email: _email,
              name: _email,
            },
            nodeType: type,
          } as ContactTreeLeaf;
        }),
      };
    }
    return transTreeLeaf({ item, parentKey });
  };

  /**
   * 最近联系人排序
   * @param value
   * @returns
   */
  const getRecentDataByOrder = async (value: AccountNameAndContactName[]) => {
    const emails = value.map(item => {
      return item.accountName;
    });
    const contactModelMap = await contactApi.doGetContactByEmail({ emails, _account });
    const res: ContactItem[] = [];
    value.forEach(item => {
      const modelList = contactModelMap[item.accountName];
      if (modelList?.length) {
        let model: ContactItem | undefined;
        modelList.forEach(itemModel => {
          const cur = transContactModel2ContactItem(itemModel);
          if (model) {
            model = getValidEmail(model, cur);
          } else {
            model = cur;
          }
        });
        if (model) {
          res.push(model);
        } else {
          res.push({
            name: item.contactName,
            email: item.accountName,
            type: 'external',
          });
        }
      } else {
        res.push({
          name: item.contactName,
          email: item.accountName,
          type: 'external',
        });
      }
    });
    return res;
  };

  /**
   * 获取最近联系人列表
   * @param result
   * @param force
   * @returns
   */
  const getRecentContactList = async (result?: recentContactListRes[], force?: boolean) => {
    // result 本地远端diff后，如果需要更新，会直接返回最新的list，不需要再次请求接口
    let resData: recentContactListRes[];
    if (result) {
      resData = result;
    } else {
      // accountApi.setCurrentAccount({ email: _account });
      resData = await contactApi.getRecentContactList(
        {
          page: 1,
          pageSize: 10,
          conditionType: 1,
          contactType: 1,
          _account,
        },
        force
      );
    }
    if (!resData || resData.length === 0) return [];
    const value: AccountNameAndContactName[] = [];
    resData.forEach(send => {
      value.push({
        accountName: send.email,
        contactName: send.nickname || '',
      });
    });
    const recentData = await getRecentDataByOrder(value);
    const recentChildren: ContactTreeLeaf[] = recentData.map(item => ({
      key: item.email,
      nodeType: 'recent',
      isLeaf: true,
      isOrg: false,
      title: item.name,
      data: item,
    }));
    return recentChildren;
  };

  const initPersonalOrgList = async () => {
    try {
      const { success, data, message } = await contactApi.doGetPersonalOrg({ _account });
      if (success && data?.length) {
        return data;
      }
      if (message) {
        trackerLoadDataError('personalOrgList', getStringMsg(message));
      }
    } catch (e) {
      trackerLoadDataError('personalOrgList', getStringMsg(e));
    }
    return [];
  };

  const getStringMsg = (e: unknown) => {
    let ret;
    if (typeof e === 'string') {
      ret = e;
    } else if ((e as Error).message && typeof (e as Error).message === 'string') {
      ret = (e as Error).message;
    } else {
      ret = 'unknown';
    }
    return ret;
  };

  /**
   * 获取个人分组列表
   */
  const initPersonalList = async () => {
    let groupMap = new Map<string, SelectedContactOrgMap>();
    try {
      const list = await contactApi.doGetPersonalContact({ _account, needLog: true });
      trackerLoadDataLog('personalList', list?.length);
      setPersonalOrgMap(_oldMap => {
        const personalMarkList = _oldMap.get(StaticNodeKey.PERSON_MARK_LIST) || new Map();
        list?.forEach(item => {
          const { personalOrg, id } = item.contact;
          const contactItem = transContactModel2ContactItem(item);
          const allMap: SelectedContactOrgMap = groupMap.get(StaticNodeKey.PERSON_ALL) || new Map();
          allMap.set(id, contactItem);
          groupMap.set(StaticNodeKey.PERSON_ALL, allMap);
          if (personalOrg?.length) {
            personalOrg.forEach(personalOrgId => {
              const idMap = groupMap.get(personalOrgId) || new Map<string, ContactItem>();
              idMap.set(id, contactItem);
              groupMap.set(personalOrgId, idMap);
            });
          } else {
            const noGroupIdSet = groupMap.get(StaticNodeKey.PERSON_NO_GROUP) || new Map<string, ContactItem>();
            noGroupIdSet.set(id, contactItem);
            groupMap.set(StaticNodeKey.PERSON_NO_GROUP, noGroupIdSet);
          }
        });
        groupMap.set(StaticNodeKey.PERSON_MARK_LIST, personalMarkList);
        return groupMap;
      });
    } catch (e) {
      trackerLoadDataError('personalList', getStringMsg(e));
    }
    return groupMap;
  };

  // 个人通讯录星标列表
  const initPersonalMarkList = useCallback(async () => {
    let list: ContactOrgItem[] = [];
    try {
      if (showPersonalMark) {
        list = await contactApi.doGetContactPersonalMarkList();
        trackerLoadDataLog('personalMarkList', list.length);
        setPersonalOrgMap(_data => {
          const m = new Map();
          list.forEach(item => {
            item.id && m.set(item.id, item);
          });
          _data.set(StaticNodeKey.PERSON_MARK_LIST, m);
          return _data;
        });
      }
    } catch (e) {
      trackerLoadDataError('personalMarkList', getStringMsg(e));
    }
    return list;
  }, [showPersonalMark]);

  /**
   * 获取个人通讯录数据
   */
  const initPersonal = async (updateLoadKeys?: boolean) => {
    let children: ContactTreeNode[] = [];
    try {
      const [personalOrgList, groupMap] = await Promise.all([initPersonalOrgList(), initPersonalList(), initPersonalMarkList()]);
      // 加入个人分组列表节点以及children
      if (personalOrgList?.length) {
        const personalOrgChildren = personalOrgList.map(item => {
          const node = transTreeNode(item, !showContact);
          const nodeChildren = groupMap.get(node.key);
          // 个人分组节点下面加上对应的联系人（children）
          if (nodeChildren?.size && showContact) {
            node.children = [...nodeChildren.values()].map(leaf => {
              return transPersonalTree({ item: leaf as ContactItem, useContactId, parentKey: node.key });
            });
          }
          return node;
        });
        children = children.concat(personalOrgChildren);
      }
      const allPersonalChildren: ContactTreeDataNode[] = [];
      const allPerosnalMap = groupMap.get(StaticNodeKey.PERSON_ALL);
      const allPersonalSize = allPerosnalMap?.size || 0;
      if (allPersonalSize && showContact) {
        allPerosnalMap?.forEach(leaf => {
          if (!(excludeSelf && isCurrentUser(leaf as ContactItem))) {
            allPersonalChildren.push(transPersonalTree({ item: leaf as ContactItem, parentKey: StaticNodeKey.PERSON_ALL, useContactId }));
          }
        });
      }
      // 加入个人的所有联系人分组
      children.unshift({
        key: StaticNodeKey.PERSON_ALL,
        title: transTreeName('allPersonal'),
        isLeaf: !showContact && allPersonalChildren.length === 0,
        nodeType: 'personal',
        isOrg: true,
        children: allPersonalChildren,
      });
      const noGroupPerosnalMap = groupMap.get(StaticNodeKey.PERSON_NO_GROUP);
      const noGroupSize = noGroupPerosnalMap?.size || 0;
      // 加入个人的无分组以及联系人（children）
      if (noGroupPerosnalMap && noGroupSize && noGroupSize !== allPersonalSize) {
        let noGroupPersonalChildren: ContactTreeDataNode[] = [];
        // 加入个人的无分组联系人（children）
        if (showContact) {
          noGroupPersonalChildren = [...noGroupPerosnalMap.values()].map(leaf => {
            return transPersonalTree({ item: leaf as ContactItem, useContactId, parentKey: StaticNodeKey.PERSON_NO_GROUP });
          });
        }
        children.push({
          key: StaticNodeKey.PERSON_NO_GROUP,
          title: transTreeName('noGroupPersonal'),
          isLeaf: !showContact && noGroupPersonalChildren.length === 0,
          nodeType: 'personal',
          isOrg: true,
          children: noGroupPersonalChildren,
        });
      }
      // 加入星标联系人节点
      if (showPersonalMark) {
        children.push({
          key: StaticNodeKey.PERSON_MARK_LIST,
          title: transTreeName('markPersonalList'),
          isLeaf: !showContact,
          nodeType: 'personal',
          isOrg: true,
        });
      }
      console.warn('[contact_tree] load initPersonal finish ', _account);
      setLoading(false);
      // 一起加到个人通讯录根节点下面
      updateTreeMap(
        'personal',
        [
          {
            key: StaticRootNodeKey.PERSON,
            nodeType: 'personal',
            title: transTreeName('personal'),
            isLeaf: false,
            isOrg: true,
            children,
          },
        ],
        updateLoadKeys
      );
    } catch (e) {
      trackerLoadDataError('personal', getStringMsg(e));
    }
  };

  /**
   * 获取企业通讯录数据
   */
  const initEnterprise = async (updateLoadKeys?: boolean) => {
    try {
      const orgData = await contactApi.doGetContactOrgMap({ _account, isIM });
      setOrgModel(orgData);
      setLoading(false);
      // 过滤无效关联企业
      const shareDomainList = lodashGet(sysApi.getCurrentUser(), 'prop.domainShareList', undefined);
      const rootOrgData = lodashGet(orgData, '[-2].children', []) as unknown as EntityOrg[];
      // const mainEnterpriseId = lodashGet(sysApi.getCurrentUser(), 'contact.contact.enterpriseId', -1);
      const mainEnterpriseId = sysApi.getCurrentCompanyId(_account);
      if (Array.isArray(rootOrgData) && rootOrgData.length > 1 && shareDomainList) {
        // 过滤已经取消关联的企业
        const invalidEnterpriseIds = rootOrgData
          .filter(item => {
            if (item.id === '-1' || item.enterpriseId === mainEnterpriseId) {
              return false;
            }
            // return !Object.keys(shareDomainList).includes(`${item.enterpriseId}`)
            // 正常来说 shaDomainObjKey和enterpriseId都是number 但是1.20版本之前的数据可能会包含string
            // 所以使用string逻辑来判断
            return Object.keys(shareDomainList).join(',').indexOf(`${item.enterpriseId}`) === -1;
          })
          .map(item => {
            return item.enterpriseId!;
          });
        console.log('[accountTree.tsx]initEnterprise: 无效关联企业:', invalidEnterpriseIds);

        const pureRootOrgData = [
          ...new Map(
            rootOrgData.map(item => {
              return [item.enterpriseId, item];
            })
          ).values(),
        ];

        orgData[-2].children = pureRootOrgData.filter(item => {
          if (!item.enterpriseId || item.id === '-1' || item.enterpriseId === mainEnterpriseId) {
            return true;
          }
          return invalidEnterpriseIds.join(',').indexOf(`${item.enterpriseId}`) === -1;
        });
      }

      // const enterpriseId=lodashGet(sysApi.getCurrentUser(),'contact.contact.enterpriseId','');
      // 如果要展示关联企业 & 关联企业个数超过1 & 主账号
      // @ts-ignore
      const hasRelateOrg =
        !noRelateEnterprise && (lodashGet(orgData, '[-2].children.length', 1) as number) > 1 && (!_account || lodashGet(sysApi.getCurrentUser(), 'id', '') === _account);

      let rootKey = '';
      if (hasRelateOrg) {
        rootKey = '-2';
      } else {
        rootKey =
          Object.keys(orgData).find(key => {
            return [`${mainEnterpriseId}_-1`, '-1'].includes(key);
          }) || '';
      }

      if (lodashGet(orgData, `[${rootKey}].children.length`, 0) === 0) {
        dataTrackerApi.track('pc_contact_orgmap_emptyerror', {
          rootKey,
          totalOrgKeys: (lodashGet(orgData, `[-2].children`, []) as Record<'id', string>[])
            .map(item => {
              return item.id;
            })
            .join(','),
        });
        return;
      }

      const currentOrgChildren: OrgModel2[keyof OrgModel2] = orgData[rootKey];

      const children = currentOrgChildren?.children;
      trackerLoadDataLog('enterprise', children?.length || 0);
      if (children?.length) {
        updateTreeMap(
          'enterprise',
          [
            {
              key: StaticRootNodeKey.ENTERPRISE,
              nodeType: 'enterprise',
              title: transTreeName('enterprise'),
              isLeaf: false,
              isOrg: true,
              children: children.map(item => transTreeNode(item)),
            },
          ],
          updateLoadKeys
        );
      } else {
        updateTreeMap('enterprise', [], updateLoadKeys);
      }
      console.warn('[contact_tree] load initEnterprise finish', _account, orgData);
    } catch (e) {
      trackerLoadDataError('enterprise', getStringMsg(e));
    }
  };

  /**
   * 获取最近联系人数据
   * @param params
   */
  const initRecent = async (params?: { result?: recentContactListRes[]; updateLoadKeys?: boolean; force?: boolean }) => {
    if (!type.includes('recent')) {
      return;
    }
    const { result, updateLoadKeys, force } = params || {};
    // result 本地远端diff后，如果需要更新，会直接返回最新的list，不需要再次请求接口
    let children: ContactTreeDataNode[] = [];
    try {
      children = await getRecentContactList(result, force);
      trackerLoadDataLog('recent', children?.length);
      updateTreeMap(
        'recent',
        [
          {
            key: StaticRootNodeKey.RECENT,
            nodeType: 'recent',
            title: transTreeName('recent'),
            isLeaf: false,
            isOrg: true,
            children,
          },
        ],
        updateLoadKeys
      );
    } catch (e) {
      trackerLoadDataError('recent', getStringMsg(e));
    }
  };
  /**
   * 获取群组数据
   */
  const initTeam = async (updateLoadKeys?: boolean) => {
    if (!type.includes('team')) {
      return;
    }
    let children: ContactTreeNode[] = [];
    try {
      const teamList = await getTeams();
      trackerLoadDataLog('team', teamList?.length);
      if (teamList?.length) {
        children = teamList.map(item => transTreeNode(item, !showContact));
      }
      updateTreeMap(
        'team',
        [
          {
            key: StaticRootNodeKey.TEAM,
            nodeType: 'team',
            title: transTreeName('team'),
            isLeaf: false,
            isOrg: true,
            children,
          },
        ],
        updateLoadKeys
      );
      console.warn('[contact_tree] load initTeam finish', _account, teamList);
    } catch (e) {
      trackerLoadDataError('team', getStringMsg(e));
    }
  };

  /**
   * 获取客户数据 废弃
   * @param updateLoadKeys
   */
  // const initCustomerOld = async (params?: { children?: ContactTreeNode[]; updateLoadKeys?: boolean }) => {
  //   if (!type.includes('customer')) {
  //     return;
  //   }
  //   const { children = [], updateLoadKeys } = params || {};
  //   const { data } = (children[children.length - 1] || {}) as ContactTreeNode;
  //   let lastId;
  //   if (data) {
  //     lastId = data.id;
  //   }
  //   const limit = 20;
  //   let hasMore = true;
  //   const customerList = await contactApi.doGetMyCustomerList({ limit, lastId });
  //   if (customerList.length < limit) {
  //     hasMore = false;
  //   }
  //   const customerChildren = customerList.map(item => transTreeNode(item, !showContact));

  //   trackerLoadDataLog('customer', customerList?.length);
  //   try {
  //     updateTreeMap(
  //       'customer',
  //       [
  //         {
  //           key: StaticRootNodeKey.CUSTOMER,
  //           nodeType: 'customer',
  //           title: transTreeName('customer'),
  //           isLeaf: false,
  //           isOrg: true,
  //           children: [...children, ...customerChildren],
  //           hasMore,
  //         },
  //       ] as ContactTreeNode[],
  //       updateLoadKeys
  //     );
  //     console.warn('[contact_tree] load initCustomer finish', _account, customerList);
  //   } catch (e) {
  //     trackerLoadDataError('customer', getStringMsg(e));
  //   }
  // };

  // 初始化我的客户列表
  const initCustomer = useCallback(async () => {
    if (!type.includes('customer')) {
      return;
    }
    loadCustomerData(true);
  }, [type]);

  /**
   * 更新联系人树
   * @param key
   * @param data
   * @param updateLoadKeys
   */
  const updateTreeMap = (key: ContactTreeType, data: ContactTreeDataNode[], updateLoadKeys?: boolean) => {
    // console.warn('[updateTreeMap] key:', key, 'data:', data);
    setTreeDataMap(res => ({ ...res, [key]: data }));
    if (updateLoadKeys) {
      const expandKey = data[0].key;
      const childrenKey = data[0].children?.map(item => item.key as string);
      expandedKeys.delete(expandKey);
      if (childrenKey?.length) {
        childrenKey.forEach(curKey => {
          expandedKeys.delete(curKey);
        });
      }
      setExpandedKeys(new Set([...expandedKeys]));
    }
  };

  const _inited = useCallback(
    (type: ContactTreeType) => {
      loggerApi.track('contact_tree_inited', {
        treeType: type,
      });
      const typeData = treeDataMap[type];
      if (typeData) {
        const typeRootKey = typeData[0]?.key as StaticRootNodeKey;
        if (typeRootKey && _defaultExpandedKeys.includes(typeRootKey)) {
          setExpandedKeys(_set => {
            _set.add(typeRootKey);
            // return _set;
            return new Set(_set);
          });
        }
      }
    },
    [_defaultExpandedKeys]
  );

  /**
   * 获取初始化数据
   */
  const getInitData = async () => {
    loggerApi.track('contact_tree_init', {
      type,
    });
    const starTime = Date.now();
    const list = [];
    if (type.includes('customer')) {
      list.push(initCustomer().then(() => _inited('customer')));
    }
    if (type.includes('personal')) {
      list.push(initPersonal().then(() => _inited('personal')));
    }
    if (type.includes('team')) {
      list.push(initTeam().then(() => _inited('team')));
    }
    if (type.includes('enterprise')) {
      list.push(initEnterprise().then(() => _inited('enterprise')));
    }
    if (type.includes('recent')) {
      list.push(initRecent().then(() => _inited('recent')));
    }
    await Promise.all(list);
    loggerApi.track('contact_tree_inited_all', {
      type,
      time: Date.now() - starTime + 'ms',
    });
    if (selectDefaultNodeOnInited && selectedKeys?.length) {
      setTreeDataMap(dataMap => {
        const treeData = transTreeMap2TreeData(dataMap, order);
        const nodeData = getNodeDataByKey(treeData, selectedKeys[0]);
        nodeData && handleSelectNode(nodeData);
        return dataMap;
      });
    }
    onInited && onInited(_account!);
  };

  const loadDataTimeoutError = useCreateCallbackForEvent(async () => {
    if (loading || !visibleTree) {
      const [dbOrgCount, dbContactCount, dbReady] = await Promise.all([
        contactApi.doGetTableCount('contact'),
        contactApi.doGetTableCount('org'),
        contactApi.doGetBKContactReady(),
      ]);
      const personalAll = personalOrgMap?.get(StaticNodeKey.PERSON_ALL);
      dataTrackerApi.track('contact_tree_load_data_timeout', {
        enterpriseCount: orgModel?.size || 0,
        personalOrgCount: personalOrgMap?.size || 0,
        personalCount: personalAll?.size || 0,
        dbOrgCount,
        dbContactCount,
        dbReady: Number(dbReady),
        _account,
      });
    }
  });

  /**
   * 初始化数据
   */
  useEffect(() => {
    getInitData();
    const timer = setTimeout(() => {
      loadDataTimeoutError();
    }, loadTimeout);
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  /**
   * 处理默认选中的联系人
   */
  useContactItemEffect(
    defaultSelectList,
    () => {
      const itemMap = new Map();
      defaultSelectList.forEach(item => {
        const key = isOrg(item) ? item.id : getContactItemKey(item as ContactItem, useContactId);
        itemMap.set(key, item);
      });
      setSelectedMap(itemMap);
    },
    useContactId
  );

  /**
   * 处理默认不能选中的联系人
   */
  useEffect(() => {
    if (defaultDisableCheckList?.length) {
      const itemMap = new Map();
      defaultDisableCheckList.forEach(item => {
        const key = isOrg(item) ? item.id : getContactItemKey(item as ContactItem, useContactId);
        itemMap.set(key, item);
      });
      setDisabledMap(itemMap);
    }
  }, [defaultDisableCheckList]);

  useEffect(() => {
    if (accountRootKey) {
      if (activeAccountKey && activeAccountKey === accountRootKey) {
        expandedKeys.add(accountRootKey);
      } else if (accountRootKey) {
        expandedKeys.delete(accountRootKey);
      }
      setExpandedKeys(new Set([...expandedKeys]));
    }
  }, [activeAccountKey, isSingleAccount]);

  /**
   * 联系人发生变更处理对应的节点
   */
  const refresh = useCallback(async (eventData?: syncRes) => {
    const { syncStatus } = eventData || { syncStatus: {} };
    const needSyncPersonal = syncStatus?.personalOrg || syncStatus?.personal;
    const needSyncOrg = syncStatus?.org || syncStatus?.enterprise;
    const needSyncTeam = syncStatus?.team;
    loggerApi.track('contact_tree_contactNotify', {
      needSyncPersonal,
      needSyncOrg,
      needSyncTeam,
    });
    if (type.includes('personal') && needSyncPersonal) {
      initPersonal(showContact);
    }
    if (type.includes('enterprise') && needSyncOrg) {
      initEnterprise(showContact);
    }
    if (type.includes('team') && needSyncTeam) {
      initTeam(true);
    }
  }, []);

  useMsgCallback(
    'contactNotify',
    useCreateCallbackForEvent(ev => {
      const currentAccount = _account || sysApi.getCurrentUser()?.id;
      if (ev._account === currentAccount) {
        refresh(ev.eventData);
      }
    })
  );

  useMsgCallback(
    'contactPersonalMarkNotify',
    useCreateCallbackForEvent(ev => {
      const currentAccount = _account || sysApi.getCurrentUser()?.id;
      const eventData = ev.eventData as ContactPersonalMarkNotifyEventData;
      if (ev._account === currentAccount && !eventData.noNewMarkData) {
        getPersonalMarkListAndRefresh();
      }
    })
  );

  useMsgCallback(
    'recentContactNotify',
    useCreateCallbackForEvent(async ev => {
      const currentAccount = _account || sysApi.getCurrentUser()?.id;
      if (ev._account !== currentAccount) {
        return;
      }
      // 刷新最近联系人
      const result = ev?.eventData?.result;
      let force = false;
      if (!result) {
        force = true;
      }
      loggerApi.track('contact_tree_recentContactNotify', {
        force,
      });
      initRecent({ result, updateLoadKeys: true, force });
    })
  );

  useMsgCallback(
    'customerMapChangeNotify',
    useCreateCallbackForEvent(e => {
      const eventData = e.eventData as CustomerMapChangeEvent;
      if (eventData.target === 'myCustomerList') {
        loadCustomerData(true);
      }
      loggerApi.track('contact_tree_contactEdmNotify');
    })
  );

  const getPersonalMarkListAndRefresh = useCallback(
    debounce(async () => {
      console.error('[debounce] getPersonalMarkListAndRefresh');
      await initPersonalMarkList();
      renderTree();
    }, 1000),
    []
  );

  /**
   * 选中组织
   * @param dataNode
   */
  const handleSelectOrg = async (dataNode: ContactTreeNode) => {
    const { key, nodeType, orgList, children, data } = dataNode;
    const isPersonalOrg = nodeType === 'personal';
    const isTeam = nodeType === 'team';
    let idList: string[] = [];
    let selectedList: ContactItem[] = [];
    if (useOrgUnit) {
      const orgItem = transEntityOrg2OrgItem(data! as EntityOrg);
      if (multiple) {
        selectedMap.set(key, orgItem);
        setSelectedMap(selectedMap);
        onContactSelect && onContactSelect([...selectedMap.values()], [orgItem]);
      } else {
        onContactSelect && onContactSelect([orgItem], [orgItem]);
      }
      return;
    }
    if (selectOrgLoading) {
      return;
    }
    setSelectOrgLoading(true);
    if (isTeam) {
      idList = [key];
    } else if (isPersonalOrg) {
      const personalChildren = children as Array<ContactTreeLeaf | ContactTreeNode>;
      personalChildren?.forEach(item => {
        if (!item.isOrg) {
          const itemData = item.data as ContactItem;
          if (itemData.type !== 'other') {
            selectedList.push(itemData);
          }
        } else {
          const leafChildren = item.children as ContactTreeLeaf[];
          leafChildren.forEach(leaf => {
            if (leaf.data.type !== 'other') {
              selectedList.push(leaf.data);
            }
          });
        }
      });
    } else if (orgList?.length) {
      idList = util.getKeyListByList(orgList, 'id');
    } else {
      const { orgList: list } = await contactApi.doGetContactOrg({
        orgId: key,
        showDisable: false,
        _account,
      });
      idList = util.getKeyListByList(list, 'id');
    }
    if (multiple) {
      const { contactItem, selectContactItem } = await getSelectedItemBySelectOrg({
        checked: true,
        idList,
        selectedMap: selectedMap as SelectedContactMap,
        selectedList,
        useContactId,
        disabledMap,
        _account,
      });
      setSelectedMap(contactItem);
      setSelectOrgLoading(false);
      onContactSelect && onContactSelect([...contactItem.values()], selectContactItem);
    } else {
      const { contactItem } = await getSelectedItemBySelectOrg({
        checked: true,
        idList,
        selectedMap: new Map(),
        selectedList,
        useContactId,
        _account,
      });
      const list = [...contactItem.values()];
      setSelectOrgLoading(false);
      onContactSelect && onContactSelect(list, list);
    }
  };

  // 加载星标联系人节点数据
  const handleLoadPersonalMarkData = useCallback(async () => {
    const _personalMarkList = await initPersonalMarkList();
    let personalMarkChildren: ContactTreeDataNode[] = [];
    _personalMarkList.forEach(item => {
      if (item) {
        if ('orgType' in item) {
          personalMarkChildren.push(transOrgItem2TreeNode(item, !showContact));
        } else {
          personalMarkChildren.push(transTreeLeaf({ item, parentKey: StaticNodeKey.PERSON_MARK_LIST }));
        }
      }
    });
    return personalMarkChildren;
  }, []);

  /**
   * 加载组织数据
   * @param node
   */
  const handleLoadData = async (node: ContactTreeNode) => {
    const { key, nodeType, data } = node;
    // if (separatorKeys.includes(key)) {
    //   handleLoadRootData(node)
    //   return;
    // }
    let leafData: ContactTreeDataNode[] = [];
    if (nodeType === 'team' && showContact) {
      const memberList = (await getTeamMembers([key], false)) as EntityOrgTeamContact[];
      memberList.forEach(item => {
        if (item.model) {
          leafData.push(transTreeLeaf({ item: item.model, parentKey: StaticRootNodeKey.TEAM }));
        }
      });
    } else if (nodeType === 'customer' && showContact) {
      // 0715 zoumingliang 不应该到这个分支
      // const res = await contactApi.doGetCustomerContactByOrgIds({ idList: [key] });
      // const data = res[key] || [];
      // leafData = data.map(item => transTreeLeaf({ item, parentKey: StaticRootNodeKey.CUSTOMER }));
    } else if (nodeType === 'enterprise') {
      let curNodeChildren: ContactTreeNode[] = [];
      if (orgModel && orgModel[key]) {
        curNodeChildren = orgModel[key].children?.map(item => transTreeNode(item));
      }
      const curTreeChildren: ContactTreeLeaf[] = [];
      if (showContact) {
        const contactList = await contactApi.doGetContactByOrgId({ orgId: key, _account });
        const opertionMethod = data?.type === 1 ? 'unshift' : 'push';
        contactList.forEach(model => {
          curTreeChildren[opertionMethod](transTreeLeaf({ item: model, parentKey: key, isMailList: data?.type === 2 }));
        });
      }
      leafData = [...curNodeChildren, ...curTreeChildren];
    } else if (nodeType === 'personal' && showContact) {
      if (key === StaticNodeKey.PERSON_MARK_LIST) {
        leafData = await handleLoadPersonalMarkData();
      } else {
        const contactList = await contactApi.doGetContactByOrgId({ orgId: key, _account });
        contactList.forEach(model => {
          leafData.push(transTreeLeaf({ item: model, parentKey: key }));
        });
      }
    }
    const oldTreeData = treeDataMap[nodeType];
    if (oldTreeData) {
      if (!leafData.length && showNoDataPlaceholder && showContact) {
        const externalData: ContactItem = {
          type: 'other',
          id: key + '_noData',
          email: '',
          name: transTreeName('noContact'),
        };
        leafData = [transTreeLeaf({ item: externalData })];
      }
      const tree = updateOrgTreeData(oldTreeData, `${key}`, leafData, true);
      updateTreeMap(nodeType, tree, false);
    }
  };

  /**
   * 加载组织分页数据
   */
  const handleLoadMoreData = async (node: ContactTreeNode) => {
    const { key, hasMore } = node;
    if (key === StaticRootNodeKey.CUSTOMER && hasMore) {
      await loadCustomerData();
    }
  };

  /**
   * 展示成员列表
   * @param contact
   */
  const handleMemberList = (contact: ContactItem) => {
    if (JSON.stringify(contact) === '{}') return;
    setShowMemberList(true);
    setCurrentContact(contact);
  };

  /**
   * 关闭成员列表
   */
  const closeModelMed = useCallback(() => {
    setShowMemberList(false);
  }, [setShowMemberList]);

  /**
   * 渲染叶子节点
   */
  const renderTitle = (data: ContactTreeLeaf) => {
    const { data: contact, title, isMailList: _isMailList, nodeType } = data;
    if (nodeType === 'other') {
      return (
        <span className={styles.leafWrapContainer}>
          <div className={classnames(styles.contactTreeLeafWrap, styles.contactTreeNode, styles.contactTreeNoData)}>{title}</div>
        </span>
      );
    }
    const email = contact.email;
    const contactItemKey = getContactItemKey(contact, useContactId);
    const checked = selectedMap.has(contactItemKey);
    const disabled = disabledMap.has(contactItemKey);
    const isMailList = _isMailList || (contact.accountType !== undefined && contactApi.isMailListByAccountType(contact.accountType));
    const visiblePersonalMark = showPersonalMark && contact.type === 'personal';
    return (
      <span className={styles.leafWrapContainer}>
        <Tooltip title={email} mouseEnterDelay={1}>
          <div
            data-test-id="tree_leaf"
            className={classnames(styles.contactTreeLeafWrap, styles.contactTreeNode, {
              [styles.noAvatar]: !showAvatar,
              [styles.leafWrapMail]: isMailList,
            })}
          >
            {showCheckbox && (
              <div className={styles.treeLeafCheckbox}>
                <Checkbox checked={checked} disabled={disabled} />
              </div>
            )}
            {showAvatar ? (
              <div className={styles.contactTreeAvatar}>
                <AvatarTag contactId={contact?.id} user={{ email, name: contact.name, avatar: contact.avatar }} />
              </div>
            ) : (
              <></>
            )}
            <span className={classnames(styles.contactTreeTitleTxt, disabled && styles.disabled)}>{title}</span>
            {visiblePersonalMark && <PersonalMark email={email} contactId={contact.id} canOperate cancelToast visibleHover />}
            {renderTitleSuffix && renderTitleSuffix(data, _account!)}
          </div>
        </Tooltip>
        {showMailListEye && isMailList ? (
          <div
            className={classnames({
              [styles.orgSelectMail]: isMailList,
            })}
            data-test-id="tree_leaf_btn_mailList"
            onClick={e => {
              e.stopPropagation();
              if (contact) {
                handleMemberList(contact);
              }
            }}
          >
            <Tooltip title={transTreeName('memberList')} placement="bottom">
              <Space>
                <EyeOutlined />
              </Space>
            </Tooltip>
          </div>
        ) : null}
      </span>
    );
  };
  const nodeTitleRender = useCallback(
    (type: StaticRootNodeKey, title: React.ReactElement): React.ReactElement => {
      const typeRootTitle: Partial<Record<StaticRootNodeKey, React.ReactElement>> = {
        recentRoot: (
          <>
            {title}
            <Tooltip
              placement="bottomRight"
              overlayClassName={styles.recentTooltipArrow}
              destroyTooltipOnHide={{ keepParent: false }}
              arrowPointAtCenter
              title={transTreeName('rencentSendMail')}
              overlayStyle={{ maxWidth: '100%' }}
            >
              <span className={`dark-invert ${styles.orgTitleSvg}`} style={{ marginLeft: 5 }}>
                <InfoCircleOutlined />
              </span>
            </Tooltip>
          </>
        ),
        teamRoot: (
          <ProductAuthTag tagName={ProductTagEnum.EMAIL_RECEIVER_IM_GROUP} flowTipStyle={{ top: '-8px', verticalAlign: 'middle' }}>
            {title}
          </ProductAuthTag>
        ),
      };
      const titleRender = titleRenderMap && titleRenderMap[type];
      if (titleRender) {
        return titleRender(title);
      }
      return typeRootTitle[type] || title;
    },
    [titleRenderMap]
  );

  const getTestId = useCallback((key: string, nodeType: ContactTreeType, data?: EntityOrg) => {
    const defalutIds: Record<string, string> = {
      [StaticRootNodeKey.PERSON]: 'tree_personalRoot',
      [StaticRootNodeKey.ENTERPRISE]: 'tree_enterpriseRoot',
      [StaticRootNodeKey.TEAM]: 'tree_teamRoot',
      [StaticRootNodeKey.RECENT]: 'tree_recentRoot',
      [StaticNodeKey.PERSON_ALL]: 'tree_personalAll',
      [StaticNodeKey.PERSON_NO_GROUP]: 'tree_personalNoGroup',
      [StaticNodeKey.PERSON_MARK_LIST]: 'tree_personalMark',
    };
    if (defalutIds[key]) {
      return defalutIds[key];
    }
    if (nodeType === 'personal') {
      return 'tree_personalOrg';
    }
    if (nodeType === 'enterprise' && data?.type === 2) {
      return 'tree_org_mailList';
    }
    return 'tree_org';
  }, []);

  const getCountTestId = useCallback((key: string) => {
    if (key === StaticNodeKey.PERSON_ALL) {
      return 'tree_personalAll_count';
    } else if (key === StaticNodeKey.PERSON_MARK_LIST) {
      return 'tree_personalMark_count';
    } else if (key === StaticNodeKey.PERSON_NO_GROUP) {
      return 'tree_personalNoGroup_count';
    } else {
      return 'tree_personalOrg_count';
    }
  }, []);
  /**
   * 渲染子节点
   */
  const renderNode = (item: ContactTreeNode) => {
    const { data, nodeType, title, key, titleToolTip } = item;
    const isTeam = nodeType === 'team';
    const isPersonalOrg = nodeType === 'personal';
    const isOrg = nodeType === 'enterprise';
    const teamInfo = data as EntityTeamOrg;
    const btnName = selectBtnNameMap[nodeType];
    const visibleOrgBtn = showAddOrgBtn && isOrg && !rootKey.includes(key);
    const visibleTeamBtn = showAddTeamBtn && isTeam && !rootKey.includes(key);
    // 如果是可以选择分组（全部和未分组不能展示）;
    const personalOrgBlackList = useOrgUnit ? [...rootKey, StaticNodeKey.PERSON_ALL, StaticNodeKey.PERSON_NO_GROUP] : rootKey;
    const visiblePersonalOrgBtn = isPersonalOrg && showAddPersonalBtn && !personalOrgBlackList.includes(key);
    const visibleSelectBtn = btnName && (visibleOrgBtn || visibleTeamBtn || visiblePersonalOrgBtn);
    const visiblePersonalCount = isPersonalOrg && key !== StaticRootNodeKey.PERSON;

    const personalCount = personalOrgMap.get(key)?.size;
    const visibleEnterpriseCount = showOrgMemberNum && item.nodeType === 'enterprise' && item.isOrg;
    let enterpriseCount = (item?.data as EntityOrg)?.memberNum || 0;
    const disabled = disabledMap.has(key);
    const visiblePersonalMark = showPersonalMark && isPersonalOrg && !personalMarkKeyBlackList.includes(key);

    const dataTestId = getTestId(key, nodeType, data as EntityOrg);
    const personalCountId = getCountTestId(key);

    if (key === 'enterpriseRoot' && showOrgMemberNum && lodashGet(item, 'data.memberNum', 0) === 0) {
      enterpriseCount = (item.children || []).reduce((total, current) => {
        const childNum = lodashGet(current, 'data.memberNum', 0);
        return total + childNum;
      }, 0);
    }

    /**
     * 渲染最近联系人toolTip
     */
    const recentTooltip = (
      <>
        <Tooltip
          placement="bottomRight"
          overlayClassName={styles.recentTooltipArrow}
          destroyTooltipOnHide={{ keepParent: false }}
          arrowPointAtCenter
          title={transTreeName('rencentSendMail')}
          overlayStyle={{ maxWidth: '100%' }}
        >
          <span className={`dark-invert ${styles.orgTitleSvg}`}>
            <InfoCircleOutlined />
          </span>
        </Tooltip>
      </>
    );
    const renderNodeTitle = () => {
      if (treeRootKey.includes(key)) {
        return nodeTitleRender(key as StaticRootNodeKey, <div className={styles.orgTitle}>{title}</div>);
      } else {
        return <div className={styles.orgTitle}>{title}</div>;
      }
    };
    return (
      <>
        <Tooltip title={titleToolTip || title} mouseEnterDelay={1} destroyTooltipOnHide={{ keepParent: false }} overlayClassName={'overlay-' + key}>
          <div
            data-test-id={dataTestId}
            className={classnames(styles.orgWrap, styles.contactTreeNode, {
              [styles.orgWrapRecentRoot]: key === StaticRootNodeKey.RECENT,
            })}
          >
            {renderNodeTitle()}
            {/* {(key === StaticRootNodeKey.TEAM)
            ? (<ProductAuthTag tagName={ProductTagEnum.EMAIL_RECEIVER_IM_GROUP}
              flowTipStyle={{ top: '-8px', verticalAlign: 'middle' }}>
              <div className={styles.orgTitle}>{title}</div>
            </ProductAuthTag>)
            : <div className={styles.orgTitle}>{title}</div>}
          {key === StaticRootNodeKey.RECENT && recentTooltip} */}
            {isTeam && key !== StaticRootNodeKey.TEAM && <div className={styles.orgTitleLabel}>{`（${teamInfo?.memberNum}人）`}</div>}
            {visiblePersonalCount && <div className={styles.orgTitleLabel} data-test-id={personalCountId}>{`（${personalCount || 0}）`}</div>}
            {visiblePersonalMark && (
              <PersonalMark
                testId="tree_personalOrg_persoanlMark_icon"
                style={{ marginRight: 24 }}
                orgId={key}
                canOperate
                cancelToast
                visibleHover
                onMarked={marked => onMarked && onMarked(marked, item)}
              />
            )}
            {visibleEnterpriseCount && <div className={styles.orgTitleLabel}>({enterpriseCount})</div>}
            <span>
              <Button
                hidden={!visibleSelectBtn}
                disabled={disabled}
                loading={selectOrgLoading}
                data-test-id="tree_selectOrg_btn"
                className={classnames(styles.orgSelect, disabled && styles.orgSelectDisabled)}
                onClick={e => {
                  e.stopPropagation();
                  !disabled && handleSelectOrg(item);
                }}
              >
                <span hidden={selectOrgLoading}>{btnName}</span>
              </Button>
            </span>
            {renderTitleSuffix && renderTitleSuffix(item, _account!)}
          </div>
        </Tooltip>
      </>
    );
  };

  /**
   * 多账号情况下展示的树结构数据
   */
  const accountTreeData: ContactTreeDataNode[] = useMemo(() => {
    const showAccountRootKey = Boolean(rootTitle && accountRootKey);
    const treeData = transTreeMap2TreeData(treeDataMap, order);
    if (showAccountRootKey) {
      const accountIcon = accountType ? mailIconList.get(accountType) || mailIconList.get('Others') : <></>;
      return [
        {
          key: accountRootKey,
          title: (
            <div className={styles.rootKeyWrap}>
              <div className={styles.rootKeyIcon}>{accountIcon}</div>
              <div className={styles.rootKeyName}>{rootTitle}</div>
            </div>
          ),
          isLeaf: false,
          isOrg: true,
          nodeType: 'root',
          titleToolTip: rootTitle,
          children: treeData,
        },
      ] as unknown as ContactTreeDataNode[];
    }
    return treeData;
  }, [accountType, rootTitle, accountRootKey, treeDataMap, order]);

  /**
   * 是否展示树
   */
  const visibleTree = useMemo(() => {
    const enterpriseData = treeDataMap.enterprise && treeDataMap.enterprise[0];
    const hasEnterpriseData = enterpriseData && enterpriseData.children && enterpriseData.children.length > 0;
    const personalSize = personalOrgMap.get(StaticNodeKey.PERSON_ALL)?.size;
    return !loading || !isSingleAccount || hasEnterpriseData || (personalSize && personalSize > 0);
  }, [treeDataMap, isSingleAccount, loading, personalOrgMap]);

  const refreshTreeDecorate = useCallback(() => {
    const filterKeyList: string[] = [StaticNodeKey.PERSON_ALL, StaticNodeKey.PERSON_NO_GROUP, StaticNodeKey.PERSON_MARK_LIST];
    const hasPersonalOrg = [...personalOrgMap.keys()].some(item => !filterKeyList.includes(item));
    setDecorateRenderMap(_data => {
      let hasModify = false;
      const cloneDecorateRenderMap = new Map(_data);
      if (cloneDecorateRenderMap.size) {
        cloneDecorateRenderMap.forEach(item => {
          if (item.has('personalTip')) {
            const personalTipData = item.get('personalTip');
            if (personalTipData?.show && (hasPersonalOrg || !isSingleAccount)) {
              hasModify = true;
              item.set('personalTip', { ...personalTipData, show: !hasPersonalOrg });
            }
          }
          // if(item.has('personalMarkListRenderDivider')) {
          //   const personalMarkListRenderDividerData = item.get('personalMarkListRenderDivider');
          //   if(personalMarkListRenderDividerData?.show && !isSingleAccount) {
          //     hasModify = true;
          //     item.set('personalMarkListRenderDivider', {...personalMarkListRenderDividerData, show: false})
          //   }
          // }
          if (item.has('enterpriseRenderDivider')) {
            const enterpriseRenderDividerData = item.get('enterpriseRenderDivider');
            if (enterpriseRenderDividerData?.show && !isSingleAccount) {
              hasModify = true;
              item.set('enterpriseRenderDivider', { ...enterpriseRenderDividerData, show: false });
            }
          }
        });
      }
      if (hasModify) {
        return cloneDecorateRenderMap;
      }
      return _data;
    });
  }, [personalOrgMap, isSingleAccount]);

  useEffect(() => {
    refreshTreeDecorate();
  }, [personalOrgMap]);

  useEffect(() => {
    setDecorateRenderMap(new Map(contactTreeDecorateMap));
    refreshTreeDecorate();
  }, [contactTreeDecorateMap]);
  /**
   * 卡片装饰
   */
  const cardGroupDecorate = useMemo(() => {
    if (!decorateRenderMap.size) {
      return undefined;
    } else {
      return [
        (keys: string[]) => {
          const decorateList: any[] = [];
          keys.forEach((key, index) => {
            const renderKey = key;
            const renderEleList = decorateRenderMap.get(renderKey);
            if (index - 1 >= 0 && renderEleList?.size) {
              renderEleList.forEach(item => {
                const { element, height, distance = 0, show = true } = item;
                if (show) {
                  decorateList.push({
                    element,
                    index: index + distance,
                    height,
                  });
                }
              });
            }
          });
          return decorateList;
        },
      ];
    }
  }, [decorateRenderMap]);

  // 选中联系人列表
  const handleSelectNode = (nodeData: ContactTreeDataNode) => {
    if (onSelectNode && !treeRootKey.includes(nodeData.key)) {
      onSelectNode(nodeData, _account!);
    }
  };

  const handleSelect = async (nodeData: ContactTreeDataNode) => {
    if (!nodeData.isOrg) {
      if (nodeData.nodeType === 'other') {
        return;
      }
      handleSelectNode(nodeData);
      if (!showContact) {
        return;
      }
      const { data: contact } = nodeData as ContactTreeLeaf;
      const key = getContactItemKey(contact, useContactId);
      if (disabledMap.has(key)) {
        return;
      }
      if (multiple) {
        const isSelected = selectedMap.has(key);
        isSelected ? selectedMap.delete(key) : selectedMap.set(key, contact);
        setSelectedMap(selectedMap);
        renderTree();
        onContactSelect && onContactSelect([...selectedMap.values()], [contact]);
      } else {
        onContactSelect && onContactSelect([contact], [contact]);
      }
    } else {
      handleExpand(nodeData as ContactTreeNode);
      if (!nodeData.children?.length) {
        handleLoadData(nodeData as ContactTreeNode);
      }
    }
  };

  const handleExpand = async (nodeData: ContactTreeNode) => {
    // 如果是最近联系人展开
    if (nodeData.key === 'recentRoot' && !expandedKeys.has(nodeData.key) && !nodeData.children?.length) {
      await initRecent().then(() => _inited('recent'));
    }

    handleSelectNode(nodeData);
    const { key, nodeType } = nodeData;
    if (expandedKeys.has(key)) {
      onExpand && onExpand(nodeType, false);
      expandedKeys.delete(key);
    } else {
      onExpand && onExpand(nodeType, true);
      expandedKeys.add(key);
    }
    console.log('handleSelect', expandedKeys);
    setExpandedKeys(new Set([...expandedKeys]));
  };

  const renderTree = useCallback(() => {
    console.warn('[contact_tree] renderTree');
    setTreeDataMap(data => ({ ...data }));
  }, []);

  // const height = useMemo(() => !isSingleAccount && accountRootKey && !expandedKeys.has(accountRootKey) ? 32: treeHeight, [isSingleAccount,accountRootKey, expandedKeys, treeHeight])

  return (
    <div className={styles.ContactTree} data-test-id="contact_tree">
      {visibleTree && (
        <Tree
          rootClassName={styles.reallyTree}
          selectedKeys={selectedKeys}
          hasMore={false}
          scrollToIndex={0}
          width={treeWidth}
          height={treeHeight}
          realSize={!isSingleAccount}
          onLoadMoreNode={async (_, parentNode) => {
            await handleLoadMoreData(parentNode as unknown as ContactTreeNode);
            return true;
          }}
          loadData={async data => {
            await handleLoadData(data as unknown as ContactTreeNode);
            return true;
          }}
          defaultExpandedKeys={[...(expandedKeys || [])]}
          expandedKeys={[...expandedKeys] || []}
          onSelect={(_, { node }) => {
            handleSelect(node as ContactTreeDataNode);
          }}
          onRightClick={({ node }) => {
            if (onContextMenu) {
              onContextMenu(node as ContactTreeDataNode, _account!);
            }
          }}
          onExpand={(_, { node }) => {
            handleExpand(node as ContactTreeNode);
          }}
          treeData={accountTreeData}
          titleRender={data => {
            const nodeData = data as ContactTreeLeaf | ContactTreeNode;
            if (nodeData.isOrg) {
              return renderNode(nodeData as ContactTreeNode) as React.ReactElement;
            } else {
              return renderTitle(nodeData as ContactTreeLeaf) as React.ReactElement;
            }
          }}
          icon={null}
          // @ts-ignore
          cardGroupDecorate={cardGroupDecorate}
        />
      )}
      {!visibleTree && (
        <Skeleton loading={loading} active title={false} paragraph={{ rows: 6 }} avatar={false}>
          <div className={styles.empty}>
            <div className={styles.emptyTxt}>{transTreeName('notVisible')}</div>
            <div className={styles.emptyTxt}>{transTreeName('contactAdmin')}</div>
          </div>
        </Skeleton>
      )}
      {showMemberList && currentContact && (
        <MemberList
          showDetail={false}
          user={currentContact.email}
          _account={_account}
          contactName={currentContact.name}
          showModel={showMemberList}
          closeModel={closeModelMed}
        />
      )}
    </div>
  );
};
export default AccountTree;
