import { apiHolder, apis, DataTrackerApi } from 'api';

// 哈勃数据统计 通讯录模块

const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

class ContactTracker {
  tracker: DataTrackerApi['track'] = (...args) => {
    try {
      trackerApi.track.call(trackerApi, ...args);
    } catch (error) {}
  };
  /**
   * 通讯录首页-在搜索输入框中输入搜索内容
   */
  tracker_contact_search_input = () => {
    this.tracker('pcContact_input_searchContent_searchInputBox');
  };
  /**
   * 通讯录首页-点击【搜索输入框】
   */
  tracker_contact_search_focus = () => {
    this.tracker('pcContact_click_searchInputBox_topBar');
  };
  /**
   * 加载联系人详情页
   */
  tracker_contact_view_detail = () => {
    this.tracker('pcContact_view_contactsDetailPage');
  };

  /**
   * 联系人详情页-点击联系人详情中的按钮
   * @param buttonName 按钮名称
   */
  tracker_contact_detail_click = (
    // '发邮件' | '发消息' | '编辑' | '删除' | '复制邮箱地址' | '点击邮箱进入写信'
    buttonName: string,
    // 页面类型
    pageType?: string
  ) => {
    this.tracker('pcContact_click_button_contactsDetailPage', {
      buttonName,
      pageType: pageType || '',
    });
  };

  /**
   * 新建/编辑邮件列表弹框-点击【保存】按钮
   * @param saveStatus 保存状态
   */
  tracker_mail_list_save_click = (saveStatus: string) => {
    this.tracker('pcContact_click_save_addOrEditMailGroupListPage', {
      saveStatus,
    });
  };

  /**
   * 在邮件列表的列表页，点击顶部按钮
   * @param buttonName 按钮名称
   */
  tracker_mail_list_top_click = (buttonName: string) => {
    this.tracker('pcContact_click_topButton_mailGroupList', {
      buttonName,
    });
  };

  /**
   * 加载企业通讯录-邮件列表的列表页
   * @param buttonName 按钮名称
   */
  tracker_mail_list_view = (permission: string) => {
    this.tracker('pcContact_view_mailGroupList', {
      permission,
    });
  };

  /**
   * 联系人列表-点击联系人
   * @param fromContact 所在通讯录
   */
  // tracker_contact_list_click = (fromContact: '个人通讯录' | '企业通讯录') => {
  tracker_contact_list_click = (fromContact: string) => {
    this.tracker('pcContact_click_contacts_contactsList', { fromContact });
  };

  /**
   * 个人通讯录-点击【新建联系人】按钮
   */
  tracker_contact_add_click = () => {
    this.tracker('pcContact_click_addNewContacts');
  };

  // 个人通讯录- 点击新增星标联系人
  tracker_contact_personal_mark_add = (source: string) => {
    this.tracker('pcMail_click_addStarContact', { source });
  };

  tracker_contact_personal_mark_startIcon_click = (source: string, marked: boolean) => {
    this.tracker('pcMail_click_starIcon', { source, result: marked ? '添加星标' : '取消星标' });
  };

  /**
   * 新建联系人页面-点击【保存】按钮
   * @param params 上报参数
   */
  tracker_contact_save_click = (params: { content: string; mailDressCount: number; phoneNumberCount: number }) => {
    this.tracker('pcContact_click_complete_addContactsPage', params);
  };

  /**
   * 导入联系人【保存】按钮
   */
  tracker_contact_import_save_click = (params?: { personalOrgId?: string; type?: 0 | 1 | 2 }) => {
    this.tracker('pcContact_click_confirm_importContactsPage', params);
  };

  /**
   * 导出联系人【保存】按钮
   */
  tracker_contact_export_click = (params?: { personalOrgId?: string; type?: 'csv' | 'vcf' }) => {
    this.tracker('pcContact_click_confirm_exportContactsPage', params);
  };
}

const ContactTrackerIns = new ContactTracker();

export default ContactTrackerIns;
