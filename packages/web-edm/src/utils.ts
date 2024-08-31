import lodashGet from 'lodash/get';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import { EdmStatInfo, StepValueModel, StepsModel, OneClickMarketingPrevScene, EdmEmailInfo, apiHolder, apis, EdmSendBoxApi, emailPattern } from 'api';
import { randomName } from '@web-mail/components/ReadMail/util';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import { MenuItemData } from '@/components/UI/MenuIcon/FoldableMenu';
import moment from 'moment';
import { ReactComponent as Statistics0 } from '@/images/icons/edm/statistics0.svg';
import { ReactComponent as Statistics1 } from '@/images/icons/edm/statistics1.svg';
import { ReactComponent as Statistics2 } from '@/images/icons/edm/statistics2.svg';
import { ReactComponent as Statistics3 } from '@/images/icons/edm/statistics3.svg';
import { ReactComponent as Statistics4 } from '@/images/icons/edm/statistics4.svg';
import { ReactComponent as Statistics5 } from '@/images/icons/edm/statistics5.svg';
import { ReactComponent as Statistics6 } from '@/images/icons/edm/statistics6.svg';
import { ReactComponent as Statistics7 } from '@/images/icons/edm/statistics7.svg';
import { ReactComponent as StatisticsNum } from '@/images/icons/edm/statistics-num.svg';
import { getIn18Text } from 'api';

export const EDMAPI = () => {
  const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
  return edmApi;
};

