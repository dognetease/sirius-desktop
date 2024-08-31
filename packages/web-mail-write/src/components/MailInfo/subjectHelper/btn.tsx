import React, { useRef, LegacyRef } from 'react';
import { getIn18Text } from 'api';
import { Dropdown, Menu } from 'antd';
import TaskMailBtn from '../taskMail/TaskMailBtn';
import PraiseMailBtn from '../praiseMail/PraiseMailBtn';
import styles from './btn.module.scss';
import { TongyongGengduo, TongyongJiazai } from '@sirius/icons';
import aiPolishIcon from '@/images/mail/ai_polish.png';
import { ReactComponent as HelperIcon } from '@/images/icons/edm/yingxiao/ai-add2.svg';
import classnames from 'classnames';

interface IBtnRef {
  click: () => void;
}

export const AiPolishBtn = (props: { loading?: boolean; onClick: () => void }) => {
  const { loading, onClick } = props;
  return (
    <div
      className={classnames(styles.btnWrap, styles.aiPolishBtn, {
        [styles.disabled]: loading,
      })}
      onClick={onClick}
    >
      <img src={aiPolishIcon} className={styles.icon} />
      <div className={styles.txt}>{getIn18Text('AIRUNSEZHUT')}</div>
      {loading ? <TongyongJiazai className={classnames(styles.icon, styles.loadingIcon, 'sirius-spin')} wrapClassName={styles.iconWrap} /> : null}
    </div>
  );
};

export const HelperBtn = (props: { onClick: () => void; innerRef: LegacyRef<HTMLDivElement> }) => {
  return (
    <div ref={props.innerRef} className={classnames(styles.btnWrap, styles.helperBtn)} onClick={props.onClick}>
      <HelperIcon className={styles.icon} />
      <div className={styles.txt}>{getIn18Text('ZHUTINEIRONGZHUS')}</div>
    </div>
  );
};

export const BtnDivider = () => {
  return <div className={styles.dividerWrap} />;
};

export const SubjectOtherBtn = () => {
  const taskMailBtnRef = useRef<IBtnRef>(null);
  const praiseMailBtnRef = useRef<IBtnRef>(null);

  const handleSelectItem = (key: 'taskMail' | 'praiseMail') => {
    if (key === 'taskMail') {
      taskMailBtnRef.current?.click();
    }
    if (key === 'praiseMail') {
      praiseMailBtnRef.current?.click();
    }
  };

  return (
    <>
      <Dropdown
        overlay={
          <Menu
            onClick={item => {
              if (item.key === 'taskMail') {
                handleSelectItem('taskMail');
              } else if (item.key === 'praiseMail') {
                handleSelectItem('praiseMail');
              }
            }}
          >
            <Menu.Item key="taskMail">{getIn18Text('RENWUYOUJIAN')}</Menu.Item>
            <Menu.Item key="praiseMail">{getIn18Text('BIAOYANGXIN')}</Menu.Item>
          </Menu>
        }
      >
        <div className={styles.otherBtn}>
          <TongyongGengduo className={styles.icon} wrapClassName={styles.iconWrap} />
        </div>
      </Dropdown>
      <TaskMailBtn hidden ref={taskMailBtnRef} />
      <PraiseMailBtn hidden ref={praiseMailBtnRef} />
    </>
  );
};
