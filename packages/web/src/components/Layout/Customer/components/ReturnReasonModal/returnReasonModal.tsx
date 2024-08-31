import React, { useState } from 'react';
import { Form } from 'antd';
import Modal from '@/components/Layout/components/Modal/modal';
import style from './returnReasonModal.module.scss';
import { apiHolder, apis, CustomerApi } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import Select from '../UI/Select/customerSelect';
import { Input } from 'antd';
import ReactDOM from 'react-dom';
import { getIn18Text } from 'api';
const { TextArea } = Input;
interface ComsProps {
  visible: boolean;
  onCancel: (param?: boolean) => void;
  ids: string[];
  isCustomer?: boolean;
}
interface submitParams {
  return_reason: string;
  return_remark: string;
}
interface optionItem {
  label: string;
  value: string;
}
const defautOption = [
  {
    label: getIn18Text('LIANXIBUSHANGKEHU'),
    value: getIn18Text('LIANXIBUSHANGKEHU'),
  },
  {
    label: getIn18Text('KEHUZANWUXUQIU'),
    value: getIn18Text('KEHUZANWUXUQIU'),
  },
  {
    label: getIn18Text('WEIMANZUKEHUXUQIU'),
    value: getIn18Text('WEIMANZUKEHUXUQIU'),
  },
  {
    label: getIn18Text('QITA'),
    value: getIn18Text('QITA'),
  },
];
const ChangeStatusModal: React.FC<ComsProps> = ({ visible, onCancel, ids, isCustomer }) => {
  const [form] = Form.useForm();
  let [status, setStatus] = useState<number>();
  let [reasonOptions, setReasonOptions] = useState<optionItem[]>(defautOption);
  /*
   *   提交事件
   */
  const formSubmit = () => {
    form.submit();
  };
  /*
   * onCancelCallBack
   */
  const clueChange = type => {
    setStatus(type);
  };
  const onCancelCallBack = () => {
    onCancel();
  };
  const onFinish = (values: submitParams) => {
    const { return_reason, return_remark } = values;
    let params = {
      ids,
      return_reason,
      return_remark,
    };
    let promise;
    if (isCustomer) {
      promise = clientApi.returnCustomerOpenSea(params);
    } else {
      promise = clientApi.returnOpenSea(params);
    }
    promise.then(res => {
      if (res) {
        onCancel(true);
        SiriusMessage.success({
          content: getIn18Text('TUIHUIGONGHAICHENGGONG'),
        });
      }
    });
  };
  return (
    <Modal
      title={getIn18Text('TUIHUIGONGHAI')}
      getContainer={false}
      wrapClassName={style.clueModalWrap}
      width={480}
      onOk={formSubmit}
      visible={visible}
      okText={getIn18Text('QUEDING')}
      cancelText={getIn18Text('QUXIAO')}
      okButtonProps={{ disabled: !status }}
      destroyOnClose={true}
      onCancel={onCancelCallBack}
    >
      <div className={style.content}>
        <Form form={form} name="distribute" onFinish={onFinish} layout={'vertical'} autoComplete="off">
          <Form.Item
            label={getIn18Text('TUIGONGHAIYUANYIN')}
            name="return_reason"
            rules={[
              {
                required: true,
                message: getIn18Text('QINGXUANZETUIGONGHAIYUANYIN'),
              },
            ]}
          >
            <Select placeholder={getIn18Text('QINGXUANZETUIGONGHAIYUANYIN')} style={{ width: '100%' }} options={reasonOptions} onChange={clueChange}></Select>
          </Form.Item>
          <Form.Item
            label={getIn18Text('TUIGONGHAIBEIZHU')}
            name="return_remark"
            rules={[
              {
                required: false,
                message: getIn18Text('TIANJIABEIZHU'),
              },
            ]}
          >
            <TextArea placeholder={getIn18Text('TIANJIABEIZHU')} maxLength={100} rows={4} />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
export default ChangeStatusModal;
export const createReturnToOpenSeaModal = (props: Omit<ComsProps, 'visible'>, container?: HTMLElement) => {
  const div = document.createElement('div');
  const parent = container || document.body;
  const destroy = () => {
    ReactDOM.unmountComponentAtNode(div);
    parent.removeChild(div);
  };
  const options: ComsProps = {
    ids: props.ids,
    visible: true,
    onCancel(succ?: boolean) {
      props.onCancel(succ);
      destroy();
    },
  };
  parent.appendChild(div);
  // eslint-disable-next-line react/jsx-props-no-spreading
  ReactDOM.render(<ChangeStatusModal {...options} />, div);
  return destroy;
};
