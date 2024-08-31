import React, { useCallback, useEffect, useRef, useState } from 'react';
import './MailMultOperPanel.scss';

enum FOLDER_STATE {
  INIT = 'mop-floder-init',
}

const FolderLogo: React.FC<any> = props => {
  const { sum = 0 } = props;

  const [wrapClassName, setWrapCalssName] = useState('mop-floder-one');

  useEffect(() => {
    if (sum < 3) {
      if (sum <= 1) {
        setWrapCalssName('mop-floder-one');
      } else if (sum == 2) {
        setWrapCalssName('mop-floder-two');
      }
    } else if (sum % 2 == 1) {
      setWrapCalssName('mop-floder-three');
    } else {
      setWrapCalssName('mop-floder-four');
    }
  }, [sum]);

  return (
    <div className={`folder-svg-warp ${wrapClassName}`}>
      <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="70" cy="70" r="70" fill="white" />
        <path
          d="M57.9071 30H30.0001C26.8441 30 24.2858 32.5584 24.2858 35.7143V104.286C24.2858 107.442 26.8441 110 30.0001 110H110C113.156 110 115.714 107.442 115.714 104.286V42.8139C115.714 39.6579 113.156 37.0996 110 37.0996H71.5282C70.3397 37.0996 69.1809 36.729 68.2129 36.0395L61.2225 31.0601C60.2545 30.3705 59.0956 30 57.9071 30Z"
          fill="#386EE7"
        />
        <g filter="url(#filter0_d)" className="three">
          <rect x="32" y="41" width="77.1429" height="54.2857" rx="2.85714" fill="white" />
        </g>
        <g filter="url(#filter0_d)" className="two">
          <rect x="32" y="41" width="77.1429" height="54.2857" rx="2.85714" fill="white" />
        </g>
        <g filter="url(#filter0_d)" className="one">
          <rect x="32" y="41" width="77.1429" height="54.2857" rx="2.85714" fill="white" />
        </g>
        <g filter="url(#filter1_bi)">
          <path
            d="M14.8896 56.2194C14.575 54.4673 15.9217 52.8572 17.7018 52.8572H122.298C124.078 52.8572 125.425 54.4673 125.11 56.2194L115.874 107.648C115.629 109.009 114.445 110 113.061 110H26.9386C25.5555 110 24.371 109.009 24.1265 107.648L14.8896 56.2194Z"
            fill="#D4E5FF"
            fillOpacity="0.6"
          />
        </g>
        <defs>
          <filter id="filter0_d" x="26.2857" y="41" width="88.5714" height="65.7143" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feOffset dy="5.71429" />
            <feGaussianBlur stdDeviation="2.85714" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.04474 0 0 0 0 0.244417 0 0 0 0 0.700282 0 0 0 1 0" />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
          </filter>
          <filter id="filter1_bi" x="9.12959" y="47.1429" width="121.741" height="68.5714" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feGaussianBlur in="BackgroundImage" stdDeviation="2.85714" />
            <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur" result="shape" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feOffset dy="1.14286" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.693055 0 0 0 0 0.787119 0 0 0 0 1 0 0 0 1 0" />
            <feBlend mode="normal" in2="shape" result="effect2_innerShadow" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default FolderLogo;
