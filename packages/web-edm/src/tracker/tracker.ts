import { apiHolder, apis, DataTrackerApi } from 'api';
import { InvalidStatusMap } from '../send/validEmailAddress/util';
import { getIn18Text } from 'api';

const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

type Attributes = { [key: string]: any };

export const contactBookActionTrackKey = 'pc_marketing_contactBook_action';

const TemplateTypeLabels: Record<number, string> = {
  2: getIn18Text('GERENMOBAN'),
  4: getIn18Text('QIYEMOBAN'),
  3: getIn18Text('TUIJIANMOBAN'),
  '-100': getIn18Text('CONGYINGXIAORENWUXUANZE'),
};

export const edmDataTracker = {
  track(eventId: string, attributes?: Attributes) {
    trackerApi.track(eventId, attributes);
  },

  trackPv(pvType: EDMPvType, attributes?: Attributes) {
    trackerApi.track(pvType, attributes);
  },

  trackSendBoxFilterClick(filterType: EdmSendListFilterType) {
    trackerApi.track('pc_markting_edm_sendlist_Filter_click', {
      type: filterType,
    });
  },

  trackSendListOperation(operateType: EdmSendListOperateType, option: { buttonname: string }) {
    trackerApi.track('pc_markting_edm_sendlist_operation', {
      buttonname: operateType,
    });
  },

  trackEdmDetailOperation(operateType: EdmDetailOperateType, attributes?: { tab?: string; buttonname?: string }) {
    trackerApi.track('pc_markting_edm_sendlist_taskdetail_operation', {
      buttonname: operateType,
      ...attributes,
    });
  },

  trackHistoryAction(from: 'detail' | 'contactTracking', trigger: HistoryActionTrigger) {
    const eventId = from === 'detail' ? 'pc_markting_edm_sendlist_taskdetail_history_view' : 'pc_markting_edm_Contacttracking_history_view';
    trackerApi.track(eventId, {
      buttonname: trigger,
    });
  },

  trackDraftListOperation(operateType: EdmDraftListOperateType) {
    trackerApi.track('pc_markting_edm_drafts_operation', {
      buttonname: operateType,
    });
  },

  trackContactFilterClick(filterType: ContactTrackingFilterType, num?: number) {
    trackerApi.track('pc_markting_edm_Contacttracking_Filter_click', {
      type: filterType,
      number: num,
    });
  },

  trackSaveDraft(type: DraftSaveType, stage: number) {
    trackerApi.track('pc_markting_edm_sendprocess_save', {
      buttonname: type,
      stage: stage + 1,
    });
  },

  trackNextStep(currentStep: number) {
    const events = ['pc_markting_edm_sendprocess_setting_nextbutton', 'pc_markting_edm_sendprocess_edit_nextbutton'];
    if (events[currentStep]) {
      trackerApi.track(events[currentStep]);
    }
  },

  trackDraftEditAdd(type: DraftEditAdd) {
    trackerApi.track('pc_markting_edm_sendprocess_edit_add', {
      buttonname: type,
    });
  },

  trackAddReciver(type: AddReceiverType, attributes: { quantity: number; draftID: string }) {
    trackerApi.track('pc_markting_edm_sendprocess_contact_add', {
      type,
      ...attributes,
    });
    trackerApi.track('pc_markting_edm_filter_select', {
      action: 'add',
    });
  },

  trackSendResult(type: 'now' | 'timing', attributes: { result: string }) {
    trackerApi.track('pc_markting_edm_sendprocess_contact_send', {
      type,
      ...attributes,
    });
  },

  trackResendEdm(tab: string, button: string) {
    trackerApi.track('pc_markting_edm_sendtask_contact_sendagain', {
      tab,
      button,
    });
  },

  trackWriteSettingTime(time: number, version: string) {
    trackerApi.track('pc_markting_edm_sendtask_contact_sendagain_time', {
      time,
      version,
    });
  },

  // 精准发送和普通发送
  trackEdmSendType(sendType: string) {
    trackerApi.track('pc_markting_edm_send_type', {
      send_type: sendType,
    });
  },

  trackEdmSendInvalidContact(contacts: Array<Record<string, string>>) {
    let invalidRecvs = [];
    contacts.forEach(i => {
      let code = parseInt(i.verifyStatus) + 100;
      if (code === InvalidStatusMap[103].id || code === InvalidStatusMap[100].id) {
        invalidRecvs.push(i);
      }
    });
    trackerApi.track('pc_markting_edm_filter_changeContact', {
      contact: invalidRecvs.length,
    });
  },

  trackValidSearch(id: string, params: any) {
    if (params && params.searchParam) {
      const { searchItems = [] } = params.searchParam;
      if (searchItems.length === 0) {
        return;
      }
      const [item = {}] = searchItems;
      const { field, searchKeys = [] } = item;
      if (searchKeys.length === 0) {
        return;
      }
      let action = '';
      switch (field) {
        case 'contactAddressInfo':
          action = 'mail';
          break;
        case 'companyName':
          action = 'company';
          break;
        case 'continent':
        case 'country':
          action = 'country_region';
          break;
        case 'contactName':
          action = 'name';
          break;
        default:
          break;
      }

      if (action.length > 0) {
        trackerApi.track(id, {
          action,
        });
      }
    }
  },

  // 过滤失败
  trackEdmVerifyFail() {
    trackerApi.track('pc_markting_edm_verifyFail');
  },

  // v2过滤失败 前端上报
  trackEdmVerifyFailV2Error(reason: any, timeout: number, contactSize: number) {
    trackerApi.track('pc_markting_edm_verifyFail_v2_error', {
      reason: reason, // 失败原因
      timeout: timeout, // 超时时间
      contactSize: contactSize, // 联系人人数
    });
  },

  // check过滤失败 前端上报
  trackEdmVerifyFailCheckError(reason: any, timeout: number, contactSize: number, repeatCount: number) {
    trackerApi.track('pc_markting_edm_verifyFail_check_error', {
      reason: reason, // 失败原因
      timeout: timeout, // 超时时间
      contactSize: contactSize, // 联系人人数
      repeatCount: repeatCount, // 重试次数
    });
  },

  // 千邮千面接口失败
  trackEdmAiContentError(params: { reason: any; timeout: number; contactSize: number; repeatCount: number; taskId: string }) {
    trackerApi.track('pc_markting_edm_ai_content_error', params);
  },

  // 过滤流程耗时
  trackEdmValidemailTime(params: { totalTime: number; v2Time: number; checkTime: number; renderTime: number; contactSize: number }) {
    trackerApi.track('pc_markting_edm_validemail_time', params);
  },

  // write页面加载耗时
  trackEdmWritePageLoadTime(params: { totalTime: number; from: string; contactSize: number }) {
    trackerApi.track('pc_markting_edm_writePage_load_time', params);
  },

  /**
   * 客户标签曝光埋点
   */
  trackCustomerCard() {
    trackerApi.track('pc_markting_edm_customer_label');
  },
  /**
   * 客户卡片点击
   */
  trackCustomerCardClick() {
    trackerApi.track('pc_markting_edm_customer_label_click');
  },
  /**
   * 客户卡片操作
   */
  trackCustomerCardOp() {
    trackerApi.track('pc_markting_edm_customer_card_click');
  },

  /**
   * 发件任务-过滤地址按钮点击
   */
  trackMarktingEdmFilterCreate() {
    trackerApi.track('pc_markting_edm_filterCreate');
  },
  /**
   * 发件任务-发件任务-过滤中弹窗最小化按钮
   */
  trackMarktingEdmFilterMinimize() {
    trackerApi.track('pc_markting_edm_filterMinimize');
  },
  /**
   * 发件任务-发件任务-发件任务-过滤中弹窗直接过滤并发送按钮
   */
  trackMarktingEdmFilterDirect() {
    trackerApi.track('pc_markting_edm_filterDirect');
  },

  /**
   * 发件任务-发件任务-过滤中选中的类型
   */
  trackMarktingEdmFilterType(filter_type: string) {
    trackerApi.track('pc_markting_edm_filter_type', {
      filter_type: filter_type,
    });
  },

  /**
   * 发件任务-发件任务流程，统计过滤完成次数
   */
  trackMarktingEdmFilterEnding(type: string) {
    trackerApi.track('pc_markting_edm_filterEnding', {
      type: type,
    });
  },

  /**
   * 发件任务-发件任务流程，从点击过滤到展示过滤结果的时长
   */
  trackMarktingEdmFilterTime(time: number) {
    trackerApi.track('pc_markting_edm_filterTime', {
      time: time,
    });
  },

  /**
   * 发件任务-发件任务流程，统计过滤完成次数
   */
  trackMarktingEdmFilterSource(source: string) {
    trackerApi.track('pc_markting_edm_emailSource', {
      source: source,
    });
  },

  /**
   *
   */
  trackMarktingEdmResetClick() {
    trackerApi.track('pc_markting_edm_reset_click');
  },

  /**
   * 发件任务-发件任务流程，统计过滤完成次数
   */
  trackMarktingEdmTaskCreate(source: string) {
    trackerApi.track('pc_markting_edm_taskCreate', {
      source: source,
    });
  },
  /**
   * 发件任务-发件任务流程，统计过滤完成次数
   */
  trackMarktingEdmTaskSuccess(type: string, source: string) {
    trackerApi.track('pc_markting_edm_taskSucess', {
      type: type,
      source: source,
    });
  },
  /**
   * 发件任务-发件任务-过滤成功展示过滤结果页
   */
  trackMarktingEdmFilterSucess() {
    trackerApi.track('pc_markting_edm_filterSucess');
  },
  /**
   * 过滤次数不足、消耗总额的弹窗曝光
   */
  trackFiltrationShortageView() {
    trackerApi.track('pc_markting_edm_filtration_shortage_view');
  },

  /**
   * 过滤次数不足、消耗总额的弹窗曝光
   */
  trackFiltrationShortageClick(action: string) {
    trackerApi.track('pc_markting_edm_filtration_shortage_click', {
      action: action,
    });
  },
  /**
   * 发件设置-添加收件人
   */
  trackEdmContactsCreate() {
    trackerApi.track('pc_markting_edm_contacts_create');
  },
  /**
   * 发件设置-添加收件人
   */
  trackEdmContactsChange() {
    trackerApi.track('pc_markting_edm_contacts_change');
  },
  /**
   * 从营销任务选择埋点
   */
  trackMarketingTemplate(params: { source: string; action_page: string; save_as_template?: string; task_type: string }) {
    trackerApi.track('pc_markting_edm_task_save_as_template', params);
  },
  /**
   * 点击模板按钮
   */
  trackTemplateBtn() {
    trackerApi.track('pc_markting_edm_writeMailPage_template_click');
  },
  /**
   * 点击模板按钮的某个类型
   */
  trackTemplateBtnType(type: number) {
    trackerApi.track('pc_markting_edm_writeMailPage_template_item_click', {
      click_content: TemplateTypeLabels[type],
    });
  },
  /**
   * 点击ai写信
   */
  trackAiWriteBtnClick() {
    trackerApi.track('waimao_mail_click_aiWritingemail');
  },
  /**
   * 点击ai润色
   */
  trackAiOptimizeBtnClick() {
    trackerApi.track('waimao_mail_click_aiRephrase');
  },
  /**
   * 社媒链接提交
   */
  socialLinkSubmit(type: string) {
    trackerApi.track('pc_markting_edm__taskdetail_multi_subjects_click', {
      social_media_type: type,
    });
  },
  /**
   * 点击生成报告
   */
  generateReportClick(count: number) {
    trackerApi.track('pc_markting_report_click', {
      task_number: count,
    });
  },
  /**
   * 生成报告结果
   */
  generateReportResult(result: string) {
    trackerApi.track('pc_markting_report_result', {
      result,
    });
  },
  /**
   * 报告生成平均耗时
   */
  generateReportTime(time: number) {
    trackerApi.track('pc_markting_report_time_request', {
      time,
    });
  },
  /**
   * 下载pdf的按钮点击
   */
  generateReportPdfClick() {
    trackerApi.track('pc_markting_report_download_click');
  },
  /**
   * 报告详情预览时长
   */
  reportPageViewTime(time: number) {
    trackerApi.track('pc_markting_report_view_time', {
      time,
    });
  },
  /**
   * 二次营销-入口开关点击
   */
  secondSendSwitch(action: string) {
    trackerApi.track('pc_markting_edm_secondaryMarketing_switch_click', {
      action,
    });
  },
  /**
   * 二次营销了解更多点击
   */
  clickSecondSendInfo() {
    trackerApi.track('pc_markting_edm_secondaryMarketing_read_more_click');
  },
  /**
   * 二次营销筛选
   */
  secondSendFilter(type: string) {
    trackerApi.track('pc_markting_secondaryMarketing_select', {
      type,
    });
  },
  /**
   * 二次营销-跟进策略卡片操作（点击即统计）
   */
  secondSendStrategy(info: { action: string; editContent: string; type: string }) {
    trackerApi.track('pc_markting_edm_secondaryMarketing_cardOperation', info);
  },
  /**
   * 营销托管数据页面
   */
  dataViewAction(action?: string) {
    trackerApi.track('pc_marketing_edm_entrust_data', action ? { action } : {});
  },
  /**
   * 发件任务-智能营销助手
   * learnMore-了解更多
   * safetySend-安全发送-快速了解
   * secondaryMarketing-二次营销-快速了解
   * multiVersion-千邮千面-快速了解
   */
  taskIntellectTrack(source?: string) {
    trackerApi.track('pc_markting_edm_knowledgeCenter', { source });
  },
  aiGenerateThem() {
    trackerApi.track('waimao_mail_aiSubject_create');
  },
  aiRewriteTheme() {
    trackerApi.track('waimao_mail_aiSubject_rephrase');
  },
  // 数据大盘操作
  aiHostingOverviewAction(action: string) {
    trackerApi.track('pc_marketing_edm_host_data', { action });
  },
  // 成功页埋点
  successPage(action: Record<string, string>) {
    trackerApi.track('pc_markting_edm_taskSuccess', action);
  },
  // 成功页营销托管
  successPageAiHosting(action: Record<string, string>) {
    trackerApi.track('pc_markting_edm_successHost_create', action);
  },
  // 知识广场
  successPageWiki(action: Record<string, string>) {
    trackerApi.track('pc_markting_edm_successKnowledge_show', action);
  },
  successPageWikiItemAction(action: Record<string, string>) {
    trackerApi.track('pc_markting_edm_successKnowledge_click', action);
  },
  taskDetailClick() {
    trackerApi.track('pc_markting_edm__taskdetail_mailbound_guide_click', { click: '点击' });
  },
  taskDetailTip() {
    trackerApi.track('pc_markting_edm__taskdetail_mailbound_guide_click_successtip', { tip: '提示' });
  },
  /**
   * 托管营销数据大盘
   */
  aiHostingDataView(action: string) {
    trackerApi.track('pc_marketing_edm_entrust_data', { action });
  },
  /**
   * 最佳实践引导入口按钮点击
   */
  marktingEdmTaskListAlert() {
    trackerApi.track('markting_edm_taskList_alert', {});
  },
  marktingEdmTaskListNewbox(type: string) {
    trackerApi.track('pc_markting_edm_taskList_newBox', { type });
  },
  /**
   * 视频应用埋点
   */
  marketingEdmVideoClose(eventId: string, config: { finished?: 'yes' | 'no'; duration?: number; type?: string; source?: string }) {
    trackerApi.track(eventId, config);
  },
  /**
   * 任务诊断埋点
   */
  taskDiagnosisPv() {
    trackerApi.track('task_list_diagnosis_and_recommendation_pv', {});
  },
  /**
   * 任务诊断点击
   */
  // taskDiagnosisClick() {
  //   trackerApi.track('task_list_diagnosis_and_recommendation_click', {});
  // },
  /**
   * 内容库操作
   */
  templatePageOp(type: string, source: string) {
    trackerApi.track('pc_markting_edm_contentLibrary_click', {
      type,
      source,
    });
  },
  /**
   * 内容库访问
   */
  templatePageEnter() {
    trackerApi.track('pc_markting_edm_contentLibrary_view', {});
  },
  /**
   * 普通版超额发送引导条曝光
   */
  anxinfaTips() {
    trackerApi.track('pc_markting_edm_excessive_sending', {});
  },
  /**
   * 营销发信-发送按钮的点击
   */
  sendTask(version: string, type: Array<string>) {
    trackerApi.track('pc_markting_edm_sendprocess_send', {
      version,
      type,
    });
  },
  /**
   * 营销发信-试发送按钮的点击
   */
  trySendTask(version: string, type: Array<string>) {
    trackerApi.track('pc_markting_edm_sendprocess_test', {
      version,
      type,
    });
  },
  /**
   * 营销发信-定时发送按钮的点击
   */
  cronSendTask(version: string, type: Array<string>) {
    trackerApi.track('pc_markting_edm_sendprocess_scheduled_send', {
      version,
      type,
    });
  },
  /**
   * 任务列表诊断和建议点击展示
   */
  taskListDiagnosisClick(type: number) {
    trackerApi.track('task_list_diagnosis_and_recommendation_click', {
      type,
    });
  },
  /**
   * 4000以上诊断提醒点击
   */
  upfourCustomersdagnoseClick(type: number) {
    trackerApi.track('upfour_customersdagnose_click', {
      type,
    });
  },
  /**
   * 记录4000以下客户点击去发信的记录
   */
  belowfourCustomersdagnoseClick(type: number) {
    trackerApi.track('belowfour_customersdagnose_click', {
      type,
    });
  },
  /**
   * 内容库操作
   */
  templatePageOp(type: string, source: string) {
    trackerApi.track('pc_markting_edm_contentLibrary_click', {
      type,
      source,
    });
  },
  /**
   * 内容库访问
   */
  templatePageEnter() {
    trackerApi.track('pc_markting_edm_contentLibrary_view', {});
  },
  /**
   * 任务诊断折叠开启
   */
  taskDiagnosisCollapseOpen(type: string) {
    trackerApi.track('task_diagnosis_collapse_open​', { type });
  },
  /**
   * 任务诊断通过次数
   */
  taskDiagnosisSuccessCount(params: { edmId: string; volume: number; type: 0 | 1 }) {
    trackerApi.track('success_detection_times_sending_records', params);
  },
};
export enum EDMPvType {
  EdmModule = 'pc_markting_edm_view',
  SendList = 'pc_markting_edm_sendlist_view',
  Draft = 'pc_markting_edm_drafts_view',
  ContactTracking = 'pc_markting_edm_Contacttracking_view',
  EdmDetail = 'pc_markting_edm_sendlist_Filter_click',
  SendProcess = 'pc_markting_edm_sendprocess_stage_view',
}

