import DownOutlined from '@ant-design/icons/DownOutlined';
import { Dropdown, Menu, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { apiHolder } from 'api';
import style from './AttachmentTotalDownloadEntry.module.scss';
import classnames from 'classnames/bind';
import { ReactComponent as ArrowRightIcon } from '@/images/icons/arrow-down-1.svg';
import { MenuClickEventHandler } from 'rc-menu/lib/interface';
import { setCurrentAccount } from '../../../util';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
const storeApi = apiHolder.api.getDataStoreApi();
const ArrowUp = () => {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.375 5.1875L5 0.8125L0.625 5.1875" stroke="#386EE7" stroke-width="1.05" stroke-linejoin="round" />
    </svg>
  );
};
const ArrowDown = () => {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.625 0.8125L5 5.1875L9.375 0.8125" stroke="#386EE7" stroke-width="1.05" stroke-linejoin="round" />
    </svg>
  );
};
// 附件全量下载入口
export const AttachmentDownloadAction = (props: { downloadAction: (type: string) => void }) => {
  const { downloadAction } = props;
  const [menuVisible, setMenuVisible] = useState(false);
  const [defaultDownloadType, setDefaultDownloadType] = useState('zip');
  const getDefaultDownloadType = async () => {
    // setCurrentAccount();
    const { data, suc } = await storeApi.get('mailDefaultAttachDownloadType');
    suc && setDefaultDownloadType(data as string);
  };
  useEffect(() => {
    getDefaultDownloadType();
  }, []);
  const changeDownloadType: MenuClickEventHandler = e => {
    downloadAction(e.key);
    // 设置当前key
    setDefaultDownloadType(e.key);
    // 缓存下载方式
    // setCurrentAccount();
    storeApi.put('mailDefaultAttachDownloadType', e.key);
    // 关闭menu
    setMenuVisible(false);
  };
  const downloadByDefault = () => {
    downloadAction(defaultDownloadType);
  };
  return (
    <div className={realStyle('totalDownloadWrapper')}>
      <span onClick={downloadByDefault} className={realStyle('defaultDownloadLink')}>
        {defaultDownloadType === 'zip' ? getIn18Text('DABAOXIAZAI') : getIn18Text('FENBIEXIAZAI')}
      </span>
      <Dropdown
        overlay={
          <div className={realStyle('menuWrapper')}>
            <Menu onClick={changeDownloadType}>
              <Menu.Item key="zip">
                <span className={realStyle('menuItem')}>{getIn18Text('DABAOXIAZAI')}</span>
              </Menu.Item>
              <Menu.Item key="separate">
                <span className={realStyle('menuItem')}>{getIn18Text('FENBIEXIAZAI')}</span>
              </Menu.Item>
            </Menu>
          </div>
        }
        visible={menuVisible}
        onVisibleChange={e => {
          setMenuVisible(e);
        }}
        trigger={['click']}
        placement="bottomRight"
      >
        <a onClick={e => e.preventDefault()} className={realStyle('menuIcon')}>
          {menuVisible ? <ArrowUp /> : <ArrowDown />}
        </a>
      </Dropdown>
    </div>
  );
};
