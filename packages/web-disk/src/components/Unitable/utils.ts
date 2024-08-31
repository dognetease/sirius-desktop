enum UnitableModeType {
  NORMAL = 'normal', // 正常展示
  ONLY_VIEW = 'onlyView', // 仅展示 view 部分
}
export const genOnlyViewUnitableUrl = (originUrl: string) => {
  const urlObj = new URL(originUrl);
  urlObj.searchParams.set('mode', UnitableModeType.ONLY_VIEW);
  return urlObj.toString();
};

export const genReadOnlyUnitableUrl = (originUrl: string) => {
  const urlObj = new URL(originUrl);
  urlObj.searchParams.set('readonly', 'true');
  return urlObj.toString();
};
