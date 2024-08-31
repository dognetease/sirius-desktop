/**
 * 邮件邮件菜单-基础渲染组件
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { CommonMailMenuConfig, MailMenuItemRender, CommonMailSubMenu, DOMProps } from '../../../../types';
import { Menu } from 'antd';
import { MailEntryModel, apiHolder as api, apis, MailConfApi } from 'api';
const { SubMenu } = Menu;
import { timeOutRequest } from '../util';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';
import { getMailFromMails, trans2DomPropsObj } from '@web-mail/util';
import useCreateCallbackForEvent from '@web-mail/hooks/useCreateCallbackForEvent';

interface MailMenuRenderProps {
  /**
   *  菜单的配置
   */
  data: CommonMailMenuConfig[];
  /**
   * 菜单操作的邮件model
   */
  mailData: MailEntryModel | MailEntryModel[];
  /**
   * 菜单内容的点击事件
   */
  onMenuClick?: (visible: boolean) => void;
  /**
   * 邮件菜单项的loading状态 map： mailId: string | value: { menuKey: string : value: boolean }
   */
  menuItemStateMap?: { [mailId: string]: { [menuKey: string]: boolean } };
  /**
   * 菜单状态变化
   */
  onMenuItemStateChange?: (menuKey: string, data: any) => void;
  /**
   * 按钮点击之前
   */
  beforeMenuClick?: (config: CommonMailMenuConfig, mailData: MailEntryModel | MailEntryModel[]) => void;
  /**
   * 渲染到原生dom的属性
   */
  domProps?: DOMProps;
}

// todo: 当菜单完全没有的时候，真个菜单就不应该弹出
// todo: 如果以后有外部改变菜单顺序的需求，可以添加一个权重字段，以便实现排序。现在没有这个需求，没有必要
const EmptyList: any = [];

