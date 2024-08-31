/**
 * 自主注册的飘新引导，防止不同的引导冲突重叠
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useActions, useAppSelector, HollowOutGuideAction } from '@web-common/state/createStore';
import { useSyncCallback } from '@web-common/hooks/useSyncCallback';
import styles from './hollowOutWmWeb.module.scss';
import { getIn18Text } from 'api';

export interface IStep {
  /** 自定义视图相对于目标元素的位置 */
  offset?: Record<'x' | 'y', number>;
  /** 自定义视图内容 */
  content: React.ReactNode;
}

interface HollowOutGuideProps {
  /**
   * 是否启用飘新引导，由业务控制
   */
  enable?: boolean;
  /**
   * 唯一id，是存入 localstroage 的 key，不同的飘新引导必须保证 guideId 不同，同一个飘新引导的分步要保证 guideId 一致
   */
  guideId: string;
  /**
   * 分步，初始值为 1，注意 step 必须顺序不能间断
   */
  step?: number;
  /**
   * 引导弹窗标题
   */
  title: string;
  /**
   * 引导弹窗详情
   */
  intro: string | JSX.Element;
  /**
   * refresh变更后，会重新刷新 引导弹窗的位置
   */
  refresh?: number;
  /**
   * 底部按钮
   */
  renderFooter?: JSX.Element;
  /**
   * 引导弹窗位置，bottomright bottomleft topright topleft
   */
  placement?: string;
  /**
   * 目标元素的聚焦框 padding，通过修改 padding 可以优化聚焦框展示UI效果, [上,右,下,左]
   */
  padding?: number[];
  /**
   * 目标元素的聚焦框的圆角，默认是6px
   */
  borderRadius?: number;
  /**
   * 目标元素
   */
  children: React.ReactNode;
  /**
   * 目标元素宽度，可以自定义设置，不设置的话，会计算目标元素的宽度
   * targetWidth，targetHeight 是为了临时解决兼容性问题加的，后期会优化
   */
  targetWidth?: number;
  /**
   * 目标元素高度，可以自定义设置，不设置的话，会计算目标元素的高度
   */
  targetHeight?: number;
  /**
   * 确认按钮文案，默认知道了
   */
  okText?: string;
  /**
   * 关闭回调
   */
  onClose?: () => void;
  /**
   * 根据自定义视图定位气泡
   */
  extraView?: IStep | null;
  /**
   * 是否支持跳过
   */
  skip?: boolean;
}

