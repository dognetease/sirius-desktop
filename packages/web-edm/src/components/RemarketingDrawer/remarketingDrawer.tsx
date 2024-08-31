import React from 'react';
import lodashGet from 'lodash/get';
import { apiHolder, EdmEmailInfo, ResponseSendBoxDetail, traceLogItem, getIn18Text, ReplyTabEnum } from 'api';
// import SiriusDrawer from '@web-common/components/UI/SiriusDrawer';
import SiriusDrawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import RemarketingDropdown from '../RemarketingDropdown/remarketingDropdown';
import AiMarketingEnter from '../AiMarketingEnter/aiMarketingEnter';
import styles from './remarketingDrawer.module.scss';

const storageApi = apiHolder.api.getDataStoreApi();

// 未打开、未回复、打开未回复字段key，根据接口返回字段确定，所以是这样
export type remarketingType = 'unreadList' | 'arriveUnReplyList' | 'unReplyList' | 'multipleReadList';

interface RemarketingStorageData {
  remarketingAlert?: boolean;
  unreadList?: boolean;
  arriveUnReplyList?: boolean;
  unReplyList?: boolean;
  multipleReadList?: boolean;
}

interface RemarketingDrawerProps {
  visible: boolean;
  // 任务相关信息
  info?: EdmEmailInfo;
  // 列表数据相关信息
  listData: ResponseSendBoxDetail;
  // 点击回调
  handleClick: (type?: remarketingType, key?: string) => void;
  // 关闭回调
  onCancel: () => void;
  // 是否展示下拉
  needDropdown?: boolean;
}

// 获取二次营销在storage中存储的数据，key为当前任务id，值json解析后为RemarketingStorageData结构，分别为二次营销引导条、未打开再次营销、未回复再次营销、打开未回复再次营销是否有点击行为
export const getRemarketingStorageData = (key: string) => {
  let storageData = {} as RemarketingStorageData;
  try {
    if (!key) {
      return storageData;
    }
    const storageStr = storageApi.getSync(key)?.data;
    if (storageStr) {
      storageData = JSON.parse(storageStr);
    }
    return storageData;
  } catch {
    return storageData;
  }
};

// 设置二次营销在storage中存储的数据
export const setRemarketingStorageData = (key: string, data: RemarketingStorageData) => {
  let storageData = {} as RemarketingStorageData;
  try {
    if (key) {
      const storageStr = storageApi.getSync(key)?.data;
      if (storageStr) {
        storageData = JSON.parse(storageStr);
      }
      storageApi.putSync(key, JSON.stringify({ ...storageData, ...data }));
    }
  } catch {}
};

const RemarketingDrawer = (props: RemarketingDrawerProps) => {
  const { visible, info, listData, handleClick, onCancel, needDropdown = false } = props;
  const remarketingList: {
    type: remarketingType;
    title: string;
    desc: string;
    visible: boolean;
    contacts: traceLogItem[];
  }[] = [
    {
      type: 'unreadList',
      title: getIn18Text('WEIDAKAIZAICIYINGXIAO'),
      desc: `共有${lodashGet(listData, 'unreadList.length', 0)}个收件人未打开邮件，可针对这部分用户进行再次营销，能显著提升打开率及回复率。`,
      visible: lodashGet(listData, 'unreadList.length', 0) > 0,
      contacts: lodashGet(listData, 'unreadList', []),
    },
    {
      type: 'arriveUnReplyList',
      title: getIn18Text('WEIHUIFUZAICIYINGXIAO'),
      desc: `共有${lodashGet(listData, 'arriveUnReplyList.length', 0)}个收件人未回复，其中有${lodashGet(
        listData,
        'unReplyList.length',
        0
      )}个收件人打开了邮件、${lodashGet(listData, 'unreadList.length', 0)}个收件人未打开，可针对未回复的用户进行再次营销，能显著提升打开率及回复率。`,
      visible: lodashGet(listData, 'arriveUnReplyList.length', 0) > 0,
      contacts: lodashGet(listData, 'arriveUnReplyList', []),
    },
    {
      type: 'unReplyList',
      title: getIn18Text('DAKAIWEIHUIFUZAICI'),
      desc: `共有${lodashGet(listData, 'unReplyList.length', 0)}个收件人打开了邮件但是未回复，可针对这部分用户进行再次营销，能显著提升打开率及回复率。`,
      visible: lodashGet(listData, 'unReplyList.length', 0) > 0,
      contacts: lodashGet(listData, 'unReplyList', []),
    },
    {
      type: 'multipleReadList',
      title: getIn18Text('DUOCIDAKAIZAICIYING'),
      desc: `共有${lodashGet(listData, 'multipleReadList.length', 0)}个收件人多次打开邮件，可针对多次打开的收件人进行再次营销，能显著提升回复率。`,
      visible: lodashGet(listData, 'multipleReadList.length', 0) > 0,
      contacts: lodashGet(listData, 'multipleReadList', []),
    },
  ];

  return (
    <SiriusDrawer className={styles.remarketingDrawer} title={getIn18Text('ZAICIYINGXIAO')} visible={visible} onClose={onCancel}>
      <div className={styles.remarketingWrap}>
        <div className={styles.remarketingContent}>
          {remarketingList.map(item =>
            item.visible ? (
              <div className={styles.remarketingItem}>
                <div className={styles.itemTitle}>&nbsp;&nbsp;{item.title}</div>
                <div className={styles.itemDesc}>{item.desc}</div>
                <div className={styles.itemBtns}>
                  <RemarketingDropdown info={info} handleClick={handleClick} type={item.type} needDropdown={needDropdown} />
                  <AiMarketingEnter contacts={item.contacts} trackFrom="detail" />
                </div>
              </div>
            ) : (
              <></>
            )
          )}
        </div>
        <div className={styles.remarketingClose}>
          <Button onClick={onCancel} btnType="primary">
            {getIn18Text('GUANBI')}
          </Button>
        </div>
      </div>
    </SiriusDrawer>
  );
};

export default RemarketingDrawer;
