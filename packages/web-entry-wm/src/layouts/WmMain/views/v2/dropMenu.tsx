import { EdmMenuVideo, EdmMenuVideoKeys, getIn18Text, inWindow } from 'api';
import React from 'react';
import classnames from 'classnames';
import { ChildrenType } from '@web-entry-wm/layouts/config/topMenu';
import { TopMenuPath, TopMenuType } from '@web-common/conf/waimao/constant';
import chunk from 'lodash/chunk';
import { Divider } from 'antd';
import VideoBox from '@web-common/components/UI/VideoBox';
import IconCard from '@web-common/components/UI/IconCard/index';
import styles from './dropMenu.module.scss';
import { useOpenHelpCenter } from '@web-common/utils/utils';

interface DropMenuProps {
  dropMenuItem: TopMenuType;
  onTopItem: (item: ChildrenType) => void;
  videoInfo?: EdmMenuVideo;
  onClose?: () => void;
  // order: { [key: string]: number[] };
}

const CONFIG_MAP: Record<
  string,
  {
    titles: string[];
    tip: string;
    link: string;
    videoId?: string;
    videoSource?: string;
    videoScene?: string;
  }
> = {
  // 客户发现
  CUSTOMER_PROSPECTING: {
    titles: [getIn18Text('DUOZHONGSHUJUWAJUETU'), getIn18Text('BANGZHUNINBIANJIEGAOXIAO')],
    tip: getIn18Text('SOUSUOYINQING、HAIGUAN'),
    link: '/c/1598628693516853250.html',
    videoId: 'V1',
    videoSource: 'faxian_navigation',
    videoScene: 'faxian_navigation_1',
  },
  // 客户开发
  CUSTOMER_EXLOIT: {
    titles: [getIn18Text('QUANQUDAOYINGXIAOCHUDA'), getIn18Text('GAOXIAOZHINENGKAIFAKE')],
    tip: getIn18Text('YINGXIAOTUOGUANAIZI'),
    link: '/c/1598628693143560194.html',
    videoId: 'V2',
    videoSource: 'kaifa_navigation',
    videoScene: 'kaifa_navigation_1',
  },
  // 客户管理
  CUSTOMER_MANAGE: {
    titles: [getIn18Text('HUOKE、BEIDIAO、YING')],
    tip: getIn18Text('TIGONGZHINENGTUIJIAN、'),
    link: '/c/1598628694380879874.html',
    videoId: 'V3',
    videoSource: 'guanli_navigation',
    videoScene: 'guanli_navigation_1',
  },
  // 客户履约
  CUSTOMER_PROMISE: {
    titles: [getIn18Text('DINGDANGUOCHENGQUANLIANLU'), getIn18Text('XIAOSHOUYEJIJINZHANSHI')],
    tip: getIn18Text('JIANDANYIYONGDESHANGPIN'),
    link: '/c/1701088312267202561.html',
    videoId: 'V3',
    videoSource: 'lvyue_navigation',
    videoScene: 'lvyue_navigation_1',
  },
  // 建站管理
  WEBSITE_ADMIN: {
    titles: [getIn18Text('PINPAIJIANZHAN，'), getIn18Text('QIYEDEPINPAIJIANSHE')],
    tip: getIn18Text('JIEHEJIANZHAN+SHEMEI'),
    link: '/c/1600375599838371842.html',
  },
  // WA
  WA: {
    titles: ['WA 管理助手'],
    tip: '提供翻译、AI 沟通助手助力业务员沟通提效，同步聊天消息沉淀企业客户资产',
    link: '/d/1722101066374443010.html',
    videoId: 'V4',
    videoSource: 'wa_navigation',
    videoScene: 'wa_navigation_1',
  },
};

