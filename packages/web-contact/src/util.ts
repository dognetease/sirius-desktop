import { api, contactInsertParams, ContactModel, SystemApi, getIn18Text, ContactItem, locationHelper } from 'api';
import cloneDeep from 'lodash/cloneDeep';
import { ContactFormField } from './component/ContactForm/ContactForm';
// import MD5 from "md5";
import { UIContactModel } from './data';
import { getSendCount, IEdmEmailList } from '@/components/Layout/Customer/components/hooks/useEdmSendCount';

const systemApi = api.getSystemApi() as SystemApi;

const codeMessageMap: Record<number | string, string> = {
  106312: getIn18Text('importFormatError'),
  106309: getIn18Text('importMaxError'),
  106314: getIn18Text('ZANWULIANXIREN'),
  106318: getIn18Text('importTimeout'),
  106316: getIn18Text('importOnceMoreError'),
  106317: getIn18Text('importFileSizeError'),
};
export const getContactErrorTxt = (code?: number | string) => {
  return code ? codeMessageMap[code] : undefined;
};

export const getColor = (email: string) => {
  const colors = ['#6BA9FF', '#70CCAB', '#AA90F4', '#F7A87C'];
  const emailMd5 = systemApi.md5(email);
  return colors[parseInt(emailMd5[emailMd5.length - 1], 16) % 4];
};

//匹配这些中文标点符号 。 ； ， ： “ ”（ ） 、 ？ 《 》【】〈
const chineseSymbolList = ['。', '；', '，', '：', '“', '”（', '）', '、', '？', '《', '》', '【', '】', '〈', '〉', '『', '』'];
const replaceChiniseSymbol = (str: string) => {
  return chineseSymbolList.reduce((acc, symbol) => {
    while (acc.indexOf(symbol) !== -1) {
      acc = acc.replace(symbol, '');
    }
    return acc;
  }, str);
};
const chineseDoublenamelist = ['欧阳', '太史', '司马', '独孤', '夏侯', '诸葛', '尉迟', '公冶', '公孙', '慕容', '长孙', '宇文', '令狐'];
const testDoubleNames = (name: string) => {
  return (
    name.length === 3 &&
    chineseDoublenamelist.some(subName => {
      return name.startsWith(subName);
    })
  );
};

const unitSuffixList = ['组', '部', '委员会', '团队'];

const testUnitSuffix = (name: string, suffixList: string[]) => {
  return suffixList.findIndex(item => {
    return name.endsWith(item) && name.length - item.length >= 2;
  });
};

const replaceUnitSuffix = (name: string, unitLen: number) => {
  return name.slice(name.length - 2 - unitLen, name.length - unitLen);
};

export const getCharAvatar = (name: string) => {
  if (typeof name !== 'string' || !name || !name.trim()) {
    return name;
  }

  let resChar;

  // /(?<name>.{2})(?:(\u7ec4|\u90e8|\u59d4\u5458\u4f1a|\u56e2\u961f))$/;
  try {
    name = replaceChiniseSymbol(name.trim());
    const charList = [...name];
    resChar = charList[0];
    const hasCharacter = /[\u4e00-\u9fa5]/.test(name);
    // 如果包含中文
    if (hasCharacter) {
      const defaultName = name.slice(-2);
      const matchUnitIndex = testUnitSuffix(name, unitSuffixList);
      // 优先match固定组织和复姓两个规则
      if (matchUnitIndex >= 0) {
        resChar = replaceUnitSuffix(name, matchUnitIndex);
      } else if (testDoubleNames(name)) {
        resChar = name.slice(0, 2);
      } else {
        resChar = defaultName;
      }
    } else if (name.length >= 1) {
      resChar = name.slice(0, 1).toLocaleUpperCase();
    }
  } catch (e) {
    console.warn(e);
  }
  return resChar;
};

export const fixContactLabel = (label: string) => (label === '|' ? '#' : label);

export const contact4ui = (list?: ContactModel[], pointLabel?: boolean) => {
  const labels = new Set();
  if (!list) {
    return [];
  }
  const res = cloneDeep(list).map(e => {
    const r: UIContactModel = e;
    r.contact.defaultEmail = e.contact.accountName;
    r.contact.charAvatar = getCharAvatar(e.contact.contactName);
    if (pointLabel) {
      if (!labels.has(r.contact.contactLabel)) {
        r.contact.labelPoint = !0;
        labels.add(r.contact.contactLabel);
      } else {
        r.contact.labelPoint = false;
      }
    }
    return r;
  });
  return res;
};

export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // $&表示整个被匹配的字符串
}

export const splitSearchHit = (hit: string, text: string) => {
  if (!text) {
    return null;
  }
  const searchText = escapeRegExp(hit.slice());
  const reg = new RegExp(searchText, 'i');
  const result = reg.exec(text.slice());
  if (!result) {
    return null;
  }
  const head = text.substring(0, result.index);
  const target = text.substring(result.index, result.index + hit.length);
  const tail = text.substring(result.index + hit.length);

  return {
    head,
    target,
    tail,
  };
};

export const contactFormToParams = (values: ContactFormField) => {
  const params = {
    emailList: values.emailList,
    name: values.contactName.trim(),
    comment: values.remark,
    phoneList: values.mobileList,
    groupIdList: values.personalOrg,
    isMark: values.isMark,
    adrList: values.adrList,
    pref: values.pref, // 个人主页
    birthday: values.birthday, //生日
    role: values.role, //角色
    title: values.title, // 角色
    org: values.org, // 组织
    orgname: values.orgname, // 公司名称
  };
  return params as contactInsertParams;
};

export const personalOrgToYingxiao = (list: ContactItem[]) => {
  if (list?.length) {
    const emailSet = new Set<string>();
    const emailList = list.reduce((arr, item) => {
      if (item.emailList?.length) {
        item.emailList.forEach(email => {
          if (!emailSet.has(email)) {
            arr.push({
              contactName: item.name,
              contactEmail: email,
              sourceName: '个人通讯录',
              increaseSourceName: 'personalOrg',
            });
            emailSet.add(email);
          }
        });
      }
      return arr;
    }, [] as IEdmEmailList[]);
    getSendCount({
      emailList,
      from: 'personalOrg',
      back: locationHelper.getHash(),
    });
  } else {
    console.error('contact_util personalOrgToYingxiao', '请传入有效的联系人');
  }
};
