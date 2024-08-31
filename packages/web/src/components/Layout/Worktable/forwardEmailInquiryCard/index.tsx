/* eslint-disable max-len */
import { useAppSelector } from '@web-common/state/createStore';
import Button from '@web-common/components/UI/Button';
import { navigate } from 'gatsby';
import React, { useState, useEffect } from 'react';
import { getIn18Text, api, WorktableApi, ResEmailInquiryItem } from 'api';
import { WorktableCard } from '../card';
import cardStyle from '../workTable.module.scss';
import styles from './index.module.scss';
import InquiryCard from './components/InquiryCard';
import NoData from './components/NoData';
import { parseMailContent } from '../../EmailInquiry/utils';

const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;

const ForwardEmailInquiry: React.FC<{}> = props => {
  const state = useAppSelector(state => state.worktableReducer.emailInquirySwitch);
  const { loading, data } = state;
  const { subscribeCustomerSwitch } = data ?? {};

  const [cards, setCards] = useState<(ResEmailInquiryItem & { content: string })[]>([]);

  useEffect(() => {
    worktableApi.getEmailInquiry().then(emailInquiryItems => {
      setCards(emailInquiryItems.map(item => ({ ...item, content: parseMailContent(item.mail) })));
    });
  }, []);

  const isEmpty = cards.length === 0;
  const jumpToSubscribes = () => {
    navigate('#wmData?page=star');
  };
  const jumpToAllInquiries = () => {
    navigate('#emailInquiry?page=emailInquiry');
  };
  const overviewEmail = (id: string) => {
    const newCards = [...cards];
    const needUpdate = newCards.some(item => {
      if (item.id === id && item.unread) {
        item.unread = false;
        return true;
      }
      return false;
    });
    if (needUpdate) {
      setCards(newCards);
    }
  };

  return (
    <WorktableCard
      title={getIn18Text('ZHUANSHUXUNPAN')}
      loading={loading}
      headerToolsConfig={[
        {
          tools: (
            <>
              {subscribeCustomerSwitch && (
                <Button btnType="minorLine" onClick={jumpToSubscribes}>
                  {getIn18Text('DINGYUEKEHU')}
                </Button>
              )}
              <Button btnType="minorLine" style={{ marginLeft: 0 }} onClick={jumpToAllInquiries}>
                {getIn18Text('QUANBUXUNPAN')}
              </Button>
            </>
          ),
        },
      ]}
    >
      <div className={cardStyle.cardContainer}>
        <div style={{ flex: 1, width: '100%' }}>
          {isEmpty ? (
            <div className={styles.noDataContainer}>
              <NoData />
            </div>
          ) : (
            <div className={styles.gridContainer}>
              {cards.map(({ mail, ...card }) => (
                <InquiryCard key={card.id} info={card} mail={mail} overviewCallback={overviewEmail} />
              ))}
            </div>
          )}
        </div>
      </div>
    </WorktableCard>
  );
};

export default ForwardEmailInquiry;
