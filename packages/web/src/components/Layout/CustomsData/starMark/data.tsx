import React, { FC } from 'react';
import { ColumnType } from 'antd/lib/table';
import { Dropdown, Menu } from 'antd';
import classnames from 'classnames';
import Icon from '@ant-design/icons/es/components/Icon';
import { getIn18Text } from 'api';
import moment, { Moment } from 'moment';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import { ReactComponent as QuestionIcon } from '@/images/icons/customs/question.svg';
import { ReactComponent as GrubProcessSvg } from '@/images/icons/globalsearch/grub-process.svg';
import { ReactComponent as StarIcon } from '@/images/icons/customs/star.svg';
import { ReactComponent as StarHoverIcon } from '@/images/icons/customs/star-selected.svg';
import style from './table/table.module.scss';
import EllipsisTooltip from '../../Customer/components/ellipsisTooltip/ellipsisTooltip';
import { customsDataTracker } from '../tracker/tracker';
import NationFlag from '../components/NationalFlag';
import { FissionStatusEnumType, MatchStatusEnumType, MatchStatusText } from './constants';
import { renderDataTagList } from '../../utils';
import CustomerTag from '../../globalSearch/component/CustomerTag';
import { getCustomerAndLeadsTagInList } from '../../globalSearch/utils';

export enum StarForwarderOpBehavior {
  detail = 'detail',
  delete = 'delete',
  log = 'log',
  fission = 'fission',
  fissionDetail = 'fissionDetail',
}

interface GetStarForwarderColumnsProps {
  handler: (behavior: StarForwarderOpBehavior, record: any) => void;
}

const OpTableHeader: FC = () => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <span style={{ marginRight: '8px' }}>{getIn18Text('CAOZUO')}</span>
    <Tooltip title="一键裂变：根据核心客户的采供链关系，一键辐射出具有相似采供关系的潜在客户">
      <span style={{ cursor: 'pointer', display: 'flex' }}>
        <QuestionIcon />
      </span>
    </Tooltip>
  </div>
);

const getFissionTextComp = (record: any) => {
  if (record.fissionStatus === FissionStatusEnumType.InFission) {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        裂变中
        <Icon style={{ fontSize: 20, marginLeft: 2, color: 'transparent', cursor: 'not-allowed', display: 'flex' }} component={GrubProcessSvg} spin />
      </div>
    );
  }
  if (record.fissionStatus === FissionStatusEnumType.Finished) return `查看裂变${record.fissionCompanyNum ? `（${record.fissionCompanyNum}）` : ''}`;
  return '一键裂变';
};

const getStarCompanyFissionTextWrapper = (record: any, handler: GetStarForwarderColumnsProps['handler']) => {
  const BaseDisabledTextComp = <span className={classnames(style.opCell, style.opCellDisabled)}>{getFissionTextComp(record)}</span>;
  if (record.fissionStatus === FissionStatusEnumType.Nonsupported) {
    return <Tooltip title="未找到该公司的采供链关系，不支持一键裂变">{BaseDisabledTextComp}</Tooltip>;
  }
  if (record.fissionStatus === FissionStatusEnumType.InFission) {
    return BaseDisabledTextComp;
  }
  return (
    <span
      className={style.opCell}
      onClick={() => {
        if (record.fissionStatus === FissionStatusEnumType.Finished) {
          handler(StarForwarderOpBehavior.fissionDetail, record);
          return;
        }
        handler(StarForwarderOpBehavior.fission, record);
      }}
    >
      {getFissionTextComp(record)}
    </span>
  );
};

export const calcDataUpdateTime = (dataUpdateTime: string, watchTime: string) => {
  const t1 = dataUpdateTime ? moment(dataUpdateTime) : null;
  const t2 = watchTime ? moment(watchTime) : null;
  let updateTime: Moment | null = null;
  if (t1 && t2) {
    updateTime = t1.isAfter(t2) ? t1 : t2;
  } else if (t1) {
    updateTime = t1;
  } else {
    updateTime = t2;
  }
  return updateTime ? updateTime.format('YYYY-MM-DD') : '-';
};

