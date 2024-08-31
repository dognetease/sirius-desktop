import { HostingMailInfo, HostingMailInfoModel, getIn18Text } from 'api';
import React, { useEffect, useRef, useState } from 'react';
import { HostingInfo } from 'api';
import lodashGet from 'lodash/get';
import style from './basic.module.scss';
import Tooltip from '@web-common/components/UI/Tooltip';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import { BasicInput } from '../AiHostingEdit';
import { Action } from '../DataView/Header';
import { SwitchButton } from '../../components/SwitchButton';
import editButton from '@/images/icons/edm/edm-common-edit.svg';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import TimeZero from '@/images/icons/edm/yingxiao/mail-basic-time-zero.svg';
import debounce from 'lodash/debounce';
import { edmDataTracker } from '../../tracker/tracker';
import { ReactComponent as KaifaxinSvg } from '@/images/icons/edm/yingxiao/regular-mail-kaifaxin.svg';
import { ReactComponent as NextSvg } from '@/images/icons/edm/yingxiao/regular-next.svg';
import { ReactComponent as PrevSvg } from '@/images/icons/edm/yingxiao/regular-prev.svg';

import { ReactComponent as HostingDetailExpand } from '@/images/icons/edm/yingxiao/hosting-detail-expand.svg';

import { ReactComponent as RepeatSvg } from '@/images/icons/edm/yingxiao/edm-round-repeat.svg';
import { emailNameToIcon } from '../../AIHosting/AiHostingPlans';
import { EDMAPI } from '../../utils';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import moment from 'moment';

export interface Props {
  info?: BasicInput;
  planInfo?: HostingInfo;
  onChangeState?: (open: boolean) => void;
  onModify?: (action: Action) => void;
  onAddContact?: () => void;
  onClose?: () => void;
  onDelete?: () => void;
}

