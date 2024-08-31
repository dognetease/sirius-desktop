import { apiHolder, apis, DataTrackerApi } from 'api';

const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

export const whatsAppTracker = {
  trackJob(type: 'show' | 'create' | 'send' | 'target_upload' | 'choose_template') {
    trackerApi.track('pc_markting_whatsapp-broadcast_create_job', { type });
  },

  trackMessage(type: 'show' | 'click' | 'answer') {
    trackerApi.track('pc_markting_whatsapp-pc_markting_whatsapp-message_reply', { type });
  },

  trackTemplate(type: 'show' | 'create' | 'create_new' | 'create_store' | 'submit') {
    trackerApi.track('pc_markting_whatsapp-template_create', { type });
  },

  trackSetting(type: 'show' | 'create' | 'submit') {
    trackerApi.track('pc_markting_whatsapp-system_set', { type });
  },

  trackProxyCheck(type: 0 | 1) {
    trackerApi.track('pc_markting_whatsapp-ip_check', { type });
  },

  trackAiSearch(params: Record<string, any>) {
    trackerApi.track('pc_google_engine_search', params);
  },

  trackAiSearchAction(type: string) {
    trackerApi.track('pc_google_engine_action', { type });
  },

  trackSidebarShow(sidebarType: string) {
    trackerApi.track('PC_whatsapp_indi_wa_sidebar', {
      sidebarType,
    });
  },

  trackPersonalTab(tabType: 'individual_wa_login' | 'individual_wa_send') {
    trackerApi.track('PC_whatsapp_lift_bar', {
      tabType,
    });
  },

  trackBusiness(type: 'button_to_salse' | 'button_to_manager') {
    trackerApi.track('PC_whatsapp_business', {
      type,
    });
  },

  trackPersonalSend() {
    trackerApi.track('PC_whatsapp_indi_wa_send');
  },
};

export const facebookTracker = {
  trackMessage(type: 'filter' | 'refresh' | 'all' | 'unread' | 'detail' | 'reply' | 'picture') {
    trackerApi.track('pc_markting_facebook_message_action', { type });
  },
  trackPostsAction(type: 'search' | 'filter' | 'unread' | 'refresh' | 'detail') {
    trackerApi.track('pc_markting_facebook_posts_action', { type });
  },
  trackPostsDetail(type: 'reply' | 'send' | 'more') {
    trackerApi.track('pc_markting_facebook_posts_detail', { type });
  },
  trackPostsMore(type: 'reply' | 'send') {
    trackerApi.track('pc_markting_facebook_posts_more', { type });
  },
  trackPagesAction(type: 'account' | 'post' | 'detail' | 'bind' | 'search') {
    trackerApi.track('pc_markting_facebook_pages_action', { type });
  },
  trackPagesAccount(type: 'bind' | 'unbind' | 'rebind') {
    trackerApi.track('pc_markting_facebook_pages_account', { type });
  },
  trackPagesBindingPage(type: 'pages' | 'post' | 'message') {
    trackerApi.track('pc_markting_facebook_bindingpage', { type });
  },
};
