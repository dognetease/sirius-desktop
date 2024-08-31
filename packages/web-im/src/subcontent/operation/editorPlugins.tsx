import { apiHolder, IMUser, NIMApi, Session } from 'api';
import lodashGet from 'lodash/get';
import MD5 from 'md5';
import React, { useContext, useEffect, useRef } from 'react';
import { filter, Observable, of, take } from 'rxjs';
import { delay, timeout, toArray } from 'rxjs/operators';
import { Context as SaveDraftContext } from '../../store/list/saveDraftBeforeDestroy';
import { Context as DrawMsgContext } from '../store/drawmsgProvider';
import { MentionUserIdContext } from '../store/mentionUser';
import { Context as MessageContext } from '../store/messageProvider';
import { DraftContent } from './basicEditor';
import { EmojiEntry } from './emoji';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

interface EditorPluginApi {
  pushContentState(rawContent: unknown, isClear?: boolean): void;
  getContent(): DraftContent;
  insertEmojiContent(name: string): void;
  userlist: IMUser[];
  session: Session;
  sessionId: string;
}
// 草稿
export const EditorDraftPlugin: React.FC<EditorPluginApi> = props => {
  const { pushContentState, getContent, session, sessionId } = props;

  // 保存草稿
  const { saveDraft } = useContext(SaveDraftContext);
  useEffect(() => {
    let historyMd5: string | null = null;
    let historyTime = 0;
    const $stream = nimApi.sessionStream.getSessionField(of(sessionId, 'localCustom').pipe(toArray()) as Observable<[string, string]>) as Observable<{
      plainText?: string;
      time?: string;
      [key: string]: unknown;
    }>;

    // 订阅监听
    const sub = $stream.pipe(take(1)).subscribe(localCustom => {
      historyMd5 = MD5(lodashGet(localCustom, 'plainText', '')) as string;
      historyTime = lodashGet(localCustom, 'time', 0) as number;
    });
    return () => {
      sub.unsubscribe();
      const contentState = getContent();
      const curMd5 = MD5(contentState.plainText);

      if (curMd5 !== historyMd5) {
        const draftInfo = {
          time: contentState.hasText ? new Date().getTime() : historyTime,
          md5: curMd5,
          plainText: contentState.plainText.trim(),
          hasText: contentState.hasText,
          rawContent: contentState.rawContent,
        };
        saveDraft(draftInfo);
      }
    };
  }, []);

  // 恢复草稿(只更新一次 延时50ms)
  useEffect(() => {
    const $param1 = of(sessionId, 'localCustom.rawContent').pipe(toArray()) as Observable<[string, string]>;
    const $content = nimApi.sessionStream.getSessionField($param1) as Observable<{
      blocks: {
        text: string;
      }[];
    }>;

    const $sub = $content
      .pipe(
        // 只要blocks包含非空文本就恢复草稿
        filter(content => {
          const blocks = lodashGet(content, 'blocks', []);
          return blocks.some(item => {
            const text = lodashGet(item, 'text', '');
            // 排除0宽度空格场景 & 纯空格场景
            return text.replace(/\u200B/g, '').trim().length !== 0;
          });
        }),
        take(1),
        delay(50),
        timeout(1000)
      )
      .subscribe(content => {
        pushContentState(content);
      });
    // 临时代码：添加一个取消恢复的逻辑。
    // 对应BUG：QIYE163-18847  【IM-web】版本1.8.4，息屏一段时间，已经发出去的消息又回显在输入框了
    // 不是好的解决方案 先这么着吧(2022/2/28)
    // setTimeout(() => {
    //   $sub.unsubscribe();
    // }, 1000);
    return () => {
      $sub.unsubscribe();
    };
  }, []);

  return <>{props.children}</>;
};

// 回复信息
export const EditorReplyPlugin: React.FC<EditorPluginApi> = props => {
  const { userlist, pushContentState } = props;
  const { convert2Raw } = useContext(DrawMsgContext);
  const { mentionUserId } = useContext(MentionUserIdContext);

  // 执行回复时候 自动添加@人信息
  useEffect(() => {
    if (!mentionUserId || !mentionUserId.length) {
      return;
    }
    const userId = mentionUserId.replace(/@\d+$/, '');
    const repliedUser = userlist.find(item => item.account === userId);
    /**
     * 三种情况的时候不添加@人
     * 1: 在群成员中查不到这个用户
     * 2: 当前信息是单聊
     * 3: repliedMsg是本人发的
     */

    const content = repliedUser ? convert2Raw(`@${repliedUser!.nick} `, [repliedUser as IMUser]) : convert2Raw('', []);

    pushContentState(content, false);
  }, [mentionUserId]);
  return <>{props.children}</>;
};

// 撤回消息
export const EditorDrawPlugin: React.FC<EditorPluginApi> = props => {
  const { pushContentState } = props;
  const { rawContent } = useContext(DrawMsgContext);
  useEffect(() => {
    if (lodashGet(rawContent, 'blocks.length', 0) !== 0) {
      pushContentState(rawContent);
    }
  }, [rawContent]);
  return <>{props.children}</>;
};

// 插入表情
export const EditorExpressionPlugin: React.FC<EditorPluginApi> = props => {
  const { insertEmojiContent } = props;
  const { sendCustomMessage } = useContext(MessageContext);
  return <EmojiEntry iconSelector="#operation-entries" sendCustomMsg={sendCustomMessage} insertEmojiContent={insertEmojiContent} />;
};

// @ts-ignore
export const EditorPlugins: React.FC<Omit<EditorPluginApi, 'getContent' | 'pushContentState' | 'insertEmojiContent'>> = props => {
  const { children, ...restProps } = props;
  const editorRef = useRef<{
    getContent(): DraftContent;
    insertEmojiContent(name: string): void;
    pushContentState(rawContent: any, isClear?: boolean): void;
    focus(): void;
  }>({
    getContent() {
      return {
        hasText: false,
        plainText: '',
        rawContent: {
          blocks: [],
          entityMap: [],
        },
      };
    },
    insertEmojiContent(name) {},
    focus() {},
    pushContentState(rawContent, isClear = false) {},
  });

  return (
    <>
      {[EditorDraftPlugin, EditorDrawPlugin, EditorReplyPlugin, EditorExpressionPlugin].map((Children, index) => (
        <Children
          getContent={() => editorRef.current.getContent()}
          pushContentState={(...args) => {
            editorRef.current!.pushContentState(...args);
          }}
          insertEmojiContent={name => {
            editorRef.current!.insertEmojiContent(name);
          }}
          key={index === 3 ? Math.random() : index}
          {...restProps}
        />
      ))}
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            ref: ref => {
              ref && (editorRef.current = ref);
            },
            userlist: props.userlist,
          })
        : null}
    </>
  );
};
