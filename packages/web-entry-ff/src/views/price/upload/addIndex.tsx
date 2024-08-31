import React, { useState, useMemo } from 'react';
import { apiHolder, apis, FFMSApi, FFMSRate } from 'api';
import { Breadcrumb, Button, message } from 'antd';
import { navigate } from '@reach/router';
import { getUnitableCrmHash } from '@web-unitable-crm/api/helper';
import style from './style.module.scss';
import { AnalyzeText } from './analyzeText';
import FooterBar from '../../customer/components/footerBar';
import { isPriceError } from './util';

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
const AddPrice: React.FC = () => {
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [dataSource, setDataSource] = useState<FFMSRate.ListItem[]>([] as FFMSRate.ListItem[]);
  const [error, setError] = useState(false);
  const submitDisabled = useMemo(() => {
    return !dataSource.length;
  }, [dataSource]);

  const handleOk = () => {
    type FieldKeys = keyof FFMSRate.SaveReq;
    let requiredKey = ['departurePortCode', 'destinationPortCode', 'carrier', 'price', 'sailingDate', 'voyage', 'arriveDate'];
    if (dataSource.length) {
      let hasError = dataSource.some(item => {
        let rowError = requiredKey.some(key => (key === 'price' && isPriceError(item[key as FieldKeys] + '')) || !item[key as FieldKeys]);
        return rowError === true;
      });
      if (hasError) {
        setError(true);
        message.error('需填写完必填字段才能提交');
      } else {
        setError(false);
        ffmsApi
          .batchSaveFfPrice({
            freightRateList: dataSource as unknown as FFMSRate.SaveReq[],
          })
          .then(() => {
            message.success('导入成功');
            back();
          })
          .finally(() => {
            setConfirmLoading(false);
          });
      }
    }
  };

  const back = () => {
    navigate(getUnitableCrmHash('/price/effective?page=index'));
  };

  return (
    <div className={style.ffUploadWrap}>
      <Breadcrumb>
        <Breadcrumb.Item className={style.breadcrumb} onClick={() => back()}>
          生效报价
        </Breadcrumb.Item>
        <Breadcrumb.Item>直接录入</Breadcrumb.Item>
      </Breadcrumb>
      <div className={style.ffUploadWrapContent}>
        <AnalyzeText dataSource={dataSource} setDataSource={setDataSource} error={error} />
        <div className={style.main}></div>
      </div>
      <FooterBar keys={['']}>
        <Button onClick={() => back()}>取消</Button>
        <Button disabled={submitDisabled} loading={confirmLoading} onClick={() => handleOk()} type="primary">
          导入
        </Button>
      </FooterBar>
    </div>
  );
};

export default AddPrice;
