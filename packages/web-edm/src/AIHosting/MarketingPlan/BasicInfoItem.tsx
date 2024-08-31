import React, { useState, useEffect, useImperativeHandle } from 'react';
import style from './BasicInfoItem.module.scss';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import { HostingMailInfo, HostingPlanModel, HostingMailInfoModel } from 'api';
import TongyongJianTouYou from '@web-common/images/newIcon/tongyong_jiantou_you';
import UseMultiSvg from '@/images/icons/edm/yingxiao/multi-ti.svg';
import emptyMailIcon from '@/images/icons/edm/yingxiao/hosting-empty-mail.svg';
import classnames from 'classnames';

import TimeZero from '@/images/icons/edm/yingxiao/mail-basic-time-zero.svg';
import TimeOne from '@/images/icons/edm/yingxiao/mail-basic-time-one.svg';
import TimeTwo from '@/images/icons/edm/yingxiao/mail-basic-time-two.svg';
import Timethree from '@/images/icons/edm/yingxiao/mail-basic-time-three.svg';
import { ReactComponent as AddMailIcon } from '@/images/icons/edm/yingxiao/hosting-add-mail-icon.svg';

import CircleIcon from '@/images/icons/edm/yingxiao/hosting-sep-line-target.svg';

import { systemIdToStyle, systemRoundToStyle } from '../AiHostingPlans';
import { getIn18Text } from 'api';

export interface ItemProps {
  width?: number;
  key?: number;
  mailInfo?: HostingMailInfo;
  planInfo?: Partial<HostingPlanModel>;
  onPreview?: (mailInfo?: HostingMailInfo) => void;
  onEdit?: (mailInfo?: HostingMailInfo) => void;
}

export const TimeIconMap: Record<number, any> = {
  0: TimeZero,
  1: TimeOne,
  2: TimeTwo,
  3: Timethree,
};

