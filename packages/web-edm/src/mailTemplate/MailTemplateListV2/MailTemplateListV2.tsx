/**
 * 列表页面，不包含头部的内容
 */
import React, { FC, useEffect, useState, useImperativeHandle } from 'react';
import {
  apiHolder,
  apis,
  MailTemplateApi,
  getIn18Text,
  TemplateConditionRes,
  GetTemplateListReq,
  DataStoreApi,
  DataTrackerApi,
  UpdateTimeProps,
  EdmSendBoxApi,
  GetTaskBriefRes,
  GetTemplateTopRes,
  SystemApi,
} from 'api';
import { navigate } from '@reach/router';
import classnames from 'classnames';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { message, Modal, Skeleton, Drawer } from 'antd';
import { ReactComponent as ArrowIcon } from '@/images/icons/edm/yingxiao/arrow-right.svg';
import { getSendCount } from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import { PermissionCheckPage, PrivilegeCheck, usePermissionCheck } from '@/components/UI/PrivilegeEnhance';

import styles from './MailTemplateListV2.module.scss';
import { TaskCard } from './TaskCard';
import { RecommendCard } from './RecommendCard';
import { PersonalCard } from './PersonalCard';
import { setTemplateContent } from '../template-util';
import { getTaskContent } from './template-util';
import Preview from '../template/preview';
import { TemplateAddModal } from '../template';
import { edmDataTracker } from '../../tracker/tracker';

const systemApi = apiHolder.api.getSystemApi();
const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const templateApi = apiHolder.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;

export type ActionType = 'use' | 'display' | 'edit' | 'delete' | 'saveTemplate' | 'search' | 'deleteHistory' | 'deleteItem' | 'deleteHistoryItem' | 'useAsRecommend';
export type Action = (type: ActionType, templateId: string) => void;

export enum TemplateType {
  /**
   * 最近使用
   */
  'recently' = 1,
  /**
   * 个人
   */
  'individual' = 2,
  /**
   * 推荐
   */
  'recommendation' = 3,
  /**
   * 企业
   */
  'enterprise' = 4,
  /**
   * 任务
   */
  task,
}
export type ListType = keyof typeof TemplateType;
export const TypeLabel: Record<ListType, string> = {
  task: '最近任务',
  recommendation: '推荐模板',
  recently: '最近使用模板',
  individual: '个人模板',
  enterprise: '企业模板',
};

export interface MailTemplateListV2Interface {
  refresh: (loading: boolean) => void;
}
interface Props {
  showMore: (listTitle: string, listType: ListType, listId: number) => void;
  addNewTemplate?: (content?: string) => Promise<void>;
  /**
   * 查看模板
   */
  displayTemplate?: (id: string) => void;
  /**
   * 是否从写信页进入
   */
  isFormWrite?: boolean;
  onUse?: (templateId?: string, content?: string, listType?: ListType) => void;
}

