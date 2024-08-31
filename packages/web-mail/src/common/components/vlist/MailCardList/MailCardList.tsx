/**
 * 邮件卡片虚拟列表
 */
import React, { useCallback, useState, useRef, forwardRef, useMemo } from 'react';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import SyncOutlined from '@ant-design/icons/SyncOutlined';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import { MailCardListProps, VlistPullRefreshRender, GetUniqKey } from '../../../../types';
import DragCardList from '../DragCardList/DragCardList';
import './MailCardList.scss';
import { getMailKey, systemIsWindow } from '../../../../util';
import { getIn18Text } from 'api';

const getListNoMoreRender = () => (
  <div className="mail-list-topline">
    <span>{getIn18Text('DAODILA')}</span>
  </div>
);

const getListLoading: VlistPullRefreshRender = state => {
  if (state === 'loading') {
    return (
      <div>
        <SyncOutlined spin />
      </div>
    );
  }
  if (state === 'success') {
    return (
      <div>
        <CheckCircleOutlined twoToneColor="#52c41a" />
      </div>
    );
  }
  if (state === 'failed') {
    return (
      <div>
        <ExclamationCircleOutlined />
      </div>
    );
  }
  return (
    <div>
      <SyncOutlined />
    </div>
  );
};

const getListLoadMoreLoading = () => (
  <div>
    <SyncOutlined spin />
  </div>
);

/**
 * 拖拽时的鼠标随动样式单个-边界情况：多选，但拖动单个邮件，激活数量作为中间状态有可能来不及渲染，所以直接使用单独结构
 * 在一个页面中存在多个邮件列表的情况下，该结构的dom id可能重复，但由于内容为纯静态内容，没有做额外处理
 * */
const DragFlagId = 'drag-active-icon';

const DragFlag = (
  <div className="drag-active-icon-wrap" id={DragFlagId}>
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.875 4.125C1.875 3.57272 2.32272 3.125 2.875 3.125H17.125C17.6773 3.125 18.125 3.57272 18.125 4.125V15.875C18.125 16.4273 17.6773 16.875 17.125 16.875H2.875C2.32272 16.875 1.875 16.4273 1.875 15.875V4.125Z"
        stroke="#386EE7"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M2.5 3.75L9.55624 8.45416C9.82496 8.63331 10.175 8.63331 10.4438 8.45416L17.5 3.75" stroke="#386EE7" strokeWidth="1.5" />
    </svg>
  </div>
);

// 邮件拖拽逻辑
const defaultOnMailDrag = (event: React.DragEvent, domId: string) => {
  const element = document.getElementById(domId);
  if (element) {
    event.dataTransfer.setDragImage(element, -10, -10);
  }
};

const MailCardList: React.FC<MailCardListProps> = (props, ref) => {
  const { onDragStart, onDragEnd, activeId = [] } = props;
  // 生成组件的唯一domId
  const componentId = useMemo(() => {
    return new Date().getTime() + '';
  }, []);

  const dragFlagMultId = useMemo(() => `drag-active-icon-mult${componentId}`, [componentId]);

  const handleMailDragStart = useCallback(
    (event, data, index) => {
      defaultOnMailDrag(event, activeId && activeId.length > 1 ? dragFlagMultId : DragFlagId);
      onDragStart && onDragStart(event, data, index);
    },
    [activeId, onDragStart]
  );

  const handleMailDragEnd = useCallback(
    (event, data, index) => {
      onDragEnd && onDragEnd(event, data, index);
    },
    [onDragEnd]
  );

  // 拖拽时的鼠标随动样式
  const DragFlagMult = useMemo(
    () => (
      <div className="drag-active-icon-wrap" id={dragFlagMultId}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M1.875 4.125C1.875 3.57272 2.32272 3.125 2.875 3.125H17.125C17.6773 3.125 18.125 3.57272 18.125 4.125V15.875C18.125 16.4273 17.6773 16.875 17.125 16.875H2.875C2.32272 16.875 1.875 16.4273 1.875 15.875V4.125Z"
            stroke="#386EE7"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M2.5 3.75L9.55624 8.45416C9.82496 8.63331 10.175 8.63331 10.4438 8.45416L17.5 3.75" stroke="#386EE7" strokeWidth="1.5" />
        </svg>
        <div hidden={activeId && activeId.length <= 1} className="drag-mail-number">
          {activeId?.length}
        </div>
      </div>
    ),
    [componentId, activeId]
  );

  return (
    <>
      <DragCardList
        ref={ref}
        noMoreRender={getListNoMoreRender}
        {...props}
        pullRefreshRender={getListLoading}
        loadMoreLoadingRender={getListLoadMoreLoading}
        className={`${systemIsWindow() ? 'u-vlist-win' : 'u-vlist'}`}
        initLoadMore={false}
        batchSize={100}
        threshold={500}
        onDragStart={handleMailDragStart}
        onDragEnd={handleMailDragEnd}
        getUniqKey={getMailKey}
      />
      <div style={{ position: 'absolute', zIndex: -99999, bottom: 0, left: 0 }}>
        {DragFlag}
        {DragFlagMult}
      </div>
    </>
  );
};
export default forwardRef(MailCardList);