export const getStarForwarderColumns = ({ handler }: GetStarForwarderColumnsProps): Array<ColumnType<any>> => [
  {
    title: getIn18Text('GONGSIMINGCHENG'),
    dataIndex: 'companyName',
    key: 'companyName',
    width: 300,
    render: (text: string, record) => (
      <div className={style.companyNameItem}>
        <EllipsisTooltip>
          <span
            style={{ cursor: 'pointer', color: '#4c6aff' }}
            onClick={e => {
              e.preventDefault();
              handler(StarForwarderOpBehavior.detail, record);
              customsDataTracker.trackCollectionDetail({ from: 'companyName' });
            }}
          >
            {record.originName || text || '-'}
          </span>
        </EllipsisTooltip>
        {record.status === 1 && <span className={style.updateTag}>公司动态更新</span>}
      </div>
    ),
  },
  {
    title: getIn18Text('GUOJIA/DEQU'),
    dataIndex: 'country',
    key: 'country',
    width: 124,
    render: (text: string) => (text ? <NationFlag showLabel name={text} /> : null),
  },
  {
    title: '联系人数量',
    dataIndex: 'contactNum',
    key: 'contactNum',
    width: 124,
    render: (value, record) => {
      const { status, lastContactNum = value } = record;
      const increase = value - lastContactNum;
      return (
        <span>
          {status === 1 ? lastContactNum : value}
          {status === 1 && increase > 0 && <span className={style.increase}>{`+${increase}`}</span>}
        </span>
      );
    },
  },
  {
    title: '交易记录更新至',
    dataIndex: 'trsTime',
    key: 'trsTime',
    width: 153,
    render: value => {
      const text = value ? moment(value).format('YYYY-MM-DD') : '-';
      return <EllipsisTooltip>{text}</EllipsisTooltip>;
    },
  },
  {
    title: '数据更新时间',
    dataIndex: 'dataUpdateTime',
    key: 'dataUpdateTime',
    width: 156,
    render: (value, record) => {
      const text = calcDataUpdateTime(value, record.watchTime);
      return <EllipsisTooltip>{text || '-'}</EllipsisTooltip>;
    },
  },
  {
    title: OpTableHeader,
    dataIndex: 'id',
    width: 166,
    fixed: 'right',
    render: (id, record) => (
      <div className={style.multiOpCell}>
        {getStarCompanyFissionTextWrapper(record, handler)}
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item>
                <div
                  onClick={() => {
                    handler(StarForwarderOpBehavior.log, record);
                  }}
                >
                  查看更新日志
                </div>
              </Menu.Item>
              <Menu.Item>
                <div
                  onClick={() => {
                    handler(StarForwarderOpBehavior.delete, record);
                  }}
                >
                  {getIn18Text('TUIDING')}
                </div>
              </Menu.Item>
            </Menu>
          }
        >
          <span className={style.opCell}>...</span>
        </Dropdown>
      </div>
    ),
  },
];

export enum ImportCompanyOpBehavior {
  detail = 'detail',
  delete = 'delete',
  fission = 'fission',
  fissionDetail = 'fissionDetail',
  subscribe = 'subscribe',
  unsubscribe = 'unsubscribe',
}

interface GetImportCompanyColumnsProps {
  handler: (behavior: ImportCompanyOpBehavior, record: any) => void;
}

const getImportCompanyFissionTextWrapper = (record: any, handler: GetImportCompanyColumnsProps['handler']) => {
  const BaseDisabledTextComp = <span className={classnames(style.opCell, style.opCellDisabled)}>{getFissionTextComp(record)}</span>;
  if (record.fissionStatus === FissionStatusEnumType.Nonsupported) {
    return <Tooltip title="未找到该公司的采供链关系，不支持一键裂变">{BaseDisabledTextComp}</Tooltip>;
  }
  if (record.status === MatchStatusEnumType.Unmatch || record.status === MatchStatusEnumType.Matching) {
    return <Tooltip title="海关数据匹配中或未匹配成功的公司，不支持一键裂变">{BaseDisabledTextComp}</Tooltip>;
  }
  if (record.fissionStatus === FissionStatusEnumType.InFission) {
    return BaseDisabledTextComp;
  }
  return (
    <span
      className={style.opCell}
      onClick={() => {
        if (record.fissionStatus === FissionStatusEnumType.Finished) {
          handler(ImportCompanyOpBehavior.fissionDetail, record);
          return;
        }
        handler(ImportCompanyOpBehavior.fission, record);
      }}
    >
      {getFissionTextComp(record)}
    </span>
  );
};

