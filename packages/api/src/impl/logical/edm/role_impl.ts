import {
  DataRangeModel,
  EdmRoleApi,
  MenuItem,
  ResShowKfEntry,
  ModulePrivilege,
  ReqAccountRoleOp,
  ReqAdminAccount,
  ReqModulePrivilege,
  ResVersion,
  ReqRoleInfo,
  ReqRoleOp,
  ReqSaveMembers,
  ReqSavePrivilege,
  MenuListNew,
  ResAdminAccount,
  ResRoleList,
  RoleDetailModel,
  RoleModel,
  MenuListV2Res,
  MenuVersion,
  MenuItemNew,
  WhiteListRes,
} from '@/api/logical/edm_role';
import { apis } from '../../../config';
import { api } from '../../../api/api';
import { ApiRequestConfig } from '../../../api/data/http';
import { locationHelper } from '@/api/util/location_helper';
import { MailPlusCustomerApi, MailPlusEdmPrivilegeViewData } from '@/api/logical/mail_plus_customer';

export class EdmRoleApiImpl implements EdmRoleApi {
  name = apis.edmRoleApiImpl;

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  private eventApi = api.getEventApi();

  private mailPlusCustomerApi = api.requireLogicalApi(apis.mailPlusCustomerApiImpl) as MailPlusCustomerApi;

  private baseParams = {
    productVersionId: 'professional',
    productId: 'fastmail',
  };

  private contactPrivilegeRangeData: string[] | undefined;

  private cluePrivilegeRangeData: string[] | undefined;

  private privilegeMap: Map<string, Set<string>> | undefined;

  private enabledSyncBkRole = false;

  init() {
    return this.name;
  }

  afterInit() {
    if (process.env.BUILD_ISEDM && this.systemApi.getCurrentUser()) {
      this.getModuleDataRange('CONTACT').then(() => {
        console.warn('[role_impl] init get contactPrivilegRangeData');
      });
      this.getModuleDataRange('CHANNEL').then(() => {
        console.warn('[role_impl] init get cluePrivilegRangeData');
      });
      // 非后台、非主窗口的其他窗口（例如日历独立窗口）时，需要请求一遍权限数据
      if (!locationHelper.isBkPage() && !locationHelper.isMainPage() && !this.privilegeMap) {
        this.getCurrentPrivilege();
      }
    }
    return this.name;
  }

  doGetContactPrivilegeRangeData() {
    return this.contactPrivilegeRangeData;
  }

  doGetCluePrivilegeRangeData() {
    return this.cluePrivilegeRangeData;
  }

  doGetMailPlusEdmViewPrivilege(): MailPlusEdmPrivilegeViewData {
    return {
      customer: this.doGetPrivilegeByLabel('CONTACT', 'VIEW'),
      openSeaCustomer: this.doGetPrivilegeByLabel('CONTACT_OPEN_SEA', 'VIEW'),
      clue: this.doGetPrivilegeByLabel('CHANNEL', 'VIEW'),
      openSeaClue: this.doGetPrivilegeByLabel('CHANNEL_OPEN_SEA', 'VIEW'),
    };
  }

  doGetContactViewPrivilege(): boolean {
    return this.doGetMailPlusEdmViewPrivilege().customer;
  }

  doGetPrivilegeByLabel(resourceLabel: string, accessLabel: string) {
    if (!this.privilegeMap) {
      return false;
    }
    const accessSet = this.privilegeMap.get(resourceLabel);
    if (accessSet?.size) {
      return accessSet.has(accessLabel);
    }
    return false;
  }

  doGetPrivilegeMap() {
    return this.privilegeMap;
  }

  async get(url: string, req: any, config?: ApiRequestConfig) {
    const param = {
      ...this.baseParams,
      ...req,
    };
    try {
      const { data } = await this.http.get(url, param, config);
      if (!data || !data.success) {
        return Promise.reject(data?.message);
      }
      return data.data;
    } catch (res: any) {
      if (res.status >= 500 && res.status < 600) {
        this.eventApi.sendSysEvent({
          eventSeq: 0,
          eventName: 'error',
          eventLevel: 'error',
          eventData: {
            title: '服务器没有响应，请稍后再试',
            popupType: 'toast',
            popupLevel: 'error',
            content: '',
          },
          auto: true,
        });
      }
      return Promise.reject(res.data);
    }
  }