export const BasicInfoItem = (props: ItemProps) => {
  const { width = 208, mailInfo, planInfo, onPreview, onEdit } = props;

  const getPlanStyleConfig = (planId?: string) => {
    if (!planId) {
      return systemIdToStyle['-1'];
    }
    return systemIdToStyle[planId] || systemIdToStyle['-1'];
  };

  // const getRoundStyleConfig = (index: number) => {
  //   const tLen = Object.keys(systemRoundToStyle).length;
  //   const remainder = index % tLen || tLen;
  //   return systemRoundToStyle[remainder];
  // };

  const HeaderComp = (expand: boolean) => {
    let plan: Partial<HostingMailInfoModel> = getCurPlan(expand);
    let cfg = getPlanStyleConfig(planInfo?.planId);
    return (
      <div className={style.header}>
        <div className={style.headerArea} style={{ backgroundColor: cfg.colorItem }}>
          {plan?.emailName}
        </div>
      </div>
    );
  };

  const TopColorComp = () => {
    let planId = planInfo?.planId || '0';
    let cfg = getPlanStyleConfig(planId);
    return <div className={style.topColor} style={{ background: `linear-gradient(90.51deg, ${cfg.linearFrom} 22.01%, ${cfg.linearTo} 65.46%)` }}></div>;
  };

  const FooterComp = (expand: boolean) => {
    let body = getCurMailInfo(expand)?.contentEditInfo?.emailContent || '';
    const subject = getCurMailInfo(expand)?.contentEditInfo?.subject || '';
    if (body.length === 0) {
      return (
        <div
          className={style.addFooter}
          onClick={() => {
            onEdit && onEdit(getCurMailInfo(expand));
          }}
        >
          <AddMailIcon />
          编辑邮件内容
        </div>
      );
    }

    return (
      <div className={style.footer}>
        <span className={style.mailContent}>{subject}</span>
        <span
          className={style.button}
          onClick={() => {
            onPreview && onPreview(getCurMailInfo(expand));
          }}
        >
          {getIn18Text('CHAKAN/XIUGAI')}
          <TongyongJianTouYou fill={'#6F7485'} />
        </span>
      </div>
    );
  };

  const hasMultiVersion = (expand: boolean) => {
    let info = getCurMailInfo(expand);
    if (info?.plan) {
      return info.plan.aiOn;
    }
    // if (!info?.plan && (info?.multipleContentInfo?.emailContentId?.length || 0 > 0)) {
    //   return true;
    // }
    return false;
  };

  const UseMultiVersionComp = (expand: boolean) => {
    if (!hasMultiVersion(expand)) {
      return undefined;
    }
    return (
      <Tooltip title={'已开启千邮千面'}>
        <img src={UseMultiSvg} className={style.useMulti} />
      </Tooltip>
    );
  };
  const UseMultiVersionShadowComp = (expand: boolean) => {
    if (!hasMultiVersion(expand)) {
      return undefined;
    }
    return <div className={style.multiShadow}></div>;
  };

  const RoundMailSelectComp = (expand: boolean) => {
    let plan: Partial<HostingMailInfoModel> = getCurPlan(expand);
    let hasExpand = (mailInfo?.expandHostingMailInfos?.length || 0) > 0;
    if (!hasExpand) {
      return undefined;
    }

    const round = mailInfo?.roundIndex || 1;
    const curRound = round - 1;
    // const cfg = getRoundStyleConfig(curRound);
    return (
      <div
        className={classnames(style.roundMailSelect, expand ? style.roundMailSelectExpand : style.roundMailSelectExpandNo)}
        // style={{ background: cfg.background, color: cfg.color }}
      >
        {plan.mailType === 1 ? `第${curRound}轮打开未回复` : `第${curRound}轮未打开`}
      </div>
    );
  };

  const BasicBodyComp = (expand: boolean) => {
    return (
      <div className={classnames(style.basicItem)}>
        {HeaderComp(expand)}
        {FooterComp(expand)}
        {UseMultiVersionComp(expand)}
      </div>
    );
  };

  const BasicFooterComp = (expand: boolean) => {
    let plan: Partial<HostingMailInfoModel> = getCurPlan(expand);
    return (
      <Tooltip title={plan?.emailDesc}>
        <div className={style.footerArea}>{plan?.emailDesc}</div>
      </Tooltip>
    );
  };

  const getCurMailInfo = (expand?: boolean) => {
    let resp = mailInfo;
    if (expand && resp?.expandHostingMailInfos) {
      resp = resp.expandHostingMailInfos[0];
    }
    return resp;
  };

  const getCurPlan = (expand?: boolean): Partial<HostingMailInfoModel> => {
    let plan: Partial<HostingMailInfoModel> = {};
    let index = (mailInfo?.roundIndex || 1) - 1;

    if (planInfo?.mailInfos) {
      plan = planInfo?.mailInfos[index];
      if (expand && (plan.expandMailInfos?.length || 0) > 0) {
        plan = plan.expandMailInfos![0];
      }
    }
    return plan;
  };

  const SepTimeComp = () => {
    let index = (mailInfo?.roundIndex || 1) - 1;
    let plan: Partial<HostingMailInfoModel> = {};
    if (planInfo?.mailInfos) {
      plan = planInfo?.mailInfos[index];
    }
    let timeIcon = TimeIconMap[index] || TimeZero;
    var sendDay = 0;
    if ((planInfo?.rule?.timeInterval.length || 0) >= index) {
      sendDay = planInfo?.rule?.timeInterval[index] || 0;
    }

    return (
      <div className={style.sendTime}>
        <img src={timeIcon} style={{ width: '14px', height: '14px' }} />
        {sendDay > 0 && <span className={style.timeTitle}>间隔{sendDay}天以上</span>}
      </div>
    );
  };

  const ItemHeaderComp = () => {
    let roundIndex = mailInfo?.roundIndex || 1;
    let hasExpand = (mailInfo?.expandHostingMailInfos?.length || 0) > 0;
    return (
      <div className={style.roundInfo}>
        <div className={style.roundName}>
          <span className={style.roundIndex}>{roundIndex}</span>
          <span>第{roundIndex}轮</span>
        </div>
        {roundIndex > 1 && SepLineComp(hasExpand)}
      </div>
    );
  };

  const SepLineComp = (hasExpand: boolean) => {
    let hasExpandPlan = (getCurPlan().expandMailInfos?.length || 0) > 0;
    return (
      <div className={style.sepLine}>
        <img src={CircleIcon} />
        <div className={style.line}></div>
        {hasExpand ? (
          <>
            <div className={style.hLine}></div>
            <div className={style.bottomCircle}>
              <img src={CircleIcon} style={{ marginLeft: '-4px' }} />
              <img src={CircleIcon} style={{ marginRight: '-4px' }} />
            </div>
          </>
        ) : (
          <></>
        )}
        {RoundMailSelectComp(false)}
        {hasExpandPlan && RoundMailSelectComp(true)}
      </div>
    );
  };

  const isLastRound = () => {
    return mailInfo?.roundIndex === planInfo?.mailInfos?.length;
  };

  const FooterSepLineComp = () => {
    let hasExpand = (mailInfo?.expandHostingMailInfos?.length || 0) > 0;

    if (!hasExpand) {
      return (
        <div className={style.footerSepLine}>
          <img src={CircleIcon} style={{ marginTop: '-4px' }} />
          <div className={style.line}></div>
        </div>
      );
    }
    return (
      <div className={style.footerSepLine}>
        <div className={style.topCircle}>
          <img src={CircleIcon} style={{ marginLeft: '-4px' }} />
          <img src={CircleIcon} style={{ marginRight: '-4px' }} />
        </div>
        <div className={style.hLine}></div>
        <img src={CircleIcon} style={{ marginTop: '-4px' }} />
        <div className={style.line}></div>
      </div>
    );
  };

  const ItemBodyComp = () => {
    let hasExpandPlan = (getCurPlan().expandMailInfos?.length || 0) > 0;
    return (
      <div className={style.plans}>
        {SingleItemComp(false)}
        {hasExpandPlan && SingleItemComp(true)}
      </div>
    );
    // return <div></div>;
  };

  const SingleItemComp = (expand: boolean) => {
    return (
      <div className={style.item}>
        <div className={style.bodyArea}>
          {TopColorComp()}
          {BasicBodyComp(expand)}
        </div>
        {BasicFooterComp(expand)}
        {UseMultiVersionShadowComp(expand)}
      </div>
    );
  };

  return (
    <div className={style.root}>
      {ItemHeaderComp()}
      {ItemBodyComp()}
      {!isLastRound() && FooterSepLineComp()}
      {!isLastRound() && SepTimeComp()}
    </div>
  );
};
