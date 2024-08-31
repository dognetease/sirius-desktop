import React, { FC, useEffect, useState, useRef, useCallback } from 'react';
import {
  apiHolder,
  apis,
  MailTemplateApi,
  TemplateConditionRes,
  GetTemplateListReq,
  DataStoreApi,
  DataTrackerApi,
  UpdateTimeProps,
  EdmSendBoxApi,
  GetTaskBriefRes,
} from 'api';
import classnames from 'classnames';
import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import throttle from 'lodash/throttle';
import moment from 'moment';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { message, Skeleton } from 'antd';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import { TemplateAddModal } from '../template';

import { CreateTemplateBtn } from '../CreateTemplateBtn';
import layoutStyles from '../mailTemplateV2.module.scss';
import styles from './TaskList.module.scss';
import { TaskCard } from '../MailTemplateListV2/TaskCard';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

const pagesize = 50;
const queryHeight = 50;

export const TaskList: FC<{
  goBack?: () => void;
  addNewTemplate?: (content?: string) => Promise<void>;
  goTemplateAdd?: () => void;
  goRecommendPage?: () => void;
  /**
   * 是否从写信页进入
   */
  isFormWrite?: boolean;
  onUse?: (templateId?: string, content?: string) => void;
  goTaskList?: () => void;
  isFromModal?: boolean;
}> = props => {
  const { goBack, goTemplateAdd, goRecommendPage, isFormWrite, onUse, addNewTemplate: addNewTemplateOrigin, goTaskList, isFromModal } = props;
  // 只有数组才能保证顺序
  const [taskList, setTaskList] = useState<
    Array<{
      time: string;
      list: GetTaskBriefRes['tasks'];
    }>
  >([]);
  // const [lastTime, setLastTime] = useState<string>();
  const lastTime = useRef<string>();
  const lastId = useRef<string>();
  const [lastLength, setLastLength] = useState(pagesize);
  const loading = useRef(false);
  const scrollDiv = useRef<HTMLDivElement | null>(null);
  const [editContent, setEditContent] = useState('');

  const addNewTemplate = (content: string, id: string = '') => {
    setEditContent(content);
  };

  const queryList = async () => {
    if (lastLength < pagesize) {
      return;
    }
    try {
      const newTaskList = await edmApi.getTaskBrief({
        size: pagesize,
        ...(lastId.current
          ? {
              cursor: lastId.current,
            }
          : {}),
      });
      setLastLength(newTaskList.tasks.length);
      // setTaskList(taskList.tasks);
      // 以下逻辑是按照数组最后一个时间来对比的，要求服务端数据必须是倒排的！
      const curTaskLit = [...taskList];
      let curLastTime = lastTime.current;
      const newTasks = newTaskList.tasks;
      newTasks.forEach(item => {
        const curTime = moment(item.createTime).format('YYYY-MM');
        const lastMonth = curLastTime ? moment(curLastTime).format('YYYY-MM') : '';
        if (curTime === lastMonth) {
          curTaskLit[curTaskLit.length - 1]?.list.push(item);
        } else {
          const curList = {
            time: curTime,
            list: [item],
          };
          curTaskLit.push(curList);
        }
        curLastTime = item.createTime;
        lastId.current = item.id;
      });
      setTaskList(curTaskLit);
      // 记录最后一次时间
      lastTime.current = curLastTime;
    } catch (err) {
      message.error('获取任务列表失败！');
    }
  };

  const queryMore = useCallback(
    throttle(() => {
      if (scrollDiv.current && !loading.current) {
        if (scrollDiv.current.scrollTop + scrollDiv.current.offsetHeight + queryHeight >= scrollDiv.current.scrollHeight) {
          loading.current = true;
          queryList().finally(() => {
            loading.current = false;
          });
        }
      }
    }, 200),
    [scrollDiv.current]
  );

  useEffect(() => {
    queryList();
  }, []);

  const renderList = () => (
    <>
      {taskList.map(curTask => (
        <div className={styles.listItem} key={curTask.time}>
          <div className={styles.listItemHeader}>{curTask.time}</div>
          <div className={styles.listItemContent}>
            {curTask.list.map(task => (
              <div className={styles.cardWrap} key={task.edmEmailId}>
                <TaskCard
                  isFromModal={isFromModal}
                  isFormWrite={isFormWrite}
                  task={task}
                  onUse={onUse}
                  addNewTemplate={content => {
                    if (isFromModal) {
                      addNewTemplateOrigin && addNewTemplateOrigin(content);
                    } else {
                      addNewTemplate(content || '');
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );

  const renderAddModal = () => {
    if (isFormWrite) {
      return (
        <SiriusModal getContainer={() => document.querySelector('#edm-write-root')!} mask={false} className={layoutStyles.myModal3} visible={editContent !== ''} onCancel={() => setEditContent('')} title="" width={900} footer={null}>
          <TemplateAddModal
            content={editContent}
            templateId={''}
            goMailTemplate={refresh => {
              if (refresh) {
                // queryList();
              }
              setEditContent('');
              // setPreviewId('');
            }}
          />
        </SiriusModal>
      );
    }
    return (
      <div className={layoutStyles.templateWrapper}>
        <div className={layoutStyles.templateWrapperContent}>
          <div
            className={layoutStyles.editWrap}
            style={{
              marginTop: 0,
            }}
          >
            <TemplateAddModal
              content={editContent}
              templateId={''}
              goMailTemplate={refresh => {
                if (refresh) {
                  // queryList();
                }
                setEditContent('');
                // setPreviewId('');
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    // 以下除了list部分都可以复制
    <>
      {editContent ? (
        renderAddModal()
      ) : (
        <div className={layoutStyles.templateWrapper}>
          <div className={layoutStyles.templateWrapperContent}>
            {!isFormWrite && (
              <div className={layoutStyles.templateHeader}>
                <div className={layoutStyles.topOp}>
                  <div className={layoutStyles.breadcrumbWrap}>
                    <Breadcrumb separator={<SeparatorSvg />}>
                      <Breadcrumb.Item className={layoutStyles.breadcrumb} onClick={goBack}>
                        内容库
                      </Breadcrumb.Item>
                      <Breadcrumb.Item>最近任务</Breadcrumb.Item>
                    </Breadcrumb>
                  </div>
                  <div className={layoutStyles.rightFilter}>
                    <CreateTemplateBtn
                      goTaskList={() => {
                        goTaskList && goTaskList();
                      }}
                      goTemplateAdd={() => {
                        goTemplateAdd && goTemplateAdd();
                      }}
                      goRecommendPage={() => {
                        goRecommendPage && goRecommendPage();
                      }}
                      addNewTemplate={content => {
                        addNewTemplateOrigin && addNewTemplateOrigin(content);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className={classnames(layoutStyles.subWrap, isFormWrite ? layoutStyles.subWrap2 : '')} ref={scrollDiv} onScroll={queryMore}>
              {taskList == null || taskList.length === 0 ? (
                <div
                  style={{
                    padding: 16,
                  }}
                >
                  <Skeleton active />
                </div>
              ) : (
                <div className={layoutStyles.subWrapInner}>{renderList()}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
