import { SalesPitchCardIdInfo, SalesPitchDataMap, SalesPitchStageConfList, SalesPitchStageConfMap, SalesPitchStages, SalesPitchTypes } from '@/api/logical/salesPitch';
import { getIn18Text } from '@/api/utils';

const SALES_PITCH_STAGE_CONFIG_LIST: SalesPitchStageConfList = [
  {
    id: 'START',
    name: getIn18Text('KAIFA'),
  },
  {
    id: 'INQUIRY',
    name: getIn18Text('XUNPAN'),
  },
  {
    id: 'QUOTATION',
    name: getIn18Text('BAOJIA'),
  },
  {
    id: 'SAMPLES',
    name: getIn18Text('YANGPIN'),
  },
  {
    id: 'ORDER',
    name: getIn18Text('DINGDAN'),
  },
  {
    id: 'MAINTENANCE',
    name: getIn18Text('RICHANGWEIHU'),
  },
];

const SALES_PITCH_STAGE_CONFIG_MAP: SalesPitchStageConfMap = SALES_PITCH_STAGE_CONFIG_LIST.reduce((total, current) => {
  total[current.id] = current;
  return total;
}, {} as SalesPitchStageConfMap);

const ID_SEP = '@#@';

export const salesPitchHelper = {
  getSalesPitchStageConfList(): SalesPitchStageConfList {
    return SALES_PITCH_STAGE_CONFIG_LIST;
  },
  getSalesPitchStageConfMap(): SalesPitchStageConfMap {
    return SALES_PITCH_STAGE_CONFIG_MAP;
  },
  genDefaultPitchDataMap(): SalesPitchDataMap {
    return SALES_PITCH_STAGE_CONFIG_LIST.reduce((total, current) => {
      total[current.id] = [];
      return total;
    }, Object.create(null));
  },
  // 根据 stageId type id 拼接为 card 的唯一ID
  genSalesPitchCardId({ stageId, type, id }: SalesPitchCardIdInfo): string {
    return `${stageId}${ID_SEP}${type}${ID_SEP}${id}`;
  },

  // 根据唯一 ID 反查 stageId type id
  splitSalesPitchCardId(cardId: string): SalesPitchCardIdInfo | undefined {
    const arr = cardId.split(ID_SEP);
    if (arr.length === 3) {
      return {
        stageId: arr[0] as SalesPitchStages,
        type: arr[1] as SalesPitchTypes,
        id: +arr[2],
      };
    }
    return undefined;
  },
};