export const getImportCompanyColumns = ({ handler }: GetImportCompanyColumnsProps): Array<ColumnType<any>> => [
  {
    title: getIn18Text('GONGSIMINGCHENG'),
    dataIndex: 'originCompanyName',
    key: 'originCompanyName',
    width: 300,
    render: (text: string, record) => {
      const tagProps = getCustomerAndLeadsTagInList({ referId: record.referId, customerLabelType: record.customerLabelType });
      return (
        <div style={{ position: 'relative', paddingLeft: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {record.status === MatchStatusEnumType.Match && (
              <Tooltip placement="top" title={record.collectId ? getIn18Text('QUXIAODINGYUE') : getIn18Text('DINGYUEGONGSI')}>
                <span
                  className={style.companyNameStar}
                  onClick={e => {
                    e.stopPropagation();
                    handler(record.collectId ? ImportCompanyOpBehavior.unsubscribe : ImportCompanyOpBehavior.subscribe, record);
                  }}
                >
                  {record.collectId ? <StarHoverIcon /> : <StarIcon className={style.companyNameStarIcon} />}
                </span>
              </Tooltip>
            )}
            {record.status === MatchStatusEnumType.Match && record.notViewed && <span className={style.redPoint} />}
            <EllipsisTooltip>
              <span style={{ marginRight: '5px' }}>{text || '-'}</span>
            </EllipsisTooltip>
            {renderDataTagList([
              {
                content: tagProps ? <CustomerTag tagProps={tagProps} companyName={record.name} country={record.country} source="globalSearch" /> : null,
                priority: true,
                style: 'green',
              },
              {
                content: record.viewCountDesc ? record.viewCountDesc : '',
                style: 'yellow',
              },
            ])}
          </div>
          {record.status === MatchStatusEnumType.Match ? (
            <EllipsisTooltip>
              <span>
                关联海关公司：
                <span
                  style={{ cursor: 'pointer', color: '#4c6aff' }}
                  onClick={e => {
                    e.preventDefault();
                    handler(ImportCompanyOpBehavior.detail, record);
                  }}
                >
                  {record.customsCompanyName || '-'}
                </span>
              </span>
            </EllipsisTooltip>
          ) : (
            <div style={{ color: '#9FA2AD' }}>{MatchStatusText[record.status as MatchStatusEnumType] || ''}</div>
          )}
        </div>
      );
    },
  },
  {
    title: getIn18Text('GUOJIA/DEQU'),
    dataIndex: 'originCountry',
    key: 'originCountry',
    width: 124,
  },
  {
    title: '联系人数量',
    dataIndex: 'contactCount',
    key: 'contactCount',
    width: 124,
    render: (text: string) => text ?? '-',
  },
  {
    title: '交易记录更新至',
    dataIndex: 'trsTime',
    key: 'trsTime',
    width: 153,
    render: value => {
      const text = value ? moment(value).format('YYYY-MM-DD') : '-';
      return <EllipsisTooltip>{text}</EllipsisTooltip>;
    },
  },
  {
    title: '导入时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 156,
    render: value => {
      const text = value ? moment(value).format('YYYY-MM-DD') : '-';
      return <EllipsisTooltip>{text}</EllipsisTooltip>;
    },
  },
  {
    title: OpTableHeader,
    dataIndex: 'id',
    width: 166,
    fixed: 'right',
    render: (id, record) => (
      <div className={style.multiOpCell}>
        {getImportCompanyFissionTextWrapper(record, handler)}
        <Dropdown
          overlay={
            <Menu>
              {!record.collectId && (
                <Menu.Item disabled={record.status !== MatchStatusEnumType.Match}>
                  <div
                    onClick={() => {
                      if (record.status !== MatchStatusEnumType.Match) return;
                      handler(ImportCompanyOpBehavior.subscribe, record);
                    }}
                  >
                    加入订阅
                  </div>
                </Menu.Item>
              )}
              <Menu.Item>
                <div
                  onClick={() => {
                    handler(ImportCompanyOpBehavior.delete, record);
                  }}
                >
                  删除
                </div>
              </Menu.Item>
            </Menu>
          }
        >
          <span className={style.opCell}>...</span>
        </Dropdown>
      </div>
    ),
  },
];
