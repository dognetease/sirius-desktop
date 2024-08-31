import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Radio } from 'antd';
import { Sender } from 'api';
import style from './bindingForm.module.scss';
import { getIn18Text } from 'api';
export interface BindingFormProps {
  showFooter?: boolean;
  visible: boolean;
  item: Sender;
}
export const BindingForm: React.FC<BindingFormProps> = React.forwardRef((props, ref) => {
  const [form] = Form.useForm();
  const isUpdateItem = Boolean(props.item?.id);
  useEffect(() => {
    if (props.visible) {
      form.setFieldsValue(props.item);
    } else {
      form.resetFields();
    }
  }, [props.visible]);
  return (
    <div className={style.container}>
      <h3 className={style.title}>{getIn18Text('WhatsApp  BusinessBANGDINGCANSHUSHEZHI')}</h3>
      <Form ref={ref} form={form} layout="vertical">
        <Form.Item label={getIn18Text('MINGCHENG')} name="orgName" rules={[{ required: true, message: getIn18Text('QINGSHURU') }]}>
          <Input placeholder={getIn18Text('QINGSHURUwhatsapp business QIYEMINGCHENG')} />
        </Form.Item>
        <Form.Item
          label={getIn18Text('Facebook Business Manager ZHANGHAO\uFF08FBM ID\uFF09')}
          name="fbmId"
          rules={[{ required: true, message: getIn18Text('QINGSHURU') }]}
        >
          <Input placeholder={getIn18Text('QINGSHURUFBM ID')} disabled={isUpdateItem} />
        </Form.Item>
        <Form.Item label={getIn18Text('WhatsApp Business ZHANGHAO\uFF08WABA\uFF09')} name="wabaId" rules={[{ required: true, message: getIn18Text('QINGSHURU') }]}>
          <Input placeholder={getIn18Text('QINGSHURUWABA ID')} disabled={isUpdateItem} />
        </Form.Item>
        <Form.Item label={getIn18Text('Sender SHOUJIHAO')} name="sender" style={{ marginBottom: 16 }} rules={[{ required: true, message: getIn18Text('QINGSHURU') }]}>
          <Input placeholder={getIn18Text('QINGSHURUwhatsapp business BANGDINGHAOMA')} />
        </Form.Item>
        <p className={style.formItemTips}>
          {getIn18Text(
            'RUONINYIJINGYONGYOUwhatsapp business ZHANGHAO\uFF0CZEZAICISHURUBANGDINGDESHOUJIHAOJIKE\u3002RUONINMEIYOUwhatsapp business ZHANGHAO\uFF0CZEQINGSHURUYIGEXINDESHOUJIHAOJINXINGJIKE\uFF08XUMEIYOUBANGDINGGUOQIYUwhatsappZHANGHUYIJIZHICHISHOUFADUANXIN\uFF09'
          )}
        </p>
        <p className={style.highlight}>{getIn18Text('*QINGYUDIERBUTIJIAODESHOUJIHAOXIANGTONG\uFF01')}</p>
      </Form>
    </div>
  );
});
