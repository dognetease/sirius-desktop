import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { Checkbox, Button } from 'antd';
import { useLocalStorage } from 'react-use';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { apiHolder, api, apis, InsertWhatsAppApi, FacebookApi, FbBindStatus, DataStoreApi } from 'api';
import { whatsAppTracker } from '@/components/Layout/SNS/tracker';
import { OffsiteModal } from '@web/components/Layout/SNS/Facebook/components/offsiteModal';
import { AccManageModal } from '@web/components/Layout/SNS/Facebook/components/accManageModal';
import { useAppSelector, useActions } from '@web-common/state/createStore';
import { FacebookActions } from '@web-common/state/reducer';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as Error } from '@/images/icons/alert/error.svg';
import { ReactComponent as Info } from '@/images/icons/edm/info-blue-fill.svg';
import { ReactComponent as Warning } from '@/images/icons/alert/warn.svg';
import { ReactComponent as Success } from '@/images/icons/alert/success.svg';
import useCountDown from '@web-common/hooks/useCountDown';

import style from '@/components/Layout/SNS/snsIndex.module.scss';

import WhatsAppAd, { renderMap as WhastAppAdRenderMap, Keys as WhatsAppAdKeys } from '@/components/Layout/SNS/WhatsApp/components/ad';

const systemApi = apiHolder.api.getSystemApi();
const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
const WhatsAppAgreementCheckedKey = `WhatsAppAgreementChecked-${systemApi.getCurrentUser()?.accountName}`;
const WhatsAppAdCheckedKey = `WhatsAppAdChecked-${systemApi.getCurrentUser()?.accountName}`;
const facebookApi = apiHolder.api.requireLogicalApi(apis.facebookApiImpl) as unknown as FacebookApi;
const AuthorizeKey = `AuthorizeCode-${systemApi.getCurrentUser()?.accountName}`;
const storeApi: DataStoreApi = apiHolder.api.getDataStoreApi();

