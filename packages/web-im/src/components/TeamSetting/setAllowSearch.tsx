import React, { useState } from 'react';
import { Switch } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import CheckCircleFilled from '@ant-design/icons/CheckCircleFilled';
import { apiHolder, apis, IMTeamApi } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import styles from './teamSetting.module.scss';
import ChatForward from '../../subcontent/chatDisplay/chatForward';
import { ReactComponent as CheckedCircleIcon } from '@/images/icons/checked_circle.svg';
import { ReactComponent as CloseCircleIcon } from '@/images/icons/close_circle.svg';
import { getIn18Text } from 'api';
const imHttpApi = apiHolder.api.requireLogicalApi(apis.imTeamApiImpl) as unknown as IMTeamApi;
export interface TeamSetSticktopProps {
  teamName: string | null;
  teamId: string;
  allowSearch: boolean;
}
export const TeamSetAllowSearch: React.FC<TeamSetSticktopProps> = props => {
  const { teamName, teamId, allowSearch = false } = props;
  const [visibleForward, setVisibleForward] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const sendText = `“${teamName || getIn18Text('GAIQUN')}”的群号为${teamId}，可通过搜索群号加入该群组`;
  // 群号搜索功能
  const toggleAllowSearch = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    // 通过接口打开和关闭该功能
    if (allowSearch) {
      const result = await imHttpApi.toggleTeamPublic({
        tid: teamId,
        public_team: false,
      });
      const err = !result?.success;

      if (err) {
        message.error({
          content: <span className={styles.settingToastText}>{err ? getIn18Text('QINGSHAOHOUZHONGSHI') : getIn18Text('YIGUANBISOUSUO')}</span>,
        });
      } else {
        message.success({
          content: <span className={styles.settingToastText}>{err ? getIn18Text('QINGSHAOHOUZHONGSHI') : getIn18Text('YIGUANBISOUSUO')}</span>,
        });
      }
    } else {
      const result = await imHttpApi.toggleTeamPublic({
        tid: teamId,
        public_team: true,
      });
      if (result?.success) {
        Modal.confirm({
          title: sendText,
          icon: <CheckCircleFilled />,
          okText: getIn18Text('FASONGDAOHUIHUA'),
          className: styles.settingSucModal,
          cancelText: getIn18Text('QUXIAO'),
          centered: true,
          onOk: () => {
            setVisibleForward(true);
          },
        });
      } else {
        message.success({
          icon: <CloseCircleIcon />,
          content: <span className={styles.settingToastText}>{getIn18Text('QINGSHAOHOUZHONGSHI')}</span>,
        });
      }
    }
    setLoading(false);
  };
  return (
    <>
      <div className={`${styles.settingItem} ${styles.settingItemOpen}`}>
        <div>
          <p className={styles.settingLabel}>{getIn18Text('YUNXUTONGGUOSOU')}</p>
          <p className={styles.settingDesc}>{getIn18Text('KAIQIHOU\uFF0C ')}</p>
        </div>
        <Switch
          checked={allowSearch}
          onClick={() => {
            toggleAllowSearch();
          }}
        />
        {visibleForward && <ChatForward msgs={{ text: sendText }} type="sendText" onVisibleChange={setVisibleForward} />}
      </div>
      {allowSearch && (
        <div className={styles.settingItem}>
          <div className={styles.settingLeft}>
            <span className={styles.settingIcon} />
            <p className={styles.settingLabel}>{getIn18Text('QUNHAO')}</p>
          </div>
          <div className={styles.settingLabel}>{teamId}</div>
        </div>
      )}
    </>
  );
};
