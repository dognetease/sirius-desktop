import React, { useEffect, useState } from 'react';
import { ReactComponent as NewIcon } from '@/images/icons/customs/new-icon.svg';
import { apiHolder, apis, EdmCustomsApi, resCustomsDataUpdate } from 'api';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import useTableHeight from '@/components/Layout/Customer/components/hooks/useTableHeight';
import style from './dataUpdate.module.scss';
import { customsDataTracker } from '../../tracker/tracker';
import { getIn18Text } from 'api';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import { useMemoizedFn } from 'ahooks';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
export interface DataUpdateRecord extends resCustomsDataUpdate {
  formCompany?: 'suppliers' | 'buysers';
}
interface IProps {
  onCell: (record: DataUpdateRecord, rowIndex: number, colName: string) => void;
  type?: 'forwarder' | 'peers';
}
const DataUpdate = (props: IProps) => {
  const [data, setData] = useState<DataUpdateRecord[]>([]);
  const columns = [
    {
      title: getIn18Text('GENGXINSHIJIAN'),
      dataIndex: 'updateTime',
      render: (text: string, item: DataUpdateRecord) => {
        return (
          <span className={style.updateDate}>
            {text} {item.latestUpdate && props.type !== 'forwarder' && props.type !== 'peers' ? <NewIcon /> : null}
            {(props.type === 'forwarder' || props.type === 'peers') && (
              <>
                {!!item.viewCount ? (
                  <Tag type="label-2-1">
                    {'已筛'}
                    {item.viewCount}
                    {'次'}
                  </Tag>
                ) : (
                  <Tag>{'未筛选'}</Tag>
                )}
              </>
            )}
          </span>
        );
      },
      onCell: (record: DataUpdateRecord, index: number) => {
        return {
          onClick: (event: MouseEvent) => {
            props.onCell(record, index, 'updateTime');
          }, // 点击列
        };
      },
    },
    {
      title: props.type === 'peers' ? '货运数据（家）' : getIn18Text('HAIGUANSHUJU\uFF08TIAO\uFF09'),
      dataIndex: 'transactions',
      onCell: (record: DataUpdateRecord, index: number) => {
        return {
          onClick: (event: MouseEvent) => {
            props.onCell(record, index, 'transactions');
          }, // 点击列
        };
      },
    },
    {
      title: getIn18Text('CAIGOUSHANG\uFF08JIA\uFF09'),
      dataIndex: 'buyersUpdateCount',
      onCell: (record: DataUpdateRecord, index: number) => {
        return {
          onClick: (event: MouseEvent) => {
            console.log('DataUpdate-record: ', record, index);
            props.onCell(record, index, 'buyersUpdateCount');
          }, // 点击列
        };
      },
    },
    {
      title: getIn18Text('GONGYINGSHANG\uFF08JIA\uFF09'),
      dataIndex: 'suppliersUpdateCount',
      onCell: (record: DataUpdateRecord, index: number) => {
        return {
          onClick: (event: MouseEvent) => {
            console.log('DataUpdate-record: ', record, index);
            props.onCell(record, index, 'suppliersUpdateCount');
          }, // 点击列
        };
      },
    },
    {
      title: '运输公司（家）',
      dataIndex: 'carrierUpdateCount',
      onCell: (record: DataUpdateRecord, index: number) => {
        return {
          onClick: (event: MouseEvent) => {
            console.log('DataUpdate-record: ', record, index);
            props.onCell(record, index, 'suppliersUpdateCount');
          }, // 点击列
        };
      },
    },
  ];
  const handleColumns = useMemoizedFn((param: any[]) => {
    if (props.type === 'peers') {
      param.splice(2, 2);
      return param;
    } else {
      param.splice(4, 1);
      return param;
    }
  });
  useEffect(() => {
    edmCustomsApi
      .customsDataUpdate()
      .then(res => {
        console.log('customsDataUpdate-res: ', res);
        setData(res);
      })
      .catch(() => setData([]));
  }, []);
  return (
    <div className={style.dateWrapper}>
      <div className={style.title}>{getIn18Text('SHUJUGENGXINJILU')}</div>
      <SiriusTable rowKey="updateTime" columns={handleColumns(columns)} dataSource={data} pagination={false} />
    </div>
  );
};
export default DataUpdate;
