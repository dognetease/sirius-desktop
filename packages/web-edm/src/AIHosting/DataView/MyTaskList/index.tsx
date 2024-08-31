import React, { FC, useState, useEffect, useCallback, useRef } from 'react';
import { Form, message, Skeleton, Tooltip, InputNumber, Spin, TimePicker } from 'antd';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import update from 'immutability-helper';
import moment, { Moment } from 'moment';
import { apiHolder, apis, EdmSendBoxApi, GetPlanListRes, PositionObj, TaskPlanSwitchReq } from 'api';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import IconCard from '@web-common/components/UI/IconCard/index';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import SiriusSelect from '@web-common/components/UI/SiriusSelect';
import SiriusTimePicker from '@web-common/components/UI/TimePicker';
// import SiriusTimePicker from '@lingxi-common-component/sirius-ui/TimePicker';
import { ReactComponent as ProductionIcon } from '@/images/icons/edm/yingxiao/production.svg';
import { ReactComponent as GeoIcon } from '@/images/icons/edm/yingxiao/geo.svg';
import { ReactComponent as OpenIcon } from '@/images/icons/edm/yingxiao/open-icon.svg';
import { ReactComponent as InfoIcon } from '@/images/icons/edm/yingxiao/alert-info.svg';
import { ReactComponent as RightArrowLinkIcon } from '@/images/icons/edm/yingxiao/right-arrow-link.svg';
import { Action } from '../Header';
import { SwitchButton } from '../../../components/SwitchButton';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

import styles from './MyTaskList.module.scss';

const DayConf = {
  '1': [1, 2, 3, 4, 5],
  '2': [1, 2, 3, 4, 5, 6, 7],
};

