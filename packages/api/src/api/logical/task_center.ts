import { Api } from '@/api/_base/api';

export interface SystemTask {
  id: number;
  bizId: string;
  bizContent: string;
  taskId: string;
  taskName: string;
  taskType: string;
  taskStatus: SystemTaskStatus;
  createAt: string;
  moduleType: string;
}

export enum SystemTaskStatus {
  INCOMPLETE = 'INCOMPLETE',
  COMPLETE = 'COMPLETE',
  CLOSE = 'CLOSE',
}

export enum SystemTaskStatusName {
  INCOMPLETE = '待处理',
  COMPLETE = '已完成',
  CLOSE = '已关闭',
}

export interface SystemTasksReq {
  /**
   * @param lastId
   * 分页请求时: 不传
   * 滚动请求时: 传 id, 或 -1
   */
  lastId?: number;
  page?: number;
  pageSize?: number;
  moduleTypes?: string;
  taskTypes?: string;
  taskStatus?: string;
}

export interface SystemTasksRes {
  /**
   * @param totalSize 分场景有不同含义
   * 分页请求时: 代表总数据量
   * 滚动请求时: 代表余下数据量
   */
  totalSize: number;
  /**
   * @param totalPage 分场景有不同含义
   * 分页请求时: 代表总页数
   * 滚动请求时: 代表是否有更多数据, totalPage > 1 时有更多数据
   */
  totalPage: number;
  filterTaskCount: number; // 当前过滤条件下的总任务数量
  totalTaskCount: number; // 全部任务数量
  handledTaskCount: number; // 全部已完成任务数量
  pendingTaskCount: number; // 全部待处理任务数量
  systemTaskList: SystemTask[];
}

export interface UpdateSystemTaskStatusReq {
  taskId: string;
  taskStatus: SystemTaskStatus;
}

export interface NoviceTask {
  id: string;
  taskId: string;
  taskName: string;
  taskContent: string;
  taskStatus: NoviceTaskStatus;
  taskType: string;
  createTime: string;
  moduleName: string;
  moduleType: string;
  pendingTime: string;
  operateBtnText: string;
  videoTitle: string;
  videoCoverUrl: string | undefined;
  videoUrl: string | undefined;
}

export enum NoviceTaskStatus {
  INCOMPLETE = 1,
  COMPLETE = 2,
  CLOSE = 3,
}

export interface NoviceTasksRes {
  finishedCount: number;
  totalCount: number;
  taskList: NoviceTask[];
}

export enum SystemTaskConfigStatus {
  IN_USE = 'IN_USE',
  DELETED = 'DELETED',
}

export interface SystemTaskConfig {
  taskConfigStatus: SystemTaskConfigStatus;
  taskType: string;
  taskTypeId: string;
  taskTypeName: string;
}

export interface SystemTaskConfigListReq {
  page: number;
  pageSize: number;
}

export interface SystemTaskConfigListRes {
  systemTaskConfigList: SystemTaskConfig[];
  totalSize: number;
}

export interface UpdateSystemTaskConfigStatusReq {
  taskTypeId: string;
  taskConfigStatus: SystemTaskConfigStatus;
}

export interface NoviceTaskStep {
  content: string;
}

export interface NoviceTaskHandleItem {
  moduleType: string;
  taskType: string;
  taskId: string;
  taskName: string;
  steps: NoviceTaskStep[];
  step: number;
  handling: boolean;
}

export interface NoviceTaskTeamMemberStat {
  accountId: string;
  accountName: string;
  finishedCount: string;
  totalCount: string;
  taskInfo: {
    taskId: string;
    taskName: string;
    taskStatus: NoviceTaskStatus;
  }[];
}

export interface NoviceTaskTeamStatsRes {
  finishedCount: string;
  totalCount: string;
  teamTaskInfo: NoviceTaskTeamMemberStat[];
}

export interface NoviceTaskExternUrl {
  claimCouponUrl: string;
}

export interface TaskCenterApi extends Api {
  handleSystemTask(req: SystemTask): any;
  sendSystemTaskCloseEvent(task: SystemTask): void;
  getSystemTasks(req: SystemTasksReq): Promise<SystemTasksRes>;
  updateSystemTaskStatus(req: UpdateSystemTaskStatusReq): Promise<void>;
  getSystemTaskConfigList(req: SystemTaskConfigListReq): Promise<SystemTaskConfigListRes>;
  updateSystemTaskConfigStatus(req: UpdateSystemTaskConfigStatusReq): Promise<void>;
  registerNoviceTask(req: NoviceTask, steps: NoviceTaskStep[]): void;
  handleNoviceTask(req: NoviceTask): any;
  checkNoviceTaskRemind(): Promise<void>;
  setNoviceTaskNextRemindTime(time: number): void;
  getNoviceTaskNextRemindTime(): number;
  getNoviceTaskRemind(): Promise<boolean>;
  checkNoviceTaskRemind(): Promise<void>;
  closeNoviceTaskRemind(): Promise<void>;
  getNoviceTasks(): Promise<NoviceTasksRes>;
  finishNoviceTask(req: { taskId: string }): Promise<void>;
  getNoviceTaskTeamTasks(): Promise<{ taskId: string; taskName: string }[]>;
  getNoviceTaskTeamStats(): Promise<NoviceTaskTeamStatsRes>;
  getNoviceTaskExternUrl(): Promise<NoviceTaskExternUrl>;
}
