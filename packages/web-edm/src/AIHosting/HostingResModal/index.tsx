import { Modal, Spin } from 'antd';
import IconCard from '@web-common/components/UI/IconCard/index';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import TongyongGuanbiXian from '@web-common/images/newIcon/tongyong_guanbi_xian.svg';
import style from './index.module.scss';
import { HostingMailInfo, Plan, HostingPlanModel } from 'api';
import cloneDeep from 'lodash/cloneDeep';
import traversalBr from '../utils/traversalBr';
import { getContentWithoutAttachment } from '../../send/contentEditor';
import { AttachmentItem } from '../../components/attachment/card';
import Translate, { TranslateParams } from '../../components/translate/index';
import { ModifyInfos, MultiVersion, MultiVersionImplInterface } from '../MarketingPlan/multiVersion';
import EditorModal from '../../components/edmMarketingEditorModal/index';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { ReactComponent as WarningIcon } from '@/images/icons/edm/edm-common-notice.svg';
import { LoadingIcon } from '../MarketingPlan/planHelper';
import { getIn18Text } from 'api';
import { guardString } from '../../utils';

const LoadingComp = (props: { loading: string }) => {
  const { loading } = props;
  return !!loading ? (
    <div className={style.pageLoading}>
      <Spin tip={loading} indicator={<IconCard type="tongyong_jiazai" />} />
    </div>
  ) : null;
};

export interface Props {
  mailInfo?: HostingMailInfo;
  oPlan?: Partial<HostingPlanModel>;

  visiable: boolean;
  onClose: () => void;

  onSave?: (result?: ModifyInfos) => void;
}

