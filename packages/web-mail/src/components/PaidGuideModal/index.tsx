// 免费版引导下单升级
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AccountApi, apiHolder, apis, getIn18Text, DataTrackerApi, ProductAuthApi, SystemEvent, EventApi, isEdm } from 'api';
// import Button from '@web-common/components/UI/Button/index';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import Tooltip from '@web-common/components/UI/Tooltip/index';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import { ReactComponent as DeleteIcon } from '@/images/icons/modal_close_temp.svg';
import { ReactComponent as Done } from '@/images/icons/disk/done.svg';
import { createNiceModal, useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { handleBackEnd } from '../../util';
import styles from './index.module.scss';
import Toast from '@web-common/components/UI/Message/SiriusMessage';

const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const productAuthApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const eventApi = apiHolder.api.getEventApi() as EventApi;

export const useFreeWriteMailErrorHandler = () => {
  const productVersionId = useRef<string>('others');
  const paidGuideModal = useNiceModal('paidGuide');

  useEffect(() => {
    productAuthApi.doGetProductVersion().then(res => {
      productVersionId.current = res.productVersionId;
    });
  }, []);

  // 免费版，发信超过免费限制，报错引导用户下单升级版本（属于特殊场景的处理）
  return (ev: SystemEvent) => {
    // 删除 !isEdm() 解决 SIRIUS-3778
    if (productVersionId.current === 'free') {
      if (ev.eventData.code === 'FA_MTA_REJECTED5520') {
        // 对外发信数量超过上限
        paidGuideModal.show({ errType: '1', origin: '写信页' });
        eventApi.confirmEvent(ev);
        return true;
      } else if (ev.eventData.code === 'FA_OVERFLOW' && ev.eventData.overflowReason === 'pref_smtp_max_num_rcpts') {
        // 单封收件人数量超上限
        paidGuideModal.show({ errType: '2', origin: '写信页' });
        eventApi.confirmEvent(ev);
        return true;
      } else if (ev.eventData.code === 'FA_MTA_REJECTED5530') {
        // 每日收件人数量超上限
        paidGuideModal.show({ errType: '3', origin: '写信页' });
        eventApi.confirmEvent(ev);
        return true;
      } else if (ev.eventData.code === 'FA_OVERFLOW' && ev.eventData.overflowReason === 'pref_smtp_max_send_mail_size') {
        // 单封邮件大小超上限
        paidGuideModal.show({ errType: '4', origin: '写信页' });
        eventApi.confirmEvent(ev);
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };
};

interface InformProps {
  visibleAdmin: boolean;
  informContent: JSX.Element;
}

const Inform: React.FC<InformProps> = props => {
  const { visibleAdmin, informContent } = props;
  return (
    <>
      {visibleAdmin ? (
        '升级至付费版，'
      ) : (
        <>
          可
          <Tooltip title={informContent}>
            <span className={styles.inform}>邮件通知</span>
          </Tooltip>
          管理员升级至付费版，
        </>
      )}
    </>
  );
};

const InformContentPrefix: React.FC = () => {
  return (
    <>
      以下为邮件内容
      <br />
      管理员，你好
      <br />
    </>
  );
};

interface PaidGuideProps {
  setSuccessModalVisible: (visible: boolean) => void;
  visibleAdmin: boolean; // 是否是管理员账号
}

const PaidGuide: React.FC<PaidGuideProps> = props => {
  const { setSuccessModalVisible, visibleAdmin } = props;
  const [maxNumRcpts, setMaxNumRcpts] = useState<number>(10); // 单封邮件收件人数量上限
  const [maxNumRcptsOfDay, setMaxNumRcptsOfDay] = useState<number>(100); // 每日收件人数量上限
  const [maxSendMailSize, setMaxSendMailSize] = useState<number>(20 * 1024); // 单封邮件大小最大限制 20M
  const [maxSendMailNum, setMaxSendMailNum] = useState<number>(100); // 每日对外发信数量上限（100封/天）
  const [loading, setLoading] = useState<boolean>(false);

  const modal = useNiceModal('paidGuide');

  const TipsContent = useMemo(() => {
    let tip = <></>; // 弹窗文案
    let informContent = <></>; // 弹窗文案中邮件通知hover提示文案
    if (modal.args.errType === '1') {
      // 对外发信数量超过上限
      informContent = (
        <>
          <InformContentPrefix />
          当前免费版的发信上限：{maxSendMailNum}封/天/账号，无法满足日常发信需求，期望能升级至付费版提高发信量，谢谢！
        </>
      );
      tip = (
        <>
          当前版本为：免费版，最多支持外发<span>{maxSendMailNum}</span>封/天
          <br />
          <Inform visibleAdmin={visibleAdmin} informContent={informContent} />
          提升发信上限，最高可达2500封/天
        </>
      );
    } else if (modal.args.errType === '2') {
      // 单封邮件收件人数量超过上限
      informContent = (
        <>
          <InformContentPrefix />
          当前免费版单封邮件最多可添加{maxNumRcpts}个收件人，无法满足日常发信需求，期望能升级至付费版提高收件人数，谢谢！
        </>
      );
      tip = (
        <>
          当前版本为：免费版，单封邮件最多可添加<span>{maxNumRcpts}</span>个收件人
          <br />
          <Inform visibleAdmin={visibleAdmin} informContent={informContent} />
          提升发信人数上限，最高可达500人/封
        </>
      );
    } else if (modal.args.errType === '3') {
      // 单日收件人数量超过上限
      informContent = (
        <>
          <InformContentPrefix />
          当前免费版每日发信的收件人总数上限为：{maxNumRcptsOfDay}人，无法满足日常发信需求，期望能升级至付费版提高收件人数，谢谢！
        </>
      );
      tip = (
        <>
          当前版本为：免费版，每日发信的收件人总数上限为：<span>{maxNumRcptsOfDay}</span>人
          <br />
          <Inform visibleAdmin={visibleAdmin} informContent={informContent} />
          提升发信上限，最高可达2500人/天
        </>
      );
    } else if (modal.args.errType === '4') {
      // 单封邮件大小超过上限
      informContent = (
        <>
          <InformContentPrefix />
          当前免费版单封邮件大小不能超过{Math.floor(maxSendMailSize / 1024)}M，无法满足日常发信需求，期望能升级至付费版提高单封邮件大小，谢谢！
        </>
      );

      tip = (
        <>
          当前版本为：免费版，单封邮件大小不能超过<span>{Math.floor(maxSendMailSize / 1024)}</span>M
          <br />
          <Inform visibleAdmin={visibleAdmin} informContent={informContent} />
          提升单封邮件大小，最高可达100M/封
        </>
      );
      // 新版
    } else if (modal.args.errType === '41') {
      // 单封邮件大小超过上限
      informContent = (
        <>
          <InformContentPrefix />
          当前免费版单封邮件大小有限制，无法满足日常发信需求，期望能升级至付费版提高单封邮件大小，谢谢！
        </>
      );
      tip = (
        <>
          当前版本为：免费版，当前邮件已超过大小限制
          <br />
          <Inform visibleAdmin={visibleAdmin} informContent={informContent} />
          发送超大邮件
        </>
      );
    } else if (modal.args.errType === '5') {
      // webToolbar中点击升级付费版
      informContent = (
        <>
          <InformContentPrefix />
          企业当前为免费版，无法满足日常发信需求，期望能升级至付费版享受无限邮箱容量、拥有邮件阅读状态追踪等高级能力
        </>
      );
      tip = (
        <>
          当前版本为：免费版
          <br />
          <Inform visibleAdmin={visibleAdmin} informContent={informContent} />
          即可享受安全、稳定的企业邮箱服务，包括无限邮箱容量、拥有邮件阅读状态追踪等高级能力
        </>
      );
    } else if (modal.args.errType === '6') {
      // AI写信 AI润色
      informContent = (
        <>
          <InformContentPrefix />
          企业当前为免费版，无法使用邮件AI能力，满足日常发信需求，期望能升级至付费版，使用邮件AI能力
        </>
      );
      tip = (
        <>
          当前版本为：免费版，无法使用AI能力
          <br />
          <Inform visibleAdmin={visibleAdmin} informContent={informContent} />
          即可享受邮件AI能力
        </>
      );
    } else if (modal.args.errType === '7') {
      // 已读提醒
      informContent = (
        <>
          <InformContentPrefix />
          企业当前为免费版，无法使用邮件已读提醒，期望能升级至付费版，对方读信后系统可通过消息及时通知，满足日常办公需求
        </>
      );
      tip = (
        <>
          当前版本为：免费版，无法使用邮件已读提醒
          <br />
          <Inform visibleAdmin={visibleAdmin} informContent={informContent} />
          对方读信后系统可通过消息及时通知
        </>
      );
    } else if (modal.args.errType === '8') {
      // 追踪邮件阅读状态
      informContent = (
        <>
          <InformContentPrefix />
          企业当前为免费版，无法使用邮件阅读状态追踪功能，期望能升级至付费版，发信后可及时查看邮件阅读状态，满足日常办公需求
        </>
      );
      tip = (
        <>
          当前版本为：免费版，无法使用邮件阅读状态追踪功能
          <br />
          <Inform visibleAdmin={visibleAdmin} informContent={informContent} />
          发信后可及时查看邮件阅读状态
        </>
      );
    } else {
      tip = <></>;
    }
    return <p className={styles.tipBody}>{tip}</p>;
  }, [modal.args.errType, visibleAdmin, maxNumRcpts, maxNumRcptsOfDay, maxSendMailSize, maxSendMailNum]);

  const getTrackSource = (type: string) => {
    let source = '';
    if (type === '1') {
      // 对外发信数量超过上限
      source = '对外发信数量超过上限';
    } else if (type === '2') {
      // 单封收件人数量超上限
      source = '单封邮件收件人数量超过上限';
    } else if (type === '3') {
      // 每日收件人数量超上限
      source = '每日收件人数量超过上限';
    } else if (type === '4') {
      // 单封邮件大小超上限
      source = '单封邮件大小超过上限';
    } else if (type === '5') {
      // 单封邮件大小超上限
      source = 'web端首页顶部引导付费条';
    } else if (type === '6') {
      // 单封邮件大小超上限
      source = 'AI写信 AI润色';
    } else if (type === '7') {
      // 单封邮件大小超上限
      source = '已读提醒';
    } else if (type === '8') {
      // 单封邮件大小超上限
      source = '邮件阅读状态追踪';
    }
    return source;
  };

  useEffect(() => {
    if (!modal.hiding) {
      // 弹窗显示埋点
      trackApi.track('pcMail_show_error_free', {
        type: visibleAdmin ? '管理员' : '成员',
        origin: modal.args.origin,
        source: modal.args.source || getTrackSource(modal.args.errType),
      });
    }
  }, [modal.hiding]);

  // useEffect(() => {
  //   mailConfApi.doGetUserAttr(['pref_smtp_max_num_rcpts', 'pref_smtp_max_send_mail_size']).then(res => {
  //     // 1.25版本暂时先不调用接口，前端使用默认值，因为另外两个字段需要服务端开发，服务端无法1.25ready
  //     setMaxNumRcpts(res.pref_smtp_max_num_rcpts as number);
  //     setMaxSendMailSize(res.pref_smtp_max_send_mail_size as number);
  //   });
  // }, []);

  const modalConfirm = () => {
    if (visibleAdmin) {
      // 管理员直接跳转管理后台
      trackApi.track('pcMail_click_error_free', {
        type: visibleAdmin ? '管理员' : '成员',
        origin: modal.args.origin,
        source: modal.args.source || getTrackSource(modal.args.errType),
        buttonName: '立即购买',
      });
      modal.hide();
      handleBackEnd('/valueAdd/versionService', 'lingxioffice');
    } else if (!loading) {
      // 非管理员，发送邮件通知给管理员
      setLoading(true);
      accountApi
        .sendCosUpgrade(parseInt(modal.args.errType) || 1)
        .then(() => {
          trackApi.track('pcMail_click_error_free', {
            type: visibleAdmin ? '管理员' : '成员',
            origin: modal.args.origin,
            source: getTrackSource(modal.args.errType),
            buttonName: '发邮件通知管理员',
          });
          modal.hide();
          setSuccessModalVisible(true);
        })
        .catch(() => {
          Toast.warn({
            content: getIn18Text('CHUCUOLE，QINGSHAOHOU'),
            duration: 3,
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const modalClose = () => {
    trackApi.track('pcMail_click_error_free', {
      type: visibleAdmin ? '管理员' : '成员',
      origin: modal.args.origin,
      source: getTrackSource(modal.args.errType),
      buttonName: '关闭',
    });
    modal.hide();
  };

  return (
    <Modal
      visible={!modal.hiding}
      maskClosable={false}
      title="升级邮箱版本"
      closeIcon={<DeleteIcon className="dark-invert" />}
      footer={null}
      width="480px"
      wrapClassName={styles.paidGuideModal}
      onCancel={modalClose}
    >
      {TipsContent}
      <p className={styles.tipBtnWrap}>
        <Button btnType="primary" onClick={modalConfirm} loading={loading}>
          {visibleAdmin ? '立即升级' : '立即通知管理员'}
        </Button>
      </p>
    </Modal>
  );
};

const PaidGuideModal = createNiceModal('paidGuide', PaidGuide);

const PaidGuidemodule: React.FC = () => {
  const [successModalVisible, setSuccessModalVisible] = useState<boolean>(false);
  const [visibleAdmin, setVisibleAdmin] = useState<boolean>(false); // 是否是管理员账号
  useEffect(() => {
    accountApi.doGetAccountIsAdmin().then(res => setVisibleAdmin(res));
  }, []);
  return (
    <>
      <PaidGuideModal setSuccessModalVisible={setSuccessModalVisible} visibleAdmin={visibleAdmin} />
      <Modal
        visible={successModalVisible}
        title={<></>}
        wrapClassName={styles.paidGuideSuccessModal}
        width="480px"
        footer={null}
        onCancel={() => setSuccessModalVisible(false)}
      >
        <p className={styles.done}>
          <Done />
        </p>
        <p className={styles.doneTxt}>邮件已发送，同时建议您线下提醒企业管理员</p>
        <p className={styles.btnWrap}>
          <Button btnType="primary" onClick={() => setSuccessModalVisible(false)}>
            知道了
          </Button>
        </p>
      </Modal>
    </>
  );
};

export default PaidGuidemodule;
