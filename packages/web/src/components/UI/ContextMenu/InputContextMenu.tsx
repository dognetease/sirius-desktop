import { getIn18Text } from 'api';
import { Dropdown, Menu } from 'antd';
import React, { useRef, ReactElement } from 'react';
import styles from '@web-common/components/UI/ContextMenu/contextmenu.module.scss';
import { copyText } from '@web-common/components/UI/ContextMenu/util';

interface TitleRightContextMenuProps {
  targetNode?: HTMLElement | null;
  children?: React.ReactNode;
}

const InputRightContextMenu: React.FC<TitleRightContextMenuProps> = ({ children, targetNode }) => {
  const rangeText = useRef<string>();
  const inputRef = useRef<any>(null);
  const child = React.Children.only(children) as ReactElement;

  const setSelectionRange = () => {
    if (inputRef && inputRef.current) {
      console.log('content-value-input-1', inputRef, React.Children.only(children));
      let inputElment = inputRef.current.input;
      inputElment?.focus();
      inputElment?.setSelectionRange(0, -1);
    }
  };
  return (
    <Dropdown
      onVisibleChange={v => {
        if (v) {
          // 设置光标全选
          setSelectionRange();
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
                setSelectionRange();
              }
            }}
          >
            {getIn18Text('QUANXUAN')}
          </Menu.Item>
        </Menu>
      }
      trigger={['contextMenu']}
    >
      {/* { children } */}
      {/* {React.Children.map(children as React.ReactElement[], (child, index) =>
        {
          return  React.cloneElement(child, {
            ref: index
          }) 
        }
      )} */}
      {React.cloneElement(child, {
        ref: inputRef,
      })}
    </Dropdown>
  );
};

InputRightContextMenu.defaultProps = {
  targetNode: null,
  children: undefined,
};

export default InputRightContextMenu;
