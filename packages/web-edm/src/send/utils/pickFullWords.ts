import { getContentWithoutSignOnly } from './getMailContentText';
import { NotContentSelector } from './mailClassnameConstant';
import type { AIRewriteConfRes, Words } from 'api';
import { apiHolder, apis, MailSignatureApi, EdmSendBoxApi } from 'api';
import { getSignListAsync } from '@web-common/state/reducer/mailConfigReducer';

// import { unsubscribeEnUrl } from '../../utils';
import traversalBr from '../../AIHosting/utils/traversalBr';
const signatureApi = apiHolder.api.requireLogicalApi(apis.mailSignatureImplApi) as MailSignatureApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

// 以"./。"、“!/！”、“?/？”为结尾的句子
const endReg = /[\., 。, \!, ！, \?, ？]$/;
const hasReg = /[\.。\!！\?？:]/g;
const startReg = /^[,，、]/g; // 不能以这些符号开始
const endMark = ['.', '。', '!', '！', '?', '？'];
// const decimalReg = /\b(\d)+\.(\d)+\b/; // 不能存在 1.2 这种小数
/**
 * 不能存在 1.2 这种小数
 * 不能包含的特殊符号 ￥、$、€、¥、￡、₩、R$、₽、₹、₺、﷼
 */
const signReg = /(\b(\d)+\.(\d)+\b)|([\/￥$€¥￡₩R$₽₹₺﷼])/g;
const replacement = '&&&&';

// 开头和名单，不能以这俩开头
const startMarkBlackList = /^[,，]/;

// 标签黑名单
const TagBlackList = ['em', 'strong', 'style', 'script'];

// 单词黑名单
// 不得包含：CO、LTD、CO.,LTD、Inc.、Corp.、BV、NV、S.A.、S.A. de C.V.、AG、Mfy、Mfg、GmbH、Sdn.Bhd、Bhd、LLP、PLC、est、FZC、Fzco、FZE、S.R.O.、LLC、JSC、OJSC、s.r.l.、s.a.r.l.、S.P.A.、AB、OY、k.k.、Y.K、PT、TBK、Pte、PVT、PTY、bd、A/S”和“有限责任公司、有限公司、股份公司、合伙企业、股份合作公司
const WordBlackList = [];

// 最小字节数
const minLength = 30;

// 最大字节数
const maxLength = 300;

// 句子中不得包含变量、链接
// 变量
const varClassName = 'mce-lx-var';
// 链接
const Link = 'a';

// 句子中不得包含多种格式（如多个字体、多个颜色、多个字号等）
const specificStyles = [
  // 'font-family',
  // 'font-size',
  // 'color',
  'style',
];

/**
 * 是否第一句和最后一句
 */
const wordsPositionConf = {
  // 第一句
  firstWord: '',
  // 最后一句
  endWords: '',
};

/**
 * 获取内容大小
 */
const getStrSize = (content: string): number => {
  const blob = new Blob([content]);
  return blob.size;
};

/**
 * 是否有效的句子，只需要如下规则
 * 1. 以"./。"、“!/！”、“?/？”为结尾的句子
 * 2. 至少包含10个汉字或英文（或其他语言）单词
 * 3. 最多不能超过100个汉字（包含其他语言）或200个英文单词
 */
const isValid = (content: string, conf: AIRewriteConfRes): boolean => {
  const size = getStrSize(content);
  return !content.includes(replacement) && size >= conf.minimumBytes && size <= conf.maximumBytes;
};

// 替换掉特殊的符号和关键词。主要目的是把特殊词换成 $$$$ 方便切割
const replaceBanSign = (content: string, conf: AIRewriteConfRes): string => {
  let str = content.replace(signReg, replacement);
  conf.wordsBlackList.forEach(word => {
    // 不同的语言有可能使用空格分割
    const isEnglish = /\w/.test(word) && !word.includes('.');
    if (isEnglish) {
      const reg = new RegExp('\\b' + word + '\\b', 'ig');
      str = str.replace(reg, replacement);
    } else {
      const reg = new RegExp(word.replace(/\./g, '\\.'), 'ig');
      str = str.replaceAll(reg, replacement);
    }
  });

  return str;
};

