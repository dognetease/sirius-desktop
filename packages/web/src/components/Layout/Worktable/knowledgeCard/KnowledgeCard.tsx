import { api, ResWorkbenchKnwoledgeListItem, WorktableApi } from 'api';
import { Tabs, Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useOpenHelpCenter } from '@web-common/utils/utils';
import { WorktableCard } from '../card';
import styles from './knowledgeCard.module.scss';
import { getTransText } from '@/components/util/translate';
import { workTableTrackAction } from '../worktableUtils';

const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;
// const systemApi = apiHolder.api.getSystemApi() as SystemApi;

const KnowledgeCardTabTypes = {
  wmInfo: '1',
  helpInfo: '2',
};

const NoDataIcon = () => {
  return (
    <svg width="50" height="34" viewBox="0 0 50 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="25" cy="27.5" rx="25" ry="6.5" fill="#F6F6F7" />
      <path
        d="M35.019 1.36595L43.5 11.186V26C43.5 27.3807 42.3807 28.5 41 28.5H9C7.61929 28.5 6.5 27.3807 6.5 26V11.186L14.981 1.36595C15.4559 0.816077 16.1465 0.5 16.873 0.5H33.127C33.8535 0.5 34.5441 0.816077 35.019 1.36595Z"
        stroke="#262A33"
        stroke-opacity="0.16"
      />
      <path
        d="M6.5 11.5H15.5C16.3284 11.5 17 12.1716 17 13V14C17 15.3807 18.1193 16.5 19.5 16.5H30.5C31.8807 16.5 33 15.3807 33 14V13C33 12.1716 33.6716 11.5 34.5 11.5H43.5V26C43.5 27.3807 42.3807 28.5 41 28.5H9C7.61929 28.5 6.5 27.3807 6.5 26V11.5Z"
        fill="#F6F6F7"
        stroke="#DCDDDE"
      />
    </svg>
  );
};

const NoDataComponent = () => {
  return (
    <div className={styles.noDataComponent}>
      <NoDataIcon />
      <span>{getTransText('ZANWUSHUJU')}</span>
    </div>
  );
};

const InfoItem = (props: { title: string; url: string; containerRef?: HTMLDivElement | null; type: 'wmInfo' | 'help' }) => {
  const openHelpCenter = useOpenHelpCenter();

  const handleClick = useCallback(() => {
    if (props.type === 'help') {
      workTableTrackAction('waimao_worktable_infoAndhelp', 'help_content');
    } else {
      workTableTrackAction('waimao_worktable_infoAndhelp', 'foreign_trade_information_content');
    }
    // 打开新窗口
    // systemApi.openNewWindow(props.url, false);
    // openWebUrlWithLoginCode(props.url);
    openHelpCenter(props.url);
  }, [props.url]);
  return (
    <div className={styles.knowledgeCardInfoItem} onClick={handleClick}>
      <div className={styles.dot}></div>
      {props.containerRef ? (
        <Tooltip getPopupContainer={() => props.containerRef as unknown as HTMLElement} placement="top" title={props.title}>
          <div className={styles.itemTitle}>{props.title}</div>
        </Tooltip>
      ) : (
        <div className={styles.itemTitle}>{props.title}</div>
      )}
      {/* <div className={styles.itemIcon}>
        <InfoItemIcon/>
      </div> */}
    </div>
  );
};

const KnowledgeCard: React.FC<{
  type: 'wmInfos' | 'helpInfos';
}> = props => {
  const [defaultKey, setDefaultKey] = useState('1');
  const [infoList, setInfoList] = useState<ResWorkbenchKnwoledgeListItem[]>([]);
  const [helpList, setHelpList] = useState<ResWorkbenchKnwoledgeListItem[]>([]);
  const [infoMoreUrl, setInfoMoreUrl] = useState('');
  const [helpMoreUrl, setHelpMoreUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNoData, setIsNoData] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const openHelpCenter = useOpenHelpCenter();

  const fetchKnowledgeArticleList = async () => {
    setIsLoading(true);
    worktableApi
      .getWorkBenchKnowledgeList()
      .then(res => {
        if (res.help.helpDocList.length <= 4) {
          setHelpList([...res.help.helpDocList]);
        } else {
          setHelpList([...res.help.helpDocList.slice(0, 4)]);
        }
        setHelpMoreUrl(res.help.centerUrl);

        if (res.knowledge.docList.length <= 4) {
          setInfoList([...res.knowledge.docList]);
        } else {
          setHelpList([...res.knowledge.docList.slice(0, 4)]);
        }
        setInfoMoreUrl(res.knowledge.centerUrl);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleMoreBtnClick = () => {
    workTableTrackAction('waimao_worktable_infoAndhelp', defaultKey === KnowledgeCardTabTypes.wmInfo ? 'foreign_trade_information_more' : 'help_more');
    // 点击查看更多
    // systemApi.openNewWindow(defaultKey === KnowledgeCardTabTypes.wmInfo ? infoMoreUrl : helpMoreUrl, false);
    openHelpCenter(defaultKey === KnowledgeCardTabTypes.wmInfo ? infoMoreUrl : helpMoreUrl);
  };

  const handleActiveChange = (val: string) => {
    if (val === KnowledgeCardTabTypes.helpInfo) {
      workTableTrackAction('waimao_worktable_infoAndhelp', 'help');
    } else {
      workTableTrackAction('waimao_worktable_infoAndhelp', 'foreign_trade_information');
    }
    setDefaultKey(val);
  };

  useEffect(() => {
    if ((defaultKey === KnowledgeCardTabTypes.wmInfo && infoList.length < 1) || (defaultKey === KnowledgeCardTabTypes.helpInfo && helpList.length < 1)) {
      setIsNoData(true);
    } else {
      setIsNoData(false);
    }
  }, [infoList, helpList]);

  useEffect(() => {
    fetchKnowledgeArticleList();
  }, []);
  return (
    <WorktableCard
      title={getTransText('ZIXUNBANGZHU')}
      titleStyles={{
        fontSize: 16,
      }}
      loading={isLoading}
      wrapStyles={{ padding: '20px 18px 0px 18px' }}
    >
      <Tabs
        defaultActiveKey={defaultKey}
        onChange={handleActiveChange}
        style={{
          padding: '0px 10px',
          width: '100%',
          height: '100%',
        }}
      >
        <Tabs.TabPane tab={<span>{getTransText('WAIMAOZIXUN')}</span>} key={KnowledgeCardTabTypes.wmInfo}>
          {!isNoData ? (
            <div className={styles.knowledgeCardContent} ref={containerRef}>
              {infoList.map(item => (
                <InfoItem type="wmInfo" containerRef={containerRef.current} key={item.title} title={item.title} url={item.url} />
              ))}
              <div className={styles.moreBtn} onClick={handleMoreBtnClick}>
                {getTransText('CHAKANGENGDUO')}
              </div>
            </div>
          ) : (
            <NoDataComponent />
          )}
        </Tabs.TabPane>
        <Tabs.TabPane tab={<span>{getTransText('SHIYONGBANGZHU')}</span>} key={KnowledgeCardTabTypes.helpInfo}>
          {!isNoData ? (
            <div className={styles.knowledgeCardContent}>
              {helpList.map(item => (
                <InfoItem type="help" key={item.title} title={item.title} url={item.url} />
              ))}
              <div className={styles.moreBtn} onClick={handleMoreBtnClick}>
                {getTransText('CHAKANGENGDUO')}
              </div>
            </div>
          ) : (
            <NoDataComponent />
          )}
        </Tabs.TabPane>
      </Tabs>
    </WorktableCard>
  );
};

export default KnowledgeCard;
