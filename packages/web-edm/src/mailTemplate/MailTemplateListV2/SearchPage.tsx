import { apiHolder, getIn18Text, apis, MailTemplateApi, GetTemplateListReq, DataStoreApi, TemplateConditionRes, GetTemplateListRes, GetTemplateTopRes } from 'api';
import React, { FC, useEffect, useRef } from 'react';
import { Modal, message, Skeleton } from 'antd';
import { navigate } from '@reach/router';
import CloseIcon from '@/images/icons/edm/close-icon.svg';
import DeleteIcon from '@/images/icons/delete-icon.svg';

import styles from './MailTemplateListV2.module.scss';
import { PersonalCard } from './PersonalCard';
import type { Action } from './MailTemplateListV2';
import { setTemplateContent } from '../template-util';
import NoResultImg from '@/images/icons/edm/empty.png';
import { OverflowShowTooltips } from '../../components/OverflowShowTooltips';

const templateApi = apiHolder.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
const systemApi = apiHolder.api.getSystemApi();
const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';

export const SearchPage: FC<{
  searchQueue: string[];
  list: GetTemplateTopRes[number]['templateList'];
  cardOp: Action;
  searchLoading: boolean;
}> = ({ list, cardOp, searchQueue, searchLoading }) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  if (searchLoading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.list}>
          <div
            style={{
              padding: 16,
            }}
          >
            <Skeleton active />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        <div className={styles.search}>
          <div className={styles.searchHistory}>
            <div className={styles.historyLabel}>{getIn18Text('SOUSUOJILU\uFF1A')}</div>
            <div className={styles.historyItemBox} ref={wrapRef}>
              {searchQueue.length > 0
                ? searchQueue.map((search, index) => (
                    // <div onClick={() => {
                    //   action('search', search);
                    // }} key={search} className={styles.historyItem}>{search}</div>
                    <>{search && <HistoryItem index={index} flag={searchQueue.length} key={search + index} action={cardOp} search={search} parent={wrapRef.current} />}</>
                  ))
                : null}
            </div>
            <img
              style={{
                width: 16,
                height: 16,
                cursor: 'pointer',
                marginLeft: 16,
              }}
              src={DeleteIcon}
              onClick={() => {
                cardOp('deleteHistory', '');
              }}
              alt=""
            />
          </div>
          <div className={styles.searchList}>
            {list.length > 0 ? (
              list?.map(templateInfo => (
                <div className={styles.searchListItem} key={templateInfo.templateId}>
                  <PersonalCard
                    // 这里是所有卡片的操作
                    // 如果需要使用html内容，需要使用方法：saveTaskAsTemplate
                    cardOp={cardOp}
                    templateInfo={templateInfo}
                  />
                </div>
              ))
            ) : (
              <div className={styles.noResult}>
                <img src={NoResultImg} alt="" />
                <div>暂无模板</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

let observer: IntersectionObserver | null;
let ob: MutationObserver | null;
export const HistoryItem: FC<{
  action: Action;
  search: string;
  parent: Element | null;
  flag: number;
  index: number;
}> = props => {
  const { action, search, parent, flag, index } = props;

  // useEffect(() => {
  //   observer = new IntersectionObserver((entry) => {
  //     if (entry[0].intersectionRatio < 1) {
  //       setHidden(true);
  //     } else {
  //       setHidden(false);
  //     }
  //   }, {
  //     root: parent,
  //   });
  //   if (ref.current) {
  //     observer.observe(ref.current);
  //   }
  //   return () => {
  //     observer = null;
  //   };
  // }, [ref.current, search, flag, index]);

  useEffect(() => {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.intersectionRatio < 1) {
          entry.target.classList.add(styles.hideBox);
        } else {
          entry.target.classList.remove(styles.hideBox);
        }
      });
    });

    if (parent != null) {
      ob = new MutationObserver(res => {
        // console.log(res, '------res0000')
        const node = res[0];
        node.target.childNodes.forEach(item => {
          // const rect = (item.target as HTMLDivElement).getBoundingClientRect();
          if (observer != null) {
            observer.observe(item as HTMLDivElement);
          }
        });
      });
      ob.observe(parent, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer = null;
      ob = null;
    };
  }, [parent]);

  return (
    <div key={search} className={styles.historyItem}>
      <OverflowShowTooltips
        className={styles.historyItemItem}
        value={search}
        onClick={() => {
          action('search', index + '');
        }}
      />
      <img
        onClick={() => {
          action('deleteHistoryItem', index + '');
        }}
        src={CloseIcon}
        className={styles.historyItemIcon}
      />
    </div>
  );
};
