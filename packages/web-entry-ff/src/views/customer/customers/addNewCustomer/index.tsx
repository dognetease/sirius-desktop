import React, { useState, useEffect } from 'react';
import { Form, message } from 'antd';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import { apiHolder, apis, FFMSApi, FFMSRate, FFMSLevelAdmin, FFMSCustomer } from 'api';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
import { emailPattern } from '@web-common/utils/constant';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import { CountrySelect } from './countrySelect';
import { showData } from '../../levelAdmin/table';

interface Props {
  discountType: string;
  visible: boolean;
  accountId: string;
  row?: FFMSCustomer.ListItem;
  onCancel: () => void;
  onSuccess: () => void;
}

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
const AddNewCustomer: React.FC<Props> = ({ discountType, accountId, visible, row, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [options, setOptions] = useState<FFMSRate.Option[]>([]);
  const [customsOptions, setCustomsOptions] = useState<FFMSRate.Option[]>([]);

  const getLevleData = () => {
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
  };

  const getCustomerType = () => {
    ffmsApi.getFfCustomerTypeList({ customerType: FFMSLevelAdmin.CUSTOMER_TYPE.TERMINAL_CLIENT, accountId }).then(res => {
      setCustomsOptions(() => {
        return (res?.content || []).map(item => ({
          label: item.customerTypeName,
          value: item.customerTypeId,
        }));
      });
    });
  };

  const submit = () => {
    form
      .validateFields()
      .then(res => {
        setConfirmLoading(true);
        const params = {
          ...res,
          customerId: row?.customerId,
          accountId,
        };
        ffmsApi.saveFfCustomer(params).then(() => {
          message.success('保存成功');
          onSuccess();
        });
      })
      .finally(() => setConfirmLoading(false));
  };

  useEffect(() => {
    if (visible && row?.customerId) {
      form.setFieldsValue(row);
    } else {
      setConfirmLoading(false);
    }
    getLevleData();
    getCustomerType();
  }, [visible, row]);

  return (
    <>
      <Modal title={row?.customerId ? '修改客户' : '新增客户'} visible={visible} destroyOnClose confirmLoading={confirmLoading} onCancel={() => onCancel()} onOk={submit}>
        <Form form={form} preserve={false} labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
          <Form.Item name="customerName" label="企业名称">
            <Input placeholder="企业名称用于识别与查找" />
          </Form.Item>
          {/* <Form.Item name="country" label="国家">
            <CountrySelect />
          </Form.Item> */}
          <Form.Item name="phoneNumber" label="手机号" required rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="用于客户登录平台进行价格查询" />
          </Form.Item>
          <Form.Item
            name="email"
            label="联系邮箱"
            validateFirst
            required
            rules={[
              { required: true, message: '请输入邮箱' },
              () => ({
                validator(_, value) {
                  if (emailPattern.test(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('请输入正确的邮箱格式'));
                },
              }),
            ]}
          >
            <Input placeholder="对客户主动发起营销时的目标邮箱" />
          </Form.Item>
          <Form.Item name="customerTypeId" label="客户类型">
            <EnhanceSelect size="large" placeholder="请选择类型" options={customsOptions} />
          </Form.Item>
          <Form.Item name="levelId" label="等级名称">
            <EnhanceSelect size="large" placeholder="请选择等级" options={options} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AddNewCustomer;
