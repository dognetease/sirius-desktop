import React, { useState, useEffect } from 'react';
import { Popover } from 'antd';
import { apiHolder, apis, EdmCustomsApi } from 'api';
import type { AlignType } from 'rc-trigger/lib/interface';
import { ReactComponent as TranslateIcon } from '@/images/icons/customs/translate2.svg';
import { ReactComponent as TranslateHoverIcon } from '@/images/icons/customs/translate2Hover.svg';
import style from './translate.module.scss';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

interface Props {
  classnames?: string;
  title?: string;
  bodyContainer?: boolean;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
}

const alignConfig = {
  points: ['tl', 'tr'], // align top left point of sourceNode with top right point of targetNode
  offset: [4, -16], // the offset sourceNode by 4px in x and -16px in y,
  targetOffset: [4, 0], // the offset targetNode by 4px of targetNode width in x and 0px of targetNode height in y,
  overflow: { adjustX: true, adjustY: true }, // auto adjust position when sourceNode is overflowed
} as AlignType;

const Translate: React.FC<Props> = ({ children: childrenDom, title, classnames, bodyContainer, getPopupContainer }) => {
  const [content, setContent] = useState<string>();
  const [visible, setVisible] = useState(false);
  const [copyVisible, setCopyVisible] = useState<boolean>(false);
  const handerTranslate = (origin: string) => {
    const params = {
      q: origin,
      from: 'auto',
      to: 'auto',
    };
    edmCustomsApi.customsTranslate(params).then(res => {
      if (res.translation && res.translation.length) {
        setContent(res.translation[0]);
      }
    });
  };

  useEffect(() => {
    if (visible && title) {
      handerTranslate(title);
    }
  }, [title, visible]);

  const handleVisibleChange = (newVisible: boolean) => {
    setVisible(newVisible);
  };

  return (
    <Popover
      title={content}
      trigger="click"
      placement="right"
      visible={visible}
      getPopupContainer={getPopupContainer || (bodyContainer ? undefined : triggerNode => triggerNode.parentNode as HTMLElement)}
      overlayClassName={style.customsConfirmOverlay}
      onVisibleChange={handleVisibleChange}
      mouseLeaveDelay={3}
      align={alignConfig}
      autoAdjustOverflow
    >
      {childrenDom ? (
        React.Children.map(childrenDom, child => {
          if (!React.isValidElement(child)) {
            return null;
          }
          return React.cloneElement(child);
        })
      ) : (
        <span
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseEnter={() => {
            setCopyVisible(!0);
          }}
          onMouseLeave={() => {
            setCopyVisible(false);
          }}
          className={classnames}
        >
          {copyVisible ? <TranslateHoverIcon /> : <TranslateIcon />}
        </span>
      )}
    </Popover>
  );
};

export default Translate;
