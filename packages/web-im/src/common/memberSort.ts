export interface Rule<T> {
  field: keyof T;
  rule(param: T[keyof T], index: number): number | boolean;
}
export function memberSort<T>(list: T[], rules: Rule<T>[]): T[] {
  // 桶排序
  const orderedResult: T[][] = [];
  // 无序数组只要命中规则直接扔进来就完事了
  const unOrderedResult: T[] = [];

  list.forEach((item, index) => {
    rules.some(subItem => {
      const { rule, field } = subItem;
      const flag = rule(item[field], index);
      if (typeof flag === 'number') {
        if (flag !== -1) {
          orderedResult[flag] = orderedResult[flag] || [];
          orderedResult[flag].push(item);
        }
        return flag !== -1;
      }
      if (typeof flag === 'boolean') {
        if (flag) {
          unOrderedResult.push(item);
        }
        return flag;
      }
      return flag;
    });
  });

  return orderedResult
    .filter(item => Array.isArray(item))
    .reduce((total, cur) => [...total, ...cur], [])
    .concat(unOrderedResult);
}
