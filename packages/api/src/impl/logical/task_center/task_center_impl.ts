import {
  TaskCenterApi,
  SystemTask,
  SystemTasksReq,
  SystemTasksRes,
  SystemTaskStatus,
  SystemTaskConfigListReq,
  SystemTaskConfigListRes,
  UpdateSystemTaskConfigStatusReq,
  UpdateSystemTaskStatusReq,
  NoviceTask,
  NoviceTasksRes,
  NoviceTaskStep,
  NoviceTaskTeamStatsRes,
  NoviceTaskExternUrl,
} from '@/api/logical/task_center';
import { api } from '@/api/api';
import { apis, isEdm, inWindow } from '@/config';
import { ApiRequestConfig } from '@/api/data/http';
import { IntervalEventParams } from '@/index';
import { MailApi } from '@/api/logical/mail';

interface TaskCenterApiRequestConfig extends ApiRequestConfig {
  toastError?: boolean;
}

export class TaskCenterApiImpl implements TaskCenterApi {
  name = 'taskCenterApiImpl';

  private http = api.getDataTransApi();

  private eventApi = api.getEventApi();

  private storeApi = api.getDataStoreApi();

  private systemApi = api.getSystemApi();

  private mailApi: MailApi;

  private isElectron = this.systemApi.isElectron();

  NOVICE_TASK_NEXT_REMIND_TIME = 'NOVICE_TASK_NEXT_REMIND_TIME';

  NOVICE_TASK_NAME_MAP = 'NOVICE_TASK_NAME_MAP';

  constructor() {
    this.mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
  }

  init() {
    return this.name;
  }

  afterInit() {
    if (process.env.BUILD_ISEDM && inWindow() && !window.isAccountBg) {
      if (this.systemApi.getCurrentUser()) {
        this.checkNoviceTaskRemind();
      }
      this.systemApi.intervalEvent(this.noviceTaskRemindIntervalHandler);
    }
    return this.name;
  }

  private noviceTaskRemindIntervalHandler: IntervalEventParams = {
    eventPeriod: 'long', // 90s 后执行自动同步
    handler: ob => {
      if (ob.seq > 0 && this.systemApi.getCurrentUser()) {
        this.checkNoviceTaskRemind();
      }
    },
    id: 'noviceTaskRemindCheck',
    seq: 0,
  };

  errorHandler(error: Error | any) {
    this.eventApi.sendSysEvent({
      auto: true,
      eventSeq: 0,
      eventName: 'error',
      eventLevel: 'error',
      eventData: {
        title: error?.message || error?.data?.message || '网络错误',
        content: '',
        popupType: 'toast',
        popupLevel: 'error',
      },
    });
  }

  async get(url: string, req?: any, config?: TaskCenterApiRequestConfig) {
    try {
      const { data } = await this.http.get(url, req, config);

      if (!data) throw {};
      if (!data.success) throw data;

      return data.data;
    } catch (error) {
      const { toastError = true } = config || {};

      toastError && this.errorHandler(error);

      return Promise.reject(error);
    }
  }

  async post(url: string, body: any, config?: TaskCenterApiRequestConfig) {
    config = {
      contentType: 'json',
      noEnqueue: false,
      ...(config || {}),
    };

    try {
      const { data } = await this.http.post(url, body, config);

      if (!data) throw {};
      if (!data.success) throw data;

      return data.data;
    } catch (error) {
      const { toastError = true } = config || {};

      toastError && this.errorHandler(error);

      return Promise.reject(error);
    }
  }

  async delete(url: string, req?: any, config?: TaskCenterApiRequestConfig) {
    try {
      const { data } = await this.http.delete(url, req, config);

      if (!data) throw {};
      if (!data.success) throw data;

      return data.data;
    } catch (error) {
      const { toastError = true } = config || {};

      toastError && this.errorHandler(error);

      return Promise.reject(error);
    }
  }

  handleSystemTask(req: SystemTask): any {
    const { moduleType, taskType, bizId, bizContent } = req;
    let bizData: Record<string, any> = {};

    console.log('xxxx-bizId', bizId);
    console.log('xxxx-bizContent', bizContent);

    try {
      bizData = JSON.parse(decodeURIComponent(bizContent));
    } catch (error) {}

    if (moduleType === 'CONTACT_EMAIL') {
      if (taskType === 'UN_REPLY_CUSTOMER_EMAIL') {
        if (bizData.mid) {
          this.mailApi.doReplayMail(bizData.mid);
        }
      }
    } else if (moduleType === 'SITE_MANAGEMENT') {
      if (taskType === 'SITE_GUIDE_PUBLISH_REMINDER') {
        if (this.isElectron) {
          this.eventApi.sendSysEvent({
            eventName: 'routeChange',
            eventStrData: 'gatsbyStateNav',
            eventData: {
              url: '#site?page=mySite',
            },
          });
        } else {
          window.open('#site?page=mySite', '_blank');
        }
      }
    } else if (moduleType === 'EDM') {
      // 营销-EDM模块系统任务处理
      if (taskType === 'MARKETING_WEEKLY_TASK') {
        if (this.isElectron) {
          this.eventApi.sendSysEvent({
            eventName: 'routeChange',
            eventStrData: 'gatsbyStateNav',
            eventData: {
              url: '#edm?page=write',
            },
          });
        } else {
          window.open('#edm?page=write', '_blank');
        }
      }
    } else if (moduleType === 'GLOBAL_SEARCH') {
      // 预留 外贸数据-全球搜模块系统任务处理
    } else {
      this.errorHandler(new Error('不支持的任务类型，请升级客户端'));
    }
  }

