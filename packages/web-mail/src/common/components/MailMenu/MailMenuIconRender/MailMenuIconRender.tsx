/**
 * 邮件右键ICON菜单-结构的渲染
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Tooltip, Dropdown, Divider } from 'antd';
import classnames from 'classnames';
import { idIsTreadMail } from '@web-common/utils/utils';
import IconCard from '@web-common/components/UI/IconCard';
import { MailEntryModel } from 'api';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import useDebounceForEvent from '@web-mail/hooks/useDebounceForEvent';
import { CommonMailMenuConfig, MailMenuItemRender, CommonMailSubMenu, stringMap, mailMenuItemState, DOMProps } from '../../../../types';
import MailMenuRender from '../MailMenuRender/MailMenuRender';
import { MAIL_MENU_ITEM } from '../../../constant';
import { timeOutRequest } from '../util';
import useCreateCallbackForEvent from '@web-mail/hooks/useCreateCallbackForEvent';
import { getMailFromMails, trans2DomPropsObj } from '@web-mail/util';

interface MailMenuRenderProps {
  /**
   *  菜单的配置
   */
  data: CommonMailMenuConfig[];
  /**
   * 菜单操作的邮件model
   */
  mailData: MailEntryModel | MailEntryModel[];
  menuType?: string;
  /**
   * 邮件菜单项的loading状态 map： mailId: string | value: { menuKey: string : value: boolean }
   */
  menuItemStateMap?: mailMenuItemState;
  /**
   * 菜单状态变化
   */
  onMenuItemStateChange?: (menuKey: string, data: any) => void;
  /**
   * 按钮点击之前
   */
  beforeMenuClick?: (config: CommonMailMenuConfig, mailData: MailEntryModel | MailEntryModel[]) => void;
  /**
   * 按钮背景样式
   */
  theme?: 'light' | 'dark';
  /**
   * 渲染到原生dom的属性
   */
  domProps?: DOMProps;
}

// todo: 当菜单完全没有的时候，真个菜单就不应该弹出
// todo: 如果以后有外部改变菜单顺序的需求，可以添加一个权重字段，以便实现排序。现在没有这个需求，没有必要

