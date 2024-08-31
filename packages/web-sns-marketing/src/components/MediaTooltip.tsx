import { getIn18Text, SnsMarketingMediaType } from 'api';
import React from 'react';
import { POST_RULE } from '../utils/rules';
import { Tooltip } from 'antd';
import { ReactComponent as TipIcon } from '@web-sns-marketing/images/tip.svg';
import { formatFileSize } from '@web-common/utils/file';
import { getRules } from './MediaList';
import style from './MediaTooltip.module.scss';

interface MediaTooltipProps {
  className?: string;
  mediaType?: SnsMarketingMediaType;
}

const MediaTooltip: React.FC<MediaTooltipProps> = props => {
  const { className, mediaType = SnsMarketingMediaType.IMAGE } = props;
  const { maxCount, maxSize, types } = getRules(mediaType);
  return (
    <Tooltip
      overlayClassName={style.mediaTooltip}
      title={
        <>
          {mediaType === SnsMarketingMediaType.IMAGE ? getIn18Text('TUPIANGESHI：ZHICHI') : '视频格式：'}
          {types.map(item => item.toUpperCase()).join('、')}
          {mediaType === SnsMarketingMediaType.IMAGE ? getIn18Text('GESHI') : ''}
          <br />
          {mediaType === SnsMarketingMediaType.IMAGE ? getIn18Text('TUPIANDAXIAO：XIAOYU') : `视频限制：${POST_RULE.videoMinDuration}s到${POST_RULE.videoMaxDuration}s`}
          {mediaType === SnsMarketingMediaType.IMAGE ? formatFileSize(maxSize, 1024) : ''}
          <br />
          {mediaType === SnsMarketingMediaType.IMAGE ? getIn18Text('TUPIANSHULIANG：ZUIDUO') : '视频大小：不大于'}
          {mediaType === SnsMarketingMediaType.IMAGE ? maxCount : formatFileSize(maxSize, 1024)}
          {mediaType === SnsMarketingMediaType.IMAGE ? getIn18Text('ZHANG') : ''}
        </>
      }
    >
      <TipIcon className={className} />
    </Tooltip>
  );
};

export default MediaTooltip;
