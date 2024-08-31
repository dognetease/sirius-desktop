import { Menu } from 'antd';
import React from 'react';
import styles from './extraopmenu.module.scss';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { getIn18Text } from 'api';
export interface ExtraOpMenuProps {
  onDel?(): void;
  onEdit?(): void;
}
const ExtraOpMenu: React.FC<ExtraOpMenuProps> = ({ onDel, onEdit }) => {
  const handleClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'edit':
        if (onEdit) {
          onEdit();
        }
        break;
      case 'del':
        if (onDel) {
          SiriusModal.error({
            title: getIn18Text('QUEDINGYAOSHANCHU11'),
            content: getIn18Text('LIANXIRENHUIZAI'),
            onOk: onDel,
          });
        }
        break;
      default:
        break;
    }
  };
  return (
    <Menu selectedKeys={[]} onClick={handleClick} className={styles.menu}>
      <Menu.Item key="edit">{getIn18Text('BIANJI')}</Menu.Item>
      <Menu.Item key="del">{getIn18Text('SHANCHU')}</Menu.Item>
    </Menu>
  );
};
export default ExtraOpMenu;
