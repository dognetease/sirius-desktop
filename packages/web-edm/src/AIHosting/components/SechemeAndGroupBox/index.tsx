import React, { useState, useEffect } from 'react';
// import isNumber from 'lodash/isNumber';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { ModalProps, Button } from 'antd';
// import SiriusRadio from '@web-common/components/UI/Radio/siriusRadio';

import style from './index.module.scss';

import SchemeInputBox, { SchemeInputValue } from '../SchemeInputBox/SchemeInputBox';
import GroupInputBox from '../GroupInputBox/GroupInputBox';

import { ReactComponent as TranslateError } from '@/images/translate_error.svg';

interface SechemeAndGroupBoxProps {
  visible: boolean;
  taskId: string;
  onCancel: () => void;
  onConfirm: (groupId: string, planId: string, groupName: string) => void;
  title?: string;
  onCreate?: () => void;
  loading?: boolean;
  tipMsg?: string;
  defaultPlanId?: string;
}

// const ONCE = 'once';
// const MANY = 'many';
// // 获取立即启动的发送时长
// const getTimeLong = (count?: number) => {
//   if (!isNumber(count)) {
//     return '';
//   }
//   if (count < 1000) {
//     return '3-4小时';
//   }
//   if (count >= 1000 && count < 5000) {
//     return '7-8小时';
//   }
//   if (count >= 5000 && count < 10000) {
//     return '16-18小时';
//   }
//   if (count >= 10000) {
//     return '大于20小时';
//   }
// };

export const SechemeAndGroupBoxModal = (props: ModalProps & SechemeAndGroupBoxProps) => {
  const { visible, onCancel, taskId, onConfirm, title, onCreate, loading = false, tipMsg = '', defaultPlanId } = props;
  const [groupId, setGroupId] = useState<string>('');
  const [planId, setPlanId] = useState<string>(defaultPlanId || '');
  const [name, setName] = useState<string>('');
  const [replaceSchemeError, setReplaceSchemeError] = useState<string>('');
  // const [startupType, setStartupType] = useState<string>(ONCE);

  const resetData = () => {
    setGroupId('');
    setPlanId('');
    setName('');
    setReplaceSchemeError('');
  };

  useEffect(() => {
    if (!visible) {
      resetData();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      title={title || '请选择'}
      width={480}
      className={style.sechemeAndGroupBox}
      onCancel={onCancel}
      maskClosable={false}
      destroyOnClose={true}
      closable={true}
      centered={true}
      getContainer={document.body}
      footer={
        <>
          <Button onClick={onCancel}>取消</Button>
          <Button
            type="primary"
            onClick={() => {
              if (!planId) {
                setReplaceSchemeError('请选择营销方案');
                return;
              }
              onConfirm(groupId, planId, name);
            }}
            loading={loading}
          >
            确定
          </Button>
        </>
      }
    >
      <div className={style.form}>
        <div className={style.formItem}>
          <span className={style.formLabel}>营销方案:</span>
          <div className={style.formInput}>
            <SchemeInputBox
              showCreate
              errorMsg={replaceSchemeError}
              taskId={taskId}
              defaultPlanId={defaultPlanId}
              onChange={(val: SchemeInputValue) => {
                setPlanId(val.schemeId);
                setReplaceSchemeError('');
              }}
              onCreate={onCreate}
            />
          </div>
        </div>
        <div className={style.formItem}>
          <span className={style.formLabel}>分组信息:</span>
          <div className={style.formInput}>
            <GroupInputBox
              initGroup
              taskId={taskId}
              onChange={val => {
                setGroupId(!val.groupId && !val.groupName ? '0' : val.groupId);
                setName(val.groupName);
              }}
            />
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
        {/* <div className={style.formItem}>
          <span className={style.formLabel}>启动时间:</span>
          <div className={style.formRadio}>
            <SiriusRadio.Group onChange={e => setStartupType(e.target.value)} value={startupType}>
              <SiriusRadio value={ONCE}>
                <span>
                  立即启动
                  <span className={style.formRadioDesc}>立即启动，预计需{getTimeLong(count)}完成第一封邮件发送</span>
                </span>
              </SiriusRadio>
              <SiriusRadio value={MANY}>
                <span>
                  分天启动
                  <span className={style.formRadioDesc}>每天定时启动给一批邮箱发送第一封邮件</span>
                </span>
              </SiriusRadio>
            </SiriusRadio.Group>
            {startupType === MANY ? (
              <div className={style.formRadioSet}>
                <div className={style.formRadioSetItem}>共分 天启动，每天启动x个邮箱</div>
                <div>选择时区</div>
                <span className={style.formRadioText}>若选择19:31之前，则明日开始发送</span>
              </div>
            ) : <></> }
            {count && count >= 100 ? <span className={style.formRadioText}>100人以上会默认开启安全发送拉长发送间隔，发送时间将顺序延后</span> : <></>}
          </div>
        </div> */}
      </div>
    </Modal>
  );
};
