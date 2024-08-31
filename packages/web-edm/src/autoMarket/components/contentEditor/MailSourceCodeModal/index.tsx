import React, { useState, useEffect, useContext } from 'react';
import classNames from 'classnames';
import { Input, Switch, message, Spin, Modal } from 'antd';
// import Modal from '@web-common/components/UI/Modal/SiriusModal';
import './index.scss';
import { VarSelect } from './VarSelect';
import { SourceCodeModalProps, OptionItem } from './types';
import { edmWriteContext } from '../../../../send/edmWriteContext';
import IconCard from '@web-mail/components/Icon';
import { getTransText } from '@/components/util/translate';

const SourceCodeModal = (props: SourceCodeModalProps) => {
  const { visible, setVisible, sourceCode = '', showVarSelect, setContent } = props;
  const { state, dispatch: dispatchWriteContext } = useContext(edmWriteContext).value;
  const [inputValue, setInputValue] = useState('');
  const [errVisible, setErrVisible] = useState(false);
  const [varChecked, setVarChecked] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInputValue(sourceCode);
  }, [sourceCode]);

  const handleOk = () => {
    if (!inputValue) {
      setErrVisible(true);
      return;
    }
    dispatchWriteContext({
      type: 'setState',
      payload: {
        templateParamsFromEditor: options,
      },
    });
    setContent(inputValue);
    setVisible(false);
    setErrVisible(false);
  };

  const handleCancel = () => {
    setVisible(false);
    setErrVisible(false);
    setOptions([]);
  };

  const onTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
    setErrVisible(false);
  };

  const onSwitchChange = (checked: boolean) => {
    setVarChecked(checked);
    !checked && setOptions([]);
  };

  return (
    <Modal
      title={getTransText('TIANJIAYUANDAIMA')}
      visible={visible}
      maskClosable={false}
      closeIcon={<IconCard type="close" />}
      width={836}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={'保存'}
      cancelText={'取消'}
      confirmLoading={loading}
      className="source-code-modal"
    >
      <Spin spinning={loading}>
        <Input.TextArea
          className={classNames({ 'source-code-modal-textarea': true, 'source-code-modal-textarea-error': errVisible })}
          style={{ resize: 'none', height: 280 }}
          value={inputValue}
          onChange={onTextareaChange}
          placeholder={getTransText('QINGSHURUYUANDAIMA')}
        />

        <p style={{ visibility: errVisible ? 'visible' : 'hidden' }} className="source-code-modal-input-err">
          {getTransText('YUANDAIMABUNENGWEIKONG')}
        </p>
        {showVarSelect && (
          <div className="variable-ctrl-item">
            <div className="variable-ctrl-switch-item">
              <p className="variable-ctrl-content-title">{getTransText('TIANJIABIANLIANG')}</p>
              <Switch className="variable-ctrl-switch" checked={varChecked} onChange={onSwitchChange} />
            </div>
            <p className="variable-ctrl-content-info">{getTransText('KETIANJIAYUANDAIMAZHONGDEBIANLIANG')}</p>

            <div className="variable-ctrl-content">
              <VarSelect visible={varChecked} options={options} setOptions={setOptions} />
            </div>
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default SourceCodeModal;
