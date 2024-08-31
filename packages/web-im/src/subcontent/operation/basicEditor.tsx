import React, { useState, useRef, useContext, useEffect, useCallback, useMemo, useImperativeHandle } from 'react';
import classnames from 'classnames/bind';
import Editor from '@draft-js-plugins/editor';
import pinyin from 'tiny-pinyin';
import {
  EditorState,
  SyntheticKeyboardEvent,
  DraftHandleValue,
  Modifier,
  convertToRaw,
  convertFromRaw,
  ContentState,
  SelectionState,
  ContentBlock,
  CompositeDecorator,
} from 'draft-js';
import createMentionPlugin from '@draft-js-plugins/mention';
import { IMUser, apiHolder, apis, DataTrackerApi } from 'api';
import { emojiList } from '../../common/emojiList';
import { EMOJI_TAG_REGEXP, base64ConvertFile, getImTeamDistanceFromTop } from '../../utils/im_team_util';
import { memberSort } from '../../common/memberSort';
import styles from './basicEditor.module.scss';
import { CurSessionContext } from '../store/chatProvider';
import { ReplyMsgContext } from '../store/replingMsg';
import { PasteFileContext } from '../store/pasteFile';
import { SendButton } from './editorHotkey';
import { EmojiTag } from './expressionPlugin';
import { Entry } from './mentionEntry';
import { LOG_DECLARE } from '../../common/logDeclare';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { getIn18Text } from 'api';
const datatrackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
const realStyle = classnames.bind(styles);
const styleMap = {
  BOLD: {
    fontWeight: 'normal',
  },
  ITALIC: {
    fontStyle: 'normal',
  },
};
type MentionData = {
  name: string;
  link: string;
  avatar: string;
  // 是因为什么被命中的
  kind?: 'pinyin' | 'nick' | 'email';
  // 开始index 仅对kind=pinyin有效
  startIndex?: number;
} & Partial<IMUser>;
export interface DraftContent {
  plainText: string;
  rawContent: {
    blocks: any[];
    entityMap: Record<string, any>;
  };
  hasText: boolean;
}
const LingxiKeyBindingFn = (e: SyntheticKeyboardEvent) => {
  if (e.keyCode === 13) {
    const isNotEnter = ['metaKey', 'shiftKey', 'ctrlKey', 'altKey'].reduce((total, cur) => total || e.nativeEvent[cur], false);
    if (!isNotEnter) {
      return 'sendMsg';
    }
  }
  return undefined;
};
interface BasicEditorApi {
  scene: string;
  editWindowHeight?: number;
  sendTextMsg(options: any): any;
  userlist: IMUser[];
  updateContentState(params: { size: number; [key: string]: any }): void;
  calcMentionHeight(): void;
}
export const BasicEditor: React.FC<BasicEditorApi> = React.forwardRef((props, ref) => {
  const { scene, editWindowHeight, sendTextMsg, updateContentState, userlist, calcMentionHeight } = props;
  // mention数据源
  const [suggestions, setSuggestions] = useState<MentionData[]>([]);
  // 是否弹起mention窗口
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { replyMsg } = useContext(ReplyMsgContext);
  // 新增/删除回复消息后要聚焦
  useEffect(() => {
    const $t = setTimeout(() => {
      editorRef?.current?.focus();
    }, 100);
    return () => {
      clearTimeout($t);
    };
  }, [replyMsg]);
  useEffect(() => {
    computeMemberlist();
  }, [searchValue, userlist.length]);
  const computeMemberlist = () => {
    const value = searchValue.toLowerCase();
    if (scene !== 'team') {
      return;
    }
    const members = userlist.map(item => ({
      name: item.nick,
      link: '',
      ...item,
    })) as MentionData[];
    if (!value.length) {
      setSuggestions([
        {
          name: getIn18Text('SUOYOUREN'),
          link: '',
          avatar: '#',
          nick: getIn18Text('SUOYOUREN'),
          account: 'all',
          pinyinname: 'all',
        },
        ...members.slice(0, 30),
      ]);
      return;
    }
    const list = memberSort(
      members.map(item => {
        const pinyinname = pinyin.convertToPinyin(item.name, '-', true);
        return {
          ...item,
          pinyinname,
        };
      }),
      [
        {
          field: 'name',
          rule(name) {
            return (name as string).indexOf(value);
          },
        },
        {
          field: 'pinyinname',
          rule(pinyinStr) {
            const pinyinList = (pinyinStr as string).split('-').reduce((total, cur, curIndex, arr) => {
              total.push(arr.slice(curIndex).join(''));
              return total;
            }, [] as string[]);
            return pinyinList.findIndex(item => new RegExp(`^${encodeURIComponent(value)}`, 'i').test(item));
          },
        },
        {
          field: 'email',
          rule(emailStr) {
            return (emailStr as string).indexOf(value);
          },
        },
      ]
    );
    const _suggestions =
      list.length === members.length
        ? [
            {
              name: getIn18Text('SUOYOUREN'),
              link: '',
              avatar: '#',
              nick: getIn18Text('SUOYOUREN'),
              account: 'all',
              pinyinname: 'all',
            },
            ...list,
          ]
        : list;
    setSuggestions(_suggestions.slice(0, 30));
  };
  // 文本变更了
  const onSearchChange = ({ trigger, value }: { trigger: string; value: string }) => {
    setSearchValue(value);
  };
  // 显示/隐藏mention
  const onOpenChange = state => {
    state && calcMentionHeight();
    setOpen(state);
  };
  // 添加@
  const onAddMention = (...args) => {};
  // 返回
  const { MentionSuggestions, mentionPlugin } = useMemo(() => {
    const mentionPlugin = createMentionPlugin({
      theme: {
        mention: 'editor-mention-text',
        mentionSuggestions: 'mention-suggestions',
        mentionSuggestionsEntry: 'mention-suggestions-entry',
        mentionSuggestionsEntryFocused: 'entry-checked',
      },
      entityMutability: 'IMMUTABLE',
      mentionPrefix: '@',
    });
    const { MentionSuggestions } = mentionPlugin;
    return { mentionPlugin, MentionSuggestions };
  }, []);
  /** **************************************************** */
  /**
   * editor功能代码
   * tips: 根据目前的调研plugins和editor不可以拆分成不同组件.不管是谁作为子组件都不行
   * mention作为子组件会报一个getEditorState错误。应该是因为子组件componentDidUpdate先执行导致的
   * editor作为子组件会报getBoundClientReact错误.应该是因为editor在重新渲染期间获取editor的ref会有问题.
   * 太蛋疼了
   *
   */
  /** **************************************************** */
  function findWithRegex(regex, contentBlock, callback) {
    const text = contentBlock.getText();
    let matchArr;
    let start;
    while ((matchArr = regex.exec(text)) !== null) {
      start = matchArr.index;
      callback(start, start + matchArr[0].length);
    }
  }
  const handlerEmojiTag = (contentBlock, callback, contentState) => {
    findWithRegex(EMOJI_TAG_REGEXP, contentBlock, callback);
  };
  const compositeDecorator = new CompositeDecorator([
    {
      strategy: handlerEmojiTag,
      component: EmojiTag,
    },
  ]);
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
  // 输入框
  const editorRef = useRef<Editor>(null);
  // 自动聚焦 使用settimeout原因:
  // 参考https://github.com/draft-js-plugins/draft-js-plugins/issues/800
  useEffect(() => {
    const $t = setTimeout(() => {
      if (!editorRef.current) {
        return;
      }
      editorRef.current!.focus();
    }, 100);
    return () => {
      clearTimeout($t);
    };
  }, []);
  // 文本变更
  const onChange = useCallback((_editorState: EditorState) => {
    const curContentState = _editorState.getCurrentContent();
    setEditorState(_editorState);
    // 获取所有的BlockMap
    const _editorBlockMap = curContentState.getBlockMap();
    updateContentState({
      size: _editorBlockMap.size,
    });
  }, []);
  // 复制文件粘贴
  const { onFileChange } = useContext(PasteFileContext);
  const handlePastedFiles = (files: File[]) => {
    onFileChange(files);
    return 'handled';
  };
  const handlePastedText = (text, html) => {
    console.log('[basicEditor]:', text, html);
    if (html) {
      const reg = /<img src\s*=\s*["']([^'"]+)["'].*\/>/g;
      const base64 = reg.exec(html);
      const file = base64 && base64.length >= 2 && base64[1] && base64ConvertFile(base64[1]);
      file && onFileChange([file]);
    }
    // 无复制内容直接结束处理完成
    if (!text) {
      return 'handled';
    }
    let _contentState = editorState.getCurrentContent();
    const _selectionState = editorState.getSelection();
    const anchorOffset = _selectionState.getAnchorOffset();
    const focusOffset = _selectionState.getFocusOffset();
    const lastEmojiStart = text.lastIndexOf('[');
    const lastEmoji = text.slice(lastEmojiStart);
    let pastedText = `${text}`;
    // 粘贴的最后位置有表情，插入空格
    if (emojiList.get(lastEmoji)) {
      pastedText += ' ';
    }
    if (anchorOffset === focusOffset) {
      _contentState = Modifier.insertText(_contentState, _selectionState, pastedText, '');
    } else {
      _contentState = Modifier.replaceText(_contentState, _selectionState, pastedText, '');
    }
    const _editorState = EditorState.push(editorState, _contentState, 'insert-characters');
    setEditorState(_editorState);
    const $t = setTimeout(() => {
      const nodes = document.querySelectorAll('.public-DraftStyleDefault-block');
      const node = nodes[nodes.length - 1];
      node?.scrollIntoView({ block: 'end' });
      clearTimeout($t);
    }, 0);
    return 'handled';
  };
  const breakLine = () => {
    const insertedBlock = ContentState.createFromText('\r').blockMap;
    const _contentState = Modifier.splitBlock(
      // replaceWithFragment -> set new state editor
      editorState.getCurrentContent(),
      editorState.getSelection(),
      insertedBlock
    );
    const _editorState = EditorState.push(editorState, _contentState, 'split-block');
    setEditorState(_editorState);
  };
  const submitMsg = () => {
    const contentState = editorState.getCurrentContent();
    const rawContent = convertToRaw(contentState);
    const plainText = contentState.getPlainText().trim();
    if (!plainText || !plainText.length) {
      return;
    }
    if (plainText.length > 5000) {
      // message.info('文本消息最多允许发送5000个字符');
      SiriusModal.error({
        title: getIn18Text('NISHURUDEWEN'),
        content: getIn18Text('DANTIAOXIAOXISHANG'),
      });
      return;
    }
    const mentionAccounts = Object.values(rawContent.entityMap)
      .filter(
        item =>
          // @ts-ignore
          item.type === 'mention'
      )
      .map(
        item =>
          // @ts-ignore
          item.data.mention.account
      );
    const params = {
      text: plainText,
    };
    if (mentionAccounts.includes('all')) {
      Reflect.set(params, 'apns', {
        content: getIn18Text('YOUREN@NI'),
        forcepush: false,
      });
      Reflect.set(params, 'custom', {
        mentions: [...new Set(mentionAccounts.filter(item => item !== 'all'))],
      });
    } else if (mentionAccounts.length) {
      Reflect.set(params, 'apns', {
        content: getIn18Text('YOUREN@NI'),
        forcePush: false,
        accounts: [...new Set(mentionAccounts)],
      });
    }
    // 日志信息
    datatrackApi.track(LOG_DECLARE.CHAT.SEND_MSG);
    sendTextMsg(params);
    // 清空输入框
    let _editorState = EditorState.push(editorState, ContentState.createFromText(''));
    // 移动光标到最后
    _editorState = EditorState.moveFocusToEnd(_editorState);
    // 强制渲染光标位置
    _editorState = EditorState.forceSelection(_editorState, _editorState.getSelection());
    setEditorState(_editorState);
  };
  const deleteOne = () => {
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    // 起点位置
    const anchorOffset = selectionState.getAnchorOffset();
    // 当前block Key
    const blockKey = selectionState.getEndKey();
    // 当前block
    const curBlock = contentState.getBlockForKey(blockKey);
    // 当前block光标之前的内容
    const plainText = curBlock.getText().slice(0, anchorOffset);
    // 当前block的光标之前是否有表情
    const matchList = plainText.slice(0, anchorOffset).match(EMOJI_TAG_REGEXP);
    // 查看光标位置前一个元素是否为emoji元素，是则删除，不是则也使用默认删除方法
    // 如果有emoji表情且不是选中删除，默认删除方法即可，不用特殊处理
    if (matchList?.length > 0 && selectionState.isCollapsed()) {
      const lastEmojiValue = matchList[matchList.length - 1];
      // 表情开始的位置
      const lastEmojiStartSite = plainText.lastIndexOf(lastEmojiValue);
      // 表情末尾的位置
      const lastEmojiEndSite = lastEmojiStartSite - 1 + lastEmojiValue.length + 1;
      // 如果emoji在光标前两个位置（因为包括一个零宽空格所以不是前一个位置）
      if (lastEmojiEndSite === anchorOffset || lastEmojiEndSite === anchorOffset - 1) {
        // 需要删除的表情的开始位置
        const site = lastEmojiEndSite === anchorOffset ? anchorOffset - lastEmojiValue.length : anchorOffset - lastEmojiValue.length - 1;
        // 创建新的SelectionState
        const newSelection = SelectionState.createEmpty(blockKey);
        // 配置selectionState属性
        let newSelectionState = newSelection.merge({
          focusOffset: anchorOffset,
          anchorOffset: site,
        });
        // 将site到anchorOffset的部分替换为空串
        const newContentState = Modifier.replaceText(contentState, newSelectionState, '');
        // 执行push操作
        let _editorState = EditorState.push(editorState, newContentState, 'insert-characters');
        // 光标渲染到删除表情的位置
        newSelectionState = newSelection.merge({
          focusOffset: site,
          anchorOffset: site,
        });
        _editorState = EditorState.forceSelection(_editorState, newSelectionState);
        // 更新
        setEditorState(_editorState);
        return 'handled';
      }
    }
    return 'not-handled';
  };
  const splitBlock = () => {
    const selectionState = editorState.getSelection();
    // 当前block Key
    const blockKey = selectionState.getEndKey();
    const $t = setTimeout(() => {
      const nodes = document.querySelectorAll('.public-DraftStyleDefault-block');
      const curNodePos = Array.from(nodes).findIndex(item => item?.getAttribute('data-offset-key') && item?.getAttribute('data-offset-key').indexOf(blockKey) > -1) + 1;
      if (curNodePos > 0) {
        nodes[curNodePos] && nodes[curNodePos].scrollIntoViewIfNeeded(false);
      }
      clearTimeout($t);
    }, 0);
  };
  // 处理键盘事件
  const handlerKeyCommand = (command: string): DraftHandleValue => {
    switch (command) {
      case 'sendMsg':
        submitMsg();
        return 'handled';
      case 'breakLine':
        breakLine();
        return 'handled';
      case 'backspace':
        return deleteOne();
      case 'split-block':
        splitBlock();
        return 'not-handled';
      default:
        break;
    }
    return 'not-handled';
  };
  // 插入emoji文本
  const insertEmojiContent = name => {
    editorRef.current!.focus();
    let cct = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    // 起点位置
    const anchorOffset = selection.getAnchorOffset();
    // 终点位置
    const focusOffset = selection.getFocusOffset();
    // 当前block光标之前的内容
    let beforeText = '';
    try {
      beforeText = cct.getBlockForKey(selection.getEndKey()).getText().slice(0, focusOffset);
    } catch (err) {}
    const lastChar = beforeText.charAt(beforeText.length - 1);
    const text = lastChar === ' ' ? `${name} ` : ` ${name} `;
    if (anchorOffset === focusOffset) {
      cct = Modifier.insertText(cct, selection, text);
    } else {
      cct = Modifier.replaceText(cct, selection, text, '');
    }
    let nes = EditorState.push(editorState, cct, 'insert-characters');
    if (nes) {
      nes = EditorState.forceSelection(nes, nes.getSelection());
      setEditorState(nes);
    }
  };
  const { toName } = useContext(CurSessionContext);
  const getContent = () => {
    const contentState = editorState.getCurrentContent();
    return {
      hasText: contentState.getPlainText().trim().length !== 0,
      rawContent: convertToRaw(contentState),
      plainText: contentState.getPlainText(),
    };
  };
  const pushContentState = (rawContent, isClear = true) => {
    if (!editorRef?.current) {
      return;
    }
    // 聚焦
    editorRef.current!.focus();
    // 移动光标到最后
    let _editorState = EditorState.moveFocusToEnd(editorState);
    const _contentState = convertFromRaw(rawContent);
    if (isClear) {
      _editorState = EditorState.push(editorState, ContentState.createFromText(''));
      _editorState = EditorState.push(_editorState, _contentState);
    } else {
      // 替换之后的文本信息
      const _rcs = Modifier.replaceWithFragment(_editorState.getCurrentContent(), _editorState.getSelection(), _contentState.getBlockMap());
      _editorState = EditorState.push(_editorState, _rcs);
    }
    // 再次移动光标到最后
    _editorState = EditorState.moveFocusToEnd(_editorState);
    // 强制渲染光标位置
    _editorState = EditorState.forceSelection(_editorState, _editorState.getSelection());
    setEditorState(_editorState);
  };
  useImperativeHandle(ref, () => ({
    // 获取展示人信息
    getContent,
    // 添加表情
    insertEmojiContent,
    pushContentState,
    focus() {
      editorRef.current!.focus();
    },
  }));
  const myBlockRender = (block: ContentBlock) => {};
  return (
    <>
      <Editor
        onChange={onChange}
        editorState={editorState}
        ref={editorRef}
        decorators={[compositeDecorator]}
        plugins={[mentionPlugin]}
        customStyleMap={styleMap}
        handleKeyCommand={handlerKeyCommand}
        handlePastedText={handlePastedText}
        handlePastedFiles={handlePastedFiles}
        keyBindingFn={LingxiKeyBindingFn}
        // blockRenderMap={blockRenderMap}
        placeholder={`${getIn18Text('FASONGGEI&n')} ${toName}`}
        autoFocus
        blockRendererFn={myBlockRender}
      />
      {scene === 'team' && (
        <MentionSuggestions
          open={open}
          onOpenChange={onOpenChange}
          suggestions={suggestions}
          onSearchChange={onSearchChange}
          onAddMention={onAddMention}
          entryComponent={Entry}
          popoverContainer={({ children }) => {
            return (
              <div style={{ maxHeight: getImTeamDistanceFromTop(editWindowHeight) }} className={realStyle('mentionListWrapper')}>
                {children}
              </div>
            );
          }}
        />
      )}
      <SendButton disabled={editorState.getCurrentContent().getPlainText().trim().length === 0} onsubmit={submitMsg} />
    </>
  );
});
