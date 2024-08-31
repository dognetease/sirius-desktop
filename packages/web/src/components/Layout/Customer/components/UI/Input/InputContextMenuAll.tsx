import { Dropdown, Menu } from 'antd';
import React, { useRef, ReactElement, useState, useEffect } from 'react';
import styles from '@web-common/components/UI/ContextMenu/contextmenu.module.scss';
import { copyText } from '@web-common/components/UI/ContextMenu/util';
import { getIn18Text } from 'api';
interface TitleRightContextMenuProps {
  targetNode?: HTMLElement | null;
  children?: React.ReactNode;
  onChange: (value: string) => void;
}
const InputRightContextMenu: React.FC<TitleRightContextMenuProps> = ({ children, onChange }) => {
  const rangeText = useRef<string>();
  const inputRef = useRef<any>(null);
  const child = React.Children.only(children) as ReactElement;
  // const [propsValue, setPropsValue] = useState<string>(() => {
  //   return child.props.value? child.props.value: ''
  // });
  // useEffect(() => {
  //   setPropsValue(child.props.value);
  // }, [child.props.value])
  console.log('xxxchild-1-1-2', child);
  return (
    <Dropdown
      overlay={
        <Menu className={styles.dropdownMenu}>
          <Menu.Item
            key="3"
            onClick={async () => {
              const clipboardData = await navigator.clipboard.readText();
              console.log('xxxclipboardData', clipboardData);
              onChange(`${child.props.value ? child.props.value : ''}${clipboardData}`);
            }}
          >
            {getIn18Text('ZHANTIE')}
          </Menu.Item>
        </Menu>
      }
      trigger={['contextMenu']}
    >
      {React.cloneElement(child, {
        ref: inputRef,
        // value: propsValue
      })}
    </Dropdown>
  );
};
InputRightContextMenu.defaultProps = {
  targetNode: null,
  children: undefined,
};
export default InputRightContextMenu;
