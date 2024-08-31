import React, { useEffect, useContext, useState } from 'react';
import { Form } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './changeStatusModal.module.scss';
import { apiHolder, apis, CustomerApi, clueBatchUpdateReq } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import Select from '../../../components/UI/Select/customerSelect';
const { Option } = Select;
import { Input } from 'antd';
const { TextArea } = Input;
import { customerContext } from '../../../customerContext';
import { getIn18Text } from 'api';
interface ComsProps {
  type: 'clue_status' | 'clue_source' | 'clue_batch';
  visible: boolean;
  onCancel: (param?: boolean) => void;
  ids: string[];
  statusCode?: string;
}
interface submitParams {
  status: string;
  close_reason: string;
}
const CLOSE_STATUS_CODE = '5';
const ChangeStatusModal: React.FC<ComsProps> = ({ visible, type, onCancel, ids, statusCode }) => {
  const { state } = useContext(customerContext).value;
  const [form] = Form.useForm();
  const { baseSelect } = state;
  let [status, setStatus] = useState<string>();
  let label = type === 'clue_status' ? getIn18Text('XIANSUOZHUANGTAI') : type === 'clue_source' ? getIn18Text('XIANSUOLAIYUAN') : getIn18Text('XIANSUOPICI');
  /*
   *   提交事件
   */
  const formSubmit = () => {
    form.submit();
  };
  /*
   * onCancelCallBack
   */
  const clueChange = (type: string) => {
    console.log('close_type', type);
    setStatus(type);
  };
  /**
   *  initCode from detail page
   */
  useEffect(() => {
    statusCode && setStatus(statusCode);
  }, [statusCode]);
  const onCancelCallBack = () => {
    onCancel();
  };
  const onFinish = (values: submitParams) => {
    const { status, close_reason } = values;
    let Promsie;
    if (type === 'clue_status') {
      let params = {
        ids,
        status,
        close_reason,
      };
      if (statusCode) {
        params.status = statusCode;
      }
      Promsie = clientApi.editClueStatus(params);
    } else {
      // clue_batch
      let params = {
        ids,
      } as clueBatchUpdateReq;
      if (type === 'clue_source') {
        params.source = Number(status);
      } else {
        params.clue_batch = Number(status);
      }
      Promsie = clientApi.clueBatchUpdate(params);
    }
    Promsie.then(res => {
      if (res) {
        SiriusMessage.success({
          content: getIn18Text('XIUGAICHENGGONG'),
        });
        onCancel(true);
      }
    });
  };
  const rednerOptions = () => {
    if (type === 'clue_status') {
      return (
        baseSelect &&
        baseSelect['clue_status']
          .filter(item => String(item.value) !== '4')
          .map((el, elIndex) => {
            return (
              <Option key={elIndex} value={el.value}>
                {' '}
                {el.label}
              </Option>
            );
          })
      );
    } else {
      return (
        baseSelect &&
        baseSelect[type].map((el, elIndex) => {
          return (
            <Option key={elIndex} value={el.value}>
              {' '}
              {el.label}
            </Option>
          );
        })
      );
    }
  };
  const renderHtml = (type: ComsProps['type']) => {
    return (
      !statusCode && (
        <Form.Item
          label={label}
          name="status"
          rules={[
            {
              required: true,
              message: `请选择${label}`,
            },
          ]}
        >
          <Select placeholder={`选择${label}`} style={{ width: '100%' }} onChange={e => clueChange(e as string)}>
            {rednerOptions()}
          </Select>
        </Form.Item>
      )
    );
  };
  return (
    <Modal
      title={`修改${label}`}
      getContainer={false}
      wrapClassName={style.clueModalWrap}
      width={472}
      onOk={formSubmit}
      bodyStyle={{
        paddingTop: 0,
        paddingBottom: 0,
      }}
      visible={visible}
      okText={getIn18Text('QUEDING')}
      cancelText={getIn18Text('QUXIAO')}
      okButtonProps={{ disabled: !status }}
      destroyOnClose={true}
      onCancel={onCancelCallBack}
    >
      <div className={style.contentWrap}>
        <Form form={form} name="distribute" onFinish={onFinish} layout={'vertical'} autoComplete="off">
          {renderHtml(type)}
          {String(CLOSE_STATUS_CODE) === String(status) && type === 'clue_status' && (
            <Form.Item
              label={getIn18Text('GUANBIYUANYIN')}
              name="close_reason"
              rules={[
                {
                  required: true,
                  message: getIn18Text('QINGSHURUGUANBIYUANYIN'),
                },
              ]}
            >
              <TextArea placeholder={getIn18Text('TIANJIABEIZHU')} maxLength={100} rows={4} />
            </Form.Item>
          )}
        </Form>
      </div>
    </Modal>
  );
};
ChangeStatusModal.defaultProps = {
  type: 'clue_status',
};
export default ChangeStatusModal;
