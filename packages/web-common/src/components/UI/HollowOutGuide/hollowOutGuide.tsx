import React, { useState, useRef, useLayoutEffect, useEffect, useImperativeHandle } from 'react';
import debounce from 'lodash/debounce';
import classnames from 'classnames/bind';
import styles from './hollowOutGuide.module.scss';
import { getIn18Text } from 'api';
interface Guide {
  id: string;
  title: string;
  intro: string;
}
const realStyle = classnames.bind(styles);
interface HollowOutGuideProps {
  guides: Guide[];
  refresh?: number;
  placement?: 'bottom' | 'right';
  renderFooter?: JSX.Element;
  renderContent?: JSX.Element;
}
const HollowOutGuide = React.forwardRef((props: HollowOutGuideProps, ref) => {
  const { guides, refresh, placement = 'bottom', renderFooter, renderContent } = props;
  // 是否展示
  const [show, setShow] = useState<boolean>(false);
  // 当前位置
  const [position, setPosition] = useState<DOMRect | null>();
  // 当前哪一步
  const [step, setStep] = useState<number>(0);
  // 当前引导
  const [guide, setGuide] = useState<Guide>(guides[0] || null);
  const showRef = useRef<boolean>(show);
  showRef.current = show;
  const guideRef = useRef<Guide>(guide);
  guideRef.current = guide;
  // 弹窗wrapper
  let guideWrapperRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>();
  // 下一步
  const handleNext = () => {
    // 最后一步 点击 我知道了
    if (step >= guides.length - 1) {
      // 溢出 移除 重置状态
      setShow(false);
      setStep(0);
      setGuide(guides[0]);
      return;
    }
    setStep(step + 1);
    setGuide(guides[step + 1]);
  };
  // 动态获取arrow的样式
  const getArrowStyle = (placement: HollowOutGuideProps['placement'], position: DOMRect | null | undefined): React.CSSProperties | undefined => {
    if (placement === 'bottom' && position) {
      const style2 = { right: position!.width / 2 - 14 };
      return { right: position!.width / 2 - 14 };
    } else {
      if (guideWrapperRef.current != null && position) {
        let { top, height } = guideWrapperRef.current.getBoundingClientRect(); // 当前提示框的矩形边框
        return {
          top: height * 0.2 + position!.height / 2, // 默认向上 translate 20%
        };
      }
    }
  };
  const calcPos = () => {
    if (!showRef.current) return;
    if (!guideRef.current) return;
    const { id } = guideRef.current;
    const node = document.getElementById(id);
    if (node) {
      const p = node.getBoundingClientRect();
      setPosition(p);
      setStyle(getArrowStyle(placement, p));
    } else {
      setPosition(null);
    }
  };
  // 锚点元素发生变化 切换聚焦点
  useLayoutEffect(() => calcPos(), [show, guide, refresh]);
  // calcPos();
  const handleResize = debounce(() => calcPos(), 500);
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useImperativeHandle(
    ref,
    () => ({
      showSelf: (callback: Function) => {
        callback && callback();
        setShow(true);
      },
      hideSelf: () => {
        setShow(false);
      },
    }),
    []
  );
  // 底部按钮
  const Footer = () => {
    return (
      <div className={styles.footer}>
        <span>
          {step + 1}/{guides.length}
        </span>
        <button className={styles.butt} onClick={handleNext}>
          {step >= guides.length - 1 ? getIn18Text('ZHIDAOLE') : getIn18Text('XIAYIBU')}
        </button>
      </div>
    );
  };
  return (
    <>
      {show && position && (
        <div className={styles.maskWrapper} onClick={e => e.stopPropagation()}>
          {/* 锚点wrapper */}
          <div className={styles.archerWrapper} style={{ left: position.x, height: position.height, top: position.y, width: position.width }}>
            {/* 引导气泡 */}
            <div
              ref={guideWrapperRef}
              className={realStyle(
                {
                  guideBobble: placement === 'bottom',
                },
                {
                  guideBobbleRight: placement === 'right',
                }
              )}
            >
              <img
                className={realStyle(
                  {
                    arrowUp: placement === 'bottom',
                  },
                  {
                    arrowLeft: placement === 'right',
                  }
                )}
                style={style}
                src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/04/22/b2b31d05a9e14a46b537ae563bf6dcf3.png"
              />
              <p className={styles.title}>{guide.title}</p>
              {
                // 支持自定义内容
                renderContent ?? <p className={styles.intro}>{guide.intro}</p>
              }
              {
                // 支持自定义 footer
                renderFooter ?? <Footer />
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
});
export default HollowOutGuide;
