import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { api, DataStoreApi, ResNotice } from 'api';

import { ReactComponent as InfoIcon } from '@/images/icons/edm/global-notice-info.svg';
import { ReactComponent as CloseIcon } from '@/images/icons/edm/global-notice-close.svg';
import style from './notice.module.scss';

const dataStoreApi = api.getDataStoreApi() as DataStoreApi;
const systemApi = api.getSystemApi();
const isWeb = systemApi.isWebWmEntry();

const KEY = 'emdNotice';

export const Notice: React.FC<{
  notice?: ResNotice | null;
  className?: string;
}> = ({ notice, className }) => {
  const [showTip, setShowTip] = useState(true);
  useEffect(() => {
    if (!notice) {
      return;
    }
    dataStoreApi.get(KEY).then(({ data }) => {
      if (!data) {
        setShowTip(true);
      }
      try {
        const json = JSON.parse(data as string);
        if (json) {
          return setShowTip(json[notice.id] !== false);
        }
      } catch (e) {
        setShowTip(true);
      }
    });
  }, [notice]);

  const closeThisNotice = () => {
    setShowTip(false);
    if (notice) {
      dataStoreApi.get(KEY).then(({ data }) => {
        let map: Record<string, boolean> = {};
        try {
          if (data) {
            map = JSON.parse(data as string) || {};
          }
        } finally {
          map[notice.id] = false;
          dataStoreApi.putSync(KEY, JSON.stringify(map), {
            noneUserRelated: false,
          });
        }
      });
    }
  };

  if (!showTip || !notice) {
    return null;
  }
  return (
    <div
      className={classnames(style.alertInfo, className, {
        [style.isWeb]: isWeb,
      })}
    >
      <span
        style={{
          display: 'block',
          height: '24px',
        }}
      >
        <InfoIcon className={style.infoIcon} />
      </span>
      <span>{notice?.content}</span>
      {notice?.closeable && (
        <span className={classnames('sirius-no-drag', style.closeIconWrapper)} onClick={closeThisNotice}>
          <CloseIcon />
        </span>
      )}
    </div>
  );
};
