import React, { useState, useEffect } from 'react';
import { apiHolder, apis, EdmSendBoxApi, getIn18Text } from 'api';
// import isNumber from 'lodash/isNumber';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { ModalProps, Form, RadioChangeEvent, Space } from 'antd';
// import { Radio } from '@web-common/components/UI/Radio/index';
import Radio from '@lingxi-common-component/sirius-ui/Radio';
import Button from '@web-common/components/UI/Button/index';
// import SiriusRadio from '@web-common/components/UI/Radio/siriusRadio';

import style from './index.module.scss';

import SchemeInputBox, { SchemeInputValue } from '../SchemeInputBox/SchemeInputBox';
import GroupInputBox from '../GroupInputBox/GroupInputBox';
import { edmDataTracker } from '../../../tracker/tracker';

import { ReactComponent as TranslateError } from '@/images/translate_error.svg';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

interface SechemeAndGroupBoxProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (options: Record<'isSingle' | 'isNow', boolean>, params: { taskId: string; groupId: string; planId: string; planName: string; groupName: string }) => void;
  title?: string;
  onCreate?: () => void;
  isNow?: boolean; // 需要回传 立即发送|定时发送
  loading?: boolean;
  tipMsg?: string;
}

export const AihostingGuideModal = (props: ModalProps & SechemeAndGroupBoxProps) => {
  const { visible, onCancel, onConfirm, title = '建议升级为多轮发送，回复率翻倍！', onCreate, isNow = true, loading = false, tipMsg = '' } = props;
  const [groupId, setGroupId] = useState<string>('');
  const [planId, setPlanId] = useState<string>('');
  const [planName, setPlanName] = useState<string>('');
  const [groupName, setGroupName] = useState<string>('');
  const [taskId, setTaskId] = useState('');
  const [enableShowForm, setEnableShowForm] = useState(false);
  const [replaceSchemeError, setReplaceSchemeError] = useState<string>('');
  const [sendType, setSendType] = useState<'single' | 'multiple'>('single');

  const [form] = Form.useForm();
  // const [startupType, setStartupType] = useState<string>(ONCE);

  // 获取taskId
  useEffect(() => {
    edmApi.getSendBoxConf({ type: 2 }).then(result => {
      const manualTask = result?.manualPlan === 1;
      const taskId = result.hostingTaskId || '';
      manualTask && setTaskId(taskId);
      setEnableShowForm(!!(taskId && taskId.length && manualTask));
    });
  }, []);

  const handleCancel = () => {
    onCancel();
    setGroupId('');
    setPlanId('');
    setGroupName('');
    setReplaceSchemeError('');
  };

  const onChangeSendType = (e: RadioChangeEvent) => {
    const value = e.target.value;
    setSendType(value);
    edmDataTracker.track('pc_markting_edm_taskCreate_host', { click_type: value === 'multiple' ? 'host' : 'single' });
  };

  return (
    <Modal
      visible={visible}
      title={title || '请选择'}
      width={480}
      className={style.sechemeAndGroupBox}
      onCancel={handleCancel}
      maskClosable={false}
      destroyOnClose={true}
      closable={true}
      centered={true}
      getContainer={document.body}
      wrapClassName={style.aiHostingGuideWrapper}
      footer={
        <>
          <Button btnType="minorLine" onClick={handleCancel}>
            取消
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              if (enableShowForm && !planId && sendType === 'multiple') {
                setReplaceSchemeError('请选择营销托管任务');
                return;
              }

              onConfirm(
                {
                  isSingle: sendType === 'single',
                  isNow,
                },
                { taskId, groupId, planId, groupName, planName }
              );
            }}
            loading={loading}
          >
            确定
          </Button>
        </>
      }
    >
      <Form form={form} name="control-hooks" className={style.form}>
        <Radio.Group value={sendType} className={style.formItem} onChange={onChangeSendType}>
          <Space direction="vertical">
            <Radio value="single"> 仅执行单次发信 </Radio>
            <Radio value="multiple">
              {' '}
              升级为多轮发信，效果提升<span className={style.upValue}>50%</span>
              <span className={style.recommendMark}>推荐使用</span>{' '}
            </Radio>
            <p className={style.multipleOptionsTips}>（本次发送正常进行，将联系人加入营销托管中，自动进行后续轮次发送）</p>
          </Space>
        </Radio.Group>

        {enableShowForm && sendType === 'multiple' ? (
          <>
            <div className={style.formItem}>
              <span className={style.formLabel}>
                <span className={style.required}>*</span>营销方案:
              </span>
              <div className={style.formInput}>
                <SchemeInputBox
                  // showCreate
                  errorMsg={replaceSchemeError}
                  taskId={taskId}
                  onChange={(params: SchemeInputValue) => {
                    setPlanId(params.schemeId);
                    setPlanName(params.schemeName);
                    setReplaceSchemeError('');
                  }}
                  onCreate={onCreate}
                />
              </div>
              <input type="hidden" value={planId} name="planId" />
            </div>
            <div className={style.formItem}>
              <span className={style.formLabel}>
                <span className={style.nonRequired}>*</span>分组信息:
              </span>
              <div className={style.formInput}>
                <GroupInputBox
                  initGroup
                  taskId={taskId}
                  onChange={val => {
                    setGroupId(!val.groupId && !val.groupName ? '0' : val.groupId);
                    setGroupName(val.groupName);
                  }}
                />
                <input type="hidden" value={groupId} name="groupId" />
              </div>
            </div>
            {tipMsg ? (
              <div className={style.formTip}>
                <TranslateError />
                <span>{tipMsg}</span>
              </div>
            ) : (
              <></>
            )}
          </>
        ) : null}
      </Form>
    </Modal>
  );
};
