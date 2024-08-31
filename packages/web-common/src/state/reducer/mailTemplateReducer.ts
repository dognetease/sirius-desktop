import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MailBoxEntryContactInfoModel } from 'api';
import { getTemplatesDefaultData } from '@web-setting/Mail/components/CustomTemplate/util';
import { ViewMail } from '../state';

export interface IMailTemplateReducer {
  /** 新建邮件模板内容 */
  mailTemplateContent: ViewMail;
  /** 是否展示右侧联系人选择select */
  showContact: boolean;
  /** 模板名称 */
  mailTemplateName: string;
  /** 是否展示邮件模板列表弹窗 */
  showTemplateList: boolean;
  /** 针对外贸通中普通写信与营销写信同时打开导致重复渲染模版弹窗引发bug的情况 */
  /** 展示邮件模板列表弹窗类型 write-普通写信 marketing-营销写信 */
  showTemplateListType: string;
  /** 是否展示新增邮件模板弹窗 */
  showAddTemplatePop: boolean;
  /** 打开新增模板的入口（list: 模板列表 write: 写信） */
  showAddTemplatePopSource: string;
  /** 打开模板列表默认展示tab（2:个人模板  4:企业模板  3:推荐） */
  defaultActiveTab: number;
  /** 模板内容是否被修改过 */
  isModified: boolean;
  /** 是否关闭新增模板页的预览弹窗 */
  isClosePreviewModal: boolean;
}

const InitialState: IMailTemplateReducer = {
  mailTemplateContent: {} as ViewMail,
  showContact: false,
  mailTemplateName: '',
  showTemplateList: false,
  showTemplateListType: '',
  showAddTemplatePop: false,
  showAddTemplatePopSource: '',
  defaultActiveTab: 0,
  isModified: false,
  isClosePreviewModal: false,
};

const mailTemplateSlice = createSlice({
  name: 'mailTemplateReducer',
  initialState: InitialState,
  reducers: {
    changeShowTemplateList: (
      state,
      action: PayloadAction<{
        isShow: boolean;
        defaultActiveTab?: number;
        templateType?: string;
      }>
    ) => {
      const { isShow, defaultActiveTab = 0, templateType = '' } = action.payload;
      state.defaultActiveTab = defaultActiveTab;
      state.showTemplateList = isShow;
      if (isShow && templateType) {
        state.showTemplateListType = templateType;
      }
      if (!isShow) {
        state.showAddTemplatePopSource = '';
        state.showTemplateListType = '';
      }
    },
    changeShowAddTemplatePop: (
      state,
      action: PayloadAction<{
        isShow: boolean;
        source?: string;
        isModified?: boolean;
      }>
    ) => {
      const { isShow, source = '', isModified } = action.payload;
      state.showAddTemplatePop = isShow;
      if (isShow) {
        // 打开的时候会记录source，关闭的时候不会重置为空string，因为关闭后邮件模板列表需要取这个值
        state.showAddTemplatePopSource = source;
        state.isModified = !!isModified;
      }
      if (!isShow && state.showAddTemplatePopSource === 'list') {
        state.showTemplateList = true;
        state.defaultActiveTab = 2;
      }
    },
    doModifyTemplateName: (state, action: PayloadAction<any>) => {
      state.mailTemplateName = action.payload;
    },
    doWriteTemplate: (state, action: PayloadAction<ViewMail>) => {
      state.mailTemplateContent = action.payload;
      state.showContact = false;
    },
    doMailTemplateInit: state => {
      const originData = getTemplatesDefaultData();
      state.mailTemplateContent = originData;
      state.mailTemplateName = '';
      state.showContact = false;
    },
    doModifyReceiver: (
      state,
      action: PayloadAction<{
        receiverType: string;
        receiver: MailBoxEntryContactInfoModel[] | string[];
        operation?: 'delete' | 'paste';
      }>
    ) => {
      const { receiver, receiverType, operation } = action.payload;

      if (operation === 'paste') {
        const unModifed = state.mailTemplateContent.receiver.filter(r => r.mailMemberType !== receiverType);
        const filtered = state.mailTemplateContent.receiver
          // 过滤出 抄送||密送||发送 的人
          .filter(r => r.mailMemberType === receiverType);

        const result = ([...filtered, ...receiver] as MailBoxEntryContactInfoModel[])
          // 对象去重
          .filter((item, index, arr) => index === arr.findIndex(t => t.contact.contact.accountName === item.contact.contact.accountName));

        state.mailTemplateContent.receiver = [...unModifed, ...result];
        return;
      }

      if (operation === 'delete') {
        // receiver = ['aaaa@vvv.com','cccc@dddd.com'];
        const unModifed = state.mailTemplateContent.receiver.filter(r => r.mailMemberType !== receiverType);
        const filtered = state.mailTemplateContent.receiver
          // 过滤出 抄送||密送||发送 的人
          .filter(r => r.mailMemberType === receiverType)
          // 删除选中的
          .filter(r => !receiver.includes(r.contact.contact.accountName as any));

        state.mailTemplateContent.receiver = [...unModifed, ...filtered];
        return;
      }

      // @todo 这里可能有问题 immer
      const filteredReceiver = state.mailTemplateContent.receiver.filter(item => item && item.mailMemberType !== receiverType) || [];
      state.mailTemplateContent.receiver = [...receiver, ...filteredReceiver] as MailBoxEntryContactInfoModel[];
    },
    doFocusTitle: (state, action: PayloadAction<boolean>) => {
      state.mailTemplateContent.focusTitle = action.payload;
    },
    doModifySubject: (state, action: PayloadAction<string>) => {
      state.mailTemplateContent.entry.title = action.payload;
    },
    doShowWriteContact: (state, action: PayloadAction<any>) => {
      state.mailTemplateContent!.status!.showContact = action.payload;
    },
    doChangeMailContent: (state, action: PayloadAction<any>) => {
      if (state.mailTemplateContent?.entry?.content?.content) {
        // 非初始化的修改content
        state.isModified = true;
      }
      state.mailTemplateContent.entry && (state.mailTemplateContent.entry.content.content = action.payload);
    },
    doReplaceReceiver: (state, action: PayloadAction<any>) => {
      state.mailTemplateContent.receiver = [...action.payload];
    },
    doAfterInit: (state, action: PayloadAction<any>) => {
      state!.mailTemplateContent!.status!.init = action.payload;
    },
    doCCShow: (state, action: PayloadAction<any>) => {
      if (state.mailTemplateContent && state.mailTemplateContent.status) {
        state.mailTemplateContent.status.cc = action.payload;
      }
    },
    doBCCShow: (state, action: PayloadAction<any>) => {
      if (!state?.mailTemplateContent?.status) return;
      state.mailTemplateContent!.status!.bcc = action.payload;
    },
    doConferenceSettting: (state, action: PayloadAction<any>) => {
      state!.mailTemplateContent!.status!.conferenceSetting = action.payload;
    },
    doClosePreviewModal: (state, action: PayloadAction<any>) => {
      state.isClosePreviewModal = action.payload;
    },
  },
});

export const { actions } = mailTemplateSlice;
export default mailTemplateSlice.reducer;
