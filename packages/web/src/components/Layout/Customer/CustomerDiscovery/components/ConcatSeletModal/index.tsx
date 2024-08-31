import React, { useState, useEffect } from 'react';
import { ContactModel, EntityContact } from 'api';
import { ContactItem } from '@web-common/components/util/contact';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { Button, message } from 'antd';
import { useAppDispatch } from '@web-common/state/createStore';
import { getEdmUserTreeAsync } from '@web-common/state/reducer/edmUserReducer';
import { TreeSelect } from '@/components/Layout/Rbac/components/selectContact';
import { TreeSelectContact } from '@/components/Layout/Rbac/components/selectContact/treeSelectContact';
import style from './style.module.scss';
import { getIn18Text } from 'api';
export interface ConcatModalProps {
  visible: boolean;
  onCancel: () => any;
  onConfirm: (concats: EntityContact[], extrData?: any, callBack?: () => void) => void | Promise<void>;
  extrData?: any;
  multiple?: boolean;
  callBack?: () => void;
}
export const ConcatSelectModal: React.FC<ConcatModalProps> = props => {
  const { visible, onCancel, onConfirm, extrData, callBack, multiple = true } = props;
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<EntityContact[]>([]);
  const appDispatch = useAppDispatch();
  useEffect(() => {
    if (!multiple) {
      appDispatch(getEdmUserTreeAsync());
    }
  }, []);
  const selectConfirm = () => {
    if (!selected.length) {
      message.error(getIn18Text('WEIXUANZERENHELIANXIREN'));
      return;
    }
    if (onConfirm) {
      setLoading(true);
      Promise.resolve(onConfirm(selected, extrData, callBack)).finally(() => setLoading(false));
    }
  };
  const concatSelectChange = (concats: ContactModel[]) => setSelected(concats.map(concat => concat.contact));
  const singleSelect = async (_: ContactItem[], items: ContactModel[] = []) => {
    if (onConfirm) {
      setLoading(true);
      Promise.resolve(
        onConfirm(
          items.map(concat => concat.contact),
          extrData,
          callBack
        )
      ).finally(() => {
        setLoading(false);
        onCancel();
      });
    }
  };
  return (
    <Modal
      title={getIn18Text('XUANZELIANXIREN')}
      width={700}
      getContainer={false}
      maskClosable={false}
      onCancel={onCancel}
      bodyStyle={{
        width: '700px',
        height: '480px',
        marginBottom: '16px',
        paddingTop: 0,
        paddingBottom: 0,
      }}
      visible={visible}
      destroyOnClose={Boolean(true)}
      footer={
        <div className={style.footer}>
          <Button onClick={onCancel}>{getIn18Text('QUXIAO')}</Button>
          <Button type="primary" loading={loading} onClick={selectConfirm}>
            {getIn18Text('QUEDING')}
          </Button>
        </div>
      }
    >
      {multiple ? (
        <TreeSelect onChange={concatSelectChange} />
      ) : (
        <TreeSelectContact multiple={false} showCheckbox={false} showAddOrgBtn={false} onSelect={singleSelect} />
      )}
    </Modal>
  );
};
