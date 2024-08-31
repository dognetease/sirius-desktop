import { api, apis, GlobalSearchApi, IContomFairCatalog } from 'api';
import { Tabs, Menu } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './searchvaluelist.module.scss';
import classNames from 'classnames';
import { getIn18Text } from 'api';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import Dropdown from '@web-common/components/UI/Dropdown';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { ReactComponent as DropIcon } from '@/images/icons/edm/dropIcon.svg';
interface SearchValueListProps<VT = string[]> {
  // value?: VT;
  onChange?(value: VT): void;
  onChangeRootKey?(key: string): void;
  catalogs?: IContomFairCatalog[];
  changeCataLogSort?: (index: number, key: string) => void;
  rootKey: string;
}

const SearchValueList: React.FC<SearchValueListProps> = ({
  // value = [],
  onChange,
  onChangeRootKey,
  catalogs = [],
  changeCataLogSort,
  rootKey,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const handleMenuClick = (key: string) => {
    const parentCatalog = catalogs.find(e => e.key === key);
    if (parentCatalog && onChange && parentCatalog.searchKeys) {
      changeCataLogSort &&
        changeCataLogSort(
          catalogs.findIndex(e => e.key === key),
          key
        );
      onChange(parentCatalog.searchKeys);
    } else {
      onChange?.([]);
    }
  };
  const DropdownIcon = useCallback(() => {
    const menu = (
      <>
        <Menu>
          {catalogs.length > 10 &&
            catalogs.slice(10).map(item => {
              return (
                <Menu.Item
                  onClick={() => {
                    handleMenuClick(item.key);
                  }}
                >
                  {item.value}
                </Menu.Item>
              );
            })}
        </Menu>
      </>
    );
    return (
      <div className={styles.tabDrop} ref={ref}>
        <Dropdown.Button
          overlay={menu}
          // trigger={['click']}
          icon={<DropIcon />}
          getPopupContainer={trriger => ref.current || trriger}
        >
          {}
        </Dropdown.Button>
      </div>
    );
  }, [catalogs, handleMenuClick]);
  return (
    <div className={styles.container}>
      <Tabs
        type="card"
        activeKey={rootKey}
        tabBarExtraContent={DropdownIcon()}
        onChange={(activeKey: string) => {
          const parentCatalog = catalogs.find(e => e.key === activeKey);
          onChangeRootKey?.(activeKey);
          if (parentCatalog && onChange && parentCatalog.searchKeys) {
            onChange(parentCatalog.searchKeys);
          } else {
            onChange?.([]);
          }
        }}
      >
        <Tabs.TabPane tab={getIn18Text('QUANBU')} tabKey={'all'} key={'all'} />
        {catalogs.length >= 10 && catalogs.slice(0, 10).map(e => <Tabs.TabPane key={e.key} tabKey={e.key} tab={e.value} />)}
      </Tabs>
    </div>
  );
};

export const SearchValueItemList: React.FC<{
  catalogs?: IContomFairCatalog[];
  onChange?(value: string[]): void;
  rootKey?: string;
}> = ({ catalogs = [], rootKey = '', onChange }) => {
  const [selected, setSelected] = useState<string>('');
  const currentCatalog = useMemo<IContomFairCatalog[] | undefined>(() => {
    const res = rootKey !== 'all' ? catalogs.find(e => e.key === rootKey) : undefined;
    return res?.children;
  }, [catalogs, rootKey]);
  useEffect(() => {
    setSelected('');
  }, [rootKey]);

  if (!currentCatalog || currentCatalog.length === 0) {
    return null;
  }
  return (
    <div className={styles.catalogListWrapper}>
      <span className={styles.catalogLabel} style={{ color: '#545A6E', fontWeight: 'normal' }}>
        {getIn18Text('CHANPIN')}
      </span>
      <div className={styles.catalogList}>
        {currentCatalog.map(e => (
          <div
            onClick={() => {
              if (e.searchKeys && onChange) {
                onChange(e.searchKeys);
              }
              setSelected(e.key);
            }}
            className={classNames(styles.catalogItem, {
              [styles.catalogItemSelected]: selected === e.key,
            })}
          >
            {e.value}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchValueList;
