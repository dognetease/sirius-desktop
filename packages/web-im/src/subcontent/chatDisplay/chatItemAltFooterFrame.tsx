import React from 'react';
import classnames from 'classnames/bind';
import style from './chatItemAltFooter.module.scss';
import { FooterFrame } from '../../common/customTplFooter';
import { ButtonControl } from './chatItemAltFooterButton';
import { TextControl } from './chatItemAltFooterText';
import { LinkControl } from './chatItemAltFooterLink';

const realStyle = classnames.bind(style);
interface FrameProp {
  frame: FooterFrame;
  msgId: string;
}
export const Frame: React.FC<FrameProp> = props => {
  const { frame, msgId } = props;

  const textAlignStyle = {
    left: 'left',
    right: 'right',
    center: 'center',
    between: 'space-between',
    around: 'space-around',
  };

  if (!frame) {
    return null;
  }

  return (
    <div
      className={realStyle('taskFooterWrapper', [`direction-${frame.align}`], {
        splitLine: (Array.isArray(frame.items) ? frame.items : [frame.items]).some(item => item.type === 'text' || (item.type === 'link' && item.link_type !== 'button')),
      })}
      style={
        {
          justifyContent: Reflect.has(textAlignStyle, frame.align) ? textAlignStyle[frame.align] : textAlignStyle.left,
        } as React.CSSProperties
      }
    >
      {(Array.isArray(frame.items) ? frame.items : [frame.items]).map(item => {
        if (item.type === 'button') {
          return <ButtonControl control={item} msgId={msgId} align={frame.align} />;
        }
        if (item.type === 'text') {
          return <TextControl text={item.text} />;
        }
        if (item.type === 'link') {
          return <LinkControl control={item} align={frame.align} />;
        }
        return <TextControl text={item.alt_text} />;
      })}
    </div>
  );
};
