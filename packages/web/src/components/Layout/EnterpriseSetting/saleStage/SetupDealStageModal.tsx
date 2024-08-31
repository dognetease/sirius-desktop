import React, { useEffect, useState, useMemo } from 'react';
import { Form, Select } from 'antd';
import { api, apis, SaleStageTableList, StageItem, SaleStageApi } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import classnames from 'classnames';
import { typeEnum } from './saleStage';
import { getIn18Text } from 'api';
const { Option } = Select;
const saleStageApi = api.requireLogicalApi(apis.saleStageApiImpl) as SaleStageApi;
const FormItem = Form.Item;
export interface SetupDealStageModalProps {
  visible: boolean;
  stageList: SaleStageTableList;
  onClose?: () => void;
  onOk?: () => void;
}
export const SetupDealStageModal: React.FC<SetupDealStageModalProps> = props => {
  const [form] = Form.useForm<StageItem>();
  const [loading, setLoading] = useState(false);
  const { visible, stageList } = props;
  const rules = {
    id: [{ required: true, message: getIn18Text('QINGXUANZE') }],
  };
  const stageListComputed = useMemo(() => {
    return stageList.filter(stage => stage.type !== typeEnum.CLOSE_STAGE_CODE);
  }, [stageList]);
  const handleOk = () => {
    form.validateFields().then(() => {
      const found = stageListComputed.find(stage => stage.id === form.getFieldValue('id'));
      if (found) {
        setLoading(true);
        saleStageApi
          .setDealStage(found)
          .then(() => {
            Toast.success({ content: `设置成功` });
            props.onOk && props.onOk();
          })
          .finally(() => {
            setLoading(false);
          });
      }
    });
  };
  return (
    <SiriusModal visible={visible} title={getIn18Text('SHEZHICHENGJIAOJIEDUAN')} onCancel={props.onClose} onOk={handleOk} confirmLoading={loading}>
      <Form form={form}>
        <FormItem label={getIn18Text('CHENGJIAOJIEDUANXUANZE')} name="id" rules={rules.id}>
          <Select>
            {stageListComputed.map(stage => (
              <Option key={stage.id} value={stage.id}>
                {stage.name}
              </Option>
            ))}
          </Select>
        </FormItem>
      </Form>
    </SiriusModal>
  );
};
