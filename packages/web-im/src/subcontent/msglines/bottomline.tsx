import React, { useRef, useEffect, useCallback, useState, useMemo, useImperativeHandle } from 'react';
import classnames from 'classnames/bind';
import { IMMessage } from 'api';
import lodashGet from 'lodash/get';
import style from './line.module.scss';

const realStyle = classnames.bind(style);

/**
 * 底部消息可视线
 * target:在没有发生滚动的时候保证底部消息一直可见
 * @returns
 */
interface BottomlineManageApi {
  msgList: IMMessage[];
  cancelWatch?: boolean;
  updateEntry(visible: boolean, msglist: IMMessage[], isManual): void;
}
export const BottomlineManager: React.FC<BottomlineManageApi> = React.forwardRef((props, ref) => {
  const { cancelWatch, msgList, updateEntry } = props;

  const [entries, setEntries] = useState<IntersectionObserverEntry[]>([]);
  const lineRef = useRef<HTMLParagraphElement>(null);
  // 观察节点
  useEffect(() => {
    const listNode = lineRef.current as unknown as HTMLElement;
    if (!listNode) {
      return () => {};
    }

    const intersection = new IntersectionObserver(list => {
      setEntries(list);
    });
    intersection.observe(listNode);
    return () => {
      intersection.unobserve(listNode);
      intersection.disconnect();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    observe() {},
    unobserve() {},
    go2Bottom,
  }));
  const [$tHandles, setTHandles] = useState<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      $tHandles.forEach($t => {
        $t && clearTimeout($t);
      });
    },
    []
  );
  const go2Bottom = () => {
    const lineNode = lineRef.current as unknown as HTMLElement;
    if (!lineNode) {
      return;
    }
    const $tHandles: ReturnType<typeof setTimeout>[] = [];
    [0, 100, 200].forEach(time => {
      const $t = setTimeout(() => {
        if ('scrollIntoViewIfNeeded' in document.body) {
          lineNode.scrollIntoViewIfNeeded(true);
        } else {
          lineNode.scrollIntoView(true);
        }
      }, time);
      $tHandles.push($t);
    });
    setTHandles($tHandles);
    return $tHandles;
  };

  useEffect(() => {
    const lineNode = lineRef.current as unknown as HTMLParagraphElement;
    const entry = entries.find(item => item.target === lineNode);

    if (!entry) {
      return;
    }

    const { intersectionRatio } = entry;

    updateEntry(intersectionRatio !== 0, msgList, cancelWatch);
    return () => {};
  }, [entries]);

  // 这个force跳转的逻辑其实放到这里不合理,后续挪到外层通过prop控制
  // 不可以监听isManual 因为最后一条消息是自己发的。isManual变更之后会触发scrolltoBottom
  const forceScrollIntoview = useMemo(() => {
    const lastMsg = lodashGet(msgList, `[${msgList.length - 1}]`, undefined) as IMMessage;
    // 被取消监听之后如果自己发了一条新消息强制自己跳到最下面去
    if (lastMsg && lastMsg.flow === 'out') {
      return true;
    }
    return false;
  }, [lodashGet(msgList, `[${msgList.length - 1}].idClient`, '')]);

  // 强制滚动到底部
  useEffect(() => {
    forceScrollIntoview && go2Bottom();
  }, [forceScrollIntoview]);

  return useMemo(() => <p ref={lineRef} className={realStyle('bottomlineMark')} />, []);
});
