import * as React from 'react';
import { useMemo } from 'react';
import classnames from 'classnames';
import { SnsImPlatform } from '../types';
import DefaultAvatar from '../icons/default-avatar.svg';
import { ReactComponent as AvatarClose } from '../icons/avatar-close.svg';
import FacebookLogo from '../icons/FACEBOOK_TINY.svg';
import LinkedInLogo from '../icons/LINKEDIN_TINY.svg';
import InstagramLogo from '../icons/INSTAGRAM_TINY.svg';
import style from './Avatar.module.scss';

const PLATFORM_MAP: Record<SnsImPlatform, SVGElement> = {
  [SnsImPlatform.FACEBOOK]: FacebookLogo,
  [SnsImPlatform.LINKEDIN]: LinkedInLogo,
  [SnsImPlatform.INSTAGRAM]: InstagramLogo,
};

interface AvatarProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
  avatar?: string;
  avatarBorderColor?: string;
  platform?: SnsImPlatform;
  platformBorderColor?: string;
  platformScale?: number;
  closable?: boolean; // 是否有关闭功能
  closeAppear?: 'always' | 'hover'; // 关闭功能何时可见，常驻或划过时
  onClose?: () => void;
  [propName: string]: any;
}

const Avatar: React.FC<AvatarProps> = props => {
  const {
    className,
    style: styleFromProps,
    size = 72,
    avatar,
    avatarBorderColor = '#F6F7FA',
    platform,
    platformBorderColor = '#FFFFFF',
    platformScale = 1,
    closable,
    closeAppear = 'hover',
    onClose,
    ...restProps
  } = props;

  // 以下 avatarSize, platformSize, borderWidth 由其所占外容器 (72px) 的比例计算得到
  const avatarSize = Math.round(size * 0.9524); // 68.57 / 72 = 0.9524

  const platformSize = Math.round(size * 0.3889 * platformScale); // 28 / 72 = 0.3889

  const borderWidth = useMemo(() => {
    let width = size * 0.028; // 2 / 72 = 0.028

    width = Math.min(2, width);
    width = Math.max(0.5, width);

    return width < 1 ? 0.5 : Math.round(width);
  }, [size]);

  return (
    <div
      className={classnames(className, style.avatar, {
        [style.closeAlways]: closeAppear === 'always',
      })}
      style={{
        ...styleFromProps,
        width: size,
        height: size,
      }}
      {...restProps}
    >
      <img
        className={style.avatarInner}
        style={{
          width: platform ? avatarSize : size,
          height: platform ? avatarSize : size,
          border: `${borderWidth}px solid ${avatarBorderColor}`,
        }}
        src={avatar || DefaultAvatar}
      />
      {platform && (
        <img
          className={style.platform}
          style={{
            width: platformSize,
            height: platformSize,
            border: `${borderWidth}px solid ${platformBorderColor}`,
            objectFit: 'cover',
          }}
          src={PLATFORM_MAP[platform] as any as string}
        />
      )}
      {closable && <AvatarClose className={style.close} onClick={onClose} />}
    </div>
  );
};

export default Avatar;
