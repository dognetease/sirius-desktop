/* eslint-disable camelcase */
import { apiHolder, apis, DataTrackerApi } from 'api';

// 哈勃数据统计 日程模块

const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;

class ScheduleTracker {
  tracker: DataTrackerApi['track'] = (...args) => {
    try {
      trackerApi.track.call(trackerApi, ...args);
      // tracker(...args);
    } catch (error) {
      console.warn('Hubble tracker invalite', error);
    }
  };

  /**
   * 从日历左上角新建日程
   * 点击新建入口，即上报事件
   */
  pc_create_schedule_add() {
    this.tracker('pc_create_schedule_add');
  }

  /**
   * 日程编辑页展示日程编辑页展示
   * 日程编辑页面每次展示，均上报
   * 需区分：新建/编辑
   */
  pc_schedule_detail_show(source: 'create' | 'blank' | 'edit') {
    this.tracker('pc_schedule_detail_show', { source });
  }

  /**
   * 查看日历浮窗
   */
  pc_schedule_detail() {
    this.tracker('pc_schedule_detail');
  }

  /**
   * 首次进入日历模块，上报当前用户的视图
   * @param view
   */
  pc_schedule_view(view: 'month' | 'week') {
    this.tracker('pc_schedule_view', { view });
  }

  /**
   * 切换视图上报
   * @param view
   */
  pc_schedule_change_view(view: 'month' | 'week') {
    this.tracker('pc_schedule_change_view', { view });
  }

  /**
   * 不管是周视图还是月视图下，左右今点击均上报
   *  view 视图 参数：周视图、月视图
   *  type 类型 参数：左按钮、右按钮、今
   */
  pc_schedule_change(p: { view: 'month' | 'week' | string; type: 'previous' | 'next' | 'today' }) {
    this.tracker('pc_schedule_change', p);
  }

  /**
   * 日历空白处新建
   * 从日历空白处新建日程，上报埋点
   */
  pc_click_mail_schedule(category: '接受' | '拒绝' | '待定') {
    this.tracker('pc_schedule_blank', { category });
  }

  /**
   * 日历“+“点击
   * 点击“+“上报
   */
  pc_schedule_add() {
    this.tracker('pc_schedule_add');
  }

  /**
   * 订阅日历点击
   * 点击“订阅日历“上报
   */
  pc_schedule_follow() {
    this.tracker('pc_schedule_follow');
  }

  /**
   * 点击“导入日历“上报
   */
  scheduleImport() {
    this.tracker('pc_schedule_import');
  }

  /**
   * 新建日历点击
   */
  scheduleNewCatalog() {
    this.tracker('pc_schedule_new');
  }

  /**
   * 联系人的日历入口展示 区分一下是在联系人卡片，还是通讯录详情页 from 来源 参数：联系人卡片、通讯录详情页
   * 联系人的日历入口点击 区分一下是在联系人卡片，还是通讯录详情页 from 来源 参数：联系人卡片、通讯录详情页
   * 从联系人进入日历，新建日程 区分一下是点击日历视图区域，还是点击新建按钮 type 点击入口类型 参数：新建按钮、日历视图区域
   */
  scheduleContact(options: { action: 'show' | 'click' | 'create'; from?: 'contact_card' | 'contact_detail'; type?: 'create_button' | 'view_zone' }) {
    const { action, ...attrs } = options;
    this.tracker(`pc_contacts_schedule_${action}`, attrs);
  }
}

const scheduleTracker = new ScheduleTracker();

export default scheduleTracker;
