import React, { FC, useState, useEffect, useCallback, MouseEvent } from 'react';
import { message, Form } from 'antd';
import lodashGet from 'lodash/get';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import { Switch } from '@web-common/components/UI/Switch';
// import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import { Input } from '@web-common/components/UI/Input';
// import { SenderEmail } from '../../../components/SenderEmail/senderEmail';
import { apiHolder, apis, EdmSendBoxApi, GetAiOverviewRes } from 'api';
import { BasicInput } from '../../AiHostingEdit/index';
import { ReactComponent as TotalOpenedIcon } from '@/images/icons/edm/yingxiao/total-opened.svg';
import { ReactComponent as TotalReplayIcon } from '@/images/icons/edm/yingxiao/total-replay.svg';
import { ReactComponent as TotalSendIcon } from '@/images/icons/edm/yingxiao/total-send.svg';
import { ReactComponent as TotalTasksIcon } from '@/images/icons/edm/yingxiao/total-tasks.svg';
import { ReactComponent as RightArrowLinkIcon } from '@/images/icons/edm/yingxiao/right-arrow-link-white.svg';
import { ReactComponent as AiHostingVideo } from '@/images/icons/edm/yingxiao/ai-hosting-video-mini.svg';
import TipsIcon from '@/images/icons/edm/yingxiao/tips.svg';
import TipsIcon2 from '@/images/icons/edm/yingxiao/tips2.svg';
import { ReactComponent as OpIcon } from '@/images/icons/edm/yingxiao/op-icon.svg';
import { ReactComponent as BetterOpIcon } from '@/images/icons/edm/yingxiao/better-op.svg';
import { MyAiHosting } from '../myAiHosting';
import { edmDataTracker } from '../../../tracker/tracker';
import { ConfigActions, useActions } from '@web-common/state/createStore';
import classNames from 'classnames';

import styles from './Header.module.scss';
import { getIn18Text } from 'api';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

const videoDrawerConfig = { videoId: 'V12', source: 'kehukaifa', scene: 'kehukaifa_4' };

export type Action = (
  | {
      type: 'chooseScheme';
    }
  | {
      type: 'baseInfo';
    }
  | {
      type: 'submitConfirm';
    }
  | {
      type: 'detail';
    }
  | {
      type: 'editEmail';
    }
) & {
  planId: string;
  taskId: string;
  operateType: number;
  /**
   * 1 自动获客 0 营销托管
   */
  planMode?: 0 | 1;
  /**任务详情页是否打开添加联系人抽屉 */
  defaultContactVisible?: boolean;
};

const replayList = [
  {
    label: getIn18Text('YILUNHUIFU'),
    key: '',
  },
  {
    label: getIn18Text('ERLUNHUIFU'),
    key: '',
  },
  {
    label: getIn18Text('SANLUNHUIFU'),
    key: '',
  },
  {
    label: getIn18Text('SILUNHUIFU'),
    key: '',
  },
  {
    label: getIn18Text('WULUNYISHANGHUIFU'),
    key: '',
  },
];

