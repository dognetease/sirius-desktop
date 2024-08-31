import React, { useState, useContext } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { Form, Spin } from 'antd';
import style from './marketingModal.module.scss';
import { apiHolder, apis, CustomerApi, ReqMainContactList as contactType, ResMainContactList as ContactResType } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import { Radio } from 'antd';
import { clientContext } from '../../clientContext';
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
  const { state } = useContext(clientContext).value;
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
  const marketingFormat = (emailItems: ContactResType[]) => {
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
    const { selectedRows, requestTableParam, activeTab } = state;
    let params = {
      reqType: activeTab,
      receive_range,
    } as contactType;
    // 部分客户
    if (customer_range === 1) {
      params = {
        ...params,
        ids: selectedRows,
      };
    }
    // 全量客户
    if (customer_range === 2) {
      params = {
        ...params,
        ...requestTableParam,
        page: undefined,
        page_size: undefined,
        is_desc: undefined,
        sort: undefined,
      };
    }
    setIsloading(true);
    clientApi.getMainContactList(params).then(res => {
      marketingFormat(res);
    });
    console.log('xxxvalues', values);
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
            <Form.Item label={getIn18Text('KEHU(QUANBUKEHU\uFF0CJISHAIXUANTIAOJIANGUOLVHOUDESHUMU)\uFF1A')} name="customer_range">
              <Radio.Group>
                <Radio value={1}>
                  {getIn18Text('YIGOUXUAN')}
                  {state.selectedRows.length}
                  {getIn18Text('GEKEHU')}
                </Radio>
                <Radio value={2}>
                  {getIn18Text('QUANBU')}
                  {state?.RresponseCompanyList?.total_size}
                  {getIn18Text('GEKEHU')}
                </Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label={getIn18Text('LIANXIREN(QUANBULIANXIREN\uFF0CJIKEHUGUANLIANDESUOYOULIANXIREN)\uFF1A')} name="receive_range">
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
