import React, { FC, useState, useEffect, useImperativeHandle } from 'react';
import { Switch, Radio, Drawer, Modal, Skeleton, Spin, Row, Col } from 'antd';
import classnames from 'classnames/bind';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { apiHolder, apis, EdmSendBoxApi, SendSettingInfo, SecondSendInfo, BaseSendInfo, SecondSendStrategy } from 'api';
import styles from './DoubleTrack.module.scss';
import { MarketingVideo } from '../../utils';
import { StrategyItem, html2string } from './strategyItem';
import ReMarketing from '../../send/ReMarketing/reMarketing';
import { isEmpty } from '../../send/utils/getMailContentText';
import { getContentAsReplay } from '../../send/utils/getContentAsReplay';
import { ReMakretingDetail } from '../../send/ReMarketing/reMarketingDetail';
import { edmDataTracker } from '../../tracker/tracker';
import { ReactComponent as AddIcon } from '@/images/icons/edm/yingxiao/add-icon.svg';
import { ReactComponent as RightArrow } from '@/images/icons/edm/yingxiao/right-arrow.svg';
import { ReactComponent as DoubleTrackSvg } from '@/images/icons/edm/yingxiao/double-track.svg';
// import { ReactComponent as PeopleIcon } from '@/images/icons/edm/yingxiao/people.svg';
import { ReactComponent as WarningIcon } from '@/images/icons/edm/edm-common-notice.svg';
import { getIn18Text } from 'api';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const realStyle = classnames.bind(styles);
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const systemApi = apiHolder.api.getSystemApi();

