import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Tooltip, message } from 'antd';
import style from './personalTemplate.module.scss';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import PersonalTemplateGroup from './personalTemplateGroup';
import ManageGroup from './../group/manageGroup';
import { getIn18Text } from 'api';
import { edmDataTracker } from '../../../tracker/tracker';

interface PersonaltemplatePropsModel {
  onSave: (templateName: string, selectedTagIds: number[]) => void;
  onCancel: () => void;
  personalTemplateAddModalOpen: boolean;
}

export const PersonalTemplateAddModal = (props: PersonaltemplatePropsModel) => {
  const { personalTemplateAddModalOpen, onCancel, onSave } = props;
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [okButtonDisabled, setOkButtonDisabled] = useState<boolean>(true);
  const [manageVisible, setManageVisible] = useState<boolean>(false);
  const [form] = Form.useForm<{
    name: string;
  }>();

  const handleSure = () => {
    const templateName = form.getFieldValue('name');
    if (!templateName.trim() || templateName.length > 16) {
      message.error({
        content: templateName.length > 16 ? getIn18Text('ZUIDUOKESHURU16GEZIFU!') : getIn18Text('QINGSHURUMOBANMINGCHENG!'),
      });
      return;
    }
    edmDataTracker.track('pc_markting_edm_createTemplate');
    onSave(templateName, selectedTagIds);
    onCancel();
  };

  const handleSelectedIds = (ids: number[]) => {
    setSelectedTagIds(ids);
  };

  return (
    <Modal
      wrapClassName={style.modal}
      title={'新建个人模板'}
      okText={'保存个人模板'}
      visible={personalTemplateAddModalOpen}
      width={480}
      okButtonProps={{
        disabled: okButtonDisabled,
      }}
      onOk={handleSure}
      destroyOnClose={true}
      onCancel={onCancel}
    >
      <Form form={form} requiredMark={false}>
        <Form.Item label={<span className={style.customTitle}>模板名称</span>} name="name">
          <Input
            className={style.customInput}
            placeholder={'请输入内容'}
            autoComplete="off"
            onChange={() => {
              const templateName = form.getFieldValue('name');
              if (templateName.trim() || templateName.length > 0) {
                setOkButtonDisabled(false);
              } else {
                setOkButtonDisabled(true);
              }
            }}
          />
        </Form.Item>
        <Form.Item className={style.customStyle} label={<span className={style.customTitle}>选择分组</span>}>
          <PersonalTemplateGroup
            originTagIds={[]}
            manageVisible={manageVisible}
            sendSelectedIds={ids => {
              handleSelectedIds(ids);
            }}
            manageGroup={() => {
              setManageVisible(true);
            }}
          />
        </Form.Item>
      </Form>
      <ManageGroup
        visible={manageVisible}
        closeModal={() => {
          setManageVisible(false);
        }}
      />
    </Modal>
  );
};
