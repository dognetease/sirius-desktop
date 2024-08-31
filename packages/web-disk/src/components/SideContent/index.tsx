import React, { useState, useImperativeHandle } from 'react';
import { Spin } from 'antd';
import classnames from 'classnames';
import { apiHolder as api, inWindow, NSDirContent, util, ProductAuthorityFeature } from 'api';
import debounce from 'lodash/debounce';
import { useAppSelector } from '@web-common/state/createStore';
import DiskTree from './../DiskTree/diskTree';
import { formatFileSize } from '@web-common/utils/file';
import NetWatcher from '@web-common/components/UI/NetWatcher';
import { comIsShowByAuth } from '@web-common/utils/utils';

import SearchModel from '../Search';
import style from './index.module.scss';
import { getIn18Text } from 'api';
const eventApi = api.api.getEventApi();
interface Props {
  setSideTab: (val) => void;
  downloadAction: (item, spaceId) => void;
}
interface DiskSizeInfoProps {
  diskInfo?: NSDirContent;
  diskName: string;
}
const DiskSizeInfo: React.FC<DiskSizeInfoProps> = ({ diskInfo, diskName }) => {
  if (!diskInfo) {
    return null;
  }
  // 超过100%不可溢出
  const percent = Math.min(100, (diskInfo.totalSize * 100) / diskInfo.sizeLimit);
  return (
    <div className={style.volumeWrapper}>
      <div className={style.volume}>
        <span className={style.type}>{diskName}</span>
        <span className={style.desc}>
          {formatFileSize(diskInfo.totalSize, 1024)}/{formatFileSize(diskInfo.sizeLimit, 1024)}
        </span>
      </div>
      <div className={classnames(style.percent, { [style.warn]: percent > 90 })}>
        <div className={style.percentDesc} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};
const command = inWindow() ? util.getCommonTxt(' ') : '';
const SideContent = ({ setSideTab, downloadAction }: Props, ref) => {
  const curSideTab = useAppSelector(state => state.diskReducer.curSideTab);
  const curRootInfo = useAppSelector(state => state.diskReducer.curRootInfo);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [spinning, setSpinning] = useState<boolean>(false);
  const openSearch = () => {
    setSearchModalVisible(true);
  };
  const closeSearch = () => {
    setSearchModalVisible(false);
  };
  const refresh = debounce(() => {
    setSpinning(true);
    eventApi.sendSysEvent({
      eventName: 'diskInnerCtc',
      eventStrData: '',
      eventData: {
        name: 'refresh',
        cb: () => {
          setSpinning(false);
        },
      },
    });
  }, 200);
  useImperativeHandle(ref, () => ({
    openSearch: () => {
      openSearch();
    },
  }));
  return (
    <>
      <NetWatcher />
      <div className={`${style.container} sidecontent-container`}>
        {/* 搜索区域 */}
        <div className={`${style.searchContainer} searchContainer`}>
          <button type="button" className={classnames(style.searchButton, 'search-button', 'sirius-no-drag')} data-test-id="disk_search_btn" onClick={openSearch}>
            <i className={`dark-invert searchIcon ${style.searchIcon}`} />
            <span>{getIn18Text('SOUSUOKONGJIAN')}</span>
            <span className={style.searchTips}>{command + 'F'}</span>
          </button>
          {/* 刷新按钮 */}
          <div className={`${style.uRefresh} u-refresh sirius-no-drag ${spinning ? 'sirius-spin' : ''}`} data-test-id="disk_refresh_btn" onClick={refresh} />
        </div>

        {/* 目录区域 */}
        <div className={style.treeContainer + ' sirius-scroll'}>
          <DiskTree setSideTab={setSideTab} downloadAction={downloadAction} />
        </div>

        {/* 空间使用状况 */}
        <div className={style.spaceUsage}>
          <DiskSizeInfo diskInfo={curRootInfo?.public} diskName={getIn18Text('QIYEKONGJIAN')} />
          <DiskSizeInfo diskInfo={curRootInfo?.private} diskName={getIn18Text('GERENKONGJIAN')} />
          {comIsShowByAuth(
            ProductAuthorityFeature.ORG_SETTING_BIG_ATTACH_SHOW,
            <DiskSizeInfo diskInfo={curRootInfo?.cloudAtt} diskName={getIn18Text('YOUJIANYUNFUJIAN')} />
          )}
        </div>
      </div>

      {/* 搜索空间弹窗 */}
      <SearchModel isModalVisible={searchModalVisible} closeModal={closeSearch} />
    </>
  );
};
export default React.forwardRef(SideContent);
