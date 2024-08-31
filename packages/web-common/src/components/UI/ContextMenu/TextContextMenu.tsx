import { Dropdown, Menu } from 'antd';
import React, { useRef } from 'react';
import styles from './contextmenu.module.scss';
import { copyText, selectElement } from './util';
import { getIn18Text } from 'api';
interface TitleRightContextMenuProps {
  targetNode?: HTMLElement | null;
  children?: React.ReactNode;
}
const TitleRightContextMenu: React.FC<TitleRightContextMenuProps> = ({ children, targetNode }) => {
  const rangeText = useRef<string>();
  return (
    <Dropdown
      onVisibleChange={v => {
        if (v) {
          if (document.getSelection()?.toString()) {
            rangeText.current = document.getSelection()?.toString();
          }
        }
      }}
      overlay={
        <Menu className={styles.dropdownMenu}>
          <Menu.Item
            key="1"
            onClick={() => {
              // titileRef.current
              if (rangeText.current) {
                copyText(rangeText.current);
              }
            }}
          >
            {getIn18Text('FUZHI')}
          </Menu.Item>
          <Menu.Item
            key="2"
            onClick={() => {
              if (targetNode) {
                selectElement(targetNode);
              }
            }}
          >
            {getIn18Text('QUANXUAN')}
          </Menu.Item>
        </Menu>
      }
      trigger={['contextMenu']}
    >
      {children}
    </Dropdown>
  );
};
TitleRightContextMenu.defaultProps = {
  targetNode: null,
  children: undefined,
};
export default TitleRightContextMenu;
