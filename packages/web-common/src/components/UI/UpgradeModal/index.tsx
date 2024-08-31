import React, { useMemo } from 'react';
import { Modal } from 'antd';
import classnames from 'classnames';
import { TongyongGuanbiXian } from '@sirius/icons';
import styles from './index.module.scss';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  contentList: string[];
  showClose?: boolean;
  updateBtn: React.ReactNode;
}

const UpgradeModal: React.FC<Props> = ({ title, updateBtn, contentList, visible, showClose, onClose }) => {
  const _title = title || '发现新版本';
  const _contentList = useMemo(() => (Array.isArray(contentList) && contentList.length > 0 ? contentList : ['若干功能优化']), [contentList]);

  return (
    <Modal
      visible={visible}
      bodyStyle={{ padding: 0 }}
      width={400}
      centered={true}
      closable={false}
      getContainer={() => document.body}
      maskClosable={false}
      className={styles.upgradeModalContainer}
      footer={null}
      destroyOnClose
    >
      <div className={styles.upgradeModal}>
        {showClose ? (
          <div className={styles.close} onClick={onClose}>
            <TongyongGuanbiXian className={styles.closeIcon} />
          </div>
        ) : (
          <></>
        )}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={classnames([styles.logo, process.env.BUILD_ISLINGXI ? styles.logoLingxi : styles.logoWaimao])} />
            <div className={styles.title} title={_title}>
              {_title}
            </div>
          </div>
        </div>
        <div className={styles.main}>
          <div className={styles.mainTitle}>更新内容</div>
          <div className={styles.mainContent}>
            {_contentList.map(v => (
              <div className={styles.contentItem} key={v}>
                <span className={styles.itemIcon} />
                <span className={styles.itemText} title={v}>
                  {v}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.btnGroup}>{updateBtn}</div>
        </div>
      </div>
    </Modal>
  );
};

export default UpgradeModal;
