import React, { useState, useEffect } from 'react';
import { Form, message, Checkbox } from 'antd';
import InputNumber from './inputNumber';
import { apiHolder, apis, FFMSApi, FFMSLevelAdmin, FFMSRate } from 'api';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;

const generateBig = () => {
  var str = [];
  for (var i = 65; i < 91; i++) {
    str.push(String.fromCharCode(i));
  }
  return str;
};

interface Props {
  type: 'new' | 'edit';
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  dataSource: FFMSLevelAdmin.ListItem[];
  levelId?: string;
  levelIds?: string;
  customerIds?: string[];
  levelName?: string;
}

const AddLevelModel: React.FC<Props> = ({ type, visible, levelId, dataSource, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [row, setRow] = useState<FFMSLevelAdmin.Add>();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [options, setOptions] = useState<FFMSRate.Option[]>([]);

  useEffect(() => {
    if (visible && levelId && type === 'edit' && dataSource?.length) {
      let rowItem = dataSource.filter(item => item.levelId === levelId)[0];
      // 编辑等级数据
      let currentItem = {
        advance20gp: rowItem.advance20gp,
        advance40gp: rowItem.advance40gp,
        advance40hc: rowItem.advance40hc,
        defaultLevel: rowItem.defaultLevel,
        levelId: rowItem.levelId,
        levelName: rowItem.levelName,
      };
      setRow({ ...currentItem });
      form.setFieldsValue({ ...currentItem });
    }
    if (!visible) {
      setRow({} as FFMSLevelAdmin.Add);
    }
  }, [visible, levelId, type, dataSource]);

  const getLevleData = () => {
    let selectedKeys = dataSource.map(item => item.levelName);
    let options = generateBig()
      .filter(letter => !selectedKeys.includes(letter))
      .map(item => ({ label: item, value: item }));
    setOptions([...options]);
  };

  useEffect(() => {
    if (visible) {
      getLevleData();
    }
  }, [visible]);

  const submit = () => {
    form.validateFields().then(res => {
      setConfirmLoading(true);
      let params = {
        ...row,
        ...res,
      };
      ffmsApi
        .addFfCustomerLevel(params)
        .then(() => {
          message.success('保存成功');
          onSuccess();
        })
        .finally(() => {
          setConfirmLoading(false);
        });
    });
  };

  console.log('submit');
  return (
    <>
      <Modal
        title={type === 'new' ? '新增等级' : '修改等级'}
        visible={visible}
        destroyOnClose={true}
        confirmLoading={confirmLoading}
        onCancel={() => onCancel()}
        onOk={submit}
      >
        <Form form={form} preserve={false} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
          <Form.Item name="levelName" label="等级名称" required rules={[{ required: true, message: '请选择等级' }]}>
            <EnhanceSelect placeholder={'请选择等级'} options={options}></EnhanceSelect>
          </Form.Item>
          <Form.Item name="advance20gp" label="价差金额（20GP）" required rules={[{ required: true, message: '请输入加价金额' }]}>
            <InputNumber style={{ width: '100%' }} precision={0} placeholder="加价金额"></InputNumber>
          </Form.Item>
          <Form.Item name="advance40gp" label="价差金额（40GP）" required rules={[{ required: true, message: '请输入加价金额' }]}>
            <InputNumber style={{ width: '100%' }} precision={0} placeholder="加价金额"></InputNumber>
          </Form.Item>
          <Form.Item name="advance40hc" label="价差金额（40HQ）" required rules={[{ required: true, message: '请输入加价金额' }]}>
            <InputNumber style={{ width: '100%' }} precision={0} placeholder="加价金额"></InputNumber>
          </Form.Item>
          <Form.Item name="defaultLevel" valuePropName="checked" label="设置默认">
            <Checkbox></Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AddLevelModel;
