import React, { useRef, useState } from 'react';
import LxPopover from '@web-common/components/UI/LxPopover/LxPopover';
import style from './editor.module.scss';

const HOCToolbarTip = (Component: typeof React.Component) => {
  const ToolbarTip = (props: any) => {
    const { ref, ...rest } = props;
    const [visible, setVisible] = useState(false);
    const [tipPos, setTipPos] = useState({
      top: 0,
      left: 0,
    });
    const [title, setTitle] = useState('');

    const setVisibleRef = useRef(setVisible);
    const setTipPosRef = useRef(setTipPos);
    const setTitleRef = useRef(setTitle);

    setVisibleRef.current = setVisible;
    setTipPosRef.current = setTipPos;
    setTitleRef.current = setTitle;
    const mouseoverToolbar = button => {
      let elem = button.element.dom;
      let title = elem.getAttribute('title');
      while (!title && elem) {
        const parent = elem.parentElement;
        if (parent.className.includes('tox-toolbar__group')) {
          break;
        }
        title = parent.getAttribute('title');
        elem = parent;
      }
      if (!title) return;
      setTitleRef.current(title);
      const elemRect = elem.getBoundingClientRect();
      setVisibleRef.current(true);
      setTipPosRef.current({
        top: elemRect.top - 35,
        left: elemRect.left,
      });
    };

    const mouseoutToolbar = () => {
      setVisibleRef.current(false);
    };

    return (
      <>
        <Component {...rest} ref={ref} mouseoverToolbar={mouseoverToolbar} mouseoutToolbar={mouseoutToolbar} />
        <LxPopover top={tipPos.top} left={tipPos.left} visible={visible} setVisible={setVisible} acceptTopBottom>
          <div className={style.tooltip}>{title}</div>
        </LxPopover>
      </>
    );
  };

  return React.forwardRef((props, ref) => <ToolbarTip {...props} ref={ref} />);
};

export default HOCToolbarTip;
