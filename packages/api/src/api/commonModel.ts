// doc/docx/xls/xlsx/ppt/pptx/pdf/jpg/jpeg/png
// eslint-disable-next-line max-classes-per-file
import { commonMessageReturn } from './_base/api';

export type StringMap = {
  [k: string]: string;
};

export type NumberMap = {
  [k: number]: string;
};

export type StringTypedMap<T = any> = {
  [k: string]: T;
};

export type NumberTypedMap<T = any> = {
  [k: number]: T;
};

export interface ModelHelper<T = any> {
  compare(a: T, b: T): number;

  merge(a: T, b: T): T;

  hash(a: T): string;
}

export interface IndexedList<T = any> extends Iterable<T | undefined> {
  // array: T[];
  // primaryIndexMap: StringTypedMap<number>;
  // getKey: ((item: Partial<T>) => string | undefined);
  // deleted: number;

  [Symbol.iterator](): { next: (args: any) => { done: boolean; value: any } };

  get(item: T): T | undefined;

  add(item: T, replace?: boolean): boolean;

  addAll(items: T[], replace?: boolean): number;

  remove(item: Partial<T>): boolean;

  removeAll(items: Partial<T>[]): number;

  contains(item: Partial<T>): boolean;

  size(): number;

  update(item: T): boolean;

  getAll(count?: number, start?: number): T[];
}

export class ArrayIterator<T = any> {
  array: T[];

  count: number;

  constructor(array: T[]) {
    this.array = array;
    this.count = 0;
  }

  next() {
    // console.log('iter:', args);
    do {
      const v = this.array[this.count++];
      const done = this.count >= this.array.length;
      if (v || done) {
        return {
          done,
          value: v,
        };
      }
    } while (this.count < this.array.length);
    return {
      done: true,
      value: undefined,
    };
  }

  /**
   * //let count = 0;
   //return {

   // };
   */
}

export type IndexMap = { [k: string]: IndexFunc };

export type IndexFunc<T = any> = (item: Partial<T>) => string | undefined;

// TODO : format the array to remove the undefined element when deleted too many elements
export class ArrayMap<T = any> implements IndexedList {
  readonly array: T[];

  readonly primaryIndexMap: StringTypedMap<number>;

  readonly getKey: (item: Partial<T>) => string | undefined;

  // readonly indexes:IndexMap;
  deleted: number;

  constructor(getKey: IndexFunc<T>, array?: T[]) {
    this.getKey = getKey;
    // this.indexes = Object.assign({primary:this.getByKey}, otherKey);
    this.array = array || [];
    this.primaryIndexMap = {};
    this.deleted = 0;
    this.array.forEach((it: T, index: number) => {
      const key = this.getKey(it);
      if (key) this.primaryIndexMap[key] = index;
    });
  }

  [Symbol.iterator]() {
    return new ArrayIterator(this.array);
  }

  getByIndex(idx: number): T | undefined {
    return this.indexAcceptable(idx) ? this.array[idx] : undefined;
  }

  private indexAcceptable(idx: number) {
    return idx !== undefined && idx >= 0 && idx < this.array.length;
  }

  getByKey(key: string, indexName = 'primary'): T | undefined {
    if (indexName === 'primary') {
      if (key && key in this.primaryIndexMap) {
        const idx = this.primaryIndexMap[key];
        return this.getByIndex(idx);
      }
    }
    return undefined;
  }

  get(item: T): T | undefined {
    const key = this.getKey(item);
    return key ? this.getByKey(key) : undefined;
  }

  add(item: T, replace?: boolean): boolean {
    if (!item) return false;
    const key = this.getKey(item);
    if (!key) return false;
    const exist = key in this.primaryIndexMap && this.indexAcceptable(this.primaryIndexMap[key]);
    if (exist && !replace) return false;
    if (!exist) {
      const len = this.array.push(item);
      this.primaryIndexMap[key] = len - 1;
      return true;
    }
    if (exist && replace) {
      const idx = this.primaryIndexMap[key];
      this.array[idx] = item;
      return true;
    }
    return false;
  }

