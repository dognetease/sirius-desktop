import React, { useEffect, useState, useRef } from 'react';
import { PageProps } from 'gatsby';
import { apiHolder as api, apis, util as apiUtil, wait, SystemApi, MailConfApi, locationHelper } from 'api';
import ReadMailWindow from '@web-mail/components/ReadMailWindow/ReadMailWinow';
// import { isTreeNode } from '@web-mail/common/tree/rc-tree/src/util';
// import { MailBoxIcon } from '@web-common/components/UI/Icons/icons';
import { getParameterByName } from '@web-common/utils/utils';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import SiriusLayout from '@/layouts';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import '@/styles/global.scss';
import { tabType } from '@web-common/state/reducer/mailTabReducer';
import { message } from 'antd';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import UniDrawerWrapper from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import { getIn18Text } from 'api';
import { assingUnitableApiMethods } from '@web-unitable-crm/penpal-bridge/l2c-bridge';

const eventApi = api.api.getEventApi();

const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
// 读信独立页，用到了l2c-crm模块，因此需要在这里引入
locationHelper.isReadMail() && assingUnitableApiMethods({});

const isMac = inElectron ? window.electronLib.env.isMac : api.env.isMac;

const ReadMailPage: React.FC<PageProps> = props => {
  const { location } = props;
  const [from, setFrom] = useState('');
  const [mailId, setMailId] = useState(() => getParameterByName('id', location.search) || '');
  // 记录消息
  const [msgDate, setMsgDate] = useState<string>();
  const mailAccount = useRef(getParameterByName('account', location.search) || '');
  // uni 客户弹窗
  const [uniCustomerParam, setUniCustomerParam] = useState2RM('uniCustomerParam');

  // 是否点击页签触发的,默认false
  const [clickTab, setClickTab] = useState(false);
  // 视图模式是否通栏
  const [isLong, setIsLong] = useState(true);
  // 外贸-三方邮件-相关配置
  const tpMailConfig = useRef<{ isTpMail: boolean; owner: string } | null>(
    getParameterByName('isTpMail', location.search) == '1'
      ? {
          isTpMail: !!getParameterByName('isTpMail', location.search),
          owner: getParameterByName('owner', location.search) || '',
        }
      : null
  );
  const edmEmailIdSearch = getParameterByName('edmEmailId', location.search) || '';
  const operateIdSearch = getParameterByName('operateId', location.search) || '';
  const bounceIdSearch = getParameterByName('bounceId', location.search) || '';
  const isBouncedSearch = getParameterByName('isBounced', location.search) === 'true';
  // 营销邮件回复邮箱非本账号邮箱
  const edmReplyConfig = useRef<{ edmEmailId: string; operateId?: string; bounceId?: string; isBounced?: boolean } | null>(
    // eslint-disable-next-line no-nested-ternary
    edmEmailIdSearch && operateIdSearch
      ? {
          edmEmailId: edmEmailIdSearch,
          operateId: operateIdSearch,
          isBounced: isBouncedSearch,
        }
      : edmEmailIdSearch && bounceIdSearch
      ? {
          edmEmailId: edmEmailIdSearch,
          bounceId: bounceIdSearch,
          isBounced: isBouncedSearch,
        }
      : null
  );

  // const notifyListToUpdateReadStatus = (curMailId: string) => {
  //   const sendSysEvent = eventApi.sendSysEvent({
  //     eventName: 'mailStatesChanged',
  //     eventData: {
  //       mark: true,
  //       id: curMailId,
  //       type: 'read',
  //       // isThread: isThread,
  //       hideMessage: true,
  //     },
  //     eventStrData: 'read',
  //   });
  //   return sendSysEvent || Promise.resolve('not send');
  // };
  useEffect(() => {
    // 注册事件
    const id = eventApi.registerSysEventObserver('initPage', {
      func: ev => {
        const curMailId = typeof ev?.eventData === 'string' ? ev?.eventData : ev?.eventData?.id;
        const accountId = typeof ev?.eventData === 'string' ? '' : ev?.eventData?.accountId;
        const isTpMail = typeof ev?.eventData === 'string' ? '' : ev?.eventData?.isTpMail;
        const owner = typeof ev?.eventData === 'string' ? '' : ev?.eventData?.owner;
        const edmEmailId = typeof ev?.eventData === 'string' ? '' : ev?.eventData?.edmEmailId;
        const operateId = typeof ev?.eventData === 'string' ? '' : ev?.eventData?.operateId;
        const bounceId = typeof ev?.eventData === 'string' ? '' : ev?.eventData?.bounceId;
        const isBounced = typeof ev?.eventData === 'string' ? false : ev?.eventData?.isBounced ?? false;
        if (isTpMail) {
          tpMailConfig.current = {
            isTpMail,
            owner,
          };
        } else {
          tpMailConfig.current = null;
        }
        if (edmEmailId && operateId) {
          edmReplyConfig.current = {
            edmEmailId,
            operateId,
            isBounced,
          };
        } else if (edmEmailId && bounceId) {
          edmReplyConfig.current = {
            edmEmailId,
            bounceId,
            isBounced,
          };
        } else {
          edmReplyConfig.current = null;
        }
        // 是否来自推送卡片的点击
        // const _isTrhead = ev?.eventStrData === 'isthread' || idIsTreadMail(curMailId);
        // setIsThread(_isTrhead);
        mailAccount.current = accountId;
        setMailId(curMailId);
        setMsgDate(new Date().getTime() + '');
        // 判断新邮件推送
        const _from = ev?.eventStrData === 'push' ? 'push' : '';
        setFrom(_from);
        // 判断是否是通栏下点击页签触发
        const clickTab = ev?.eventStrData === 'clickTab';
        setClickTab(clickTab);
        // mailApi.doMarkMail(true, ev?.eventData, 'read', false);
        // 不是本地打开 eml 才需要执行下面的逻辑
        // if (!apiUtil.extractPathFromCid(curMailId)) {
        //   const retryGet = async (retry: number) => {
        //     const ret = await notifyListToUpdateReadStatus(curMailId);
        //     if (ret !== '' && retry > 0) {
        //       await wait((
        //         3 - retry
        //       ) * 3000 + 500);
        //       await retryGet(retry - 1);
        //     }
        //   };
        //   retryGet(3).then();
        // }
      },
    });

    return () => {
      eventApi.unregisterSysEventObserver('initPage', id);
    };
  }, []);

  // useEffect(() => {
  //   inWindow() && (
  //     window.document.title = '读信'
  //   );
  // }, []);

  // useEffect(() => {
  //   const mailSwitchId = eventApi.registerSysEventObserver('mailSwitch', () => {
  //     // do nothing just to prevent page crash
  //   });
  //   const errorId = eventApi.registerSysEventObserver('error', () => {
  //     // do nothing just to prevent page crash
  //   });

  //   return () => {
  //     eventApi.unregisterSysEventObserver('mailSwitch', mailSwitchId);
  //     eventApi.unregisterSysEventObserver('error', errorId);
  //   };
  // }, []);

  useCommonErrorEvent('readMailErrorOb');

  // 回到页签
  const backToTabs = () => {
    if (!inElectron) return;
    // 如果点击的时候视图模式不是通栏,则隐藏回到页签按钮
    if (mailConfApi.getMailPageLayout() !== '2') {
      message.error(getIn18Text('mailLayoutChanged'));
      setIsLong(false);
      return;
    }
    // 发送读信页关闭并打开页签事件
    eventApi.sendSysEvent({
      eventName: 'tabsOperation',
      eventStrData: 'doSetTab', // reducer，tab方法名
      eventData: {
        id: mailId,
        title: '',
        type: tabType.read,
        closeable: true,
        isActive: true,
      },
    });
    // 关闭当前窗口
    setTimeout(() => {
      systemApi.closeWindow();
    }, 50);
  };

  // uni中转组件及弹窗组件
  const customerIframe = process.env.BUILD_ISEDM ? (
    <>
      <UniDrawerWrapper
        visible={uniCustomerParam.visible}
        source={uniCustomerParam.source}
        customerData={uniCustomerParam.customerData}
        customerId={uniCustomerParam.customerId}
        onClose={() => {
          if (uniCustomerParam.onClose) {
            uniCustomerParam.onClose();
          }
          setUniCustomerParam({ visible: false, source: uniCustomerParam.source });
        }}
        onSuccess={() => {
          if (uniCustomerParam.onSuccess) {
            uniCustomerParam.onSuccess();
          }
          setUniCustomerParam({ visible: false, source: uniCustomerParam.source });
        }}
      />
    </>
  ) : (
    <></>
  );

  return (
    <SiriusLayout.ContainerLayout isLogin={false}>
      {/* 客户端，点击页签触发的，才展示按钮 */}
      {inElectron && clickTab && isLong && (
        <span
          className="back-to-tabs"
          style={
            isMac
              ? { right: '16px' }
              : {
                  top: 0,
                  right: '136px',
                  lineHeight: '32px',
                }
          }
          onClick={backToTabs}
        >
          {getIn18Text('HUIDAOYEQIAN')}
        </span>
      )}
      <PageContentLayout>
        <ReadMailWindow
          id={mailId}
          from={from}
          mailAccount={mailAccount.current}
          forceUpdate={msgDate}
          tpMailConfig={tpMailConfig.current}
          edmReplyConfig={edmReplyConfig.current}
        />
      </PageContentLayout>
      {customerIframe}
    </SiriusLayout.ContainerLayout>
  );
};

export default ReadMailPage;
