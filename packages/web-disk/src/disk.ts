import { apiHolder, DataStoreApi, ModulePs, NSDirContent } from 'api';
import { getIn18Text } from 'api';
const dataStoreApi: DataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
export interface Bread {
  id: number;
  name: string;
}
export type DiskTab = 'recently' | 'private' | 'public' | 'share' | 'recycle' | 'cloudAtt' | 'favorites' | 'normalAtt';
export type DiskPage = 'index' | 'static';
// 统计字段转换
export const trackTypeMap = {
  private: 'personal',
  public: 'enterprise',
  share: 'share',
  recently: 'recently',
  cloudAtt: 'cloudAtt',
  normalAtt: 'normalAtt',
};
// 后端接口字段转换
export const tabInterfaceMap = {
  private: 'personal',
  public: 'ent',
  share: 'personalShare',
  favorites: 'favorites',
  // recently: 'personal',
};
export interface RootInfo {
  private?: NSDirContent;
  public?: NSDirContent;
  cloudAtt?: NSDirContent;
}
export const DiskTipKeyEnum = {
  UNITABLE_CREATE_TIP: 'disk_recently_unitable_create_tip_showed', // 新建unitable入口tip
  CREATE_OR_UPLOAD_TIP: 'disk_recently_create_tip_showed',
  DOC_CREATE_TIP: 'disk_doc_create_tip_showed',
  EXTERNAL_SHARE_TIP: 'disk_recently_external_share_tip_showed',
  WELCOME_TIP: 'disk_recently_welcome_tip_showed', // 初次展示tip
  RENEW_CLOUD_ATT_SUPPORTED_KNOWED_TIP: 'disk_renew_cloud_att_supported_knowed', // 支持续期云附件tip
};

// 提示优先级，数值越小，优先级越高; -1 表示默认展示, 不进行优先级判断
const DiskTipPriorityMap = {
  [DiskTipKeyEnum.CREATE_OR_UPLOAD_TIP]: 2,
  [DiskTipKeyEnum.UNITABLE_CREATE_TIP]: 5,
  [DiskTipKeyEnum.EXTERNAL_SHARE_TIP]: 10,
  [DiskTipKeyEnum.WELCOME_TIP]: 0,
  [DiskTipKeyEnum.DOC_CREATE_TIP]: -1,
};
export type DiskStoreTipKey = (typeof DiskTipKeyEnum)[keyof typeof DiskTipKeyEnum];
export type DiskStoreTipVisible = {
  [k in DiskStoreTipKey]?: boolean;
};
export type DiskGuideTipsInfo = {
  [k in DiskStoreTipKey]: {
    visiable: boolean;
    showed: boolean;
    priority: number;
    content?: k extends typeof DiskTipKeyEnum.WELCOME_TIP
      ? {
          announcementId: number;
          firstDocUrl: string;
        }
      : unknown;
  };
};
export const getDiskGuideTipsInfo = (): DiskGuideTipsInfo =>
  Object.keys(DiskTipKeyEnum).reduce((prev, cur) => {
    const key = DiskTipKeyEnum[cur];
    prev[key] = {
      showed: dataStoreApi.getSync(key)?.data === 'true',
      visiable: false,
      priority: DiskTipPriorityMap[key],
    };
    return prev;
  }, {}) as DiskGuideTipsInfo;
// 检查当前提示优先级是否满足，可以展示; true 表示可以展示
export const checkDiskGuideTipsPriority = (info: DiskGuideTipsInfo, curKey: DiskStoreTipKey): boolean => {
  const curPriority = info[curKey].priority;
  if (curPriority === -1) return true;
  const keys = Object.keys(info) as DiskStoreTipKey[];
  const res = !keys.some(key => {
    const item = info[key];
    return key !== curKey && item.visiable && item.priority < curPriority;
  });
  return res;
};
// 个人空间哪些状态 未初始（请求中或者请求失败） 正常 被锁 未开通
export type PrivateSpaceState = 'uninitial' | 'normal' | 'locked' | 'noOpen';
// 企业空间哪些状态 未初始（请求中或者请求失败） 正常 未开通
export type PublicSpaceState = 'uninitial' | 'normal' | 'noOpen';
// 各个空间的状态
export interface SpaceStateMap {
  private?: PrivateSpaceState;
  public?: PublicSpaceState;
}
// 用户角色/权限id 映射表
export const roleIdMap = {
  100: getIn18Text('GUANLIYUAN'),
  202: getIn18Text('SHANGCHUAN/XIAZAI'),
  201: getIn18Text('XIAZAI'),
  203: getIn18Text('CHAKAN'),
  204: getIn18Text('BIANJI'),
};
export interface electronDownloadProp {
  id: number;
  name: string;
  extensionType: string;
  size?: number;
  resourceSize?: number;
  totalSize?: number;
}
// 易读的网盘权限
export interface DiskPsR {
  public: string[];
  private: string[];
  share: string[];
}
// 网盘的权限key
export const DiskAuthKeys = ['NETDISK_ORG', 'NETDISK_ACC', 'NETDISK_EXTERNAL_SHARE'];
// 网盘完整权限
export const DiskFullAuths = [
  {
    resourceId: '2',
    resourceLabel: 'NETDISK_ORG',
    resourceName: getIn18Text('QIYEKONGJIAN'),
    accessList: [{ accessId: '1', accessLabel: 'USE', accessName: getIn18Text('SHIYONGQUANXIAN') }],
  },
  {
    resourceId: '3',
    resourceLabel: 'NETDISK_ACC',
    resourceName: getIn18Text('GERENKONGJIAN'),
    accessList: [{ accessId: '1', accessLabel: 'USE', accessName: getIn18Text('SHIYONGQUANXIAN') }],
  },
  {
    resourceId: '5',
    resourceLabel: 'NETDISK_EXTERNAL_SHARE',
    resourceName: getIn18Text('DUIWAIFENXIANG'),
    accessList: [{ accessId: '1', accessLabel: 'USE', accessName: getIn18Text('SHIYONGQUANXIAN') }],
  },
];
// 权限转换为易读的格式
export const transDiskPrivileges = (dps: ModulePs[]) => {
  const diskPrivileges = [...dps];
  const res: DiskPsR = {
    public: [],
    private: [],
    share: [],
  };
  // 接口返回可能是乱序 简单排序 方便对比
  diskPrivileges
    .sort((a, b) => (a.resourceLabel > b.resourceLabel ? 1 : -1))
    .forEach(item => {
      const { resourceLabel, accessList } = item;
      // 企业空间
      if (resourceLabel === 'NETDISK_ORG') {
        res.public = [...accessList].sort((a, b) => (a.accessLabel > b.accessLabel ? 1 : -1)).map(item1 => item1.accessLabel);
      }
      // 个人空间
      if (resourceLabel === 'NETDISK_ACC') {
        res.private = [...accessList].sort((a, b) => (a.accessLabel > b.accessLabel ? 1 : -1)).map(item1 => item1.accessLabel);
      }
      // 对外分享
      if (resourceLabel === 'NETDISK_EXTERNAL_SHARE') {
        res.share = [...accessList].sort((a, b) => (a.accessLabel > b.accessLabel ? 1 : -1)).map(item1 => item1.accessLabel);
      }
    });
  return res;
};