  async post(url: string, body: any, reqConfig?: ApiRequestConfig) {
    const config = {
      contentType: 'form',
      noEnqueue: true,
      ...(reqConfig || {}),
    };
    const param = {
      ...this.baseParams,
      ...body,
    };
    try {
      const { data } = await this.http.post(url, param, config as ApiRequestConfig);

      if (!data || !data.success) {
        return Promise.reject(data);
      }
      return data.data;
    } catch (res: any) {
      if (res.status >= 500 && res.status < 600) {
        this.eventApi.sendSysEvent({
          eventSeq: 0,
          eventName: 'error',
          eventLevel: 'error',
          eventData: {
            title: '服务器没有响应，请稍后再试',
            popupType: 'toast',
            popupLevel: 'error',
            content: '',
          },
          auto: true,
        });
      }
      return Promise.reject(res.data);
    }
  }

  getProductPrivilege(productId = 'fastmail'): Promise<boolean> {
    return this.http
      .get(this.systemApi.getUrl('getProductPrivilege'), {
        productId,
      })
      .then(res => {
        const flag = res.data?.data?.moduleList?.length > 0;
        return flag;
      });
  }

  getEdmAccount(req?: ReqAdminAccount): Promise<ResAdminAccount> {
    return this.get(this.systemApi.getUrl('getEdmAccount'), req);
  }

  getCurrentRoleInfo(req?: ReqRoleInfo): Promise<Array<RoleModel>> {
    return this.get(this.systemApi.getUrl('getCurrentRoleInfo'), req);
  }

  getRoleList(req?: ReqAdminAccount): Promise<ResRoleList> {
    return this.get(this.systemApi.getUrl('getRoleList'), req);
  }

  addOrRemoveRoleToAccount(req: ReqAccountRoleOp): Promise<boolean> {
    return this.post(this.systemApi.getUrl('addOrRemoveRoleToAccount'), req, {
      contentType: 'json',
    });
  }

  addOrRemoveRole(req: ReqRoleOp): Promise<{ roleId: string }> {
    return this.post(this.systemApi.getUrl('addOrRemoveRole'), req);
  }

  saveMembersToRole(req: ReqSaveMembers): Promise<boolean> {
    return this.post(this.systemApi.getUrl('saveMembersToRole'), req, {
      contentType: 'json',
    });
  }

  getRoleDetail(roleId: string): Promise<RoleDetailModel> {
    return this.get(this.systemApi.getUrl('getRoleDetail'), {
      roleId,
    });
  }

  // 获取权限
  async getCurrentPrivilege(req?: ReqAdminAccount): Promise<ModulePrivilege[]> {
    try {
      const data = (await this.get(this.systemApi.getUrl('getCurrentPrivilege'), req)) as ModulePrivilege[];
      const groups: Map<string, Set<string>> = new Map();
      const groups2: Record<string, string[]> = {};
      data.forEach(item => {
        const tempSet: Set<string> = new Set();
        item.accessList.forEach(access => {
          tempSet.add(access.accessLabel);
        });
        groups.set(item.resourceLabel, tempSet);
        groups2[item.resourceLabel] = [...tempSet];
      });
      const isReady = !!this.privilegeMap;
      this.privilegeMap = groups;
      this.mailPlusCustomerApi.doSetLastEdmPrivilegeData({
        privilegeMap: groups,
      });
      this.setBKEdmRoleData({
        privilegeMap: groups2,
      });
      if (!isReady) {
        this.eventApi.sendSimpleSysEvent('edmPrivilegeReady');
      }
      return data;
    } catch (e) {
      console.error('getCurrentPrivilege error', e);
      return Promise.reject(e);
    }
  }

  getAllPrivilege(req?: ReqAdminAccount): Promise<ModulePrivilege[]> {
    return this.get(this.systemApi.getUrl('getAllPrivilege'), req);
  }

  getVersion(req: ReqAdminAccount): Promise<ResVersion> {
    return this.get(this.systemApi.getUrl('getVersion'), req);
  }

  getModulePrivilege(req: ReqModulePrivilege): Promise<ModulePrivilege> {
    return this.get(this.systemApi.getUrl('getModulePrivilege'), req);
  }

  setBKEdmRoleData(params: { privilegeMap?: Record<string, Array<string>>; contactPrivilegeRangeData?: string[] }) {
    if (!this.enabledSyncBkRole) {
      return;
    }
    if (locationHelper.isBkPage()) {
      const { privilegeMap, contactPrivilegeRangeData } = params;
      if (privilegeMap) {
        const tempMap = new Map<string, Set<string>>();
        Object.keys(privilegeMap).forEach(key => {
          tempMap.set(key, new Set(privilegeMap[key] || []));
        });
        this.privilegeMap = tempMap;
      }
      if (contactPrivilegeRangeData) {
        this.contactPrivilegeRangeData = contactPrivilegeRangeData;
      }
    }
  }