export const Header: FC<{
  openEditPage: (taskId: string) => void;
  openContactPage: (taskId: string) => void;
  taskId: string;
  refreshPage: () => void;
  addContact: (taskId: string) => void;
  actionTrace: (action: string) => void;
  basicInput?: BasicInput;
  reLoadTaskInfo?: () => void;
  op: (action: Action) => void;
  openReplayPage: (planId: string) => void;
}> = props => {
  const { op } = props;
  // todo 这个可以不作为一个state，可以作为一个静态的conf
  const [dataView, setDataView] = useState<
    Array<{
      bgColor: string;
      Icon: string;
      label: string;
      key: keyof GetAiOverviewRes;
    }>
  >([
    {
      bgColor: '#00C4D6',
      Icon: TotalTasksIcon,
      label: getIn18Text('YUNXINGZHONGRENWUSHU'),
      // key: 'totalReplyCount',
      key: 'totalPlanCount',
    },
    {
      bgColor: '#6557FF',
      Icon: TotalSendIcon,
      label: getIn18Text('LEIJIYINGXIAORENSHU'),
      // key: 'totalReplyCount',
      key: 'totalReceiverCount',
    },
    {
      bgColor: '#00CCAA',
      Icon: TotalOpenedIcon,
      label: getIn18Text('LEIJIDAKAIFENGSHU'),
      key: 'totalReadCount',
    },
    {
      bgColor: '#FE7C70',
      Icon: TotalReplayIcon,
      label: getIn18Text('LEIJIHUIFURENSHU'),
      key: 'totalReplyCount',
    },
  ]);
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [overview, setOverview] = useState<Partial<GetAiOverviewRes>>({});
  const [curRounds, setCurRounds] = useState<GetAiOverviewRes['roundReplyCounts']>([]);
  const [open, setOpen] = useState(false);
  // 是否显示tips，0不展示，1展示未开启，2展示未添加联系人
  const [showTips, setShowTips] = useState<0 | 1 | 2>();
  const [hasContact, setHasContact] = useState(false);
  const [execTaskStatus, setExecTaskStatus] = useState<0 | 1 | 2>(0);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [aiHostingKey, setAiHostingKey] = useState(0);
  const { showVideoDrawer } = useActions(ConfigActions);
  const openHelpCenter = useOpenHelpCenter();

  const refreshPage = () => {
    queryStats();
    setAiHostingKey(aiHostingKey + 1);
    props.refreshPage();
  };

  const queryStats = useCallback(async () => {
    setLoading(true);
    if (!props.taskId) {
      setLoading(false);
      return;
    }
    try {
      const res = await edmApi.getAiOverview({
        taskId: props.taskId,
      });
      setOverview(res);
      setOpen(res.hostingSwitch);
      setShowTips(res.hostingSwitch ? 0 : 1);
      setHasContact(res.hasContact);
      setExecTaskStatus(res.execTaskStatus);
    } catch (err: any) {
      message.error(err?.message || err?.msg || '获取数据失败，请重试！');
    }
    setLoading(false);
  }, [props, props.taskId, setExecTaskStatus, setLoading]);

  useEffect(() => {
    if (overview.roundReplyCounts) {
      let rounds: Array<number> = [];
      overview.roundReplyCounts.forEach((round, index) => {
        if (index < 4) {
          rounds.push(round);
        } else {
          rounds[4] == null ? rounds.push(round) : (rounds[4] += round);
        }
      });
      setCurRounds(rounds);
    }
  }, [overview]);

  const switchChange = async (val: boolean) => {
    props.actionTrace('switch');
    try {
      const res = await edmApi.aiTaskSwitch({
        taskId: props.taskId,
        status: val ? 1 : 0,
      });
      setOpen(val);
      val ? message.success(getIn18Text('YIKAIQITUOGUANYINGXIAO')) : message.success(getIn18Text('YIGUANBITUOGUANYINGXIAO'));
      // 开启成功需要刷新页面
      if (val) {
        setTimeout(() => {
          refreshPage();
        }, 1000);
      }
    } catch (err: any) {
      message.error(err?.message || err?.msg || '切换失败，请重试！');
    }
  };

  const resetModalData = () => {
    form.setFieldsValue({
      senderEmail: lodashGet(props, 'basicInput.senderEmail', ''),
      replyEmail: lodashGet(props, 'basicInput.setting.replyEmail', ''),
    });
  };

  useEffect(() => {
    queryStats();
  }, [props, props.taskId]);

  useEffect(() => {
    resetModalData();
  }, [props.basicInput]);

  useEffect(() => {
    if (!modalVisible) {
      resetModalData();
    }
  }, [modalVisible]);

  const getTipsComp = () => {
    // if (!open) {
    //   return (
    //     <div className={styles.tips}>
    //       <img src={TipsIcon} alt="" />
    //       <span className={styles.tipsTxt}>{getIn18Text('NINDANGQIANSHANGWEIKAIQI')}</span>
    //     </div>
    //   );
    // } else
    if (!hasContact) {
      return (
        <div className={styles.tips}>
          <img src={TipsIcon} alt="" />
          <span className={styles.tipsTxt}>{getIn18Text('NINDANGQIANSHANGWEITIANJIA')}</span>
          <a
            onClick={() => {
              props.addContact(props.taskId);
              props.actionTrace('add');
            }}
            style={{
              marginLeft: 8,
            }}
          >
            {getIn18Text('QUTIANJIA')}
          </a>
        </div>
      );
    } else if (execTaskStatus === 1) {
      return (
        <div className={`${styles.tips} ${styles.tips2}`}>
          <img src={TipsIcon2} alt="" />
          <span className={styles.tipsTxt}>{getIn18Text('RIFAXINEDUYIDA')}</span>
        </div>
      );
    } else if (execTaskStatus === 2) {
      return (
        <div className={`${styles.tips} ${styles.tips2}`}>
          <img src={TipsIcon2} alt="" />
          <span className={styles.tipsTxt}>{getIn18Text('QIYEFAXINEDUYI')}</span>
        </div>
      );
    }
    return null;
  };

  const onKnowledgeCenterClick = (e: MouseEvent, url: string) => {
    openHelpCenter(url);
    e.preventDefault();
  };

  const renderHeader = () => (
    <div className={styles.headerInfo}>
      <div className={styles.headerInfoLeft}>
        {/* <img src="" alt="ai" /> */}
        <div className={styles.headerInfoLeftInfo}>
          <div className={styles.slog}>
            <div className={styles.slogTitle}>{getIn18Text('YINGXIAOTUOGUAN')}</div>
            {/* <div className={styles.switch}></div> */}
            {/* <Switch size="small" className={styles.slogSwitch} disabled={loading} checked={open} onChange={switchChange} /> */}
            {open && (
              <div className={styles.slogTime}>
                {getIn18Text('YIYINGXIAO：')}
                {overview.hostingTime}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.headerInfoRight}>
        <a className={styles.slogBtnWrap} onClick={() => showVideoDrawer(videoDrawerConfig)}>
          <AiHostingVideo />
          <span className={styles.slogBtnWrapTitle}>{getIn18Text('CHANPINXUEYUAN')}</span>
        </a>
        <a target="_blank" className={styles.slogBtnWrap} onClick={e => onKnowledgeCenterClick(e, '/d/1641339855990423553.html')} href="">
          <OpIcon />
          <span className={styles.slogBtnWrapTitle}>{getIn18Text('CAOZUOSHOUCE')}</span>
        </a>
        <a target="_blank" className={styles.slogBtnWrap} onClick={e => onKnowledgeCenterClick(e, '/d/1663094862923243522.html')} href="">
          <BetterOpIcon />
          <span className={styles.slogBtnWrapTitle}>{getIn18Text('ZUIJIASHIJIAN')}</span>
        </a>
        {/* <Button
          btnType="minorLine"
          onClick={() => {
            props.op({
              type: 'baseInfo',
              taskId: props.taskId,
              planId: '',
              operateType: 1,
            });
            props.actionTrace('editInfo');
          }}
        >
          {getIn18Text('SHEZHIJICHUXINXI')}
        </Button> */}
        {/* <Button
          className={styles.editBtn}
          onClick={() => {
            props.openEditPage(props.taskId);
            props.actionTrace('edit');
          }}
        >
          修改营销信
        </Button> */}
        <Button
          style={{
            marginLeft: 8,
          }}
          btnType="minorLine"
          onClick={() => {
            props.openContactPage(props.taskId);
            props.actionTrace('contacts');
          }}
        >
          {getIn18Text('GUANLILIANXIREN')}
        </Button>
        <Button
          style={{
            marginLeft: 8,
          }}
          btnType="primary"
          onClick={() => {
            // props.addContact(props.taskId);
            props.actionTrace('create');
            props.op({
              type: 'chooseScheme',
              taskId: props.taskId,
              planId: '',
              operateType: 2,
            });
          }}
        >
          {getIn18Text('XINJIANYINGXIAORENWU')}
        </Button>
      </div>
    </div>
  );

  // const handleSubmit = async () => {
  //   if (modalLoading) {
  //     return;
  //   }
  //   setModalLoading(true);
  //   const { senderEmail, replyEmail } = form.getFieldsValue();
  //   const params = {
  //     senderEmail,
  //     replyEmail,
  //     taskId: props.taskId,
  //   };
  //   edmApi.updateAiBaseInfo(params).then(() => {
  //     setModalVisible(false);
  //     message.success(getIn18Text('BAOCUNCHENGGONG'));
  //     props.reLoadTaskInfo && props.reLoadTaskInfo();
  //   }).catch(() => {
  //     message.error(getIn18Text('BAOCUNSHIBAI'));
  //   }).finally(() => {
  //     setModalLoading(false);
  //   });
  // };

  return (
    <>
      {renderHeader()}
      <div className={styles.header}>
        {/* 未开启提示 */}
        {/* {getTipsComp()} */}
        {/* 营销数据和营销方案左右布局 */}
        <div className={styles.strategy}>
          {/* 我的营销数据 */}
          <div className={styles.postData}>
            {/* <div className={styles.postDataHeader}>
              <div className={styles.postDataTitle}>我的营销数据</div>
              {open && (
                <div className={styles.slogTime}>
                  {getIn18Text('YIYINGXIAO：')}
                  {overview.hostingTime}
                </div>
              )}
            </div> */}
            <div className={styles.headerView}>
              {dataView.map(view => {
                const Icon = view.Icon;
                const showReplyCountBtn = view.key === 'totalReplyCount' && overview[view.key] > 0;
                return (
                  <div
                    key={view.label}
                    className={styles.viewCard}
                    style={{
                      backgroundColor: view.bgColor,
                    }}
                  >
                    <div className={styles.cardTitle}>
                      {/* <img src={view.icon} alt="" /> */}
                      <Icon />
                      <div className={styles.title}>
                        {showReplyCountBtn ? (
                          <span
                            className={styles.titleContent}
                            onClick={() => {
                              props.openReplayPage('');
                            }}
                          >
                            <span className={styles.link}>{view.label}</span>

                            <RightArrowLinkIcon className={styles.icon} />
                          </span>
                        ) : (
                          <span>{view.label}</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.number}>{overview[view.key] ?? '--'}</div>
                  </div>
                );
              })}
            </div>
            {/* <div className={styles.replayList}>
              {overview.roundReplyCounts != null && overview.roundReplyCounts.length > 0 && (
                <div className={styles.replay}>
                  {curRounds.map((replay, index) => (
                    <div className={styles.replayItem} key={index}>
                      <div className={styles.replayItemLabel}>{replayList[index]?.label}</div>
                      <div className={styles.replayItemNum}>{replay}</div>
                    </div>
                  ))}
                </div>
              )}
            </div> */}
          </div>
          {/* 营销方案 */}
          {/* <MyAiHosting actionTrace={props.actionTrace} key={aiHostingKey} taskId={props.taskId} op={props.op} /> */}
        </div>
      </div>
      {/* <Modal
        title={getIn18Text('SHEZHI')}
        width={480}
        wrapClassName={styles.headerModal}
        onOk={() => handleSubmit()}
        onCancel={() => setModalVisible(false)}
        visible={modalVisible}
        okText={getIn18Text("QUEREN")}
        confirmLoading={modalLoading}
      >
        <Form form={form}>
          <SenderEmail form={form} />
          <Form.Item
            label="回复邮箱"
            name='replyEmail'
            rules={[
              { required: true, message: '请输入回复邮箱' },
              { type: 'email', message: getIn18Text('YOUXIANGGESHIBUZHENGQUE') }
            ]}
          >
            <Input maxLength={200} placeholder="请输入收件人回复时，接收回信的邮件" />
          </Form.Item>
        </Form>
      </Modal> */}
    </>
  );
};
