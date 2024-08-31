import { getTransText } from '@/components/util/translate';
import React, { useEffect } from 'react';
import { WorktableCard } from '../card';
import styles from './NoticeCard.module.scss';
import NoDataIcon from '../icons/NoData';
import { Spin } from 'antd';
import UniDrawerWrapper from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import { apiHolder, WorkbenchNoticeListItem } from 'api';
import { pushNavigateCrossMultiClient, workTableTrackAction } from '../worktableUtils';
import { NoticeChildCard } from './components/NoticeChildCard/NoticeChildCard';
import { useNoticeListData } from './hooks/useNoticeListData';
import { useUniDrawerData } from './hooks/useUniDrawerData';
import { createPortal } from 'react-dom';
import { getIn18Text } from 'api';
import { bus } from '@web-common/utils/bus';

const systemApi = apiHolder.api.getSystemApi();

const ClearAllNoticeBtn = (props: { handleClick?: () => void }) => {
  return (
    <div className={styles.clearAllNoticeBtn} onClick={props.handleClick}>
      {getTransText('QINGKONGSUOYOUTONGZHI')}
    </div>
  );
};

const NoticeCard = props => {
  const { noticeList, initLoading, moreLoading, hasMore, scrollContainerRef, lastId, fetchNoticeList, handleClearAll, postIngore } = useNoticeListData();
  const { className = '', hasDrag = true } = props;

  const { uniVisible, customerData, setUniVisible, setCustomerData } = useUniDrawerData();

  const handleScroll: React.UIEventHandler<HTMLDivElement> = event => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (clientHeight === scrollHeight - scrollTop && lastId.current && hasMore.current && !moreLoading) {
      fetchNoticeList(true);
    }
  };

  const openNewWindow = (url: string, id: number) => {
    pushNavigateCrossMultiClient(url);
    postIngore(id);
  };

  const handleCardClick = async (id: number, type: 'normal' | 'close', jumpUrl: string, cardType: number, bizId: string) => {
    if (type === 'close') {
      await postIngore(id);
    } else {
      workTableTrackAction('waimao_worktable_inform', 'info');
      if (cardType === 0) {
        // 客户通知
        setUniVisible(true);
        setCustomerData({
          company_id: bizId,
        });
        await postIngore(id);
      } else if (cardType === 3) {
        // 任务中心-系统任务
        systemApi.handleJumpUrl(-1, jumpUrl);
      } else {
        // 公司订阅通知-1，全球搜通知-2
        openNewWindow(jumpUrl, id);
      }
    }

    bus.emit('notiUpdate');
  };

  useEffect(() => {
    fetchNoticeList();
  }, []);

  return (
    <WorktableCard
      className={className}
      hasDrag={hasDrag}
      title={getTransText('TONGZHI')}
      headerToolsConfig={[
        {
          tools: (
            <ClearAllNoticeBtn
              handleClick={async () => {
                await handleClearAll();
                bus.emit('notiUpdate');
              }}
            />
          ),
        },
        {
          onRefresh: () => {
            fetchNoticeList();
            bus.emit('notiUpdate');
          },
          refreshIconStyles: {
            transform: 'scale(0.8)',
            marginLeft: -2,
          },
        },
      ]}
      titleStyles={{
        fontSize: 16,
      }}
      cardActionStyles={{
        marginRight: 18,
      }}
      leftCardHeaderStyles={{
        marginLeft: 18,
      }}
      loading={initLoading}
      wrapStyles={{ padding: '18px 0px 0px 0px' }}
    >
      <div className={styles.noticeContainer}>
        <div className={styles.noticeScrollContainer} ref={scrollContainerRef} onScroll={handleScroll}>
          {noticeList.length > 0 ? (
            noticeList.map((data: WorkbenchNoticeListItem) => {
              return (
                <NoticeChildCard
                  key={data.id}
                  id={data.notifyId}
                  cardType={data.type}
                  jumpUrl={data.jumpUrl}
                  info={data.content}
                  time={data.notifyAt}
                  bizId={data.bizId}
                  containerEle={scrollContainerRef.current}
                  handleClick={handleCardClick}
                />
              );
            })
          ) : (
            <div className={styles.emptyData}>
              <NoDataIcon />
              <span>{getTransText('ZANWUSHUJU')}</span>
            </div>
          )}
          {moreLoading && (
            <div className={styles.loadingMore}>
              <Spin />
            </div>
          )}

          {uniVisible &&
            createPortal(
              <UniDrawerWrapper
                visible={uniVisible}
                source="worktableCustomer"
                customStatus={getIn18Text('XIANSUOKEHU')}
                customerId={customerData.company_id as unknown as number}
                onClose={() => {
                  setUniVisible(false);
                }}
                onSuccess={() => {
                  setUniVisible(false);
                }}
              />,
              document.getElementById('unidrawer-root')!
            )}
        </div>
      </div>
    </WorktableCard>
  );
};

export default NoticeCard;
