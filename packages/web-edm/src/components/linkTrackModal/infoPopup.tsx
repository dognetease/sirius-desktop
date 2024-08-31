import { apiHolder, apis, EdmSendBoxApi, ResponseTraceLinkInfo } from 'api';
import { Skeleton, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import style from './popup.module.scss';
import { getIn18Text } from 'api';
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const columns = [
  {
    title: getIn18Text('RENSHU'),
    dataIndex: 'totalCount',
  },
  {
    title: getIn18Text('CISHU'),
    dataIndex: 'totalNum',
  },
];
const TraceLinkInfoPopup = ({ edmEmailId }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ResponseTraceLinkInfo | null>(null);
  useEffect(() => {
    fetchData(edmEmailId);
  }, [edmEmailId]);
  const fetchData = (edmEmailId: string) => {
    setLoading(true);
    edmApi
      .getTraceLinkInfo({ edmEmailId })
      .then(data => {
        setData(data);
      })
      .finally(() => setLoading(false));
  };
  return (
    <div className={style.popupContainer}>
      <div className={style.title}>{getIn18Text('LIANJIEFANGWEN')}</div>
      <Skeleton paragraph={{ rows: 2 }} title={false} active loading={loading}>
        <table>
          <tr className={style.tableHead}>
            <td>{getIn18Text('RENSHU')}</td>
            <td>{getIn18Text('CISHU')}</td>
          </tr>
          <tr className={style.tableBody}>
            <td>{data?.totalCount || '-'}</td>
            <td>{data?.totalNum || '-'}</td>
          </tr>
        </table>
      </Skeleton>
    </div>
  );
};
export const renderTraceLinkPopup = (edmEmailId: string) => {
  return <TraceLinkInfoPopup edmEmailId={edmEmailId} />;
};
