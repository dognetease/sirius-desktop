import React, { useEffect, useRef, useState } from 'react';
import { StrangerModel } from 'api';
import { Tooltip, Spin } from 'antd';
import CardList from '../common/components/vlist/CardList/CardList';
import StrangerItem from './strangerItem';
import style from './strangerList.module.scss';
import IconCard from '@web-common/components/UI/IconCard';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { StrangerActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { ModuleHotKeyEvent } from './moduleHotKey';
import HotKeys from '../common/components/HotKeys/HotKeys';
import useState2RM from '../hooks/useState2ReduxMock';
import useDebounceForEvent from '../hooks/useDebounceForEvent';
import { getIn18Text } from 'api';
const ListHotKeys = HotKeys(CardList, ModuleHotKeyEvent);
export interface StrangerListProps {
  gettingAllStrangers: boolean;
}
// 标记重要程度 提示内容
const markImportanceTitle = () => (
  <div className={style.remarks}>
    <div className={style.remark}>{getIn18Text('1. LIANXI')}</div>
    <div className={style.remark}>{getIn18Text('2. LIANXI')}</div>
    <div className={style.remark}>{getIn18Text('3. LIANXI')}</div>
  </div>
);
// 陌生人列表
const StrangerList: React.FC<StrangerListProps> = props => {
  const { gettingAllStrangers } = props;
  const strangers = useAppSelector(state => state.strangerReducer.strangers);
  // const curActiveStrangerIds = useAppSelector(state => state.strangerReducer.activeStrangerIds);
  const [curActiveStrangerIds, setCurActiveStrangerIds] = useState2RM('activeStrangerIds', 'doUpdateMailRelateStrangerActiveId');
  const [cardListHeight, setCardListHeight] = useState<number>(0);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const strangerListRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  // 每行高度固定
  const rowHeight = () => 102;
  // 单个激活
  const onActive = (id: string, index: number, data: StrangerModel) => {
    dispatch(StrangerActions.setCurStranger(data));
  };
  // 选中
  // 多选选中
  const onSelect = (ids: string[], allIds: string[]) => {
    // dispatch(StrangerActions.setActiveStrangerIds(allIds));
    setCurActiveStrangerIds(allIds);
  };
  // 双击
  const onDoubleClick = () => {};
  // 右键
  const onContextMenu = () => {};
  // 滚动
  const onScroll = ({ scrollTop }) => {
    setScrollTop(scrollTop);
  };
  const dbOnScroll = useDebounceForEvent(onScroll, 500);
  // 重置陌生人列表高度
  const resetCardListHeight = () => {
    const strangerListH = strangerListRef.current?.clientHeight;
    if (strangerListH) {
      setCardListHeight(strangerListH - 50);
    }
  };
  useEffect(() => {
    resetCardListHeight();
    window.addEventListener('resize', resetCardListHeight);
    return () => {
      window.removeEventListener('resize', resetCardListHeight);
    };
  }, []);
  return (
    <div ref={strangerListRef} className={style.strangerList}>
      <div className={style.markTitle}>
        <div className={style.mark}>
          <IconCard type="mark" />
          &nbsp;{getIn18Text('biaoji')}
        </div>
        &nbsp;&nbsp;<span className={style.thin}>|</span>&nbsp;&nbsp;{getIn18Text('BIAOJINIMOSHENG')}
        <Tooltip placement="bottom" overlayStyle={{ maxWidth: 'unset' }} overlayInnerStyle={{ width: '272px' }} title={markImportanceTitle}>
          <span className={style.questionIcon}>
            <IconCard type="question" />
          </span>
        </Tooltip>
      </div>
      {/* 陌生人列表 */}
      {
        // 似乎state有些问题
      }
      {strangers?.length > 0 && (
        <ListHotKeys
          height={cardListHeight}
          width={276}
          total={10}
          rowHeight={rowHeight}
          onScroll={dbOnScroll}
          activeId={curActiveStrangerIds}
          cardMargin={8}
          data={strangers}
          card={StrangerItem}
          onActive={onActive}
          onSelect={onSelect}
          onUnSelect={onSelect}
          onDoubleClick={onDoubleClick}
          onContextMenu={onContextMenu}
          scrollTop={scrollTop}
          getUniqKey={(index, data) => {
            if (data) return data.accountName;
            return index;
          }}
        />
      )}
      {/* 已标记全部 */}
      {strangers?.length === 0 && !gettingAllStrangers && (
        <div className={style.markedAll} style={{ height: `${cardListHeight}px` }}>
          <div className={style.markedAllCenter}>
            <img className={style.markedAllLogo} src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/04/02/d772939ef15646ccb359685353228e0c.png" alt="" />
            {getIn18Text('YIBIAOJIQUANBU')}
          </div>
        </div>
      )}
      {gettingAllStrangers && strangers.length === 0 && <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} />} className={style.spinlogo} />}
    </div>
  );
};
export default StrangerList;
