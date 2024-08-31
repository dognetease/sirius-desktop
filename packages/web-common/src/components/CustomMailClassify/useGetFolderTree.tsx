import react, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { promiseIsTimeOut } from '@web-mail/util';

const useGetFolderTree = () => {
  const dispatch = useAppDispatch();
  // todo: 确认设置邮件分类是否需要支持 挂载邮箱
  const treeList = useAppSelector(state => state.mailReducer.mailTreeStateMap.main.mailFolderTreeList);
  const isFirst = useRef<boolean>(true);

  useEffect(() => {
    // 只有首次加载
    if (isFirst.current && (!treeList || treeList.length === 0)) {
      isFirst.current = false;

      promiseIsTimeOut(
        dispatch(
          Thunks.refreshFolder({
            noCache: true,
          })
        ),
        'pc_refreshFolder_timeout',
        {
          from: 'useGetFolderTree',
        }
      );
    }
  }, [treeList]);

  return treeList;
};

export default useGetFolderTree;
