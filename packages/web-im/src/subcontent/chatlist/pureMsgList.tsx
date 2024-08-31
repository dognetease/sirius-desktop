import React, { useContext, useMemo, useRef, useEffect } from 'react';
import classnames from 'classnames/bind';
import { Context as MessageContext } from '../store/messageProvider';
import ChatItem from '../chatDisplay/chatItem';
import style from './pureMsgList.module.scss';
import { Context as MaxsizeContext } from '../store/maxsizeProvider';

const realStyle = classnames.bind(style);

export const ResizeObservePlaceholder: React.FC<any> = props => {
  const ref = useRef<HTMLDivElement>(null);
  const { compute } = useContext(MaxsizeContext);
  useEffect(() => {
    const node = ref.current as unknown as HTMLElement;
    compute(node, node.parentElement as Element, width => Math.max(width - 248.5, 0));
  }, []);
  return <div ref={ref} className={realStyle('resizeObserePlaceholder')} />;
};

interface PureMsgListApi {
  children(params: any): React.ReactNode;
}
// 纯列表 没有任何获取列表逻辑/滚动逻辑
export const PureMsgList: React.FC<PureMsgListApi> = props => {
  const { state: MessageState } = useContext(MessageContext);

  return useMemo(
    () => (
      <>
        {/* 放一个空占位符来计算图片的最大尺寸 */}
        <ResizeObservePlaceholder />
        {MessageState.msgList.map((msg, index) => (
          <div key={msg.idClient} className={realStyle('pureMsgContent')}>
            {typeof props.children === 'function' &&
              props.children({
                msglist: MessageState.msgList,
                index,
                msg,
              })}
            <ChatItem key={msg.idClient} msg={msg} />
          </div>
        ))}
      </>
    ),
    [MessageState]
  );
};
