import React, { useState, useEffect, useImperativeHandle } from 'react';
import { AiHostingApi, api, apis, HostingPlanModel, getIn18Text } from 'api';
import { Col, Row, Steps, Dropdown, Menu, message, Tooltip } from 'antd';
import classnames from 'classnames';
import styles from './index.module.scss';
import { CustomPlanDrawer } from '../CustomPlanDrawer/index';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import { useAppSelector, ConfigActions, useActions } from '@web-common/state/createStore';
import { ReactComponent as RegularTimeSvg } from '@/images/icons/edm/yingxiao/regular-time.svg';
import { ReactComponent as RegularCheckSvg } from '@/images/icons/edm/yingxiao/regular-check.svg';
import { ReactComponent as RegularUncheckSvg } from '@/images/icons/edm/yingxiao/regular-uncheck.svg';
import AutoPng from '@/images/icons/edm/yingxiao/regular-auto.png';
import XinkePng from '@/images/icons/edm/yingxiao/regular-xinke.png';
import LaokePng from '@/images/icons/edm/yingxiao/regular-laoke.png';
import YixiangPng from '@/images/icons/edm/yingxiao/regular-yixiang.png';
import WeixiPng from '@/images/icons/edm/yingxiao/regular-weixi.png';
import ZiDingYiPng from '@/images/icons/edm/yingxiao/regular-zidingyi.png';
import { ReactComponent as KaifaxinSvg } from '@/images/icons/edm/yingxiao/regular-mail-kaifaxin.svg';
import { ReactComponent as Jieshao1Svg } from '@/images/icons/edm/yingxiao/regular-mail-jieshao1.svg';
import { ReactComponent as Jieshao2Svg } from '@/images/icons/edm/yingxiao/regular-mail-jieshao2.svg';
import { ReactComponent as GongsiSvg } from '@/images/icons/edm/yingxiao/regular-mail-gongsi.svg';
import { ReactComponent as LianxiSvg } from '@/images/icons/edm/yingxiao/regular-mail-lianxi.svg';
import { ReactComponent as NextSvg } from '@/images/icons/edm/yingxiao/regular-next.svg';
import { ReactComponent as PrevSvg } from '@/images/icons/edm/yingxiao/regular-prev.svg';
import { ReactComponent as AddSvg } from '@/images/icons/edm/yingxiao/regular-add.svg';
import { ReactComponent as DelIconSvg } from '@/images/icons/edm/yingxiao/regular-delIcon.svg';
import { ReactComponent as TongyongShanchu } from '@web-common/images/newIcon/tongyong_shanchu.svg';
import { ReactComponent as EditorIcon } from '@/images/icons/edm/yingxiao/editor-icon.svg';
import { ReactComponent as AutoCustomerIcon } from '@/images/icons/edm/yingxiao/auto_customer.svg';
import { ReactComponent as CrossBigIcon } from '@/images/icons/edm/yingxiao/cross_big.svg';
import { ReactComponent as CrossBigIconSmall } from '@/images/icons/edm/yingxiao/cross_big_small.svg';
import { ReactComponent as CrossSmallIcon } from '@/images/icons/edm/yingxiao/cross_small.svg';
import { ReactComponent as TongyongJiantouShang } from '@web-common/images/newIcon/tongyong_jiantou_shang.svg';
import { ReactComponent as TongyongJiantouXia1 } from '@web-common/images/newIcon/tongyong_jiantou_xia1.svg';
import { ReactComponent as TongyongJiantouYou1 } from '@web-common/images/newIcon/tongyong_jiantou_you1.svg';
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/yingxiao/selectTask/select-task-question.svg';
import { ReactComponent as BestPractice } from '@/images/icons/edm/yingxiao/ai-hosting-best-practice.svg';
import { ReactComponent as OperatingManual } from '@/images/icons/edm/yingxiao/ai-hosting-operating-manual.svg';
import { ReactComponent as AiHostingVideo } from '@/images/icons/edm/yingxiao/ai-hosting-video-mini.svg';
import { useOpenHelpCenter } from '@web-common/utils/utils';
import { edmDataTracker } from '../../tracker/tracker';
import { useNoviceTask } from '@/components/Layout/TaskCenter/hooks/useNoviceTask';
import { TaskNoviceParams } from '../utils/utils';
interface AiHostingPlansProps {
  sIds?: string[];
  hostingPlans: HostingPlanModel[];
  taskId?: string;
  refreshPlans: () => void;
  handleClickPlan: (plan: HostingPlanModel[]) => void;
  // 是否是统一发信流程
  sendFlow?: boolean;
}

