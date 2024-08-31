import React, { useState, useContext } from 'react';
import Modal from '@/components/Layout/components/Modal/modal';
import { Form, Spin } from 'antd';
import style from './marketingModal.module.scss';
import { apiHolder, apis, CustomerApi, opportunityListReq as contactType, opportunityContactListItem } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import { Radio } from 'antd';
import { businessContext } from '../../businessContext';
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
const BusinessMarketingModal: React.FC<ComsProps> = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const { state } = useContext(businessContext);
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
  const marketingFormat = (emailItems: opportunityContactListItem[]) => {
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
    let params = {} as contactType;
    if (customer_range === 1) {
      params.opportunity_id_list = selectedRows;
      params.receive_range = receive_range;
    }
    if (customer_range === 2) {
      params = {
        ...params,
        ...requestParams,
        receive_range,
      };
      delete params.page;
      delete params.page_size;
    }
    if (activeTab === 1) {
      setIsloading(true);
      clientApi.opportunityContactList(params).then(res => {
        marketingFormat(res);
      });
    } else {
      setIsloading(true);
      clientApi.opportunityContactListAll(params).then(res => {
        marketingFormat(res);
      });
    }
  };
  return (
    <Modal
      title={getIn18Text('SHOUJIANRENXUANZE')}
      getContainer={false}
      wrapClassName={style.clueModalWrap}
      width={480}
      onOk={formSubmit}
      visible={visible}
      okText={getIn18Text('QUEDING')}
      cancelText={getIn18Text('QUXIAO')}
      destroyOnClose={true}
      onCancel={onCancelCallBack}
    >
      <div className={style.content}>
        <Spin spinning={isLoading}>
          <Form form={form} name="distribute" onFinish={onFinish} layout={'vertical'} autoComplete="off" initialValues={{ customer_range: 1, receive_range: 1 }}>
            <Form.Item label={getIn18Text('SHANGJI(QUANBUSHANGJI\uFF0CJISHAIXUANTIAOJIANGUOLVHOUDESHUMU)\uFF1A')} name="customer_range">
              <Radio.Group>
                <Radio value={1}>
                  {getIn18Text('YIGOUXUAN')}
                  {state.selectedRows.length}
                  {getIn18Text('GESHANGJI')}
                </Radio>
                <Radio value={2}>
                  {getIn18Text('QUANBU')}
                  {state.total}
                  {getIn18Text('GESHANGJI')}
                </Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label={getIn18Text('LIANXIREN(QUANBULIANXIREN\uFF0CJISHANGJIGUANLIANDESUOYOULIANXIREN)\uFF1A')} name="receive_range">
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
export default BusinessMarketingModal;
