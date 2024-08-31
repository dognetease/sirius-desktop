import {
  api,
  apis,
  EntityContactItem,
  HtmlApi,
  MailApi,
  KeyOfEntityContact,
  UploadAttachmentFlag,
  NSDirContent,
  ProductAuthorityFeature,
  DataTrackerApi,
  MailConfApi,
  ProductAuthApi,
} from 'api';
import { escapeRegExp } from '@web-contact/util';
import Alert from '@web-common/components/UI/Alert/Alert';
import { getIfHaveAuth } from '@web-common/utils/utils';
import { overLimitLabel, totalOverLimitLabel } from '@web-common/utils/cloundAttLimit';
import debounce from 'lodash/debounce';
import { message } from 'antd';
import { AttachmentView } from '@web-common/state/state';
import { emailPattern } from '@web-common/utils/constant';
import { getIn18Text } from 'api';
import store from '@web-common/state/createStore';
import { MailActions } from '@web-common/state/reducer';

const htmlApi: HtmlApi = api.requireLogicalApi(apis.htmlApi) as HtmlApi;
const mailApi = api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const dataTrackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const mailConfApi = api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
const productAuthApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const eventApi = api.getEventApi();
const storeApi = api.getDataStoreApi();

export function highlightText(originText: string = '', searchTerm: string = '', hitStyle: string, options: any = {}) {
  const text = htmlApi.encodeHtml(originText);
  const { hitGlobal, splitSearchTerm = false } = options;
  if (!searchTerm || !text) {
    return text;
  }
  let matchTerm;
  // 是否将关键词拆分，分‘字’高亮
  if (splitSearchTerm) {
    matchTerm = [...escapeRegExp(searchTerm)].reduce((prev, curr) => `${prev}|${curr}`);
  } else {
    matchTerm = escapeRegExp(searchTerm);
  }
  try {
    const reg = new RegExp(`(${matchTerm})`, hitGlobal ? 'ig' : 'i');
    const replacer = `<span class="${hitStyle}">$1</span>`;
    return text.replace(reg, replacer);
  } catch (ex) {
    return text;
  }
}
const userAgentDisplayNone = [
  'head',
  'title',
  'meta',
  'script',
  'style',
  'link',
  'object',
  'iframe',
  'embed',
  'param',
  'source',
  'track',
  'area',
  'base',
  'col',
  'command',
  'keygen',
  'menuitem',
  'hr',
  // 'input[type="hidden"]',
  // 'input[type="checkbox"][hidden]',
  // 'input[type="radio"][hidden]',
  // 'input[type="file"][hidden]',
  // 'input[type="button"][hidden]',
  // 'input[type="submit"][hidden]',
  // 'input[type="reset"][hidden]',
  // 'input[type="image"][hidden]',
  'progress',
  'meter',
  'fieldset',
  'legend',
  'output',
  'canvas',
  'audio',
  'video',
  'picture',
  'source',
  'template',
];

export const mailHiddenText = (content: string | HTMLElement, format: 'text' | 'html' = 'text') => {
  if (!content) return;
  let ele = content as HTMLElement;
  if (format === 'text' && typeof content === 'string') {
    content as string;
    var parser = new DOMParser();
    ele = parser.parseFromString(content as string, 'text/html').body;
  }
  const eleList = [ele] as HTMLElement[];
  const hiddenEles = [] as HTMLElement[];
  while (eleList.length > 0) {
    const item = eleList.pop() as HTMLElement;
    if (item.id && ['isForwardContent', 'isReplyContent'].includes(item.id)) continue;
    const itemStyle = window.getComputedStyle(item);
    if (
      itemStyle.display === 'none' ||
      itemStyle.opacity === '0' ||
      ['collapse', 'hidden'].includes(itemStyle.visibility) ||
      (['absolute', 'relative', 'fixed'].includes(itemStyle.position) &&
        [parseInt(itemStyle.top), parseInt(itemStyle.right), parseInt(itemStyle.bottom), parseInt(itemStyle.left)].some(num => Math.abs(num) > 2000)) ||
      (['absolute', 'fixed'].includes(itemStyle.position) && itemStyle.clip === 'rect(0px, 0px, 0px, 0px)') ||
      (itemStyle.overflow === 'hidden' && (itemStyle.height === '0px' || itemStyle.width === '0px'))
    ) {
      if (userAgentDisplayNone.includes(item.tagName.toLowerCase())) continue;
      hiddenEles.push(item);
      continue;
    }
    if (item?.children?.length) {
      for (let i = 0; i < item.children.length; i++) {
        eleList.push(item.children[i] as HTMLElement);
      }
    }
  }
  return hiddenEles.reduce((prev, curr) => prev + curr.innerText, '').trim();
  // return hiddenEles.map((item) => {
  //   if (item.tagName === 'IMG' && item.src) {
  //     return {
  //       src: item.src,
  //       type: 'img',
  //     };
  //   }
  //   return {
  //     text: item.innerText,
  //     type: 'text',
  //   }
  // });
};

const freeUpgradeEvent = debounce((currentMailId: string) => {
  currentMailId &&
    eventApi.sendSysEvent({
      eventName: 'upgradeVersion',
      eventData: { cid: currentMailId },
    });
}, 100);

