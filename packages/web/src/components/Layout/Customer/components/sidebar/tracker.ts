import { api, apis, DataTrackerApi } from 'api';

const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

export const MailSidebarTracker = {
  trackAction(cardType: CardType, action: SideBarActions) {
    trackerApi.track('wiamao_mail_sidebar', {
      action,
      cardType,
    });
  },
  trackTabChange(cardType: CardType, tab: TabShow) {
    trackerApi.track('wiamao_mail_sidebar_tab', {
      cardType,
      tab,
    });
  },
};

export enum CardType {
  Customer = 'Customer',
  Clue = 'Clue',
}

export enum SideBarActions {
  Edit = 'Edit',
  AddBusiness = 'AddBusiness',
  AddSchedule = 'AddSchedule',
  AddFollowup = 'AddFollowup',
  AddManager = 'AddManager',
  ClickIntroduction = 'ClickIntroduction',
  SwitchResource = 'SwitchResource',

  ClueToCustomer = 'ClueToCustomer',
  BackToOpenSea = 'BackToOpenSea',
}

export enum TabShow {
  SalesPitch = 'FollowUp',
  FollowUp = 'FollowUp',
  Setting = 'Setting',
  ContactList = 'Contactlist',
  ContactEmail = 'Contactmail',
}

export const TabNameMap: Record<string | number, TabShow> = {
  0: TabShow.SalesPitch,
  1: TabShow.FollowUp,
  2: TabShow.Setting,
  3: TabShow.ContactList,
  4: TabShow.ContactEmail,
};
