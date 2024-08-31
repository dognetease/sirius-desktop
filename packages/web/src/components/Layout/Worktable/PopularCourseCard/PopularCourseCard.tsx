import { AdvertConfig, api, apiHolder, apis, DataTrackerApi, ResWorkbenchArticleListItem, WorktableApi } from 'api';
import { useOpenHelpCenter } from '@web-common/utils/utils';
import { getTransText } from '@/components/util/translate';
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WorktableCard } from '../card';
import { CourseScrollBanner } from '../components/CourseScrollBanner/CourseScrollBanner';
import { PopularLevel1, PopularLevel2, PopularLevel3, PopularLevel4 } from '../icons/PopularLevelIcons';
import styles from './PopularCourseCard.module.scss';
import { useArticleList } from '../hooks/useArticleList';
import { commonDateUnitFormat } from '@web-common/utils/commonDateUnitFormat';
import classNames from 'classnames';
import { Tooltip } from 'antd';

const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;

const systemApi = apiHolder.api.getSystemApi();
const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const PopularLevelIconMap: Record<string, ReactElement> = {
  '1': <PopularLevel1 />,
  '2': <PopularLevel2 />,
  '3': <PopularLevel3 />,
  '4': <PopularLevel4 />,
};

const PopularCourseListItem = (props: { level: string; title: string; createTime: string; id: number; url: string }) => {
  const [hasClicked, setHasClicked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const openHelpCenter = useOpenHelpCenter();

  const handleTitleClick = useCallback(() => {
    if (props.id) {
      setHasClicked(true);
      trackerApi.track('waimao_worktable_videolink_click');
      // systemApi.openNewWindow(props?.url || '');
      openHelpCenter(props?.url);
    }
  }, [props.id]);

  const titleClassNames = useMemo(() => {
    return hasClicked ? classNames(styles.courseTitle, styles.clicked) : styles.courseTitle;
  }, [hasClicked]);

  return (
    <div className={styles.popularCourseListItem} ref={containerRef}>
      <div className={styles.left}>{props.level && PopularLevelIconMap[props.level]}</div>
      <div className={styles.right}>
        <Tooltip getPopupContainer={() => containerRef.current as HTMLDivElement} placement="top" title={props.title ?? '-'}>
          <div className={titleClassNames} onClick={handleTitleClick}>
            {props.title ?? '-'}
          </div>
        </Tooltip>
        <div className={styles.timeInfo}>
          <span>{props.createTime ?? '-'}</span>
        </div>
      </div>
    </div>
  );
};

export const PopularCourseCard = (props: { active?: boolean }) => {
  const { list: _courseList, fetchList } = useArticleList({
    status: 1,
    typeId: 4,
    pageSize: 4,
    pageNumber: 1,
    tagId: 7,
  });
  const openHelpCenter = useOpenHelpCenter();

  const [courseList, setCourseList] = useState<ResWorkbenchArticleListItem[]>([]);
  const handleMoreBtnClick = () => {
    // 点击查看更多
    trackerApi.track('waimao_worktable_videolink_viewmoreclick');
    openHelpCenter('/c/1639928789888675841.html');
    // systemApi.openNewWindow('https://waimao.163.com/knowledgeCenter#/c/1639928789888675841.html');
  };

  useEffect(() => {
    worktableApi
      .getWorkBenchKnowledgeList()
      .then(res => {
        if (res.knowledge.fameHallList.length <= 4) {
          setCourseList([...res.knowledge.fameHallList].map((i, idx) => ({ ...i, id: idx + 1 })));
        } else {
          setCourseList([...res.knowledge.fameHallList.slice(0, 4)].map((i, idx) => ({ ...i, id: idx + 1 })));
        }
      })
      .catch(err => console.log(err));
  }, []);

  // 视频被点击
  const handleSlideClick = (data: AdvertConfig) => {
    trackerApi.track('waimao_worktable_video_click', {
      advertId: data.id,
    });
  };

  return (
    <WorktableCard
      title={getTransText('REMENKECHENG')}
      titleStyles={{
        fontSize: 16,
      }}
      wrapStyles={{ padding: '20px 18px 0px 18px' }}
    >
      <div className={styles.popularCourseCard}>
        <div className={styles.courseBannerWrapper}>
          <CourseScrollBanner handleSlideClick={handleSlideClick} />
        </div>
        <div className={classNames(styles.popularCourseListWrapper, 'wk-no-drag')}>
          {courseList.length > 0 &&
            courseList.map((item, index) => (
              <PopularCourseListItem key={item.id} id={item.id} level={`${index + 1}`} title={item.title} createTime={item.createTime} url={item.url} />
            ))}
        </div>

        <div className={styles.moreBtn} onClick={handleMoreBtnClick}>
          {getTransText('CHAKANGENGDUO')}
        </div>
      </div>
    </WorktableCard>
  );
};
