import {
  AddressBookApi,
  AddressBookContact,
  AddressBookContactsParams,
  AddressBookGroup,
  AddressBookGroupsParams,
  AddressBookReturnOpenSeaParams,
  AddressBookSource,
  AddressBookEditAutoGroupParams,
  AddressBookImportLxContactsRes,
  IContactAddressResp,
  IContactsResp,
  RecycleListReq,
  RecycleListRes,
  RecycleOperateReq,
  ImportHistoryReq,
  ImportHistoryRes,
  TSearchContactsReq,
  TSearchContactsResp,
  PublicHistoryImportListReqModel,
  PublicHistoryImportListResModel,
  IAddressMemberListReq,
  IAddressMemberListRes,
  IAddressGroupListItem,
  IAddressOriginListItem,
  IAddressBookAdd2RecycleReq,
  IAddressBookContactReq,
  IAddressBookOpenSeaTextImportReq,
  IAddressBookOpenSeaListReq,
  IAddressBookOpenSeaListRes,
  IAddressBookOpenSeaDetailReq,
  IAddressBookOpenSeaDetail,
  IAddressBookOpenSeaIdsReq,
  IAddressBookOpenSeaIdsNewReq,
  IAddressBookOpenSeaBoolRes,
  IAddressBookOpenSeaAssignReq,
  IAddressBookOpenSeaReturnRecordListReq,
  IAddressBookOpenSeaReturnRecordListRes,
  IImportSelectListReq,
  IImportSelectListRes,
  IAddContact2AddressBookReq,
  IAddressBookUpdateContactReq,
  IAddressBookGetRuleResp,
  IAddressBookUploadResp,
  AddressBookEmailListResp,
  AddressBookGroupTopParams,
  AddressBookSyncConfig,
  AddressBookSyncConfigUpdateReq,
  AddressBookContactLabel,
} from '@/api/logical/address_book';
import { api } from '@/api/api';
import { ApiRequestConfig } from '@/api/data/http';

interface AddressBookApiRequestConfig extends ApiRequestConfig {
  toastError?: boolean;
}

export class AddressBookApiImpl implements AddressBookApi {
  name = 'addressBookApiImpl';

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  private eventApi = api.getEventApi();

  constructor() {}

  init() {
    return this.name;
  }

  errorHandler(error: Error | any) {
    this.eventApi.sendSysEvent({
      auto: true,
      eventSeq: 0,
      eventName: 'error',
      eventLevel: 'error',
      eventData: {
        title: error?.message || error?.data?.message || '网络错误',
        content: '',
        popupType: 'toast',
        popupLevel: 'error',
      },
    });
  }

  async get(url: string, req?: any, config?: AddressBookApiRequestConfig) {
    try {
      const { data } = await this.http.get(url, req, config);

      if (!data) throw {};
      if (!data.success) throw data;

      return data.data;
    } catch (error) {
      const { toastError = true } = config || {};

      toastError && this.errorHandler(error);

      return Promise.reject(error);
    }
  }

  async post(url: string, body: any, config?: AddressBookApiRequestConfig) {
    config = {
      contentType: 'json',
      noEnqueue: false,
      ...(config || {}),
    };

    try {
      const { data } = await this.http.post(url, body, config);

      if (!data) throw {};
      if (!data.success) throw data;

      return data.data;
    } catch (error) {
      const { toastError = true } = config || {};

      toastError && this.errorHandler(error);

      return Promise.reject(error);
    }
  }

  async delete(url: string, req: any, config?: AddressBookApiRequestConfig) {
    try {
      const { data } = await this.http.delete(url, req, config);

      if (!data) throw {};
      if (!data.success) throw data;

      return data.data;
    } catch (error) {
      const { toastError = true } = config || {};

      toastError && this.errorHandler(error);

      return Promise.reject(error);
    }
  }

  getContacts(req: AddressBookContactsParams): Promise<{ list: AddressBookContact[]; total: number }> {
    return this.post(this.systemApi.getUrl('getAddressBookContacts'), req);
  }

