import { WorkbenchNoticeListItem, api, WorktableApi } from 'api';
import { useEffect, useRef, useState } from 'react';
import { workTableTrackAction } from '../../worktableUtils';

const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;

export function useNoticeListData() {
  const [noticeList, setNoticeList] = useState<WorkbenchNoticeListItem[]>([]);
  const [initLoading, setInitLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const hasMore = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastId = useRef<number | undefined>();

  const fetchNoticeList = async (isMore = false) => {
    isMore ? setMoreLoading(true) : setInitLoading(true);
    if (!isMore) {
      lastId.current = undefined;
      scrollContainerRef.current?.scrollTo(0, 0);
    }
    try {
      const { notifications, leftCount } = await worktableApi.getWorkBenchNoticeList({
        lastId: lastId.current,
        pageSize: 10,
      });
      if (notifications.length > 0) {
        lastId.current = notifications[notifications.length - 1].id; // 更新lastId
        isMore ? setNoticeList([...noticeList, ...notifications]) : setNoticeList([...notifications]);
      } else {
        lastId.current = undefined;
        setNoticeList([]);
      }
      hasMore.current = leftCount > 0; // 判断是否还有未加载的通知
    } catch (error) {}

    isMore ? setMoreLoading(false) : setInitLoading(false);
  };

  const handleClearAll = async () => {
    workTableTrackAction('waimao_worktable_inform', 'clear_all_info');
    setInitLoading(true);
    return worktableApi
      .postWorkBenchNoticeIgnoreAll()
      .then(() => {
        setNoticeList([]);
        hasMore.current = false;
        lastId.current = undefined;
        setMoreLoading(false);
      })
      .finally(() => {
        setInitLoading(false);
      });
  };

  const postIngore = async (id: number) => {
    setInitLoading(true);

    try {
      await worktableApi.ignoreEmail(undefined, id);
      setNoticeList(noticeList.filter(item => item.notifyId !== id));
    } catch (error) {}

    setInitLoading(false);
  };

  useEffect(() => {
    if (noticeList.length < 9 && hasMore.current) {
      fetchNoticeList(true);
    }
  }, [noticeList]);

  return {
    noticeList,
    initLoading,
    moreLoading,
    hasMore,
    scrollContainerRef,
    lastId,
    fetchNoticeList,
    handleClearAll,
    postIngore,
  };
}
