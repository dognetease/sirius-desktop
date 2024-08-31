import React, { useState } from 'react';
import SiriusModal from '../../../../../../../web-common/src/components/UI/Modal/SiriusModal';
import { useMainLandIpHook } from './useMainLandIpHook';

type TipType = 'instagram' | 'linkedin';

interface SocailMediaLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  tipType?: TipType | null;
  disableOpen?: boolean;
}

export const autoDetect: (url: string) => TipType | null = url => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.endsWith('instagram.com')) {
      return 'instagram';
    } else if (urlObj.hostname.endsWith('linkedin.com')) {
      return 'linkedin';
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

const SocailMediaLink: React.FC<SocailMediaLinkProps> = ({ tipType, onClick, disableOpen = false, ...rest }) => {
  const [clicking, setClicking] = useState<boolean>(false);
  const { showTip, close } = useMainLandIpHook(tipType === 'linkedin');
  const openHref = () => {
    !disableOpen && typeof window !== undefined && window.open(rest.href, '_blank', 'noreferrer');
  };
  const handleShowTip = async (tipType: TipType) => {
    if (tipType === 'instagram') {
      SiriusModal.info({
        title: '请先登录Instagram账号',
        content: '登录后才可以正常访问页面，否则将无法打开网页内容。',
        okCancel: false,
        onOk: openHref,
        okText: '我知道了',
      });
    } else if (tipType === 'linkedin' && showTip()) {
      SiriusModal.info({
        title: '温馨提示',
        content: (
          <>
            <p>检测到您的IP属于中国大陆地区，可能无法使用LinkedIn国际版的相关功能，如需使用LinkedIn国际版功能，可尝试以下方式：</p>
            <p>1.网络代理开启全局代理</p>
            <p>2.调整浏览器语言为英语</p>
            <p>3.清除浏览器cookies或使用无痕浏览</p>
          </>
        ),
        okCancel: false,
        onOk: openHref,
        okText: '我知道了',
        afterClose: close,
      });
    } else {
      openHref();
    }
  };
  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = async evt => {
    if (clicking) {
      return;
    }
    onClick?.(evt);
    setClicking(true);
    if (tipType) {
      evt.preventDefault();
      await handleShowTip(tipType);
    }
    setClicking(false);
  };
  return <a onClick={handleClick} {...rest} />;
};

export default SocailMediaLink;
