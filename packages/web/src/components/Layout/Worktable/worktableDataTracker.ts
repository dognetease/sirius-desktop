import { Filters, PanelKeys } from '@web-common/state/reducer/worktableReducer';
import { api, apis, DataTrackerApi } from 'api';

const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

type CardDataScope = 'my' | 'all';

export const worktableDataTracker = {
  trackTabClick() {
    trackerApi.track('pc_markting_workbench_click');
  },

  trackMyMailOperate(operate: MyEmailOperate) {
    trackerApi.track('pc_markting_workbench_my_customer_mail_operate', {
      buttonname: operate,
    });
  },

  trackMyMailFilter() {
    trackerApi.track('pc_markting_workbench_my_customer_mail_filter', {
      type: 'time',
    });
  },

  trackEdmOperate(scope: CardDataScope, operate: EdmCardOperate) {
    trackerApi.track(`pc_markting_workbench_${scope}_mail_marketing_operate`, {
      buttonname: operate,
    });
  },

  trackEdmFilter(scope: CardDataScope, type: CardFilter) {
    trackerApi.track(`pc_markting_workbench_${scope}_mail_marketing_filter`, {
      type,
    });
  },

  trackScheduleOperate(operate: RecentScheduleOperate) {
    trackerApi.track('pc_markting_workbench_recent_schedule_operate', {
      buttonname: operate,
    });
  },

  trackScheduleFilter() {
    trackerApi.track('pc_markting_workbench_recent_schedule_filter', {
      type: 'time',
    });
  },

  trackCustomerOperate(scope: CardDataScope, operate: CustomerOperate) {
    trackerApi.track(`pc_markting_workbench_${scope}_customer_operate`, {
      buttonname: operate,
    });
  },

  trackCustomerFilter(scope: CardDataScope, type: CardFilter) {
    trackerApi.track(`pc_markting_workbench_${scope}_customer_filter`, {
      type,
    });
  },

  trackCustomerFollowOperate(scope: CardDataScope, operate: CustomerFollowOperate) {
    trackerApi.track(`pc_markting_workbench_${scope}_customer_trend_operate`, {
      buttonname: operate,
    });
  },

  trackCustomerFollowFilter(scope: CardDataScope, type: CardFilter) {
    trackerApi.track(`pc_markting_workbench_${scope}_customer_trend_filter`, {
      type,
    });
  },

  trackLayout(layouts: Array<{ i: string; w: number; h: number; x: number; y: number }>) {
    const mapPanelName: Record<PanelKeys, string> = {
      myEmail: 'my_customer_email',
      myEdm: 'my_mail_marketing',
      allEdm: 'all_mail_marketing',
      schedule: 'recent_schedule',
      myCustomer: 'my_customer',
      allCustomer: 'all_customer',
      myCustomerFollows: 'my_customer_trend',
      allCustomerFollows: 'all_customer_trend',
    };
    trackerApi.track('pc_markting_workbench_canvas', {
      layouts: layouts.map(item => ({
        cardName: mapPanelName[item.i as PanelKeys] || item.i,
        place: [item.x, item.y].join(','),
        area: [item.w, item.h].join(','),
      })),
    });
  },
};

export function fromCardFilters(filter: Partial<Filters>) {
  const keys = Object.keys(filter);
  const map: Record<string, CardFilter> = {
    start_date: CardFilter.time,
    end_date: CardFilter.time,
    account_id_list: CardFilter.member,
    company_level: CardFilter.grade,
    star_level: CardFilter.star,
  };
  for (let i = 0; i < keys.length; i++) {
    if (map[keys[i]] !== undefined) {
      return map[keys[i]];
    }
  }
  return void 0;
}

export enum CardName {
  myMail = 'pc_markting_workbench_my_customer_mail',
  myEdm = 'pc_markting_workbench_my_mail_marketing',
  allEdm = 'pc_markting_workbench_all_mail_marketing',
  recentSchedule = 'pc_markting_workbench_recent_schedule',
  myCustomer = 'pc_markting_workbench_my_customer',
  allCustomer = 'pc_markting_workbench_all_customer',
  myCustomerFollows = 'pc_markting_workbench_my_customer_trend',
  allCustomerFollows = 'pc_markting_workbench_all_customer_trend',
}

export enum MyEmailOperate {
  preview = 'preview',
  refresh = 'refresh',
  sendMail = 'sendMail',
  receiveMail = 'receiveMail',
}

export enum EdmCardOperate {
  preview = 'preview',
  refresh = 'refresh',
  sendNumClick = 'sendNumClick',
}

export enum CardFilter {
  time = 'time',
  member = 'peopleScope',
  star = 'star',
  grade = 'grade',
}

export enum RecentScheduleOperate {
  preview = 'preview',
  refresh = 'refresh',
  edit = 'edit',
  delete = 'delete',
  timeOrder = 'timerOrder',
  relateDataClick = 'relateDataClick',
}

export enum CustomerOperate {
  preview = 'preview',
  refresh = 'refresh',
  newCustomerClick = 'newCustomerClick',
  newOpportunityClick = 'newOpportunityClick',
}

export enum CustomerFollowOperate {
  preview = 'preview',
  refresh = 'refresh',
  starOrder = 'starOrder',
  gradeOrder = 'gradeOrder',
  timeOrder = 'timerOrder',
  followup = 'followup',
  mail = 'mail',
  customerDataClick = 'customerDataClick',
}