export const MyTaskList: FC<{
  taskId: string;
  op: (action: Action) => void;
  /**
   * 刷新header部分数据
   */
  refreshHeader: () => void;
  actionTrace: (action: string) => void;
  openReplayPage: (planId: string) => void;
}> = ({ taskId, op, refreshHeader, actionTrace, openReplayPage }) => {
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [taskInfo, setTaskInfo] = useState<GetPlanListRes>();
  const [taskList, setTaskList] = useState<GetPlanListRes['planList']>([]);
  const [form] = Form.useForm();
  const [curLimit, setCurLimit] = useState<Array<number>>();
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(moment().set('hour', 10).set('minute', 0));
  const [endTime, setEndTime] = useState(moment().set('hour', 22).set('minute', 0));
  const [showErrorTip, setShowErrorTip] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [dayRange, setDayRange] = useState<'1' | '2'>('1');

  const [positionList, setPositionList] = useState<PositionObj[]>([]);

  const queryData = useCallback(async () => {
    try {
      const res = await edmApi.getPlanList({ taskId });
      setTaskInfo(res);
    } catch (err: any) {
      message.error(err?.msg || err?.message || '未知原因');
    }
  }, [taskId]);

  const switchQuery = useCallback(
    async (req: TaskPlanSwitchReq) => {
      setLoading(true);
      try {
        await edmApi.taskPlanSwitch(req);
        // message.success('修改每日营销上限成功');
        // 不刷新列表，成功之后只有前端修改
        // await queryData();
        const list = taskInfo!.planList || [];
        const curItem = list.find(item => item.planId === req.planId)!;
        curItem.status = req.planStatus;
        setTaskInfo({
          ...taskInfo!,
          planList: list,
        });

        // 刷新一下运行中的任务数
        refreshHeader();
      } catch (err: any) {
        message.error(err?.msg || err?.message || '未知原因');
      }
      setTimeout(() => {
        setLoading(false);
      }, 300);
    },
    [setLoading, refreshHeader, setTaskInfo, taskInfo]
  );

  // 修改弹窗配置
  const modifyLimit = async (autoSendLimit: number, manualSendLimit: number) => {
    try {
      await edmApi.setTaskSendLimit({
        taskId,
        manualSendLimit,
        autoSendLimit,
        positionInfos: positionList,
        sendingDate: DayConf[dayRange],
        timeDuration: {
          from: startTime.get('hour'),
          to: endTime.get('hour'),
        },
      });
      message.success('设置成功！');
      queryData();
    } catch (err: any) {
      message.error(err?.msg || err?.message || '未知原因');
    }
  };

  useEffect(() => {
    queryData();
  }, [taskId]);

  useEffect(() => {
    if (taskInfo == null) {
      return;
    }
    if (!open) {
      setTaskList(taskInfo.planList.slice(0, 2));
    } else {
      setTaskList(taskInfo.planList);
    }
  }, [open, taskInfo]);

  useEffect(() => {
    setPositionList(taskInfo?.positionInfos || []);
  }, [taskInfo]);

  // 设置弹窗打开之后的默认值
  useEffect(() => {
    if (show && curLimit) {
      form.setFieldsValue({
        autoSendLimit: curLimit[0],
        manualSendLimit: curLimit[1],
      });
      setPositionList(taskInfo?.positionInfos || []);
      if (taskInfo?.sendingDate != null && taskInfo?.timeDuration != null) {
        setDayRange(taskInfo.sendingDate.length > 5 ? '2' : '1');
        setStartTime(
          moment()
            .set('hour', taskInfo.timeDuration.from ?? 10)
            .set('minute', 0)
        );
        setEndTime(
          moment()
            .set('hour', taskInfo.timeDuration.to ?? 22)
            .set('minute', 0)
        );
      }
    }
  }, [show, curLimit]);

  // 营销发信规则设置时间
  useEffect(() => {
    const endHour = endTime.get('hour');
    const startHour = startTime.get('hour');
    if ((endHour - startHour < 4 && endHour - startHour > 0) || (endHour - startHour < 0 && endHour - startHour + 24 < 4)) {
      setShowErrorTip(true);
      contentRef.current?.scrollTo({
        top: 200,
      });
    } else {
      setShowErrorTip(false);
    }
  }, [startTime, endTime]);

  if (taskInfo == null) {
    return (
      <div className={`${styles.wrap} ${styles.wrap2}`}>
        <Skeleton active />
        {/* <Skeleton active /> */}
      </div>
    );
  }

  const getItemConf = (
    type: 0 | 1
  ): {
    label: string;
    key: keyof GetPlanListRes['planList'][0];
  }[] => {
    const itemConf: {
      label: string;
      key: keyof GetPlanListRes['planList'][0];
    }[] = [
      {
        label: '已营销联系人数',
        key: 'receiverCount',
      },
      {
        label: '送达封数',
        key: 'arriveNum',
      },
      {
        label: '打开封数',
        key: 'readNum',
      },
      {
        label: '回复人数',
        key: 'replyCount',
      },
    ];

    return [
      {
        label: type === 1 ? '自动挖掘联系人' : '已添加联系人数',
        key: 'contactCount',
      },
      ...itemConf,
    ];
  };

  const renderList = () => (
    <Spin indicator={antIcon} spinning={loading} tip=" ">
      {taskList.map((task, index) => (
        <div className={styles.item}>
          <div className={styles.itemHeader}>
            <div className={styles.itemHeaderInfo}>
              <SwitchButton
                checked={task.status === 1}
                onChange={value => {
                  actionTrace(task.status === 1 ? 'start' : 'stop');
                  switchQuery({
                    taskId,
                    planId: task.planId,
                    loopStatus: task.loopStatus,
                    planStatus: value ? 1 : 0,
                  });
                }}
              />
              <div className={styles.itemHeaderTitle}>{task.name}</div>
              {task.planMode === 1 ? <Tag type="label-1-1">自动获客任务</Tag> : ''}
            </div>
            <div className={styles.itemHeaderBtn}>
              <Button
                style={{
                  marginLeft: 8,
                }}
                btnType="minorLine"
                onClick={() => {
                  op({
                    type: 'detail',
                    taskId,
                    planId: task.planId,
                    operateType: -1,
                    planMode: task.planMode,
                  });
                  actionTrace('taskDetali');
                }}
              >
                详情
              </Button>
              <Button
                style={{
                  marginLeft: 8,
                  whiteSpace: 'nowrap',
                }}
                btnType="minorLine"
                onClick={() => {
                  op({
                    type: 'baseInfo',
                    taskId,
                    planId: task.planId,
                    operateType: -1,
                    planMode: task.planMode,
                  });
                  actionTrace('taskEdit');
                }}
              >
                修改基础信息
              </Button>
              <Button
                style={{
                  marginLeft: 8,
                  whiteSpace: 'nowrap',
                }}
                btnType="minorLine"
                onClick={() => {
                  op({
                    type: 'submitConfirm',
                    taskId,
                    planId: task.planId,
                    operateType: 3,
                    planMode: task.planMode,
                  });
                  actionTrace('mailEdit');
                }}
              >
                编辑营销信
              </Button>
            </div>
          </div>
          <div className={styles.itemInfo}>
            {task.products && (
              <div className={styles.itemInfoItem}>
                <ProductionIcon />
                <div className={styles.itemInfoItemIntro}>
                  主营产品：
                  <div className={styles.itemInfoItemIntroInfo}>{task.products}</div>
                </div>
              </div>
            )}
            {task.customerLocation && (
              <div className={styles.itemInfoItem}>
                <GeoIcon />
                <div className={styles.itemInfoItemIntro}>
                  国家/地区：
                  <div className={styles.itemInfoItemIntroInfo}>{task.customerLocation}</div>
                </div>
              </div>
            )}
          </div>
          <div className={styles.itemData}>
            {getItemConf(task.planMode).map(conf => {
              const showReplyCountBtn = conf.key === 'replyCount' && !!task[conf.key];
              return (
                <div className={styles.itemDataItem} key={conf.key}>
                  {/* <div className={styles.itemDataItemTitle}>{conf.label}</div> */}
                  <div className={styles.itemDataItemTitle}>
                    {showReplyCountBtn ? (
                      <>
                        <span
                          className={styles.link}
                          onClick={() => {
                            openReplayPage(task.planId);
                          }}
                        >
                          {conf.label}
                        </span>
                        <RightArrowLinkIcon className={styles.icon} />
                      </>
                    ) : (
                      <span>{conf.label}</span>
                    )}
                  </div>

                  <div className={styles.itemDataItemData}>{task[conf.key]}</div>
                </div>
              );
            })}
            {/* <div className={styles.itemDataItem}>
              <div className={styles.itemDataItemTitle}>自动挖掘联系人</div>
              <div className={styles.itemDataItemData}>943</div>
            </div>
            <div className={styles.itemDataItem}>
              <div className={styles.itemDataItemTitle}>自动挖掘联系人</div>
              <div className={styles.itemDataItemData}>943</div>
            </div>
            <div className={styles.itemDataItem}>
              <div className={styles.itemDataItemTitle}>自动挖掘联系人</div>
              <div className={styles.itemDataItemData}>943</div>
            </div> */}
          </div>
        </div>
      ))}
    </Spin>
  );

  const getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: 'none',
    background: 'white',
    ...draggableStyle,
  });
  const onDragEnd = result => {
    if (!result.destination) {
      return;
    }
    const startIndex = result.source.index;
    const endIndex = result.destination.index;
    const items = update(positionList, {
      $splice: [
        [startIndex, 1],
        [endIndex, 0, positionList[startIndex]],
      ],
    });
    setPositionList(items);
  };

  const handleStartTimeChange = (date: Moment) => {
    setStartTime(date);
  };

  return (
    <div className={`${styles.wrap} ${styles.wrap2}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.myTask}>我的任务</div>
        </div>
        {taskInfo.planList?.length > 2 && (
          <div
            className={styles.headerRight}
            onClick={() => {
              setOpen(!open);
              actionTrace('all');
            }}
          >
            <span>{open ? '收起全部' : '展开全部'}</span>
            <OpenIcon className={open ? styles.openIcon : ''} />
          </div>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.list}>{renderList()}</div>
      </div>
      <Modal width={480} title="修改每日营销上限" footer={null} visible={show} onCancel={() => setShow(false)}>
        <div className={styles.modalContent} ref={contentRef}>
          <div className={styles.modalInfo}>
            为保障发信质量,提高送达率。每日营销发信量不宜过多,系统会自动取符合条件的联系人发信，按联系人所处轮次计算优先级，优先发送新增联系人。
          </div>
          <Form
            form={form}
            layout="vertical"
            // initialValues={{ requiredMarkValue: requiredMark }}
            // onValuesChange={onRequiredTypeChange}
            // requiredMark={requiredMark}
          >
            {taskInfo.autoRecAvailable && (
              <Form.Item
                label="自动获客任务"
                name="autoSendLimit"
                rules={[
                  { required: true, message: '请输入自动获客任务限制' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (value == null || value === '') {
                        return Promise.resolve();
                      }
                      if (value && +value > 0 && +value < 501) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('自动获客任务限制范围1-500'));
                    },
                  }),
                ]}
              >
                <InputNumber className={styles.input} placeholder="请输入自动获客任务限制" />
              </Form.Item>
            )}
            <Form.Item
              label="营销托管任务"
              name="manualSendLimit"
              rules={[
                { required: true, message: '请输入营销托管任务限制' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (value == null || value === '') {
                      return Promise.resolve();
                    }
                    if (value && +value > 0 && +value < 2001) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('营销托管任务限制范围1-2000'));
                  },
                }),
              ]}
            >
              <InputNumber className={styles.input} placeholder="请输入营销托管任务限制" />
            </Form.Item>
            <div className={styles.priority}>
              <p className={styles.priorityTitle}>
                修改职位优先级<span className={styles.priorityDesc}>（优先给排序靠前的联系人发送）</span>
              </p>
              <div className={styles.priorityList}>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="droppable-1" type="PERSON" direction="horizontal">
                    {(provided, snapshotDrop) => (
                      <div style={{ display: 'flex' }} ref={provided.innerRef} {...provided.droppableProps}>
                        {positionList.map((item, index) => (
                          <Draggable draggableId={item.positionType + ''} index={index} key={item.positionType}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.dragHandleProps}
                                {...provided.draggableProps}
                                style={{ ...getItemStyle(snapshot.isDragging, provided.draggableProps.style) }}
                              >
                                <div key={item.positionType} className={styles.priorityItem}>
                                  <IconCard type="allipseGroup" />
                                  <span>{item.positionName}</span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {snapshotDrop.isDraggingOver && <div style={{ height: '36px' }}></div>}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </div>
            <div className={styles.priority}>
              <p className={styles.priorityTitle}>
                发送时间<span className={styles.priorityDesc}>（系统会自动在设置的发送时间内，完成每日营销信发送）</span>
              </p>
              <div className={styles.timePick}>
                <SiriusSelect
                  size="middle"
                  style={{ width: 180, height: 32 }}
                  value={dayRange}
                  defaultValue={dayRange}
                  onChange={setDayRange}
                  options={[
                    {
                      value: '1',
                      label: '工作日',
                    },
                    {
                      value: '2',
                      label: '全周',
                    },
                  ]}
                />
                <SiriusTimePicker value={startTime} onChange={(date: Moment) => handleStartTimeChange(date)} timeIntervals={60} />
                <div className={styles.splitLine}></div>
                <div className={styles.myPicker}>
                  <SiriusTimePicker value={endTime} onChange={(date: Moment) => setEndTime(date)} timeIntervals={60} />
                </div>
                <div className={styles.timeLabel}>北京时间东八区</div>
              </div>
              {showErrorTip && <div className={styles.errorTip}>开始时间与结束时间间隔不能小于4小时</div>}
            </div>
          </Form>
        </div>
        <div className={styles.btnForm}>
          <Button
            btnType="primary"
            onClick={() => {
              if (showErrorTip) {
                contentRef.current?.scrollTo({
                  top: 200,
                });
                return;
              }
              form.validateFields().then(async values => {
                const autoSendLimit = form.getFieldValue('autoSendLimit');
                const manualSendLimit = form.getFieldValue('manualSendLimit');
                await modifyLimit(+autoSendLimit, +manualSendLimit);
                setShow(false);
              });
            }}
          >
            确认
          </Button>
        </div>
      </Modal>
    </div>
  );
};