// 预处理附件
// 本地上传为一般附件/云附件
export const preUploadAttachment = (params: {
  fileList: File[];
  currentMailId: number | string;
  currentMailSize: number;
  cloudAttInfo?: NSDirContent; // 当前云附件空间信息
  _account?: string;
  flag: UploadAttachmentFlag;
}) => {
  const { fileList, currentMailId, currentMailSize, cloudAttInfo, _account = '', flag = { usingCloud: false } } = params;
  const { usingCloud } = flag; // usingCloud 为true是云附件上传
  // 不同版本云附件大小限制
  const versionSpaceLimit = { free: 1, ultimate: 3, sirius: 5 };
  const productVersionId = productAuthApi.doGetProductVersionId();
  const limit = versionSpaceLimit[productVersionId as keyof typeof versionSpaceLimit] ?? 3; // 未识别版本按照旗舰版处理
  const versionalSingleSizeLimit = limit * 1024 * 1024 * 1024; // 单个文件大小限制，每个版本不同
  const mailLimit = mailConfApi.getMailLimit({ _account });

  let filesTotalSize = 0; // 记录当前上传总文件大小
  const fileListAry: AttachmentView[] = [];
  for (let originFile of fileList) {
    const { name: originFileName, size: originFileSize } = originFile;
    const file: AttachmentView = {
      id: `${originFileName}_${new Date().getTime()}_${Math.random()}`,
      mailId: currentMailId,
      file: originFile,
      flag: flag as { usingCloud: boolean },
      type: 'upload',
      fileName: originFileName,
      fileSize: originFileSize,
      realId: mailApi.generateRndId(),
    };
    // 指定云附件
    // 云附件需要添加版本限制
    if (usingCloud) {
      // 版本单个文件大小限制
      if (originFileSize > versionalSingleSizeLimit) {
        Alert.error({
          title: getIn18Text('YUNFUJIANDAODA'),
          content: overLimitLabel[productVersionId as keyof typeof overLimitLabel] ?? overLimitLabel['sirius'], // 其他版本看做旗舰版
        });
        return;
      }
      filesTotalSize += originFileSize;
    }
    const allsize = currentMailSize + originFileSize; // 已有附件 + 正文 + 选择的文件 大小
    // 整体超过本地附件总大小限制 或者 单个超过本地附件大小限制
    if (allsize > mailLimit.upload_total_size || originFileSize > mailLimit.upload_size) {
      // 未指定使用云附件将被动转为云附件
      if (!usingCloud) {
        if (getIfHaveAuth(ProductAuthorityFeature.ORG_SETTING_BIG_ATTACH_SHOW)) {
          message.info(getIn18Text('WENJIANGUODA\uFF0C'));
        } else {
          // 超限且不允许转云附件
          // 免费版提示升级
          if (productVersionId === 'free') {
            freeUpgradeEvent(currentMailId as string);
          } else {
            message.info(getIn18Text('WENJIANGUODA100'));
          }
          // 跳过超限文件
          continue;
        }
      }
      file.cloudAttachment = true;
      filesTotalSize += originFileSize; // 转成云文件
      // 版本单个文件大小限制
      if (usingCloud && originFileSize > versionalSingleSizeLimit) {
        Alert.error({
          title: getIn18Text('YUNFUJIANDAODA'),
          content: overLimitLabel[productVersionId as keyof typeof overLimitLabel] ?? overLimitLabel['sirius'], // 其他版本看做旗舰版
        });
        return;
      }
    }
    // 云附件是否达到版本总文件上限
    if (usingCloud && cloudAttInfo && cloudAttInfo.sizeLimit - cloudAttInfo.totalSize < filesTotalSize) {
      Alert.error({
        title: getIn18Text('YUNFUJIANDAODA'),
        content: totalOverLimitLabel[productVersionId as keyof typeof totalOverLimitLabel] ?? totalOverLimitLabel['sirius'], // 其他版本看做旗舰版
      });
      return;
    }
    fileListAry.push(file);
  }
  return fileListAry;
};

export function highlightName(textToSearch: string, hitQuery: string[] = [], searchTerm: string | undefined, hitStyle: any) {
  let html = textToSearch;
  const hit =
    hitQuery && ((['contactName', 'contactPYName'] as KeyOfEntityContact[]).some((query: KeyOfEntityContact) => hitQuery?.includes(query)) || hitQuery.includes('owner'));
  if (searchTerm && hit) {
    html = highlightText(html, searchTerm, hitStyle);
  }
  return html;
}
export function highlightEmail(textToSearch: string = '', contactInfo: EntityContactItem[] = [], searchTerm: string | undefined, hitStyle: any) {
  let html = textToSearch;
  const hits = contactInfo.filter((info: EntityContactItem) => info?.hitQuery && info?.contactItemType === 'EMAIL' && info?.hitQuery?.includes('contactItemVal'));
  // if (searchTerm && hits.length) {
  //   html = highlightText(hits[0]?.contactItemVal, searchTerm, hitStyle);
  // }
  if (searchTerm && html) {
    html = highlightText(html, searchTerm, hitStyle);
  }
  return html;
}
export function verifyEmail(email: string): boolean {
  // const emailReg = /^([a-zA-Z0-9_\-.+#']+)@([a-zA-Z0-9_\-.]+\.[a-zA-Z]{2,})$/;
  const emailReg = emailPattern;
  const result = emailReg.test(email);
  // 如果验证邮箱失败，打点记录下，每天限制50次即可
  if (!result) {
    try {
      dataTrackerApi.track('email_verification_failed', { email });
    } catch (error) {
      console.log('verifyEmail failed:', error);
    }
  }
  return result;
}

export const remWaittingId = (id: string | undefined, remark?: boolean) => {
  if (!id) return;
  const waittingMailIds = store.getState()?.mailReducer?.waittingMailIds;
  if (waittingMailIds?.includes(id)) {
    store.dispatch(MailActions?.doRemWaittingMailId(id));
    if (remark) {
      message.error({ content: getIn18Text('ZIDONGFASONGZHONGD，QBJWCHCXFS') });
    }
  }
};

export const getStoreBooleanData = (key: string): boolean => {
  const res = storeApi.getSync(key);
  if (res.suc && res.data) {
    return Boolean(res.data);
  }
  return false;
};
