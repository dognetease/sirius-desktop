import { customsDataType } from 'api';
import { getIn18Text } from 'api';

// 供应/采购 搜索类型
export const tabList: Array<{ label: string; value: customsDataType }> = [
  {
    label: getIn18Text('GONGSI'),
    value: 'company',
  },
  {
    label: getIn18Text('CHANPIN'),
    value: 'goodsShipped',
  },
  {
    label: 'HSCode',
    value: 'hsCode',
  },
];

export const breadList = [getIn18Text('HAIGUANSHUJU'), getIn18Text('SHUJUSOUSUO'), '贸易详情'];
export const forwarderBreadList = ['港口搜索', getIn18Text('SHUJUSOUSUO'), '贸易详情'];

export const tips = [
  getIn18Text('FUGAI230JIAGUOJIAHEDIQU'),
  getIn18Text('30YIJIASHUJU'),
  getIn18Text('1000WANCAIGOUSHANG'),
  getIn18Text('800WANGONGYINGSHANG'),
  getIn18Text('QUANWEIZHUNQUESHUJUKU'),
];

export const CUSTOMS_DATA_SEARCH_HISTORY = 'CUSTOMS_DATA_NEW_SEARCH_HISTORY';

export const CUSTOMS_DATA_BASE_INFO = 'CUSTOMS_DATA_BASE_INFO';

export const FORWARDER_CUSTOMS_DATA_SEARCH_HISTORY = 'FORWARDER_CUSTOMS_DATA_SEARCH_HISTORY';

export const NotAllowCustomsSearch = getIn18Text('QINGSHURUGUANJIANCI');

export const SEARCH_OVER_100_CHAR = '请输入100个字符以内';
