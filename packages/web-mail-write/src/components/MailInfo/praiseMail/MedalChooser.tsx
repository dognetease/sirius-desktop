import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import classnames from 'classnames';
import { apiHolder as api, apis, MailApi, MedalInfo } from 'api';
import CloseIcon from '@web-common/components/UI/Icons/svgs/CloseMailSvg';
import styles from './praiseMail.module.scss';
import { getIn18Text } from 'api';
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
interface Props {
  visible: boolean;
  chosenMedal?: MedalInfo;
  onCancel: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  chooseMedal: (medalId: number) => void;
}
const MedalChooser: React.FC<Props> = ({ visible, chosenMedal, chooseMedal, onCancel }) => {
  const [medals, setMedals] = useState<MedalInfo[]>([]);
  useEffect(() => {
    mailApi.doGetPraiseMedals().then(setMedals);
  }, []);
  const select = (medalId: number) => {
    chooseMedal(medalId);
  };
  return (
    <Modal title={null} closable={false} width={522} wrapClassName="medal-chooser" visible={visible} onCancel={onCancel} footer={null} getContainer={() => document.body}>
      <div className={styles.medalBox}>
        <div className={styles.header}>
          <div className={styles.title}>{getIn18Text('XUANZEXUNZHANG')}</div>
          <div className={styles.closeButton} onClick={onCancel}>
            <CloseIcon />
          </div>
          <div className={styles.desc}>{getIn18Text('LAJINWOMENZHI')}</div>
        </div>
        <div className={styles.medalList}>
          {medals.map(medal => (
            <div
              className={classnames([styles.medalItem], {
                [styles.selected]: chosenMedal?.id === medal.id,
              })}
              key={medal.name}
              onClick={() => select(medal.id)}
            >
              <div className={styles.medalImg}>
                <img alt={medal.name} src={medal.imageUrl} />
              </div>
              <div className={styles.medalInfo}>
                <div className={styles.medalName}>{medal.name}</div>
                <div className={styles.medalDesc}>{medal.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
export default MedalChooser;
