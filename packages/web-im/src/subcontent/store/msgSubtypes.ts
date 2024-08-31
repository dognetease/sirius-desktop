export enum MsgSubtypes {
  DRAW_TEXT_MSG = 1000, // 本段撤回的文本消息
  DRAW_MSG = 1001, // 本段撤回消息
  DRAWN_MSG = 1002, // 非本端撤回的消息
  REMOVE_TEAMMEBER = 1003, // 移除群成员
}