export const systemIdToStyle: Record<string, any> = {
  '0': {
    color: '#4759B2',
    src: XinkePng,
    linearFrom: '#9AE8FB',
    linearTo: '#88AEFE',
    background: 'linear-gradient(278.39deg, #DDE8FF 24.42%, #E3F9FE 102.25%)',
    colorItem: '#D6E6FC',
  },
  '1': {
    color: '#7A51CB',
    src: LaokePng,
    linearFrom: '#E4C2FF',
    linearTo: '#AB97FA',
    background: 'linear-gradient(240.8deg, #E6E0FE 18.4%, #F4EBFF 89.95%)',
    colorItem: '#EDE4FF',
  },
  '2': {
    color: '#398E80',
    src: YixiangPng,
    linearFrom: '#A2F6C4',
    linearTo: '#7EE6E6',
    background: 'linear-gradient(245.08deg, #D8F7F7 13.92%, #DFFEEE 84.64%)',
    colorItem: '#D6F7F1',
  },
  '3': {
    color: '#CC913D',
    src: WeixiPng,
    linearFrom: '#FBD792',
    linearTo: '#F9BB88',
    background: 'linear-gradient(240.8deg, #FFF3DB 18.4%, #FFEBDB 89.95%)',
    colorItem: '#FFF0DB',
  },
  '4': {
    color: '#4759B2',
    src: AutoPng,
    linearFrom: '#9AE8FB',
    linearTo: '#88AEFE',
    background: 'linear-gradient(278.39deg, #DDE8FF 24.42%, #E3F9FE 102.25%)',
    colorItem: '#DEEBFD',
  },
  '-1': {
    color: '',
    src: ZiDingYiPng,
    linearFrom: '#AAB8FF',
    linearTo: '#9A8AFF',
    background: 'linear-gradient(299deg, #E0E3FF 0%, #E9EDFF 100%)',
    colorItem: '#E0DDFF',
  },
};

export const systemRoundToStyle: Record<string, any> = {
  '1': {
    color: '#7A51CB',
    background: '#EDE4FF',
  },
  '2': {
    color: '#398E80',
    background: '#D6F7F1',
  },
  '3': {
    color: '#4759B2',
    background: '#DEEBFD',
  },
  '4': {
    color: '#CC913D',
    background: '#FFF3E2',
  },
  '5': {
    color: '#CB493D',
    background: '#FFE5E2',
  },
};

interface CHostingPlanModel extends HostingPlanModel {
  total: number;
  current: number;
  existCount?: number;
  limitCount?: number;
}

export const emailNameToIcon = {
  开发信: <KaifaxinSvg className={styles.mailImg} />,
  商品介绍: <Jieshao1Svg className={styles.mailImg} />,
  商品介绍2: <Jieshao2Svg className={styles.mailImg} />,
  长期联系: <LianxiSvg className={styles.mailImg} />,
  公司介绍: <GongsiSvg className={styles.mailImg} />,
};
const { Step } = Steps;
const aiHostingApi = api.requireLogicalApi(apis.aiHostingApiImpl) as AiHostingApi;

const MAXCOUNT = 4;

const videoDrawerConfig = { videoId: 'V12', source: 'kehukaifa', scene: 'kehukaifa_4' };

