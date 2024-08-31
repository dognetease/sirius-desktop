import { getIn18Text } from 'api';
import { Form, Tooltip } from 'antd';
import {
  // api,
  SnsPlatformName,
  SnsAccountInfoShort,
  SnsMarketingAccount,
  // SnsMarketingApi,
  SnsMarketingPlan,
  SnsTaskStatus,
} from 'api';
import React, { useState } from 'react';
import { uniqBy } from 'lodash';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import { throttle } from 'lodash';

import style from './plan.module.scss';
import AccountsSelect from '../../components/AccountsSelect';
import PlanTipImg from '../../images/plan-tip.png';
import PlatformLogo from '../../components/PlatformLogo';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { getSnsTaskPlanSync } from '@web-common/state/reducer/snsMarketingTaskReducer';
import { snsMarketingTaskActions } from '@web-common/state/reducer';
import { isEmpty } from '../../utils/index';

// const snsMarketingApi = api.requireLogicalApi('snsMarketingApiImpl') as unknown as SnsMarketingApi;

export const MarketingPlan = () => {
  const appDispatch = useAppDispatch();
  const currentTask = useAppSelector(state => state.snsMarketingTaskReducer.currentTask);
  const currentTaskStatus = useAppSelector(state => state.snsMarketingTaskReducer.currentTaskStatus);

  const readonly = currentTaskStatus !== SnsTaskStatus.DRAFT;

  const [name, setName] = useState(currentTask.taskName);
  const [accounts, setAccounts] = useState<SnsAccountInfoShort[]>(currentTask.accounts || []);

  const handleAccountChange = (accounts: SnsMarketingAccount[]) => {
    setAccounts(accounts);
    handleCreatePlan(accounts);
  };

  const handleCreatePlan = throttle((accounts: SnsMarketingAccount[]) => {
    const info = accounts.map(item => ({
      accountId: item.accountId,
      accountType: item.accountType,
      authorizeType: item.authorizeType,
      platform: item.platform,
    }));
    appDispatch(snsMarketingTaskActions.setAccounts(info));
    if (info.length) {
      appDispatch(getSnsTaskPlanSync(info));
    }
  }, 500);

  const hasPlan = !isEmpty(currentTask.plan) && accounts.length > 0;

  return (
    <div className={style.stepWrapper}>
      <div className={style.stepInner}>
        <div style={{ background: '#F6F7FA', borderRadius: '8px', padding: '24px 0 1px', marginBottom: '20px' }}>
          <Form style={{ width: '430px', margin: '0px auto' }}>
            <Form.Item label={getIn18Text('RENWUMINGCHENG')} initialValue={currentTask.taskName}>
              <Input
                placeholder={getIn18Text('QINGSHURURENWUMINGCHENG')}
                onChange={e => setName(e.target.value)}
                defaultValue={currentTask.taskName}
                disabled={readonly}
                size="middle"
                onBlur={() => appDispatch(snsMarketingTaskActions.setTaskName(name))}
                maxLength={50}
              />
            </Form.Item>
            <Form.Item label={getIn18Text('SHEMEIZHUYE')}>
              {readonly && (
                <Tooltip title="">
                  <AccountsSelect maxTagCount="responsive" accounts={accounts as any} onChange={setAccounts} onBlur={handleCreatePlan} disabled={readonly} />
                </Tooltip>
              )}
              {!readonly && (
                <AccountsSelect
                  maxTagCount="responsive"
                  accounts={accounts as any}
                  //onChange={setAccounts}
                  // onBlur={handleCreatePlan}
                  onChange={handleAccountChange}
                  disabled={readonly}
                />
              )}
            </Form.Item>
          </Form>
        </div>

        {!hasPlan && <EmptyPlan />}
        {hasPlan && <PlanContent plan={currentTask.plan!} accounts={accounts} />}
      </div>
    </div>
  );
};