  deleteContacts(req: { ids: number[] }): Promise<any> {
    return this.post(this.systemApi.getUrl('deleteAddressBookContacts'), req);
  }

  returnContactsToOpenSea(req: AddressBookReturnOpenSeaParams): Promise<{ result: boolean }> {
    return this.post(this.systemApi.getUrl('returnAddressBookContactsToOpenSea'), req);
  }

  getGroups(req: AddressBookGroupsParams): Promise<{ list: AddressBookGroup[]; total: number }> {
    return this.post(this.systemApi.getUrl('getAddressBookGroups'), req);
  }

  postAddressBookGroupTop(req: AddressBookGroupTopParams): Promise<{ list: AddressBookGroup[]; total: number }> {
    return this.post(this.systemApi.getUrl('postAddressBookGroupTop'), req);
  }

  getGroupDetail(req: { groupId: number }): Promise<AddressBookGroup> {
    return this.get(this.systemApi.getUrl('getAddressBookGroupDetail'), req);
  }

  deleteGroup(req: { groupId: number }): Promise<any> {
    return this.post(this.systemApi.getUrl('deleteAddressBookGroup'), req);
  }

  updateGroupName(req: { groupId: number; groupName: string }): Promise<any> {
    return this.post(this.systemApi.getUrl('updateAddressBookGroupName'), req);
  }

  getSources(): Promise<AddressBookSource[]> {
    return this.get(this.systemApi.getUrl('getAddressBookSources'));
  }

  addAutoGroup(req: AddressBookEditAutoGroupParams): Promise<any> {
    return this.post(this.systemApi.getUrl('addAddressBookAutoGroup'), req);
  }

  editAutoGroup(req: AddressBookEditAutoGroupParams): Promise<any> {
    return this.post(this.systemApi.getUrl('editAddressBookAutoGroup'), req);
  }

  removeContactsFromGroup(req: { groupIds: number[]; addressIds: number[] }): Promise<any> {
    return this.post(this.systemApi.getUrl('removeAddressContactsFromGroup'), req);
  }

  checkLxContactsHasSync(): Promise<{ result: boolean }> {
    return this.post(this.systemApi.getUrl('checkAddressBookLxContactsHasSync'), null);
  }

  scanContactsFromLxContacts(): Promise<{ contactNum: number; notInContactAddressNum: number }> {
    return this.get(this.systemApi.getUrl('scanAddressBookContactsFromLxContacts'));
  }

  importContactsFromLxContacts(): Promise<AddressBookImportLxContactsRes> {
    return this.get(this.systemApi.getUrl('importAddressBookContactsFromLxContacts'));
  }

  async getAddressRecycleList(req: RecycleListReq): Promise<RecycleListRes> {
    return this.post(this.systemApi.getUrl('getAddressRecycleList'), req);
  }

  async removeRecycle(req: RecycleOperateReq): Promise<void> {
    return this.post(this.systemApi.getUrl('removeRecycle'), req);
  }

  async reviveRecycle(req: RecycleOperateReq): Promise<void> {
    return this.post(this.systemApi.getUrl('reviveRecycle'), req);
  }

  addressBookGetMarketGroups() {
    return this.get(this.systemApi.getUrl('addressBookGetMarketGroups'));
  }

  addNewGroup(req: { groupName?: string | undefined; addressIdList: any[] }, config?: ApiRequestConfig): Promise<number> {
    return this.post(this.systemApi.getUrl('addNewGroup'), req, { ...config, timeout: 5 * 60 * 1000 });
  }

  getContactsByGroupId(req: { groupId: number }): Promise<IContactsResp> {
    return this.get(this.systemApi.getUrl('getContactsByGroupId'), req, { timeout: 5 * 60 * 1000 });
  }

  getImportHistoryList(req: ImportHistoryReq): Promise<ImportHistoryRes> {
    return this.post(this.systemApi.getUrl('getImportHistoryList'), req);
  }

