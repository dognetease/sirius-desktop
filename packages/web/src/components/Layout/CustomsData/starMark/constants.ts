export enum StarTableTypeEnum {
  Subscribe = 'subscribe',
  Import = 'import',
}

export const StarTableTypeOptions: Array<{
  label: string;
  value: StarTableTypeEnum;
}> = [
  {
    label: '公司订阅',
    value: StarTableTypeEnum.Subscribe,
  },
  {
    label: '公司导入',
    value: StarTableTypeEnum.Import,
  },
];

export enum FissionStatusEnumType {
  Nonsupported = -1,
  InFission = 1,
  Finished = 2,
  Todo = 0,
}

export enum MatchStatusEnumType {
  All = 'all',
  Matching = 0,
  Match = 1,
  Unmatch = 2,
}

export const MatchStatusText = {
  [MatchStatusEnumType.All]: '',
  [MatchStatusEnumType.Matching]: '匹配中',
  [MatchStatusEnumType.Match]: '',
  [MatchStatusEnumType.Unmatch]: '无海关数据',
};

export const MatchStatusList = [
  {
    value: MatchStatusEnumType.All,
    label: '全部',
  },
  {
    value: MatchStatusEnumType.Match,
    label: '已匹配到',
  },
  {
    value: MatchStatusEnumType.Unmatch,
    label: '未匹配到',
  },
  {
    value: MatchStatusEnumType.Matching,
    label: '匹配中',
  },
];