export const MailTemplateListV2 = React.forwardRef<MailTemplateListV2Interface, Props>((props, ref) => {
  const { showMore, displayTemplate, isFormWrite, onUse } = props;
  const [taskList, setTaskList] = useState<GetTaskBriefRes>();
  const [recommendList, setRecommendList] = useState<GetTemplateTopRes[number]['templateList']>();
  const [recentlyList, setRecentlyList] = useState<GetTemplateTopRes[number]['templateList']>();
  const [individualList, setIndividualList] = useState<GetTemplateTopRes[number]['templateList']>();
  const [enterpriseList, setEnterpriseList] = useState<GetTemplateTopRes[number]['templateList']>();
  const [loading, setLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [previewId, setPreviewId] = useState('');
  const [editContent, setEditContent] = useState('');
  const [allTemplateId, setAllTemplateId] = useState<Array<string>>([]);

  const hasEdmPermission = usePermissionCheck('VIEW', 'EDM', 'EDM_SENDBOX');

  const addNewTemplate = (content: string, id: string = '') => {
    setPreviewId(id);
    setEditContent(content);
  };

  const goWritePage = () => {
    getSendCount({
      emailList: [],
      from: 'template',
      back: encodeURIComponent(`${routerWord}?page=mailTemplate&version=v2`),
    });
  };
  const minLength = isFormWrite ? 2 : 4;

  const queryTaskList = async () => {
    setTaskLoading(true);
    try {
      const taskList = await edmApi.getTaskBrief({
        size: isFormWrite ? 3 : 5,
      });
      setTaskList(taskList);
    } catch (err) {}
    setTaskLoading(false);
  };

  const getList = (templateList: GetTemplateTopRes, type: ListType, setList: (list?: GetTemplateTopRes[number]['templateList']) => void): Array<string> => {
    const list = templateList.find(list => list.tabId === TemplateType[type]);
    if (list) {
      setList(list.templateList);
      return list.templateList.map(info => info.templateId);
    }
    return [];
  };

  useImperativeHandle(ref, () => ({
    refresh(loading) {
      queryTemplateList(loading);
    },
  }));

  // 需要previewId、showDrawer
  const renderTemplateView = () => (
    <Drawer
      bodyStyle={{ padding: '0px' }}
      width={872}
      title={null}
      closable={false}
      onClose={() => {
        setShowDrawer(false);
      }}
      visible={showDrawer}
      destroyOnClose
    >
      <Preview
        templateId={previewId}
        allTemplateId={allTemplateId}
        closeModal={() => {
          setShowDrawer(false);
        }}
        emitResult={() => {}}
        onUse={(content, templateId) => {
          setShowDrawer(false);
          if (isFormWrite) {
            onUse && onUse('', content, 'task');
          } else {
            setTemplateContent(content, templateId);
            navigate(`${routerWord}?page=write&from=template`);
          }
        }}
      />
    </Drawer>
  );

  const queryTemplateList = async (showLoading?: boolean) => {
    showLoading && setLoading(true);
    try {
      const templateList = await templateApi.getTemplateTop({
        size: isFormWrite ? 3 : 5,
        templateCategory: 'LX-WAIMAO',
      });
      // 以下逻辑为了实现上一个下一个
      getList(templateList, 'recommendation', setRecommendList);
      getList(templateList, 'individual', setIndividualList);
      getList(templateList, 'enterprise', setEnterpriseList);
      getList(templateList, 'recently', setRecentlyList);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    // 需要判断是否有权限，无邮件营销权限不能请求
    if (hasEdmPermission) {
      queryTaskList();
    }
  }, [hasEdmPermission]);
  useEffect(() => {
    // 获取模板列表
    queryTemplateList();
  }, []);

  const saveTaskAsTemplate = async (templateId: string, callback: (content: string) => any) => {
    try {
      const res = await templateApi.doGetMailTemplateDetail({ templateId });
      if (res.success && res.data) {
        callback(res.data.content);
      }
    } catch (err) {
      message.error('获取任务详情失败，请稍后重试！');
    }
  };

  const actionTrace = (type: ActionType | 'more', source: ListType) => {
    if (!isFormWrite) {
      if (type === 'use') {
        edmDataTracker.templatePageOp('use', source);
      } else if (type === 'saveTemplate') {
        edmDataTracker.templatePageOp('save', source);
      } else if (type === 'display') {
        edmDataTracker.templatePageOp('viewTemplate', source);
      } else if (type === 'more') {
        edmDataTracker.templatePageOp('more', source);
      }
    } else {
      let type = '';
      switch (source) {
        case 'recommendation':
          type = 'useRecomend';
          break;
        case 'recently':
          type = 'useRecently';
          break;
        case 'individual':
          type = 'usePersonal';
          break;
        case 'enterprise':
          type = 'useCompany';
          break;
        case 'task':
          type = 'useTask';
          break;
        default:
          type = '';
      }

      edmDataTracker.track('pc_markting_edm_taskCreate_contentSet', {
        type: type,
      });
    }
  };

  const getCard = (pageType: ListType, list?: GetTemplateTopRes[number]['templateList']) => {
    if (pageType === 'task') {
      return taskList?.tasks.map(task => <TaskCard isFormWrite={isFormWrite} onUse={onUse} addNewTemplate={addNewTemplate} key={task.edmEmailId} task={task} />);
    } else {
      const originList = list;
      // 其他模板场景
      return list?.map(list => (
        <PersonalCard
          isFormWrite={isFormWrite}
          // 这里是所有卡片的操作
          // 如果需要使用html内容，需要使用方法：saveTaskAsTemplate
          cardOp={(type, templateId) => {
            // 操作埋点
            actionTrace(type, pageType);
            if (type === 'use') {
              // 使用模板
              templateApi.doSaveMailTemplateUseTime({ templateId, time: new Date().getTime() });
              // 获取模板详情，唤起写信
              templateApi.doGetMailTemplateDetail({ templateId }).then(async res => {
                if (res.success && res.data) {
                  // if (emitResult) {
                  //   const viewMail = await formatViewMail(res.data);
                  //   viewMail.form = 'template';
                  //   emitResult(viewMail);
                  // } else {

                  // }
                  setTemplateContent(res.data.content, templateId);

                  if (isFormWrite) {
                    onUse && onUse(templateId, res.data.content, pageType);
                  } else {
                    navigate(`${routerWord}?page=write&from=template`);
                  }
                }
              });
            } else if (type === 'display') {
              // 查看
              setShowDrawer(true);
              setPreviewId(templateId);
              setAllTemplateId(originList!.map(listItem => listItem.templateId));
              edmDataTracker.track('pc_markting_edm_taskCreate_contentSet', {
                type: 'viewTemplate',
              });
            } else if (type === 'edit') {
              saveTaskAsTemplate(templateId, content => {
                // 这是邮件模板的跳转
                addNewTemplate && addNewTemplate(content, templateId);
              });
            } else if (type === 'saveTemplate') {
              edmDataTracker.track('pc_markting_edm_taskCreate_contentSet', {
                type: 'save',
              });
              saveTaskAsTemplate(templateId, content => {
                // 这是邮件模板的跳转
                addNewTemplate && addNewTemplate(content);
              });
            } else if (type === 'delete') {
              Modal.confirm({
                title: getIn18Text('QUEDINGYAOSHANCHUGAIMOBANMA\uFF1F'),
                okText: getIn18Text('QUEDING'),
                cancelText: getIn18Text('QUXIAO'),
                centered: true,
                onOk: () => {
                  templateApi
                    .doDeleteMailTemplate({
                      templateId,
                    })
                    .then(res => {
                      if (res.data === 'success') {
                        message.success(getIn18Text('SHANCHUCHENGGONG'));
                        queryTemplateList();
                      } else {
                        message.error(getIn18Text('SHANCHUSHIBAI\uFF0CQINGZHONGSHI'));
                      }
                    });
                },
              });
            }
          }}
          templateInfo={list}
        />
      ));
    }
  };

  const renderSubList = (title: string, key: ListType, list?: GetTemplateTopRes[number]['templateList'] | GetTaskBriefRes['tasks'], moreTitle = '更多') => (
    <div className={styles.subList} key={key}>
      <div className={styles.subListHeader}>
        <div className={styles.leftHeader}>{title}</div>
        <div
          className={styles.rightHeader}
          onClick={() => {
            actionTrace('more', key);
            showMore(title, key, TemplateType[key]);
          }}
        >
          {(list?.length || 0) > minLength && (
            <>
              {moreTitle}
              <ArrowIcon className={styles.headerIcon} />
            </>
          )}
        </div>
      </div>
      <div className={styles.subListContent}>{getCard(key, list)}</div>
    </div>
  );

  if (taskLoading || loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.list} key="task">
          <div
            style={{
              padding: 16,
            }}
          >
            <Skeleton active />
          </div>
        </div>
      </div>
    );
  }

  const renderAddModal = () => {
    if (isFormWrite) {
      return (
        <SiriusModal className={styles.myModal2} visible={editContent !== ''} onCancel={() => setEditContent('')} title="" width={900} footer={null}>
          <TemplateAddModal
            content={editContent}
            templateId={previewId}
            goMailTemplate={refresh => {
              if (refresh) {
                queryTemplateList();
              }
              setEditContent('');
              setPreviewId('');
            }}
          />
        </SiriusModal>
      );
    }
    return (
      <div className={styles.editWrap}>
        <TemplateAddModal
          content={editContent}
          templateId={previewId}
          goMailTemplate={refresh => {
            if (refresh) {
              queryTemplateList();
            }
            setEditContent('');
            setPreviewId('');
          }}
        />
      </div>
    );
  };

  return (
    <>
      {editContent && renderAddModal()}
      <div className={classnames(styles.wrap, isFormWrite ? styles.wrapWrite : '')}>
        <div className={styles.list} key="task">
          {taskList != null && taskList.tasks.length > 0 && renderSubList(TypeLabel.task, 'task', taskList.tasks)}
          {recommendList != null && recommendList.length > 0 && renderSubList(TypeLabel.recommendation, 'recommendation', recommendList, '更多')}
          {recentlyList != null && recentlyList.length > 0 && renderSubList(TypeLabel.recently, 'recently', recentlyList, '更多')}
          {individualList != null && individualList.length > 0 && renderSubList(TypeLabel.individual, 'individual', individualList, '更多')}
          {enterpriseList != null && enterpriseList.length > 0 && renderSubList(TypeLabel.enterprise, 'enterprise', enterpriseList, '更多')}
        </div>
        {renderTemplateView()}
      </div>
    </>
  );
});