export function exportExcel(listData: Record<string, any>[], fieldLabels: string[], fieldKeys: string[], fileName: string) {
  let dataStr = '';
  fieldLabels.forEach((name, index) => {
    if (index === fieldLabels.length - 1) {
      // 前后加"避免表头名或内容包含英文逗号的时在生成csv文件时被视为列分隔符
      dataStr += `"${name}"`;
    } else {
      dataStr += `"${name}",`;
    }
  });
  dataStr += '\r\n';
  listData.forEach(item => {
    fieldKeys.forEach((key, index) => {
      if (key.includes('+')) {
        let tempArr: string[] = new Array();
        key.split('+').forEach(subKey => {
          const value = `${lodashGet(item, subKey, '')}`;
          if (value.length > 0) {
            tempArr.push(value);
          }
        });
        dataStr += `"${tempArr.join('-')}",`;
      } else {
        dataStr += `"${lodashGet(item, key, '')}",`;
      }
    });
    dataStr += '\r\n';
  });
  const url = 'data:text/csv;charset=utf-8,\ufeff' + encodeURIComponent(dataStr);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseReceiverEntity(entity: string): { contactName?: string; contactEmail: string } {
  entity = entity.trim();
  // zhanggai, <zhangai@kuaishou.com>
  if (entity.indexOf(',') > -1 || entity.indexOf('，') > -1) {
    const tmp = entity.split(/,|，/);
    return {
      contactName: tmp[0],
      contactEmail: tmp[1].trim(),
    };
  }
  // "zhangai"<zhangai@kuaishou.com>;"ruzhi"<ruzhi@100tal.com>;
  if (entity.startsWith('"') && entity.endsWith('>')) {
    return {
      contactName: entity.substring(1, entity.lastIndexOf('"')),
      contactEmail: entity.substring(entity.indexOf('<') + 1, entity.lastIndexOf('>')),
    };
  }
  return {
    contactEmail: entity,
  };
}

let container: HTMLDivElement | null = null;
export function getDataFromHtml(html) {
  if (!container) container = document.createElement('div');

  container.innerHTML = html;
  const table = container.getElementsByTagName('table')[0];
  if (!table) {
    return null;
  }
  const ret: Array<string[]> = [];
  for (let i = 0, rows = table.rows.length; i < rows; i++) {
    const row = table.rows[i];
    const rowData: string[] = [];
    for (let j = 0, cols = row.cells.length; j < cols; j++) {
      const cell = row.cells[j];
      rowData.push(cell.textContent || '');
    }
    ret.push(rowData);
  }
  return ret;
}

export function isValidEmailAddress(email: string) {
  return emailPattern.test(email);
}

let guid = 0;

export function getNextId() {
  return guid++;
}

export interface StatItemData {
  title: string;
  num: number;
  subtitle?: string;
  subnum?: string;
  hide?: boolean;
  Icon: typeof React.Component;
  url?: string;
}

export function guardString(s?: string): boolean {
  return s && s.length > 0 ? true : false;
}

export interface EdmStatKey {
  title: string;
  subtitle?: string;
  dataIndex: string;
  subIndex?: string;
  hide?: boolean;
  /**
   * 配置位置
   * list: 发件任务
   * detail: 任务详情
   */
  position?: 'list' | 'detail';
  Icon: typeof React.Component;
  url?: string;
}

export type StatColumns = Array<EdmStatKey | Array<EdmStatKey>>;
export const EdmStatColumns: Array<EdmStatKey | Array<EdmStatKey>> = [
  {
    title: getIn18Text('YINGXIAORENSHU'),
    dataIndex: 'contactsCount',
    position: 'list',
    Icon: StatisticsNum,
  },
  {
    title: getIn18Text('FAJIANZONGSHU'),
    dataIndex: 'sendCount',
    position: 'list',
    Icon: Statistics0,
  },
  {
    title: getIn18Text('FAJIANZONGSHU'),
    dataIndex: 'sendCount',
    hide: true,
    Icon: Statistics1,
  },
  {
    title: getIn18Text('SONGDAZONGSHU'),
    subtitle: getIn18Text('SONGDALV'),
    dataIndex: 'arriveCount',
    subIndex: 'arriveRatio',
    position: 'list',
    Icon: Statistics2,
    url: '/d/1640684506989031426.html',
  },
  [
    {
      title: getIn18Text('DAKAIRENSHU'),
      dataIndex: 'readCount',
      subtitle: getIn18Text('DAKAILV'),
      subIndex: 'readRatio',
      position: 'list',
      Icon: Statistics3,
      url: '/d/1674041360610545665.html',
    },
    {
      title: getIn18Text('DAKAICISHU'),
      dataIndex: 'readNum',
      Icon: Statistics3,
      url: '/d/1674041360610545665.html',
    },
  ],
  {
    title: getIn18Text('HUIFUZONGSHU'),
    dataIndex: 'replyCount',
    subtitle: getIn18Text('HUIFULV'),
    subIndex: 'replyRatio',
    position: 'list',
    Icon: Statistics4,
  },
  {
    title: getIn18Text('TUIDINGZONGSHU'),
    dataIndex: 'unsubscribeCount',
    Icon: Statistics5,
  },
  {
    title: getIn18Text('LIANJIEDIANJIRENSHU'),
    dataIndex: 'traceCount',
    Icon: Statistics6,
  },
  {
    title: getIn18Text('SHANGPINDIANJIRENSHU'),
    dataIndex: 'productClickNum',
    Icon: Statistics7,
  },
];
export const columnsFilter = (columns: StatColumns): StatColumns => {
  return columns.filter(column => {
    if (Array.isArray(column)) {
      return true;
    }
    return column.position === 'list';
  });
};

export function toStatItem(info: EdmStatInfo, maps = EdmStatColumns): Array<StatItemData | StatItemData[]> {
  return maps.map(i => {
    if (Array.isArray(i)) {
      return i.map(item => mapItem(item, info));
    }
    return mapItem(i, info);
  });
}

const mapItem = (i: EdmStatKey, info: EdmStatInfo): StatItemData => {
  const obj: StatItemData = {
    title: i.title,
    num: info[i.dataIndex],
    hide: i.hide,
    Icon: i.Icon,
    url: i.url,
  };
  if (i.subtitle) {
    obj.subtitle = i.subtitle;
  }
  if (i.subIndex) {
    obj.subnum = info[i.subIndex];
  }
  return obj;
};

export const EmailStatusMap: Record<number, string> = {
  0: getIn18Text('DAIFASONG'),
  1: getIn18Text('FASONGZHONG'),
  2: getIn18Text('YIFASONG'),
  3: getIn18Text('FASONGSHIBAI'),
  4: getIn18Text('YICHEXIAO'),
  5: getIn18Text('LAJIYOUJIAN'),
  6: getIn18Text('YISHANCHU'),
};
// 0待发送 1发送中 2发送成功 3发送失败 4已撤销 5垃圾邮件
export function transformStatus(emailStatus: number) {
  let statusKey = 'sended';
  if (emailStatus === 0) statusKey = '0';
  if (emailStatus === 1) statusKey = 'sending';
  if (emailStatus === 2) statusKey = '2';
  if (emailStatus === 5) statusKey = 'trash';
  if (emailStatus === 4) statusKey = 'canceled';
  if (emailStatus === 3) statusKey = 'error';
  return {
    statusKey,
    statusName: EmailStatusMap[emailStatus] || '',
  };
}

export const handlePreviewImage = (thumbnail: string, name: string) => {
  if (!thumbnail) return;
  const images = thumbnail.split(',');
  ImgPreview.preview({
    data: [
      {
        previewUrl: images[1] || images[0],
        downloadUrl: images[1] || images[0],
        name: name || randomName(),
      },
    ],
    startIndex: 0,
  });
};

export function onHttpError(e: any) {
  if (e?.status >= 500 || e?.code === 40101) return;
  let msg = e;
  if (typeof e === 'string') {
    // msg = e;
    msg = '未知原因，请重试';
  } else if (e && e.message) {
    msg = e.message;
  } else if (e && e.data?.message) {
    msg = e.data?.message;
  } else if (e && e.data?.data?.message) {
    msg = e.data?.data?.message;
  }
  if (msg) {
    toast.error({ content: String(msg) });
  }
}

export function maskEmail(email: string) {
  const i = email.indexOf('@');
  return email.substring(0, 1) + '***' + email.substring(i);
}

/**
 * @param menus
 * @param visibleKeys
 * @returns
 */
export const filterTree = (menus: MenuItemData[], visibleKeys: Record<string, boolean>) => {
  const isSomeKeyVisible = Object.keys(visibleKeys).length !== 0; //
  const ret: MenuItemData[] = [];
  for (let i = 0, l = menus.length; i < l; i++) {
    const menu = { ...menus[i] };
    const key = menu.label;
    if (!key || visibleKeys[key] || !isSomeKeyVisible) {
      if (menu.children !== undefined) {
        menu.children = filterTree(menu.children as MenuItemData[], visibleKeys);
      }
      if (!menu.children || menu.children.length > 0) {
        ret.push(menu);
      }
    }
  }
  return ret;
};

export function encodeHTML(str: string) {
  // <a href="https://www.163.com?a="<>()''"&b=1"></a>, innerHTML后链接被转义
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const getEmailsFromString = (string: string = '') => {
  return string
    .replaceAll('；', ';')
    .split(';')
    .map(item => item.trim())
    .filter(item => !!item);
};

export const polyfitDataByContact = (list: any) => {
  let traceMap = new Map();
  // 按照收件人聚合
  if (Array.isArray(list)) {
    list.forEach(item => {
      // 按照收件人聚合
      if (traceMap.has(item.contactEmail)) {
        let emailMap = traceMap.get(item.contactEmail);

        if (emailMap.has(item.traceUrl)) {
          let urlArr = emailMap.get(item.traceUrl);
          console.log('urlArr', urlArr);

          emailMap.set(item.traceUrl, [...urlArr, item]);
        } else {
          emailMap.set(item.traceUrl, [item]);
        }
      } else {
        // 按照访问链接聚合
        let urlMap = new Map();
        urlMap.set(item.traceUrl, [item]);
        traceMap.set(item.contactEmail, urlMap);
      }
    });
  }
  let table = [] as any;
  traceMap.forEach((innerMap, key1) => {
    innerMap.forEach((itemArr, key2) => {
      let item = {
        emialKey: key1,
        urlKey: key2,
        clickNums: itemArr?.length,
        combineTableData: itemArr,
        ...itemArr[0],
      };
      table.push(item);
    });
  });
  return table;
};

export const polyfitDataByUrl = (list: any) => {
  let traceMap = new Map();
  // 按照访问链接拟合
  if (Array.isArray(list)) {
    list.forEach(item => {
      // 按照收件人聚合
      if (traceMap.has(item.traceUrl)) {
        let urlArr = traceMap.get(item.traceUrl);
        traceMap.set(item.traceUrl, [...urlArr, item]);
      } else {
        traceMap.set(item.traceUrl, [item]);
      }
    });
  }
  let table = [] as any;
  traceMap.forEach(innerArr => {
    // 按人去重得到点击人数
    let clickCount = 0;
    const clickCountMap = new Map();
    innerArr.forEach(itm => {
      if (!clickCountMap.has(itm.contactEmail)) {
        clickCount += 1;
        clickCountMap.set(itm.contactEmail, true);
      }
    });
    clickCountMap.clear();
    let item = {
      clickNums: innerArr?.length,
      combineTableData: innerArr,
      ...innerArr[0],
      clickCount,
    };
    table.push(item);
  });

  return table;
};

export const getPlainTextFromHtml = (html: string) => {
  if (!html) return '';

  return html
    .replace(/<[^>]+>/g, '')
    .replace(/\n/g, '')
    .replace(/\s/g, '')
    .replace(/&nbsp;/g, '');
};

// write， 不同页面跳转到edm

export const createBeforeReadyListener = () => {
  const promises: Array<Promise<any>> = [];
  return {
    add(promise: Promise<any>) {
      promises.push(promise);
    },
    start() {
      return Promise.all(promises);
    },
  };
};

export const STORE_KEY = 'edmDirRemind';
export enum UnsubscribeTextLan {
  zh = 'zh',
  en = 'en',
}

const SendSettingCof = {
  value: 'SendSetting',
  id: 0,
  checked: false,
};

const ContentEditorCof = {
  value: 'ContentEditor',
  id: 1,
  checked: false,
};

const BatchSettingCof = {
  value: 'BatchSetting',
  id: 2,
  checked: false,
};

export const StepsMap: Record<StepValueModel, StepsModel> = {
  SendSetting: { ...SendSettingCof, label: getIn18Text('RENWUSHEZHI') },
  ContentEditor: { ...ContentEditorCof, label: '邮件内容' },
  BatchSetting: { ...BatchSettingCof, label: getIn18Text('FASONGSHEZHI') },
};

export const VersionSceneList = ['newCreate', 'marketingModal', 'innerContent'];
export const CreatePrevSceneList = ['copyTask', 'newCreate', 'draft'];
export const TemplatePrevSceneList = ['template', 'uniTemplate'];
export const MarketingPrevSceneList = ['customer', 'globalSearch', 'addressBook', 'customs', 'aisearch', 'linkedin', 'cantonfair', 'facebook', 'lbs', 'extension'];

export const ReceiversToContacts = (receivers: Array<Record<string, string>>) => {
  const contacts = receivers.map(i => ({
    email: i.contactEmail,
    name: i.contactName || '',
    companyName: i.companyName || '',
    continent: i.continent || '',
    country: i.country || '',
    province: i.province || '',
    city: i.city || '',
    variableMap: i.variableMap,
    sourceName: i.sourceName || '',
    increaseSourceName: i.increaseSourceName || '',
    position: i.position || '',
    remarks: i.remarks || '',
    verifyStatus: i.verifyStatus,
    verifyStatusList: i.verifyStatusList,
    contactStatus: i.contactStatus,
    contactStatusList: i.contactStatusList,
  }));
  return contacts;
};

export const MarketingVideo = {
  marketing: {
    downloadUrl: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2023/03/25/eb737574d643496f8265dac30f012b54.mp4',
    previewUrl: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2023/03/25/eb737574d643496f8265dac30f012b54.mp4',
    name: getIn18Text('YOUJIANYINGXIAO'),
    type: 'video',
    ext: 'mp4',
  },
  ai: {
    downloadUrl: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2023/03/25/6d7fb61f89a04ed8acc7c232bc4e3782.mp4',
    previewUrl: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2023/03/25/6d7fb61f89a04ed8acc7c232bc4e3782.mp4',
    name: getIn18Text('AIXIEXINYINGXIAO'),
    type: 'video',
    ext: 'mp4',
  },
  twice: {
    downloadUrl: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2023/03/25/e66135d76c5c40e8a894bdfe4bbd566b.mp4',
    previewUrl: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2023/03/25/e66135d76c5c40e8a894bdfe4bbd566b.mp4',
    name: getIn18Text('ZHINENGYINGXIAO'),
    type: 'video',
    ext: 'mp4',
  },
};

/**
 * 处理时间，同年的只展示月日
 */
export const timeFormat = (time: string) => {
  const currentYear = moment(time).get('year');
  const targetYear = moment().get('year');
  if (currentYear === targetYear) {
    return moment(time).format('MM-DD HH:mm:ss');
  }

  return time ?? '';
};

// 计算营销进度 舍弃百分比后的小数
export const getPercent = (item: EdmEmailInfo) => {
  let percentNumber = 0;
  let totalContactsCount = item.receiverCount || 0;
  let totalSendCount = item.sendCount;
  // 是否有营销人数为空的子任务，这种情况下如果percentNumber>=100时不展示百分比
  let emptySub = false;
  // 无有二次营销 进度 = 已经发送 / 过滤后营销人数
  // 有二次营销 进度 = （父任务已经发送 + 二次营销已经发送） /（父任务过滤后营销人数 + 二次营销过滤后营销人数）
  if (item.subList && item.subList.length > 0) {
    totalContactsCount = 0;
    totalSendCount = 0;
    item.subList.forEach(itm => {
      if (item.emailStatus !== 4) {
        totalContactsCount += itm.receiverCount || 0;
        totalSendCount += itm.sendCount || 0;
      }
      if (itm.receiverCount === 0) {
        emptySub = true;
      }
    });
  }
  percentNumber = (totalSendCount * 100) / totalContactsCount;
  // 意外情况取100
  percentNumber = percentNumber >= 100 ? 100 : percentNumber;
  if ((percentNumber >= 100 && emptySub) || !totalContactsCount) {
    return '';
  }
  // 任务进度正常情况直接向上取整，但是向上取整为100的情况例如99.1则向下取整
  const ceilNumber = Math.ceil(percentNumber);
  const floorNumber = Math.floor(percentNumber);
  percentNumber = percentNumber <= 99 ? ceilNumber : floorNumber;
  return percentNumber + '';
};

export const OneClickMarketingPrevSceneList: Partial<OneClickMarketingPrevScene[]> = [
  'customer',
  'globalSearch',
  'smartrcmd',
  'addressBook',
  'customs',
  'aisearch',
  'linkedin',
  'cantonfair',
  'facebook',
  'lbs',
  'extension',
  'ffms',
  'templateV2',
];

export const ShowWeeklyTaskPages = ['mailTemplate', 'senderRotateList', 'warmup', 'drafts', 'autoMarketTask', 'aiHosting'];

export const getCurTimeStamp = () => {
  return new Date().valueOf();
};

export const judgeCustomer = (id: number) => {
  return [4, 7, 8, 9].includes(id);
};
export const judgeClue = (id: number) => {
  return [1, 3, 10, 11].includes(id);
};
