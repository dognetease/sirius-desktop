import React, { useEffect, useState } from 'react';
import { Radio, Tooltip } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { apiHolder as api, getIn18Text, DataStoreApi } from 'api';
import classnamesBind from 'classnames/bind';
import styles from '../../index.module.scss';
import { ReactComponent as IconWarn } from '@/images/icons/icon-warn.svg';
import { ANCHOR_ID_MAP } from '../MailSetting/DefaultMailSettingConfig';

const storeApi: DataStoreApi = api.api.getDataStoreApi();
const realStyle = classnamesBind.bind(styles);

import { isMac } from '@web-mail/util';

const ReplyForwardClose: React.FC<any> = () => {
  const [replyForwardClose, setReplyForwardClose] = useState<boolean>(false);

  const handleReplyForwardCloseChanged = (val: RadioChangeEvent) => {
    const replyForwardClose = val.target.value;
    setReplyForwardClose(replyForwardClose);
    storeApi.putSync('replyForwardClose', replyForwardClose ? 'true' : 'false', { noneUserRelated: true });
  };

  useEffect(() => {
    const replyForwardCloseData = storeApi.getSync('replyForwardClose', { noneUserRelated: true }).data;
    // 未设置
    if (!replyForwardCloseData) {
      // mac 默认不关闭
      if (isMac()) {
        setReplyForwardClose(false);
        return;
      }
      // win 默认关闭
      setReplyForwardClose(true);
      return;
    }
    // 设置了
    setReplyForwardClose(replyForwardCloseData === 'true');
  }, []);

  return (
    <>
      {/* 回复/转发邮件时是否关闭原读信页 */}
      <div className={realStyle('configModuleItem')}>
        <div id={ANCHOR_ID_MAP.COMMON_REPLY_FORWARD_CLOSE} className={realStyle('configModuleItemTitle')}>
          {getIn18Text('HUIFU/ZHUANFAYJSSFGBYDXY')}
          <Tooltip overlayStyle={{ maxWidth: '350px' }} placement="right" title="此设置项仅在【普通模式】下回复/转发邮件时生效，在【按主题聚合】模式下无法使用">
            <IconWarn style={{ cursor: 'pointer', marginLeft: '4px' }} />
          </Tooltip>
        </div>
        <div className={styles.configContentCheckbox}>
          <Radio.Group value={replyForwardClose} onChange={handleReplyForwardCloseChanged}>
            <Radio value={true}>{getIn18Text('GUANBI')}</Radio>
            <Radio value={false}>{getIn18Text('BUGUANBI')}</Radio>
          </Radio.Group>
        </div>
      </div>
    </>
  );
};

export default ReplyForwardClose;