  sendSystemTaskCloseEvent(task: SystemTask) {
    this.eventApi.sendSysEvent({
      eventName: 'SystemTaskStatusUpdate',
      eventStrData: 'SystemTaskStatusUpdate',
      eventData: {
        moduleType: task.moduleType,
        taskId: task.taskId,
        taskStatus: SystemTaskStatus.CLOSE,
      },
    });
  }

  getSystemTasks(req: SystemTasksReq): Promise<SystemTasksRes> {
    return this.get(this.systemApi.getUrl('getSystemTasks'), req);
  }

  updateSystemTaskStatus(req: UpdateSystemTaskStatusReq): Promise<void> {
    return this.post(this.systemApi.getUrl('updateSystemTaskStatus'), req);
  }

  getSystemTaskConfigList(req: SystemTaskConfigListReq): Promise<SystemTaskConfigListRes> {
    return this.get(this.systemApi.getUrl('getSystemTaskConfigList'), req);
  }

  updateSystemTaskConfigStatus(req: UpdateSystemTaskConfigStatusReq): Promise<void> {
    return this.post(this.systemApi.getUrl('updateSystemTaskConfigStatus'), req);
  }

  registerNoviceTask(req: NoviceTask, steps: NoviceTaskStep[]) {
    const { moduleType, taskType, taskId, taskName } = req;

    this.eventApi.sendSysEvent({
      eventName: 'NoviceTaskRegister',
      eventStrData: '',
      eventData: {
        moduleType,
        taskType,
        taskId,
        taskName,
        steps,
        step: 0,
        handling: true,
      },
    });
  }

  handleNoviceTask(req: NoviceTask): any {
    const { moduleType, taskType } = req;

    if (moduleType === 'GLOBAL_SEARCH') {
      if (taskType === 'FIND_CUSTOMER') {
        this.registerNoviceTask(req, [{ content: '输入你的公司经营的产品并点击搜索' }, { content: '点击查看公司官网、联系人、主营产品等详细信息' }]);
        this.eventApi.sendSysEvent({
          eventName: 'routeChange',
          eventStrData: 'gatsbyStateNav',
          eventData: { url: '#wmData?page=globalSearch&from=noviceTask' },
        });
      }
    } else if (moduleType === 'EDM') {
      if (taskType === 'SEND_EDM_EMAIL') {
        this.registerNoviceTask(req, [{ content: '完成任务设置' }, { content: '完成邮件内容编辑' }, { content: '完成发送设置' }]);
        this.eventApi.sendSysEvent({
          eventName: 'routeChange',
          eventStrData: 'gatsbyStateNav',
          eventData: { url: '#edm?page=write&from=noviceTask' },
        });
      } else if (taskType === 'SEND_EDM_AI_HOSTING') {
        this.registerNoviceTask(req, [{ content: '选择“一个营销托管任务”' }, { content: '编辑基础信息并提交' }, { content: '确认开发信并创建任务' }]);
        this.eventApi.sendSysEvent({
          eventName: 'routeChange',
          eventStrData: 'gatsbyStateNav',
          eventData: { url: '#edm?page=aiHosting&pageTo=new&from=noviceTask' },
        });
      }
    } else if (moduleType === 'CONTACT') {
      if (taskType === 'CREATE_NEW_CUSTOMER') {
        this.registerNoviceTask(req, [{ content: '点击“新建客户”按钮' }, { content: '编辑对应的字段内容并点击提交' }]);
        // 测试跳转代码
        location.hash = '/unitable-crm/custom/list?id=';
      }
    } else {
      this.errorHandler(new Error('不支持的任务类型，请升级客户端'));
    }
  }

  setNoviceTaskNextRemindTime(time: number): void {
    this.storeApi.put(this.NOVICE_TASK_NEXT_REMIND_TIME, `${time}`);
  }

  getNoviceTaskNextRemindTime(): number {
    const storeTime = this.storeApi.getSync(this.NOVICE_TASK_NEXT_REMIND_TIME).data;

    return storeTime ? +storeTime : 0;
  }

  getNoviceTaskRemind(): Promise<boolean> {
    return this.get(this.systemApi.getUrl('getNoviceTaskRemind'));
  }

  checkNoviceTaskRemind(): Promise<void> {
    return this.getNoviceTaskRemind().then(shouldRemind => {
      const nextRemindTime = this.getNoviceTaskNextRemindTime();

      shouldRemind = shouldRemind && Date.now() > nextRemindTime;

      if (shouldRemind) {
        this.eventApi.sendSysEvent({
          eventName: 'NoviceTaskRemind',
          eventStrData: '',
          eventData: '',
        });
      }
    });
  }

  closeNoviceTaskRemind(): Promise<void> {
    return this.delete(this.systemApi.getUrl('closeNoviceTaskRemind'));
  }

  getNoviceTasks(): Promise<NoviceTasksRes> {
    return this.get(this.systemApi.getUrl('getNoviceTasks'));
  }

  finishNoviceTask(req: { taskId: string }): Promise<void> {
    return this.post(this.systemApi.getUrl('finishNoviceTask'), req);
  }

  getNoviceTaskTeamTasks(): Promise<{ taskId: string; taskName: string }[]> {
    return this.get(this.systemApi.getUrl('getNoviceTaskTeamTasks'));
  }

  getNoviceTaskTeamStats(): Promise<NoviceTaskTeamStatsRes> {
    return this.get(this.systemApi.getUrl('getNoviceTaskTeamStats'));
  }

  getNoviceTaskExternUrl(): Promise<NoviceTaskExternUrl> {
    return this.get(this.systemApi.getUrl('getNoviceTaskExternUrl'));
  }
}

const taskCenterApiImpl = new TaskCenterApiImpl();

api.registerLogicalApi(taskCenterApiImpl);

export default taskCenterApiImpl;
