import React, { FC, useCallback, useState } from 'react';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { GlobalSearchCompanyDetail, getIn18Text } from 'api';
import { ReactComponent as FeedbackIcon } from '../assets/feedback.svg';
import style from './companyDetail.module.scss';
import { globalSearchApi } from '../constants';
import { FeedbackModal } from './feedbackModal';

export const Feedback: FC<{
  data?: GlobalSearchCompanyDetail;
  origin: string;
  poisition?: boolean;
}> = ({ data, origin, poisition }) => {
  const [feedbackList, setFeedbackList] = useState<
    Array<{
      errorName: string;
      errorType: string;
    }>
  >([]);
  const [feedbackVisible, setFeedbackVisible] = useState<boolean>(false);
  const handleFeedback = useCallback(
    async params => {
      await globalSearchApi.globalFeedbackReportAdd({
        ...params,
        origin,
        companyId: data?.companyId || '',
      });
      SiriusMessage.success('感谢你的反馈，我们将尽快处理错误数据');
    },
    [origin, data]
  );
  const onClose = useCallback(() => {
    setFeedbackVisible(false);
  }, []);
  const sendFeedback = useCallback(async () => {
    if (feedbackList.length === 0) {
      const res = await globalSearchApi.globalFeedbackTypeQuery();
      setFeedbackList(res ?? []);
      if (res?.length <= 0) return;
    }
    setFeedbackVisible(true);
  }, [feedbackList]);
  return (
    <>
      <Button btnType="link" onClick={sendFeedback} className={style.feedback} style={{ bottom: poisition ? '295px' : '20px' }}>
        <FeedbackIcon />
        <span>{getIn18Text('SHUJUWENTIFANKUI')}</span>
      </Button>
      <FeedbackModal visible={feedbackVisible} feedbackList={feedbackList} setVisible={onClose} submitReport={handleFeedback} />
    </>
  );
};
