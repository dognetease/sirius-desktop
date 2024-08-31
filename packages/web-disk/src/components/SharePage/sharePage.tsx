import React, { useCallback, useEffect, useMemo, useReducer, useState, useRef } from 'react';
import { Button, Select, Tabs, DatePicker, Input } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import copy from 'copy-to-clipboard';
import moment from 'moment';
import {
  apiHolder,
  apis,
  ContactModel,
  DataStoreApi,
  DataTrackerApi,
  ContactApi,
  OrgApi,
  EntityOrg,
  ExternalRoleType,
  ExternalShareLinkValidPeriod,
  EntityTeamOrg,
  NetStorageShareApi,
  NSCollaborator,
  NSDirContent,
  NSFileContent,
  NSRoleInfo,
  OperatorType,
  RequestAddCollaborator,
  RequestGetExternalShareLink,
  RequestListCollaborator,
  RequestRemoveCollaborator,
  RequestUpdateCollaborator,
  ResourceType,
  ResponseExternalShareLink,
  RoleType,
  EntityOrgTeamContact,
  ShareType,
  ProductTagEnum,
  NIMApi,
} from 'api';
import locale from 'antd/es/date-picker/locale/zh_CN';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Selector from '../Selector/selector';
import ContactItem from '../ContactItem/contactItem';
import PrivilegeDropdown from '../PrivilegeDropdown/dropdown';
import CloseIcon from '@web-common/components/UI/Icons/svgs/ModalClose';
import FoldIcon from '@web-common/components/UI/Icons/svgs/FoldSvg';
import UnfoldIcon from '@web-common/components/UI/Icons/svgs/UnfoldSvg';
import LinkIcon from '@web-common/components/UI/Icons/svgs/LinkSvg';
import SelectedIcon from '@web-common/components/UI/Icons/svgs/MemberSelected';
import ArrowLeftIcon from '@web-common/components/UI/Icons/svgs/disk/ArrowLeft';
import { calcPrivilege, CoactorPrivilege, externalCoactorPrivilege, getShareLink, normalizeShareUrl, sendShareLinkMail } from '../../utils';
import { syncAll, getContactById, getOrgByOriginId, getTeamById } from '@web-common/utils/contact_util';
import { ReactComponent as CloseCircleIcon } from '@/images/icons/close_circle.svg';
import { ReactComponent as CheckedCircleIcon } from '@/images/icons/checked_circle.svg';
import styles from './sharePage.module.scss';
import SiriusRadio from '@web-common/components/UI/SiriusRadio';
import IconCard, { IconMapKey } from '@web-common/components/UI/IconCard';
import { DiskStoreTipKey, DiskStoreTipVisible, DiskTipKeyEnum } from './../../disk';
import { useAppSelector, useAppDispatch, DiskActions } from '@web-common/state/createStore';
import ProductAuthTag from '@web-common/components/UI/ProductAuthTag/ProductAuthTag';
import { ProductProtocols } from '@web-common/utils/constant';
import { getIn18Text } from 'api';
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const systemApi = apiHolder.api.getSystemApi();
const nsShareApi = apiHolder.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const nimApi = apiHolder.api.requireLogicalApi(apis.imApiImpl) as unknown as NIMApi;
import { safeDecodeURIComponent } from '@web-common/utils/utils';

export const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
const inElectron = systemApi.isElectron();
export const AllCoactorPrivileges: CoactorPrivilege[] = [
  getIn18Text('KECHAKAN'),
  getIn18Text('KESHANGCHUAN'),
  getIn18Text('KECHAKAN/XIA'),
  getIn18Text('KECHAKAN/SHANG'),
  getIn18Text('KEBIANJI'),
  getIn18Text('GUANLIZHE'),
  // '可查看', '可上传', '可查看/下载', '可查看/上传/下载', '可编辑', '管理者',
];
export const AllRoleName: RoleType[] = ['OWNER', 'ROLE_ADMIN', 'ROLE_USER_EDIT', 'ROLE_USER_UPDOWN', 'ROLE_USER_UPLOAD', 'ROLE_USER_DOWNLOAD', 'ROLE_USER_SHOW'];
export const privilege2RoleMap = {
  可查看: 'ROLE_USER_SHOW',
  可上传: 'ROLE_USER_UPLOAD',
  '可查看/下载': 'ROLE_USER_DOWNLOAD',
  '可查看/上传/下载': 'ROLE_USER_UPDOWN',
  可编辑: 'ROLE_USER_EDIT',
  管理者: 'ROLE_ADMIN',
};

export const getPrivilege2Role = (privilege: string) => {
  if (privilege === getIn18Text('KECHAKAN')) return 'ROLE_USER_SHOW';
  if (privilege === getIn18Text('KESHANGCHUAN')) return 'ROLE_USER_UPLOAD';
  if (privilege === getIn18Text('KECHAKAN/XIA')) return 'ROLE_USER_DOWNLOAD';
  if (privilege === getIn18Text('KECHAKAN/SHANG')) return 'ROLE_USER_UPDOWN';
  if (privilege === getIn18Text('KEBIANJI')) return 'ROLE_USER_EDIT';
  if (privilege === getIn18Text('GUANLIZHE')) return 'ROLE_ADMIN';
  return undefined;
};

