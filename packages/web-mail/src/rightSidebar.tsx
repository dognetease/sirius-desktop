// 外贸通下，右侧边栏组件提取
/* eslint-disable array-callback-return */
/* eslint-disable max-statements */
import React, { useState, useEffect } from 'react';
// import { Spin } from 'antd';
import { useContactModel } from '@web-common/hooks/useContactModel';
import lodashGet from 'lodash/get';
import { MailSidebar } from '@/components/Layout/Customer/components/sidebar';
import { ClueSidebar } from '@/components/Layout/Customer/components/sidebar/clueSidebar';
import { CommonSidebar } from '@/components/Layout/Customer/components/sidebar/commonSidebar';
// import { DEFAULT_CUSTOMER_WIDTH } from '@web-mail/hooks/useAppScale';
import { PageLoading } from '@/components/UI/Loading';
import { api, EventApi } from 'api';

const eventApi: EventApi = api.getEventApi();

// 当前在读邮件的id
export const CurrentMailIdContext = React.createContext('');

interface RightSiderProps {
  email: string; // 邮箱必传
  name?: string; // 刷新需要的name，如果是空，则刷新的时候会使用email
  _account?: string; // 账号可选
  replyToMail?: string; // 同事侧边栏使用
  id?: string; // 当前在读邮件的id
  noBorder?: boolean;
}

// 右侧边栏组件
const RightSidebar = (props: RightSiderProps) => {
  const { email, _account, name, replyToMail, id, noBorder } = props || {};
  const asideContactModel = useContactModel({ email, _account });
  // 添加loading
  const [loading, setLoading] = useState(false);
  // asideContactModel变化侧边栏loading效果
  useEffect(() => {
    if (!asideContactModel) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [asideContactModel]);

  // 点击右上角帮助触发
  const onClickHelp = () => {
    // 邮件+231222版本，下线右侧边栏新手引导
    // eventApi.sendSysEvent({
    //   eventName: 'mailMenuOper',
    //   eventData: {
    //     email: email,
    //     visible: true,
    //   },
    //   eventStrData: 'newGuideForAside',
    // });
  };
  // 展示客户侧边栏
  const visibleCustomerSide = ['myCustomer', 'colleagueCustomer', 'openSeaCustomer', 'colleagueCustomerNoAuth'].includes(
    lodashGet(asideContactModel, 'customerOrgModel.role', '')
  );
  // 展示线索侧边栏
  const visibleClueSide = ['myClue', 'colleagueClue', 'openSeaClue', 'colleagueClueNoAuth'].includes(lodashGet(asideContactModel, 'customerOrgModel.role', ''));
  return (
    <>
      <CurrentMailIdContext.Provider value={id || ''}>
        <>
          {/* 公海客户需要进入MailSidebar分支，在组件内区分：公海，我的客户，同事的客户 */}
          {visibleCustomerSide || visibleClueSide ? (
            <>
              {visibleCustomerSide ? (
                <MailSidebar
                  noBorder={noBorder}
                  email={email}
                  name={name || ''}
                  onClickHelp={onClickHelp}
                  _account={_account}
                  setLoading={isLoading => {
                    setLoading(isLoading);
                  }}
                />
              ) : (
                <ClueSidebar
                  noBorder={noBorder}
                  email={email}
                  name={name || ''}
                  onClickHelp={onClickHelp}
                  _account={_account}
                  setLoading={isLoading => {
                    setLoading(isLoading);
                  }}
                />
              )}
            </>
          ) : (
            <CommonSidebar
              noBorder={noBorder}
              email={email}
              name={name || ''}
              replyToMail={replyToMail}
              onClickHelp={onClickHelp}
              _account={_account}
              setLoading={isLoading => {
                setLoading(isLoading);
              }}
            />
          )}
          {loading ? <PageLoading /> : null}
        </>
      </CurrentMailIdContext.Provider>
    </>
  );
};

export default RightSidebar;