const AiHostingPlans = React.forwardRef((props: AiHostingPlansProps, ref) => {
  const { hostingPlans, sIds, taskId, refreshPlans, handleClickPlan, sendFlow } = props;
  const aiHostingInitObj = useAppSelector(state => state.aiWriteMailReducer.aiHostingInitObj);
  // 营销托管入口进入且非完全新建
  const notEnterNew = aiHostingInitObj?.type && aiHostingInitObj?.type !== 'new';
  const [cHostingPlanAuto, setCHostingPlanAuto] = useState<CHostingPlanModel>();
  const [cHostingPlans, setCHostingPlans] = useState<CHostingPlanModel[]>([]);
  // const [planIds, setPlanIs] = useState<string[]>(sIds);
  const [customVisible, setCustomVisible] = useState<boolean>(false);
  const [sHostingPlan, setSHostingPlan] = useState<HostingPlanModel | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [delPlanId, setDelPlanId] = useState<string>('');

  const { showVideoDrawer } = useActions(ConfigActions);

  const { commit, getPopoverByStep } = useNoviceTask(TaskNoviceParams);
  const Popover1 = getPopoverByStep(1);
  const openHelpCenter = useOpenHelpCenter();

  const changeStatus = (plan: CHostingPlanModel) => {
    // 自动获客任务超过限制次数弹出提示
    if (plan?.planId === '4') {
      edmDataTracker.track('pc_marketing_edm_host_set', { changeAction: 'auto' });
      if ((plan.existCount || 0) >= (plan.limitCount || 10)) {
        message.warn(`最多创建${plan.limitCount || 10}个，您可以修改已有任务增加挖掘条件`);
        return;
      }
    } else if (systemIdToStyle[plan?.planId]) {
      edmDataTracker.track('pc_marketing_edm_host_set', { changeAction: 'basic' });
    } else {
      edmDataTracker.track('pc_marketing_edm_host_set', { changeAction: 'other' });
    }
    handleClickPlan([plan]);
    commit(1);
    // setPlanIs([plan.planId]);
    // let index = planIds.indexOf(plan.planId);
    // if (index === -1) {
    //   setPlanIs([...planIds, plan.planId]);
    // } else {
    //   setPlanIs(planIds.filter(id => id != plan.planId));
    // }
  };

  // useImperativeHandle(ref, () => ({
  //   getPlanIds() {
  //     return cHostingPlans.filter(plan => planIds.includes(plan.planId)) || [];
  //   },
  // }));

  // const showCheckIcon = (planId: string, show: boolean) => {
  //   const dom = document.querySelector(`.checkIcon_${planId}`);
  //   if (!!dom && !planIds.includes(planId)) {
  //     dom.style.display = show ? 'flex' : 'none';
  //   }
  // };

  const handleMenuClick = (key: string, plan: HostingPlanModel) => {
    if (key === 'edit') {
      openDrawer(plan);
    }
    if (key === 'del') {
      setShowModal(true);
      setDelPlanId(plan.planId || '');
    }
    key && edmDataTracker.track('pc_marketing_edm_host_set', { changeAction: key });
  };

  const deletePlan = async () => {
    if (delPlanId === '') return;
    const res = await aiHostingApi.delAiHostingPlan({ taskId: taskId || '', planId: delPlanId });
    if (!!res) {
      toast.success({ content: getIn18Text('SHANCHUCHENGGONG1') });
      setShowModal(false);
      setDelPlanId('');
      refreshPlans();
      return;
    }
    toast.error({ content: getIn18Text('SHANCHUSHIBAI') });
  };

  const openDrawer = (plan?: HostingPlanModel) => {
    setCustomVisible(true);
    setSHostingPlan(plan || null);
  };

  const showPrevAndNext = (total: number, current: number) => {
    let hasPrev = false;
    let hasNext = false;
    hasNext = (current + 1) * MAXCOUNT < total;
    hasPrev = current * MAXCOUNT > 0;
    return { hasPrev, hasNext };
  };

  const handlePrevAndNext = (type: 'prev' | 'next', planId: string) => {
    const nCHostingPlans = cHostingPlans
      .filter(item => item.planId !== '4')
      .map(plan => {
        if (plan.planId === planId) {
          return { ...plan, current: type === 'next' ? plan.current + 1 : plan.current - 1 < 0 ? 0 : plan.current - 1 };
        }
        return plan;
      });
    setCHostingPlans(nCHostingPlans);
  };

  const renderAddPlanComp = () => {
    return (
      <Col span={12}>
        <div
          className={`${styles.AiHostingPlan} ${styles.AiHostingPlanAdd}`}
          onClick={() => {
            openDrawer();
            edmDataTracker.track('pc_marketing_edm_host_set', { changeAction: 'create' });
          }}
        >
          <AddSvg style={{ marginBottom: '16px' }} />
          <div>{getIn18Text('XINJIANZIDINGYIFANGAN')}</div>
        </div>
      </Col>
    );
  };

  const renderOperationComp = (plan: CHostingPlanModel) => {
    return (
      <div className={styles.menus}>
        <Tooltip title={getIn18Text('BIANJI')}>
          <span
            className={styles.menusItem}
            onClick={e => {
              e.stopPropagation();
              handleMenuClick('edit', plan);
            }}
          >
            <EditorIcon />
          </span>
        </Tooltip>
        <Tooltip title={getIn18Text('SHANCHU')}>
          <span
            className={styles.menusItem}
            onClick={e => {
              e.stopPropagation();
              handleMenuClick('del', plan);
            }}
          >
            <TongyongShanchu />
          </span>
        </Tooltip>
      </div>
    );
  };

  // const renderDropdownComp = (plan: CHostingPlanModel) => {
  //   return (
  //     <Dropdown
  //       overlay={
  //         <Menu
  //         // onClick={e => {
  //         //   handleMenuClick(e.key, plan);
  //         // }}
  //         >
  //           <Menu.Item
  //             key="edit"
  //             onClick={e => {
  //               e.domEvent.stopPropagation();
  //               handleMenuClick('edit', plan);
  //             }}
  //           >
  //             <span style={{ color: '#51555C' }}>编辑</span>
  //           </Menu.Item>
  //           <Menu.Item
  //             key="del"
  //             onClick={e => {
  //               e.domEvent.stopPropagation();
  //               handleMenuClick('del', plan);
  //             }}
  //           >
  //             <span style={{ color: '#51555C' }}>删除</span>
  //           </Menu.Item>
  //         </Menu>
  //       }
  //     >
  //       <span className={styles.menu} onClick={e => e.preventDefault()}>
  //         ···
  //       </span>
  //     </Dropdown>
  //   );
  // };

  const renderHeaderComp = (plan: CHostingPlanModel) => {
    return (
      <div className={styles.header}>
        <img src={getColorConfig(plan.planId)?.src || ''} alt="" className={styles.icon} />
        <span className={styles.title}>{plan.planName}</span>
        {plan.planTags &&
          plan.planTags.map(tag => {
            const configColor = getColorConfig(plan.planId)?.color;
            return (
              <div
                className={classnames(styles.tag, configColor ? {} : styles.tagCustom)}
                style={
                  configColor
                    ? {
                        color: configColor,
                        borderColor: configColor,
                      }
                    : {}
                }
              >
                {tag.tagName}
              </div>
            );
          })}
      </div>
    );
  };

  const renderAutoContentItemComp = (info: HostingMailInfoModel) => {
    return (
      <div className={styles.contentItem}>
        <CrossSmallIcon />
        <div className={styles.mailCont}>
          {emailNameToIcon[info.emailName] || <KaifaxinSvg />}
          <span className={styles.emailName}>{info.emailName}</span>
        </div>
      </div>
    );
  };

  const renderAutoContentComp = (plan: CHostingPlanModel) => {
    const cMailInfos = plan.mailInfos?.slice(plan.current * MAXCOUNT, (plan.current + 1) * MAXCOUNT) || [];
    const infoLeft = cMailInfos.slice(0, 2);
    const infoRight = cMailInfos.slice(2);
    return (
      <div className={styles.autoContent}>
        <AutoCustomerIcon />
        <div className={styles.contentRight}>
          <span className={styles.contentRightText}>{getIn18Text('YOUXIAOHUIFU')}</span>
        </div>
        <div className={styles.contentLeft}>
          <div className={styles.contentItemWrap1}>{infoLeft.map(info => renderAutoContentItemComp(info))}</div>
          <div className={styles.contentItemWrap2}>{infoRight.map(info => renderAutoContentItemComp(info))}</div>
          <TongyongJiantouShang className={styles.contentIconShang} />
          <TongyongJiantouXia1 className={styles.contentIconXia} />
          <TongyongJiantouYou1 className={styles.contentIconYou} />
        </div>
      </div>
    );
  };

  const renderContentComp = (plan: CHostingPlanModel) => {
    const cMailInfos = plan.mailInfos?.slice(plan.current * MAXCOUNT, (plan.current + 1) * MAXCOUNT) || [];
    return (
      <div className={styles.content}>
        {cMailInfos.map(info => {
          if (!!info.expandMailInfos?.length) {
            return (
              <div className={classnames(styles.contentItem, styles.contentItem2)}>
                <div className={styles.contentItem2Child} key={1}>
                  <CrossBigIconSmall className={styles.item2Icon} />
                  <div className={classnames(styles.mailCont, styles.mailCont2)}>
                    {emailNameToIcon[info.emailName] || <KaifaxinSvg />}
                    <span className={styles.emailName}>{info.emailName}</span>
                  </div>
                </div>
                {!!info.expandMailInfos?.length && (
                  <div className={styles.contentItem2Child} key={2}>
                    <CrossBigIconSmall className={styles.item2Icon} />
                    <div className={classnames(styles.mailCont, styles.mailCont2)}>
                      {emailNameToIcon[info.expandMailInfos[0].emailName] || <KaifaxinSvg />}
                      <span className={styles.emailName}>{info.expandMailInfos[0].emailName}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          }
          return (
            <div className={styles.contentItem}>
              <CrossBigIcon />
              <div className={styles.mailCont}>
                {emailNameToIcon[info.emailName] || <KaifaxinSvg />}
                <span className={styles.emailName}>{info.emailName}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPrevAndNextComp = (plan: CHostingPlanModel) => {
    const { hasPrev, hasNext } = showPrevAndNext(plan.total, plan.current);
    return (
      <>
        {hasPrev && (
          <span
            onClick={() => {
              handlePrevAndNext('prev', plan.planId);
            }}
            className={`${styles.dIcon} ${styles.prevIcon}`}
          >
            <PrevSvg style={{ marginRight: '2px' }} />
          </span>
        )}
        {hasNext && (
          <span
            onClick={() => {
              handlePrevAndNext('next', plan.planId);
            }}
            className={`${styles.dIcon} ${styles.nextIcon}`}
          >
            <NextSvg style={{ marginLeft: '2px' }} />
          </span>
        )}
      </>
    );
  };

  const renderDelModalComp = () => {
    return (
      <Modal
        zIndex={800}
        visible={showModal}
        getContainer={false}
        width={400}
        className={styles.selectModal}
        title={
          <div className={styles.infoTitle}>
            <DelIconSvg style={{ marginRight: '6px' }} />
            {getIn18Text('SHANCHUYINGXIAOFANGAN')}
          </div>
        }
        maskClosable={false}
        destroyOnClose={true}
        footer={null}
        onCancel={() => {
          setShowModal(false);
        }}
      >
        <div className={styles.infoContent}>{getIn18Text('SHANCHUHOUBUKEHUIFU')}</div>
        <div className={styles.btnGroup}>
          <button
            className={styles.cancelBtn}
            onClick={() => {
              setShowModal(false);
            }}
          >
            {getIn18Text('setting_system_switch_cancel')}
          </button>
          <button className={styles.submitBtn} onClick={deletePlan}>
            {'删除'}
          </button>
        </div>
      </Modal>
    );
  };

  const getColorConfig = (planId: string) => {
    return systemIdToStyle[planId] || systemIdToStyle['-1'];
  };

  const handleHostingPlans = () => {
    const cPlans = hostingPlans.map(plan => {
      return { ...plan, total: plan.mailInfos.length, current: 0 };
    });
    setCHostingPlans(cPlans.filter(item => item.planId !== '4'));
    setCHostingPlanAuto((cPlans.find(item => item.planId === '4') || {}) as CHostingPlanModel);
  };

  const clickBestPractice = () => {
    openHelpCenter('/d/1663094862923243522.html');
  };

  const clickOperatingManual = () => {
    openHelpCenter('/d/1641339855990423553.html');
  };

  useEffect(() => {
    if (hostingPlans.length > 0) {
      handleHostingPlans();
    }
  }, [hostingPlans]);

  return (
    <>
      <div className={styles.AiHostingPlans}>
        <Row gutter={16}>
          <Col span={24} className={styles.aiHostingTitle}>
            <Popover1>
              {getIn18Text('YINGXIAOTUOGUANRENWU')}
              <span className={styles.aiHostingDesc}>{getIn18Text('SHOUDONGTIANJIAMUBIAOKE')}</span>
              <div className={styles.aiHostingTips}>
                <div style={{ cursor: 'pointer' }} className={styles.tipsItem} onClick={clickBestPractice}>
                  <BestPractice />
                  <div className={styles.tipsItemDesc}>最佳实践</div>
                </div>
                <div style={{ cursor: 'pointer' }} className={styles.tipsItem} onClick={clickOperatingManual}>
                  <OperatingManual />
                  <div className={styles.tipsItemDesc}>操作手册</div>
                </div>
                <div style={{ cursor: 'pointer' }} className={styles.tipsItem} onClick={() => showVideoDrawer(videoDrawerConfig)}>
                  <AiHostingVideo />
                  <div className={styles.tipsItemDesc}>{getIn18Text('CHANPINXUEYUAN')}</div>
                </div>
                <div className={styles.tipsItem}>
                  <QuestionIcon />
                  <div style={{ color: '#7088FF' }} className={styles.tipsItemDesc}>
                    如何能用好营销托管？
                  </div>
                </div>
              </div>
            </Popover1>
          </Col>
          {cHostingPlans.map(plan => {
            return (
              <Col span={12}>
                <div
                  className={styles.AiHostingPlanHeader}
                  style={{
                    background: `linear-gradient(90.51deg, ${getColorConfig(plan.planId)?.linearFrom} 22.01%, ${getColorConfig(plan.planId)?.linearTo} 65.46%)`,
                  }}
                ></div>
                <div
                  className={styles.AiHostingPlan}
                  onClick={() => changeStatus(plan)}
                  // onMouseOver={() => {
                  //   showCheckIcon(plan.planId, true);
                  // }}
                  // onMouseOut={() => {
                  //   showCheckIcon(plan.planId, false);
                  // }}
                >
                  {renderHeaderComp(plan)}
                  {renderContentComp(plan)}
                  {/* `checkIcon_${plan.planId}` */}
                  <div className={classnames(styles.checkIcon)}>
                    {plan.type === 1 && renderOperationComp(plan)}
                    {/* {planIds.includes(plan.planId) ? <RegularCheckSvg className={styles.checkSvg} /> : <RegularUncheckSvg className={styles.checkSvg} />} */}
                  </div>
                </div>
                {renderPrevAndNextComp(plan)}
              </Col>
            );
          })}
          {renderAddPlanComp()}
          {!sendFlow && !notEnterNew && cHostingPlanAuto?.planId ? (
            <>
              <Col span={24} className={styles.aiHostingTitle}>
                {getIn18Text('ZIDONGHUOKERENWU')}
                <span className={styles.aiHostingDesc}>
                  {getIn18Text('ZIDONGWAJUEMUBIAOKE')}
                  {cHostingPlanAuto.existCount || 0}/{cHostingPlanAuto.limitCount || 3}）
                </span>
              </Col>
              <Col span={24}>
                <div className={classnames(styles.AiHostingPlan, styles.aiHostingPlanAuto)} onClick={() => changeStatus(cHostingPlanAuto)}>
                  {renderHeaderComp(cHostingPlanAuto)}
                  {renderAutoContentComp(cHostingPlanAuto)}
                </div>
              </Col>
            </>
          ) : (
            <></>
          )}
        </Row>
      </div>
      {customVisible && (
        <CustomPlanDrawer
          visible={customVisible}
          taskId={taskId || ''}
          hostingPlan={sHostingPlan}
          closeDrawer={(refresh?: boolean) => {
            setCustomVisible(false);
            refresh && refreshPlans();
          }}
        />
      )}
      {renderDelModalComp()}
    </>
  );
});
export default AiHostingPlans;
