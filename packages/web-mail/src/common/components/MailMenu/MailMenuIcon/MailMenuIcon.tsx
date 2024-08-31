/**
 *  用于邮件读信页的icon和弹层组合菜单
 */
import React, { useState, useEffect, useMemo } from 'react';
import { MailEntryModel, StringMap } from 'api';
import MailMenuIconRender from '../MailMenuIconRender/MailMenuIconRender';
// import { defaultReadMailIconMenuConfig } from '../mailMenuConifg/ReadMailIconMenuConfig';
import { CommonMailMenuConfig, stringMap, mailMenuItemState, DOMProps } from '../../../../types';
import { mergeMenuConfig } from '../util';
import { MAIL_MENU_ITEM } from '../../../constant';
import useCreateCallbackForEvent from '@web-mail/hooks/useCreateCallbackForEvent';

type beforeMenuItemClickCallback = (config: CommonMailMenuConfig, mailData: MailEntryModel | MailEntryModel[]) => void;

interface Props {
  mail: MailEntryModel | MailEntryModel[];
  menu?: CommonMailMenuConfig[];
  defaultMenu?: CommonMailMenuConfig[];
  menuType?: string;
  menuItemStateMap?: mailMenuItemState;
  onMenuItemStateChange?: (menuKey: string, data: any) => void;
  /**
   * 按钮点击之前
   */
  beforeMenuItemClick?: beforeMenuItemClickCallback;
  /**
   * 按钮背景样式
   */
  theme?: 'light' | 'dark';
  /**
   * 渲染到原生dom的属性
   */
  domProps?: DOMProps;
}

// 以图标按钮超现实的菜单
const IconMenuKeys = [
  MAIL_MENU_ITEM.RE_EDIT,
  MAIL_MENU_ITEM.REPLAY,
  MAIL_MENU_ITEM.REPLAY_ALL,
  MAIL_MENU_ITEM.FORWARD,
  MAIL_MENU_ITEM.RED_FLAG,
  MAIL_MENU_ITEM.TAG,
  MAIL_MENU_ITEM.DELETE,
];
// 图标按钮菜单keymap
const IconMenuKeyMap: stringMap = {};
IconMenuKeys.forEach((item, index) => {
  IconMenuKeyMap[item] = index;
});

const MailMenuIcon: React.FC<Props> = props => {
  const { mail, menu, defaultMenu, menuType, menuItemStateMap, onMenuItemStateChange, beforeMenuItemClick, theme, domProps } = props;

  // 与默认菜单配置项融合过后的配置
  // const [localMenuData, setLocalMenuData] = useState<CommonMailMenuConfig[]>([]);
  // 图标
  const [iconMenuData, setIconMenuData] = useState<CommonMailMenuConfig[]>([]);

  // 参数混合
  useEffect(() => {
    const defaultData = defaultMenu;
    let localData = defaultData;
    // 参数融合
    if (menu && menu.length) {
      localData = mergeMenuConfig(menu, defaultData);
    }
    setIconMenuData(localData);
  }, [menu, defaultMenu]);

  const beforeMenuClickRef = useCreateCallbackForEvent<beforeMenuItemClickCallback>(beforeMenuItemClick);

  const Element = useMemo(() => {
    return mail ? (
      <MailMenuIconRender
        theme={theme}
        beforeMenuClick={beforeMenuClickRef}
        menuItemStateMap={menuItemStateMap}
        onMenuItemStateChange={onMenuItemStateChange}
        data={iconMenuData}
        mailData={mail}
        menuType={menuType}
        domProps={domProps}
      />
    ) : (
      <></>
    );
  }, [iconMenuData, mail, menuItemStateMap, onMenuItemStateChange, theme, domProps]);

  return Element;
};

export default MailMenuIcon;
