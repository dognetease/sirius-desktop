// 业务数据打点
export const LOG_DECLARE = {
  LATER: {
    CLICK_SETLATER: 'pc_im_click_setLater_list',
    CLICK_CANCELLATER: 'pc_im_click_cancelLater_list',
    VIEW_LATER_LIST: 'pc_im_click_later_list',
  },
  MSG_CORNER: {
    DOUBLE_CLICK: 'pc_im_dblclick_menu',
  },
  STICK_TOP: {
    SET_TOP: 'pc_im_slide_right_stick_top_list',
    CANCEL_TOP: 'pc_im_slide_right_remove_top_list',
  },
  TEAM: {
    CREATE: 'pc_im_create_new_group',
  },
  CHAT: {
    ENTER: 'pc_im_ChatDetailView',
    SEND_MSG: 'pc_im_click_send_message',
    DURATION: 'pc_im_chat_render',
  },
  SEARCH: {
    OPEN_SEARCH_MODAL: 'pc_im_click_search_list',
  },
  SESSION: {
    REMOVE: 'pc_im_slide_right_delete_list',
    WILL_CONNECT: 'pc_im_will_connect',
  },
};
// 性能打点
export const performanceLogDeclare = {
  PREFIX_KEY: 'im',
  SUB_KEYS: {
    INIT_SESSION_LIST: 'init_session_list',
    LOAD_SESSION: 'load_session',
    LOAD_SESSION_BYSEARCH: 'load_session_bysearch',
    LOAD_SEARCH_RESULT: 'load_session_result',
    WILL_CONNECT: 'will_connect',
  },
};
