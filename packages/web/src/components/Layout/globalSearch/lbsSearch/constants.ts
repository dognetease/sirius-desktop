export enum LbsSearchTypeEnum {
  Internal = 'internal',
  Overseas = 'overseas',
}

export const LbsSearchTypeOptions: Array<{
  label: string;
  value: LbsSearchTypeEnum;
}> = [
  {
    label: '海外',
    value: LbsSearchTypeEnum.Overseas,
  },
  {
    label: '国内',
    value: LbsSearchTypeEnum.Internal,
  },
];
