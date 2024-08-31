// import {
//   IndexedList, IndexFunc, ListStore, ListStoreIterator, StringTypedMap
// } from '../../../api/commonModel';
// //
// // export class ArrayIterator<T = any> {
// //   array: T[];
// //   count: number;
// //
// //   constructor(array: T[]) {
// //     this.array = array;
// //     this.count = 0;
// //   }
// //
// //   next(args: any) {
// //     console.log('iter:', args);
// //     do {
// //       const v = this.array[this.count++];
// //       const done = this.count >= this.array.length;
// //       if (v || done) {
// //         return {
// //           done,
// //           value: v,
// //         };
// //       }
// //     } while (this.count < this.array.length);
// //     return {
// //       done: true,
// //       value: undefined,
// //     };
// //   }
// //
// //   /**
// //    * //let count = 0;
// //    //return {
// //
// //    // };
// //    */
// //
// // }
//
// export type IndexMap={ [k: string]: IndexFunc };
//
// export class DbArrayMap<T=any> implements IndexedList {
//   static readonly DEFAULT_CAPACITY=2000000;
//
//   readonly array: ListStore<T>;
//
//   readonly primaryIndexMap: StringTypedMap<number>;
//
//   readonly getKey: ((item: Partial<T>)=>string | undefined);
//
//   readonly indexes: IndexMap;
//
//   deleted: number;
//
//   constructor(getKey: IndexFunc<T>, capacity?: number, array?: T[], otherKey?: IndexMap) {
//     this.getKey = getKey;
//     capacity = capacity || DbArrayMap.DEFAULT_CAPACITY;
//     this.indexes = { primary: this.getByKey, ...otherKey };
//     this.array = new ListStore<T>(capacity / 2, array, capacity, false);
//     this.primaryIndexMap = {};
//     this.deleted = 0;
//     // this.array.forEach(() => {
//     // let it: T | undefined, index: number;
//
//     // for (index in this.array) {
//     //   if (this.array.hasOwnProperty(index)) {
//     //     it = this.array[index];
//     //     if (it) {
//     //       const key = this.getKey(it);
//     //       if (key)
//     //         this.primaryIndexMap[key] = Number(index);
//     //     }
//     //   }
//     // }
//     // });
//   }
//
//   [Symbol.iterator]() {
//     return new ListStoreIterator(this.array);
//   }
//
//   getByIndex(idx: number): T | undefined {
//     return this.indexAcceptable(idx) ? this.array.getOb(idx) : undefined;
//   }
//
//   private indexAcceptable(idx: number) {
//     return idx != undefined && idx >= 0 && idx < this.array.size();
//   }
//
//   getByKey(key: string, indexName = 'primary'): T | undefined {
//     if (indexName == 'primary') {
//       if (key && key in this.primaryIndexMap) {
//         const idx = this.primaryIndexMap[key];
//         return this.getByIndex(idx);
//       }
//     }
//     return undefined;
//   }
//
//   get(item: T): T | undefined {
//     const key = this.getKey(item);
//     return key ? this.getByKey(key) : undefined;
//   }
//
//   add(item: T, replace?: boolean): boolean {
//     if (!item) return false;
//     const key = this.getKey(item);
//     if (!key) return false;
//     const exist = key in this.primaryIndexMap && this.indexAcceptable(this.primaryIndexMap[key]);
//     if (exist && !replace) return false;
//     if (!exist) {
//       const len = this.array.addOb(item);
//       this.primaryIndexMap[key] = len - 1;
//       return true;
//     } if (exist && replace) {
//       // const idx = this.primaryIndexMap[key];
//       this.add(item);
//       return true;
//     }
//     return false;
//   }
//
//   addAll(items: T[], replace?: boolean): number {
//     // TODO: optimize performance
//     if (!items || items.length == 0) return 0;
//     let ret = 0;
//     items.forEach(it => {
//       if (this.add(it, replace)) ret++;
//     });
//     return ret;
//   }
//
//   remove(item: Partial<T>): boolean {
//     // TODO: optimize performance
//     if (!item) return false;
//     const key = this.getKey(item);
//     if (!key) return false;
//     if (!(key in this.primaryIndexMap)) return false;
//     const idx = this.primaryIndexMap[key];
//     if (this.indexAcceptable(idx)) {
//       // delete this.array[idx];
//       delete this.primaryIndexMap[key];
//       this.deleted++;
//       return true;
//     }
//     return false;
//   }
//
//   removeAll(items: Partial<T>[]): number {
//     if (!items || items.length == 0) return 0;
//     let ret = 0;
//     items.forEach(it => {
//       if (this.remove(it)) ret++;
//     });
//     return ret;
//   }
//
//   clear(): void {
//     this.deleted = 0;
//   }
//
//   containsKey(key: string) {
//     return key && key in this.primaryIndexMap && this.primaryIndexMap[key] != undefined;
//   }
//
//   contains(item: Partial<T>): boolean {
//     const key = this.getKey(item);
//     return key ? this.primaryIndexMap[key] != undefined : false;
//   }
//
//   size(): number {
//     return this.array.size() - this.deleted;
//   }
//
//   update(item: T): boolean {
//     const key = this.getKey(item);
//     if (key) {
//       const idx = this.primaryIndexMap[key];
//       if (this.indexAcceptable(idx)) {
//         this.array.addOb(item);
//         return true;
//       }
//     }
//     return false;
//   }
//
//   rearrangeArray() {
//
//   }
//
//   getAll(count?: number, start?: number): T[] {
//     if (count == undefined) {
//       count = 20;
//     }
//     if (start == undefined) {
//       start = 0;
//     }
//     count = count <= 0 ? 1 : (count > this.size() ? this.size() : count);
//     const ret: T[] = [];
//     let idx = 0;
//     for (const it of this.array) {
//       if (it) {
//         if (idx >= start && ret.length < count) {
//           ret.push(it);
//         }
//         if (ret.length >= count) {
//           break;
//         }
//         idx++;
//       }
//     }
//     return ret;
//   }
// }