  async getModuleDataRange(resourceLabel: string): Promise<DataRangeModel> {
    try {
      const data = (await this.get(this.systemApi.getUrl('getModuleDataRange'), {
        resourceLabel,
        accessLabel: 'DATA',
      })) as DataRangeModel;
      if (resourceLabel === 'CONTACT' && data) {
        this.contactPrivilegeRangeData = data.accIds;
        this.mailPlusCustomerApi.doSetLastEdmPrivilegeData({
          contactPrivilegeRangeData: data.accIds,
        });
        this.setBKEdmRoleData({
          contactPrivilegeRangeData: data.accIds,
        });
      }
      if (resourceLabel === 'CHANNEL' && data) {
        this.cluePrivilegeRangeData = data.accIds;
        this.mailPlusCustomerApi.doSetLastEdmPrivilegeData({
          cluePrivilegeRangeData: data.accIds,
        });
      }
      return data;
    } catch (e) {
      console.error('getModuleDataRange error', e);
      return Promise.reject(e);
    }
  }

  savePrivilege(req: ReqSavePrivilege): Promise<boolean> {
    return this.post(this.systemApi.getUrl('savePrivilege'), req, {
      contentType: 'json',
    });
  }

  getMenuList(): Promise<MenuItem[]> {
    return this.get(this.systemApi.getUrl('getMenuList'), undefined).then((data: MenuItem[]) =>
      data.map(item => {
        // 地址簿设置下屏蔽 地址簿公海
        if (item.menuLabel !== 'ADDRESS_BOOK') return item;

        const ADDRESS_BOOK_LIST = item.subMenuItems?.find(subItem => subItem.menuLabel === 'ADDRESS_BOOK_LIST');
        const MARKET_DATA_STAT = item.subMenuItems?.find(subItem => subItem.menuLabel === 'MARKET_DATA_STAT');

        return {
          ...item,
          showMenu: ADDRESS_BOOK_LIST?.showMenu || MARKET_DATA_STAT?.showMenu,
          subMenuItems: item.subMenuItems?.filter(subItem => subItem.menuLabel !== 'ADDRESS_OPEN_SEA'),
        };
      })
    );
  }

  getMenuListV2(): Promise<MenuListV2Res> {
    return this.get(this.systemApi.getUrl('getMenuListV2'), {
      lan:
        {
          zh: 'zh_CN',
          en: 'en_US',
          'zh-trad': 'zh_TW',
        }[this.systemApi.getSystemLang()] || 'zh_CN',
    });
  }

  getMenuListNew(): Promise<MenuItemNew> {
    return this.get(this.systemApi.getUrl('getMenuListNew'), {
      lan:
        {
          zh: 'zh_CN',
          en: 'en_US',
          'zh-trad': 'zh_TW',
        }[this.systemApi.getSystemLang()] || 'zh_CN',
    });
  }

  getMenuWhitelist(): Promise<WhiteListRes> {
    return this.get(this.systemApi.getUrl('getMenuWhitelist'), undefined);
  }

  getMenuSwitch(): Promise<{ menuVersionWithoutOldSwitch: boolean }> {
    return this.get(this.systemApi.getUrl('getMenuSwitch'), undefined);
  }

  getKfInfo(): Promise<{ orgId: string; corpId: number; corpName: string; domain: string }> {
    return this.get(this.systemApi.getUrl('getKfInfo'), undefined);
  }

  getMenuVersion(): Promise<{ menuVersion: MenuVersion }> {
    return this.get(this.systemApi.getUrl('getMenuVersion'), undefined);
  }

  setMenuListNew(req: MenuListNew): Promise<MenuItem[]> {
    return this.post(this.systemApi.getUrl('setMenuListNew'), req, {
      contentType: 'json',
    });
  }

  showKfEntry(): Promise<ResShowKfEntry> {
    return this.get(this.systemApi.getUrl('showKfEntry'), undefined);
  }

  saveMenuSetting(req: { menuItems: MenuItem[] }): Promise<boolean> {
    return this.post(this.systemApi.getUrl('saveMenuSetting'), req, {
      contentType: 'json',
    });
  }

  saveMenuSettingV2(req: { menuItems: MenuItem[] }): Promise<boolean> {
    return this.post(this.systemApi.getUrl('saveMenuSettingV2'), req, {
      contentType: 'json',
    });
  }

  aiFloatEntrance(): Promise<{ showAIAssistance: boolean }> {
    return this.get(this.systemApi.getUrl('aiFloatEntrance'), { productId: 'fastmail', productVersionId: 'professional' });
  }
}

const edmRoleApiImpl = new EdmRoleApiImpl();
api.registerLogicalApi(edmRoleApiImpl);
export default edmRoleApiImpl;
