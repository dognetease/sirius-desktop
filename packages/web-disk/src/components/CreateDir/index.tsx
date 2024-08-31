import React, { useEffect, useState, useRef } from 'react';
import { Input } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import IconCard from '@web-common/components/UI/IconCard';
import style from './index.module.scss';
import { getIn18Text } from 'api';
interface Props {
  isModalVisible: boolean;
  createDirLoading: boolean;
  handleOk: (value) => void;
  handleCancel: () => void;
}
const CreateDir: React.FC<Props> = ({ isModalVisible, handleOk, handleCancel, createDirLoading }) => {
  const [value, setValue] = useState(getIn18Text('XINJIANWENJIANJIA'));
  const inputRef = useRef<Input>(null);
  useEffect(() => {
    if (inputRef && isModalVisible) {
      setTimeout(() => {
        inputRef.current?.focus();
      });
    }
  }, [isModalVisible]);
  const focusInput = () => {
    inputRef.current?.select();
  };
  const commitInput = () => {
    if (value.trim() === '') {
      message.error({ content: getIn18Text('WENJIANJIAMINGCHENG'), duration: 4 });
      return;
    }
    handleOk(value);
  };
  return (
    <Modal
      title={getIn18Text('XINJIANWENJIANJIA')}
      className={style.modal}
      closable={false}
      afterClose={() => {
        setValue(getIn18Text('XINJIANWENJIANJIA'));
      }}
      confirmLoading={createDirLoading}
      okButtonProps={{ disabled: !value }}
      width="475px"
      visible={isModalVisible}
      onOk={commitInput}
      onCancel={handleCancel}
    >
      <Input
        ref={inputRef}
        onFocus={focusInput}
        onChange={e => {
          setValue(e.currentTarget.value);
        }}
        value={value}
        maxLength={30}
        className={style.input}
        onPressEnter={commitInput}
        suffix={
          <IconCard
            type="closeCircle"
            className="dark-invert"
            onClick={() => {
              setValue('');
            }}
          />
        }
      />
    </Modal>
  );
};
export default CreateDir;
