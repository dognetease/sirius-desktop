import React, { ReactElement, useCallback, useState, useContext } from 'react';
import styles from './viewTab.module.scss';
import { Tabs, Menu, Dropdown, Tooltip } from 'antd';
import { ReactComponent as QuickAccess } from '@web-common/images/icons/viewtab.svg';
import { ReactComponent as Closetab } from '@web-common/images/icons/closetab.svg';
import { ReactComponent as ViewtabDropdown } from '@web-common/images/icons/viewtabDropdown.svg';
import classnames from 'classnames';
import TabMemuClose from '@web-common/components/UI/Icons/svgs/mail/TabMemuClose';
import { navigate } from '@reach/router';
import { nanoid } from '../utils/nanoId';
import classNames from 'classnames';
import { defaultTabList, useTabContext } from './viewtabContext';
import { getIn18Text } from 'api';

export interface TabItemProps {
  id?: string;
  path: string;
  title: string;
  isActive: boolean;
  isCached: boolean;
  onTabDbClick?: (e: any, id: any) => void;
  component?: ReactElement | null;
}

const ViewTab: React.FC<any> = props => {
  let { tabList, setTablist } = props;
  // let  [tabList, setTablist] =  useTabContext()

  const [dropdownVisible, setDropdownVisible] = useState(false);

  const closeAll = useCallback(async () => {
    setTablist(defaultTabList);
    navigate(defaultTabList[0].path);
  }, []);

  const MenuItem = ({ item, idx }: { item: TabItemProps; idx: number }) => (
    <Menu.Item
      key={item.id}
      className={classnames(styles.tabMenuItem)}
      onClick={e => {
        onSwitch(e, item, idx);
      }}
    >
      <span>{item.title}</span>
      <span
        onClick={e => {
          onClose(item, idx);
        }}
        className={styles.tabMenuItemCloseIcon}
      >
        <TabMemuClose />
      </span>
    </Menu.Item>
  );

  const onClose = (item: TabItemProps, idx: number = 3) => {
    if (tabList.length > 2) {
      let tablistNew = [...tabList.slice(0, idx), ...tabList.slice(idx + 1)];

      setTablist(tablistNew);

      navigate(tabList[idx - 1].path);
    } else {
      setTablist([tabList[0]]);

      navigate(tabList[0].path);
    }
  };

  // 切换页签
  const onSwitch = useCallback(
    (e, item: TabItemProps, idx) => {
      let tabListNew = tabList.map(e => ({ ...e, isActive: false }));
      tabListNew[idx].isActive = true;

      setTablist(tabListNew);
      navigate(item.path);
    },
    [tabList]
  );

  const DropDown = () => (
    <Dropdown
      overlay={
        <Menu className={styles.tabMenu} hidden={!dropdownVisible}>
          {
            <Menu.Item
              key={'closeAll'}
              hidden={tabList?.length <= 1}
              className={classnames(styles.tabMenuItem, styles.tabMenuItemDivider)}
              onClick={() => {
                closeAll();
              }}
            >
              <span className={styles.tabMenuItemCloseTxtRed}>{getIn18Text('GUANBIQUANBU')}</span>
            </Menu.Item>
          }
          <div className={styles.tabMenuScrollWrap}>
            {tabList.map((e, index) => {
              return (
                <Menu.Item
                  key={e.id}
                  hidden={tabList?.length <= 1}
                  className={classnames(styles.tabMenuItem)}
                  onClick={ev => {
                    onSwitch(ev, e, index);
                  }}
                >
                  <span>{e.title}</span>
                  <span
                    onClick={() => {
                      onClose(e, index);
                    }}
                    className={styles.tabMenuItemCloseIcon}
                  >
                    <TabMemuClose />
                  </span>
                </Menu.Item>
              );
            })}
            {/*
            {tabList.map((item:TabItemProps, idx:number) => {
              return <MenuItem item={item} idx={idx} />;
              return (<Menu.Item key={item.id}  className={classnames(styles.tabMenuItem)} onClick={e => {
                onSwitch(e, item, idx);
              }}>
                <span>
                  {item.title}
                </span>
                <span
                  onClick={e => {
                    onClose(item, idx);
                  }}
                  className={styles.tabMenuItemCloseIcon}
                >
                  <TabMemuClose />
                </span>
              </Menu.Item>)
            })} */}
          </div>
        </Menu>
      }
      overlayClassName={styles.tabDropdownContainer}
      onVisibleChange={visible => setDropdownVisible(visible)}
      trigger={['click']}
      placement="bottomCenter"
    >
      {/* <DropdownButton dropdownVisible={dropdownVisible} isFloat={isDropdownButtonFloat} displayChange={handleDropdownDisplayChange} /> */}
      <ViewtabDropdown className={styles.dropdownButton} />
    </Dropdown>
  );

  let addTab = () => {
    setTablist([
      ...tabList,
      {
        id: nanoid(),
        path: '#coop?page=disk',
        title: '云文档',
        isActive: false,
        isCached: false,
      },
    ]);
  };

  let closeTab = () => {
    setTablist(defaultTabList);
  };

  return (
    <div
      style={{
        display: 'none',
      }}
      className={styles.tabContainer}
    >
      <QuickAccess className={styles.tabStartPin} />
      <div className={styles.tabNav}>
        {tabList.map((el, idx) => {
          return (
            <div
              className={classNames({
                [styles.tabitem]: true,
                [styles.tabitemActive]: el.isActive,
              })}
            >
              <span
                onClick={e => {
                  onSwitch(e, el, idx);
                }}
              >
                {el.title}
              </span>
              <div
                className={styles.closetab}
                onClick={e => {
                  onClose(el, idx);
                }}
              >
                <Closetab />
              </div>
            </div>
          );
        })}
      </div>
      {<DropDown setTablist={setTablist} />}
    </div>
  );
};

export { ViewTab };