  getPublicHistoryList(req: PublicHistoryImportListReqModel): Promise<PublicHistoryImportListResModel> {
    return this.post(this.systemApi.getUrl('getPublicHistoryList'), req);
  }

  uploadContactsByFile(req: FormData, config?: ApiRequestConfig | undefined): Promise<IAddressBookUploadResp> {
    return this.post(this.systemApi.getUrl('uploadContactsByFile'), req, {
      contentType: 'stream',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    });
  }

  uploadContactsByPaste(req: {
    groupList?: number[] | undefined;
    pasteList?: { email?: string | undefined; name?: string | undefined }[] | undefined;
  }): Promise<IAddressBookUploadResp> {
    return this.post(this.systemApi.getUrl('uploadContactsByPaste'), req);
  }

  addressBookSearchContacts(req: TSearchContactsReq): Promise<TSearchContactsResp[]> {
    return this.post(this.systemApi.getUrl('addressBookSearchContacts'), req);
  }

  addressBookGetContactById(req: { id: number }): Promise<IContactAddressResp> {
    return this.get(this.systemApi.getUrl('addressBookGetContactById'), { ...req, allSocialMedias: true });
  }

  addressBookAdd2Recycle(req: IAddressBookAdd2RecycleReq): Promise<void> {
    return this.post(this.systemApi.getUrl('addressBookAdd2Recycle'), req);
  }

  addressBookAddContact2Group(req: IAddressBookContactReq): Promise<void> {
    return this.post(this.systemApi.getUrl('addressBookAddContact2Group'), req);
  }

  addressBookContactTransfer(req: IAddressBookContactReq): Promise<void> {
    return this.post(this.systemApi.getUrl('addressBookContactTransfer'), req);
  }

  addressBookBatchAddGroup(req: { groupNameList: string[] }): Promise<{ groupId: number; groupName: string }[]> {
    return this.post(this.systemApi.getUrl('addressBookBatchAddGroup'), req);
  }
  // 公海文件导入
  addressBookOpenSeaFileImport(req: FormData): Promise<void> {
    return this.post(this.systemApi.getUrl('addressBookOpenSeaFileImport'), req);
  }
  // 公海复制/粘贴导入
  addressBookOpenSeaTextImport(req: IAddressBookOpenSeaTextImportReq): Promise<void> {
    return this.post(this.systemApi.getUrl('addressBookOpenSeaTextImport'), req);
  }
  // 公海列表
  addressBookOpenSeaList(req: IAddressBookOpenSeaListReq): Promise<IAddressBookOpenSeaListRes> {
    return this.post(this.systemApi.getUrl('addressBookOpenSeaList'), req);
  }
  addressBookOpenSeaDetail(req: IAddressBookOpenSeaDetailReq): Promise<IAddressBookOpenSeaDetail> {
    return this.get(this.systemApi.getUrl('addressBookOpenSeaDetail'), req);
  }
  addressBookOpenSeaReceive(req: IAddressBookOpenSeaIdsReq): Promise<IAddressBookOpenSeaBoolRes> {
    return this.post(this.systemApi.getUrl('addressBookOpenSeaReceive'), req);
  }
  addressBookOpenSeaReceiveNew(req: IAddressBookOpenSeaIdsNewReq): Promise<IAddressBookOpenSeaBoolRes> {
    return this.post(this.systemApi.getUrl('addressBookOpenSeaReceiveNew'), req);
  }
  addressBookOpenSeaAssign(req: IAddressBookOpenSeaAssignReq): Promise<IAddressBookOpenSeaBoolRes> {
    return this.post(this.systemApi.getUrl('addressBookOpenSeaAssign'), req);
  }
  addressBookOpenSeaDelete(req: IAddressBookOpenSeaIdsReq): Promise<IAddressBookOpenSeaBoolRes> {
    return this.post(this.systemApi.getUrl('addressBookOpenSeaDelete'), req);
  }
  addressBookOpenSeaReturnRecordList(req: IAddressBookOpenSeaReturnRecordListReq): Promise<IAddressBookOpenSeaReturnRecordListRes> {
    return this.post(this.systemApi.getUrl('addressBookOpenSeaReturnRecordList'), req);
  }

