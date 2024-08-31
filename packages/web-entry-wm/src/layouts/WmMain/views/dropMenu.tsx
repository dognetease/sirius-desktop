import React, { useMemo } from 'react';
import classnames from 'classnames';
import { ChildrenType } from '@web-entry-wm/layouts/config/topMenu';
import { TopMenuPath, TopMenuType } from '@web-common/conf/waimao/constant';
import chunk from 'lodash/chunk';
import { inWindow } from 'api';
import styles from './dropMenu.module.scss';

interface DropMenuProps {
  dropMenuItem: TopMenuType;
  onTopItem: (item: ChildrenType) => void;
  order: { [key: string]: number[] };
}

const DropMenu: React.FC<DropMenuProps> = props => {
  const {
    dropMenuItem: { children },
    onTopItem,
    order,
  } = props;
  const sysLang = inWindow() && window.systemLang === 'en';

  const renderWmContent = (menu: ChildrenType[], level: number) => {
    if (level === 3) return;
    return (
      <ul className={level === 1 ? styles.titleWrapper : styles.subTitleWrapper}>
        {menu?.map((item: ChildrenType) => {
          if (item?.children?.length) {
            return (
              <div className={styles.itemWrapper}>
                {item.show !== false && (
                  <li className={level === 1 ? styles.title : styles.subTitle} onClick={() => level !== 1 && onTopItem(item)}>
                    <>{item?.topMenuIcon}</>
                    {item?.name}
                  </li>
                )}
                <>{renderWmContent(item?.children, level + 1)}</>
              </div>
            );
          } else {
            if (level === 1) {
              return (
                <div className={styles.itemWrapper}>
                  <li className={styles.title}>{item?.name}</li>
                  {item.show !== false && (
                    <li className={styles.subTitle} onClick={() => onTopItem(item)}>
                      <>{item?.topMenuIcon}</>
                      {item?.name}
                    </li>
                  )}
                </div>
              );
            } else
              return (
                <>
                  {item.show !== false && (
                    <li className={level === 1 ? styles.title : styles.subTitle} onClick={() => level !== 1 && onTopItem(item)}>
                      <>{item?.topMenuIcon}</>
                      {item?.name}
                    </li>
                  )}
                </>
              );
          }
        })}
      </ul>
    );
  };

  const renderOtherContent = (menu: ChildrenType[], level: number) => {
    return (
      <ul className={level === 1 ? styles.titleWrapper : styles.subTitleWrapper}>
        {menu?.map(item => {
          return (
            item.show !== false && (
              <div className={styles.itemWrapper}>
                <li className={styles.title} onClick={() => !item.onlyChild && level !== 1 && onTopItem(item)}>
                  {level !== 1 ? <>{item?.topMenuIcon}</> : null}
                  {item?.name}
                </li>
                {item?.onlyChild && (
                  <ul className={styles.subTitleWrapper}>
                    <div className={styles.itemWrapper}>
                      <li className={styles.title} onClick={() => onTopItem(item)}>
                        {item?.topMenuIcon}
                        {item?.name}
                      </li>
                    </div>
                  </ul>
                )}
                <>{!!item?.children?.length && renderOtherContent(item?.children!, level + 1)}</>
              </div>
            )
          );
        })}
      </ul>
    );
  };

  const renderIntelliContent = (menu: ChildrenType[][]) => {
    return (
      <div className={styles.intelliModule}>
        {menu.map(item => {
          return (
            <div className={styles.listWrapper}>
              {item.map(i => {
                return (
                  <div className={styles.itemWrapper}>
                    <span className={styles.title}>{i.name}</span>
                    {i?.onlyChild && (
                      <div className={styles.item} onClick={() => onTopItem(i)}>
                        <span className={styles.itemTitle}>
                          {i?.topMenuIcon}
                          {i?.name}
                        </span>
                      </div>
                    )}
                    {i.children.map(c => {
                      return (
                        c.show !== false && (
                          <div className={styles.item} onClick={() => onTopItem(c)}>
                            <span className={styles.itemTitle}>
                              {c?.topMenuIcon}
                              {c?.name}
                            </span>
                          </div>
                        )
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMenu = () => {
    if (props.dropMenuItem.path === TopMenuPath.wm) {
      let ans: ChildrenType[][] = [];
      ans = chunk(children[0]?.children, 2);
      return renderOtherContent(children[0]?.children!, 1);
    } else if (props.dropMenuItem.path === TopMenuPath.intelliMarketing) {
      let ans: ChildrenType[][] = [];
      ans = chunk(children[0]?.children, 2);
      return renderOtherContent(children[0]?.children!, 1);
    } else {
      const orderedMenu: ChildrenType[] = [];
      order?.[props.dropMenuItem.path]?.forEach(order => {
        const ans = children[0]?.children?.find((_, index) => index === order) as ChildrenType;
        orderedMenu.push(ans);
      });
      return renderOtherContent(orderedMenu.length ? orderedMenu : children[0]?.children!, 1);
    }
  };

  return (
    <div
      className={classnames(styles.container, styles.specialModule, {
        // 不要重复使用styles.some_class
        [styles.wa]: props.dropMenuItem.path === TopMenuPath.wa,
        [styles.coopModule]: props.dropMenuItem.path === TopMenuPath.coop,
        [styles.intelli]: props.dropMenuItem.path === TopMenuPath.intelliMarketing,
        [styles.wmdata]: props.dropMenuItem.path === TopMenuPath.unitable_crm || props.dropMenuItem.path === TopMenuPath.wmData,
        [styles.site]: props.dropMenuItem.path === TopMenuPath.site,
        [styles.enLang]: sysLang,
      })}
    >
      <div className={styles.menuItem}>{renderMenu()}</div>
    </div>
  );
};

export default DropMenu;
