import React from 'react';
import { getIn18Text } from 'api';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { ligthText } from '../../CustomsData/customs/docSearch/component/TableItem';
import { getCustomerAndLeadsTagInList } from '../utils';
import CustomerTag from '../component/CustomerTag';
import { renderDataTagList } from '../../utils';
import styles from './LbsSearch.module.scss';
import { globalSearchDataTracker } from '../tracker';

interface Props {
  keywords?: string;
  handleView: (record: any) => void;
  handleGrubCompanyInfo?: (id?: any, name?: string) => void;
  internal?: boolean;
}

export const renderLbsTableColumns = ({ keywords, handleView, handleGrubCompanyInfo, internal }: Props) => [
  {
    dataIndex: 'name',
    title: getIn18Text('GONGSIMINGCHENG'),
    render(value: any, record: any) {
      const name = value && keywords ? ligthText(value, keywords) : value;
      const [conType] = record.types || [];
      const customerTagContent = getCustomerAndLeadsTagInList({ referId: record?.referId, customerLabelType: record.customerLabelType });
      return (
        <>
          <span>
            {name}
            <span style={{ margin: '4px 0px', display: 'block' }}>
              {renderDataTagList([
                {
                  content: customerTagContent ? <CustomerTag tagProps={customerTagContent} companyName={record.name} country={record.country} source="lbsList" /> : null,
                  priority: true,
                  style: 'green',
                },
                {
                  content: record.contactStatus,
                  style: 'blue',
                },
              ])}
            </span>
            {conType && <div className={styles.storeType}>{conType}</div>}
          </span>
        </>
      );
    },
  },
  {
    dataIndex: 'website',
    title: getIn18Text('GONGSIWANGZHAN'),
    render(value: any) {
      if (value) {
        return (
          <a
            href={value}
            target="_blank"
            onClick={() => {
              if (internal) {
                globalSearchDataTracker.trackLbsInternalListView('website');
              } else {
                globalSearchDataTracker.trackLbsListView('website');
              }
            }}
            rel="noreferrer"
          >
            {value}
          </a>
        );
      }
      return '-';
    },
  },
  {
    dataIndex: 'formatted_address',
    title: getIn18Text('XIANGXIDIZHI'),
    render(value: any) {
      return value || '-';
    },
  },
  {
    dataIndex: 'formatted_phone_number',
    title: getIn18Text('LIANXIDIANHUA'),
    render(value: any) {
      return value || '-';
    },
  },
  {
    dataIndex: 'place_id',
    title: getIn18Text('CAOZUO'),
    render: (_: any, record: any) => {
      const renderView = () => (
        <Button
          btnType="link"
          onClick={e => {
            e.preventDefault();
            handleView(record);
            if (internal) {
              globalSearchDataTracker.trackLbsInternalListView('viewDetail');
            } else {
              globalSearchDataTracker.trackLbsListView('viewDetail');
            }
          }}
        >
          {getIn18Text('CHAKAN')}
        </Button>
      );
      if (record.idStatus && record.idStatus.companyDeepAvailable) {
        if (record.idStatus?.companyGrubStatus === 'GRUBBING') {
          return (
            <Button btnType="link" loading>
              {getIn18Text('WAJUEZHONG...')}
            </Button>
          );
        }
        if (handleGrubCompanyInfo && record.idStatus?.companyGrubStatus === 'NOT_GRUBBING') {
          return (
            <Button
              btnType="link"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                handleGrubCompanyInfo(record.idStatus?.id, record.name);
              }}
            >
              深挖企业资料
            </Button>
          );
        }
        return renderView();
      }
      return renderView();
    },
  },
];
