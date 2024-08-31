import React, { useState, useEffect } from 'react';
import { ColumnsType } from 'antd/lib/table';
import { getIn18Text, SimilarCompanyTableDataItem } from 'api';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import NationFlag from '../../CustomsData/components/NationalFlag';
import style from './companyDetail.module.scss';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { CompanyDetail } from './CompanyDetail';
export interface GlobalSimilarCompanyProps {
  tableData?: SimilarCompanyTableDataItem[];
  showNextDetail?(id: string): void;
  id: string;
  source?: string;
}
export interface DetailLevelStatus {
  id?: string;
  open: boolean;
}
export const SimilarCompany: React.FC<GlobalSimilarCompanyProps> = props => {
  const { tableData = [], showNextDetail, source } = props;

  // 展示公司全球搜页面抽屉
  const [showCompanyId, setShowCompanyId] = useState<string>('');
  const tableColumns: ColumnsType<SimilarCompanyTableDataItem> = [
    {
      title: getIn18Text('GONGSIMINGCHENG'),
      dataIndex: 'name',
      ellipsis: true,
      render: (value, record) => (
        <>
          <EllipsisTooltip>{value}</EllipsisTooltip>
        </>
      ),
    },
    {
      title: getIn18Text('GUOJIADEQU'),
      dataIndex: 'domainCountry',
      render: value => {
        return <div>{value ? <NationFlag showLabel name={value} /> : null}</div>;
      },
    },
    {
      title: '联系人数量',
      dataIndex: 'contactCount',
    },
    {
      title: getIn18Text('YUMING'),
      dataIndex: 'domain',
      ellipsis: true,
      render: (value, record) => (
        <>
          <EllipsisTooltip>
            <a
              className={style.textColor}
              href={value}
              target="_blank"
              rel="noreferrer"
              onClick={e => {
                e.stopPropagation();
                if (!value.length) {
                  e.preventDefault();
                }
              }}
            >
              {value}
            </a>
          </EllipsisTooltip>
        </>
      ),
    },
  ];
  return (
    <div className={style.block}>
      <div className={style.contactOpHeader} hidden={origin === 'global'}>
        <h3>
          <span>{'相似公司'}</span>
        </h3>
      </div>
      <SiriusTable
        className={style.table}
        rowKey={'id'}
        columns={tableColumns}
        dataSource={tableData}
        pagination={false}
        onRow={(record: SimilarCompanyTableDataItem) => ({
          onClick: () => {
            if (source === 'SimailarCompanyTable') {
              SiriusMessage.warn(`仅可查看一层相似公司`);
              return;
            }
            setShowCompanyId(record.id);
          },
        })}
      />
      <Drawer
        key={'similarDrawer'}
        visible={!!showCompanyId}
        width={786}
        zIndex={1100}
        onClose={e => {
          setShowCompanyId('');
          e.preventDefault();
          e.stopPropagation();
        }}
        destroyOnClose
      >
        <CompanyDetail origin="SimailarCompanyTable" id={showCompanyId} reloadToken={0} />
      </Drawer>
    </div>
  );
};
