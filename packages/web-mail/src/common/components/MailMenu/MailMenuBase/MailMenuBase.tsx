/**
 * 用于业务的配置混合与组件渲染组件
 */
import React, { useState, useEffect, useMemo } from 'react';
import MailMenuRender from '../MailMenuRender/MailMenuRender';
import { FLOLDER } from '../../../../util';
import { MailEntryModel } from 'api';
import MailListMenuConfig from '../mailMenuConifg/MailListMenuConfig';
import { CommonMailMenuConfig, mailMenuItemState, DOMProps } from '../../../../types';
import { mergeMenuConfig } from '../util';
import useCreateCallbackForEvent from '@web-mail/hooks/useCreateCallbackForEvent';

interface Props {
  mail: MailEntryModel;
  menu?: CommonMailMenuConfig[];
  defaultMenu?: CommonMailMenuConfig[];
  onMenuClick?: (visible: boolean) => void;
  /**
   * 邮件菜单项的loading状态 map： mailId: string | value: { menuKey: string : value: boolean }
   */
  menuItemStateMap: mailMenuItemState;
  /**
   * 菜单状态变化
   */
  onMenuItemStateChange: (menuKey: string, data: any) => void;
  /**
   * 按钮点击之前
   */
  beforeMenuItemClick?: (config: CommonMailMenuConfig, mailData: MailEntryModel) => void;
  /**
   * 渲染到原生dom的属性
   */
  domProps?: DOMProps;
}

const MailMenuBase: React.FC<Props> = props => {
  const { mail, menu, defaultMenu = MailListMenuConfig, onMenuClick, menuItemStateMap, onMenuItemStateChange, beforeMenuItemClick, domProps } = props;

  // 与默认菜单配置项融合过后的配置
  const [localMenuData, setLocalMenuData] = useState<CommonMailMenuConfig[]>([]);

  // 参数混合
  useEffect(() => {
    if (menu && menu.length) {
      const localData = mergeMenuConfig(menu, defaultMenu);
      setLocalMenuData(localData);
    } else {
      setLocalMenuData(defaultMenu);
    }
  }, [menu, defaultMenu]);

  const beforeMenuClickRef = useCreateCallbackForEvent(beforeMenuItemClick);

  return useMemo(() => {
    return mail ? (
      <MailMenuRender
        beforeMenuClick={beforeMenuClickRef}
        data={localMenuData}
        menuItemStateMap={menuItemStateMap}
        onMenuItemStateChange={onMenuItemStateChange}
        mailData={mail}
        onMenuClick={onMenuClick}
        domProps={domProps}
      />
    ) : (
      <div></div>
    );
  }, [localMenuData, mail, onMenuItemStateChange, menuItemStateMap]);
};

export default MailMenuBase;
