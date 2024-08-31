import { Api, ContactModel, intBool } from '../_base/api';

export interface TaskMailCommonRes<T> {
  success: boolean;
  message?: string;
  code?: number;
  data?: T;
}

export interface TaskMailListReq {
  status: number; // 0-全部：默认 1-进行中
  page: number;
  size?: number;
  detailCount?: number;
}

export interface OperateTaskReq {
  todoId: number;
  mark: number;
}

export interface UrgeTaskReq {
  todoId: number;
}

export type TaskMailSimpleItem = {
  /**
   * 任务id
   */
  todoId: number;
  /**
   * 当前任务所关联的邮件tid
   */
  tid: string;
  /**
   * 当前任务所关联的邮件mid
   */
  mid: string;
  /**
   *  是否置顶
   */
  top: boolean;
  /**
   *   顺序
   */
  pos: number;
};

export type SimpleMailItemEmbedded = {
  todoId?: number;
  sourceType: 0 | 1; // 0：收件箱  1：发件箱
  /**
   * 当前任务所关联的邮件tid
   */
  tid: string;
  /**
   * 当前任务所关联的邮件mid
   */
  mid: string;
};

export interface TaskMailList {
  /**
   * 待办数量
   */
  size: number;
  /**
   * 待办list
   */
  todoList: TaskMailModel[];
  /**
   * 代办list包含的id数据
   */
  todoToMails: TaskMailSimpleItem[];
  /**
   * 是否存在下一页，0：无  1：有
   */
  hasNextPage: intBool;
}

export interface ExecutorModel {
  /**
   * 执行人accId
   */
  accId: string;
  /**
   * 执行人完成时间
   */
  completeTime?: number;
  /**
   * 0-未完成，1-已完成
   */
  status: number;
  /**
   * 2-执行人，3-创建人兼执行人，6-执行人兼关注人，7-创建人兼关注人兼执行人
   */
  type: number;
}

export interface TaskMailModel {
  /**
   * 待办id
   */
  todoId: number;
  /**
   * 是否过期提醒
   */
  alert: boolean;
  /**
   * 固定时间提醒，时间戳单位秒
   */
  alertAt: number;
  /**
   * 提前提醒时间，单位分钟
   */
  alertTime: number;
  /**
   * 已完成人数
   */
  completed: number;
  /**
   * 创建时间，时间戳单位秒
   */
  createdAt: number;
  /**
   * 创建人accId
   */
  createdBy: string;
  /**
   * 截止时间，时间戳单位秒
   */
  deadline: number;
  /**
   * 执行人列表
   */
  executorList: ExecutorModel[];
  /**
   * 关注人列表
   */
  focusList: string[];
  /**
   * 邮件信息
   */
  mailInfos: SimpleMailItemEmbedded[];
  /**
   * 是否过期
   */
  overdue: boolean;
  /**
   * 任务状态：0-进行中，1-已完成，2-创建者完成
   */
  status: number;
  /**
   * 待办标题
   */
  title: string;
  /**
   * 总执行人数
   */
  total: number;
  /**
   * 0-无截止时间，1-时间点，2-全天
   */
  type: number;
  /**
   * 当前用户角色：1-创建人，2-执行人，3-创建人兼执行人，4-关注人，5-创建人兼关注人，6-执行人兼关注人，7-创建人兼关注人兼执行人
   */
  userType: number;
  /**
   * 分组状态：1-已逾期  2：进行中  3-已完成
   */
  groupType: number;
  /**
   * 创建人 + 执行人 + 关注人
   */
  contactList: Map<string, ContactModel>;
}

export interface ListMailDbModel {
  mid: string;
  todoId: number;
  top: boolean;
  tid: string;
  pos: number;
  status: boolean;
  createAt: number;
  updateAt: number;
}

export type TaskMailListRes = TaskMailCommonRes<TaskMailList>;

export interface TaskMailApi extends Api {
  // 获取任务邮件列表
  doGetTaskMailList(params: TaskMailListReq, noCache?: boolean): Promise<TaskMailListRes>;
  // 获取完整邮件数据，包含列表和非列表数据的id
  doGetFullTaskMailList(params: TaskMailListReq, noCache?: boolean, onlyDb?: boolean): Promise<TaskMailListRes>;
  getTaskPageInfo(index: number): { page: number };
  setTaskPageInfo(index: number, count: number): void;
  doGetTaskMailContent(todoIds: number | number[], noCache?: boolean): Promise<TaskMailCommonRes<TaskMailModel[]>>;
  doUrgeTask(params: UrgeTaskReq): Promise<TaskMailCommonRes<string>>;
  doOperateTask(params: OperateTaskReq, userId: string): Promise<TaskMailCommonRes<string>>;
  taskMailModelFormat(task: TaskMailModel): Promise<TaskMailModel>;
  getTaskMailInDb(ids: number | number[]): Promise<TaskMailModel[]>;
}