  getMemberList(req: IAddressMemberListReq): Promise<IAddressMemberListRes> {
    return this.post(this.systemApi.getUrl('getMemberList'), req);
  }

  getAddressGroupList(): Promise<IAddressGroupListItem[]> {
    return this.get(this.systemApi.getUrl('getAddressGroupList'));
  }

  getAddressOriginList(): Promise<IAddressOriginListItem[]> {
    return this.get(this.systemApi.getUrl('getAddressOriginList'));
  }

  getImportSelectList(req: IImportSelectListReq): Promise<IImportSelectListRes> {
    return this.post(this.systemApi.getUrl('getImportSelectList'), req);
  }

  getAddressMembers(req: AddressBookContactsParams): Promise<{ list: AddressBookContact[]; total: number }> {
    return this.post(this.systemApi.getUrl('getAddressMembers'), req, { timeout: 5 * 60 * 1000 });
  }

  addContact2AddressBook(req: IAddContact2AddressBookReq): Promise<void> {
    return this.post(this.systemApi.getUrl('addContact2AddressBook'), req);
  }

  addressBookUpdateContact(req: Partial<IAddressBookUpdateContactReq>): Promise<void> {
    return this.post(this.systemApi.getUrl('addressBookUpdateContact'), req);
  }

  addressBookGetGroupRule(req: { sourceType: number }): Promise<IAddressBookGetRuleResp> {
    return this.get(this.systemApi.getUrl('addressBookGetGroupRule'), req);
  }

  addressBookGetEmailList(req: { addressId: number }): Promise<AddressBookEmailListResp[]> {
    return this.get(this.systemApi.getUrl('addressBookGetEmailList'), req);
  }

  // 黑名单
  getEdmBlacklist(req: any): Promise<any> {
    return this.get(this.systemApi.getUrl('addressBookGetEdmBlacklist'), req);
  }

  getEdmNSBlacklist(req: any): Promise<any> {
    return this.get(this.systemApi.getUrl('addressBookGetEdmNSBlacklist'), req);
  }

  addEdmBlacklist(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('addressBookAddEdmBlacklist'), req);
  }

  addEdmNSBlacklist(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('addressBookAddEdmNSBlacklist'), req);
  }

  removeEdmBlacklist(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('addressBookRemoveEdmBlacklist'), req);
  }

  removeEdmNSBlacklist(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('addressBookRemoveEdmNSBlacklist'), req);
  }

  exportBlacklist(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('addressBookExportBlacklist'), req);
  }

  exportNSBlacklist(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('addressBookExportNSBlacklist'), req);
  }

  exportContactsCheck(req: { addressIds: number[] }): Promise<{ isAsync: boolean }> {
    return this.post(this.systemApi.getUrl('addressBookExportContactsCheck'), req);
  }

  exportContactsCheckOpenSea(req: { openSeaIds: number[] }): Promise<{ isAsync: boolean }> {
    return this.post(this.systemApi.getUrl('addressBookExportContactsCheckOpenSea'), req);
  }

  getAddressSyncConfigList(): Promise<AddressBookSyncConfig[]> {
    return this.get(this.systemApi.getUrl('getAddressSyncConfigList'));
  }

  updateAddressSyncConfig(req: AddressBookSyncConfigUpdateReq): Promise<void> {
    return this.post(this.systemApi.getUrl('updateAddressSyncConfig'), req);
  }

  getContactsLabels(req: { emails: string[] }): Promise<{ labels: AddressBookContactLabel[] }> {
    return this.post(this.systemApi.getUrl('getAddressContactsLabels'), req);
  }

  getStopService(): Promise<boolean> {
    return this.get(this.systemApi.getUrl('getAddressBookStopService'));
  }
}

const addressBookApiImpl = new AddressBookApiImpl();

api.registerLogicalApi(addressBookApiImpl);

export default addressBookApiImpl;
