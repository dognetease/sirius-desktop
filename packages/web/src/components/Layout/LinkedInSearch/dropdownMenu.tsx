import React from 'react';
import { Button, Dropdown, Space, Menu, MenuProps } from 'antd';
import { getIn18Text } from 'api';

export interface ILinkedInDropDownMenuProps {
  onClick: (type: string) => void;
  text: string;
  disabled?: boolean;
  width?: number;
}

export const LinkedInDropDownMenu = (props: ILinkedInDropDownMenuProps) => {
  const { onClick, text, disabled = false, width = 100 } = props;

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    onClick(key);
  };

  const menu = () => {
    return (
      <Menu
        onSelect={(item, key) => {
          onMenuClick(key);
        }}
      >
        <Menu.Item key="edm">
          <p>EDM{getIn18Text('YINGXIAO')}</p>
        </Menu.Item>
        <Menu.Item key="business">
          <p>{getIn18Text('businessWhatsappMarket')}</p>
        </Menu.Item>
        <Menu.Item key="person">
          {' '}
          <p>{getIn18Text('personWhatsappMarket')}</p>
        </Menu.Item>
      </Menu>
    );
  };

  return (
    <Dropdown overlay={menu} disabled={disabled}>
      <Button type="primary" style={{ width }}>
        <Space>{text}</Space>
      </Button>
    </Dropdown>
  );
};
