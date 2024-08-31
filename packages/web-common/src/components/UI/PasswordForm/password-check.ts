/* eslint-disable no-useless-escape */
/* eslint-disable no-bitwise */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-properties */
/* eslint-disable no-unused-vars */
/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
/* eslint-disable radix */
/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
import pinyin from 'tiny-pinyin';

class PasswordValidation {
  private toPinyin(str: string) {
    try {
      return pinyin.convertToPinyin(str, '', true);
    } catch (e) {
      console.warn(e);
      return str;
    }
  }

  /**
   * @param arr 字符串
   * @param limit 分割限制
   * @returns 'aabbcc' => ['aa','ab','bb','bc','cc']
   */
  private chunkStringArray(arr: string, limit = 3) {
    const result: string[] = [];

    try {
      for (let i = 0; i < arr.length - limit + 1; i++) {
        let count = 0;
        let group = '';
        while (count < limit) {
          group += arr[count + i];
          count++;
        }
        result.push(group);
      }
      return result;
    } catch (error) {
      return [];
    }
  }

  /**
   * 字符串是否全部相同
   * @param char
   * @returns
   */
  private isSameStr(char: string) {
    const firstLetter = char[0];
    return Array.from(char).every(letter => letter === firstLetter);
  }

  /** 是否连续数字 */
  private isNumberConsecutive(number: string) {
    try {
      if (!/^\d+$/.test(number)) return false;
      const isProgressive = Array.from(number).every((n, index, arr) => {
        if (index === 0) return true;
        return parseInt(n) === parseInt(arr[index - 1]) + 1;
      });
      const isRegressive = Array.from(number).every((n, index, arr) => {
        if (index === 0) return true;
        return parseInt(n) === parseInt(arr[index - 1]) - 1;
      });
      return isProgressive || isRegressive;
    } catch (error) {
      return false;
    }
  }

  /** 是否连续字符 */
  private isCharConsecutive(char: string) {
    try {
      if (!/^[a-zA-Z]+$/.test(char)) return false;

      const isProgressive = Array.from(char).every((n, index, arr) => {
        if (index === 0) return true;
        return n.charCodeAt(0) === arr[index - 1].charCodeAt(0) - 1;
      });
      const isRegressive = Array.from(char).every((n, index, arr) => {
        if (index === 0) return true;
        return n.charCodeAt(0) === arr[index - 1].charCodeAt(0) + 1;
      });

      return isProgressive || isRegressive;
    } catch (error) {
      return false;
    }
  }

  /**
   *  每n个数字或者字符是否连续
   * @param type 校验类型 数字或者字符
   * @param limit 每 n 个
   */
  public isStringConsecutive(password: string, type: 'number' | 'char', limit = 3) {
    const chunkedArray = this.chunkStringArray(password, limit);
    if (type === 'char') return chunkedArray.some(this.isCharConsecutive);
    if (type === 'number') return chunkedArray.some(this.isNumberConsecutive);
    return false;
  }

  /**
   *
   * @param password 密码
   * @param accountName 用户名
   * @returns
   */
  public isIncludeAccount(password: string, accountName: string) {
    try {
      if (!password.length) return false;
      const lowerPassword = password.toLowerCase().trim();
      const lowerAccountName = accountName.toLowerCase().trim();
      // const lowerAccountName = accountName.toLowerCase().replace(/\d+/, '').trim();
      // lowerAccountName为空时，会导致这个校验规则失效
      return !!lowerAccountName && lowerPassword.includes(lowerAccountName);
    } catch (error) {
      return false;
    }
  }

  /**
   * 是否包含用户拼音
   * @param password 密码
   * @param userName 用户中文名
   * @returns
   */
  public isIncludeUsername(password: string, userName: string) {
    return this.isIncludeAccount(password, this.toPinyin(userName));
  }

  /**
   * 是否包含 n 个同样字符
   * @param password  密码
   * @param limit
   * @returns
   */
  public isMultiSameChar(password: string, limit = 3): boolean {
    return this.chunkStringArray(password, limit).some(char => this.isSameStr(char));
  }

  /**
   * 校验密码长度
   * @param password
   * @param lengthRule
   * @returns
   */
  public isValidLength(password: string, lengthRule?: { min?: number; max?: number }): boolean {
    const { max = 16, min = 8 } = lengthRule || {};
    if (password.length < min) return false;
    if (password.length > max) return false;
    return true;
  }

  /**
   * 必须包含: 数字、大写字母、小写字母、特殊字符中的3种
   * @param password 密码
   * @returns
   */
  public isContainSpecialChar(password: string, limit = 3): boolean {
    try {
      const combineRegex = (acc: string, item: RegExp) => acc + item.source;
      const containSpecialChar = /(?=.*[@$!%*#?&\.\,\;\'\[\]\|\`\+\-_~=\/\\])/;
      const containNumber = /(?=.*\d)/;
      const containUppercaseLetter = /(?=.*[A-Z])/;
      const containLowwerLetter = /(?=.*[a-z])/;
      const containAll = /[a-zA-Z\d@$!%*#?&\.\,\;\'\[\]\|\`\+\-_~=\/\\]/;

      const combos = this.getCombinations([containSpecialChar, containNumber, containUppercaseLetter, containLowwerLetter], limit)
        .map(item => [...item, containAll])
        .map(item => item.reduce(combineRegex, ''))
        .map(item => new RegExp(item).test(password));

      return combos.some(item => item);
    } catch (error) {
      return false;
    }
  }

  /**
   * 计算排列组合
   * @param valuesArray
   * @param limit
   * @returns
   */
  private getCombinations<T>(valuesArray: T[], limit: number) {
    const combi: T[][] = [];
    const slent = Math.pow(2, valuesArray.length);

    for (let i = 0; i < slent; i++) {
      const temp: T[] = [];
      for (let j = 0; j < valuesArray.length; j++) {
        if (i & Math.pow(2, j)) {
          temp.push(valuesArray[j]);
        }
      }
      if (temp.length > 0) {
        combi.push(temp);
      }
    }

    combi.sort((a, b) => a.length - b.length);
    return combi.filter(item => item.length === limit);
  }
}

export default new PasswordValidation();