const EmptyBlockContents = [
  {
    title: getIn18Text('BUTONGSHEMEIPINGTAIJING'),
    content: getIn18Text('GENJUFaceb'),
  },
  {
    title: getIn18Text('YIZUIJIASHIJIANPIPEI'),
    content: getIn18Text('YIZHAOGUANFANG/DISAN'),
  },
  {
    title: getIn18Text('ZHIDINGGAOHUDONGLVDE'),
    content: getIn18Text('YIZHAOGUANFANG/DISAN'),
  },
  {
    title: getIn18Text('TIEZINEIRONGZHINENGSHENG'),
    content: getIn18Text('GENJUSUOXUANSHEMEIQU'),
  },
];

export const EmptyPlan = () => (
  <div className={style.emptyPlan}>
    {/* <div>
      <h2>营销方案</h2>
      <p>请选择社媒主页，系统会为您定制营销方案</p>
    </div> */}
    <div className={style.emptyPlanBlocks}>
      {EmptyBlockContents.map(item => (
        <div className={style.emptyPlanBlock}>
          <div className={style.blockLeft}>
            <img src={PlanTipImg} alt="" width="100" height="100" />
          </div>
          <div className={style.blockRight}>
            <div className={style.blockTitle}>{item.title}</div>
            <div className={style.blockContent}>{item.content}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const PlanContent = (props: { plan: SnsMarketingPlan; accounts: SnsAccountInfoShort[] }) => {
  const { plan, accounts } = props;

  const platforms = [...new Set(plan.sendPostRates.map(i => i.platform))];
  const postRates = uniqBy(plan.sendPostRates, 'platform');

  return (
    <div className={style.planContent}>
      <div className={style.planHeader}>
        <h2>{getIn18Text('YINGXIAOFANGAN')}</h2>
        <p>
          {getIn18Text('GENJUNINXUANZEDE')}
          {accounts.length}
          {getIn18Text('GESHEMEIZHUYE，XI')}
        </p>
      </div>
      <div className={style.planBlocks}>
        <div className={style.planBlock}>
          <div className={style.left}>
            <img src={PlanTipImg} width="52" height="52" alt="" />
          </div>
          <div className={style.desc}>
            <h4>{getIn18Text('SHIBIEPINGTAILEIXING')}</h4>
            <div>{getIn18Text('XITONGSHEDINGTUOGUANREN')}</div>
          </div>
          <div className={style.right}>
            <div className={style.platformLogos}>
              {platforms.map(i => (
                <span key={i} className={style.platformWithLogo}>
                  <PlatformLogo type="tiny" platform={i} size={24} key={i} />
                  {SnsPlatformName[i]}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={style.planBlock}>
          <div className={style.left}>
            <img src={PlanTipImg} width="52" height="52" alt="" />
          </div>
          <div className={style.desc}>
            <h4>{getIn18Text('ZONGJIEFATIEZHOUQI')}</h4>
            <div>{getIn18Text('GENJUFaceb')}</div>
          </div>
          <div className={style.right}>{plan.sendPostPeriod}</div>
        </div>

        {postRates.map(item => (
          <div className={style.planBlock} key={item.platform}>
            <div className={style.left}>
              <img src={PlanTipImg} width="52" height="52" alt="" />
            </div>
            <div className={style.desc}>
              <h4>
                {SnsPlatformName[item.platform]}
                {getIn18Text('FATIEPINLV/SHIJIAN')}
              </h4>
              <div>{item.desc}</div>
            </div>
            <div className={style.right}>{item.sendPostRate}</div>
          </div>
        ))}

        <div className={style.planBlock}>
          <div className={style.left}>
            <img src={PlanTipImg} width="52" height="52" alt="" />
          </div>
          <div className={style.desc}>
            <h4>{getIn18Text('GONGXUTIEZISHU')}</h4>
            <div>{getIn18Text('ANZHAOYUZHIDEFATIE')}</div>
          </div>
          <div className={style.right}>{plan.postSendCount}</div>
        </div>
      </div>
    </div>
  );
};
