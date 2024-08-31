import * as React from 'react';
import { useMemo } from 'react';
import classnames from 'classnames';
import { SnsMarketingPlatform } from 'api';
import FacebookTiny from '../images/FACEBOOK_TINY.svg';
import LinkedInTiny from '../images/LINKEDIN_TINY.svg';
import InstagramTiny from '../images/INSTAGRAM_TINY.svg';
import FacebookOrigin from '../images/FACEBOOK_ORIGIN.svg';
import LinkedInOrigin from '../images/LINKEDIN_ORIGIN.svg';
import InstagramOrigin from '../images/INSTAGRAM_ORIGIN.svg';
import style from './PlatformLogo.module.scss';

const TINY_SRC_MAP: Record<SnsMarketingPlatform, SVGElement> = {
  [SnsMarketingPlatform.FACEBOOK]: FacebookTiny,
  [SnsMarketingPlatform.LINKEDIN]: LinkedInTiny,
  [SnsMarketingPlatform.INSTAGRAM]: InstagramTiny,
};

const ORIGIN_SRC_MAP: Record<SnsMarketingPlatform, SVGElement> = {
  [SnsMarketingPlatform.FACEBOOK]: FacebookOrigin,
  [SnsMarketingPlatform.LINKEDIN]: LinkedInOrigin,
  [SnsMarketingPlatform.INSTAGRAM]: InstagramOrigin,
};

interface PlatformLogoProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number; // 尺寸
  type?: 'origin' | 'tiny'; // 风格，而非尺寸控制
  platform: SnsMarketingPlatform;
}

const PlatformLogo: React.FC<PlatformLogoProps> = props => {
  const { className, style: styleFromProps, size = 30, type = 'tiny', platform } = props;

  const src = useMemo(() => {
    if (type === 'tiny') return TINY_SRC_MAP[platform];
    if (type === 'origin') return ORIGIN_SRC_MAP[platform];

    return null;
  }, [type, TINY_SRC_MAP, ORIGIN_SRC_MAP]);

  if (!src) return null;

  return (
    <img
      className={classnames(style.platformLogo, className)}
      style={{
        ...styleFromProps,
        width: size,
        height: size,
      }}
      src={src as any as string}
    />
  );
};

export default PlatformLogo;
