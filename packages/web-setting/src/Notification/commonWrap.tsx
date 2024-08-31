import React from 'react';
import { apiHolder } from 'api';
import { navigate } from 'gatsby';
import classnames from 'classnames';
import { getBodyFixHeight } from '@web-common/utils/constant';
import styles from './common.module.scss';

const systemApi = apiHolder.api.getSystemApi();
const isWebWmEntry = systemApi.isWebWmEntry();

export const CommonWrap: React.FC<{ title: string }> = ({ children, title }) => {
  return (
    <>
      <div
        className={classnames('ant-allow-dark', styles.settingMenu, {
          [styles.webWmEntry]: isWebWmEntry,
        })}
        style={{ top: getBodyFixHeight(true) }}
      >
        <div className={styles.configTitle}>
          <div className={styles.configTitleName}>{title}</div>
          {!isWebWmEntry && <div onClick={() => navigate(-1)} className={`dark-invert ${styles.configTitleIcon}`} />}
        </div>
        <div className={styles.configContent}>
          <div className={styles.configContentWrap}>{children}</div>
        </div>
      </div>
    </>
  );
};
export default CommonWrap;
