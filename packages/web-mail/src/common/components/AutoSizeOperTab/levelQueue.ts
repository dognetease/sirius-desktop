/**
 * 数据结构-用于自动菜单缩进组件的 多级队列
 */

// tab的size枚举
export enum TAB_SIZE {
  MINI = 0,
  SMALL = 1,
  NORMAIL = 2,
}

interface tabInfo {
  key: string;
  level: number;
  size: number;
  index: number;
  width: number;
  size2widthMap: { [key: number]: number };
}

// 最大迭代次数
const MAX_ITERATION = 300;

class LevelQueue {
  // map用于存储数据
  private map: Map<number, any[]>;
  // 迭代次数计数器
  private iterationCount = 0;

  /**
   *
   * @param arr 初始化数据队列数据
   */
  constructor(arr: number[] = []) {
    this.map = new Map();
    arr.forEach(key => {
      this.map.set(key, []);
    });
  }

  // 按照size插入到对应的队列中
  insert(data: tabInfo[]): void {
    try {
      data.forEach(item => {
        const { size } = item;
        if (this.map.has(size)) {
          const arr = this.map.get(size);
          if (Array.isArray(arr)) {
            arr.push(item);
          }
        }
      });
    } catch (error) {
      console.error('[LevelQueue] insert error', error);
    }
  }

  // 更新数据
  update(data: tabInfo[]): void {
    try {
      this.map.forEach(arr => {
        arr.length = 0;
      });
      this.insert(data);
    } catch (error) {
      console.error('[LevelQueue] update error', error);
    }
  }

  /**
   *
   * 返回适合缩进的元素
   */
  getMinValue(): tabInfo | undefined {
    let minSize = Infinity;
    // 查找最小的size,且数组有值的
    this.map.forEach((arr, size) => {
      if (arr.length && size < minSize) {
        minSize = size;
      }
    });
    // size+1的数组中有值，就在size+1的数组中查找
    let arr = [];
    if (this.map.get(minSize + 1)?.length) {
      arr = this.map.get(minSize + 1) || [];
    } else {
      arr = this.map.get(minSize) || [];
    }

    if (Array.isArray(arr) && arr.length > 0) {
      // 查找当前数组中level最大的元素，如果最大的level有多个，就取index最大的那个
      let maxLevel = 0;
      arr.forEach(item => {
        if (item.level > maxLevel) {
          maxLevel = item.level;
        }
      });
      // 查找所有level为maxLevel的元素
      const targetArr = arr.filter(item => item.level === maxLevel);
      // 查找index最大的元素
      const target = targetArr.reduce((prev, current) => {
        return prev.index > current.index ? prev : current;
      });
      return target;
    }
  }

  /**
   * 返回适合展开的元素
   */
  getMaxValue(): tabInfo | undefined {
    let minSize = Infinity;
    // 查找最小的size,且数组有值的
    this.map.forEach((arr, sizeKey) => {
      if (arr.length && sizeKey < minSize) {
        minSize = sizeKey;
      }
    });
    // size+1的数组中有值，就在size+1的数组中查找
    let arr = [];
    if (this.map.get(minSize)?.length) {
      arr = this.map.get(minSize) || [];
    } else {
      arr = this.map.get(minSize + 1) || [];
    }

    if (Array.isArray(arr) && arr.length > 0) {
      // 查找当前数组中level最大的元素，如果最大的level有多个，就取index最大的那个
      let minLevel = +Infinity;
      arr.forEach(item => {
        if (item.level < minLevel) {
          minLevel = item.level;
        }
      });
      // 查找所有level为maxLevel的元素
      const targetArr = arr.filter(item => item.level === minLevel);
      // 查找index最大的元素
      const target = targetArr.reduce((prev, current) => {
        return prev.index < current.index ? prev : current;
      });
      return target;
    }
  }

  // 将元素写回对应级别的队列中
  insertByLevel(arg: tabInfo) {
    const arr = this.map.get(arg.size);
    if (arr) {
      arr.push(arg);
    }
  }

  // 获取上一个级别
  getPrevLevel(level: number) {
    return level - 1 >= TAB_SIZE.MINI ? level - 1 : TAB_SIZE.MINI;
  }

