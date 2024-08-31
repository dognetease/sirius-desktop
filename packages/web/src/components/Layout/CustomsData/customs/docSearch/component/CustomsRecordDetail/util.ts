import { CustomsRecord, CustomsRecordType } from 'api';
import moment from 'moment';
import { getIn18Text } from 'api';

export function getRecordType(key?: CustomsRecordType, extra?: boolean) {
  const crtMap: { [key in CustomsRecordType]: string } = {
    Export: getIn18Text('CHUKOU') + (extra ? '运单' : ''),
    Import: getIn18Text('JINKOU') + (extra ? '提单' : ''),
  };
  const value = key ? crtMap[key] : '';
  return value;
}

export function getRecordCountry(record: CustomsRecord, target?: CustomsRecordType) {
  const recordType = target || record.recordType;
  const nameEn = recordType === 'Export' ? record.shpCountry : record.conCountry;
  const nameCn = recordType === 'Export' ? record.shpCountryCn : record.conCountryCn;
  if (nameCn && nameEn) {
    return `${nameEn} (${nameCn})`;
  } else if (nameEn) {
    return nameEn;
  } else {
    return nameCn;
  }
}

export function getFixedNoneZeroValue(value: string | number | undefined | null, fractionDigits: number = 2) {
  const v = Number(value);
  if (Number.isFinite(v) && v !== 0) {
    return v.toFixed(fractionDigits);
  }
  return '';
}

function getUnitPrice(record: CustomsRecord) {
  const price = Number(record.valueOfGoodsUSD) / Number(record.itemQuantity ?? 1);
  return getFixedNoneZeroValue(price);
}

interface CustomsRecordSort {
  title: string;
  items: Array<{
    value?: string | number;
    noneText?: string;
    searchType?: 'import' | 'export';
    label: string;
  }>;
}

export const getCustomsRecordSorts: (record: CustomsRecord) => Array<CustomsRecordSort> = record => {
  return [
    {
      title: '基础信息',
      items: [
        {
          label: '国家名称',
          value: getRecordCountry(record),
        },
        {
          label: '进口或出口',
          value: getRecordType(record.recordType),
        },
        {
          label: '申报日期',
          value: record.shpmtDate ? moment(record.shpmtDate).format('YYYY-MM-DD') : '',
        },
        {
          label: 'HSCode',
          value: record.hsCode,
        },
      ],
    },
    {
      title: '采购商信息',
      items: [
        {
          label: getIn18Text('CAIGOUSHANG'),
          searchType: 'import',
          value: (record.originConName ?? '') + (record.conOrgCode ? `(${record.conOrgCode})` : ''),
        },
        {
          label: '采购商所在国家',
          value: getRecordCountry(record, 'Import'),
        },
        {
          label: '采购商城市',
          value: record.conCity,
        },
        {
          label: '采购商地址',
          value: record.conFullAddress,
        },
        {
          label: '采购商邮编',
          value: record.conPostalCode,
        },
        {
          label: '采购商联系人姓名',
          value: record.consignee,
        },
        {
          label: '采购商电话',
          value: record.conPhoneNum,
        },
        {
          label: '采购商电子邮件',
          value: record.conEmail,
        },
        {
          label: '采购商网址',
          value: record.conWebUrl,
        },
      ],
    },
    {
      title: '供应商信息',
      items: [
        {
          label: getIn18Text('GONGYINGSHANG'),
          searchType: 'export',
          value: (record.originShpName ?? '') + (record.shpOrgCode ? `(${record.shpOrgCode})` : ''),
        },
        {
          label: '供应商所在国家',
          value: getRecordCountry(record, 'Export'),
        },
        {
          label: '供应商城市',
          value: record.shpCity,
        },
        {
          label: '供应商地址',
          value: record.shpFullAddress,
        },
        {
          label: '供应商邮编',
          value: record.shpPostalCode,
        },
        {
          label: '供应商联系人姓名',
          value: record.shipper,
        },
        {
          label: '供应商电话',
          value: record.shpPhoneNum,
        },
        {
          label: '供应商电子邮件',
          value: record.shpEmail,
        },
        {
          label: '供应商网址',
          value: record.shpWebUrl,
        },
      ],
    },
    {
      title: '商品情况',
      items: [
        {
          label: getIn18Text('TIHUOGANG'),
          value: record.portOfLading,
        },
        {
          label: getIn18Text('MUDIGANG'),
          value: record.portOfUnLading,
        },
        {
          label: record.conCountry === 'United States' ? '抵达日期' : '申报日期',
          value:
            record.conCountry === 'United States'
              ? record.arrivalDate
                ? moment(record.arrivalDate).format('YYYY-MM-DD')
                : ''
              : record.shpmtDate
              ? moment(record.shpmtDate).format('YYYY-MM-DD')
              : '',
        },
        {
          label: '产销州',
          value: record.originCountry,
        },
        {
          label: getIn18Text('SHANGPINMIAOSHU'),
          value: record.goodsShipped,
        },
        {
          label: getIn18Text('JINE（MEIYUAN）'),
          value: record.valueOfGoodsUSD,
          noneText: getIn18Text('WEIGONGKAI'),
        },
        {
          label: getIn18Text('SHULIANG'),
          value: (record.itemQuantity ?? '') + (record.itemUnit ?? ''),
          noneText: getIn18Text('WEIGONGKAI'),
        },
        {
          label: '单价',
          value: getUnitPrice(record),
          noneText: getIn18Text('WEIGONGKAI'),
        },
        {
          label: '集装箱数量',
          value: record.containerQuantity,
        },
        {
          label: '重量(公斤)',
          value: getFixedNoneZeroValue(record.weightKg),
          noneText: '未公开',
        },
        {
          label: '净重' + (record.weightUnit ? `(${record.weightUnit})` : ''),
          value: getFixedNoneZeroValue(record.netWeight),
          noneText: '未公开',
        },
        {
          label: '毛重' + (record.weightUnit ? `(${record.weightUnit})` : ''),
          value: getFixedNoneZeroValue(record.grossWeight),
          noneText: '未公开',
        },
        {
          label: '行业',
          value: record.industry,
        },
        {
          label: '子行业',
          value: record.subIndustry,
        },
      ],
    },
    {
      title: '其它信息',
      items: [
        {
          label: '提单号',
          value: record.billOfLadingNum,
        },
        {
          label: '报关单号',
          value: record.declarationNum,
        },
        {
          label: '运输公司',
          value: record.carrier,
        },
        {
          label: '船公司',
          value: record.shipCompany,
        },
        {
          label: '运费条款',
          value: record.freightClause,
        },
        {
          label: '贸易类型',
          value: record.tradeType,
        },
        {
          label: '运输方式',
          value: record.transportMethod,
        },
        {
          label: '中转国',
          value: record.transitCountry,
        },
        {
          label: '贸易方式',
          value: record.tradeMode,
        },
        {
          label: '成交方式',
          value: record.tradeTerm,
        },
      ],
    },
  ];
};
