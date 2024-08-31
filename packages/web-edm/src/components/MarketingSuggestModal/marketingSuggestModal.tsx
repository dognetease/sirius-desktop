import React, { FC, useState, useEffect } from 'react';
import moment from 'moment';
import { navigate } from '@reach/router';
import lodashGet from 'lodash/get';
import { apis, apiHolder, getIn18Text, AddressBookNewApi, MarketingSuggestRes, MarketingSuggestResItem, MarketingSuggestResGroups, DataTrackerApi } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import { getSendCount } from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import { jumpToAddressListContactList } from '../../addressBook/utils';
import styles from './marketingSuggestModal.module.scss';

const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const storeApi = apiHolder.api.getDataStoreApi();
const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;
const systemApi = apiHolder.api.getSystemApi();
const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';

export const MARKETING_SUGGEST_MODAL = 'MARKETING_SUGGEST_MODAL';
const DATE_LIST = [0, 7, 14];

export const MarketingSuggestModal: FC<{
  data: MarketingSuggestRes;
  handleClose: (jumpOut?: boolean) => void;
}> = ({ data, handleClose }) => {
  const [visible, setVisible] = useState<boolean>(true);
  const displayData = data?.marketing0 || data?.marketing1;
  const displayNotMarketing = !!data?.marketing0;
  const displayTitle = displayNotMarketing ? '个联系人未营销过' : '个联系人仅营销过1次';
  const secondTitle = displayNotMarketing ? '个未营销联系人进行营销' : '个仅营销过1次的联系人进行多轮营销';
  const displayTitleDesc = displayNotMarketing ? '建议尽快营销获取更多效果' : '建议进行多轮营销获取更多有效回复';
  const totalCount = lodashGet(displayData, 'full.0.count', 0);
  // 是否有最近添加或者最近送达
  const haveRecent = lodashGet(displayData, 'full.1.count', 0);
  // 最近添加作为一个分组整合到分组数据中，并放在第一个
  const groupList = [...lodashGet(displayData, 'groups', [])];
  if (haveRecent) {
    groupList.unshift({
      groupId: '',
      groupName: displayNotMarketing ? '最近添加' : '最近送达',
      items: [lodashGet(displayData, 'full.1')],
    });
  }

  const trackAndHandleClose = () => {
    trackApi.track('pc_markting_edm_list_edmGuide_action', { action: 'cancel' });
    beforeHandleClose(false);
  };

  const beforeHandleClose = (jumpOut?: boolean) => {
    const storageDate = moment().format('YYYY-MM-DD');
    storeApi.putSync(MARKETING_SUGGEST_MODAL, storageDate);
    setVisible(false);
    setTimeout(() => {
      handleClose(!!jumpOut);
      setVisible(true);
    }, 500);
  };

  const jumpMarketingContact = (itm?: MarketingSuggestResItem, item?: MarketingSuggestResGroups) => {
    try {
      beforeHandleClose(true);
      if (itm?.conditions) {
        const conditions = JSON.parse(itm?.conditions);
        const gName = item?.groupName && item?.groupId ? `${item.groupName}分组` : '';
        const dName = itm?.statsType ? `最近${DATE_LIST[itm.statsType]}天添加` : '';
        const mName = displayNotMarketing ? '未营销联系人' : '仅营销1次联系人';
        jumpToAddressListContactList({
          filter: conditions,
          backUrl: `${routerWord}?page=index`,
          backName: '任务列表',
          listName: gName + dName + mName,
        });
        if (!item) {
          trackApi.track('pc_markting_edm_list_edmGuide_action', { action: 'view', type: displayNotMarketing ? 'noneAll' : 'onceAll' });
        } else if (!item.groupId) {
          trackApi.track('pc_markting_edm_list_edmGuide_action', { action: 'view', type: displayNotMarketing ? 'noneLately' : 'onceLately' });
        } else {
          trackApi.track('pc_markting_edm_list_edmGuide_action', { action: 'view', type: displayNotMarketing ? 'noneGroup' : 'onceGroup' });
        }
      } else {
        navigate(`${routerWord}?page=addressBookIndex`);
        trackApi.track('pc_markting_edm_list_edmGuide_action', { action: 'viewAll' });
      }
    } catch {}
  };

  const jumpMarketing = async (itm?: MarketingSuggestResItem, item?: MarketingSuggestResGroups) => {
    if (!itm) {
      return;
    }
    try {
      const conditions = JSON.parse(itm?.conditions);
      const params = { groupedFilter: conditions };
      beforeHandleClose(true);
      const res = await addressBookNewApi.getMarktingFiltedEmails(params);
      getSendCount({
        emailList: res.map(item => {
          return {
            contactEmail: item.email,
            contactName: item.contact_name,
            sourceName: item.source_name,
            increaseSourceName: '营销建议',
          };
        }),
        from: 'marketingModal',
        back: `${routerWord}?page=index`,
      });
      if (!item) {
        trackApi.track('pc_markting_edm_list_edmGuide_action', { action: 'edm', type: displayNotMarketing ? 'noneAll' : 'onceAll' });
      } else if (!item.groupId) {
        trackApi.track('pc_markting_edm_list_edmGuide_action', { action: 'edm', type: displayNotMarketing ? 'noneLately' : 'onceLately' });
      } else {
        trackApi.track('pc_markting_edm_list_edmGuide_action', { action: 'edm', type: displayNotMarketing ? 'noneGroup' : 'onceGroup' });
      }
    } catch {}
  };

  const renderText = (itm: MarketingSuggestResItem, ind: number) => {
    // 最近添加/送达
    if (haveRecent && ind === 0) {
      if (displayNotMarketing) {
        return `个最近${DATE_LIST[itm.statsType]}天添加的联系人未营销`;
      } else {
        return `个最近${DATE_LIST[itm.statsType]}天送达的联系人仅营销过1次，建议趁热打铁进行多轮营销转化客户`;
      }
    }
    // 分组下的总数
    else if (itm.statsType === 0) {
      if (displayNotMarketing) {
        return '个联系人未营销';
      } else {
        return '个联系人仅营销过1次';
      }
    }
    // 分组下最近X天
    else if ([1, 2].includes(itm.statsType)) {
      if (displayNotMarketing) {
        return `个最近${DATE_LIST[itm.statsType]}天添加的联系人未营销`;
      } else {
        return `个最近${DATE_LIST[itm.statsType]}天送达的联系人仅营销过1次`;
      }
    }
    // 兜底默认
    else {
      return '个联系人';
    }
  };

  useEffect(() => {
    // 展示pv
    trackApi.track('pc_markting_edm_list_edmGuide_show', { type: !!data?.marketing0 ? 'none' : 'once' });
  }, []);

  return (
    <div className={styles.marketingSuggestModal}>
      <Modal width={500} visible={visible} onCancel={trackAndHandleClose} footer={null} maskClosable={false}>
        <div className={styles.marketingSuggest}>
          <div className={styles.modalHeader}>
            <p className={styles.modalItemLevel1}>
              您有<span className={styles.modalCount}>{totalCount}</span>
              {displayTitle}
            </p>
            <p className={styles.modalItemLevel2}>{displayTitleDesc}</p>
          </div>
          <div className={styles.modalWrapper}>
            <div className={styles.modalContent}>
              <div className={styles.modalItem}>
                <div className={styles.modalItemLeft}>
                  <span className={styles.modalItemLevel3}>
                    建议对
                    <span className={styles.modalCount}>{totalCount}</span>
                    {secondTitle}
                  </span>
                </div>
                <div className={styles.modalItemRight}>
                  <span className={styles.modalOperation} onClick={() => jumpMarketingContact(displayData?.full[0])}>
                    查看
                  </span>
                  <span className={styles.modalOperation} onClick={() => jumpMarketing(displayData?.full[0])}>
                    一键营销
                  </span>
                </div>
              </div>
              <div className={styles.modalList}>
                {groupList.map((item, index) => (
                  <div className={styles.modalBox}>
                    <div className={styles.modalTag}>
                      <Tag type={haveRecent && index === 0 ? 'label-2-1' : 'label-1-1'} hideBorder={true}>
                        {item.groupName}
                      </Tag>
                    </div>
                    {item.items?.map(itm =>
                      itm.count ? (
                        <div className={styles.modalItem}>
                          <div className={styles.modalItemLeft}>
                            <span>
                              共有<span className={styles.modalCount}>{itm.count}</span>
                              {renderText(itm, index)}
                            </span>
                          </div>
                          <div className={styles.modalItemRight}>
                            <span className={styles.modalOperation} onClick={() => jumpMarketingContact(itm, item)}>
                              查看
                            </span>
                            <span className={styles.modalOperation} onClick={() => jumpMarketing(itm, item)}>
                              一键营销
                            </span>
                          </div>
                        </div>
                      ) : (
                        <></>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <Button btnType="minorLine" onClick={trackAndHandleClose}>
              {getIn18Text('ZHIDAOLE')}
            </Button>
            <Button btnType="primary" onClick={() => jumpMarketingContact()}>
              查看营销联系人
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