const MailMenuIconRender: React.FC<MailMenuRenderProps> = props => {
  const { data = [], mailData, menuType = 'icon', menuItemStateMap, onMenuItemStateChange, beforeMenuClick, theme, domProps } = props;

  // 本地排序后的数据
  const [_localData, _setLocalData] = useState<CommonMailMenuConfig[]>([]);
  // 在对应的元素后面渲染横线
  const [groupLineMap, setGroupLineMap] = useState(new Map());

  const [menuVisiable, setMenuVisiable] = useState<stringMap>({});

  // 生成DomProps结果
  const getDomPropsObject = useCreateCallbackForEvent((mails: MailEntryModel | MailEntryModel[], menuConfig: CommonMailMenuConfig) => {
    return trans2DomPropsObj(domProps, mails, menuConfig);
  });

  // // 关键id
  // const keyIds = useMemo(() => {
  //   const { entry } = mailData;
  //   const { tid, id } = entry;
  //   return { tid, mid: id };
  // }, [mailData]);

  // 对列表数据进行分组排序
  useEffect(() => {
    const list = [];
    const map = new Map();
    const defaultList = [];
    groupLineMap.clear();
    // 分组
    data.forEach(item => {
      const groupName = item.group ? item.group : undefined;
      const groupList = map.get(groupName);
      const show = typeof item.show === 'function' ? item.show : () => item.show;
      if (groupList) {
        if (show(mailData)) {
          groupList.push(item);
        }
      } else if (show(mailData)) {
        map.set(item.group, [item]);
      }
    });
    // 默认分组提到最后，其他分组按照该分组在数据中首次出现的顺序排序
    for (const _list of map.entries()) {
      const [key, value] = _list;
      if (key === undefined) {
        defaultList.push(...value);
      } else {
        list.push(...value);
        if (value && value.length) {
          groupLineMap.set(value[value.length - 1], true);
        }
      }
    }
    const resList = [...list, ...defaultList];
    // 如果检测到横线在最后一个选项后，过滤掉
    if (groupLineMap.get(resList[resList.length - 1])) {
      groupLineMap.delete(resList[resList.length - 1]);
    }
    setGroupLineMap(groupLineMap);
    _setLocalData(resList);
  }, [data, mailData]);

  /**
   * 菜单项的点击事件
   * 如果是异步点击事件，处理按钮的loading状态
   */
  const handleMenuItemClick = useCallback(
    (item: CommonMailMenuConfig) => {
      if (item.onClick) {
        try {
          if (beforeMenuClick) {
            beforeMenuClick(item, mailData);
          }
        } catch (e) {
          console.error('[error handleMenuItemClick beforeMenuClick]', e);
        }
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
            console.error('[MailMenuIconRender syncMenu Error]:', e);
            // 直接操作菜单的屏蔽状态
            onMenuItemStateChange && onMenuItemStateChange(item.key + '', false);
          }
        }
      }
    },
    [onMenuItemStateChange, mailData]
  );

  // 操作的防抖
  const dbHandleMenuItemClick = useDebounceForEvent(handleMenuItemClick, 500, {
    leading: true,
    trailing: false,
    maxWait: 500,
  });

  // 获取显示组件
  const getElement = useCallback(
    (params: string | number | React.ReactElement | MailMenuItemRender) => {
      if (typeof params === 'function') {
        return params(mailData);
      }
      return params;
    },
    [mailData]
  );

  // 分割线结构 1.15按钮转文字去掉分割线
  const getGroupLineCom = useCallback(
    (config: CommonMailMenuConfig) =>
      false &&
      (groupLineMap.has(config) ? (
        <div className="u-tool-line">
          <div className="line" />
        </div>
      ) : null),
    [groupLineMap]
  );

  // 1.15之前，操作按钮有两个类型，一种是点击直接调onClick（例如回复），一种是点击展开Dropdown（例如更多）
  // 1.15之后，操作按钮增加中文，即增加类型三：点击左侧按钮直接调onClick，点击右侧尖头展开Dropdown
  // 获取菜单基本显示结构
  const getBaseMenuIconCom = useCallback(
    (config: CommonMailMenuConfig) => {
      let element;
      // 是否是只需要展开的类型
      const onlyUnfold = !!config.onlyUnfold;
      // 是否是当前展开的项，用于控制UI
      const isOpen = config.key && menuVisiable[config.key];
      // 是否是单独项，此类型只展示文字，并且只有一种操作行为就是点击执行onClick，包括无subMenus和有subMenus但是只有一项show的时候
      let isOnly = !onlyUnfold;
      // 是否是返回按钮，单独处理
      const isBack = config.key === 'BACK';
      let showCount = 0;
      if (Array.isArray(config.subMenus)) {
        config.subMenus.forEach(item => {
          const show = typeof item.show === 'function' ? item.show : () => item.show;
          if (show(mailData)) {
            showCount += 1;
          }
        });
      }
      // 获取当前按钮的loading状态
      const mail = getMailFromMails(mailData);
      const mailMenuConfig = menuItemStateMap && menuItemStateMap[mail?.entry?.id];
      // 获取附加到DOM上的属性
      const domPropsObj = getDomPropsObject(mailData, config);

      const isLoading = !!(mailMenuConfig && mailMenuConfig[config?.key + '']);

      // 如果没有子元素，父元素也不用展示了
      if (Array.isArray(config.subMenus) && showCount == 0) {
        return null;
      }
      isOnly = showCount <= 1;
      if (config.key === MAIL_MENU_ITEM.LOCAL_MAIL_IMPORT) {
        element = config.render && config.render(mailData);
      } else {
        element =
          menuType === 'text' ? (
            <div
              className={classnames(
                'u-tool-btn-text',
                'u-tool-btn-text-white',
                theme == 'light' ? 'u-tool-btn-text-white' : 'u-tool-btn-text-gray',
                isOpen ? 'u-tool-btn-text-open' : ''
              )}
              {...domPropsObj}
            >
              <div
                className={config.subMenus && !onlyUnfold && !isOnly ? 'u-tool-btn-text-left' : 'u-tool-btn-text-center'}
                onClick={e => {
                  if (!config.subMenus || !onlyUnfold) {
                    // config.onClick && config.onClick(mailData);
                    if (!isLoading) {
                      dbHandleMenuItemClick(config);
                    }
                  }
                  if (config.subMenus && !onlyUnfold) {
                    e.stopPropagation();
                  }
                }}
                style={isLoading ? { color: 'gray', cursor: 'not-allowed', display: 'flex' } : {}}
              >
                {isLoading ? (
                  <div style={{ marginRight: 10 }}>
                    <LoadingOutlined style={{ fontSize: '12px' }} />
                  </div>
                ) : null}
                {config.icon && <div className="u-tool-btn-text-back">{getElement(config.icon)}</div>}
                {getElement(config.name)}
                {onlyUnfold && (
                  <div className="u-tool-btn-text-icon">
                    <IconCard type="arrowDown" stroke={isOpen ? '#386ee7' : '#A8AAAD'} />
                  </div>
                )}
              </div>
              {config.subMenus && !onlyUnfold && !isOnly && (
                <>
                  <Divider type="vertical" />
                  <div className="u-tool-btn-text-right">
                    <IconCard type="arrowDown" stroke={isOpen ? '#386ee7' : '#A8AAAD'} />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div
              className="dark-svg-invert u-tool-btn"
              onClick={e => {
                if (!config.subMenus) {
                  // config.onClick && config.onClick(mailData);
                  if (!isLoading) {
                    dbHandleMenuItemClick(config);
                  }
                }
              }}
              style={isLoading ? { cursor: 'not-allowed', backgroundColor: 'f4f4f5' } : {}}
              {...domPropsObj}
            >
              {isLoading ? <LoadingOutlined width={28} style={{ fontSize: '16px', width: 28, height: 28 }} /> : getElement(config.icon)}
            </div>
          );
      }
      const tooltip = config.tooltip !== undefined && config.tooltip != null ? config.tooltip : config.name;
      return tooltip && menuType !== 'text' ? (
        <Tooltip placement="bottom" title={getElement(tooltip)} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
          {element}
        </Tooltip>
      ) : (
        element
      );
    },
    [getElement, menuVisiable, setMenuVisiable, mailData, menuItemStateMap, onMenuItemStateChange, theme]
  );

  const beforeMenuClickRef = useCreateCallbackForEvent(beforeMenuClick);

  // 获取二级菜单的显示组件
  const getSubMenuItem = useCallback(
    (config: CommonMailSubMenu) => {
      if (typeof config === 'function') {
        return config(mailData);
      }
      return (
        <MailMenuRender
          beforeMenuClick={beforeMenuClickRef}
          menuItemStateMap={menuItemStateMap}
          onMenuItemStateChange={onMenuItemStateChange}
          mailData={mailData}
          data={config}
          onMenuClick={() => setMenuVisiable({})}
          domProps={domProps}
        />
      );
    },
    [mailData, menuItemStateMap, onMenuItemStateChange, domProps]
  );

  // 获取菜单项结构
  const getMenuItem = useCallback(
    (item: CommonMailMenuConfig, index: number | string) => (
      <>
        {getBaseMenuIconCom(item)}
        {getGroupLineCom(item)}
      </>
    ),
    [mailData, getBaseMenuIconCom, menuItemStateMap]
  );

  // 获取二级菜单结构
  const getSubMenu = useCallback(
    (config: CommonMailMenuConfig) => {
      const element = getBaseMenuIconCom(config);
      if (element) {
        return (
          <>
            <Dropdown
              // key={params.key ? params.key : index}
              overlayClassName="u-tree-dropmenu"
              overlay={<>{config.subMenus ? getSubMenuItem(config.subMenus) : null}</>}
              trigger={['click']}
              placement="bottomLeft"
              visible={!!menuVisiable[config.key + '']}
              onVisibleChange={visible => {
                // todo: 邮件点击事件的联动，需要更精细的设计
                if (config.onClick) {
                  // 1.15之前会有即有onClick又有Dropdown的情况吗？这样不是又执行了一遍onClick？
                  // if (config.onClick(mailData) === false) {
                  //   return false;
                  // }
                  setMenuVisiable(map => ({
                    [config.key + '']: visible,
                  }));
                  return false;
                }
                setMenuVisiable(map => ({
                  [config.key + '']: visible,
                }));
              }}
            >
              {element}
            </Dropdown>
            {getGroupLineCom(config)}
          </>
        );
      }
      return null;
    },
    [getSubMenuItem, getMenuItem, mailData, menuVisiable, setMenuVisiable, getBaseMenuIconCom]
  );

  // 过滤显示
  const getCouldShowMenu = useCallback(
    (data: CommonMailMenuConfig[]) =>
      data.filter(item => {
        const { show = true } = item;
        // 根据显示状态进行过滤
        if (typeof show === 'function') {
          if (mailData) {
            return show(mailData);
          }
          return false;
        }
        return show;
      }),
    [mailData]
  );

  const menuElement = useMemo(() => {
    const mail = getMailFromMails(mailData);
    return mail ? (
      <div className={classnames('u-tool', idIsTreadMail(mail?.id) ? 'u-tool-tread' : '')}>
        {getCouldShowMenu(_localData).map((item, index) => {
          if (item.subMenus) {
            return getSubMenu(item);
          }
          return getMenuItem(item, index);
        })}
      </div>
    ) : (
      <></>
    );
  }, [_localData, mailData, menuVisiable, menuItemStateMap, onMenuItemStateChange]);

  return menuElement;
};

export default MailMenuIconRender;
