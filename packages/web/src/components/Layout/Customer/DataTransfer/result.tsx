/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable camelcase */
import { Button } from 'antd';
import { navigate } from 'gatsby';
import React, { useCallback } from 'react';
import { api, ResDMImport } from 'api';
import style from './dataTransfer.module.scss';
import { ReactComponent as SuccessIcon } from '@/images/icons/edm/map_status_success.svg';
import { getIn18Text } from 'api';
export interface IDataTransferResult {
  success: boolean;
  companyCount: number;
  contactCount: number;
  download_id?: string;
}
const systemApi = api.getSystemApi();
const downloadUrl = systemApi.getUrl('customerDMDownloadFail');
const httpApi = api.getDataTransApi();
const toCustomer = () => {
  navigate('/#customer?page=customer');
};
export const DataTransferResult = (props: { result: ResDMImport; reset?: () => void }) => {
  const { result, reset } = props;
  const {
    status_code,
    // success_customer_cnt,
    // success_cnt,
    download_id,
    message,
  } = result;
  const downloadFail = useCallback(() => {
    // todo 下载失败
    httpApi
      .get(
        `${downloadUrl}?download_id=${download_id}`,
        {},
        {
          responseType: 'blob',
        }
      )
      .then(res => {
        const blob = res.rawData;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); // 将流文件写入a标签的href属性值
        a.download = getIn18Text('QIANYISHIBAIDEKEHUSHUJU.xlsx');
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
      });
  }, [download_id]);
  return (
    <div className={style.result}>
      <div>
        {status_code === 'success' && (
          <>
            <SuccessIcon
              style={{
                transform: 'scale(2.286)',
                transformOrigin: 'bottom center',
              }}
            />
            <h3>{getIn18Text('DAORUCHENGGONG')}</h3>
          </>
        )}
        <p>
          <span style={{ color: '#7A8599' }}>{message}</span>
          {download_id && (
            <a style={{ marginLeft: 16 }} onClick={downloadFail}>
              {getIn18Text('XIAZAISHIBAIJIEGUO')}
            </a>
          )}
        </p>
        {/* <Button type="default" style={{ marginRight: 16 }} onClick={toCustomer}>查看导入客户</Button> */}
        <Button type="primary" onClick={reset}>
          {getIn18Text('ZAICIDAORU')}
        </Button>
      </div>
    </div>
  );
};
