import React, { useState, useEffect, useCallback } from 'react';
import classnames from 'classnames';
import { apiHolder as api, apis, SystemApi, MailPraiseApi, PersonMedalDetailInfo, DataTrackerApi, inWindow } from 'api';
import PersonPraiseMedal from '@web-mail/components/PersonPraiseMedal';
import { ContactDetailProps } from './data';
import styles from './detail.module.scss';
import { ReactComponent as IconArrowRight } from '@/images/icons/arrow-right.svg';
import { getIn18Text } from 'api';
interface Props {
  from: string; // contact other
  contact: ContactDetailProps['contact'];
}
const mailPraiseApi = api.api.requireLogicalApi(apis.mailPraiseApiImpl) as MailPraiseApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const MedalInfo: React.FC<Props> = props => {
  const { from, contact } = props;
  const [personMedalData, setPersonMedalData] = useState<PersonMedalDetailInfo[] | null>(null);
  const [showMedalData, setShowMedalData] = useState<PersonMedalDetailInfo[] | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [toIndex, setToIndex] = useState(0);
  const accountId = contact?.contact.id;
  const isEnLang = inWindow() && window.systemLang === 'en';
  const wordSeparator = isEnLang ? ' ' : '';
  useEffect(() => {
    if (accountId) {
      (async () => {
        const response = await mailPraiseApi.getPersonMedalDetail(accountId);
        if (response.data) {
          setPersonMedalData(response.data.medals);
        } else {
          setPersonMedalData(null);
        }
      })();
    }
  }, [accountId]);
  // 产品逻辑：contact ==> 展示6个 other ==> 展示5个
  useEffect(() => {
    if (personMedalData) {
      setShowMedalData(personMedalData.slice(0, from === 'contact' ? 6 : 5));
    }
  }, [personMedalData]);
  const allCounts = useCallback(() => {
    return personMedalData?.reduce((pre, cur) => {
      return pre + cur.count;
    }, 0);
  }, [personMedalData]);
  const goToPersonMedal = (index = 0) => {
    setToIndex(index);
    setModalVisible(true);
    trackApi.track('pcContact_click_contactsDetailPage_seeTheMedal');
  };
  const handleCancel = () => {
    setModalVisible(false);
  };

  const praiseOwner = systemApi.getCurrentUser()?.contact?.contact.id === accountId;
  const xunZhangCountTxt = isEnLang ? `${allCounts()} ${getIn18Text('XUNZHANG')}` : `${getIn18Text('XUNZHANG')}${allCounts()}${getIn18Text('MEI')}`;
  if (showMedalData) {
    return (
      <div className={classnames(styles.detailMedalContainer, { [styles.detailMedalOtherContainer]: from !== 'contact' })}>
        <div className={styles.medalInfoWrap}>
          {from === 'contact' ? <div className={styles.medalInfo}>{getIn18Text('XUNZHANG')}</div> : null}
          <div className={styles.medalList}>
            {showMedalData
              ? showMedalData.map((medal, index) => {
                  return (
                    <div
                      className={styles.medalItem}
                      key={medal.id}
                      onClick={() => {
                        goToPersonMedal(index);
                      }}
                    >
                      <img src={medal.count > 0 ? medal.imageUrl : medal.grayImageUrl} alt="" />
                    </div>
                  );
                })
              : null}
          </div>
        </div>
        <div
          className={styles.countInfo}
          onClick={() => {
            goToPersonMedal();
          }}
        >
          {xunZhangCountTxt}
          <IconArrowRight />
        </div>
        {personMedalData && modalVisible && (
          <PersonPraiseMedal
            {...{
              personMedalData,
              isModalVisible: modalVisible,
              from,
              toIndex,
              handleCancel,
              praiseOwner,
            }}
          />
        )}
      </div>
    );
  }
  return null;
};
export default MedalInfo;
