import React, { useState, useEffect } from 'react';
import { apis, apiHolder, AddressBookApi, AddressBookNewApi } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { Form, Input } from 'antd';
const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;

export const AddGroup: React.FC<{ onclose(flag?: boolean): void }> = props => {
  const { onclose } = props;
  const [form] = Form.useForm<{ groupName: string }>();
  const createGroup = async () => {
    const values = await form.validateFields();
    await addressBookNewApi.createGroup(values.groupName);
    onclose(true);
  };
  return (
    <Modal
      visible={true}
      title="新建分组"
      onOk={createGroup}
      onCancel={() => {
        onclose(false);
      }}
    >
      <Form form={form}>
        <Form.Item
          name="groupName"
          label="分组名称"
          rules={[
            { required: true, message: '分组名称不能为空' },
            { max: 20, message: '最大长度为20' },
          ]}
        >
          <Input placeholder="请输入20字以内的文件名称" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
