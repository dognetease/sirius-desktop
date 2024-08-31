import React, { useEffect, useState, useRef } from 'react';
import { apis, apiHolder as api, NetStorageShareApi, ResponseAnonymousDirList, DataTrackerApi } from 'api';
import { simpleFormatTime } from '../../utils';
import useBreadEllipsisIndex from '../../commonHooks/useBreadEllipsisIndex';
import BreadComp from '../BreadComp';
import { Bread } from '../../disk';
import style from './index.module.scss';
import Empty from './../Empty/empty';
import AnonymousDiskTable from './../DiskTable/anonymous_disk_table';
import { getIn18Text } from 'api';
const shareApi = api.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const trackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const eventApi = api.api.getEventApi();
const pageSize = 30;
interface Props {
  contentWidth: number;
  // preview?: boolean;
  dirId: number;
  shareIdentity: string;
}
const AnonymousShareList: React.FC<Props> = ({
  contentWidth,
  dirId,
  shareIdentity,
  // rootInfo,
}) => {
  const [bread, setBread] = useState<Bread[]>([]);
  const [shareTime, setShareTime] = useState<number>();
  const [currentDirId, setCurrentDirId] = useState(dirId);
  const [listLoading, setListLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [errorCode, setErrorCode] = useState<number>();
  // const [listType, setListType] = useState<'share' | 'normal'>('share'); // 分享首页的列表是分享列表  点击分享首页文件夹进去的列表就是企业空间和个人空间的列表
  const [total, setTotal] = useState(0);
  const [rootInfo, setRootInfo] = useState<ResponseAnonymousDirList>();
  const [role, setRole] = useState('');
  // const [spaceId, setSpaceId] = useState(0);
  // const [forMe, setForMe] = useState(true);
  const breadRef = useRef(null);
  const { ellipsisIndex } = useBreadEllipsisIndex(breadRef, bread, contentWidth);
  const updateBread = (data: Bread) => {
    const tabBread = bread;
    let tempBread = [...tabBread];
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
    setBread(tempBread);
  };
  const getCurrentList = ({ init = false }) => {
    let page = 1;
    if (!init) page = Math.floor(list.length / pageSize) + 1;
    setListLoading(true);
    const dirId1 = currentDirId || dirId;
    shareApi
      .checkAnonymousDirList({
        dirId: dirId1,
        page,
        pageSize,
        shareIdentity,
      })
      .then(data => {
        data.shareTime && setShareTime(Number(data.shareTime));
        setRole(data.role);
        const dirList = data.dirList.map(it => ({
          name: it.dirName,
          id: it.dirId,
          size: it.size,
          extensionType: 'dir',
        }));
        const fileList = data.fileList.map(it => ({
          name: it.fileName,
          id: it.fileId,
          size: it.size,
          extensionType: 'file',
          fileType: it.fileType,
        }));
        if (!init) {
          setList([...list, ...dirList, ...fileList]);
        } else {
          setList([...dirList, ...fileList]);
        }
        // 外部分享 查看文件夹
        trackerApi.track('pc_disk_view', {
          viewWay: 'outerShareView',
          fileType: 'folder',
        });
        setTotal(data.dirTotalCount + data.fileTotalCount);
        setListLoading(false);
        updateBread({
          name: data.currentDirName,
          id: dirId1,
        });
        if (dirId1 == dirId && init) {
          setRootInfo(data);
        }
      })
      .catch(error => {
        error?.data?.code && setErrorCode(error.data.code);
        eventApi.sendSysEvent({
          eventName: 'error',
          eventLevel: 'error',
          eventStrData: '',
          eventData: {
            popupType: 'toast',
            popupLevel: 'info',
            title: error?.data?.message || getIn18Text('CHAKANSHIBAI'),
            code: 'PARAM.ERR',
          },
          eventSeq: 0,
        });
      })
      .finally(() => setListLoading(false));
  };
  const scrollFireLoading = () => {
    // 2.有下一页需要加载  3.不在加载过程中
    if (total > list.length && !listLoading) {
      getCurrentList({ init: false });
    }
  };
  useEffect(() => {
    // setListType('normal');
    setList([]);
    getCurrentList({ init: true });
  }, [currentDirId]);
  const changeDir = item => {
    setCurrentDirId(item.id);
  };
  return (
    <div className={style.content}>
      <div className={style.breadAuthority}>
        <div className={style.bread} ref={breadRef}>
          <BreadComp
            bread={bread}
            ellipsisIndex={ellipsisIndex}
            setCurrentDirId={val => {
              setCurrentDirId(val);
            }}
          />
        </div>
        {shareTime && (
          <div className={style.shareTime}>
            {getIn18Text('FENXIANGSHIJIAN:')}
            {simpleFormatTime(shareTime)}
          </div>
        )}
        {/* { authorityText && <div className={`${style.authority}`}>权限: {authorityText}</div> } */}
      </div>
      {
        // eslint-disable-next-line no-nested-ternary
        !listLoading && !list.length && (
          <Empty
            emptyText={errorCode === 10700 ? getIn18Text('LAIWANYIBU\uFF0C') : errorCode === 10701 ? getIn18Text('FENXIANGDEWENJIAN') : getIn18Text('ZANWUWENJIAN')}
          />
        )
      }
      <AnonymousDiskTable
        list={list}
        sideTab="share"
        scrollFireLoading={scrollFireLoading}
        type="personalShare"
        // spaceId={spaceId}
        listLoading={listLoading}
        changeDir={item => {
          changeDir(item);
        }}
        contentWidth={contentWidth}
        // downloadAction={downloadAction}
        rootInfo={rootInfo}
        shareIdentity={shareIdentity}
        role={role}
      />
    </div>
  );
};
export default AnonymousShareList;
