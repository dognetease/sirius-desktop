import React, { useState, useRef, useLayoutEffect, useEffect, useMemo } from 'react';
import { getCharAvatar } from '@web-contact/util';
import { useContactAvatar, useContactModel } from '@web-common/hooks/useContactModel';
import { ReactComponent as IconAvatarSelected } from '@/images/icons/account_setting_avatar_selected.svg';
import { useAppDispatch, ContactActions } from '@web-common/state/createStore';
import styles from './avatar.module.scss';

// 图片失败加载三次
const IMG = props => {
  const { onError, ...rest } = props;
  // 加载成功
  const loadFn = e => {
    const el = e.target;
    el.style.display = 'block';
    el.style.opacity = 1;
  };
  // 加载失败
  const errorFn = e => {
    const el = e.target;
    el.style.opacity = 0;
    const imgUrl = new URL(el.src);
    if (imgUrl.searchParams.has('retry')) {
      const retry = imgUrl.searchParams.get('retry') as string;
      if (+retry < 3) {
        setTimeout(() => {
          imgUrl.searchParams.set('retry', +retry + 1 + '');
          el.src = imgUrl.href;
        }, 500);
      } else {
        // 如果图片加载三次失败
        // 1图片隐藏
        el.style.display = 'none';
        // 2.调用错误回调
        onError && onError();
      }
    } else {
      imgUrl.searchParams.set('retry', '1');
      el.src = imgUrl.href;
    }
  };
  return (
    <img
      onLoad={e => {
        loadFn(e);
      }}
      onError={e => {
        errorFn(e);
      }}
      {...rest}
    />
  );
};

interface AvatarParams {
  name?: string;
  avatar?: string;
  email?: string;
  color?: string;
  logcAvatar?: string;
}

interface Style {
  backgroundImage?: string;
  fontSize?: number;
  backgroundColor?: string;
  width?: string;
  height?: string;
  transform?: string;
}

const BASE_FONT_SIZE = 18;
const BASE_WRAP_SIZE = 32;

interface Prop {
  user?: AvatarParams;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  innerStyle?: React.CSSProperties;
  onClick?: Function;
  hasHover?: Boolean;
  cameraStyle?: React.CSSProperties;
  propEmail?: string; // 获取contact用到，如果没传递就使用contactId
  contactId?: string; // 获取contact用到，如果没传递则不需要挂饰
  showPendant?: Boolean; // 控制是否展示头像挂饰，默认true
  showAccountSelected?: boolean;
  avatarImg?: React.ReactElement;
  testId?: string;
  showAvatarFirst?: boolean;
}

