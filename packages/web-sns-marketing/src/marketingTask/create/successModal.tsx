import { getIn18Text } from 'api';
import React, { useState, useRef, useEffect } from 'react';
import { TongyongChenggongMian } from '@sirius/icons';
import { navigate } from '@reach/router';
import style from './successModal.module.scss';
import { Modal } from 'antd';
import Button from '@web-common/components/UI/Button/button';

export const SuccessModal = (props: { accountNum: number; postNum: number; onOk: () => void }) => {
  const { accountNum, postNum, onOk } = props;
  const [sec, setSec] = useState(5);
  const timerRef = useRef<number>();

  useEffect(() => {
    let count = 5;
    timerRef.current = window.setInterval(() => {
      count--;
      if (count < 0) {
        onOk && onOk();
      }
      setSec(prev => {
        return prev - 1 >= 0 ? prev - 1 : 0;
      });
    }, 1000);

    return () => {
      timerRef.current && clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className={style.successTip}>
      <div className={style.modalTitle}>
        <div style={{ marginBottom: 12 }}>
          <TongyongChenggongMian style={{ fontSize: '42px', color: '#0FD683' }} />
        </div>
        {getIn18Text('CHENGGONGQIYONG')}
      </div>
      <div style={{ margin: '8px 24px 12px' }}>
        {getIn18Text('YICHENGGONGQIYONGYINGXIAO')}
        <a>{sec}</a>
        {getIn18Text('MIAOHOUJIANGZIDONGTIAOZHUAN')}
      </div>
      <div className={style.taskInfo}>
        <div className={style.taskInfoItem}>
          <div className={style.taskInfoTitle}>{getIn18Text('1GEYUE')}</div>
          <div>{getIn18Text('FATIEZHOUQI')}</div>
        </div>
        <div className={style.taskInfoItem}>
          <div className={style.taskInfoTitle}>
            {accountNum}
            {getIn18Text('GE')}
          </div>
          <div>{getIn18Text('SHEMEIZHUYE')}</div>
        </div>
        <div className={style.taskInfoItem}>
          <div className={style.taskInfoTitle}>
            {postNum}
            {getIn18Text('PIAN')}
          </div>
          <div>{getIn18Text('AIZHINENGXIETIESHU')}</div>
        </div>
      </div>
      <div className={style.successTipFooter}>
        <div style={{ marginBottom: 4 }}>
          <em>
            {getIn18Text('JIESHENG')}
            {accountNum}
            {getIn18Text('GEYUNYINGRENYUANYUE1')}
          </em>
        </div>
        {getIn18Text('GAITUOGUANRENWUBISHOU')}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button btnType="primary" onClick={onOk} style={{ marginTop: 24 }}>
          {getIn18Text('LIJITIAOZHUANYINGXIAOREN')}
        </Button>
      </div>
    </div>
  );
};

export const showSuccessModal = (accountNum: number, postCount: number) => {
  const onOk = () => {
    navigate('#site?page=snsMarketingTask');
    modal.destroy();
  };
  const modal = Modal.success({
    okText: getIn18Text('LIJITIAOZHUANYINGXIAOREN'),
    onOk,
    className: style.successModalWrap,
    content: <SuccessModal accountNum={accountNum} postNum={postCount} onOk={onOk} />,
  });
};
