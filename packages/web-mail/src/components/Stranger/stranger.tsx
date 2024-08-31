import React from 'react';
import { apiHolder, apis, DataStoreApi, MailConfApi, StrangerModel, MailStrangerApi, PriorityIntroMap, DataTrackerApi } from 'api';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import style from './stranger.module.scss';
import IconCard from '@web-common/components/UI/IconCard';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import LowModal from '@/components/UI/Modal/lowModal';
import useState2RM from '../../hooks/useState2ReduxMock';
// import { setCurrentAccount } from '../../util';
import { getIn18Text } from 'api';
const mailStrangerApi = apiHolder.api.requireLogicalApi(apis.mailStrangerApiImpl) as unknown as MailStrangerApi;
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const storeApi: DataStoreApi = apiHolder.api.getDataStoreApi();
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
interface StrangerProp {
  recentStrangers: StrangerModel[];
  strangerCount: number;
  isLeftRight: boolean; // 是否是左右分栏布局模式
  removeStrangerEntry: () => void;
}
const Stranger: React.FC<StrangerProp> = props => {
  const { recentStrangers, strangerCount, isLeftRight = true, removeStrangerEntry } = props;
  // 邮件列表-上部-二级tab选中
  const [selected] = useState2RM('mailListStateTab', 'doUpdateMailListStateTab');
  // 去陌生人页面
  const toStrangerPage = () => {
    mailConfApi.doOpenStrangerPage();
  };
  // 设置优先级
  const setSmartPriorities = async (priority: 0 | 1 | 2) => {
    const priorityCn = PriorityIntroMap[priority] || '';
    trackerApi.track('pc_importance_of_sender', { mark_location: `${selected}分类列表（单人）`, important: priorityCn });
    const res = await mailStrangerApi.setSmartPriorities({
      email: recentStrangers[0].accountName,
      name: recentStrangers[0]?.contactName || recentStrangers[0].accountName,
      priority,
    });
    if (res.success === true) {
      // 立刻移除入口，给用户最快的反馈，而不是等消息过来，以免用户重复点击（用于单个陌生人）
      if (strangerCount === 1) {
        removeStrangerEntry();
      }
      message.success({
        content: `已设置联系人为${priorityCn}`,
      });
      // 标记单个陌生人
      // if(strangerCount === 1) {
      //   markSingleStranger();
      // }
    } else {
      message.success({
        content: getIn18Text('SHEZHIYOUXIANJI'),
      });
    }
  };
  // modal二次确认
  const modalJudge = async () => {
    return new Promise(resolve => {
      // setCurrentAccount();
      const noMoreLowModalStore = storeApi.getSync('noMoreLowModal');
      const { data, suc } = noMoreLowModalStore;
      // 已选择不再提醒
      if (suc && data === 'true') {
        resolve(true);
        return;
      }
      trackerApi.track('pc_low_priority_window', { page: getIn18Text('YOUJIANLIEBIAO\uFF08') });
      LowModal.show({
        onOk: () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
      });
    });
  };
  // 低优
  const toLow = async () => {
    // 弹窗二次确认
    const judgeRes = await modalJudge();
    if (!judgeRes) return;
    await setSmartPriorities(2);
  };
  // 普通
  const toNormal = async () => {
    await setSmartPriorities(1);
  };
  // 高优
  const toHigh = async () => {
    await setSmartPriorities(0);
  };
  // 单个陌生人
  const renderSingle = () => {
    return (
      <div className={style.single} style={{ paddingBottom: isLeftRight ? '12px' : '0' }}>
        <div className={style.markTitle}>
          <div className={style.mark}>
            <IconCard type="mark" />
            &nbsp;{getIn18Text('biaoji')}
          </div>
          &nbsp;&nbsp;{getIn18Text('BIAOJINIMOSHENG')}
        </div>
        <div className={style.strangerItem}>
          <div className={style.itemContent}>
            {recentStrangers.map(item => (
              <AvatarTag
                key={item.accountName}
                size={32}
                user={{
                  name: item.contactName,
                  email: item.accountName,
                }}
              />
            ))}
            <div className={style.msg}>
              <p className={style.name}>{recentStrangers[0]?.contactName || ''}</p>
              <p className={style.email}>
                <span>{recentStrangers[0]?.accountName || ''}</span>
                {/* 通栏下，跳转按钮 */}
                {!isLeftRight && (
                  <span style={{ marginLeft: '14px' }} onClick={toStrangerPage}>
                    <IconCard type="mailExchange" />
                  </span>
                )}
              </p>
            </div>
            {/* 通栏布局下，按钮位置 */}
            {!isLeftRight && (
              <div className={style.longBtn}>
                <span className={style.low} onClick={toLow}>
                  {getIn18Text('DIYOU')}
                </span>
                <span className={style.normal} onClick={toNormal}>
                  {getIn18Text('PUTONG')}
                </span>
                <span className={style.high} onClick={toHigh}>
                  {getIn18Text('GAOYOU')}
                </span>
              </div>
            )}
            {/* 分栏下，跳转按钮 */}
            {isLeftRight && (
              <div className={style.mailExchangeArea} onClick={toStrangerPage}>
                <IconCard type="mailExchange" />
              </div>
            )}
          </div>
          {/* 分栏布局下，按钮位置 */}
          {isLeftRight && (
            <div className={style.opts}>
              <span className={style.low} onClick={toLow}>
                {getIn18Text('DIYOU')}
              </span>
              <span className={style.normal} onClick={toNormal}>
                {getIn18Text('PUTONG')}
              </span>
              <span className={style.high} onClick={toHigh}>
                {getIn18Text('GAOYOU')}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };
  const renderMuti = () => {
    return (
      <div className={style.multi} onClick={toStrangerPage}>
        <div className={style.markImportance}>{getIn18Text('BIAOJINIMOSHENG')}</div>
        <div className={style.right}>
          <div
            className={classnames(style.headPics, {
              [style.two]: strangerCount == 2,
              [style.three]: strangerCount == 3,
              [style.moreThanThree]: strangerCount > 3,
            })}
          >
            {strangerCount == 2 && (
              <>
                {recentStrangers.slice(0, 2).map((item, index) => (
                  <AvatarTag
                    key={item.accountName}
                    className={style.headPic}
                    size={32}
                    user={{
                      name: item.contactName,
                      email: item.accountName,
                    }}
                  />
                ))}
              </>
            )}
            {strangerCount == 3 && (
              <>
                {recentStrangers.slice(0, 3).map((item, index) => (
                  <AvatarTag
                    key={item.accountName}
                    className={style.headPic}
                    size={32}
                    user={{
                      name: item.contactName,
                      email: item.accountName,
                    }}
                  />
                ))}
              </>
            )}
            {strangerCount > 3 && (
              <>
                {recentStrangers.slice(0, 2).map((item, index) => (
                  <AvatarTag
                    key={item.accountName}
                    className={style.headPic}
                    size={32}
                    user={{
                      name: item.contactName,
                      email: item.accountName,
                    }}
                  />
                ))}
                <div
                  className={classnames(style.more, {
                    [style.moreThan99]: strangerCount > 99,
                  })}
                >
                  {/* 超过99展示99+ */}
                  {strangerCount > 99 ? '99+' : strangerCount}
                </div>
              </>
            )}
          </div>
          <IconCard className={style.arrowRight} type="arrowRight" />
        </div>
      </div>
    );
  };
  return (
    <div className={style.strangerBlk}>
      {/* 单个陌生人 */}
      {strangerCount === 1 && renderSingle()}
      {/* 多个陌生人 */}
      {strangerCount > 1 && renderMuti()}
    </div>
  );
};
export default Stranger;
