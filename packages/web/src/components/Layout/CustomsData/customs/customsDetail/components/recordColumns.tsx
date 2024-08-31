import React, { useState } from 'react';
import { transactionRecordItem, resBuysersBase, resSuppliersBase, resCustomsStatistics as statisticsType, apiHolder, apis, DataTrackerApi } from 'api';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import Translate from '../../../components/Translate/translate';
import { recData as recDataType } from '../../../customs/customs';
import style from './supplier.module.scss';
import { customsDataTracker } from '../../../tracker/tracker';
import classNames from 'classnames';
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
import { Button, Divider, Dropdown, Menu, message, PaginationProps, Table, Tooltip } from 'antd';
import { getIn18Text } from 'api';

const getBoxConfig = (type: 'buysers' | 'suppliers', detail: Partial<resBuysersBase> & Partial<resSuppliersBase>) => {
  const buyserBoxInfo = [
    {
      key: 'maxSupplerName',
      label: getIn18Text('ZUIDAGONGYINGSHANG'),
      content: detail?.maxSupplerName,
      isClick: true,
    },
    {
      key: 'totalImportOfUsd',
      label: getIn18Text('JINKOUJINE(ZONG)'),
      isNumber: true,
      content: detail?.totalImportOfUsd ? `$${detail?.totalImportOfUsd}` : detail?.totalImportOfUsd,
    },
    {
      key: 'importCount',
      label: getIn18Text('JINKOUCISHU(ZONG)'),
      isNumber: true,
      content: detail?.importCount,
    },
    {
      key: 'lastImportTime',
      label: getIn18Text('ZUIHOUJINKOUSHIJIAN'),
      isNumber: true,
      content: detail?.lastImportTime,
    },
  ];
  const suppliersBoxInfo = [
    {
      key: 'maxSupplerName',
      label: getIn18Text('ZUIDACAIGOUSHANG'),
      content: detail?.maxBuyerName,
      isClick: true,
    },
    {
      key: 'totalImportOfUsd',
      label: getIn18Text('CHUKOUJINE(ZONG)'),
      isNumber: true,
      content: detail?.exportOfUsd ? `$${detail?.exportOfUsd}` : detail?.exportOfUsd,
    },
    {
      key: 'importCount',
      label: getIn18Text('CHUKOUCISHU(ZONG)'),
      isNumber: true,
      content: detail?.exportCount,
    },
    {
      key: 'lastImportTime',
      label: getIn18Text('ZUIHOUCHUKOUSHIJIAN'),
      isNumber: true,
      content: detail?.lastExportTime,
    },
  ];
  if (type === 'buysers') {
    return buyserBoxInfo;
  } else {
    return suppliersBoxInfo;
  }
};
const tableColumns = (
  type: 'buysers' | 'suppliers',
  openBLDialog: (id: string, specialSource?: boolean) => void,
  openDrawer?: (content: recDataType['content']) => void
) => {
  const handlerOpenParams = (companyName: string, country: string) => {
    if (type === 'buysers') {
      openDrawer?.({ to: 'supplier', companyName, country });
    } else {
      openDrawer?.({ to: 'buysers', companyName, country });
    }
  };

  const handleHscodeData: (params: string) => string = (params: string) => {
    if (params && params.length <= 2) {
      return params;
    }
    if (params && params.length % 2 === 0) {
      if (params.slice(-2) == '00') {
        return params.length === 2 ? params : handleHscodeData(params.slice(0, params.length - 2));
      } else {
        return params;
      }
    } else {
      if (params && params.slice(-1) == '0') {
        return handleHscodeData(params.slice(0, params.length - 1));
      } else {
        return params;
      }
    }
  };
  const handleTooltip = (record: transactionRecordItem) => {
    let toolTipStr;
    try {
      toolTipStr = record.highGoodsShpd.replace(/<em>/g, '')?.replace(new RegExp('</em>', 'gm'), '');
    } catch (error) {
      toolTipStr = record.highGoodsShpd;
    }

    return toolTipStr;
  };

  const columns = [
    {
      title: getIn18Text('JIAOYISHIJIAN'),
      dataIndex: 'shpmtDate',
      key: 'shpmtDate',
      sorter: true,
      sortDirections: ['descend', 'ascend'],
      width: 140,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('CHANPINMIAOSHU'),
      dataIndex: 'highGoodsShpd',
      key: 'highGoodsShpd',
      width: 140,
      // ellipsis: {
      // 		showTitle: false
      // },
      render: (text: string, record: transactionRecordItem) => {
        let str;
        let tooltipStr;
        if (text && text.includes('</em>')) {
          text.indexOf('<em>') >= 8
            ? (str =
                '..' +
                text.slice(text.indexOf('<em>') - 8, text.indexOf('<em>')) +
                text.slice(text.indexOf('<em>'), text.indexOf('</em>') + 6) +
                text.slice(text.indexOf('</em>') + 6))
            : (str = text.slice(0, text.indexOf('<em>')) + text.slice(text.indexOf('<em>'), text.indexOf('</em>') + 6) + text.slice(text.indexOf('</em>') + 6));
        }
        return (
          <div className={'company-name-item'}>
            {/* <Tooltip title={handleTooltip(record) || '-'}> */}
            <Tooltip title={<span dangerouslySetInnerHTML={{ __html: str ? str : text || '-' }}></span>}>
              {
                <span
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  className={'customs-company'}
                  dangerouslySetInnerHTML={{ __html: str ? str : text || '-' }}
                ></span>
              }
            </Tooltip>
            <Translate title={record.goodsShpd} classnames={'company-text'}></Translate>
          </div>
        );
      },
    },
    {
      title: 'HSCode',
      dataIndex: 'highHsCode',
      key: 'highHsCode',
      width: 110,
      ellipsis: {
        showTitle: true,
      },
      render: (text: string, record: transactionRecordItem) => (
        <div className={'company-name-item'} style={{ gap: '4px' }}>
          <Tooltip
            title={
              <div>
                <div className={'customs-company'} dangerouslySetInnerHTML={{ __html: handleHscodeData(text) || '-' }}></div>
                <div>{record.hsCodeDesc}</div>
              </div>
            }
          >
            <div className={'customs-company'} dangerouslySetInnerHTML={{ __html: handleHscodeData(text) || '-' }}></div>
          </Tooltip>
        </div>
      ),
    },
    {
      title: type === 'buysers' ? getIn18Text('GONGYINGSHANG') : getIn18Text('CAIGOUSHANG'),
      dataIndex: 'companyName',
      key: 'companyName',
      width: 240,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string, record: transactionRecordItem) => (
        <EllipsisTooltip>
          {text ? (
            text === getIn18Text('WEIGONGKAI') ? (
              <span>{text}</span>
            ) : (
              <span
                onClick={() => {
                  handlerOpenParams(text, record.country);
                  customsDataTracker.trackCustomClickTicketViewCompany();
                }}
                className={classNames({
                  [style.link]: !!openDrawer,
                })}
              >
                {text}
              </span>
            )
          ) : (
            <span>'-'</span>
          )}
        </EllipsisTooltip>
      ),
    },
    {
      title: getIn18Text('GUOJIADEQU'),
      dataIndex: 'country',
      key: 'country',
      width: 120,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('JIAOYIJINE'),
      dataIndex: 'valueOfGoodsUSD',
      key: 'valueOfGoodsUSD',
      sortDirections: ['descend', 'ascend'],
      sorter: true,
      width: 140,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: '交易数量',
      dataIndex: 'itemQuantity',
      key: 'itemQuantity',
      width: 90,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: '交易重量(kg)',
      dataIndex: 'weightKg',
      key: 'weightKg',
      width: 110,
      render: (text: string) => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('CAOZUO'),
      dataIndex: 'recordId',
      width: 90,
      fixed: 'right',
      render(text: string, record: transactionRecordItem) {
        return (
          <div
            className="company-text"
            style={{ color: '#386EE7', cursor: 'pointer' }}
            onClick={() => {
              try {
                trackerApi.track('pc_markting_customs_data_companydetail_viewtickets');
              } catch (error) {}
              openBLDialog(record.recordId, record.sourceType === 1);
            }}
          >
            {getIn18Text('CHANKANDANJU')}
          </div>
        );
      },
    },
  ];
  return columns;
};
export { getBoxConfig, tableColumns };
