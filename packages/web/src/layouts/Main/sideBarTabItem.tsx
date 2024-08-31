import React, { CSSProperties, useCallback, useMemo, useRef } from 'react';
import classnames from 'classnames';
import style from './main.module.scss';
import { PageName, SiriusPageProps } from '@/components/Layout/model';

export interface SideBarTabItemProps {
  tab: SiriusPageProps;
  title: React.ReactElement;
  iconTagText?: string;
  unread?: number;
  redPoint?: boolean;
  active?: boolean;
  className?: string;
  showNewTag?: boolean;
  iconTagStyle?: CSSProperties;
  onClick?: (name: PageName) => void;
  onDoubleClick?: (name: PageName, focus: boolean) => void;
}

const SideBarTabItem: React.FC<SideBarTabItemProps> = ({ tab, unread, redPoint, className, active, showNewTag, iconTagText = 'new', iconTagStyle = {}, ...props }) => {
  const { name, tag, icon: Icon } = tab;

  const dragRef = useRef<HTMLDivElement>(null);

  const unreadIconMemo = useMemo(() => {
    const showUnread = unread !== undefined && unread > 0;
    if (!showUnread) {
      return null;
    }
    if (redPoint) {
      return <span className={style.redPoint} />;
    }
    return (
      <span className={style.iconTag}>
        <span className={style.text}>{unread < 1000 ? unread : '···'}</span>
      </span>
    );
  }, [unread, redPoint]);

  const newTagMemo = useMemo(
    () => (
      <span className={style.iconTag} style={iconTagStyle}>
        <span className={style.text}>{iconTagText}</span>
      </span>
    ),
    [iconTagText, iconTagStyle]
  );

  const iconMemo = useMemo(() => <Icon enhance={active} />, [active]);

  const handleClick = useCallback(() => {
    if (!active) {
      props.onClick && props.onClick(name);
    }
  }, [active, name, props.onClick]);

  const handleDoubleClick = useCallback(() => {
    if (active) {
      props.onDoubleClick && props.onDoubleClick(name, active);
    }
  }, [active, name]);

  return (
    // 点击事件使用了 onMouseUp，没有用 onMouseDown，响应更快，但是会比拖拽提前触发，导致未选中的条目拖拽效果不佳
    <div key={name} ref={dragRef} className={classnames([style.sideBarTab], className)} onMouseUp={handleClick} onDoubleClick={handleDoubleClick}>
      {Icon && (
        <>
          <div className={style.iconWrapper}>
            {iconMemo}
            {showNewTag ? newTagMemo : unreadIconMemo}
          </div>
          <div className={style.sideBarTabLabel}>{tag}</div>
        </>
      )}
    </div>
  );
};

export default SideBarTabItem;