const HostingResModal = (props: Props) => {
  const { mailInfo, oPlan, visiable, onSave, onClose } = props;
  const multiRef = useRef<MultiVersionImplInterface>();

  const [translateInfo, setTranslateInfo] = useState<{ isTranslation: boolean; translation: string }[]>([]);
  const [loading, setLoading] = useState<string>(''); // loading 文案 这个loading给翻译用
  const [globalLoading, setGlobalLoading] = useState(false);

  const [editorVisible, setEditorVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(false);

  const onTranslateInfo = useMemo(() => translateInfo[0] || { isTranslation: false, translation: '' }, [translateInfo]);
  const onMailInfo = mailInfo?.contentEditInfo;
  const contentHtml = useMemo(() => {
    const subject = onMailInfo?.subject ? `<h2>${onMailInfo.subject}</h2>` : '';
    let content = onMailInfo?.emailContent ? onMailInfo?.emailContent : '';
    const doc = new DOMParser().parseFromString(content, 'text/html');
    traversalBr(doc.body);
    content = doc.body.innerHTML.replaceAll('&lt;br /&gt;', '<br />');
    content = getContentWithoutAttachment(content);
    return subject + content;
  }, [onMailInfo]);
  const attachmentList = useMemo(() => {
    let attachmentList = [];
    try {
      attachmentList = JSON.parse(onMailInfo?.emailAttachment || '');
    } catch (error) {}
    return attachmentList || [];
  }, [onMailInfo?.emailAttachment]);

  useEffect(() => {
    setTranslateInfo([{ isTranslation: false, translation: '' }]);
  }, [mailInfo]);

  const getEmailName = () => {
    let name = '';
    oPlan?.mailInfos?.forEach((i, index) => {
      if (mailInfo?.roundIndex === index + 1) {
        name = i.emailName;
      }
    });
    return guardString(name) ? name : oPlan?.planName;
  };

  const refresh = () => {
    setRefreshKey(!refreshKey);
  };

  // 翻译回调
  const onTranslate = (res: TranslateParams) => {
    translateInfo[0].isTranslation = res.isTranslation;
    if (res.serviceRes && res.serviceRes.success) {
      // 翻译成功，调用接口，并成功返回
      translateInfo[0].translation = res.serviceRes.data.translations[0];
    }
    setTranslateInfo([...translateInfo]);
  };

  const AttachmentListComp = () => {
    return (
      <div className={`attachment ${style.edmAttachments}`}>
        {attachmentList.length > 0 && (
          <div className="title">
            {getIn18Text('FUJIAN(')}
            {attachmentList.length})
          </div>
        )}
        <div className="attachment-list">
          {attachmentList.map((attachment: any) => (
            <AttachmentItem key={attachment.id} state={attachment} />
          ))}
        </div>
      </div>
    );
  };

  // 预览弹窗底部操作按钮
  const Footer = () => {
    return (
      <div className={style.footer}>
        <p />
        <p className={style.operate}>
          <span
            className={style.edit}
            onClick={() => {
              setEditorVisible(true);
            }}
          >
            {getIn18Text('BIANJI')}
          </span>
          <span
            className={style.close}
            onClick={() => {
              onSaveFunc();
            }}
          >
            {getIn18Text('BAOCUN')}
          </span>
        </p>
      </div>
    );
  };

  const mailContentChangedNoti = (mailInfo: HostingMailInfo) => {
    mailInfo.plan = undefined;
    mailInfo.multipleContentInfo = undefined;
    refresh();

    SiriusModal.warning({
      title: getIn18Text('YOUJIANZHENGWENBIANGENG'),
      content: getIn18Text('JIANCEDAOYOUJIANZHENGWEN'),
      okText: getIn18Text('CHONGXINSHENGCHENG'),
      icon: <WarningIcon />,
      className: style.multiVersionConfirmModal,
      cancelText: getIn18Text('setting_system_switch_cancel'),
      centered: true,
      onCancel() {
        refresh();
      },
      onOk() {
        setTimeout(() => {
          multiRef.current?.reGeneral();
        }, 100);
      },
    });
  };

  const EditorModalComp = () => {
    if (!mailInfo) {
      return undefined;
    }

    let emailContent = mailInfo.contentEditInfo?.emailContent || '';
    emailContent = getContentWithoutAttachment(emailContent);
    return (
      <EditorModal
        destroyOnClose={false}
        visible={editorVisible}
        emailContent={emailContent}
        emailAttachment={mailInfo.contentEditInfo?.emailAttachment || ''}
        emailSubject={mailInfo.contentEditInfo?.subject}
        emailSenderEmail={mailInfo.sendSettingInfo?.senderEmail}
        subjectVisible
        onCancel={() => {
          setEditorVisible(false);
        }}
        onSave={value => {
          mailInfo.contentEditInfo = value;
          if (mailInfo.plan) {
            mailInfo.plan.mailInfo = value;
          }
          setEditorVisible(false);
          if (isAiOn(mailInfo) || multiRef.current?.isUsingModify()) {
            mailContentChangedNoti(mailInfo);
          }
        }}
        needModal
      />
    );
  };

  const isAiOn = (info: HostingMailInfo) => {
    if (info.plan?.aiOn) {
      return true;
    }
    if (info.multipleContentInfo?.emailContentId?.length || 0 > 0) {
      return true;
    }
    return false;
  };

  const OriContentComp = () => {
    return (
      <div className={style.oriContent}>
        <p className={style.contentHeader}>
          <Translate
            isTranslation={onTranslateInfo.isTranslation}
            contents={[contentHtml]}
            setLoading={setLoading}
            onTranslate={onTranslate}
            needServerRes={!onTranslateInfo.translation}
            sourceType="host"
          />
        </p>
        <div className={style.mailContent}>
          <div dangerouslySetInnerHTML={{ __html: !loading && onTranslateInfo.isTranslation ? onTranslateInfo.translation : contentHtml }} />
          <AttachmentListComp />
          <LoadingComp loading={loading} />
        </div>
      </div>
    );
  };

  const MultiContentComp = () => {
    if (!mailInfo) {
      return undefined;
    }

    let plan = mailInfo?.plan;
    if (!plan) {
      plan = {
        round: mailInfo.roundIndex,
        mailInfo: { ...mailInfo.contentEditInfo },
        multiContentId: mailInfo.multipleContentInfo?.emailContentId,
      };
      if (plan.multiContentId?.length || 0 > 0) {
        plan.aiOn = true;
      }
    }
    plan.title = getEmailName();
    return (
      <div className={style.multiContent}>
        <MultiVersion
          ref={multiRef}
          defaultIndex={0}
          multiStateChanged={() => {
            // onChangeFunc();
          }}
          plan={plan}
          source="hostingRes"
        />
      </div>
    );
  };

  const onSaveFunc = async () => {
    setGlobalLoading(true);
    const modifyInfos = await multiRef.current?.fetchModifyInfos();
    setGlobalLoading(false);
    onSave && onSave(modifyInfos);
  };

  const GLobalLoading = () => {
    return globalLoading ? (
      <div className={style.pageLoading}>
        <Spin indicator={<LoadingIcon />} />
      </div>
    ) : null;
  };

  return (
    <Modal
      wrapClassName={style.modalText}
      footer={<Footer />}
      onCancel={() => {
        onClose && onClose();
      }}
      maskClosable={false}
      destroyOnClose
      width={984}
      visible={visiable}
      title={getEmailName()}
      closeIcon={
        <img
          style={{ width: '24px', height: '24px' }}
          src={TongyongGuanbiXian}
          onClick={() => {
            onClose && onClose();
          }}
        />
      }
    >
      <div className={style.allResult}>
        <div className={style.bodyArea}>
          {OriContentComp()}
          {MultiContentComp()}
        </div>
      </div>
      {editorVisible && EditorModalComp()}
      {GLobalLoading()}
    </Modal>
  );
};

export default HostingResModal;
