import React, { useEffect, useRef, useState } from 'react';
import { Dropdown, Tooltip } from 'antd';
import UpOutlined from '@ant-design/icons/UpOutlined';
import DownOutlined from '@ant-design/icons/DownOutlined';
import { AvatarWithPopover, AvatarWithPopoverTooltip } from './Avatar';
import { ContactModel } from 'api';
import styles from './index.module.scss';

// 最多同时显示头像数(包括数字部分)
const MAX_SHOW_COUNT = 5;

export interface HorizontalCoordinatorProps {
  list: ContactModel[];
  id2CursorColor: Record<string, string>;
}

export const HorizontalCoordinator: React.FC<HorizontalCoordinatorProps> = ({ list, id2CursorColor }) => {
  const [showList, setShowList] = useState(list);
  const [extraNum, setExtraNum] = useState(0);
  const [showUpArrow, setShowUpArrow] = useState(false);
  const [showDownArrow, setShowDownArrow] = useState(false);

  useEffect(() => {
    init(list);
  }, [list]);

  function init(arr: ContactModel[]) {
    // 小于等于 MAX_SHOW_COUNT 直接展示
    // 大于 MAX_SHOW_COUNT 展示 MAX_SHOW_COUNT-1 个，剩下一个展示数字
    const showArr = arr.length > MAX_SHOW_COUNT ? arr.slice(0, MAX_SHOW_COUNT - 1) : arr;
    let extraNum = arr.length > MAX_SHOW_COUNT ? arr.length - MAX_SHOW_COUNT + 1 : 0;
    if (extraNum > 999) {
      extraNum = 999;
    }
    setShowList(showArr);
    setExtraNum(extraNum);
  }

  function onVisibleChange(visible: boolean) {
    setShowUpArrow(visible);
    if (visible) {
      setShowList([]);
    } else {
      init(list);
    }
  }
  /**
   * 协作者的下拉list协作者数量 >=10，需要展示滚动条（有些设备存在兼容问题，所以这里判断一下，修改style为scroll）。
   * 10个的数量显示 源于box标签的max-height 和 item height计算出来的。
   */
  const showScroll = list.length >= 10 ? true : false;

  const verticalCoordinator = (
    <div
      className={styles.coordinatorVcWrapperForScroll}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div
        className={styles.coordinatorVcWrapper}
        style={{
          overflowY: showScroll ? 'scroll' : 'auto',
        }}
      >
        {list.map(item => (
          <div className={styles.vcUserWrapper} key={item.contact.id}>
            <AvatarWithPopover info={item} cursorColor={id2CursorColor[item.contact.id]} />
            <span className={styles.vcUserName}>{item.contact.contactName}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.coordinatorHcWrapper}>
      {showList.map(item => (
        <div className={styles.hcUserWrapper} key={item.contact.id}>
          <AvatarWithPopoverTooltip info={item} cursorColor={id2CursorColor[item.contact.id]} />
        </div>
      ))}
      {!!extraNum && (
        <Dropdown
          overlayClassName={styles.coordinatorDropdown}
          overlay={verticalCoordinator}
          trigger={['click']}
          placement={'bottomRight'}
          onVisibleChange={onVisibleChange}
          visible={showUpArrow}
        >
          <Tooltip overlayClassName={styles.coordinatorTooltip} title={`当前${list.length}人访问`}>
            <div className={styles.hcBtn} onMouseEnter={() => setShowDownArrow(true)} onMouseLeave={() => setShowDownArrow(false)}>
              {showUpArrow ? <UpOutlined /> : showDownArrow ? <DownOutlined /> : <span style={{ fontSize: '12px' }}>+{extraNum}</span>}
            </div>
          </Tooltip>
        </Dropdown>
      )}
    </div>
  );
};
