import React, { useEffect, useState, useRef, useCallback, useImperativeHandle } from 'react';
import { Dropdown, Menu } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classNames from 'classnames';
import { apis, apiHolder as api, NetStorageApi, NetStorageShareApi, ResourceType, PerformanceApi } from 'api';
import debounce from 'lodash/debounce';
import { ArgsProps } from 'antd/lib/message';
import DiskTable from '../DiskTable';
import Empty from './../Empty/empty';
import useBreadEllipsisIndex from '../../commonHooks/useBreadEllipsisIndex';
import BreadComp from '../BreadComp';
import IconCard from '@web-common/components/UI/IconCard/index';
import { Bread, RootInfo } from '../../disk';
import style from './shareWithMe.module.scss';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import { DiskActions, useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const shareApi = api.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const performanceApi = api.api.requireLogicalApi(apis.performanceImpl) as unknown as PerformanceApi;
const pageSize = 30;
interface Props {
  contentWidth: number;
  downloadAction: (item, spaceId) => void;
  rootInfo: RootInfo;
  onFetchFolderInfo?: (detail) => void;
}
const DropdownShare: React.FC<{
  forMe: boolean;
  dropChangeAction: (val: boolean) => void;
}> = ({ forMe, dropChangeAction }) => {
  const [dropdownVis, setDropdownVis] = useState(false); // 选项是否展开
  const clickDrop = val => {
    setDropdownVis(false); // 收起
    dropChangeAction(val);
  };
  const menu = (
    <Menu className={style.dropMenu}>
      <Menu.Item key="iShare" data-test-id="disk_share_page_ishare_btn" className={classNames(forMe || style.action)} onClick={() => clickDrop(false)}>
        {getIn18Text('WOFENXIANGDE')}
      </Menu.Item>
      <Menu.Item key="shareToMe" data-test-id="disk_share_page_share_me_btn" className={classNames(forMe && style.action)} onClick={() => clickDrop(true)}>
        {getIn18Text('FENXIANGGEIWODE')}
      </Menu.Item>
    </Menu>
  );
  return (
    <Dropdown overlay={menu} arrow={false} onVisibleChange={val => setDropdownVis(val)}>
      <span className={style.title} data-test-id="disk_share_page_share_btn">
        <span className={style.text}>{forMe ? getIn18Text('FENXIANGGEIWODE') : getIn18Text('WOFENXIANGDE')}</span>
        {dropdownVis ? <IconCard type="upTriangle" /> : <IconCard type="downTriangle" />}
      </span>
    </Dropdown>
  );
};
// 与我分享
const ShareWithMe = React.forwardRef((props: Props, ref) => {
  const { contentWidth, downloadAction, rootInfo, onFetchFolderInfo = () => {} } = props;
  const curDirId = useAppSelector(state => state.diskReducer.curDirId);
  const [bread, setBread] = useState<Bread[]>([]); // 面包屑
  const [listLoading, setListLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [spaceId, setSpaceId] = useState(0);
  const [forMe, setForMe] = useState(true); // true 分享给我 false 我分享的
  const breadRef = useRef(null);
  const { ellipsisIndex } = useBreadEllipsisIndex(breadRef, bread, contentWidth);
  const [logMark, setLogMark] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  // 与我分享 我分享的
  const getShareHomeList = async ({ init = false }) => {
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
      setSpinning(false);
      setTotal(_total);
      if (!init) {
        setList([...list, ...formatlist]);
      } else {
        setList(formatlist);
      }
      setLogMark(true);
    } catch (error) {
      message.error({ content: error?.message || getIn18Text('HUOQUSHIBAI') });
      setListLoading(false);
    }
  };
  // 文件夹
  const getCurrentList = async ({ init }: { init?: boolean }) => {
    let page = 0;
    if (!init) page = Math.floor(list.length / pageSize) + 1;
    setListLoading(true);
    try {
      const data = await diskApi.doListNSContent({
        type: 'personalShare',
        dirId: curDirId,
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
      setListLoading(false);
      setSpinning(false);
    } catch (error) {
      message.error({ content: error?.message || getIn18Text('HUOQUSHIBAI') });
      setSpinning(false);
    }
  };
  // 收藏/取消收藏
  const collectAction = async (params: { id: number; collect: boolean; type: 'folder' | 'file' }) => {
    // 收藏请求
    const collectReq = async (resourceId: number, resourceType: ResourceType, collect: boolean) => {
      try {
        const method = collect ? 'addFavorite' : 'removeFavorite';
        const res = await diskApi[method]({ resourceId, resourceType });
        if (res === true) {
          message.success({
            content: collect ? getIn18Text('YISHOUCANG') : getIn18Text('QUXIAOSHOUCANG'),
          } as ArgsProps);
        }
        return res === true;
      } catch (error) {
        message.error(
          (
            error as {
              message: string;
            }
          ).message || (collect ? getIn18Text('SHOUCANGSHIBAI') : getIn18Text('QUXIAOSHOUCANGSHI'))
        );
        return false;
      }
    };
    const { id, collect, type } = params;
    setList(
      list.map(item => {
        if (item.id === id) return { ...item, starred: collect };
        return item;
      })
    );
    const reqRes = await collectReq(id, type === 'folder' ? 'DIRECTORY' : 'FILE', collect);
    // 失败撤回
    if (!reqRes) {
      setList(
        list.map(item => {
          if (item.id === id) return { ...item, starred: !collect };
          return item;
        })
      );
    }
  };
  const updateBread = () => {
    // 加上根目录
    let tempBread = [...(bread.length ? bread : [{ id: 0, name: forMe ? getIn18Text('FENXIANGGEIWODE') : getIn18Text('WOFENXIANGDE') }])];
    diskApi.doGetNSFolderInfo({ type: 'personalShare', dirId: curDirId, spaceId }).then(data => {
      if (tempBread.length > 0) {
        // 已经有面包屑
        const indexBread = tempBread.findIndex(item => item.id === curDirId);
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
      setBread([...tempBread]);
    });
  };
  const scrollFireLoading = () => {
    // 2.有下一页需要加载  3.不在加载过程中
    if (total > list.length && !listLoading) {
      if (curDirId === 0) {
        getShareHomeList({ init: false });
        return;
      }
      getCurrentList({});
    }
  };
  // 点击列表文件夹
  const changeDir = item => {
    dispatch(DiskActions.setCurDirId(item.id));
    if (item.spaceId) {
      setSpaceId(item.spaceId);
    }
  };
  const afterDelete = recordId => {
    const listTemp = list.filter(item => item.recordId !== recordId);
    setList(listTemp);
  };
  const refresh = async () => {
    setList([]);
    if (curDirId === 0) {
      await getShareHomeList({ init: true });
      return;
    }
    await getCurrentList({ init: true });
  };
  const switchAction = useCallback(
    debounce(() => {
      setList([]);
      // 切换 与我分享/我分享的
      if (curDirId === 0) {
        setBread([]);
        getShareHomeList({ init: true });
        return;
      }
      // 切换文件夹
      updateBread();
      getCurrentList({ init: true });
    }),
    [curDirId, forMe]
  );
  useEffect(() => {
    if (logMark) {
      console.log('performanceApi', `disk_load_share_end`);
      performanceApi.timeEnd({
        statKey: `disk_share_load_time`,
      });
    }
  }, [logMark]);
  // 刚进来 和 切换文件夹
  useEffect(() => {
    switchAction();
  }, [curDirId, forMe]);
  const dropChangeAction = (val: boolean) => {
    dispatch(DiskActions.setCurDirId(0));
    setForMe(val);
  };
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
  useImperativeHandle(
    ref,
    () => ({
      outIn: () => {
        setBread([]);
      },
    }),
    []
  );
  return (
    <div className={style.shareWithMe}>
      <div className={style.contentHead}>
        {/* 分享给我的/我分享的 */}
        {bread.length === 0 && <DropdownShare forMe={forMe} dropChangeAction={dropChangeAction} />}
        {/* 文件夹导航 */}
        <div className={style.bread} ref={breadRef}>
          <BreadComp
            bread={bread}
            ellipsisIndex={ellipsisIndex}
            setCurrentDirId={val => {
              dispatch(DiskActions.setCurDirId(val));
            }}
          />
        </div>
      </div>
      <div className={style.restBody}>
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
          collectAble
          collectAction={collectAction}
        />
      </div>
    </div>
  );
});
export default ShareWithMe;
