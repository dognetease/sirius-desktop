import React, { useCallback, useEffect, useState } from 'react';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { Form, Input, InputNumber, Space } from 'antd';
import { api, apis, EdmSendBoxApi, QuotaForMember } from 'api';
import { getIn18Text } from 'api';
const edmApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
export interface EditQuotaModalProps {
  visible: boolean;
  item?: QuotaForMember;
  onClose?: () => void;
  onOk?: () => void;
}
interface Req {
  accId: string;
  totalQuota?: number;
  dayQuota?: number;
  singleQuota?: number;
  defaultQuota?: number;
}
interface MaxQuota {
  maxDayQuota: number;
  maxSingleQuota: number;
  maxTotalQuota: number;
}
export const EditQuotaModal = (props: EditQuotaModalProps) => {
  const { visible, item, onOk } = props;
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [used, setUsed] = useState<number>();
  const [maxQuota, setMaxQuota] = useState<MaxQuota>({} as MaxQuota);
  useEffect(() => {
    if (visible && item !== undefined) {
      edmApi.getEdmUserUsed(item.accId).then(res => {
        setUsed(res.totalUsed);
        setMaxQuota(res as MaxQuota);
        form.setFieldsValue({
          totalQuota: item.totalQuota || undefined,
          singleQuota: item.singleQuota,
          dayQuota: item.dayQuota,
        });
      });
    }
    if (!visible) {
      setUsed(void 0);
      form.setFieldsValue({
        totalQuota: undefined,
        singleQuota: undefined,
        dayQuota: undefined,
      });
    }
  }, [visible, item]);
  const handleOk = () => {
    if (!item) return;
    form.validateFields().then(formValues => {
      setLoading(true);
      let req: Req = {
        ...formValues,
        accId: item.accId,
      };
      edmApi
        .setQuotaForEdmUser(req)
        .then(() => {
          onOk && onOk();
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };
  const setDefault = () => {
    form.setFieldsValue({
      totalQuota: maxQuota.maxTotalQuota,
      singleQuota: maxQuota.maxSingleQuota,
      dayQuota: maxQuota.maxDayQuota,
    });
  };
  const layout = {
    labelCol: { span: 6 },
    labelAlign: 'left' as any,
    wrapperCol: { span: 18 },
  };
  return (
    <SiriusModal visible={visible} title={getIn18Text('BIANJIPEIE')} onCancel={props.onClose} onOk={handleOk} confirmLoading={loading}>
      <Form form={form} {...layout}>
        <Form.Item label={getIn18Text('RENYUAN')}>{item?.name}</Form.Item>
        <span
          style={{
            cursor: 'pointer',
            color: '#4C6AFF',
            position: 'absolute',
            bottom: '16px',
            zIndex: 100,
          }}
          onClick={() => setDefault()}
        >
          {'恢复默认'}
        </span>
        <Form.Item label={getIn18Text('YIYONG(FENG)')}>{used}</Form.Item>
        <Form.Item label={getIn18Text('XIANE(FENG)')}>
          <Space>
            <Form.Item name="totalQuota" rules={[{ required: true, message: getIn18Text('QINGSHURUXIANE(FENG)') }]} noStyle>
              <InputNumber style={{ width: 160 }} min={used} max={maxQuota.maxTotalQuota} />
            </Form.Item>
            <span style={{ color: '#A9B2C2' }}>
              {getIn18Text('ZUIDAZHI\uFF1A')}
              {maxQuota.maxTotalQuota}
            </span>
          </Space>
        </Form.Item>
        <Form.Item label={getIn18Text('DANCIXIANE(FENG)')}>
          <Space>
            <Form.Item name="singleQuota" rules={[{ required: true, message: getIn18Text('QINGSHURUDANCIXIANE(FENG)') }]} noStyle>
              <InputNumber style={{ width: 160 }} min={0} max={maxQuota.maxSingleQuota} />
            </Form.Item>
            <span style={{ color: '#A9B2C2' }}>
              {getIn18Text('ZUIDAZHI\uFF1A')}
              {maxQuota.maxSingleQuota}
            </span>
          </Space>
        </Form.Item>
        <Form.Item label={getIn18Text('DANRIXIANE(FENG)')}>
          <Space>
            <Form.Item name="dayQuota" rules={[{ required: true, message: getIn18Text('QINGSHURUDANRIXIANE(FENG)') }]} noStyle>
              <InputNumber style={{ width: 160 }} min={0} max={maxQuota.maxDayQuota} />
            </Form.Item>
            <span style={{ color: '#A9B2C2' }}>
              {getIn18Text('ZUIDAZHI\uFF1A')}
              {maxQuota.maxDayQuota}
            </span>
          </Space>
        </Form.Item>
      </Form>
    </SiriusModal>
  );
};
