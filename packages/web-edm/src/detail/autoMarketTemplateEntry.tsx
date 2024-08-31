import { getIn18Text } from 'api';
// autoMarketTemplateEntry
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { apiHolder, apis, AutoMarketApi, AutoMarketTaskObjectType, AutoMarketTaskObjectTypeName, AutoMarketTaskType, ResponseSendBoxDetail } from 'api';
import { Alert } from 'antd';
import { getTransText } from '@/components/util/translate';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as InfoIcon } from '@/images/icons/edm/addressBook/info.svg';
import { AutoTaskTemplateModal } from '../autoMarket/components/autoTaskTemplateModal';
import { getEdmSendTime } from '../autoMarket/constant';
import { jumpToAutoMarketing } from '../autoMarket/utils';
import style from './autoMarketTemplateEntry.module.scss';

const autoMarketApi = apiHolder.api.requireLogicalApi(apis.autoMarketApiImpl) as unknown as AutoMarketApi;

interface Props {
  sendBoxInfo: ResponseSendBoxDetail;
  onSuccess?: Function;
}

export const AutoMarketTemplateEntry: React.FC<Props> = ({ sendBoxInfo = {}, onSuccess }) => {
  const templateRef = useRef<any>();
  const [templateVisible, setTemplateVisible] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [hasRelation, setHasRelation] = useState(true);
  const [showAlert, setShowAlert] = useState(true);

  useEffect(() => {
    templateRef.current.hasTemplate().then((res: boolean) => setHasTemplate(res));
    const { edmSendboxEmailInfo } = sendBoxInfo;
    if (edmSendboxEmailInfo) {
      autoMarketApi.getAutoMarketEdmTask(edmSendboxEmailInfo.edmEmailId).then(res => {
        if (res?.autoMarketTasks?.length === 0) {
          setHasRelation(false);
        }
      });
    }
  }, [templateRef.current]);

  const getLocalTime = (sendTime: string, cronTimeZone: string) => {
    if (sendTime && cronTimeZone) {
      const date = moment(`${sendTime}${cronTimeZone}`);
      return date.utcOffset(8).format('YYYY-MM-DD HH:mm:ss');
    }
    return '-';
  };

  const onTemplateSelect = async (taskId: string) => {
    let taskObjectInfo;
    const { receiverList = [], edmSendboxEmailInfo } = sendBoxInfo || {};
    if (!edmSendboxEmailInfo) {
      return setTemplateVisible(false);
    }
    taskObjectInfo = {
      objectType: AutoMarketTaskObjectType.EDM,
      objectName: AutoMarketTaskObjectTypeName.EDM,
      objectContent: {
        edmEmailId: edmSendboxEmailInfo?.edmEmailId,
        edmTaskName: edmSendboxEmailInfo?.edmSubject,
        edmSendTime: getEdmSendTime(edmSendboxEmailInfo.sendTime, edmSendboxEmailInfo.sendTimeZone),
        edmEmailSendTime: getLocalTime(edmSendboxEmailInfo.sendTime, edmSendboxEmailInfo.sendTimeZone),
        contactInfos: receiverList,
      },
    };
    const res = await autoMarketApi.saveByTemplate(taskId, taskObjectInfo, edmSendboxEmailInfo.edmSubject);
    setTemplateVisible(false);
    setShowAlert(false);
    if (onSuccess) {
      onSuccess();
    }
    Toast.success({
      content: (
        <>
          {getTransText('YIKAIQIZIDONGHUAYINGXIAO，JUTIRENWUXIANGQINGQIANWANG')}
          <span className={style.linkBtn} onClick={() => jumpToAutoMarketing(`#edm?page=autoMarketTaskDetail&taskId=${res.taskId}`)}>
            {getIn18Text('CHAKAN')}
          </span>
        </>
      ),
      duration: 5,
    });
  };

  const shouldShow = useMemo(() => {
    if (hasRelation || !hasTemplate) {
      return false;
    }
    const { edmSendboxEmailInfo } = sendBoxInfo || {};
    const readRatio = parseInt(edmSendboxEmailInfo?.readRatio || '', 10) || 0;
    if (readRatio >= 15 || String(edmSendboxEmailInfo?.emailStatus) !== '2') {
      // 不是已发送状态
      return false;
    }

    return true;
  }, [sendBoxInfo, hasTemplate, hasRelation]);

  return (
    <>
      {showAlert && shouldShow ? (
        <div className={style.wrapper} style={{ background: 'transparent' }}>
          <Alert
            className={style.alert}
            icon={<InfoIcon />}
            closable
            message={
              <>
                <span>{getTransText('EdmAutoMarketEntryTip')}</span>
                <a onClick={() => setTemplateVisible(true)}>{getTransText('GroupTaskCreate')}</a>
              </>
            }
            type="info"
            showIcon
          />
        </div>
      ) : (
        ''
      )}

      <AutoTaskTemplateModal
        visible={templateVisible}
        ref={templateRef}
        taskType={[AutoMarketTaskType.FIXED_CONTACT]}
        onSelect={onTemplateSelect}
        onCancel={() => setTemplateVisible(false)}
      />
    </>
  );
};
