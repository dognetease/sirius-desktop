import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import styles from './index.module.scss';
import { Input, message, Tooltip } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { api, apis, SiteApi } from 'api';
import CloseIcon from '../../../images/agreement-close.svg';

interface BindAnalysisProps {
  siteId: string;
  visible: boolean;
  onClose?: ((e: React.MouseEvent<HTMLElement, MouseEvent>) => void) | undefined;
}

const QuestionTag = () => {
  return (
    <Tooltip placement="right" title="粘贴自定义代码即可自定义你的网站样式">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 14.5C9.79493 14.5 11.4199 13.7725 12.5962 12.5962C13.7725 11.4199 14.5 9.79493 14.5 8C14.5 6.20507 13.7725 4.58007 12.5962 3.40381C11.4199 2.22754 9.79493 1.5 8 1.5C6.20507 1.5 4.58007 2.22754 3.40381 3.40381C2.22754 4.58007 1.5 6.20507 1.5 8C1.5 9.79493 2.22754 11.4199 3.40381 12.5962C4.58007 13.7725 6.20507 14.5 8 14.5Z"
          stroke="#C9CBD6"
          stroke-linejoin="round"
        />
        <path
          d="M7.99995 9.40652V9.08139C7.99995 8.63957 8.37751 8.29763 8.77046 8.09564C9.31508 7.81568 9.68764 7.2482 9.68764 6.5937C9.68764 5.66161 8.93204 4.90601 7.99995 4.90601C7.06786 4.90601 6.31226 5.66161 6.31226 6.5937"
          stroke="#C9CBD6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <rect x="7.625" y="10.975" width="0.75" height="0.75" rx="0.375" stroke="#C9CBD6" stroke-width="0.75" />
      </svg>
    </Tooltip>
  );
};

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

export const BindAnalysis: React.FC<BindAnalysisProps> = props => {
  const { siteId, visible, onClose } = props;
  const [submiting, setSubmiting] = useState(false);
  const [value, setValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    siteApi.getThirdPartCode({ siteId }).then(res => {
      if (res?.thirdPartyCode) setValue(res.thirdPartyCode);
    });
  }, [siteId]);

  const handleCancel = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    onClose?.(e);
  };

  const handleOk = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    // if (!value) {
    //     setErrorMsg('请复制粘贴第三方统计代码');
    //     return;
    // }
    setSubmiting(true);
    try {
      await siteApi.addThirdPartCode({
        siteId,
        renderLocation: 'header',
        thirdPartyCode: value ?? '',
      });
      message.success('关联成功，统计将在24小时内生效');
    } catch {
      message.error('提交失败');
    } finally {
      setSubmiting(false);
    }
    onClose?.(e);
  };

  return (
    <Modal
      zIndex={800}
      visible={visible}
      getContainer={false}
      width={530}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 4 }}>
          自定义代码
          <QuestionTag />
        </div>
      }
      footer={null}
      maskClosable={false}
      className={styles.bindAnalysis}
      destroyOnClose={true}
      onCancel={handleCancel}
      closeIcon={<img src={CloseIcon} />}
    >
      <CodeMirror
        value={value}
        extensions={[javascript({ jsx: true })]}
        onChange={value => {
          setErrorMsg('');
          setValue(value);
        }}
        placeholder="请复制粘贴自定义代码"
        height="342px"
      ></CodeMirror>
      {errorMsg && <div className={styles.errorMsg}>{errorMsg}</div>}
      <div className={styles.btnGroup}>
        <button className={styles.cancelBtn} onClick={handleCancel}>
          取消
        </button>
        <button className={submiting ? styles.submitBtnDisabled : styles.submitBtn} onClick={handleOk}>
          {submiting ? '提交中...' : '确定'}
        </button>
      </div>
    </Modal>
  );
};
