import React, { FC, useState, useEffect, useRef } from 'react';
import { Button, Popover, message, Tooltip, Spin } from 'antd';
import { apiHolder, apis, GetTemplateListRes, TemplateConditionRes, TemplateSearchRes, MailTemplateApi, WriteMailInitModelParams, DataTrackerApi } from 'api';
import classnames from 'classnames/bind';
import Moment from 'moment';

import NoResultImg from '@/images/icons/edm/empty.png';
import DeleteIcon from '@/images/icons/delete-icon.svg';
import CloseIcon from '@/images/icons/edm/close-icon.svg';
import UnionIcon from '@/images/icons/edm/union-icon.svg';

import { formatViewMail } from '@web-setting/Mail/components/CustomTemplate/util';
import { ViewMail } from '@web-common/state/state';

import styles from './TemplateList.module.scss';
import { setTemplateContent } from './template-util';
import { navigate } from '@reach/router';

import { TrackTypeEnum } from './Aggregation';
import { getIn18Text } from 'api';

type Key = 'templateId' | 'templateName' | 'thumbnail' | 'tabId' | 'templateType' | 'templateDesc' | 'templateContentType';
export type TemplateItem = Pick<TemplateSearchRes[0], Key>;

type AggregationFilter = TemplateConditionRes['tabList'][0];

type Action = (type: 'display' | 'edit' | 'search' | 'deleteHistory' | 'deleteItem' | 'deleteHistoryItem', templateId: string) => void;

const realStyle = classnames.bind(styles);
interface TemplateListProps {
  list: Array<TemplateItem> | null;
  orderList?: AggregationFilter['orderList'];
  order: string | undefined;
  refreshList: () => void;
  activeTabId: number;
  emitResult?: (data: ViewMail) => void; // 写信页模板点击”使用“的回调
  action: Action;
  searchValue: string;
  goTemplateAdd?: (templateId?: string) => void;
  fromPage: 2 | 1;
  spinning: boolean;
  activeType?: number;
}
const templateApi = apiHolder.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

export const SearchTemplateList: FC<
  TemplateListProps & {
    searchQueue: string[];
  }
> = props => {
  const { searchValue, list, searchQueue, action, activeTabId } = props;
  const ref = useRef<HTMLDivElement>(null);
  // const [flag, setFlag] = useState(0);
  const [pureList, setpureList] = useState<TemplateItem[]>([]);

  useEffect(() => {
    if (list != null) {
      setpureList(list.filter(item => (activeTabId === 0 ? true : item.tabId != null ? item.tabId === activeTabId : true)));
    } else {
      setpureList([]);
    }
  }, [list, activeTabId]);

  if (searchValue !== '') {
    return (
      <div className={styles.searchTemplateList}>
        <div className={styles.searchHistory}>
          <div className={styles.historyLabel}>{getIn18Text('SOUSUOJILU\uFF1A')}</div>
          <div className={styles.historyItemBox} ref={ref}>
            {searchQueue.length > 0
              ? searchQueue.map((search, index) => (
                  // <div onClick={() => {
                  //   action('search', search);
                  // }} key={search} className={styles.historyItem}>{search}</div>
                  <HistoryItem index={index} flag={searchQueue.length} key={search + index} action={action} search={search} parent={ref.current} />
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
              action('deleteHistory', '');
            }}
            alt=""
          />
        </div>
        <div className={styles.searchCount}>
          {getIn18Text('GONGYOU')} <span className={styles.searchCountNumber}>{pureList.length || 0}</span> {getIn18Text('GESOUSUOJIEGUO')}
        </div>
        <TemplateList {...props} list={pureList} />
      </div>
    );
  }

  return <TemplateList {...props} />;
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
      <OverflowItem
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

export const OverflowItem: FC<
  {
    value: string;
  } & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
> = props => {
  const { style, value, children } = props;
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref != null && ref.current != null && ref.current.scrollWidth !== ref.current.offsetWidth) {
      setShow(true);
    }
  }, [ref, value]);

  const node = (
    <div ref={ref} {...props}>
      {value}
    </div>
  );

  if (show) {
    return <Tooltip title={value}>{node}</Tooltip>;
  }

  return <>{node}</>;
};