const MailMenuRender: React.FC<MailMenuRenderProps> = props => {
  const { data = EmptyList, mailData, onMenuClick, menuItemStateMap, onMenuItemStateChange, beforeMenuClick, domProps } = props;

  // 生成DomProps结果
  const getDomPropsObject = useCreateCallbackForEvent((mails: MailEntryModel | MailEntryModel[], menuConfig: CommonMailMenuConfig) => {
    return trans2DomPropsObj(domProps, mails, menuConfig);
  });

  // 本地排序后的数据
  // const [_localData, _setLocalData] = useState<CommonMailMenuConfig[]>([]);
  // 在对应的元素后面渲染横线
  // const [groupLineMap, setGroupLineMap] = useState(new Map());

  // 对列表数据进行分组排序
  // useEffect(() => {
  //   const list = [];
  //   const map = new Map();
  //   const defaultList = [];
  //   // groupLineMap.clear();
  //   // // 分组
  //   // data.forEach(item => {
  //   //   const groupName = item.group ? item.group : undefined;
  //   //   const groupList = map.get(groupName);
  //   //   let show = typeof item.show == 'function' ? item.show : () => item.show;
  //   //   if (groupList) {
  //   //     if (show(mailData)) {
  //   //       groupList.push(item);
  //   //     }
  //   //   } else {
  //   //     if (show(mailData)) {
  //   //       map.set(item.group, [item]);
  //   //     }
  //   //   }
  //   // });
  //   // 默认分组提到最后，其他分组按照该分组在数据中首次出现的顺序排序
  //   // for (let _list of map.entries()) {
  //   //   const [key, value] = _list;
  //   //   if (key === undefined) {
  //   //     defaultList.push(...value);
  //   //   } else {
  //   //     list.push(...value);
  //   //     if (value && value.length) {
  //   //       groupLineMap.set(value[value.length - 1], true);
  //   //     }
  //   //   }
  //   // }
  //   // const resList = [...list, ...defaultList];
  //   // 如果检测到横线在最后一个选项后，过滤掉
  //   // if (groupLineMap.get(resList[resList.length - 1])) {
  //   //   groupLineMap.delete(resList[resList.length - 1]);
  //   // }
  //   // setGroupLineMap(groupLineMap);
  //   // _setLocalData(resList);
  // }, [data, mailData]);

  // 获取显示组件
  const getElement = useCallback(
    (params: React.ReactElement | MailMenuItemRender) => {
      if (typeof params === 'function') {
        return params(mailData);
      }
      return params;
    },
    [mailData]
  );

  // 获取菜单项的结构
  const getMenuItemContent = useCallback(
    (item: CommonMailMenuConfig, isLoading?: boolean) => {
      // 获取需要附加到dom上的props
      const domProps = getDomPropsObject(mailData, item) || {};
      return item.render != null ? (
        item.render(mailData)
      ) : (
        <div className="menu-content-wrap" {...domProps}>
          {isLoading ? (
            <div style={{ marginRight: 10 }}>
              <LoadingOutlined style={{ fontSize: '16px' }} />
            </div>
          ) : null}
          <div className="menu-name">{getElement(item.name)}</div>
          <div className="menu-icon">{getElement(item.tip)}</div>
        </div>
      );
    },
    [mailData, getDomPropsObject]
  );

  // 获取二级菜单的显示组件
  const getSubMenuItem = useCallback(
    (params: CommonMailSubMenu, parentIndex: number = 0) => {
      if (typeof params === 'function') {
        return params(mailData, onMenuClick);
      }
      let preGroup = null;

      return getCouldShowMenu(params).map((item, index) => {
        if (item.subMenus) {
          const res = getSubMenu(item, parentIndex + '' + index, index == 0 ? null : preGroup);
          preGroup = item?.group;
          return res;
        }
        const res = getMenuItem(item, parentIndex + '' + index, index == 0 ? null : preGroup);
        preGroup = item?.group;
        return res;
      });
    },
    [mailData]
  );

  // 获取二级菜单结构
  const getSubMenu = useCallback(
    (params: CommonMailMenuConfig, index: number | string, prevGroup?: string) => {
      const subMenuItem = getSubMenuItem(params.subMenus);
      if (Array.isArray(subMenuItem) && subMenuItem.length === 0) {
        return null;
      }
      return (
        <>
          {index != 0 && prevGroup && prevGroup != params.group ? <Menu.Divider key={`divider-${params.key ? params.key : index}`} /> : null}
          <SubMenu key={params.key ? params.key : index} title={getMenuItemContent(params)} popupOffset={[1, 0]}>
            {subMenuItem}
          </SubMenu>
        </>
      );
    },
    [getMenuItemContent, getSubMenuItem]
  );

  /**
   * 菜单项的点击事件
   * 如果是异步点击事件，处理按钮的loading状态
   */
  const handleMenuItemClick = useCallback(
    (item: CommonMailMenuConfig) => {
      try {
        if (beforeMenuClick) {
          beforeMenuClick(item, mailData);
        }
      } catch (e) {
        console.error('[error handleMenuItemClick beforeMenuClick]', e);
      }
      // 通知外部，关闭当前右键菜单
      onMenuClick && onMenuClick(false);
      if (item.onClick) {
        let task = item.onClick(mailData);
        // 如果是异步操作
        if (task?.then) {
          try {
            // 进行请求的超时包装
            task = timeOutRequest(task, 15000);
            // 记录loading状态
            onMenuItemStateChange && onMenuItemStateChange(item.key + '', true);
            // 挂载回调
            task?.finally(() => {
              onMenuItemStateChange && onMenuItemStateChange(item.key + '', false);
            });
          } catch (e) {
            // 打印错误
            console.error('[MailMenuRender syncMenu Error]:', e);
            // 直接操作菜单的屏蔽状态
            onMenuItemStateChange && onMenuItemStateChange(item.key + '', false);
          }
        }
      }
    },
    [onMenuClick, onMenuItemStateChange, mailData]
  );

  // 操作的防抖
  const dbHandleMenuItemClick = useDebounceForEvent(handleMenuItemClick, 500, {
    leading: true,
    trailing: false,
    maxWait: 500,
  });

  // 获取菜单项结构
  const getMenuItem = useCallback(
    (item: CommonMailMenuConfig, index: number | string, prevGroup: string) => {
      const mail = getMailFromMails(mailData);
      const mailMenuConfig = menuItemStateMap && menuItemStateMap[mail?.entry?.id];
      const isLoading = !!(mailMenuConfig && mailMenuConfig[item?.key + '']);
      return (
        <>
          {index != 0 && prevGroup != item.group ? <Menu.Divider key={`divider-${item.key ? item.key : index}`} /> : null}
          <Menu.Item
            key={item.key ? item.key : index}
            disabled={isLoading}
            onClick={() => {
              !isLoading && dbHandleMenuItemClick(item);
            }}
          >
            {getMenuItemContent(item, isLoading)}
          </Menu.Item>
        </>
      );
    },
    [getMenuItemContent, mailData, onMenuClick, menuItemStateMap]
  );

  // 过滤显示
  const getCouldShowMenu = useCallback(
    (data: CommonMailMenuConfig[]) => {
      return data.filter(item => {
        const { show = true } = item;
        // 根据显示状态进行过滤
        if (typeof show === 'function') {
          if (mailData) {
            return show(mailData);
          }
          return false;
        }
        return show;
      });
    },
    [mailData]
  );

  const Element = useMemo(() => {
    let prevGroup = '';
    return mailData ? (
      <Menu selectable={false}>
        {getCouldShowMenu(data).map((item, index) => {
          if (item.subMenus) {
            const res = getSubMenu(item, index, index == 0 ? null : prevGroup);
            prevGroup = item?.group;
            return res;
          }
          const res = getMenuItem(item, index, index == 0 ? null : prevGroup);
          prevGroup = item?.group;
          return res;
        })}
      </Menu>
    ) : (
      <></>
    );
  }, [data, mailData]);

  return Element;
};

export default MailMenuRender;