const AvatarTag: React.FC<Prop> = ({
  user,
  size = '100%',
  children,
  className,
  style,
  cameraStyle,
  innerStyle: propInnerStyle,
  onClick,
  hasHover,
  showPendant = true,
  contactId,
  propEmail,
  showAccountSelected = false,
  avatarImg,
  testId = '',
  // 是否优先展示头像
  showAvatarFirst = true,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [elWidth, setElWidth] = useState(BASE_WRAP_SIZE);
  // 如果都为空
  if (!user && !contactId && !propEmail) {
    return <div />;
  }
  const model = useContactModel({ contactId, name: user?.name, email: propEmail, useCompositeQuery: true });
  // useUpdateContactModel({ contactId, email: propEmail, model });
  const { avatar, avatarTxt, color, avatarPendant } = useContactAvatar({
    email: propEmail,
    contactId,
    emailTxt: user?.email,
    name: user?.name,
    color: user?.color,
    avatar: user?.avatar,
    logcAvatar: user?.logcAvatar,
    model,
    showAvatarFirst,
  });

  // const dispatch=useAppDispatch()
  // // 判断redux中是否有数据 如果没有数据的话 进行数据同步
  // const contactSourceRef=useRef<'prop'|'redux'|undefined>()
  // const contactIdRef=useRef<string>();
  // useEffect(()=>{
  //   contactIdRef.current=contactId
  // },[contactId])
  // useEffect(()=>{
  //   contactSourceRef.current=source
  //   const t=setTimeout(()=>{
  //     if(contactSourceRef.current==='prop' && typeof contactIdRef.current==='string' && contactIdRef.current.length){
  //       dispatch(doGetContactListByIdsInMemory([contactId!]))
  //     }

  //   },10)
  //   return ()=>{
  //     t && clearTimeout(t)
  //   }

  // },[source])

  // const [innerStyle, setInnerStyle] = useState<Style>({ fontSize: BASE_FONT_SIZE });
  const showName = avatarImg || getCharAvatar(avatarTxt);
  const innerStyle = useMemo(
    () => {
      const logcInnerStyle: any = { fontSize: BASE_FONT_SIZE };
      if (avatar) {
        logcInnerStyle.backgroundColor = '#ffffff';
        logcInnerStyle.width = '100%';
        logcInnerStyle.height = '100%';
      } else {
        logcInnerStyle.backgroundColor = color;
        if (size === '100%') {
          const scale = elWidth / BASE_WRAP_SIZE;
          logcInnerStyle.transform = `scale(${scale > 0 ? scale : 1})`;
        } else {
          const scale = Number(size) / 32;
          logcInnerStyle.transform = `scale(${!Number.isNaN(scale) && scale > 0 ? scale : 1})`;
        }
      }
      if (avatarTxt.length > 1) {
        logcInnerStyle.fontSize = BASE_FONT_SIZE - 6;
      }
      // setInnerStyle(logcInnerStyle);
      return logcInnerStyle;
    },
    // 这里的依赖数组，尽量取 EffectCallback函数里面用到的 尽量是基本数据类型
    // 否则可能存在过度重复渲染的问题 造成元素闪动
    [size, avatar, color, avatarTxt, elWidth]
  );

  useLayoutEffect(() => {
    if (size === '100%') {
      setElWidth(ref.current ? ref.current.offsetWidth : BASE_WRAP_SIZE);
    }
  }, [size]);

  const clickAvatarTag = (e: any) => {
    onClick && onClick(e);
  };

  // 头像使用img
  const avatarDom = !avatar ? (
    showName
  ) : (
    <>
      <IMG
        onError={() => {
          imgError();
        }}
        src={avatar}
        style={{ width: '100%', height: '100%', float: 'left' }}
        alt={showName}
      />
      {showName}
    </>
  );

  const [errorInnerStyle, setErrorInnerStyle] = useState({});
  // 头像加载失败
  const imgError = () => {
    let transform;
    if (size === '100%') {
      const scale = elWidth / BASE_WRAP_SIZE;
      transform = `scale(${scale > 0 ? scale : 1})`;
    } else {
      const scale = Number(size) / 32;
      transform = `scale(${!Number.isNaN(scale) && scale > 0 ? scale : 1})`;
    }
    setErrorInnerStyle({
      width: BASE_WRAP_SIZE + 'px',
      height: BASE_WRAP_SIZE + 'px',
      transform,
      backgroundColor: color,
    });
  };

  return (
    <div className={className} style={{ ...style, width: size, height: size }} ref={ref} data-test-id={testId} onClick={clickAvatarTag}>
      <div className={`${styles.avatarTagWrap} ${hasHover ? styles.hasHover : ''}`}>
        {/* 遮罩层 */}
        {hasHover && (
          <div className={styles.hoverBg}>
            <div className={styles.camera} style={{ ...cameraStyle }} />
          </div>
        )}
        <div className={`${styles.avatarTag} ${showAccountSelected ? styles.avatarTagGreenBorder : ''}`} style={{ ...innerStyle, ...propInnerStyle, ...errorInnerStyle }}>
          {/* eslint-disable-next-line no-nested-ternary */}
          {children ? <div className={styles.childrenWrap}>{children}</div> : avatarDom}
        </div>
        {/* 头像挂饰,如果控制展示并且存在url则展示 */}
        {showPendant && avatarPendant && <IMG className={styles.avatorPendant} src={avatarPendant} alt="" />}
        {showAccountSelected && (
          <span className={styles.avatarSelectedIcon}>
            <IconAvatarSelected />
          </span>
        )}
      </div>
    </div>
  );
};

export default AvatarTag;
