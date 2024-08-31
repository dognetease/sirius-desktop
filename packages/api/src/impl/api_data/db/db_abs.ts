import { resultObject } from '@/api/_base/api';

export class AbstractDBInterfaceImpl {
  protected dbCloneItem<T = resultObject>(item: T): T {
    return { ...item };
  }

  protected dbClone<T>(items: T | T[]) {
    if (!items || (Array.isArray(items) && items.length === 0)) {
      return items;
    }
    if (Array.isArray(items)) {
      const ret: T[] = [];
      items.forEach(it => {
        ret.push(this.dbCloneItem(it));
      });
      return ret;
    }
    return this.dbCloneItem(items);
  }

  protected async dbWait(duration = 1000) {
    return new Promise(r => {
      setTimeout(r, duration);
    });
  }
}