  // 获取下一个界别
  getNextLevel(level: number) {
    return level + 1 <= TAB_SIZE.NORMAIL ? level + 1 : TAB_SIZE.NORMAIL;
  }

  // 元素降级
  downgrade(arg: tabInfo) {
    try {
      // 查找对应的level数组
      const arr = this.map.get(arg.size);
      // 从数组中删除该项目
      arr?.splice(
        arr.findIndex(item => item.key === arg.key),
        1
      );
      // 更新level
      arg.size = this.getPrevLevel(arg.size);
      // 将元素写回对应级别的队列中
      this.insertByLevel(arg);
    } catch (error) {
      console.error('[LevelQueue] downgrade error', error);
    }
  }

  // 元素升级
  upgrade(arg: tabInfo) {
    try {
      // 查找对应的level数组
      const arr = this.map.get(arg.size);
      // 从数组中删除该项目
      arr?.splice(
        arr.findIndex(item => item.key === arg.key),
        1
      );
      // 更新level
      arg.size = this.getNextLevel(arg.size);
      // 将元素写回对应级别的队列中
      this.insertByLevel(arg);
    } catch (error) {
      console.error('[LevelQueue] upgrade error', error);
    }
  }

  // 获取当前的总宽度
  getTotalWidth() {
    let totalWidth = 0;
    try {
      this.map.forEach(arr => {
        arr.forEach(item => {
          totalWidth += item.size2widthMap[item.size] || 0;
        });
      });
    } catch (error) {
      console.error('[LevelQueue] getTotalWidth error', error);
    }
    return totalWidth;
  }

  // 获取预估总宽度
  getEstimateTotalWidth(key: string, width: number) {
    let totalWidth = 0;
    try {
      this.map.forEach(arr => {
        arr.forEach(item => {
          if (item.key === key) {
            totalWidth += width;
          } else {
            totalWidth += item.size2widthMap[item.size] || 0;
          }
        });
      });
    } catch (error) {
      console.error('[LevelQueue] getEstimateTotalWidth error', error);
    }
    return totalWidth;
  }

  // 迭代，获得稳定状态
  getChabuduodeState(wrapWidth: number, canResetCount: boolean = true) {
    // 增加迭代次数计数器
    this.iterationCount++;

    // 检查迭代次数是否超过最大限制
    if (this.iterationCount > MAX_ITERATION) {
      // 达到最大迭代次数，退出递归
      return;
    }
    try {
      // 获取当前的总宽度
      let totalWidth = this.getTotalWidth();
      // 是否超出
      const isOverFlow = totalWidth > wrapWidth;
      if (isOverFlow) {
        // 如果没有足够的空间
        const min = this.getMinValue();
        if (min && min.key != null) {
          // 判断最小值是否已经达到终止态
          if (min?.size > TAB_SIZE.MINI) {
            // 如果没有达到终止态，就降级
            this.downgrade(min);
            // 继续迭代
            this.getChabuduodeState(wrapWidth, false);
          }
        }
      } else {
        // 如果有足够的空间
        const max = this.getMaxValue();
        if (max && max.key != null) {
          // 判断最大值是否已经达到终止态
          if (max?.size < TAB_SIZE.NORMAIL) {
            const tempTotalWidth = this.getEstimateTotalWidth(max.key, max.size2widthMap[this.getNextLevel(max.size)]);
            // 如果预估的宽度小于wrapWidth
            if (tempTotalWidth < wrapWidth) {
              // 如果没有达到终止态，就升级
              this.upgrade(max);
              // 继续迭代
              this.getChabuduodeState(wrapWidth, false);
            }
          }
        }
      }
    } catch (error) {
      console.error('[LevelQueue] getChabuduodeState error', error);
    }

    // 重置迭代次数计数器
    if (canResetCount) {
      this.iterationCount = 0;
    }
  }

  // 获取最终状态,将map以Update参数一样的形式返回
  getFinalState() {
    const result: tabInfo[] = [];
    try {
      this.map.forEach(arr => {
        arr.forEach(item => {
          result.push({
            ...item,
            size: item.size,
          });
        });
      });
    } catch (error) {
      console.error('[LevelQueue] getFinalState error', error);
    }

    return result;
  }
}

export default LevelQueue;
