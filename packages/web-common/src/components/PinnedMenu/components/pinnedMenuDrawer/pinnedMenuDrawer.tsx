import React, { useState, useEffect } from 'react';
// import SiriusDrawer from '@web-common/components/UI/SiriusDrawer';
import SiriusDrawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import { Tabs } from '@web-common/components/UI/Tabs';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
import styles from './pinnedMenuDrawer.module.scss';
import { apiHolder, apis, EdmMenusApi, getIn18Text } from 'api';
import Item from '../Item/item';
import { IMenu, IMenuTotalItem } from '../../pinnedMenu';
import toast from '@web-common/components/UI/Message/SiriusMessage';

const edmMenuApi = apiHolder.api.requireLogicalApi(apis.edmMenusApiImpl) as unknown as EdmMenusApi;

export interface IManagePinnedMenu {
  menus: IMenu[];
  allMenus: IMenuTotalItem[];
  onUpdateMenu: (menus: IMenu[]) => void;
  visible: boolean;
  onClose: () => void;
  productInfo: {
    productId: string;
    productVersionId: string;
  };
}

export default (props: IManagePinnedMenu) => {
  const { menus, onUpdateMenu, visible, onClose, allMenus = [], productInfo } = props;

  // 更多下来中点击tab
  // const selectTab = (val: string) => {
  // setTimeout(() => {
  //   const activeTabs = document.querySelectorAll('.edmPinnedMenuTabs .ant-tabs-tab-active');
  //   if (activeTabs && activeTabs.length) {
  //     activeTabs.forEach(activeTab => {
  //       activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
  //     });
  //   }
  // }, 100);
  // };

  const allMenusJSX = (
    <Tabs defaultActiveKey={allMenus.length > 0 ? allMenus[0].value : undefined} className="edmPinnedMenuTabs">
      {allMenus.map(each => {
        const { label, value, subItems: children = [] } = each;
        const content = children.map(item => {
          const { label: itemLabel, value: itemValue, subItems: itemChildren = [] } = item;
          // 如果二级菜单没有三级菜单，它的三级菜单是它自己
          if (itemChildren.length === 0) {
            itemChildren.push({
              label: itemLabel,
              value: itemValue,
            });
          }
          return (
            <div className={styles.group}>
              <div className={styles.title} key={itemValue}>
                {itemLabel}
              </div>
              <div className={styles.box}>
                {itemChildren.map(ele => {
                  const { label: eleLabel, value: eleName } = ele;
                  return <Item key={eleName} type="add" id="eleName" label={eleLabel} onAdd={() => addUsefulItem(eleLabel, eleName)} />;
                })}
              </div>
            </div>
          );
        });
        return (
          <Tabs.TabPane tab={label} key={value}>
            {content}
          </Tabs.TabPane>
        );
      })}
    </Tabs>
  );

  const [selectMenus, setSelectMenus] = useState<IMenu[]>([]);
  const initSelectMenus = (menuList: IMenu[]) => {
    setSelectMenus(
      menuList.map(each => {
        return Object.assign({}, each);
      })
    );
  };
  const subUsefulItem = (id: string) => {
    setSelectMenus(pre => {
      return pre.filter(each => each.value !== id);
    });
  };
  const addUsefulItem = (label: string, name: string) => {
    if (selectMenus.length === 6) {
      toast.warn('添加数量已达上限！');
      return;
    }
    if (selectMenus.find(each => each.value === name)) {
      return;
    }
    setSelectMenus(pre => {
      return pre.concat([
        {
          label,
          value: name,
        },
      ]);
    });
  };
  const usefulItemsJSX = selectMenus.map(each => {
    return <Item id={each.value} label={each.label} type="sub" onSub={subUsefulItem} />;
  });

  const [loading, setLoading] = useState(false);
  const updateMenu = () => {
    setLoading(true);
    const usefulMenus = selectMenus.map(each => each.value);
    const query = {
      ...productInfo,
      usefulMenuLabels: usefulMenus,
    };
    // http request
    edmMenuApi
      .updatePinnedMenus(query)
      .then(() => {
        onUpdateMenu(selectMenus);
        onClose();
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    initSelectMenus(menus);
  }, []);

  return (
    <>
      <SiriusDrawer
        closable={false}
        className="edmPinnedMenuDrawer"
        title={getIn18Text('CHANGYONGGONGNENGGUANLI')}
        headerStyle={{
          height: 56,
        }}
        footer={
          <>
            <Button btnType="minorGray" onClick={onClose}>
              {getIn18Text('QUXIAO')}
            </Button>
            <Button onClick={updateMenu} loading={loading} btnType="primary">
              {getIn18Text('QUEDING')}
            </Button>
          </>
        }
        footerStyle={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 24px 0 0',
        }}
        drawerStyle={{
          height: '100%',
          padding: 0,
        }}
        width={485}
        visible={visible}
        onClose={onClose}
      >
        <div className={styles.content}>
          <div className={styles.useful}>
            <div className={styles.tag}>{getIn18Text('CHANGYONGGONGNENG（ZUIDUO')}</div>
            <div className={styles.items}>{usefulItemsJSX}</div>
          </div>
          <div className={styles.all}>{allMenusJSX}</div>
        </div>
      </SiriusDrawer>
    </>
  );
};
