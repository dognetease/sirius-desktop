// import Modal from '@web-common/components/UI/Modal/SiriusModal';
import React, { useState, useRef } from 'react';
import classes from './multiSelectManage.module.scss';
import { Input, Modal } from 'antd';
import { ReactComponent as IconWarn } from '@/images/icons/edm/icon_warning-red.svg';
import { ReactComponent as IconEdit } from '@/images/icons/edm/template-group-edit.svg';
import { ReactComponent as IconDelete } from '@/images/icons/edm/template-group-delete.svg';
import { getIn18Text } from 'api';

interface Props {
  visible: boolean;
  editId: number | string | undefined;
  editName: string;
  dataList: Record<string, any>[];
  editItem: (item: any) => void;
  saveItem: (item: any) => void;
  deleteItem: (item: any) => void;
  closeModal: () => void;
  onNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  // 错误提示信息
  errorMessage?: string;
  // 最大输入长度
  maxLength?: number;
  // 父组件类型拼音
  typePinyin?: string;
}

const MultiSelectManage: React.FC<Props> = ({
  visible,
  editId,
  editName,
  dataList,
  editItem,
  saveItem,
  deleteItem,
  closeModal,
  onNameChange,
  onCancel,
  errorMessage,
  maxLength = 12,
  typePinyin = 'FENZU',
}) => {
  const inputRef = useRef(null);
  const InputRender = (item: Record<string, any>) => {
    return (
      <Input.Group compact>
        <Input
          style={{ width: '100%' }}
          ref={inputRef}
          placeholder={getIn18Text(`QINGSHURU${typePinyin}MINGCHENG`)}
          value={editName}
          maxLength={maxLength}
          onChange={onNameChange}
          onClick={e => e.stopPropagation()}
          suffix={
            <>
              <span
                className={classes.inputBtn}
                style={{ marginRight: '12px' }}
                onClick={() => {
                  saveItem(item);
                }}
              >
                {getIn18Text('QUEDING')}
              </span>
              <span className={classes.inputBtn} onClick={onCancel}>
                {getIn18Text('QUXIAO')}
              </span>
            </>
          }
        />
      </Input.Group>
    );
  };

  const beforeDeleteItem = item => {
    Modal.confirm({
      centered: true,
      content: getIn18Text('SHIFOUQUERENSHANCHU'),
      onOk: async () => {
        deleteItem(item);
      },
    });
  };

  return (
    <Modal
      title={getIn18Text(`GUANLI${typePinyin}`)}
      footer={null}
      visible={visible}
      width={337}
      onCancel={closeModal}
      bodyStyle={{ height: '340px' }}
      wrapClassName={classes.groupModal}
    >
      <div className={classes.content}>
        {dataList.length > 0 ? (
          dataList.map(item => {
            return (
              <div className={editId === item.id ? classes.item1 : classes.item}>
                {editId === item.id ? InputRender(item) : <span className={classes.itemName}>{item.name}</span>}
                <div className={classes.btns}>
                  <IconEdit
                    className={classes.editIcon}
                    onClick={() => {
                      editItem(item);
                      setTimeout(() => {
                        inputRef.current?.focus();
                      }, 0);
                    }}
                  />
                  <IconDelete className={classes.deleteIcon} onClick={() => beforeDeleteItem(item)} />
                </div>
              </div>
            );
          })
        ) : (
          <div className={classes.notags}>{getIn18Text(`ZANWU${typePinyin}`)}</div>
        )}
      </div>
      <div className={classes.err}>
        {errorMessage && (
          <div className={classes.errText}>
            <IconWarn style={{ marginRight: '4px' }} /> {errorMessage}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MultiSelectManage;