const shareTypeMap = {
  仅协作者可打开: 'SPACE_NO_PERMISSION',
  可查看: 'SPACE_USER_SHOW',
  可编辑: 'SPACE_USER_EDIT',
  可管理: 'SPACE_ADMIN',
};
export type ShareTypeText = '仅协作者可打开' | '可查看' | '可编辑' | '可管理';
export interface ShareOption {
  key: string;
  value: ShareTypeText;
}
const AllShareOptions: ShareOption[] = [
  { key: getIn18Text('JINXIEZUOZHEKE11'), value: getIn18Text('JINXIEZUOZHEKE') },
  { key: getIn18Text('QIYENEISHOUDAO11'), value: getIn18Text('KECHAKAN') },
  { key: getIn18Text('QIYENEISHOUDAO12'), value: getIn18Text('KEBIANJI') },
  { key: getIn18Text('QIYENEISHOUDAO'), value: getIn18Text('KEGUANLI') },
];
enum ShareStatus {
  SHARE,
  SEND_MESSAGE,
}
export type ContactItemModel = ContactModel | EntityOrg | EntityTeamOrg;
type CoactorMember = ContactItemModel & {
  privilege: CoactorPrivilege;
  roleName: RoleType;
};
export interface CoactorState {
  coactors: CoactorMember[];
  status: ShareStatus;
}
export interface CoactorActionType {
  type: 'change' | 'back';
  payload?: CoactorMember[];
}
interface operater {
  operatorId: string;
  operatorType: string;
  name?: string;
}
export const coactorReducer = (state: CoactorState, action: CoactorActionType) => {
  const coactors = action.payload || [];
  switch (action.type) {
    case 'change':
      return {
        coactors,
        status: coactors.length > 0 ? ShareStatus.SEND_MESSAGE : ShareStatus.SHARE,
      };
    case 'back':
      return { coactors: [], status: ShareStatus.SHARE };
    default:
      return state;
  }
};
export const CoactorContext = React.createContext<{
  dispatch: React.Dispatch<CoactorActionType>;
  coactors: CoactorState['coactors'];
  status: CoactorState['status'];
}>({
  dispatch: () => null,
  coactors: [],
  status: ShareStatus.SHARE,
});
const checkPriority = (curRole: RoleType, role: RoleType): number => {
  // 可管理 > 可查看/上传/下载 > 可查看/下载 > 可查看
  // 可管理 > 可查看/上传/下载 > 可上传
  const lowest = ['ROLE_USER_DOWNLOAD', 'ROLE_USER_SHOW', 'ROLE_USER_UPLOAD'];
  if (curRole === role) {
    return 0;
  }
  if (curRole === 'ROLE_USER_DOWNLOAD' && role === 'ROLE_USER_SHOW') {
    return 1;
  }
  if (lowest.includes(curRole)) {
    return -1;
  }
  return AllRoleName.indexOf(role) - AllRoleName.indexOf(curRole);
};
const getPrivileges = (curRoleName: RoleType, resourceType?: string): CoactorPrivilege[] => {
  let privileges: CoactorPrivilege[];
  if (curRoleName === 'ROLE_USER_SHOW') {
    privileges = AllCoactorPrivileges.slice(0, 1);
  } else if (curRoleName === 'ROLE_USER_UPLOAD') {
    privileges = AllCoactorPrivileges.slice(1, 2);
  } else if (curRoleName === 'ROLE_USER_DOWNLOAD') {
    privileges = [AllCoactorPrivileges[0], AllCoactorPrivileges[2]];
  } else if (curRoleName === 'ROLE_USER_UPDOWN') {
    privileges = AllCoactorPrivileges.slice(0, 4);
  } else if (curRoleName === 'ROLE_USER_EDIT') {
    privileges = AllCoactorPrivileges.slice(0, 5);
  } else {
    privileges = AllCoactorPrivileges;
  }
  if (resourceType === 'FILE') {
    // 文件没有上传权限
    privileges = privileges.filter(p => !p.includes(getIn18Text('SHANGCHUAN')));
  }
  if (resourceType === 'DIRECTORY') {
    // 文件夹没有编辑权限
    privileges = privileges.filter(p => !p.includes(getIn18Text('BIANJI')));
  }
  return privileges;
};
const normalizeShareType = (roleInfo: NSRoleInfo) => {
  const { roleName } = roleInfo;
  if (roleName === getIn18Text('CHAKAN')) {
    return getIn18Text('KECHAKAN');
  }
  if (roleName === getIn18Text('BIANJI')) {
    return getIn18Text('KEBIANJI');
  }
  if (roleName === getIn18Text('GUANLI')) {
    return getIn18Text('KEGUANLI');
  }
  return getIn18Text('JINXIEZUOZHEKE');
};
const getContactId = (contact: CoactorMember) => ('contact' in contact ? contact.contact.id : contact.originId);
const getOperatorType = (contact: CoactorMember) => ('contact' in contact ? 'EMPLOYEE' : 'owner' in contact ? 'GROUP' : 'DEPARTMENT');
interface SharePageProps {
  from?: 'navigationBar' | 'list';
  item?: (NSDirContent & NSFileContent) | any;
  roles: NSRoleInfo[]; // 角色权限 转为外部透传 方便分享卡片更新
  visible: boolean;
  hideSharePage?: Function;
  // type: NetStorageType;
  sideTab?: string;
  showAsModal?: boolean;
  /**
   * true ：表示 组件隐藏后，不执行resetStatus函数
   */
  resetStatusDisabled?: boolean;
  defaultTabKey: string;
  activedSheetIndex: string; // 当前处于激活状态的sheet索引
  className?: string;
}
const dataStoreApi: DataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const eventApi = apiHolder.api.getEventApi();
const fileMap = {
  doc: 'onlinedoc',
  excel: 'onlinesheet',
  file: 'file',
  unitable: 'unitable',
};
export const syncPrivilegeContactImpl = (
  params: Pick<RequestListCollaborator, 'resourceId' | 'resourceType'>,
  handles: {
    setContactList: (list: CoactorMember[]) => void;
    checkUpdateContacts?: (bool: string) => void;
  }
) => {
  const req: RequestListCollaborator = {
    page: 1,
    pageSize: 1000,
    resourceId: params.resourceId,
    resourceType: params.resourceType,
  };
  nsShareApi.listNSCollaborator(req).then(async data => {
    const collaboratorsMap = new Map<string, NSCollaborator>();
    const contactIds: string[] = [];
    const orgIds: string[] = [];
    const teamIds: string[] = [];
    let haveUnknownUsers = false;
    data.collaborators.forEach(collaborator => {
      const id = `${collaborator.operator.operatorId}`;
      const type = collaborator.operator.operatorType;
      collaboratorsMap.set(id, collaborator);
      if (type === 'EMPLOYEE') {
        contactIds.push(id);
      }
      if (type === 'DEPARTMENT') {
        orgIds.push(id);
      }
      if (type === 'GROUP') {
        teamIds.push(`team_${id}`);
      }
    });
    const contacts = contactIds.length ? await getContactById(contactIds) : [];
    const orgs = orgIds.length ? await getOrgByOriginId(orgIds) : [];
    let teams = teamIds.length ? await getTeamById(teamIds) : [];
    teams = teams.map(item => ({
      ...item,
      id: item.id.split('_')[1],
      originId: item.originId.split('_')[1],
    }));
    const list: CoactorMember[] = ([] as CoactorMember[]).concat(
      (contacts || []) as never as CoactorMember[],
      (teams || []) as never as CoactorMember[],
      (orgs || []) as never as CoactorMember[]
    );
    if (list.length) {
      list.forEach(item => {
        const id = (item as ContactModel).contact?.id || (item as EntityOrg).originId || (item as EntityTeamOrg).id;
        const collaborator = collaboratorsMap.get(id);
        if (!collaborator) {
          haveUnknownUsers = true;
          return;
        }
        const { role } = collaborator;
        item.privilege = calcPrivilege(role);
        item.roleName = getPrivilege2Role(item.privilege) as RoleType;
      });
      handles.setContactList(list || []);
    }
    if (handles.checkUpdateContacts) {
      handles.checkUpdateContacts(haveUnknownUsers || collaboratorsMap.size !== list.length);
    }
  });
};
export const ShareModal: React.FC<SharePageProps> = props => {
  const { item, visible, sideTab, hideSharePage, defaultTabKey } = props;
  return (
    <Modal wrapClassName={styles.shareModal} width={476} visible={visible} closable={false} footer={null}>
      <SharePage
        visible={visible}
        item={item}
        roles={item?.roleArr || []}
        // type={type}
        sideTab={sideTab}
        defaultTabKey={defaultTabKey}
        hideSharePage={hideSharePage}
        showAsModal
      />
    </Modal>
  );
};
// eslint-disable-next-line max-statements
const SharePage: React.FC<SharePageProps> = props => {
  const { item, visible, sideTab, hideSharePage, defaultTabKey, roles, showAsModal, from = 'list', className = '' } = props;
  const diskPs = useAppSelector(state => state.diskReducer.diskPs);
  const diskPsR = useAppSelector(state => state.diskReducer.diskPsR);
  const [activeTabKey, setActiveTabKey] = useState<string>(defaultTabKey);
  const [showNewTabTip, setShowNewTabTip] = useState<boolean>(true);
  const [shareDropdownOpen, setShareDropdownOpen] = useState<boolean>(false);
  const [contactList, setContactList] = useState<CoactorMember[]>([]);
  const [privilege, setPrivilege] = useState<CoactorPrivilege>();
  const [externalPrivilege, setExternalPrivilege] = useState<externalCoactorPrivilege>(getIn18Text('KECHAKAN'));
  const [shareType, setShareType] = useState<ShareTypeText>(getIn18Text('JINXIEZUOZHEKE'));
  const [withMessage, setWithMessage] = useState<boolean>(true);
  const [open, setOpen] = useState<boolean>(true);
  const [shareLink, setShareLink] = useState<string>('');
  const [externalShareLink, setExternalShareLink] = useState<string>('');
  const [externalReceiver, setExternalReceiver] = useState<string>('');
  const [externalShareTime, setExternalShareTime] = useState<number>(-1);
  const rangerMoment = useRef<any>([moment(), moment().add(1, 'M')]);
  const externalShareResponse = useRef<any>(null);
  const [coactorState, coactorDispatch] = useReducer(coactorReducer, { coactors: [], status: ShareStatus.SHARE });
  const curUser = systemApi.getCurrentUser();
  const { coactors, status } = coactorState;
  const { id: resourceId } = item || {};
  const resourceType: ResourceType = item?.extensionType === 'dir' ? 'DIRECTORY' : 'FILE';
  const isDir = item?.extensionType === 'dir';
  const isUnitable = item?.fileType === 'unitable';
  const outshareable: boolean = useMemo(() => {
    if (!diskPs) return true;
    return diskPsR.share.includes('USE');
  }, [diskPs, diskPsR]);
  const curRoleName: RoleType = useMemo(() => {
    if (sideTab === 'private') {
      return 'ROLE_ADMIN';
    }
    return getPrivilege2Role(calcPrivilege(roles) || getIn18Text('KECHAKAN')) as RoleType;
  }, [sideTab, roles]);
  let observerID: any;
  const coactorPrivileges: CoactorPrivilege[] = useMemo(() => {
    const privileges = getPrivileges(curRoleName, resourceType);
    setPrivilege(privileges[0]);
    return privileges;
  }, [curRoleName, resourceType]);
  // 分享页提示更新通讯录同步
  const checkUpdateContacts = async (haveUnknownUsers: boolean) => {
    if (from === 'navigationBar' && !inElectron) {
      const lastTimeData = await dataStoreApi.get('client_sync_last_time_');
      const lastTime = lastTimeData.suc ? Number(lastTimeData.data) : 0;
      const currentTime = new Date().getTime();
      const oneDay = 60 * 1000 * 60 * 24;
      // 通讯录同步时间少于1天 或者 已分享用户在本地查不到
      if (lastTime + oneDay < currentTime || haveUnknownUsers) {
        // setModalVisible(true);
        // Toast.loading({ content: '正在同步通讯录', duration:3 });
        syncContacts();
      }
    }
  };
  const externalPrivileges = coactorPrivileges.filter(item => item === getIn18Text('KECHAKAN/XIA') || item === getIn18Text('KECHAKAN'));
  const guideTipsInfo = useAppSelector(state => state.diskReducer.guideTipsInfo);
  const dispatch = useAppDispatch();
  const setRangerMoment = data => {
    rangerMoment.current = data;
  };
  const resetStatus = useCallback(() => {
    setContactList([]);
    setShareLink('');
    setPrivilege(coactorPrivileges[0]);
    setShareType(getIn18Text('JINXIEZUOZHEKE'));
    coactorDispatch({ type: 'back' });
  }, []);
  const syncPrivilegeContact = () => {
    return syncPrivilegeContactImpl(
      {
        resourceId,
        resourceType,
      },
      {
        setContactList,
        checkUpdateContacts,
      }
    );
  };
  useEffect(() => {
    if (observerID !== undefined) {
      apiHolder.api.getEventApi().unregisterSysEventObserver('contactNotify', observerID);
    }
    observerID = apiHolder.api.getEventApi().registerSysEventObserver('contactNotify', {
      func: diff => {
        console.warn('sharepage contactNotify', diff);
        if (diff?.eventData?.hasDiff) {
          syncPrivilegeContact();
        }
      },
    });
    return () => {
      apiHolder.api.getEventApi().unregisterSysEventObserver('contactNotify', observerID);
    };
  }, []);
  const syncContacts = async () => {
    trackerApi.track('pc_disk_sync_contact', {
      type: 'begin',
    });
    try {
      await syncAll(true);
      trackerApi.track('pc_disk_sync_contact', {
        type: 'finish',
      });
    } catch (error) {
      trackerApi.track('pc_disk_sync_contact', {
        type: 'error',
        error,
      });
    }
  };
  useEffect(() => {
    if (visible) {
      if (!resourceId) return;
      syncPrivilegeContact();
      nsShareApi.getNSShareLink({ resourceId, resourceType }).then(data => {
        if (data.shareUrl) {
          const urlSearch = new URLSearchParams(data.shareUrl);
          // 分享链接中，设置当前活动中的sheet索引
          if (props.activedSheetIndex) {
            urlSearch.set('activedSheetIndex', props.activedSheetIndex);
          }
          const shareUrl = safeDecodeURIComponent(urlSearch.toString());
          setShareLink(normalizeShareUrl(shareUrl));
        }
        if (data.shareType) {
          setShareType(normalizeShareType(data.shareType));
        }
      });
      setPrivilege(coactorPrivileges[0]);
    } else {
      props.resetStatusDisabled !== true ? resetStatus() : null;
    }
  }, [visible, props.activedSheetIndex]);
  useEffect(() => {
    setActiveTabKey(defaultTabKey);
  }, [defaultTabKey]);
  useEffect(() => {
    const isShareTipShowed = guideTipsInfo[DiskTipKeyEnum.EXTERNAL_SHARE_TIP].showed;
    const storeExternalShareVisible = !isShareTipShowed || guideTipsInfo[DiskTipKeyEnum.EXTERNAL_SHARE_TIP].visiable;
    const visible = !!storeExternalShareVisible && activeTabKey === '1';
    if (activeTabKey === '2' && storeExternalShareVisible) {
      dataStoreApi.put(DiskTipKeyEnum.EXTERNAL_SHARE_TIP, 'true');
      dispatch(
        DiskActions.setGuideTipsInfoByKey({
          key: DiskTipKeyEnum.EXTERNAL_SHARE_TIP,
          value: {
            ...guideTipsInfo[DiskTipKeyEnum.EXTERNAL_SHARE_TIP],
            showed: true,
            visiable: false,
          },
        })
      );
    }
    setShowNewTabTip(visible);
  }, [activeTabKey]);
  const onShareLinkCopy = (_, result) => {
    if (result) {
      message.success(<span className={styles.msgContentText}>{getIn18Text('FUZHILIANJIECHENG')}</span>);
    } else {
      message.success({
        icon: <CloseCircleIcon />,
        content: <span className={styles.msgContentText}>{getIn18Text('\u201CFUZHILIANJIE')}</span>,
      });
    }
  };
  const createExternalShareLink = async (params?: Partial<RequestGetExternalShareLink>): Promise<ResponseExternalShareLink> => {
    const role = getPrivilege2Role(externalPrivilege) as ExternalRoleType;
    const intervalType = externalShareTime === -100 ? 'ABSOLUTE' : 'RELATIVE';
    const validPeriod: ExternalShareLinkValidPeriod = {
      intervalType,
    };
    if (intervalType === 'RELATIVE') {
      validPeriod.period = externalShareTime;
    } else {
      const startTime = rangerMoment.current[0].startOf('day').valueOf();
      const endTime = rangerMoment.current[1].endOf('day').valueOf();
      validPeriod.interval = {
        startTime,
        endTime,
      };
    }
    const defaultParams = {
      resourceId: resourceId || 0,
      resourceType,
      receiver: externalReceiver,
      role,
      validPeriod,
    };
    let res;
    if (params) {
      const req = Object.assign(defaultParams, params);
      await nsShareApi.modifyNSExternalShareLink({
        shareIdentity: externalShareResponse.current.shareIdentity,
        role: req.role,
        interval: req.validPeriod,
      });
      res = Object.assign(externalShareResponse.current, {
        role: req.role,
        validPeriod: req.validPeriod,
      });
    } else {
      res = await nsShareApi.getNSExternalShareLink(defaultParams);
    }
    externalShareResponse.current = res;
    return res as ResponseExternalShareLink;
  };
  const externalLinkAction = async (type: number) => {
    if (type === 3) {
      setExternalShareLink('');
      setExternalShareTime(-1);
      setExternalReceiver('');
      setExternalPrivilege(getIn18Text('KECHAKAN'));
      return;
    }
    const confirmCallback = async () => {
      if (type === 1) {
        const res = externalShareLink ? externalShareResponse.current : await createExternalShareLink();
        const link = getShareLink(res);
        const ret = copy(link);
        onShareLinkCopy(link, ret);
        setExternalShareLink(link);
        trackerApi.track('pc_disk_click_share', {
          type: isDir ? 'folder' : (item && fileMap[item.fileType]) || 'file',
          entrance: from,
          shareType: 'external',
          shareWay: 'copyLink',
        });
      } else if (type === 2) {
        const res = externalShareLink ? externalShareResponse.current : await createExternalShareLink();
        const link = getShareLink(res);
        setExternalShareLink(link);
        sendShareLinkMail(res);
        trackerApi.track('pc_disk_click_share', {
          type: isDir ? 'folder' : (item && fileMap[item.fileType]) || 'file',
          entrance: from,
          shareType: 'external',
          shareWay: 'copyLink',
        });
      }
    };
    if (!externalReceiver && !externalShareLink) {
      Modal.confirm({
        title: getIn18Text('WEITIANXIEZILIAO'),
        content: <span className={styles.shareTypeText}>{getIn18Text('BUTIANXIEZILIAO')}</span>,
        okText: getIn18Text('QUEREN'),
        cancelText: getIn18Text('QUXIAO'),
        onOk: () => {
          confirmCallback();
        },
        width: 400,
        centered: true,
      });
    } else {
      await confirmCallback();
    }
  };
  const toggleSendOption = () => {
    setWithMessage(prev => !prev);
  };
  const backToFirstPage = () => {
    coactorDispatch({ type: 'back' });
  };
  const cancelAdd = () => {
    backToFirstPage();
  };
  const addCollaborator = async () => {
    if (!resourceId || !privilege) return;
    eventApi.sendSysEvent({ eventName: 'diskNps', eventData: 'RANK_DISK' });
    const userRole = getPrivilege2Role(privilege) as RoleType;
    const groupIds: string[] = [];
    const contactCoactors: operater[] = [];
    const orgCoactors: operater[] = [];
    const groupCoactors: operater[] = [];
    coactors.forEach(coactor => {
      // 联系人
      if ('contact' in coactor) {
        contactCoactors.push({
          operatorId: (coactor as ContactModel).contact.id,
          operatorType: 'EMPLOYEE' as OperatorType,
        });
      }
      // 群组
      else if ('owner' in coactor) {
        const preId = (coactor as EntityTeamOrg).id;
        groupIds.push(`team_${preId}`); // 群组查询得带上前缀
        groupCoactors.push({
          operatorId: preId,
          operatorType: 'GROUP' as OperatorType,
          name: coactor.orgName,
        });
      }
      // 部门
      else {
        orgCoactors.push({
          operatorId: (coactor as EntityOrg).originId,
          operatorType: 'DEPARTMENT' as OperatorType,
        });
      }
    });
    // 查询群组 过滤失效群组
    const params = {
      idList: groupIds,
      needGroup: true,
      needContactData: true,
      needContactModelData: false,
    };
    const emptyGroups: operater[] = []; // 失效群组
    const filteredOrgCoactors: operater[] = []; // 有效群组
    const res = (await contactApi.doGetOrgContactListByTeamId(params)) as Array<EntityOrgTeamContact[]>;
    // 全为空返回空数组
    if (!res || res.length < 1) {
      groupCoactors.forEach(item => emptyGroups.push(item));
    } else {
      res &&
        res.forEach((contactArr, index) => {
          if (!contactArr || contactArr.length == 0) {
            emptyGroups.push(groupCoactors[index]);
          } else {
            filteredOrgCoactors.push({
              operatorId: groupCoactors[index].operatorId,
              operatorType: groupCoactors[index].operatorType,
            });
          }
        });
    }
    // 整理后的Coactors
    let realCoactors = [...coactors];
    if (emptyGroups.length > 0) {
      const emptyGroupIds = emptyGroups.map(item => item.operatorId);
      const emptyGroupNames = emptyGroups.map(item => item.name);
      const filteredCoactors: any[] = coactors.filter(item => !('owner' in item) || !emptyGroupIds.includes((item as EntityTeamOrg).id));
      coactorDispatch({ type: 'change', payload: filteredCoactors });
      realCoactors = filteredCoactors;
      message.warn({ content: `群组：${emptyGroupNames.join('、')} 不存在` });
    }
    const operators = [...contactCoactors, ...filteredOrgCoactors, ...orgCoactors];
    if (operators.length < 1) return;
    const req: RequestAddCollaborator = {
      userRole,
      operators,
      resourceId,
      resourceType,
      needIMNotify: withMessage,
    };
    nsShareApi.addNSCollaborator(req).then(ret => {
      message.success({
        icon: <CheckedCircleIcon />,
        content: <span className={styles.msgContentText}>{getIn18Text('YAOQINGXIEZUOZHE')}</span>,
      });
      trackerApi.track('pc_disk_click_share', {
        type: isDir ? 'folder' : (item && fileMap[item.fileType]) || 'file',
        entrance: from,
        shareType: 'Internal',
        shareWay: 'invite',
      });
      realCoactors.forEach(coactor => {
        coactor.privilege = privilege;
        coactor.roleName = getPrivilege2Role(privilege) as RoleType;
      });
      setContactList(realCoactors.concat(contactList));
      backToFirstPage();
    });
  };
  const removeCollaborator = (contact: CoactorMember) => {
    if (!resourceId) return;
    const operatorId = getContactId(contact);
    const operatorType = getOperatorType(contact);
    const req: RequestRemoveCollaborator = {
      operatorId,
      operatorType,
      resourceId,
      resourceType,
    };
    nsShareApi.removeNSCollaborator(req).then(ret => {
      if (+ret.code === 0) {
        setContactList(contactList.filter(item => item !== contact));
      } else {
      }
    });
  };
  const modifyUserRole = (privilege: CoactorPrivilege, contact: CoactorMember) => {
    if (!resourceId) return;
    const role = getPrivilege2Role(privilege) as RoleType;
    const operatorId = getContactId(contact);
    const operatorType = getOperatorType(contact);
    const req: RequestUpdateCollaborator = {
      role,
      operatorId,
      operatorType,
      resourceId,
      resourceType,
    };
    nsShareApi.updateNSCollaborator(req).then(ret => {
      if (+ret.code === 0) {
        contact.privilege = privilege;
        contact.roleName = role;
        setContactList(contactList.slice());
      } else {
      }
    });
  };
  const changePrivilege = privilege => {
    setPrivilege(privilege);
  };
  const changeExternalPrivilege = privilege => {
    setExternalPrivilege(privilege);
    if (externalShareLink) {
      createExternalShareLink({
        role: getPrivilege2Role(privilege) as ExternalRoleType,
      });
    }
  };
  const modifyShareType = value => {
    setShareType(value);
    if (resourceId && shareTypeMap[value]) {
      const req = {
        resourceId,
        resourceType,
        shareType: shareTypeMap[value] as ShareType,
      };
      nsShareApi.updateNSShareType(req).then(ret => {});
    }
  };
  const shareOptions = (
    curRoleName === 'ROLE_ADMIN'
      ? AllShareOptions
      : curRoleName === 'ROLE_USER_EDIT'
      ? AllShareOptions.slice(0, 3)
      : curRoleName === 'ROLE_USER_UPLOAD'
      ? AllShareOptions.slice(0, 1)
      : AllShareOptions.slice(0, -2)
  ).filter(item => {
    // 文件夹不可编辑
    if (resourceType === 'DIRECTORY') {
      return item.value !== getIn18Text('KEBIANJI');
    }
    return true;
  });
  return (
    <div className={classnames(className, styles.sharePage, { [styles.box]: !showAsModal })}>
      <div
        className={styles.closeIcon}
        onClick={() => {
          hideSharePage && hideSharePage(false);
        }}
      >
        <CloseIcon className="dark-invert" />
      </div>
      <div hidden={status === ShareStatus.SEND_MESSAGE}>
        <Tabs
          activeKey={activeTabKey}
          onTabClick={key => {
            setActiveTabKey(key);
          }}
          animated={false}
          className={styles.tabBar}
        >
          <TabPane
            tab={
              <div className={styles.tabName}>
                <span>{getIn18Text('NEIBUFENXIANG')}</span>
                <div className={styles.tabLink} />
              </div>
            }
            key="1"
          >
            <div className={styles.titleBar}>
              <span className={styles.title}>{getIn18Text('TIANJIAXIEZUOZHE')}</span>
            </div>
            <div className={styles.selectorBox}>
              <CoactorContext.Provider value={{ dispatch: coactorDispatch, coactors, status }}>
                <Selector curCoactors={contactList} className={className} />
              </CoactorContext.Provider>
              <PrivilegeDropdown privileges={coactorPrivileges} privilege={privilege} changePrivilege={changePrivilege} linkStyle={styles.dropdownLink} />
            </div>
            {status === ShareStatus.SHARE && (
              <div className={styles.coactorBox}>
                <div className={styles.coactorTitle}>{getIn18Text('YIYOUXIEZUOZHE')}</div>
                <div className={styles.coactorList}>
                  {!!item?.parentName && (
                    <div className={styles.coactorItem}>
                      <ContactItem item={item.parentName} />
                    </div>
                  )}
                  {contactList.map(item => {
                    const operPrivilege =
                      checkPriority(curRoleName, item.roleName) >= 0 &&
                      !(item as ContactModel)?.contactInfo?.find(info => info.contactItemType === 'EMAIL' && info.contactItemVal === curUser?.id);
                    return (
                      <div key={item?.contact?.id || item?.id} className={styles.coactorItem}>
                        <ContactItem
                          item={item}
                          changePrivilege={modifyUserRole}
                          removeItem={curRoleName === 'ROLE_ADMIN' ? removeCollaborator : undefined}
                          showPrivilege={!operPrivilege}
                          operPrivilege={operPrivilege}
                          coactorPrivileges={coactorPrivileges}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {status === ShareStatus.SHARE && (
              <div className={styles.shareBox}>
                <div className={styles.shareTitle}>{getIn18Text('LIANJIEFENXIANG')}</div>
                <div className={styles.shareLink}>
                  <span className={styles.shareTypeText}>{getIn18Text('HUOQULIANJIEDE')}</span>
                  <div className={styles.shareSelectWrapper}>
                    <Select
                      style={{ width: '192px' }}
                      onDropdownVisibleChange={open => setShareDropdownOpen(open)}
                      showArrow={false}
                      value={shareType}
                      onChange={modifyShareType}
                      className={styles.diskSelect}
                      dropdownClassName="diskDropdown"
                      optionLabelProp="value"
                    >
                      {shareOptions.map(option => {
                        let normalText = option.key;
                        let highlightText = '';
                        if (
                          normalText.endsWith(getIn18Text('KECHAKAN')) ||
                          normalText.endsWith(getIn18Text('KEGUANLI')) ||
                          normalText.endsWith(getIn18Text('KEBIANJI'))
                        ) {
                          normalText = option.key.slice(0, -3);
                          highlightText = option.key.slice(-3);
                        }
                        return (
                          <Option value={option.value} key={option.key}>
                            {normalText}
                            <b>{highlightText}</b>
                          </Option>
                        );
                      })}
                    </Select>
                    {shareDropdownOpen ? <FoldIcon className="dark-invert" /> : <UnfoldIcon className="dark-invert" />}
                  </div>
                  <CopyToClipboard text={shareLink} onCopy={onShareLinkCopy}>
                    <Button
                      type="primary"
                      className={classnames(styles.shareLinkBtn, 'ant-btn-wide')}
                      onClick={() => {
                        trackerApi.track('pc_disk_click_share', {
                          type: isDir ? 'folder' : (item && fileMap[item.fileType]) || 'file',
                          entrance: from,
                          shareType: 'Internal',
                          shareWay: 'copyLink',
                        });
                        eventApi.sendSysEvent({ eventName: 'diskNps', eventData: 'RANK_DISK' });
                      }}
                      icon={
                        <span className="anticon">
                          <LinkIcon />
                        </span>
                      }
                    >
                      {getIn18Text('FUZHILIANJIE')}
                    </Button>
                  </CopyToClipboard>
                </div>
              </div>
            )}
          </TabPane>
          {!isUnitable && outshareable && privilege !== getIn18Text('KESHANGCHUAN') && (
            <TabPane
              tab={
                <div className={styles.tabName}>
                  {showNewTabTip && <div className={styles.tabNewIcon}>new</div>}
                  <ProductAuthTag tagName={ProductTagEnum.ONLINE_RESOURCE}>
                    <span>{getIn18Text('WAIBUFENXIANG')}</span>
                  </ProductAuthTag>
                  <div className={styles.tabLink} />
                </div>
              }
              key="2"
            >
              <div className={styles.titleBar}>
                {status === ShareStatus.SEND_MESSAGE && (
                  <div className={styles.returnIcon} onClick={backToFirstPage}>
                    <ArrowLeftIcon />
                  </div>
                )}
                <span className={styles.title}>{getIn18Text('TIANXIEZILIAOJIE')}</span>
              </div>
              <div className={styles.selectorBox}>
                <Input
                  disabled={!!externalShareLink}
                  maxLength={30}
                  className={styles.selectorWrapper}
                  placeholder={getIn18Text('SHURUXINGMINGHUO')}
                  value={externalReceiver}
                  onChange={e => {
                    setExternalReceiver(e.target.value);
                  }}
                />
                <PrivilegeDropdown
                  privileges={externalPrivileges}
                  privilege={externalPrivilege}
                  changePrivilege={changeExternalPrivilege}
                  linkStyle={styles.dropdownLink}
                />
              </div>
              <div className={styles.timeSetting}>
                <div className={styles.title}>{getIn18Text('YOUXIAOQI')}</div>
                <div className={styles.radioBox}>
                  <div
                    className={styles.radioBoxBtn}
                    onClick={() => {
                      setExternalShareTime(-1);
                      if (externalShareLink) {
                        createExternalShareLink({ validPeriod: { intervalType: 'RELATIVE', period: -1 } });
                      }
                    }}
                  >
                    <SiriusRadio checked={externalShareTime === -1}>{getIn18Text('YONGJIU')}</SiriusRadio>
                  </div>
                  <div
                    className={styles.radioBoxBtn}
                    onClick={() => {
                      setExternalShareTime(7);
                      if (externalShareLink) {
                        createExternalShareLink({ validPeriod: { intervalType: 'RELATIVE', period: 7 } });
                      }
                    }}
                  >
                    <SiriusRadio checked={externalShareTime === 7}>{getIn18Text('7TIAN')}</SiriusRadio>
                  </div>
                  <div
                    className={styles.radioBoxBtn}
                    onClick={() => {
                      setExternalShareTime(1);
                      if (externalShareLink) {
                        createExternalShareLink({ validPeriod: { intervalType: 'RELATIVE', period: 1 } });
                      }
                    }}
                  >
                    <SiriusRadio checked={externalShareTime === 1}>{getIn18Text('1TIAN')}</SiriusRadio>
                  </div>
                  <div
                    className={styles.radioBoxBtn}
                    onClick={() => {
                      setExternalShareTime(-100);
                      if (externalShareLink) {
                        const startTime = rangerMoment.current[0].startOf('day').valueOf();
                        const endTime = rangerMoment.current[1].endOf('day').valueOf();
                        createExternalShareLink({
                          validPeriod: {
                            intervalType: 'ABSOLUTE',
                            interval: {
                              startTime,
                              endTime,
                            },
                          },
                        });
                      }
                    }}
                  >
                    <SiriusRadio checked={externalShareTime === -100}>
                      <div className={styles.rangerWrap}>
                        {externalShareTime !== -100 ? (
                          getIn18Text('ZIDINGYI')
                        ) : (
                          <RangePicker
                            onOpenChange={open => {
                              const start = rangerMoment.current[0];
                              const end = rangerMoment.current[1];
                              console.log('$$$RangePicker open', open, start, end);
                              if (!open && start && end && externalShareLink) {
                                createExternalShareLink({
                                  validPeriod: {
                                    intervalType: 'ABSOLUTE',
                                    interval: {
                                      startTime: start.startOf('day').valueOf(),
                                      endTime: end.endOf('day').valueOf(),
                                    },
                                  },
                                });
                              }
                            }}
                            dropdownClassName={styles.rangerPickerDropdownWrap}
                            disabledDate={current => current && current < moment().startOf('day')}
                            inputReadOnly
                            onChange={list => {
                              if (list) {
                                setRangerMoment(list);
                              }
                            }}
                            // open={open}
                            defaultValue={rangerMoment.current}
                            allowClear={false}
                            format="YYYY.MM.DD"
                            locale={locale}
                            bordered={false}
                            separator=" - "
                            suffixIcon={null}
                            className={styles.radioRange}
                          />
                        )}
                      </div>
                    </SiriusRadio>
                  </div>
                </div>
              </div>
              <div className={styles.linkWrap}>
                <div className={styles.title}>{getIn18Text('LIANJIEFENXIANG')}</div>
                <div className={styles.linkGroup}>
                  <Button
                    onClick={() => {
                      externalLinkAction(1);
                      eventApi.sendSysEvent({ eventName: 'diskNps', eventData: 'RANK_DISK' });
                    }}
                    className={styles.linkGroupBtn}
                    type="default"
                    icon={
                      <span className="anticon">
                        <IconCard type="externalLink" />
                      </span>
                    }
                  >
                    {externalShareLink ? getIn18Text('FUZHILIANJIE') : getIn18Text('CHUANGJIANBINGFUZHI')}
                  </Button>
                  <Button
                    onClick={() => {
                      externalLinkAction(2);
                      eventApi.sendSysEvent({ eventName: 'diskNps', eventData: 'RANK_DISK' });
                    }}
                    className={styles.linkGroupBtn}
                    type="default"
                    icon={
                      <span className="anticon dark-invert">
                        <IconCard type="sendMail" />
                      </span>
                    }
                  >
                    {externalShareLink ? getIn18Text('FASONGLIANJIE') : getIn18Text('CHUANGJIANBINGFASONG')}
                  </Button>
                  <Button
                    hidden={!externalShareLink}
                    onClick={() => {
                      externalLinkAction(3);
                    }}
                    className={styles.linkGroupBtn}
                    type="default"
                    icon={
                      <span className="anticon">
                        <IconCard type="sendMail" />
                      </span>
                    }
                  >
                    {getIn18Text('CHUANGJIANXINDELIAN')}
                  </Button>
                </div>
              </div>
              <div className={styles.tips}>
                {getIn18Text('CIFENXIANGNEIRONG')}
                <p>
                  {getIn18Text('CHAKAN')}
                  <a
                    onClick={() => {
                      systemApi.openNewWindow(ProductProtocols.agreement, false);
                    }}
                  >
                    {getIn18Text('FUWUXIEYI')}
                  </a>{' '}
                  {getIn18Text('HE')}
                  <a
                    onClick={() => {
                      systemApi.openNewWindow(ProductProtocols.privacy, false);
                    }}
                  >
                    {getIn18Text('YINSIZHENGCE')}
                  </a>
                </p>
              </div>
            </TabPane>
          )}
        </Tabs>
      </div>
      <div className={styles.shareStepWrap} hidden={status !== ShareStatus.SEND_MESSAGE}>
        <div className={styles.titleBar}>
          <div className={styles.returnIcon} onClick={backToFirstPage}>
            <ArrowLeftIcon />
          </div>
          <span className={styles.title}>{getIn18Text('TIANJIAXIEZUOZHE')}</span>
        </div>
        <div className={styles.selectorBox}>
          <CoactorContext.Provider value={{ dispatch: coactorDispatch, coactors, status }}>
            <Selector curCoactors={contactList} />
          </CoactorContext.Provider>
          <PrivilegeDropdown privileges={coactorPrivileges} privilege={privilege} changePrivilege={changePrivilege} linkStyle={styles.dropdownLink} />
        </div>
        <div className={[styles.sendBox, nimApi.getIMAuthConfig() ? '' : styles.noImNotify].join(' ')}>
          {nimApi.getIMAuthConfig() ? (
            <div className={styles.sendRadio} onClick={toggleSendOption}>
              {withMessage ? <SelectedIcon /> : <div className={styles.unchecked} />}
              <span>{getIn18Text('FASONGTONGZHI')}</span>
            </div>
          ) : null}
          <div className={styles.buttonBox}>
            <Button onClick={cancelAdd}>{getIn18Text('QUXIAO')}</Button>
            <Button className={styles.confirmBtn} onClick={addCollaborator} type="primary">
              {getIn18Text('WANCHENG')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SharePage;
