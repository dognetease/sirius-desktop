import React, { FC, CSSProperties, useState, useRef, useMemo, useImperativeHandle } from 'react';
import classnames from 'classnames/bind';
import { ResizableBox } from 'react-resizable';
import { inWindow, apiHolder, SystemApi } from 'api';
import styles from './CollapsibleList.module.scss';
import IconCard from '@web-common/components/UI/IconCard';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;

const realStyle = classnames.bind(styles);

export interface CollapsibleRefProps {
  controlAsideVisible?: (value: boolean) => void;
}

interface IProps {
  style?: CSSProperties;
  placement?: 'left' | 'right';
  onChange?: (width: number, height: number) => void;
  needBtn?: boolean;
  resizable?: boolean;
  minConstraints?: [number, number];
  maxConstraints?: [number, number];
  defaultWidth?: number;
  title: string;
  // 展开的事件
  onOpen?: () => void;
  // 关闭事件
  onClose?: () => void;
  ref?: React.Ref<IPropsRef>;
}
export const CollapsibleList: FC<IProps> = React.forwardRef((props, ref) => {
  const {
    style,
    children,
    placement = 'left',
    onChange,
    needBtn = false,
    resizable = false,
    minConstraints,
    maxConstraints,
    defaultWidth = 200,
    title = '',
    onOpen = () => {},
    onClose = () => {},
  } = props;
  const [visible, setVisible] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    controlAsideVisible: (value: boolean) => setVisible(value),
  }));

  const renderResizable = (): JSX.Element => (
    <ResizableBox width={defaultWidth} height={Infinity} axis="x" resizeHandles={['nw']} minConstraints={minConstraints} maxConstraints={maxConstraints}>
      {children}
    </ResizableBox>
  );

  const btnIconType = useMemo(() => {
    if (placement === 'left') {
      return visible ? 'tongyong_zhankai_zuo' : 'tongyong_zhankai_you';
    } else {
      return visible ? 'tongyong_zhankai_you' : 'tongyong_zhankai_zuo';
    }
  }, [visible, placement]);

  const [btnIconStroke, setBtnIconStroke] = useState<'#4C6AFF' | '#8D92A1'>('#8D92A1');

  const renderBtn = () => (
    <div
      onMouseEnter={() => {
        setBtnIconStroke('#4C6AFF');
      }}
      onMouseLeave={() => {
        setBtnIconStroke('#8D92A1');
      }}
      onClick={() => {
        setVisible(!visible);
        setBtnIconStroke('#8D92A1');
        Promise.resolve().then(() => {
          if (wrapperRef.current != null) {
            onChange && onChange(visible ? wrapperRef.current.offsetWidth : 0, visible ? wrapperRef.current.offsetHeight : 0);
          }
        });
        visible ? onClose() : onOpen();
      }}
      className={`dark-svg-invert ${realStyle({
        btn: true,
        ...(placement === 'left'
          ? {
              closeBtn: visible,
              openBtn: !visible,
            }
          : {
              closeBtnRight: visible,
              openBtnRight: !visible,
            }),
      })}`}
    >
      {/* <img src={placement === 'left' ? (visible ? LeftIcon : RightIcon) : visible ? RightIcon : LeftIcon} alt="" /> */}
      <IconCard type={btnIconType} stroke={btnIconStroke}></IconCard>
      {/* <div className={realStyle({
        icon: true,
        ...(
          placement === 'left'
          ? {
            leftCloseIcon: visible,
            leftOpenIcon: !visible,
          }
          : {
            rightCloseIcon: visible,
            rightOpenIcon: !visible,
          }
        )
      })}></div> */}
    </div>
  );

  return (
    <div
      ref={wrapperRef}
      className={realStyle({
        collapsibleList: true,
        needBtn: needBtn,
      })}
      style={{
        ...(style ?? {}),
        ...(visible
          ? {}
          : {
              width: 0,
            }),
      }}
    >
      {/* 收起按钮 - inWindow 为了防止ssr报错*/}
      {needBtn && inWindow() && renderBtn()}
      <div
        hidden={!visible}
        className={realStyle({
          myResizable: resizable,
          fullHeight: systemApi.isWebWmEntry(),
        })}
      >
        {resizable ? renderResizable() : children}
      </div>
    </div>
    // <Drawer
    //   title={null}
    //   placement={'left'}
    //   closable={false}
    //   onClose={() => {
    //     setVisible(false);
    //   }}
    //   visible={visible}
    //   mask={false}
    // >
    //   {children}
    // </Drawer>
  );
});
