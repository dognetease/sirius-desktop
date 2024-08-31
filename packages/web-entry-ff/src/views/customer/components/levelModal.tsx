import React, { useState, useEffect } from 'react';
import { Form, message, Checkbox, InputNumber } from 'antd';
import { apiHolder, apis, FFMSApi, FFMSLevelAdmin, FFMSRate } from 'api';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { showData } from '../levelAdmin/table';

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;

interface Props {
  type: 'new' | 'edit' | 'change'; // new edit 等级修改  change 客户修改等级
  discountType: string;
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  customerIds?: string[];
  accountId: string;
}

const LevelModel: React.FC<Props> = ({ type, discountType, accountId, visible, customerIds, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [options, setOptions] = useState<FFMSRate.Option[]>([]);

  const getLevleData = () => {
    if (type === 'change') {
      ffmsApi
        .getFfCustomerLevelList({
          pageSize: 26,
          page: 1,
        })
        .then(res => {
          setOptions(() =>
            res.content.map(item => {
              return {
                label: `${item.levelName}（${showData(discountType === 'PERCENT', item.advance20gp, item.advance40gp, item.advance40hc)}）`,
                value: item.levelId,
              };
            })
          );
        });
    }
  };

  useEffect(() => {
    if (visible) {
      getLevleData();
    }
  }, [type, visible]);

  const submit = () => {
    form.validateFields().then(res => {
      setConfirmLoading(true);
      if (type === 'change' && customerIds?.length) {
        ffmsApi
          .changeFfCustomerLevel({
            customerIdList: customerIds,
            levelId: res.levelName,
            accountId,
          })
          .then(() => {
            message.success('更改成功');
            onSuccess();
          })
          .finally(() => {
            setConfirmLoading(false);
          });
      }
    });
  };

  return (
    <>
      <Modal title="修改等级" visible={visible} destroyOnClose confirmLoading={confirmLoading} onCancel={() => onCancel()} onOk={submit}>
        <Form form={form} preserve={false}>
          <Form.Item name="levelName" label="等级名称" required rules={[{ required: true, message: '请选择等级' }]}>
            <EnhanceSelect size="large" placeholder="请选择等级" options={options} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default LevelModel;