  addAll(items: T[], replace?: boolean): number {
    // TODO: optimize performance
    if (!items || items.length === 0) return 0;
    let ret = 0;
    items.forEach(it => {
      if (this.add(it, replace)) ret++;
    });
    return ret;
  }

  remove(item: Partial<T>): boolean {
    // TODO: optimize performance
    if (!item) return false;
    const key = this.getKey(item);
    if (!key) return false;
    if (!(key in this.primaryIndexMap)) return false;
    const idx = this.primaryIndexMap[key];
    if (this.indexAcceptable(idx)) {
      delete this.array[idx];
      delete this.primaryIndexMap[key];
      this.deleted++;
      return true;
    }
    return false;
  }

  removeAll(items: Partial<T>[]): number {
    if (!items || items.length === 0) return 0;
    let ret = 0;
    items.forEach(it => {
      if (this.remove(it)) ret++;
    });
    return ret;
  }

  clear(): void {
    this.deleted = 0;
  }

  containsKey(key: string) {
    return key && key in this.primaryIndexMap && this.primaryIndexMap[key] !== undefined;
  }

  contains(item: Partial<T>): boolean {
    const key = this.getKey(item);
    return key ? this.primaryIndexMap[key] !== undefined : false;
  }

  size(): number {
    return this.array.length - this.deleted;
  }

  update(item: T): boolean {
    const key = this.getKey(item);
    if (key) {
      const idx = this.primaryIndexMap[key];
      if (this.indexAcceptable(idx)) {
        this.array[idx] = item;
        return true;
      }
    }
    return false;
  }

  // rearrangeArray() {
  //
  // }

  getAll(cnt?: number, str?: number): T[] {
    let count = cnt;
    let start = str;
    if (count !== undefined) {
      if (start === undefined) {
        start = 0;
      }
      if (count <= 0) {
        count = 1;
      } else {
        count = count > this.size() ? this.size() : count;
      }
      return this.array.slice(start, start + count);
    }
    return this.array;
  }
}

export class FixSizeQueue<T = any> implements Iterable<T | undefined> {
  array: Array<T>;

  maxSize: number;

  constructor(size?: number) {
    if (size && size <= 1) throw new Error('size illegal');
    this.maxSize = size || 16;
    this.array = new Array<T>(this.maxSize);
  }

  [Symbol.iterator]() {
    return new ArrayIterator(this.array);
  }

  push(obj: T): number {
    this.array.push(obj);
    if (this.array.length > this.maxSize) {
      this.array = this.array.slice(1, this.array.length);
    }
    return this.array.length;
  }

  pop(): T | undefined {
    return this.array.pop();
  }

  size() {
    return this.array.length;
  }

  max() {
    return this.maxSize;
  }

  toArray() {
    return this.array.slice();
  }
}

export class ListStore<T = any> implements Iterable<T | undefined> {
  private readonly capacity: number = 1000000;

  readonly initPos: number = this.capacity / 2;

  readonly numberRegx = /-?\d+/;

  readonly limitSize: boolean;

  index: number = this.initPos;

  forwardIndex: number = this.initPos - 1;

  total = 0;

  deleted = 0;

  forwardTotal = 0;

  forwardDeleted = 0;

  store: Map<number, T>;

  constructor(initSeq?: number, arr?: T[], capacity?: number, sizeLimited?: boolean) {
    if (capacity) this.capacity = capacity;
    this.limitSize = !!sizeLimited;
    if (initSeq) {
      this.initPos = initSeq;
      this.index = initSeq;
      this.forwardIndex = this.initPos - 1;
    }
    this.store = new Map<number, T>();
    if (arr && arr.length > 0) {
      /* for (const i in arr) */
      arr.forEach(i => {
        const seq = this.index++;
        this.total++;
        this.store.set(seq, arr[Number(i)]);
      });
    }
  }

  size(): number {
    return this.forwardTotal + this.total - this.forwardDeleted - this.deleted;
  }

