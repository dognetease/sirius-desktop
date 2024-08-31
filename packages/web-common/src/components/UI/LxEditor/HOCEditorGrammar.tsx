import React, { useState, useRef } from 'react';
import { Editor as EditorType } from '@web-common/tinymce';
import message from '@web-common/components/UI/Message/SiriusMessage';
import LxPopover from '@web-common/components/UI/LxPopover/LxPopover';
import classnames from 'classnames';
import { apis, apiHolder as api, MailApi as MailApiType, GrammarResult, GrammarResponse, RecombineDataType, DataTrackerApi, inWindow } from 'api';
import styles from './editor.module.scss';
import { ReactComponent as IconSetting } from '@/images/icons/account-setting.svg';
import errorCode from './error';

const MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApiType;
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const inEdm = api.api.getSystemApi().inEdm();

// index 表示之前句子长度
const recombineOrg = (data: GrammarResult, index: number, whitespaceList: number[]) => {
  const sentsFeedback = data.essayFeedback.sentsFeedback;
  const res: RecombineDataType[] = [];
  let startPos = index;
  // let endPos = 0;
  sentsFeedback.forEach((sent, index) => {
    if (index) startPos += whitespaceList[index - 1]; // 从第二句开始 每句前面加个x个空格 原因详见 grammarAction
    if (sent.errorPosInfos.length !== 0) {
      sent.errorPosInfos.forEach(errorInfo => {
        res.push({
          textStartPos: errorInfo.startPos,
          startPos: startPos + errorInfo.startPos, // 错误单词在原文text中的位置
          orgChunk: errorInfo.orgChunk,
          correctChunk: errorInfo.correctChunk,
          detailReason: errorInfo.detailReason,
        });
      });
    }
    startPos += sent.rawSent.length;
  });
  return { newList: res, newStartPos: startPos };
};
// 找到错误单词在context text 中的位置 替换成纠错样式
const reviseOrg = (contentHtml: string, recombineData: RecombineDataType[]) => {
  const tokenRegExp = new RegExp(
    '<(?:' +
      '(?:!--([\\w\\W]*?)--!?>)|' +
      '(?:!\\[CDATA\\[([\\w\\W]*?)\\]\\]>)|' +
      '(?:![Dd][Oo][Cc][Tt][Yy][Pp][Ee]([\\w\\W]*?)>)|' +
      '(?:!(--)?)|' +
      '(?:\\?([^\\s\\/<>]+) ?([\\w\\W]*?)[?/]>)|' +
      '(?:\\/([A-Za-z][A-Za-z0-9\\-_\\:\\.]*)>)|' +
      '(?:([A-Za-z][A-Za-z0-9\\-_:.]*)(\\s(?:[^\'">]+(?:"[^"]*"|\'[^\']*\'))*[^"\'>]*(?:"[^">]*|\'[^\'>]*)?|\\s*|\\/)>)' +
      ')',
    'g'
  );
  let matches;
  let index = 0; // HTML当前长度
  let textIndex = 0; // context 的 text 目前的index
  let allText = ''; // 拼接所有的text 保证能通过 startPos 取到对应的单词
  let reviseList = recombineData.slice(); // 需要被纠错的单词 集合
  let reviseItem = reviseList.shift(); // 当前需要被纠错的单词
  let res = '';
  let count = 0;
  if (!reviseItem) return contentHtml;
  while ((matches = tokenRegExp.exec(contentHtml))) {
    var matchText = matches[0];
    if (index < matches.index) {
      // replace(/\.(\S)/g,'. $1') 原因可参考 grammarAction 方法内注释
      let text = contentHtml.substr(index, matches.index - index).replace(/\.(\S)/g, '. $1');
      // 每句话最后的.也需要加上空格 不然index对应不上
      text = text.replace(/\.$/g, '. ').replace(/"/g, "'");
      const revisedTextList = [];
      let revisedTextPrevindex = 0;
      // 错误单词起点在 text 范围类，
      // orgChunk 要在 text 中
      if (reviseItem && textIndex > reviseItem.startPos) {
        // 当reviseItem夸标签
        // 上一个 while 中 reviseItem.startPos + reviseItem.orgChunk.length > textIndex + text.length
        // 到了下个while中既表现为 textIndex > reviseItem.startPos
        // reviseItem 的起点在上一句
        // 需要舍弃
        reviseItem = reviseList.shift();
      }
      while (reviseItem && reviseItem.startPos >= textIndex && textIndex + text.length >= reviseItem.startPos + reviseItem.orgChunk.length) {
        // 假设错误的单词没有跨标签 跨标签的错误单词不做处理
        const chunkInTextIndex = reviseItem.startPos - allText.length; // orgchunk 在text 的 index
        const chunk = text.substr(chunkInTextIndex, reviseItem.orgChunk.length);

        if (chunk === reviseItem.orgChunk) {
          count++;
          revisedTextList.push(
            text.substring(revisedTextPrevindex, chunkInTextIndex),
            `<span class="lx-mce-grammar" data-correctChunk="${reviseItem.correctChunk}" data-detailReason="${reviseItem.detailReason}">${reviseItem.orgChunk}</span>`
          );
          revisedTextPrevindex = chunkInTextIndex + reviseItem.orgChunk.length;
        }
        // 因为一句原文里可能有多处错误所以需要再 while里进行循环
        reviseItem = reviseList.shift();
      }

      revisedTextList.push(text.substring(revisedTextPrevindex));
      allText += text;
      textIndex += text.length;
      res += revisedTextList.join('');
    }
    res += matchText;
    index = matches.index + matchText.length;
  }
  console.log('countcountcountcountcount', count);
  return res;
};

const HOCEditorGrammar = (Component: typeof React.Component) => {
  const EditorGrammar = (props: any) => {
    const { ref, ...rest } = props;
    const editorInstance = useRef<EditorType>();
    const [reviseCardVisible, setReviseCardVisible] = useState(false);
    const reviseCardPos = useRef({ top: 0, left: 0 });
    const mouseenterTargetRef = useRef<HTMLElement>();

    const showReviseCard = function (e: Event) {
      const target = e.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      if (editorInstance.current) {
        const DOMUtils = editorInstance.current.dom;
        mouseenterTargetRef.current = target;
        const editorContainerPos = DOMUtils.getPos(editorInstance.current.getContentAreaContainer());
        reviseCardPos.current = { top: rect.bottom + editorContainerPos.y, left: rect.left + editorContainerPos.x };
        setReviseCardVisible(true);
      }
    };

    const hideReviseCard = () => {
      setReviseCardVisible(false);
    };

    const delPreReviseEles = (editor: EditorType) => {
      const eles = editor.getDoc().querySelectorAll('.lx-mce-grammar');
      eles.forEach(el => {
        el.removeEventListener('mouseenter', showReviseCard);
        el.removeEventListener('mouseleave', hideReviseCard);
        el.replaceWith(el.innerText);
      });
    };

    const bindRevise = (editor: EditorType) => {
      const grammarEls = editor.getDoc().querySelectorAll('.lx-mce-grammar');
      grammarEls.forEach(el => {
        el.addEventListener('mouseenter', showReviseCard);
        el.addEventListener('mouseleave', hideReviseCard);
      });
    };
    const getValidText = (bodyDom: HTMLElement) => {
      // 不纠错回复里面的原邮件
      // 不纠错签名里面的内容
      const copyDom = bodyDom.cloneNode(true) as HTMLElement;
      const preMailContent = copyDom.querySelector('.pre-mail-content');
      preMailContent && copyDom.removeChild(preMailContent);
      const mailSignature = copyDom.querySelector('.mail-signature');
      mailSignature && copyDom.removeChild(mailSignature);
      return copyDom.innerText;
    };
    // 目前  一个单词被多个样式分割 这种单词是不支持纠错的。当然这种情况在实际使用中也是极端场景，在外贸写信场景应该不存在
    const grammarAction = (editor: EditorType) => {
      editorInstance.current = editor;
      // 如果多次点击纠错，再下次纠错前，先把上次纠错的DOM进行删除
      delPreReviseEles(editor);
      // I was very shy. I wasnt brave enough to take part in any school activities.
      // I was very shy.I wasnt brave enough to take part in any school activities.
      // 如果把上面第一行作为参数进行纠错，返回两行，再拼接的就会少一个字符
      // 解决：在参数判断如果没空格就手动添加一个空格，后面在返回的字段中，每个句号后也加一个空格 对应上 .replace(/\.(\S)/g,'. $1')的作用
      // But when I became \na Junior 4 student
      // "But when I became" 和 "a Junior 4 student"
      // 上面第一句如果中间折行，纠错接口会返回下面这两句，重点是 "But when I became" 后面的空格没了，这就导致计算 index 对应不上
      // 解决：把\r\n都删了，这样也可以避免折行导致认为是新的一句的开始，这样纠错也更准确(歪打正着)
      // .getContent({ format: 'text' }) 不行，会将两个标签收尾空格合并，影响字符数，头疼
      // &nbsp; 会影响定位，先替换掉
      // When I was younger, my Dad used to tell me: "Boys don't want to be your friend."
      // "When I was younger, my Dad used to tell me: \"Boys don't want to be your friend.\""
      // " 在有道那边会被加上 \ 我们这又没法出现一个 \  这也太难了 用单引号替换掉双引号先
      const contentText = getValidText(editor.getBody())
        .replace(/\r?\n?/g, '')
        .replace(/\.(\S)/g, '. $1')
        .replace(/&nbsp;/g, ' ')
        .replaceAll(String.fromCharCode(160), ' ')
        .replace(/"/g, "'");
      // const contentHtml = editor.getContent().replace(/\r?\n?/g, '').replace(/\.(\S)/g,'. $1');
      // 如果再此处就执行 replace(/\.(\S)/g,'. $1') 会将img的src也处理了，会导致部分图片图裂，所以换到reviseOrg里处理
      const contentHtml = editor
        .getContent()
        .replace(/\r?\n?/g, '')
        .replace(/&nbsp;/g, ' ')
        .replaceAll(String.fromCharCode(160), ' ');
      // I was very shy.          I wasnt brave enough to take part in any school activities.
      // 到后端解析，中间的空格都会丢失，最终无法确认最终位置
      // 如果粗暴的将 . 后面的空格都替换成一个 也能解决上面的问题，但是下面的问题无法解决 因为正则没法匹配到后面便签的空格
      // <span>I was very shy. </span> <span> I wasnt brave enough to take part in any school activities.</span>
      // so 最终方案 先计算出每句话后面的空格数量 并保留
      // 计算每个句号后面有几个空格
      let whitespace;
      const whitespaceList: number[] = [];
      // 总结出来的 有道会根据这些符号做句子分割
      const regexSpace = /[\.\?!。？！] {0,}/g;
      while ((whitespace = regexSpace.exec(contentText))) {
        whitespaceList.push(whitespace[0].length - 1);
      }
      let contentTextParams = [contentText];
      message.info('校对中…');
      // 超过5000字符分割
      if (contentText.length > 5000) {
        let reg;
        if (inWindow()) {
          if (window && window.featureSupportInfo && window.featureSupportInfo.supportNativeProxy) {
            reg = new RegExp('(?<=.)', 'g');
          }
        }
        const contentTextList = reg ? contentText.split(reg) : [];
        contentTextParams = [];
        let curLength = 0;
        let cur: string[] = [];
        contentTextList.forEach(sent => {
          curLength += sent.length;
          if (curLength > 5000) {
            contentTextParams.push(cur.join(''));
            curLength = sent.length;
            cur = [sent];
          } else {
            cur.push(sent);
          }
        });
        contentTextParams.push(cur.join(''));
      }

      Promise.all(contentTextParams.map(text => MailApi.getEnglishGrammar(text))).then((res: (GrammarResponse | null)[]) => {
        message.destroy();
        if (res.includes(null)) return message.error('校对失败！');
        const resNoNull = res as GrammarResponse[];
        if (resNoNull.some(item => item.errorCode !== '0')) {
          // const errorText = resNoNull.some(item => item.errorCode === '102') ? '仅支持英文拼写纠错' : '校对失败！';
          const item = resNoNull.find(item => item.errorCode !== '0') as GrammarResponse;
          const errorText = errorCode[item.errorCode] || '校对失败！';
          message.error(errorText);
          trackApi.track('pc_writeMailPage_grammar_correction_click', {
            page: inEdm ? '营销写信' : '普通写信',
            result: '失败',
            number_of_characters: contentText.length,
          });
          return;
        }
        trackApi.track('pc_writeMailPage_grammar_correction_click', { page: inEdm ? '营销写信' : '普通写信', result: '成功', number_of_characters: contentText.length });
        let recombineData: RecombineDataType[] = [];
        resNoNull.reduce((startPos, item, index) => {
          // 超过5000个单词，返回也是分段的
          // 每段的起点不再是0，第二段的起点是(第一段 + 一个空格) 的长度
          // 第一句不用加空格
          const offset = index ? 1 : 0;
          const { newList, newStartPos } = recombineOrg(item.Result, startPos + offset, whitespaceList);
          recombineData.push(...newList);
          return newStartPos;
        }, 0);

        const revisedData = reviseOrg(contentHtml, recombineData).replace(/\.\s(\d)/g, '.$1');

        editor.setContent(revisedData);
        // 给 .lx-mce-grammar 绑定纠错卡片功能
        bindRevise(editor);
        message.success('校对成功！');
      });
    };

    const getAttribute = (key: string) => {
      if (!mouseenterTargetRef.current) return '';
      return mouseenterTargetRef.current.getAttribute(key) || '';
    };

    const changeCorrectChunk = () => {
      if (!mouseenterTargetRef.current) return '';
      const correctChunk = getAttribute('data-correctChunk');
      mouseenterTargetRef.current.replaceWith(correctChunk);
      setReviseCardVisible(false);
      trackApi.track('pc_writeMailPage_correct__grammar_click');
    };

    const ignoreChunk = () => {
      if (!mouseenterTargetRef.current) return '';
      mouseenterTargetRef.current.replaceWith(mouseenterTargetRef.current.innerText);
      setReviseCardVisible(false);
      trackApi.track('pc_writeMailPage_neglection_click');
    };

    const ReviseCard = (
      <div
        className={classnames(styles.reviseCard)}
        onMouseEnter={() => {
          setReviseCardVisible(true);
        }}
        onMouseLeave={() => {
          setReviseCardVisible(false);
        }}
      >
        <div className={classnames(styles.content)}>
          <div className={classnames(styles.correctChunk)} onClick={changeCorrectChunk}>
            {getAttribute('data-correctChunk')}
          </div>
          <div className={classnames(styles.remind)}>正确用法，点击可替换</div>
          <div className={classnames(styles.detailReason)}>{getAttribute('data-detailReason')}</div>
        </div>
        <div className={classnames(styles.footer)} onClick={ignoreChunk}>
          <div className={classnames(styles.ignore)}>忽略</div>
          {/* <div><IconSetting /></div> */}
        </div>
      </div>
    );

    return (
      <>
        <Component {...rest} ref={props} grammarAction={grammarAction} />
        <LxPopover visible={reviseCardVisible} setVisible={setReviseCardVisible} top={reviseCardPos.current.top} left={reviseCardPos.current.left}>
          {ReviseCard}
        </LxPopover>
      </>
    );
  };

  return React.forwardRef((props, ref) => <EditorGrammar {...props} ref={ref} />);
};

export default HOCEditorGrammar;