/**
 * 是否符合规则
 * 方案:
 * 1. 先拼接：拼接好句子
 * 2. 再检验
 * 
 * 规则:
 *  （1）以"./。"、“!/！”、“?/？”为结尾的句子
    （2）以一句中两个空格间的内容为一个单词
    （3）至少包含10个汉字或英文（或其他语言）单词
    （4）最多不能超过100个汉字（包含其他语言）或200个英文单词
    （5）句子中不得包含变量、链接 done
    （6）句子中不得包含多种格式（如多个字体、多个颜色、多个字号等）done
     (7) 不能取第一句和最后一句
     (8) 上一句需要是一个完整的句子，也就是需要以标点符号结尾
 */
const collectWords = (
  content: Node,
  words: Array<{
    id: string;
    word: string;
  }>,
  conf: AIRewriteConfRes,
  preWordIsError: boolean // 上一句是否符合要求，只需要判断是否为固定符号结尾即可。
) => {
  if (
    content.childNodes.length === 0 &&
    content.nodeType === 3 &&
    (content.textContent || '').trim().length > 0
    // && content.parentElement?.innerHTML.includes('style=') // 不能有自定义样式
    // !TagBlackList.includes(content.parentElement!.tagName.toLowerCase())
  ) {
    if (!TagBlackList.includes(content.parentElement!.tagName.toLowerCase())) {
      // 文案节点
      // return content.textContent || '';
      const text = content.textContent || '';
      const matchs = text.match(hasReg);
      if (matchs == null) {
        // 不是完整的句子，说明加了特殊的标签。舍弃，包括特殊的样式和变量！规则 5、6
        /**
         * 上一句是否符合
         * 节点不能包含敏感词和不能以标点符号为结尾
         */
        // 上一句没有以标点结尾，那么下一句也不能要了
        // preWord.isError = true;
        return true;
      } else if (matchs.length > 0 && !preWordIsError) {
        // 上一句也需要符合
        // 匹配多个，或者一个，需要拆分。
        let str = replaceBanSign(text, conf);

        // 切分句子之前需要把特殊标记替换
        const tempWords: Array<string> = str.split(hasReg);
        tempWords.forEach((word, index) => {
          if (matchs[index] != null && word.trim().length > 0) {
            // 记录第一句和最后一句
            let fullWord = word + matchs[index];
            if (wordsPositionConf.firstWord === '') {
              wordsPositionConf.firstWord = fullWord.trim();
            }
            wordsPositionConf.endWords = fullWord.trim();

            const result = isValid(fullWord, conf);
            if (words.length < conf.sentenceCount && result) {
              // step1: 不能以 startreg 开头
              if (startReg.test(word)) {
                word = word.replace(startReg, '');
              }
              let fullWord = word + matchs[index];
              fullWord = fullWord.trim();
              // step2: 添加结果
              words.push({
                id: `span[data-aiid="${words.length}"]`,
                word: fullWord,
              });
              // text.replace(word, `<div>${word}</div>`)
              // content.parentNode?.replaceChild(document.createTextNode(text), content)
              // step3: 修改原html
              if (content.textContent != null) {
                content.textContent = content.textContent?.replace(
                  fullWord,
                  `<ai-word style="font-family: inherit;" data-aiid="${words.length - 1}">${fullWord}</ai-word>`
                );
              }
            }
          }
        });
      }
    } else {
      // 上一句包含敏感词
      return true;
    }
  }

  return false;
};

function notContentFilter(node: HTMLElement) {
  let result = false;
  if (node.classList) {
    result = NotContentSelector.className.some(name => node.classList.contains(name));
  }
  if (node.id) {
    result = NotContentSelector.id.some(id => id === node.id);
  }
  return result;
}

/**
 * 深度优先遍历，遍历的是每一个node节点
 */