export enum EdmSendListOperateType {
  Delete = 'delete',
  Copy = 'copy',
  Revert = 'backout',
  ViewThumbnail = 'viewthumbnail',
  Detail = 'detail',
  NewObject = 'newobject',
}

export enum EdmSendListFilterType {
  SendTime = 'SendTime',
  UpdateTime = 'UpdateTime',
  Search = 'Search',
  State = 'state',
  Manager = 'manager',
  ContactEmail = 'ContactEmail',
  DelState = 'DelState',
}

export enum EdmDetailOperateType {
  Reuse = 'reuse',
  View = 'view',
  Tab = 'tab',
  CreatAutoJob = 'creatautojob',
}

export enum HistoryActionTrigger {
  ReadCount = 'read',
  Unsubscribe = 'unsubscribe',
  Reply = 'reply',
  Arrive = 'arrive',
  Send = 'send',
}

export enum EdmDraftListOperateType {
  NewObject = 'newobject',
  SendNow = 'send',
  Edit = 'edit',
  Delete = 'delete',
}

export enum ContactTrackingFilterType {
  Sent = 'sent',
  State = 'state',
  OpenNum = 'opennumber',
  SendNum = 'sendnumber',
  ArriveNum = 'arrivenumber',
}

export enum DraftSaveType {
  Save = 'save',
  Back = 'back autosave',
  Next = 'next autosave',
}

export enum DraftEditAdd {
  Attachment = 'accessory',
  Image = 'pic',
  Unsubscribe = 'unsubscribe',
  ContactName = 'contact',
}

export enum AddReceiverType {
  Manual = 'Manual',
  Import = 'import',
  Select = 'select',
  SelectFromPersonalContact = 'selectPersonalContact',
}
