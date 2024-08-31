import React, { useEffect, useState, useRef, useImperativeHandle } from 'react';
import { Spin, Dropdown, Menu } from 'antd';
import classNames from 'classnames';
import { apis, apiHolder as api, NetStorageApi, NetStorageShareApi, DataTrackerApi } from 'api';
import DiskTable from '../DiskTable';
import Delete from '../Delete';
import Empty from './../Empty/empty';
import useBreadEllipsisIndex from '../../commonHooks/useBreadEllipsisIndex';
import BreadComp from '../BreadComp';
import IconCard from '@web-common/components/UI/IconCard/index';
import { Bread, DiskTab, RootInfo } from '../../disk';
import style from './index.module.scss';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { getIn18Text } from 'api';
const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const shareApi = api.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const trackerApi = api.api.requireLogicalApi('dataTrackerApiImp') as DataTrackerApi;
const pageSize = 30;
interface Props {
  // eslint-disable-next-line react/no-unused-prop-types
  ref?: any;
  contentWidth: number;
  preview?: boolean;
  previewId?: number;
  previewSpaceId?: number;
  sideTab: DiskTab;
  downloadAction: (item, spaceId) => void;
  rootInfo: RootInfo;
  onFetchFolderInfo?: (detail) => void;
}
const DropdownShare: React.FC<{
  setCurrentDirId: (val) => void;
  getShareHomeList: (val) => void;
  setBread: (val) => void;
  setForMe: (val) => void;
  forMe: boolean;
  bread: Bread[];
}> = ({ setCurrentDirId, getShareHomeList, setBread, setForMe, forMe, bread }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  useEffect(() => {
    setCurrentDirId(0);
    getShareHomeList(true);
    setBread([]);
  }, [forMe]);
  const clickDrop = forme => {
    setForMe(forme);
    setDropdownVisible(false);
    if (forme === forMe) {
      setCurrentDirId(0);
      getShareHomeList(true);
      setBread([]);
    }
  };
  const menu = (
    <Menu className={style.dropMenu}>
      <Menu.Item
        className={classNames(forMe || style.action)}
        onClick={() => {
          clickDrop(false);
        }}
      >
        {getIn18Text('WOFENXIANGDE')}
      </Menu.Item>
      <Menu.Item
        className={classNames(forMe && style.action)}
        onClick={() => {
          clickDrop(true);
        }}
      >
        {getIn18Text('FENXIANGGEIWODE')}
      </Menu.Item>
    </Menu>
  );
  return bread.length ? (
    <div
      className={style.singleBreadItem}
      onClick={() => {
        clickDrop(forMe);
      }}
    >
      <span>{forMe ? getIn18Text('FENXIANGGEIWODE') : getIn18Text('WOFENXIANGDE')}</span>
      <IconCard type="arrowRight" />
    </div>
  ) : (
    <Dropdown
      overlay={menu}
      arrow={false}
      onVisibleChange={val => {
        setDropdownVisible(val);
      }}
    >
      <span className={style.title}>
        <span className={style.text}>{forMe ? getIn18Text('FENXIANGGEIWODE') : getIn18Text('WOFENXIANGDE')}</span>
        {dropdownVisible ? <IconCard type="upTriangle" /> : <IconCard type="downTriangle" />}
      </span>
    </Dropdown>
  );
};
// 与我分享 + 内部分享 使用
const ShareList = React.forwardRef((props: Props, ref) => {
  const { contentWidth, preview, downloadAction, previewId = 0, previewSpaceId = 0, sideTab, rootInfo, onFetchFolderInfo = () => {} } = props;
  const [bread, setBread] = useState<Bread[]>([]);
  const [currentDirId, setCurrentDirId] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [listType, setListType] = useState<'share' | 'normal'>('share'); // 分享首页的列表是分享列表  点击分享首页文件夹进去的列表就是企业空间和个人空间的列表
  const [total, setTotal] = useState(0);
  const [spaceId, setSpaceId] = useState(0);
  const [forMe, setForMe] = useState(true);
  const breadRef = useRef(null);
  const { ellipsisIndex } = useBreadEllipsisIndex(breadRef, bread, contentWidth);
  const getShareHomeList = async init => {
    let page = 1;
    if (!init) page = Math.floor(list.length / pageSize) + 1;
    setListLoading(true);
    try {
      const res = await shareApi.listNSShare({ page, pageSize, forMe });
      const { data, total: _total } = res;
      const formatlist = data.map(item => ({
        ...item,
        name: item.resourceName,
        size: item.resourceSize,
        createUserNickName: item.creatorName,
        parentId: item.resourceParentId,
        id: item.resourceId,
        authorityDetail: { roleInfos: item.roles },
        shareItem: true,
        source: 'share',
      }));
      setListLoading(false);
      setTotal(_total);
      setList(formatlist);
    } catch (_) {
      setListLoading(false);
    }
  };
  const updateBread = () => {
    const tabBread = bread;
    let tempBread = [...tabBread];
    diskApi.doGetNSFolderInfo({ type: 'personalShare', dirId: currentDirId, spaceId }).then(data => {
      if (tempBread.length > 0) {
        // 已经有面包屑
        const indexBread = tempBread.findIndex(item => item.id === currentDirId);
        if (indexBread === -1) {
          // r如果当前面包屑里面不包含现在的内容，就将现在的内容添加到最后，成为最后的面包屑
          tempBread.push(data);
        } else {
          // 如果当前的面包屑里面 有现在的内容，截取现在内容的前面部分作为新面包屑
          tempBread = tempBread.slice(0, indexBread + 1);
        }
      } else {
        // 没有面包屑直接添加上
        tempBread.push(data);
      }
      if (tempBread.length === 1) {
        onFetchFolderInfo({ name: tempBread[0].name, fileType: 'folder', extensionType: 'dir' });
      }
      setBread(tempBread);
    });
  };
  const getCurrentList = async ({ init }: { init?: boolean }) => {
    let page = 0;
    if (!init) page = Math.floor(list.length / pageSize) + 1;
    setListLoading(true);
    try {
      const data = await diskApi.doListNSContent({
        type: 'personalShare',
        dirId: currentDirId,
        page,
        pageSize,
        spaceId,
        needAuthorityInfo: true,
        isDesc: true,
      });
      // 接口getDirAndFileList 返回角色权限是通过 authorityDetail.roleInfos获取
      // 接口listShared 返回的角色权限是 roles获取
      // 他俩的 sideTab 都为share，所以临时加上roles的容错
      const dirAndFileList = [...data.dirList, ...data.fileList].map(item => ({
        ...item,
        roles: item.authorityDetail.roleInfos,
      }));
      if (!init) {
        setList([...list, ...dirAndFileList]);
      } else {
        setList(dirAndFileList);
      }
      // 内部分享 查看文件夹
      if (preview) {
        trackerApi.track('pc_disk_view', {
          viewWay: 'innerShareView',
          fileType: 'folder',
        });
      }
      setListLoading(false);
      setSpinning(false);
    } catch (_) {
      setSpinning(false);
    }
  };
  const scrollFireLoading = () => {
    // 2.有下一页需要加载  3.不在加载过程中
    if (total > list.length && !listLoading) {
      if (listType === 'share') {
        getShareHomeList(false);
        return;
      }
      getCurrentList({});
    }
  };
  const changeDir = item => {
    setCurrentDirId(item.id);
    if (item.spaceId) {
      setSpaceId(item.spaceId);
    }
  };
  const afterDelete = recordId => {
    const listTemp = list.filter(item => item.recordId !== recordId);
    setList(listTemp);
  };
  const refresh = async () => {
    if (listType === 'share') {
      await getShareHomeList(true);
      return;
    }
    await getCurrentList({ init: true });
  };
  useEffect(() => {
    if (preview) {
      setSpaceId(previewSpaceId);
      setCurrentDirId(previewId);
    }
  }, []);
  useEffect(() => {
    if (!currentDirId) {
      setListType('share');
      return;
    }
    setListType('normal');
    updateBread();
    getCurrentList({ init: true });
  }, [currentDirId]);
  useEffect(() => {
    setListType('share');
  }, [forMe]);
  useMsgRenderCallback('diskInnerCtc', async data => {
    const { eventData } = data;
    const { name, cb } = eventData;
    // 刷新
    if (name === 'refresh') {
      try {
        await refresh();
        cb();
      } catch (_) {
        cb();
      }
    }
  });
  return (
    <div className={style.content}>
      <Spin spinning={spinning}>
        <div className={style.breadAuthority}>
          {preview ? null : (
            // 分享给我的/我分享的
            <DropdownShare setCurrentDirId={setCurrentDirId} getShareHomeList={getShareHomeList} setBread={setBread} setForMe={setForMe} forMe={forMe} bread={bread} />
          )}
          {/* 文件夹导航 */}
          <div className={style.bread} ref={breadRef}>
            <BreadComp
              bread={bread}
              ellipsisIndex={ellipsisIndex}
              setCurrentDirId={val => {
                setCurrentDirId(val);
              }}
            />
          </div>
          {/* { authorityText && <div className={`${style.authority}`}>权限: {authorityText}</div> } */}
        </div>
        {/* 暂无文件 */}
        {!listLoading && !list.length && <Empty />}
        <DiskTable
          list={list}
          sideTab="share"
          scrollFireLoading={scrollFireLoading}
          type="personalShare"
          spaceId={spaceId}
          listLoading={listLoading}
          changeDir={item => {
            changeDir(item);
          }}
          contentWidth={contentWidth}
          downloadAction={downloadAction}
          delParams={{ forMe }}
          rootInfo={rootInfo}
          afterDel={afterDelete}
        />
      </Spin>
    </div>
  );
});
export default ShareList;