interface Props {
  page?: WhatsAppAdKeys;
  children?: null | JSX.Element;
}
let timer: number | null = null;
const iconMap = {
  [FbBindStatus.BIND_FAILED]: <Error />,
  [FbBindStatus.USER_CANCEL]: <Warning />,
  [FbBindStatus.NO_ALL_PERMISSIONS]: <Info />,
  [FbBindStatus.NO_OPERATE]: <Info />,
  [FbBindStatus.BIND_SUCCESS]: <Success />,
};
const SNSContainer = (props: Props) => {
  const [adChecked, setAdChecked] = useLocalStorage(WhatsAppAdCheckedKey, false); // 广告展示
  const [proxyWarningVisible, setProxyWarningVisible] = useState<boolean>(false);
  const [proxyChecking, setProxyChecking] = useState<boolean>(false);

  const [agreementVisible, setAgreementVisible] = useState<boolean>(false);
  const [agreementChecked, setAgreementChecked] = useState<boolean>(false);
  const { setFacebookModalShow, updateOAuth, freshFacebookPages } = useActions(FacebookActions);
  const { offsiteModalShow, accModalShow, source, fresh } = useAppSelector(state => state.facebookReducer);
  const [offsiteLoading, setOffsiteLoading] = useState<boolean>(false);
  const fbToast = useRef<string>('');

  const [isStart, allOptions, setEndTime] = useCountDown({
    format: '',
    diff: 1000,
    onHand: true,
    onEnd: () => {
      window.clearInterval(timer!);
      setFacebookModalShow({ offsiteModal: false });
      updateOAuth({ authorizedLoading: false });
      setOffsiteLoading(false);
      if (fbToast.current === '') return;
      message.open({
        className: style.toast,
        icon: iconMap[fbToast.current as FbBindStatus],
        content: fbToast.current,
      });
    },
  });
  const checkIsProxy = () => {
    return Promise.resolve(); // 1130 版本去掉代理检测
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.src = `https://www.google.com/favicon.ico?t=${Date.now()}`;

      img.onload = resolve;

      img.onerror = reject;

      setTimeout(reject, 3000);
    });
  };

  // 查询是否下过订单
  const checkIsPurchased = () => {
    insertWhatsAppApi.queryBindStatus().then(data => {
      if (['TRY', 'UNREGISTERED', 'PURCHASED', 'REGISTERED', 'VERIFIED'].includes(data.orgStatus)) {
        setAdChecked(true);
      }
    });
  };

  const handleProxyCheck = () => {
    setProxyChecking(true);

    checkIsProxy()
      .then(() => {
        setProxyWarningVisible(false);

        if (!localStorage.getItem(WhatsAppAgreementCheckedKey)) {
          setAgreementVisible(true);
        }

        whatsAppTracker.trackProxyCheck(1);
      })
      .catch(() => {
        setProxyWarningVisible(true);

        whatsAppTracker.trackProxyCheck(0);
      })
      .finally(() => {
        setProxyChecking(false);
      });
  };

  useLayoutEffect(() => {
    handleProxyCheck();
    checkIsPurchased();
  }, []);

  const goAuthorize = () => {
    try {
      updateOAuth({ authorizedLoading: true });
      setOffsiteLoading(true);
      facebookApi
        .getAuthorizeUrl()
        .then(res => {
          const { loginUrl, checkCode } = res || {};
          window.open(loginUrl, '_blank');
          return checkCode;
        })
        .then(checkCode => {
          // if (source === 'accManage') {
          //     setOffsiteLoading(false)
          //     setFacebookModalShow({ offsiteModal: false })
          // }
          if (source == 'authPage' || source == 'table' || source === 'accManage') {
            setEndTime(Date.now() + 60 * 1000);

            timer = window.setInterval(() => {
              facebookApi.checkBindStatus({ checkCode }).then(res => {
                const { isSuccess, bindStatus } = res;
                fbToast.current = bindStatus;
                if (isSuccess) {
                  updateOAuth({ isAuthorized: true });
                  storeApi.put(AuthorizeKey, 'true');
                }
                if (bindStatus !== FbBindStatus.NO_OPERATE) {
                  // 结束倒计时
                  setEndTime(undefined);
                  updateOAuth({ authorizedLoading: false });
                  setOffsiteLoading(false);
                  freshFacebookPages({ fresh: !fresh });
                  source === 'accManage' && setFacebookModalShow({ offsiteModal: false });
                }
              });
            }, 2000);
          }
        });
    } catch (error) {
      message.error({ content: 'Facebook账号授权失败，请重试' });
      // 结束倒计时
      setEndTime(undefined);
      updateOAuth({ authorizedLoading: false });
      setOffsiteLoading(false);
    }
  };

  const checkIsAuthorized = () => {
    try {
      facebookApi.getBondAccount({ pageNumber: 1, pageSize: 10 }).then(res => {
        const { results = [] } = res;
        updateOAuth({ isAuthorized: !!results.length });
      });
    } catch (error) {
      console.log('error', error);
    }
  };

  useEffect(() => {
    const FbPage = storeApi.getSync(AuthorizeKey);
    const { data, suc } = FbPage;
    if (suc && data === 'true') {
      updateOAuth({ isAuthorized: true });
    } else checkIsAuthorized();
  }, []);

  const handleCancel = () => {
    fbToast.current = '';
    setEndTime(undefined);
    setFacebookModalShow({ offsiteModal: false });
  };

  // 默认给用户展示广告
  if (!adChecked && props.page && WhastAppAdRenderMap.hasOwnProperty(props.page)) {
    return <WhatsAppAd comp={WhastAppAdRenderMap[props.page as WhatsAppAdKeys]} setChecked={() => setAdChecked(true)} />;
  }

  return (
    <>
      {props.children}
      {/** web版弹出时无法进行其他操作，暂时隐藏 */}
      {/*<Modal
                className={style.proxyWarningModal}
                visible={proxyWarningVisible}
                width={430}
                title="系统检测：IP 地址异常"
                onOk={handleProxyCheck}
                okText="再次检测"
                keyboard={false}
                maskClosable={false}
                okButtonProps={{ loading: proxyChecking }}
                cancelButtonProps={{ style: { display: 'none' } }}
            >
                网络连接异常，请您在合法的海外网络连接环境下访问此服务
            </Modal>*/}
      <Modal
        className={style.agreementModal}
        visible={agreementVisible}
        title="服务使用规则及免责声明"
        width={560}
        keyboard={false}
        maskClosable={false}
        footer={
          <div className={style.agreementModalFooter}>
            <Checkbox style={{ fontSize: 12 }} checked={agreementChecked} onChange={event => setAgreementChecked(event.target.checked)}>
              我已阅读并确认《服务使用规则及免责声明》，不再提醒
            </Checkbox>
            <Button
              type="primary"
              disabled={!agreementChecked}
              onClick={() => {
                setAgreementVisible(false);
                localStorage.setItem(WhatsAppAgreementCheckedKey, '1');
              }}
            >
              同意协议并继续
            </Button>
          </div>
        }
      >
        <p>
          尊敬的用户，在使用网易外贸通社媒营销功能/服务（下称“本服务”）前，请先阅读《网易外贸通服务条款》及下列使用规则，在接受并同意全部内容后开始使用本服务；如有任何违反，您需要对自己的行为承担全部法律责任，我们不对您的任何行为负责：
        </p>
        <ul>
          <li>不得使用非法网络连接方式使用本服务；</li>
          <li>不得违反国家法律法规，不得侵犯其他用户及任何第三方的合法权益；</li>
          <li>不得使用本服务发布、传播、销售中国法律及其他可适用法律禁止的内容；</li>
          <li>不得绕过/破坏服务的保护和限制措施使用本服务；</li>
          <li>不得通过转让、出租、共享等方式向第三方提供本服务。</li>
        </ul>
        <p>
          若您违反
          <a href="https://qiye.163.com/sirius/agreement_waimao/index.html" target="_blank">
            《网易外贸通服务条款》
          </a>
          及上述规则，我们有权采取措施（包括但不限于终止或限制您对本服务的使用），且不退还任何费用。因您的行为造成我们或关联公司损失的，您应承担全部赔偿责任。
        </p>
      </Modal>
      <OffsiteModal visible={offsiteModalShow} onCancel={handleCancel} onOk={goAuthorize} loading={offsiteLoading} />
      <AccManageModal visible={accModalShow} onCancel={() => setFacebookModalShow({ accModal: false })} />
    </>
  );
};

export default SNSContainer;