export const TaskDetailBasicInfo = (props: Props) => {
  const { info, planInfo, onModify, onChangeState, onAddContact, onClose, onDelete } = props;

  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const planRef = useRef<HTMLSpanElement>(null);
  const parentRef = useRef<HTMLSpanElement>(null);

  let autoMining = info?.planMode === 1;

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    let resizeObserver: ResizeObserver | null = null;

    timeout = setTimeout(() => {
      if (parentRef.current && planRef.current) {
        resizeObserver = new ResizeObserver(
          debounce(() => {
            if (parentRef.current && planRef.current) {
              setShowScrollArrow(planRef.current.scrollWidth > planRef.current.clientWidth);
              onPlanScroll();
            }
          }, 300)
        );

        resizeObserver.observe(parentRef.current);
      }
    });

    return () => {
      timeout && clearTimeout(timeout);
      resizeObserver && resizeObserver.disconnect();
    };
  }, [planInfo]);

  useEffect(() => {}, []);

  const deletePlan = () => {
    onDelete && onDelete();
  };

  const HeaderComp = () => {
    return (
      <div className={style.header}>
        <div className={style.left}>
          <SwitchButton
            checked={planInfo?.planInfo?.status === 1 ? true : false}
            onChange={open => {
              onChangeState && onChangeState(open);
            }}
          ></SwitchButton>
          <div className={style.title}>{info?.name}</div>
          {autoMining && info?.planMode === 1 && <Tag type="label-1-1">{getIn18Text('ZIDONGHUOKE')}</Tag>}
        </div>
        <div className={style.right}>
          <Button
            btnType="minorLine"
            onClick={() => {
              deletePlan();
            }}
          >
            删除任务
          </Button>
          {/* 非自动获客任务可展示【添加联系人】按钮 */}
          {(!autoMining || info?.planMode !== 1) && (
            <Button
              btnType="primary"
              style={{ marginLeft: '8px' }}
              onClick={() => {
                onAddContact && onAddContact();
              }}
            >
              {getIn18Text('TIANJIALIANXIREN')}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const SectionGapComp = () => {
    return <div style={{ height: '16px' }}></div>;
  };

  const BasicInfoComp = () => {
    const item = (title: string, value?: string) => {
      return (
        <div className={style.item}>
          {title}：{value}
        </div>
      );
    };

    let sortedPosotions = info?.ruleInfo?.positionInfos?.map(i => {
      return i.positionName;
    });
    let sendTimeString = info?.ruleInfo?.sendingDate.length === 7 ? '全周' : '工作日';
    let from = info?.ruleInfo?.timeDuration?.from || 0;
    const fromStr = moment({ hour: from }).format('HH:mm');

    let end = info?.ruleInfo?.timeDuration?.to || 0;
    const endStr = moment({ hour: end }).format('HH:mm');

    sendTimeString = `${sendTimeString} ${fromStr}-${endStr} （北京时间东八区）`;

    const firstSenderEmail = lodashGet(info, 'senderEmails.0.email', '');
    const firstSenderEmailState = lodashGet(info, 'senderEmails.0.state', 1);
    const notOnlyOneSenderEmail = info?.senderEmails && info.senderEmails.length > 1;
    const senderEmailStr = notOnlyOneSenderEmail ? info?.senderEmails!.map(item => item.email + (item.state === 0 ? '（已失效）' : '')).join(', ') : [];

    return (
      <div className={style.basicInfo}>
        <div className={style.commonHeader}>
          <div className={style.title}>{getIn18Text('JIBENXINXI')}</div>
          <div className={style.modify}>
            <img src={editButton} />
            <div
              className={style.text}
              onClick={() => {
                edmDataTracker.track('pc_marketing_edm_host_taskDetail', {
                  action: 'taskEdit',
                });
                onModify &&
                  onModify({
                    type: 'baseInfo',
                    planId: '',
                    taskId: '',
                    operateType: -1,
                    planMode: info?.planMode,
                  });
              }}
            >
              {getIn18Text('XIUGAIJICHUXINXI')}
            </div>
          </div>
        </div>
        <div className={style.body}>
          {autoMining && item(getIn18Text('ZHUYINGCHANPIN'), info?.autoRecInfo?.products)}
          {autoMining && item(getIn18Text('MUBIAOKEHU'), info?.autoRecInfo?.customerProducts)}
          {autoMining &&
            info?.autoRecInfo?.customerLocation &&
            Array.isArray(info.autoRecInfo.customerLocation) &&
            item(getIn18Text('GUOJIA/DEQU'), info.autoRecInfo.customerLocation.join(','))}
          {autoMining &&
            info?.autoRecInfo?.customerLocation &&
            typeof info?.autoRecInfo?.customerLocation === 'string' &&
            item(getIn18Text('GUOJIA/DEQU'), info?.autoRecInfo?.customerLocation)}
          {item(getIn18Text('CHUANGJIANSHIJIAN'), info?.createTime)}
          {item(getIn18Text('FAJIANRENNICHENG'), info?.setting?.sender)}
          <div className={style.item}>
            {getIn18Text('FAJIANYOUXIANG')}：{firstSenderEmail}
            {firstSenderEmailState === 0 ? '（已失效）' : ''}
            {notOnlyOneSenderEmail ? (
              <Tooltip autoAdjustOverflow title={senderEmailStr} className={style.itemTooltip} getPopupContainer={node => node.parentNode as HTMLElement}>
                查看全部
              </Tooltip>
            ) : (
              <></>
            )}
          </div>
          {item(getIn18Text('HUIFUYOUXIANG'), info?.setting?.replyEmail)}
          {item('职位优先级', sortedPosotions?.join(','))}
          {item('每日发信上限', info?.ruleInfo?.sendLimit?.toString())}
          {item('发送时间', sendTimeString)}
        </div>
      </div>
    );
  };

  const PlanCycleInfoComp = () => {
    return (
      <div className={style.planCycle}>
        <div className={style.commonHeader}>
          <div className={style.title}>{getIn18Text('YINGXIAOFANGAN')}</div>
          <div className={style.modify}>
            <img src={editButton} />
            <div
              className={style.text}
              onClick={() => {
                edmDataTracker.track('pc_marketing_edm_host_taskDetail', {
                  action: 'taskEdit',
                });
                onModify &&
                  onModify({
                    type: 'submitConfirm',
                    planId: '',
                    taskId: '',
                    operateType: 3,
                    planMode: info?.planMode,
                  });
              }}
            >
              {getIn18Text('BIANJIYINGXIAOXIN')}
            </div>
          </div>
        </div>
        {PlanDetailComp()}
      </div>
    );
  };

  const renderPrevAndNextComp = () => {
    if (!showScrollArrow) {
      return undefined;
    }
    return (
      <>
        {showLeftArrow && (
          <span
            onClick={() => {
              doScroll('left');
            }}
            className={`${style.dIcon} ${style.prevIcon}`}
          >
            <PrevSvg style={{ marginRight: '2px' }} />
          </span>
        )}
        {showRightArrow && (
          <span
            onClick={() => {
              doScroll('right');
            }}
            className={`${style.dIcon} ${style.nextIcon}`}
          >
            <NextSvg style={{ marginLeft: '2px' }} />
          </span>
        )}
      </>
    );
  };

  const onPlanScroll = debounce(() => {
    if (!planRef.current) {
      return;
    }
    if (planRef.current.scrollLeft < 1) {
      setShowLeftArrow(false);
    } else {
      setShowLeftArrow(true);
    }
    if (planRef.current.scrollLeft + planRef.current.clientWidth + 1 > planRef.current.scrollWidth) {
      setShowRightArrow(false);
    } else {
      setShowRightArrow(true);
    }
  }, 300);

  const doScroll = (direction: 'left' | 'right') => {
    let scrollContainer = planRef.current;
    if (direction === 'left') {
      scrollContainer?.scrollBy({ left: -300, behavior: 'smooth' });
    }
    if (direction === 'right') {
      scrollContainer?.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const RepeatSendComp = () => {
    return (
      <div className={style.repeatSend}>
        <div className={style.sep}>
          <div className={style.line} />
          <img src={TimeZero} />
          {'30天以上'}
          <div className={style.line} />
        </div>
        <div className={style.button}>
          <RepeatSvg />
          <span className={style.ellipsis}>{getIn18Text('ZHONGFUFASONG')}</span>
        </div>
      </div>
    );
  };

  const DetailBodyComp = (mailInfo: HostingMailInfoModel) => {
    const BasicComp = (mailInfo?: HostingMailInfoModel) => {
      if (!mailInfo) {
        return undefined;
      }
      let name = mailInfo.emailName;
      return (
        <div className={style.name}>
          <div className={style.container}>{emailNameToIcon[name] || <KaifaxinSvg />}</div>
          <EllipsisTooltip>
            <span className={style.ellipsis}>{mailInfo.emailName}</span>
          </EllipsisTooltip>
        </div>
      );
    };

    if (!mailInfo.expandMailInfos || mailInfo.expandMailInfos.length === 0) {
      return BasicComp(mailInfo);
    }
    return (
      <div className={style.bodyArea} style={{ marginLeft: '-5px' }}>
        <div className={style.expandArea}>
          <div className={style.title}>{mailInfo.mailType === 0 ? '未打开' : '打开未回复'}</div>
          <HostingDetailExpand />
          <div className={style.title}>{mailInfo.expandMailInfos[0].mailType === 0 ? '未打开' : '打开未回复'}</div>
        </div>
        <div className={style.expandInfoArea}>
          {BasicComp(mailInfo)}
          {(mailInfo.expandMailInfos.length || 0) > 0 && BasicComp(mailInfo.expandMailInfos![0])}
        </div>
      </div>
    );
  };

  const PlanDetailComp = () => {
    return (
      <div style={{ position: 'relative' }}>
        {renderPrevAndNextComp()}
        <div className={style.planInfo} ref={planRef} onScroll={onPlanScroll}>
          {planInfo?.planInfo?.mailInfos?.map((item, index) => {
            var sendDay = 0;
            if ((planInfo?.planInfo?.rule?.timeInterval.length || 0) >= index && index > 0) {
              sendDay = planInfo?.planInfo?.rule?.timeInterval[index - 1] || 0;
            }
            return (
              <>
                {index !== 0 && (
                  <div className={style.sep}>
                    <div className={style.line} />
                    <img src={TimeZero} />
                    间隔{sendDay}天以上
                    <div className={style.line} />
                  </div>
                )}
                {DetailBodyComp(item)}
              </>
            );
          })}
          {planInfo?.planInfo?.loopStatus === 1 && RepeatSendComp()}
        </div>
      </div>
    );
  };

  return (
    <div className={style.root} ref={parentRef}>
      {HeaderComp()}
      {BasicInfoComp()}
      {SectionGapComp()}
      {PlanCycleInfoComp()}
      {SectionGapComp()}
    </div>
  );
};
