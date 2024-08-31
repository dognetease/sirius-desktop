import React, { useState, useEffect, useMemo } from 'react';
import { Dropdown, Menu } from 'antd';
import MailCardList from './MailCardList';
import MailMenuBase from '../../MailMenu/MailMenuBase/MailMenuBase';
import { MailEntryModel } from 'api';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';

// todo: 邮件多选还没有支持
const MailMenuCardList: React.FC<any> = props => {
  const {} = props;

  // 邮件邮件菜单是否展示
  const [visible, setVisible] = useState<boolean>(false);
  // 邮件菜单操作的邮件
  const [menuData, setMenuData] = useState<MailEntryModel>();
  // todo: 现在属于全局独一份，后续有需要的话状态提升，props传入
  const [mailMenuItemState, setMailMenuItemState] = useState2RM('mailMenuItemState');

  return (
    <Dropdown
      overlayClassName="u-tree-dropmenu"
      visible={visible}
      onVisibleChange={visible => {
        visible ? '' : setVisible(visible);
      }}
      placement="bottomLeft"
      overlay={
        menuData ? (
          <MailMenuBase
            mail={menuData}
            onMenuClick={() => {
              setVisible(false);
            }}
            menuItemStateMap={mailMenuItemState}
            onMenuItemStateChange={(menuId, data) =>
              setMailMenuItemState({
                ...mailMenuItemState,
                [menuData?.entry?.id]: {
                  ...(mailMenuItemState[menuData?.entry?.id] || {}),
                  [menuId]: data,
                },
              })
            }
          ></MailMenuBase>
        ) : (
          <></>
        )
      }
      trigger={['contextMenu']}
    >
      <div>
        <MailCardList
          {...props}
          onContextMenu={(key, data, index, event) => {
            setVisible(true);
            if (Array.isArray(data)) {
              setMenuData(data[0]);
            } else {
              setMenuData(data);
            }
            if (props.onContextMenu) {
              props.onContextMenu(key, data, index, event);
            }
          }}
        />
      </div>
    </Dropdown>
  );
};

export default MailMenuCardList;