function nodeVisitor(
  tree: Node,
  words: Array<{
    id: string;
    word: string;
  }>,
  conf: AIRewriteConfRes,
  preWord: {
    preWordIsError: boolean;
  } // 上一句是否符合要求，只需要判断是否为固定符号结尾即可。
) {
  // 不遍历签名、摘要等
  if (notContentFilter(tree as HTMLElement)) {
    return;
  }

  const preWordError = collectWords(tree, words, conf, preWord.preWordIsError);
  preWord.preWordIsError = preWordError;
  // if (words.length === conf.sentenceCount) {
  //     return;
  // }
  if (tree.childNodes) {
    Array.from(tree.childNodes).forEach(item => {
      nodeVisitor(item, words, conf, preWord);
    });
  }
}

/**
 * 摘取句子从邮件正文中
 */
export const pickFullWords = (
  content: string,
  /**
   * 句子数量
   */
  conf: AIRewriteConfRes
) => {
  // const restContent = getContentWithoutSignOnly(content);
  const words: Words = [];
  wordsPositionConf.firstWord = '';
  wordsPositionConf.endWords = '';
  const node = document.createElement('div');
  node.innerHTML = content;
  // 可能存在第一句，数量需要加1
  nodeVisitor(
    node,
    words,
    { ...conf, sentenceCount: conf.sentenceCount + 1 },
    {
      preWordIsError: false,
    }
  );
  // 找到所有句子需要去掉第一句和最后一句
  const wordRes: Words = [];
  const wordUnused: Words = [];
  words.forEach(word => {
    if (word.word !== wordsPositionConf.firstWord && word.word !== wordsPositionConf.endWords) {
      wordRes.push(word);
    } else {
      wordUnused.push(word);
    }
  });

  const text = node.innerHTML.replaceAll('&lt;', '<').replaceAll('ai-word', 'span').replaceAll('&gt;', '>');
  node.innerHTML = text;
  // 移除第一句和最后一句
  wordUnused.forEach(word => {
    node.querySelector(word.id)!.removeAttribute('data-aiid');
  });
  return {
    words: wordRes.slice(0, conf.sentenceCount),
    text: node.innerHTML,
  };
};

export const addSignTdAfterContent = (content: string, signHtml: string = '', text: string) => {
  const node = document.createElement('div');
  node.innerHTML = content;
  // const body = node.querySelector('body') || node.children[0] || node;
  const body = node.querySelector('body') || node;

  if (!body) {
    return content;
  }

  // /n 替换为<br>
  traversalBr(body);

  const empty = '<div style="font-size:14px" data-mce-style="font-size:14px"><br></div>';
  // 添加签名
  // if (!signHtml) {
  //     try {
  //         const res = await signatureApi.doGetSignList({});
  //         if (res?.success && res.data) {
  //             const sign = res.data.find(sign => sign.signInfoDTO.defaultItem.compose);
  //             if (sign) {
  //                 signHtml = sign.divContent;
  //             }
  //         }
  //     } catch(err) {}
  // }
  body.insertAdjacentHTML('beforeend', empty);
  body.insertAdjacentHTML('beforeend', empty);
  body.insertAdjacentHTML('beforeend', empty);
  body.insertAdjacentHTML('beforeend', empty);

  // 添加退订
  // const enUrl = unsubscribeEnUrl + '?host=#{t_host}&sign=#{t_p1}&from=#{t_p2}';

  // const text = `<p>If you don't want to receive our emails, you can easily <a href="${enUrl}" target="_blank" class="edm-unsubscribe">unsubscribe</a> here.</p>`;

  // await edmApi.refreshUnsubscribeUrl(senderEmail);
  // const text = edmApi.handleUnsubscribeText('en');

  body.insertAdjacentHTML('beforeend', text);

  // 添加签名
  if (signHtml) {
    body.insertAdjacentHTML('beforeend', signHtml);
  }

  return node.innerHTML.replaceAll('&lt;br /&gt;', '<br />');
};
