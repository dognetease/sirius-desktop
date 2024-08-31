/*
 * @Author: sunmingxin
 * @Date: 2021-10-08 17:59:17
 * @LastEditTime: 2021-10-25 21:56:08
 * @LastEditors: sunmingxin
 */
import React, { useState, useEffect } from 'react';
import { Radio, Space } from 'antd';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { apiHolder, apis, CustomerApi } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
import { customerDataTracker, CustomerListAction, CustomerPvType, CustomerBatchOperation } from '../../../tracker/customerDataTracker';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './mergeClientModal.module.scss';
import { getIn18Text } from 'api';
interface baseItem {
  label: string;
  value: string;
}
interface companyItem {
  company_name: string;
  company_id: string;
}
interface companyCompareItem {
  name: string;
  title: string;
  checked?: boolean | string;
  values: baseItem[];
}
export interface ComProps {
  visible: boolean;
  onCancel: (param?: boolean) => void;
  combineData: {
    company_info: companyItem[];
    data: companyCompareItem[];
  };
  dupField: string;
}
const CompareClientModal = (props: ComProps) => {
  const { visible, onCancel, combineData, dupField } = props;
  const [mainValue, setMainValue] = useState('');
  const [clientList, setClientList] = useState([] as companyItem[]);
  const [clientInfoList, setClientInfoList] = useState([] as companyCompareItem[]);
  /**
   * 页面初始化
   */
  useEffect(() => {
    // 页面初始化数据
    if (combineData.company_info) {
      console.log('combineData', combineData);
      setClientList(combineData.company_info);
      // 增加checked, 默认选中第一个
      let data = combineData.data.map(item => {
        item.checked = item.values[0].value;
        return item;
      });
      setClientInfoList(data);
      // 默认选中第一个
      setMainValue(combineData.company_info[0].company_id);
    }
  }, [combineData]);
  // 非
  const isFirstClinet = clientId => {
    return clientList[0].company_id === clientId;
  };
  const onChange = e => {
    console.log('value', e.target.value);
    const clientId = e.target.value;
    setMainValue(clientId);
    // 统一更改checked
    let list = clientInfoList.map(item => {
      item.checked = item.values[isFirstClinet(clientId) ? 0 : 1].value;
      return item;
    });
    setClientInfoList(list);
  };
  const onSingleChange = (e, index) => {
    console.log('value12', e, index);
    let list = [...clientInfoList];
    list[index].checked = e.target.value;
    setClientInfoList(list);
  };
  const getParams = () => {
    const deleteId = clientList.filter(item => item.company_id !== mainValue)[0].company_id;
    const data = clientInfoList.map(item => {
      return {
        column: item.name,
        value: item.checked,
      };
    });
    return {
      selecte_company_id: mainValue,
      delete_company_id: deleteId,
      company_data: data,
    };
  };
  const formSubmit = () => {
    let param = getParams();
    console.log('values-submit', param);
    const filedName = param.company_data.map(item => item.column).join(',');
    clientApi.companyMerge(param).then(res => {
      SiriusMessage.success({
        content: getIn18Text('HEBINGCHENGGONG'),
      });
      customerDataTracker.trackCustomerMergePopUp(filedName);
      onCancel(true);
    });
  };
  return (
    <>
      <Modal
        className={style.compareClientWrap}
        title={`合并客户`}
        width={532}
        bodyStyle={{ maxHeight: '481px', overflow: 'scroll' }}
        visible={visible}
        destroyOnClose={true}
        onCancel={onCancel}
        onOk={formSubmit}
      >
        <div className={style.modalContent}>
          <div className={style.headerDec}>
            {getIn18Text('QINGXUANZEHEBINGHOUDEBAOLIUZHI\uFF0CHEBINGHOUDEJILUJIANGBAOLIUZUIZAODECHUANGJIANRIQI\uFF0CYUANKEHUXIADELIANXIRENHUIQIANYIDAOZHUJILUXIA\u3002')}
          </div>
          <div className={style.headerField}>
            {getIn18Text('ZHONGFUZIDUAN\uFF1A')}
            {dupField}
          </div>
          <div className={style.mainRadio}>
            <div style={{ paddingRight: 37, marginBottom: 16 }}>{getIn18Text('ZHUJILU')}</div>
            <Radio.Group onChange={onChange} value={mainValue}>
              <div className={style.radioSpace}>
                {clientList.map((item, index) => (
                  <Radio key={index} value={item.company_id}>
                    {item.company_name}
                  </Radio>
                ))}
              </div>
            </Radio.Group>
          </div>
          <div className={style.main}>
            <Space direction="vertical" size={32}>
              {clientInfoList.map((item, index) => {
                return (
                  <div key={index}>
                    <span style={{ color: '#262A33', marginBottom: 16, display: 'inline-block' }}>{`${index + 1}、${item.title}`}</span>
                    <Radio.Group onChange={e => onSingleChange(e, index)} value={item.checked}>
                      <div className={style.radioSpace}>
                        {item.values.map((el, elIndex) => (
                          <Radio key={elIndex} value={el?.value}>
                            {el?.label || '-'}
                          </Radio>
                        ))}
                      </div>
                    </Radio.Group>
                  </div>
                );
              })}
            </Space>
          </div>
        </div>
      </Modal>
    </>
  );
};
export default CompareClientModal;