const HollowOutWmWeb: React.FC<HollowOutGuideProps> = props => {
  const {
    enable = true,
    guideId,
    step,
    title,
    intro,
    refresh,
    renderFooter,
    placement = 'bottomright',
    padding = [0, 0, 0, 0],
    borderRadius = 6,
    children,
    okText = '知道了',
    targetWidth,
    targetHeight,
    onClose,
    extraView = null,
    skip,
  } = props;

  const onGuide = useAppSelector(state => state.hollowOutGuideReducer.guideQueue[0]);
  const { doAddGuide, doDeleteGuide, doNextStep, doSkip } = useActions(HollowOutGuideAction);

  const [position, setPosition] = useState<any>();

  const onStep = useMemo(() => (step ? step : 1), [step]);

  const paddingTop = useMemo(() => padding[0], [padding]);
  const paddingRight = useMemo(() => padding[1], [padding]);
  const paddingBottom = useMemo(() => padding[2], [padding]);
  const paddingLeft = useMemo(() => padding[3], [padding]);
  const show = useMemo(() => enable && onGuide && onGuide.guideId === guideId && onGuide.steps[onStep - 1]?.show, [enable, onGuide, guideId]);

  const rangestartRef = useRef<any>(null);
  const rangeendRef = useRef<any>(null);
  const bobbleRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<HTMLDivElement | null>(null);
  const arrowRef = useRef<HTMLImageElement | null>(null);

  const range = useMemo(() => {
    if (rangestartRef.current && rangeendRef.current) {
      const range = typeof Range === 'function' ? new Range() : document.createRange();
      range.setStartBefore(rangestartRef.current);
      range.setEndAfter(rangeendRef.current);
      return range;
    }
    return null;
  }, [rangestartRef.current, rangeendRef.current]);

  // 下一步
  const handleNext = () => {
    // 最后一步 点击 我知道了
    doNextStep({ step: onStep, guideId });
    onClose && onClose();
  };

  // 跳过
  const handleSkip = () => {
    doSkip({ guideId });
  };

  // 获取目标元素位置
  const calcPos = () => {
    if (!show || !range) {
      return;
    }
    const triggerRefDom = Array.from(range.commonAncestorContainer.childNodes).slice(range.startOffset + 1, range.endOffset - 1);
    if (triggerRefDom) {
      let minx = 100000;
      let miny = 100000;
      let maxx = 0;
      let maxy = 0;
      triggerRefDom.forEach((node: any) => {
        const { x, y, width, height } = node.getBoundingClientRect();
        if (width > 0 && height > 0) {
          if (x < minx) {
            minx = x;
          }
          if (y < miny) {
            miny = y;
          }
          if (x + width > maxx) {
            maxx = x + width;
          }
          if (y + height > maxy) {
            maxy = y + height;
          }
        }
      });
      if (minx !== 100000) {
        let width = targetWidth ? targetWidth : maxx - minx + paddingLeft + paddingRight;
        let height = targetHeight ? targetHeight : maxy - miny + paddingTop + paddingBottom;
        setPosition({
          x: minx - paddingLeft,
          y: miny - paddingTop,
          height: height,
          width: width,
        });
      }
    } else {
      setPosition(null);
    }
  };

  // 锚点元素发生变化 切换聚焦点
  useEffect(() => {
    calcPos();
    setTimeout(() => {
      otherPlace();
    }, 0);
  }, [show, range, refresh, viewRef.current, bobbleRef.current]);

  useEffect(() => {
    if (enable) {
      // 注册
      doAddGuide({ step: onStep, guideId });
    } else {
      doDeleteGuide({ step: onStep, guideId });
    }
  }, [enable]);

  // 底部按钮
  const Footer = () => {
    return (
      <div className={styles.footer}>
        {step ? (
          <span>
            {onStep}/{onGuide?.steps.length}
          </span>
        ) : (
          <span></span>
        )}
        {skip && onStep < onGuide?.steps.length ? (
          <span className={styles.skip} onClick={handleSkip}>
            {getIn18Text('TIAOGUO')}
          </span>
        ) : null}
        <button className={styles.butt} onClick={handleNext}>
          {onStep >= onGuide?.steps.length ? okText : getIn18Text('XIAYIBU')}
        </button>
      </div>
    );
  };

  const renderMain = () => {
    if (extraView) {
      const { content, offset } = extraView;

      return (
        <div
          className={styles.main}
          ref={viewRef}
          style={{
            top: offset?.y,
            left: offset?.x,
          }}
        >
          {content}
          {Bobble()}
        </div>
      );
    } else {
      return <>{Bobble()}</>;
    }
  };

  const Bobble = () => {
    return (
      <div
        ref={bobbleRef}
        className={styles.guideBobble}
        style={{
          marginTop: ['bottomright', 'bottomleft'].indexOf(placement) !== -1 ? '11px' : undefined,
          marginBottom: ['topright', 'topleft'].indexOf(placement) !== -1 ? '11px' : undefined,
          top: ['bottomright', 'bottomleft'].indexOf(placement) !== -1 ? '100%' : undefined,
          bottom: ['topright', 'topleft'].indexOf(placement) !== -1 ? '100%' : undefined,
          left: ['bottomright', 'topright'].indexOf(placement) !== -1 ? 0 : undefined,
          right: ['bottomleft', 'topleft'].indexOf(placement) !== -1 ? 0 : undefined,
        }}
      >
        <img
          ref={arrowRef}
          className={styles.arrowUp}
          style={{
            top: ['bottomright', 'bottomleft'].indexOf(placement) !== -1 ? '-7px' : undefined,
            bottom: ['topright', 'topleft'].indexOf(placement) !== -1 ? '-7px' : undefined,
            left: ['bottomright', 'topright'].indexOf(placement) !== -1 ? 0 : position.width / 2 - 14,
            right: ['bottomleft', 'topleft'].indexOf(placement) !== -1 ? 0 : position.width / 2 - 14,
            transform: ['topright', 'topleft'].indexOf(placement) !== -1 ? 'rotate(180deg)' : undefined,
          }}
          src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/04/22/b2b31d05a9e14a46b537ae563bf6dcf3.png"
        />
        <p className={styles.title}>{title}</p>
        {typeof intro === 'string' ? (
          <p className={styles.intro} hidden={!intro}>
            {intro}
          </p>
        ) : (
          intro
        )}
        {renderFooter ? renderFooter : <Footer />}
      </div>
    );
  };

  const otherPlace = useSyncCallback(() => {
    if (!bobbleRef.current) return;
    const bw = bobbleRef.current.offsetWidth;
    const bh = bobbleRef.current.offsetHeight;
    /** 以目标元素为基准的 placement */
    if (placement === 'bottom-center' && !viewRef.current) {
      const top = `${position.height + 10}`;
      const left = `${position.width / 2 - bw / 2}`;
      bobbleRef.current.style.cssText = `
          top: ${top}px;
					left: ${left}px;
				`;
      arrowRef!.current!.style.cssText = `
          top: -7px;
          left: ${bw / 2 - 10}px;
				`;
    }

    /** 以 extraView 为基准的 placement */
    if (!viewRef.current) return;
    const w = viewRef.current.offsetWidth;
    const h = viewRef.current.offsetHeight;
    // 在 extraView 右侧
    if (placement === 'right-center') {
      bobbleRef.current.style.cssText = `
					 top: ${h / 2 - bh / 2}px;
					 left: ${w + 8}px
				`;
      arrowRef!.current!.style.cssText = `
				  left: -17px;
          top: ${bh / 2 - 10}px;
				  transform: rotate(-90deg);
				`;
    }
    if (placement === 'bottom-center') {
      bobbleRef.current.style.cssText = `
          top: '100%';
          left: ${w / 2 - bw / 2}px;
        `;
      arrowRef!.current!.style.cssText = `
          top: -7px;
				  left: ${bw / 2 - 10}px;
				`;
    }
  });

  // 弹窗
  const guideContent = () => {
    return (
      <>
        {show && position && (
          <div className={styles.maskWrapper} onClick={e => e.stopPropagation()}>
            {/* 锚点wrapper */}
            <div className={styles.archerWrapper} style={{ left: position.x, height: position.height, top: position.y, width: position.width, borderRadius }}>
              {/* 引导气泡 */}
              {renderMain()}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <span ref={rangestartRef} style={{ display: 'none' }}></span>
      {children}
      <span ref={rangeendRef} style={{ display: 'none' }}></span>
      {guideContent()}
    </>
  );
};
export default HollowOutWmWeb;
