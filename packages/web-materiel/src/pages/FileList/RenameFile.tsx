import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import { splitFullName, validFullName } from '@web-materiel/utils';
import style from './RenameFile.module.scss';

const MAX_LENGTH = 100;

interface RenameFileProps {
  visible: boolean;
  name: string;
  loading: boolean;
  onOk: (name: string) => void;
  onCancel: () => void;
}

export const RenameFile: React.FC<RenameFileProps> = props => {
  const { visible, name: originName, loading, onOk, onCancel } = props;
  const [name, setName] = useState<string>('');
  const [ext, setExt] = useState<string>('');
  const fullName = ext ? `${name}.${ext}` : name;
  const submittable = validFullName(fullName);

  useEffect(() => {
    if (visible) {
      const full = splitFullName(originName);
      setName(full.name);
      setExt(full.ext);
    } else {
      setName('');
      setExt('');
    }
  }, [visible, originName]);

  const handleOk = () => {
    if (submittable) {
      onOk(fullName);
    }
  };

  return (
    <Modal
      className={style.renameFile}
      title="重命名"
      width={400}
      visible={visible}
      okButtonProps={{
        disabled: !submittable,
        loading,
      }}
      onOk={handleOk}
      onCancel={onCancel}
    >
      <Input
        className={classnames(style.input, {
          [style.error]: name && !submittable,
        })}
        value={name}
        addonAfter={ext ? `.${ext}` : undefined}
        maxLength={MAX_LENGTH - 1 - ext.length}
        onChange={event => setName(event.target.value)}
        onPressEnter={handleOk}
      />
    </Modal>
  );
};
