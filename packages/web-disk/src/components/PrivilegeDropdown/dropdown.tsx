/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Dropdown, Menu } from 'antd';
import classnames from 'classnames';
import { ContactModel, EntityOrg } from 'api';
import FoldIcon from '@web-common/components/UI/Icons/svgs/FoldSvg';
import UnfoldIcon from '@web-common/components/UI/Icons/svgs/UnfoldSvg';
import styles from './dropdown.module.scss';
import { CoactorPrivilege } from './../../utils';
import { getIn18Text } from 'api';
type PrivilegeDropdownProps = {
  privileges?: CoactorPrivilege[];
  privilege?: CoactorPrivilege;
  linkStyle: string;
  changePrivilege?: Function;
  removeItem?: Function;
  item?: ContactModel | EntityOrg;
};
const PrivilegeDropdown: React.FC<PrivilegeDropdownProps> = props => {
  const { privileges = [], privilege: oriPrivilege, linkStyle, changePrivilege, removeItem, item } = props;
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [privilege, setPrivilege] = useState<CoactorPrivilege>(getIn18Text('KECHAKAN'));
  useEffect(() => {
    oriPrivilege && setPrivilege(oriPrivilege);
  }, [oriPrivilege]);
  const menu = (
    <Menu
      onClick={info => {
        if (info.key === 'remove') {
          removeItem && removeItem(item);
          return;
        }
        changePrivilege && changePrivilege(info.key as CoactorPrivilege, item);
        setDropdownOpen(false);
      }}
    >
      {privileges.map(item => (
        <Menu.Item key={item}>
          <span style={{ color: item === privilege ? '#386EE7' : 'initial' }}>{item}</span>
        </Menu.Item>
      ))}
      {removeItem && (
        <Menu.Item key="remove">
          <span style={{ color: '#F74F4F' }}>{getIn18Text('YICHU')}</span>
        </Menu.Item>
      )}
    </Menu>
  );
  return (
    <Dropdown overlay={menu} placement="bottomRight" trigger={['click']} overlayClassName={styles.diskMenu} onVisibleChange={visible => setDropdownOpen(visible)}>
      <div className={classnames(styles.dropdownLink, linkStyle)}>
        <span>{privilege}</span>
        {dropdownOpen ? <FoldIcon className="dark-invert" /> : <UnfoldIcon className="dark-invert" />}
      </div>
    </Dropdown>
  );
};
export default PrivilegeDropdown;