  addOb(ob: T, prepend?: boolean): number {
    let seq = 0;
    seq = prepend ? this.forwardIndex-- : this.index++;
    if (this.limitSize && (seq < 0 || seq > this.capacity)) {
      throw new Error('not enough room');
    }
    // seq = prepend ? this.forwardIndex-- : this.index++;
    if (prepend) {
      this.forwardTotal++;
    } else {
      this.total++;
    }
    this.store.set(seq, ob);
    return seq;
  }

  getOb(id: number) {
    return this.store.get(id);
  }

  removeOb(id: number): T | undefined {
    let ret;
    if (this.store.get(id)) {
      ret = this.store.get(id) as T; // this[id] as T;
      // this[id] = undefined;
      // ;
      this.store.delete(id);
    }
    if (id >= this.initPos) {
      this.deleted++;
    } else {
      this.forwardDeleted++;
    }
    return ret;
  }

  iterate(iterator: (ob: T) => void): Promise<commonMessageReturn> {
    return new Promise<commonMessageReturn>((r, j) => {
      if (this.total === 0) {
        j(new Error('no ob registered'));
      } else {
        let total = 0;
        this.store.forEach(it => {
          if (it) {
            try {
              iterator(it as T);
              ++total;
            } catch (e) {
              console.warn('[model] event failed for ' + it, e);
            }
          }
        });

        r(String(total));
      }
    });
  }

  rearrange(seq: number): number {
    // let start=seq<0?0:this.initPos,end=seq<0?this.initPos:this.capacity;
    // let undefinedPos=-1;
    // let preparedElement=undefined;
    let recycled = 0;
    const arr: Array<T> = new Array(this.capacity / 2);
    if (seq < 0) {
      if (this.forwardDeleted === 0) return 0;
      for (let k = 0; k < this.initPos; ++k) {
        const ob = this.getOb(k);
        if (ob) {
          arr.push(ob as T);
          this.store.delete(k);
        }
      }
      this.forwardTotal = arr.length;
      this.forwardDeleted = 0;
    } else {
      if (this.deleted === 0) return 0;
      for (let k = this.capacity; k > this.initPos; --k) {
        const ob1 = this.getOb(k);

        if (ob1) {
          arr.push(ob1 as T);
          this.store.delete(k);
        }
      }
      this.total = arr.length;
      this.deleted = 0;
    }
    recycled = this.capacity / 2 - arr.length;
    if (recycled <= 1) return 0;
    if (seq < 0) {
      this.forwardIndex = this.initPos - 1;
      arr.forEach(it => {
        this.store.set(this.forwardIndex--, it);
      });
    } else {
      this.index = this.initPos;
      arr.forEach(it => {
        this.store.set(this.index++, it);
      });
    }
    return recycled;
  }

  [Symbol.iterator](): Iterator<T | undefined> {
    return new ListStoreIterator<T>(this);
  }
}

export class ListStoreIterator<T = any> {
  // array: T[];
  seq: number;

  data: ListStore<T>;

  constructor(data: ListStore<T>) {
    this.seq = data.forwardIndex;
    this.data = data;
  }

  next() {
    // console.log('iter:', args);
    do {
      const v = this.data.getOb(this.seq++);
      const done = this.seq > this.data.index;
      if (v || done) {
        return {
          done,
          value: v,
        };
      }
    } while (this.seq <= this.data.index);
    return {
      done: true,
      value: undefined,
    };
  }

  /**
   * //let count = 0;
   //return {

   // };
   */
}

export class SequenceHelper {
  seq: number;

  max = 10000000;

  constructor(seq?: number | undefined, max?: number | undefined) {
    this.seq = seq || 1;
    this.max = max || this.max;
  }

  setSeq(seq: number): void {
    if (seq < this.max) this.seq = seq;
  }

  next(): number {
    this.seq++;
    if (this.seq > this.max) {
      this.seq = 1;
    }
    return this.seq;
  }
}
