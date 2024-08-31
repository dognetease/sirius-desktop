import React from 'react';
import { TableProps, Divider, Menu, Tooltip } from 'antd';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import { ColumnsType } from 'antd/es/table';
import { FFMSRate } from 'api';
import classnames from 'classnames';
// import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import { TongyongGengduo } from '@sirius/icons';
import Dropdown from '@web-common/components/UI/Dropdown/index';
// import Tooltip from '@web-common/components/UI/Tooltip';
import FfConfirm from '@web-entry-ff/views/customer/components/popconfirm';
import { ReactComponent as Arrow } from '@web-entry-ff/images/Arrow.svg';
import style from './style.module.scss';

interface CustomerTableProps extends TableProps<any> {
  onDelete: (id: string) => void;
  onChangeDetail: (id: string, row?: FFMSRate.ListItem) => void;
  onValid: (id: string) => void;
  onQuote?: (item: FFMSRate.ListItem) => void;
  checkHistory?: (id: string, row?: FFMSRate.ListItem) => void;
  tableType?: 'draft';
}

const CustomerTable: React.FC<CustomerTableProps> = props => {
  const { onChangeDetail, onDelete, tableType, checkHistory, onQuote, ...restProps } = props;

  const columns: ColumnsType<FFMSRate.ListItem> = [
    {
      title: '船司',
      render: (value, row) => {
        return (
          <div className={style.shipInfo}>
            <div className={classnames(style.shipMaster, style.ellipsis)}>
              {tableType ? row.carrier || '-' : `${row?.freightCarrier?.carrier} ${row?.freightCarrier?.cnName}`}
            </div>
            <div className={classnames(style.shipCount)}>{row.vessel || '--'}</div>
          </div>
        );
      },
    },
    {
      title: '航线',
      align: 'center',
      render: (_, row) => {
        const isExpired = Boolean(row?.tagList?.includes('EXPIRED'));
        const departurePortText = row.departurePort
          ? `${row.departurePort?.enName} ${row.departurePort?.cnName} ${row.departurePort?.countryCnName}`
          : row.departurePortCode || '--';

        const destinationPortText = row.destinationPort
          ? `${row.destinationPort?.enName} ${row.destinationPort?.cnName} ${row.destinationPort?.countryCnName}`
          : row.destinationPortCode || '--';

        return (
          <div className={style.routeInfo}>
            <div className={style.from}>
              <div className={classnames(style.portName, style.ellipsis)} title={departurePortText}>
                {isExpired && <div className={style.tag}>过期</div>}
                {departurePortText}
              </div>
              <div className={classnames(style.date)}>{row.sailingDate || '--'}</div>
            </div>
            <div className={style.arrow}>
              <div className={classnames(style.routeName, style.ellipsis)} title={row.route || '--'}>
                {row.route || '--'}
              </div>
              <Arrow />
              <div className={classnames(style.voyage, style.ellipsis)}>{row.voyage ? `${row.voyage}天` : '--'}</div>
            </div>
            <div className={style.to}>
              <div className={classnames(style.portName, style.ellipsis)} title={destinationPortText}>
                {destinationPortText}
              </div>
              <div className={classnames(style.date)}>{row.arriveDate || '--'}</div>
            </div>
          </div>
        );
      },
    },
    // {
    //   title: '目的港',
    //   dataIndex: 'destinationPortCode',
    //   render: (_, row) =>
    //     tableType ? (
    //       <div>
    //         <span style={{ paddingRight: row?.reason ? 5 : 0 }}>{row.departurePortCode || '-'}</span>
    //         {row?.reason ? (
    //           <Tooltip title={row?.reason}>
    //             <span style={{ color: 'red' }}>
    //               <ExclamationCircleOutlined />
    //             </span>
    //           </Tooltip>
    //         ) : null}
    //       </div>
    //     ) : (
    //       <span>{`${row.destinationPort?.enName} ${row.destinationPort?.cnName} ${row.destinationPort?.countryCnName}`}</span>
    //     ),
    // },
    {
      title: '价格（$）',
      dataIndex: 'price',
      className: style.maxWidthCell,
      ellipsis: true,
    },
    {
      title: '截止日期',
      dataIndex: 'expiryDate',
      render: value => {
        return <div className={style.date}>{value || '--'}</div>;
      },
    },
    {
      title: '其它时间',
      dataIndex: 'expiryDate',
      render: (_, row) => {
        return (
          <div className={style.date}>
            <div>{row.createAt}创建</div>
            <div style={{ marginTop: 4 }}>{row.updateAt}更新</div>
          </div>
        );
      },
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      render(_: string, row) {
        const isExpired = Boolean(row?.tagList?.includes('EXPIRED'));
        return (
          <div className={style.tableOperate}>
            {!tableType && (
              <>
                <Tooltip title={isExpired ? '过期航线不支持报价' : null}>
                  <span
                    className={classnames(style.linkBtn, isExpired ? style.disabled : '')}
                    onClick={() => {
                      if (isExpired) {
                        return;
                      }
                      if (onQuote) {
                        onQuote(row);
                      }
                    }}
                  >
                    去报价
                  </span>
                </Tooltip>
                <Divider type="vertical" />
              </>
            )}
            <span className={style.linkBtn} onClick={() => onChangeDetail(tableType ? row.freightDraftId : row.freightId, row)}>
              编辑
            </span>
            <Divider type="vertical" />
            <Dropdown
              trigger={['hover']}
              overlay={
                <Menu>
                  <FfConfirm title="确认删除 ?" onConfirm={() => onDelete(tableType ? row.freightDraftId : row.freightId)}>
                    <Menu.Item>删除</Menu.Item>
                  </FfConfirm>
                  <Menu.Item disabled={Boolean(tableType || !row?.existHistory)} onClick={() => checkHistory && checkHistory(row.freightId, row)}>
                    历史记录
                  </Menu.Item>
                </Menu>
              }
            >
              <span style={{ cursor: 'pointer' }}>
                <TongyongGengduo className={style.opmenuIcon} />
              </span>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return <Table scroll={{ x: 'max-content' }} columns={columns} {...restProps} />;
};

export default CustomerTable;
