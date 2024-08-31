import React, { useState, useEffect, useRef, useMemo } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { OneKeyMarketingParams } from '@lxunit/bridge-types';
import { message } from 'antd';
import { Form, Spin } from 'antd';
import style from './marketingModal.module.scss';
import { apiHolder, apis, CustomerApi, ReqMainContactList as contactType, ResMainContactList as ContactResType } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import { Radio } from 'antd';
import { contactListCache } from './../../api/helper';
import { useEdmSendCountV2 } from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import { getIn18Text } from 'api';

export interface HandlerData {
  action: 'send-email' | 'one-key-marketing' | 'contact-one-key-marketing';
  payload: {
    allSelected?: boolean; // 是否全选，暂时用不上，外贸侧的弹框自己处理全选
    totalCount?: number; // 所有数据的个数
    filter?: string; // 筛选条件，全选场景需要使用; 外贸侧可以不用理解Filter类型，仅在获取数据时做透传
    tableId: string;
    recordIds: string[]; // 当前所选的记录Id, 外贸侧根据该id去uni查询具体数据
  };
}

interface ComsProps {
  visible: boolean;
  onCancel: (param?: boolean) => void;
  // onSubmit: () => void;
  data: OneKeyMarketingParams;
}

export interface emailsType {
  contactName: string;
  contactEmail: string;
}

interface submitParams {
  customer_range: number;
  receive_range: number;
}

const ClueMarketingModal: React.FC<ComsProps> = ({ visible, onCancel, data }) => {
  // const { totalCount, recordIds } = data.payload;
  const tableId: 'customer' | 'leads' = (data as any).tableId ?? 'customer';
  const [form] = Form.useForm();
  const [emailList, setEmailList] = useState<emailsType[]>([]);
  useEdmSendCountV2({
    emailList,
    from: 'customer',
    back: (data as any)?.backUrl ? encodeURIComponent(`#/unitable-crm${(data as any).backUrl}`) : '',
    tableId,
  });

  const [isLoading, setIsloading] = useState<boolean>(false);
  /*
   *   提交事件
   */
  const formSubmit = () => {
    const values = form.getFieldsValue();
    const { customer_range } = values || {};
    const isAll = customer_range === 2;
    const { totalCount } = data || {};
    // 目前选择全部已经在接口上限制最多查询5000条数据，因此这里不需要再做限制
    // if (isAll && typeof totalCount === 'number' && totalCount > 10000) {
    //   message.warn(`超过1w条${tableId === 'customer' ? '客户' : '线索'}上限，可通过${tableId === 'customer' ? '客户' : '线索'}分群或筛选方式缩小选择范围`);
    //   return;
    // }
    form.submit();
  };
  const onCancelCallBack = () => {
    onCancel();
  };

  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setIsloading(false);
    }
  }, [visible]);
  /*
   * 一键营销格式化
   */
  const marketingFormat = (emailItems: emailsType[]) => {
    let emails = emailItems.filter(item => item.contactEmail);
    setEmailList(emails.length ? emails : [{ contactEmail: 'noEmials', contactName: '' }]);
    setIsloading(false);
    if (emails.length) {
      contactListCache.submitAfterHandle && contactListCache.submitAfterHandle();
      onCancel();
    }
  };
  const onFinish = (values: submitParams) => {
    // TODO: 根据查询条件获取所有的联系人数据
    console.log('onFinish');

    // const { customer_range, receive_range } = values;
    // let params = {
    // 	customerIds: data.payload?.recordIds,
    // 	filterCondition: data.payload?.filter,
    // 	mainContact: receive_range === 1,
    // 	allSelected: customer_range === 2
    // }
    // setIsloading(true);
    if (contactListCache.getContactList) {
      setIsloading(true);
      const { customer_range, receive_range } = values;
      const mainContact = receive_range === 1;
      const allSelected = customer_range === 2;
      contactListCache.getContactList(allSelected, !mainContact).then(list => {
        if (list.length) {
          marketingFormat(list);
        } else {
          message.warn('联系人不存在');
          setIsloading(false);
        }
      });
    }

    // clientApi.uniEdmList(params).then((res) => {
    // 	if (res.company_list && res.company_list.length) {
    // 		let emailList:emailsType[] = [];
    // 		res.company_list.forEach((companyItem => {
    // 			companyItem.contact_list?.forEach(contactItem => {
    // 				emailList.push({
    // 					contactEmail: contactItem.email,
    // 					contactName: contactItem.contact_name
    // 				})
    // 			});
    // 		}))
    // 		marketingFormat(emailList || []);
    // 	}
    // })
  };
  const isOverLimit = data.totalCount > data.maxLimitCount;
  const optionLabelValue = useMemo(() => {
    if (isOverLimit) {
      return (
        <>
          前1-{data.maxLimitCount} {tableId === 'customer' ? getIn18Text('GEKEHU') : getIn18Text('XIANSUO')}(单次选择最多{data.maxLimitCount})
        </>
      );
    } else {
      return (
        <>
          {getIn18Text('QUANBU')} {data?.totalCount || 0} {tableId === 'customer' ? getIn18Text('GEKEHU') : getIn18Text('XIANSUO')}
        </>
      );
    }
  }, [data, tableId]);
  return (
    <>
      <Modal
        title={getIn18Text('SHOUJIANRENXUANZE')}
        getContainer={() => {
          return window.document.body;
        }}
        wrapClassName={style.clueModalWrap}
        width={490}
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
              <Form.Item
                className={typeof data.totalCount === 'number' && data.totalCount > 1 ? undefined : style['hide']}
                label={
                  tableId === 'customer'
                    ? getIn18Text('KEHU(QUANBUKEHU，JISHAIXUANTIAOJIANGUOLVHOUDESHUMU)：')
                    : getIn18Text('XIANSUO(QUANBUXIANSUO，JISHAIXUANTIAOJIANGUOLVHOUDESHUMU)：')
                }
                name="customer_range"
              >
                <Radio.Group>
                  <Radio value={1}>
                    {getIn18Text('YIGOUXUAN')} {data?.selectedCustomerCount || 0} {tableId === 'customer' ? getIn18Text('GEKEHU') : getIn18Text('XIANSUO')}
                  </Radio>
                  <Radio value={2}>{optionLabelValue}</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label={
                  tableId === 'customer'
                    ? getIn18Text('LIANXIREN(QUANBULIANXIREN，JIKEHUGUANLIANDESUOYOULIANXIREN)：')
                    : getIn18Text('LIANXIREN(QUANBULIANXIREN，JIXIANSUOGUANLIANDESUOYOULIANXIREN)：')
                }
                name="receive_range"
              >
                <Radio.Group>
                  <Radio value={1}>{getIn18Text('GEIZHULIANXIREN')}</Radio>
                  <Radio value={2}>{getIn18Text('GEIQUANBULIANXIREN')}</Radio>
                </Radio.Group>
              </Form.Item>
            </Form>
          </Spin>
        </div>
      </Modal>
    </>
  );
};

export default ClueMarketingModal;