export const TemplateList: FC<TemplateListProps> = props => {
  const { list, orderList, order, refreshList, activeTabId, emitResult, action, searchValue, goTemplateAdd, fromPage, spinning, activeType } = props;
  const [pureList, setpureList] = useState<TemplateItem[]>([]);

  useEffect(() => {
    if (list != null) {
      setpureList(list.filter(item => (activeTabId === 0 ? true : item.tabId != null ? item.tabId === activeTabId : true)));
    } else {
      setpureList([]);
    }
  }, [list, activeTabId]);

  return (
    <Spin className={styles.spinWrapper} spinning={spinning} tip={''}>
      {list && list.length > 0 ? (
        <div
          className={realStyle({
            templateList: true,
            templateListModal: fromPage === 2,
          })}
        >
          {list.map(item => (
            <div className={styles.templateWrapper}>
              <TemplateCard
                fromPage={fromPage}
                searchValue={searchValue}
                action={action}
                activeTabId={activeTabId}
                emitResult={emitResult}
                refreshList={refreshList}
                item={item}
                orderList={orderList}
                order={order}
                activeType={activeType}
              />
            </div>
          ))}
        </div>
      ) : (
        !spinning && (
          <NoResultList
            activeTabId={activeTabId}
            searchValue={searchValue}
            goTemplateAdd={() => {
              goTemplateAdd && goTemplateAdd('');
            }}
          />
        )
      )}
    </Spin>
  );
};

const NoResultList: FC<{
  searchValue: string;
  goTemplateAdd?: (templateId?: string) => void;
  activeTabId: number;
}> = props => {
  const { searchValue, goTemplateAdd, activeTabId } = props;

  const getText = () => {
    switch (activeTabId) {
      case 3:
        return getIn18Text('ZANWUTUIJIANMOBAN');
      case 4:
        return getIn18Text('ZANWUQIYEMOBAN');
      default:
        return (
          <>
            {getIn18Text('NIHAIMEIYOUZIDINGYIGUOMOBAN\uFF0CKUAIQU')}
            <a
              onClick={() => {
                goTemplateAdd && goTemplateAdd('');
              }}
            >
              {getIn18Text('XINJIANGERENMOBAN')}
            </a>
            {getIn18Text('SHISHIBA\uFF5E')}
          </>
        );
    }
  };

  return (
    <div className={styles.noResultBox}>
      <div className={styles.noResult}>
        <img
          style={{
            width: 160,
            height: 160,
            marginBottom: 16,
          }}
          src={NoResultImg}
          alt=""
        />
        <div
          style={{
            whiteSpace: 'nowrap',
          }}
        >
          {searchValue !== '' ? getIn18Text('ZANWUGAILEIXINGMOBAN\uFF0CHUANGECISHISHIBA') : <>{getText()}</>}
        </div>
      </div>
    </div>
  );
};