const DropMenu: React.FC<DropMenuProps> = props => {
  const {
    dropMenuItem: { children },
    onTopItem,
    videoInfo,
    onClose,
  } = props;

  const openHelpCenter = useOpenHelpCenter();
  const sysLang = inWindow() && window.systemLang === 'en';
  const layout = children[0]?.layout;

  const menuLabelId = children[0]?.label;
  const item = CONFIG_MAP[menuLabelId!];
  const videoItem = menuLabelId && videoInfo ? videoInfo[menuLabelId as EdmMenuVideoKeys] : undefined;
  const titles = item?.titles || [];
  const link = item?.link;
  const tip = item?.tip;
  const gotoLink = () => {
    openHelpCenter(link);
    // window.open(link, '_blank');
  };

  const renderOtherContent = (menu: ChildrenType[], level: number) => {
    if (layout && level === 1) {
      const menuList: ChildrenType[][] = [];
      layout.forEach((column, index) => {
        menuList[index] = column.map(idx => menu[idx]);
      });
      return (
        <ul className={classnames(styles.titleWrapper, styles.columnList)}>
          {menuList.map(column => {
            if (!Array.isArray(column) || !column.filter(Boolean).length) {
              return null;
            }
            return (
              <div className={styles.columnWrapper}>
                {column.filter(Boolean).map(item => {
                  return (
                    item.show !== false && (
                      <div className={styles.itemWrapper}>
                        <li className={classnames(styles.title, item.onlyChild && styles.linkable)} onClick={() => item.onlyChild && onTopItem(item)}>
                          {item?.icon}
                          {item?.name}
                        </li>
                        <>{!!item?.children?.length && renderOtherContent(item?.children!, level + 1)}</>
                      </div>
                    )
                  );
                })}
              </div>
            );
          })}
        </ul>
      );
    }
    return (
      <ul className={level === 1 ? styles.titleWrapper : styles.subTitleWrapper}>
        {menu?.map(item => {
          return (
            item.show !== false && (
              <div className={styles.itemWrapper}>
                <li className={level === 1 ? styles.title : styles.subTitle} onClick={() => !item.onlyChild && level !== 1 && onTopItem(item)}>
                  {level === 1 ? <>{item?.topMenuIcon}</> : null}
                  {item?.name}
                </li>
                <>{!!item?.children?.length && renderOtherContent(item?.children!, level + 1)}</>
              </div>
            )
          );
        })}
      </ul>
    );
  };

  const renderMenu = () => {
    if (props.dropMenuItem.path === TopMenuPath.wm) {
      let ans: ChildrenType[][] = [];
      ans = chunk(children[0]?.children, 2);
      return renderOtherContent(children[0]?.children!, 1);
    } else {
      return renderOtherContent(children[0]?.children!, 1);
    }
  };

  return (
    <div
      className={classnames(styles.dropMenuBox, styles.isNewVersion, {
        [styles.coopContaienr]: props.dropMenuItem.path === TopMenuPath.coop,
      })}
    >
      {item && (
        <>
          <div className={styles.textBox}>
            {titles.map(t => {
              return <div className={styles.title}>{t}</div>;
            })}
            <div className={styles.tip}>{tip}</div>
            <div className={styles.more} onClick={gotoLink}>
              <span>{getIn18Text('LIAOJIEGENGDUO')}</span>
              <span className={styles.arrow}>
                <IconCard type="tongyong_jiantou_you" />
              </span>
            </div>
            {videoItem && item.videoId && item.videoSource && item.videoScene ? (
              <div className={styles.videoContainer}>
                <VideoBox videoId={item.videoId} source={item.videoSource} scene={item.videoScene} postUrl={videoItem.post} onCardClick={onClose} />
              </div>
            ) : (
              <></>
            )}
          </div>
          <Divider className={styles.divider} type="vertical" />
        </>
      )}
      <div
        className={classnames(styles.container, styles.specialModule, {
          // 不要重复使用styles.some_class
          [styles.coopModule]: props.dropMenuItem.path === TopMenuPath.coop,
          [styles.intelli]: props.dropMenuItem.path === TopMenuPath.intelliMarketing,
          [styles.wmdata]: props.dropMenuItem.path === TopMenuPath.unitable_crm || props.dropMenuItem.path === TopMenuPath.wmData,
          [styles.site]: props.dropMenuItem.path === TopMenuPath.site,
          [styles.enLang]: sysLang,
        })}
      >
        <div className={styles.menuItem}>{renderMenu()}</div>
      </div>
    </div>
  );
};

export default DropMenu;
