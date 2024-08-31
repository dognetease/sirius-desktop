import { SalesPitchStageConfList, SalesPitchStageConfMap } from 'api';
import { getIn18Text } from 'api';

export const SALES_PITCH_STAGE_CONFIG_LIST: SalesPitchStageConfList = [
  { id: 'START', name: getIn18Text('KAIFA') },
  { id: 'INQUIRY', name: getIn18Text('XUNPAN') },
  { id: 'QUOTATION', name: getIn18Text('BAOJIA') },
  { id: 'SAMPLES', name: getIn18Text('YANGPIN') },
  { id: 'ORDER', name: getIn18Text('DINGDAN') },
  { id: 'MAINTENANCE', name: getIn18Text('RICHANGWEIHU') },
];

// export const SALES_PITCH_STAGE_CONFIG_MAP: SalesPitchStageConfMap = SALES_PITCH_STAGE_CONFIG_LIST.reduce((total, current) => {
//   total[current.id] = current;
//   return total;
// }, {} as SalesPitchStageConfMap);

export const genDefaultPitchDataMap = () =>
  SALES_PITCH_STAGE_CONFIG_LIST.reduce((total, current) => {
    total[current.id] = [];
    return total;
  }, Object.create(null));