const SortLabel = (value: string, type: string): string => {
  if (type === 'updateTime') {
    return Moment(value).format('YYYY-MM-DD HH:mm');
  }
  return value;
};
const TemplateCard: FC<{
  item: TemplateItem;
  orderList?: AggregationFilter['orderList'];
  order: string | undefined;
  refreshList: () => void;
  activeTabId: number;
  emitResult?: (data: ViewMail) => void; // 写信页模板点击”使用“的回调
  action: (type: 'display' | 'edit' | 'deleteItem', templateId: string) => void;
  searchValue: string;
  fromPage: 1 | 2;
  activeType?: number;
}> = props => {
  const { item, orderList, order, refreshList, activeTabId, emitResult, action, searchValue, fromPage, activeType } = props;
  const [label, setLabel] = useState<string>('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    if (orderList && order) {
      const { orderName, orderId } = orderList.find(orderItem => orderItem.orderId === order)!;
      setLabel(orderName);
      setOrderId(orderId);
    }
  }, [order]);

  // if (activeTabId !== '' && activeTabId !== item.templateType) {
  //   return null;
  // }

  return (
    <div
      className={realStyle({
        templateCard: true,
        templateCardModal: fromPage === 2,
      })}
    >
      <OverflowItem className={styles.templateTitle} value={item.templateName} />
      <div
        className={realStyle({
          templateView: true,
          templateViewModal: fromPage === 2,
        })}
      >
        <img
          className={styles.templateViewImg}
          src={item.thumbnail.url}
          style={{
            width: '100%',
            height: '100%',
          }}
          alt=""
        />
        {item.templateContentType === 1 && item.templateDesc && (
          <div className={styles.imgCover}>
            <div>{item.templateDesc}</div>
          </div>
        )}
      </div>
      {orderList && searchValue === '' && order && (
        <div className={styles.templateReply}>{`${(item as any)[orderId] != null ? label : ''} ${SortLabel((item as any)[orderId], orderId) ?? ''}`}</div>
      )}
      <div className={styles.templateOp}>
        {(item.templateType === 'PERSONAL' || item.tabId === 2) && (
          <Popover
            title={null}
            trigger="click"
            getPopupContainer={node => node}
            content={
              <>
                <div className={styles.templateOpBtn}>
                  <Button
                    style={{
                      width: 68,
                      height: 28,
                    }}
                    onClick={() => {
                      trackApi.track('pc_markting_edm_template_operation_click', {
                        operation: 'edit',
                        ...(activeType != null ? { template_type: TrackTypeEnum[activeType as 1 | 0] } : {}),
                      });
                      action('edit', item.templateId);
                    }}
                  >
                    {getIn18Text('BIANJI')}
                  </Button>
                </div>
                <div className={styles.templateOpBtn}>
                  <Button
                    style={{
                      width: 68,
                      height: 28,
                    }}
                    onClick={() => {
                      trackApi.track('pc_markting_edm_template_operation_click', {
                        operation: 'delete',
                        ...(activeType != null ? { template_type: TrackTypeEnum[activeType as 1 | 0] } : {}),
                      });
                      action('deleteItem', item.templateId);
                    }}
                  >
                    {getIn18Text('SHANCHU')}
                  </Button>
                </div>
              </>
            }
          >
            <Button
              style={{
                border: '1.16667px solid #E1E6ED',
                borderRadius: '4px',
                width: 28,
                height: 28,
              }}
            >
              <img src={UnionIcon} alt="" />
            </Button>
          </Popover>
        )}
        <Button
          style={{
            width: fromPage === 2 ? 61 : 74,
            height: 28,
          }}
          onClick={() => {
            trackApi.track('pc_markting_edm_template_operation_click', {
              operation: 'view',
              ...(activeType != null ? { template_type: TrackTypeEnum[activeType as 1 | 0] } : {}),
            });
            action('display', item.templateId);
          }}
        >
          {getIn18Text('CHAKAN')}
        </Button>
        <Button
          style={{
            width: fromPage === 2 ? 61 : 74,
            height: 28,
          }}
          type="primary"
          onClick={() => {
            templateApi.doSaveMailTemplateUseTime({ templateId: item.templateId, time: new Date().getTime() });
            // 获取模板详情，唤起写信
            templateApi.doGetMailTemplateDetail({ templateId: item.templateId }).then(async res => {
              if (res.success && res.data) {
                if (emitResult) {
                  const viewMail = await formatViewMail(res.data);
                  viewMail.form = 'template';
                  emitResult(viewMail);
                } else {
                  setTemplateContent(res.data.content, item.templateId);
                  // navigate('#edm?page=write&tab=0&steps=ContentEditor,SendSetting,BatchSetting');
                  navigate('#edm?page=write&from=template');
                }
              }
            });
            // 使用模板id上报
            trackApi.track('pc_markting_edm_writeMailPage_template_use', {
              template_source: fromPage === 1 ? getIn18Text('MOBANGUANLI') : getIn18Text('NEIRONGBIANJI'),
              system_template_id: item.templateId,
            });
            trackApi.track('pc_markting_edm_template_operation_click', {
              operation: 'use',
              ...(activeType != null ? { template_type: TrackTypeEnum[activeType as 1 | 0] } : {}),
            });
          }}
        >
          {getIn18Text('SHIYONG')}
        </Button>
      </div>
    </div>
  );
};
