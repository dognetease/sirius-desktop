import React from 'react';
import { apiHolder as api, apis, MailEntryModel, MailDraftApi } from 'api';
import styles from './UnfinishedDrafts.module.scss';
import IconCard from '@web-common/components/UI/IconCard';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { formatTimeWithHM } from '@web-mail/util';
import { formatTime } from '@web-mail/util';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { AlertErrorIcon } from '@web-common/components/UI/Icons/icons';
import { defaultComSummary, defaultDescFun, defaultSender } from '@web-mail/common/components/vlistCards/MailCard/defaultComs';
import { getIn18Text } from 'api';

const mailDraftApi = api.api.requireLogicalApi(apis.mailDraftApiImpl) as MailDraftApi;

interface Props {
  draftMailArr: Array<{ cid: string; versions: MailEntryModel[] }>;
  getAllDraftMail: () => void;
  delDraftMailByIndex: (index: number) => void;
  close: () => void;
}

const Sender = defaultSender;
const ComSummary = defaultComSummary;

export const UnfinishedDrafts: React.FC<Props> = ({ draftMailArr, getAllDraftMail, delDraftMailByIndex, close }) => {
  const [showConcreteTime] = useState2RM('configMailListShowConcreteTime');

  // 恢复版本
  const recoverVersion = async (draft: MailEntryModel) => {
    await mailDraftApi.recoverDraft(draft);
    close();
  };

  // 清空全部
  const clearAll = async () => {
    SiriusModal.confirm({
      title: getIn18Text('SHIFOUQINGKONGQUNBUWEIBAOCUN'),
      icon: <AlertErrorIcon />,
      content: '',
      okType: 'primary',
      okText: getIn18Text('QINGKONG'),
      onOk: () => clearAllAction(),
    });
  };
  const clearAllAction = async () => {
    try {
      const clearRes = await mailDraftApi.clearDraftMail();
      const { success, message } = clearRes;
      if (success) {
        SiriusMessage.success({ content: getIn18Text('YISHANCHU') });
        // 重新获取所有草稿邮件
        getAllDraftMail();
        close();
        return;
      }
      SiriusMessage.error({ content: message });
    } catch (error) {
      console.log('清空草稿邮件失败', error);
      SiriusMessage.error({ content: '清空草稿邮件失败' });
    }
  };

  // 删除版本合集
  const delVersionBatch = async (versions: MailEntryModel[], index: number) => {
    const curCid = versions[0].cid;
    if (curCid) {
      try {
        const delRes = await mailDraftApi.deleteDraftMailByCid(curCid);
        const { success, message } = delRes;
        if (success) {
          delDraftMailByIndex(index);
        } else {
          SiriusMessage.error({ content: message });
        }
      } catch (error) {
        console.log('删除草稿邮件失败', error);
        SiriusMessage.error({ content: '删除草稿邮件失败' });
      }
    }
  };

  // 版本时间
  const versionTime = (version: MailEntryModel) => {
    const { createTime } = version;
    if (!createTime) return '';
    return showConcreteTime ? formatTimeWithHM(createTime) : formatTime(createTime);
  };

  return (
    <div className={styles.unfinishedDrafts}>
      <div className={styles.header}>
        <div className={styles.headerTop}>{getIn18Text('WEIBAOCUNCAOGAOLIEBIAO')}</div>
        <div className={styles.headerBottom}>
          {draftMailArr?.length ? (
            <div className={styles.clearAll} onClick={clearAll}>
              <IconCard className={styles.brush} type="brush" />
              <IconCard className={styles.brushBlue} type="brush" stroke="#4C6AFF" />
              <span style={{ paddingLeft: '4px' }}>{getIn18Text('QINGKONGQUANBU')}</span>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
      {draftMailArr?.length ? (
        <div className={styles.versionBatchList}>
          {draftMailArr.map(({ versions, cid }, index) => (
            <div className={styles.versionBatch} key={cid}>
              <div className={styles.timeLine} />
              {versions && versions[0] && (
                <div className={styles.recentVersion} key={versions[0].draftVersionId}>
                  <div className={styles.circle} />
                  <div className={styles.versionTitle}>{getIn18Text('ZUIJINBANBEN')}</div>
                  <div className={styles.recentVersionDetail}>
                    <div className={styles.recentVersionTop}>
                      <div className={styles.to}>
                        {versions[0].receiver?.length ? <Sender data={versions[0]} extraData={'localDraft'} /> : getIn18Text('WUSHOUJIANREN')}
                      </div>
                      <div className={styles.right}>
                        <div className={styles.versionTime}>{versionTime(versions[0])}</div>
                        <div className={styles.recover} onClick={() => recoverVersion(versions[0])}>
                          {getIn18Text('HUIFU11')}
                        </div>
                      </div>
                    </div>
                    <div className={styles.recentVersionTheme}>
                      <ComSummary data={versions[0]} />
                    </div>
                    <div className={styles.recentVersionContent}>{defaultDescFun({ data: versions[0] }, true)}</div>
                  </div>
                </div>
              )}
              {versions && versions?.length > 1 && (
                <div className={styles.historyVersions}>
                  <div className={styles.circle} />
                  <div className={styles.versionTitle}>{getIn18Text('LISHIBANBEN')}</div>
                  {versions.map((otherVersion, hisIndex) => {
                    return hisIndex > 0 ? (
                      <div className={styles.historyVersionItem} key={otherVersion.draftVersionId}>
                        <div className={styles.versionName}>
                          {getIn18Text('LISHIBANBEN')}
                          {hisIndex}
                        </div>
                        <div className={styles.right}>
                          <div className={styles.versionTime}>{versionTime(otherVersion)}</div>
                          <div className={styles.recover} onClick={() => recoverVersion(otherVersion)}>
                            {getIn18Text('HUIFU11')}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={otherVersion.draftVersionId} style={{ display: 'none' }}></div>
                    );
                  })}
                </div>
              )}

              <div className={styles.versionBatchFooter}>
                <div className={styles.delArea} onClick={() => delVersionBatch(versions, index)}>
                  <IconCard className={`dark-invert ${styles.recycleBin}`} type="recycleBin" />
                  <IconCard className={styles.recycleBinBlue} type="recycleBin" stroke="#4C6AFF" />
                  <span style={{ paddingLeft: '3px' }}>{getIn18Text('SHANCHU')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // 无数据
        <div className={styles.noDataArea}>
          <div className="sirius-empty sirius-empty-doc" style={{ margin: '0 auto' }} />
          <p className={styles.noDataText}>{getIn18Text('ZANWUSHUJU')} </p>
        </div>
      )}
    </div>
  );
};
