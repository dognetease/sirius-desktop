import React from 'react';
import { resBuysersBase, resSuppliersBase, topNCompanyInfoItem as barItemType } from 'api';
import InfoLayout from '@/components/Layout/Customer/components/infoLayout/infoLayout';
import InfoBox from './infoBox/infoBox';
import style from './baseInfo.module.scss';
import { recData as recDataType } from '../../../customs/customs';
import { getIn18Text } from 'api';
import { BarEcharts } from './customsEchart/customsBar';
import { ReactComponent as HideContactInfoIcon } from '../../../../globalSearch/assets/hide-contact-info.svg';
interface Props {
  dataType: 'buysers' | 'suppliers' | 'peers';
  detail: Partial<resBuysersBase> & Partial<resSuppliersBase>;
  openDrawer: (content: recDataType['content']) => void;
  onDig: () => void;
  isCanExactDig: boolean;
  year?: number[];
  onChangeYear?: (year: number[]) => void;
  barData?: barItemType[];
  warnningTextShow?: boolean;
}
const BaseInfo: React.FC<Props> = ({ detail, openDrawer, onDig, isCanExactDig, dataType, warnningTextShow }) => {
  const boxInfo = [
    {
      key: 'maxSupplerName',
      label: {
        buysers: window.getLocalLabel('ZUIDAGONGYINGSHANG'),
        suppliers: window.getLocalLabel('ZUIDACAIGOUSHANG'),
        peers: '客户数量',
      }[dataType],
      content: {
        buysers: detail?.maxSupplerName,
        suppliers: detail?.maxBuyerName,
        peers: detail?.customerCount,
      }[dataType],
      isClick: dataType === 'peers' ? false : true,
    },
    {
      key: 'totalImportOfUsd',
      label: {
        buysers: window.getLocalLabel('JINKOUJINE'),
        suppliers: window.getLocalLabel('CHUKOUJINE'),
        peers: '运输货值',
      }[dataType],
      isNumber: true,
      content: {
        buysers: detail?.totalImportOfUsd ? `$${detail?.totalImportOfUsd}` : detail?.totalImportOfUsd,
        suppliers: detail?.exportOfUsd ? `$${detail?.exportOfUsd}` : detail?.exportOfUsd,
        peers: detail?.totalTransportValue ? `$${detail?.totalTransportValue}` : detail?.totalTransportValue,
      }[dataType],
    },
    {
      key: 'importCount',
      label: {
        buysers: window.getLocalLabel('JINKOUCISHU'),
        suppliers: window.getLocalLabel('CHUKOUCISHU'),
        peers: '运输次数',
      }[dataType],
      isNumber: true,
      content: {
        buysers: detail?.importCount,
        suppliers: detail?.exportCount,
        peers: detail?.totalTransportCount,
      }[dataType],
    },
    {
      key: 'lastImportTime',
      label: {
        buysers: window.getLocalLabel('ZUIHOUJINKOUSHIJIAN'),
        suppliers: window.getLocalLabel('ZUIHOUCHUKOUSHIJIAN'),
        peers: '最近运输时间',
      }[dataType],
      isNumber: true,
      content: {
        buysers: detail?.lastImportTime,
        suppliers: detail?.lastExportTime,
        peers: detail?.lastTransportTime,
      }[dataType],
    },
  ];
  const handlerOpenParams = (companyName: string) => {
    if (dataType === 'buysers') {
      let country = detail.maxSupplierCountry as string;
      openDrawer({ to: 'supplier', companyName, country });
    } else {
      let country = detail.maxBuyerCountry as string;
      openDrawer({ to: 'buysers', companyName, country });
    }
  };
  const rederInfoBox = () => {
    return boxInfo.map((item, index) => {
      return (
        <InfoBox
          onClick={handlerOpenParams}
          index={index}
          // onChangeRecordCountRY={onChangeRecordCountRY}
          {...item}
        />
      );
    });
  };
  // const renderWarning = () => {
  //   return (
  //     <div className={style.warning_text}>
  //       <HideContactInfoIcon /> <span style={{ marginLeft: '4px' }}>由于某些国家的海关数据未披露交易金额等信息， 以上统计数据仅基于海关单据中已公开的数据。</span>
  //     </div>
  //   );
  // };
  return (
    <div className={style.baseInfo}>
      <div className={style.box} style={{ marginBottom: '32px' }}>
        {rederInfoBox()}
      </div>
      {/* 已挪至题目处 此处代码 已无用 先注释掉 保留记录 */}
      {/* {warnningTextShow ? renderWarning() : ''} */}
      {/* {hasEchar ? <BarEcharts barData={barData ?? []} onChangeYear={onChangeYear} year={year ?? []} type={dataType} /> : ''} */}
      {/* isCanExactDig 所有引用处皆传入false 疑似此段代码已废弃  已注释代码 保留记录 */}
      {/* {isCanExactDig ? (
        <div className={style.digBox}>
          <span>{getIn18Text('YIZAIQUANQIUSOUSHUJUKUPIPEIDAOGAIGONGSIGENGDUOXINXI')}</span>
          <span onClick={onDig} className={style.digBtn}>
            {getIn18Text('CHAKAN')}
          </span>
        </div>
      ) : (
        ''
      )} */}
    </div>
  );
};
export default BaseInfo;