export const DoubleTrack: FC<{
  initStrategys: Array<SecondSendStrategy> | undefined;
  baseSecondSendInfo: BaseSendInfo;
  /**
   * 是否需要系统推荐的二次营销策略
   */
  needSystemRecommend: boolean;
  handleSwitchChange?: (checked: boolean) => void;
}> = React.forwardRef((props, ref) => {
  const hostEmail = systemApi.getCurrentUser()?.id ?? '';

  const [showForm, setShowForm] = useState(false);
  // 控制抽屉显示隐藏
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const openHelpCenter = useOpenHelpCenter();

  const [initData, setInitData] = useState<SecondSendInfo>();
  const baseSecondSendInfo =
    Object.keys(props.baseSecondSendInfo || {}).length === 0
      ? {
          sendSettingInfo: {},
          contentEditInfo: {},
          // sameFirstSender: 0,
        }
      : props.baseSecondSendInfo;
  const { initStrategys, needSystemRecommend, handleSwitchChange } = props;
  // 当前选中的策略
  const [curItem, setCurItem] = useState<SecondSendStrategy>();
  const [curIndex, setCurIndex] = useState<number>();

  // 是否首次
  const [isFirst, setIsFirst] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  // 列表开关控制
  useEffect(() => {
    // if (showForm && initData && isFirst) {
    //   // 如果第一次打开，需要ai复写邮件标题
    //   if (
    //     initData.saveInfos && initData.saveInfos[1] && initData.saveInfos[1].triggerCondition
    //     && initData.saveInfos[1].triggerCondition?.isRecommend
    //     && !initData.saveInfos[1].triggerCondition.isEdited
    //     && initData.saveInfos[1].sendSettingInfo.emailSubjects
    //   ) {
    //     const { subject } = initData.saveInfos[1].sendSettingInfo.emailSubjects[0];
    //     setAiLoading(true);
    //     edmApi.contentPolish({
    //       originalContent: subject,
    //       language: '',
    //     }).then(res => {
    //       const newData = { ...initData };
    //       newData.saveInfos[1].sendSettingInfo.emailSubjects = [{
    //         subject: res.text,
    //       }];
    //       newData.saveInfos[1].triggerCondition && (newData.saveInfos[1].triggerCondition.isEdited = true);
    //       newData.saveInfos[1].triggerCondition && (newData.saveInfos[1].triggerCondition.isAiWrite = true);
    //       setInitData(newData);
    //     }).finally(() => {
    //       setAiLoading(false);
    //     })
    //   }
    //   setIsFirst(false);
    // }
  }, [showForm, initData]);

  // 二次营销策略校验
  const checkSecondSendContent = async (info: SecondSendInfo): Promise<SecondSendInfo> => {
    const unresolved = info.saveInfos.reduce((pre, cur, index) => {
      if (!cur.contentEditInfo.emailContentId && cur.triggerCondition?.isSelected) {
        pre.push({
          content: cur.contentEditInfo.emailContent || '',
          index,
        });
      }
      return pre;
    }, [] as Array<{ content: string; index: number }>);
    const promises = unresolved.map(item =>
      edmApi.emailContentUpload({
        emailContent: item.content,
        emailContentId: '',
      })
    );
    const result = await Promise.all(promises); // 返回结果和unresolved index对应
    result.forEach((item, index) => {
      info.saveInfos[unresolved[index].index].contentEditInfo.emailContentId = item.emailContentId;
      // info.saveInfos[unresolved[index].index].contentEditInfo.emailContent = ''; // 不再需要content了
    });
    // 改写完成之后需要同步到策略组件内

    return info;
  };

  useImperativeHandle(ref, () => ({
    async getReMarketingInfo(
      /**
       * 是否同步数据
       */
      noSync?: boolean
    ) {
      if (!showForm) {
        return {
          saveInfos: undefined,
        };
      }

      if (initData) {
        const newData = await checkSecondSendContent(initData);
        if (!noSync) {
          setInitData(newData);
        }
        return {
          saveInfos: newData?.saveInfos
            .filter(item => item.triggerCondition?.isSelected)
            .map(item => ({
              ...item,
              contentEditInfo: {
                ...item.contentEditInfo,
                emailContent: '', // 需要清空content
                emailContentId: item.contentEditInfo.emailContentId,
              },
              triggerCondition: {
                conditionType: item.triggerCondition?.conditionType,
                conditionContent: item.triggerCondition?.conditionContent,
                senderType: item.triggerCondition?.senderType,
              },
              selected: item.triggerCondition?.isSelected ? 1 : 0,
            })),
        };
      }
      return {
        saveInfos: undefined,
      };
    },
  }));

  useEffect(() => {
    if (initStrategys && initStrategys.length > 0) {
      setShowForm(true);
      setInitData({
        saveInfos: initStrategys.map(item => {
          item.triggerCondition && (item.triggerCondition.isEdited = true);
          item.triggerCondition && (item.triggerCondition.isSelected = item.selected === 1);
          return item;
        }),
      });
      return;
    }
  }, []);

  useEffect(() => {
    if (showForm && (!initStrategys || initStrategys.length === 0)) {
      if (needSystemRecommend && !isEmpty(baseSecondSendInfo.contentEditInfo?.emailContent || '')) {
        if (initData == null) {
          // 需要初始化数据，这就是两个默认推荐的策略
          // 默认数据的 senderEmails 需要动态调整
          setInitData({
            saveInfos: [
              {
                triggerCondition: {
                  conditionType: 0,
                  conditionContent: {
                    emailOpDays: 7,
                    emailOpType: 2,
                  },
                  isRecommend: true,
                  isSelected: true,
                  senderType: 0,
                },
                sendSettingInfo: {
                  ...baseSecondSendInfo.sendSettingInfo,
                  senderEmails: [hostEmail],
                },
                contentEditInfo: {
                  ...baseSecondSendInfo.contentEditInfo,
                },
              },
              {
                triggerCondition: {
                  conditionType: 0,
                  conditionContent: {
                    emailOpDays: 7,
                    emailOpType: 3,
                  },
                  isRecommend: true,
                  senderType: 0,
                },
                sendSettingInfo: {
                  ...baseSecondSendInfo.sendSettingInfo,
                  senderEmails: [hostEmail],
                },
                contentEditInfo: {
                  ...baseSecondSendInfo.contentEditInfo,
                },
              },
              {
                triggerCondition: {
                  conditionType: 0,
                  conditionContent: {
                    emailOpDays: 14,
                    emailOpType: 2,
                  },
                  isRecommend: true,
                  isSelected: true,
                  senderType: 0,
                },
                sendSettingInfo: {
                  ...baseSecondSendInfo.sendSettingInfo,
                  senderEmails: [hostEmail],
                },
                contentEditInfo: {
                  ...baseSecondSendInfo.contentEditInfo,
                },
              },
            ],
          });
        } else {
          // 没有 isEdited 标记的要同步数据，但是 senderEmails 不能同步
          const newData = initData.saveInfos.map(item => {
            let curItem = item.triggerCondition?.isEdited
              ? item
              : {
                  ...item,
                  ...baseSecondSendInfo,
                };
            curItem.sendSettingInfo.senderEmails = item.sendSettingInfo.senderEmails;
            return curItem;
          });
          setTimeout(() => {
            setInitData({
              saveInfos: newData,
            });
          }, 200);
        }
      }
    } else {
      if (initStrategys && initStrategys.length > 0) {
      } else {
        setInitData(undefined);
      }
    }
  }, [showForm, baseSecondSendInfo, needSystemRecommend]);

  const renderStrategyItem = (item: SecondSendStrategy, index: number) => (
    <StrategyItem
      {...item}
      op={(type, itemIndex) => {
        // 0 删除；1 详情
        if (type === 1) {
          setCurIndex(itemIndex);

          setCurItem(initData!.saveInfos[itemIndex]);
          setIsEditing(true);
          setShowModal(false);
          setShowDetail(true);
          // 埋点
          edmDataTracker.secondSendStrategy({
            action: 'detail',
            editContent: '',
            type: '',
          });
        } else if (type === 0) {
          Modal.confirm({
            title: getIn18Text('SHANCHUHOUGAIYINGXIAOXIN'),
            content: '',
            okText: getIn18Text('SHANCHU'),
            icon: <WarningIcon />,
            cancelText: getIn18Text('setting_system_switch_cancel'),
            centered: true,
            className: styles.alert,
            okButtonProps: {
              danger: true,
            },
            onOk() {
              const newData = [...initData!.saveInfos];
              newData.splice(itemIndex, 1);
              setInitData({
                saveInfos: newData,
              });
              edmDataTracker.secondSendStrategy({
                action: 'delete',
                editContent: '',
                type: '',
              });
            },
          });
        } else {
          // 选中
          const newData = [...initData!.saveInfos];
          const selected = newData[itemIndex]!.triggerCondition?.isSelected ?? false;
          newData[itemIndex]!.triggerCondition!.isSelected = !selected;
          setInitData({
            saveInfos: newData,
          });
          edmDataTracker.secondSendStrategy({
            action: !selected ? 'click' : 'close',
            editContent: '',
            type: newData[itemIndex]!.triggerCondition!.isRecommend ? (itemIndex === 0 ? 'syetemNoclick' : 'syetemNoreply') : 'customizedProject',
          });
        }
      }}
      itemIndex={index}
    />
  );

  return (
    <div className={styles.doubleTrackWrapper}>
      <div>
        <div
          className={realStyle({
            infoWrapper: true,
            opened: showForm,
          })}
        >
          {/* <div className={styles.titleWrapper}>
            <div className={styles.infoBox}>
              对未回复或未打开的用户进行二次营销，平均可增加<span className={styles.mark}>22<span>%</span></span>的回复率，
              <a href="http://waimao.163.com/knowledge/article/48" target="_blank" onClick={() => edmDataTracker.clickSecondSendInfo()}>
                了解更多<RightArrow style={{marginLeft: 2}} />
              </a>
            </div>
            <Switch size="small" checked={showForm} onChange={checked => {
              edmDataTracker.secondSendSwitch(checked ? 'open' : 'close');
              setShowForm(checked);
            }} />
          </div> */}
          <div className={styles.container}>
            <div className={styles.icon}>
              <DoubleTrackSvg />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>
                <span>{'多轮营销'}</span>
                <span className={styles.tag}>{getIn18Text('TISHENGHUIFULV')}</span>
              </div>
              <div className={styles.info}>
                {getIn18Text('SHEZHIZAICIYINGXIAOGEN')}
                <span className={styles.percent}>
                  22<span className={styles.percentMark}>%</span>
                </span>
                {getIn18Text('DEHUIFULV。')}
                <span
                  className={styles.infoMore}
                  onClick={() => {
                    edmDataTracker.taskIntellectTrack('secondaryMarketing');
                    openHelpCenter('/d/1639927269358137345.html');
                    // window.open('https://waimao.163.com/helpCenter/d/1639927269358137345.html');
                  }}
                >
                  {getIn18Text('KUAISULEJIE')}
                  <RightArrow />
                </span>
              </div>
            </div>
            <div className={styles.switch}>
              <Switch
                size="small"
                checked={showForm}
                onChange={checked => {
                  edmDataTracker.secondSendSwitch(checked ? 'open' : 'close');
                  setShowForm(checked);
                  handleSwitchChange && handleSwitchChange(checked);
                }}
              />
            </div>
          </div>
        </div>
        {showForm && (
          <div className={styles.strategyBox}>
            <div className={styles.strategyList}>
              <Row gutter={12}>
                {initData != null &&
                  initData.saveInfos.map((item, index) => {
                    if (index === 1 && item.triggerCondition?.isRecommend) {
                      return (
                        <Spin spinning={aiLoading} indicator={antIcon} tip={''}>
                          {renderStrategyItem(item, index)}
                        </Spin>
                      );
                    }
                    return <Col span={12}>{renderStrategyItem(item, index)}</Col>;
                  })}
                <Col span={12}>
                  <div
                    onClick={() => {
                      setShowModal(true);
                      setIsEditing(false);
                      setShowDetail(false);
                      // 传入的数据要有引用的内容
                      // setCurItem({
                      //   sendSettingInfo: {},
                      //   contentEditInfo: {
                      //     emailContent: getContentAsReplay(baseSecondSendInfo.contentEditInfo.emailContent),
                      //   },
                      // });
                      setCurItem({
                        sendSettingInfo: {
                          ...baseSecondSendInfo.sendSettingInfo,
                        },
                        contentEditInfo: {
                          ...baseSecondSendInfo.contentEditInfo,
                          emailContent: baseSecondSendInfo.contentEditInfo?.emailContent || '',
                          // 二次营销不再引用原文，由服务端去拼接
                          // emailContent: getContentAsReplay(baseSecondSendInfo.contentEditInfo?.emailContent || '', {
                          //   fromEmail: baseSecondSendInfo.sendSettingInfo.senderEmail || '',
                          //   nickname: baseSecondSendInfo.sendSettingInfo.sender || '',
                          //   subject:
                          //     baseSecondSendInfo.sendSettingInfo.emailSubjects && baseSecondSendInfo.sendSettingInfo.emailSubjects[0]
                          //       ? baseSecondSendInfo.sendSettingInfo.emailSubjects[0].subject
                          //       : '',
                          // }),
                        },
                      });
                      setCurIndex(initData?.saveInfos.length);
                    }}
                    className={styles.strategyAdd + ' ' + styles.strategyItem}
                  >
                    <AddIcon
                      style={{
                        width: 32,
                        height: 32,
                        marginBottom: 12,
                      }}
                    />
                    <div>{'添加多轮营销'}</div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        )}
        {/* {showForm && children} */}
        {showDetail && (
          <ReMakretingDetail
            visiable={showDetail}
            strategy={curItem}
            onClose={() => {
              setShowDetail(false);
            }}
            onEdit={st => {
              setShowDetail(false);
              setCurItem(st);
              setShowModal(true);
            }}
          />
        )}
        {showModal && (
          <ReMarketing
            visible={showModal}
            strategy={curItem}
            needModal={false}
            isEditing={isEditing}
            isSecondSend
            onSave={strategy => {
              strategy.triggerCondition!.isEdited = true;
              strategy.triggerCondition!.isSelected = true;
              if (initData) {
                const newData = [...initData?.saveInfos];
                if (curIndex! > initData.saveInfos.length - 1) {
                  newData.push(strategy);
                } else {
                  strategy.triggerCondition!.isRecommend = curItem?.triggerCondition!.isRecommend;
                  newData[curIndex!] = strategy;
                }
                setInitData({
                  saveInfos: newData,
                });
              } else {
                setInitData({
                  saveInfos: [strategy],
                });
              }
              edmDataTracker.secondSendStrategy({
                action: 'edit',
                editContent: '',
                type: '',
              });
            }}
            onClose={() => {
              setShowModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
});
