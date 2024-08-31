import React, { useState, useContext } from 'react';
import { Form, Spin } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { apiHolder, apis, CustomerApi, clueContactListRes as contactType } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import style from './marketingModal.module.scss';
import { Radio } from 'antd';
import { clueContext } from '../../clueContext';
import useEdmSendCount from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import { getIn18Text } from 'api';
interface ComsProps {
  visible: boolean;
  onCancel: (param?: boolean) => void;
  onSubmit: () => void;
}
interface submitParams {
  customer_range: number;
  receive_range: number;
}
const ClueMarketingModal: React.FC<ComsProps> = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const { state } = useContext(clueContext);
  const [emailList, setEmailList] = useState<
    {
      contactName: string;
      contactEmail: string;
    }[]
  >([]);
  useEdmSendCount(emailList);
  const [isLoading, setIsloading] = useState<boolean>(false);
  /*
   *   提交事件
   */
  const formSubmit = () => {
    form.submit();
  };
  const onCancelCallBack = () => {
    onCancel();
  };
  /*
   * 一键营销格式化
   */
  const marketingFormat = (emailItems: contactType[]) => {
    let emails = emailItems
      .map(item => {
        return {
          contactName: item.contact_name,
          contactEmail: item.email,
        };
      })
      .filter(item => item.contactEmail);
    setEmailList(emails.length ? emails : [{ contactEmail: 'noEmials', contactName: '' }]);
    setIsloading(false);
    if (emails.length) {
      onCancel();
    }
  };
  const onFinish = (values: submitParams) => {
    const { customer_range, receive_range } = values;
    const { selectedRows, requestParams, activeTab } = state;
    if (customer_range === 1) {
      setIsloading(true);
      clientApi.clueContactList({ reqType: activeTab, receive_range, ids: selectedRows }).then(res => {
        marketingFormat(res);
      });
    }
    if (customer_range === 2) {
      setIsloading(true);
      let params = {
        reqType: activeTab,
        receive_range,
        ...requestParams,
      };
      delete params.page;
      delete params.page_size;
      clientApi.clueContactList(params).then(res => {
        marketingFormat(res);
      });
    }
  };
  return (
    <Modal
      title={getIn18Text('SHOUJIANRENXUANZE')}
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
      destroyOnClose={true}
      onCancel={onCancelCallBack}
    >
      <div className={style.content}>
        <Spin spinning={isLoading}>
          <Form form={form} name="distribute" onFinish={onFinish} layout={'vertical'} autoComplete="off" initialValues={{ customer_range: 1, receive_range: 1 }}>
            <Form.Item label={getIn18Text('XIANSUO(QUANBUXIANSUO\uFF0CJISHAIXUANTIAOJIANGUOLVHOUDESHUMU)\uFF1A')} name="customer_range">
              <Radio.Group>
                <Radio value={1}>
                  {getIn18Text('YIGOUXUAN')}
                  {state.selectedRows.length}
                  {getIn18Text('GEXIANSUO')}
                </Radio>
                <Radio value={2}>
                  {getIn18Text('QUANBU')}
                  {state.total}
                  {getIn18Text('GEXIANSUO')}
                </Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label={getIn18Text('LIANXIREN(QUANBULIANXIREN\uFF0CJIXIANSUOGUANLIANDESUOYOULIANXIREN)\uFF1A')} name="receive_range">
              <Radio.Group>
                <Radio value={1}>{getIn18Text('GEIZHULIANXIREN')}</Radio>
                <Radio value={2}>{getIn18Text('GEIQUANBULIANXIREN')}</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
        </Spin>
      </div>
    </Modal>
  );
};
export default ClueMarketingModal;
