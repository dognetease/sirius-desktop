import React, { useRef, useMemo, useState, useEffect } from 'react';
import { apiHolder, DataStoreApi } from 'api';
import styles from './emojiTip.module.scss';
import EmojiTipImg from '@/images/emojitip.png';
import ReactDOM from 'react-dom';
import { apiHolder as api } from 'api';

const systemApi = api.api.getSystemApi();
const inEdm = systemApi.inEdm();
const { isMac } = apiHolder.env;
interface EmojiTipProps {
  setCapturescreenTipVisible: (value: React.SetStateAction<boolean>) => void;
}

const storeApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

let calcPosTimer = null;

const EmojiTip: React.FC<EmojiTipProps> = props => {
  const { setCapturescreenTipVisible } = props;

  const [position, setPosition] = useState<any>();

  const rangestartRef = useRef<any>(null);
  const rangeendRef = useRef<any>(null);
  const range = useMemo(() => {
    if (rangestartRef.current && rangeendRef.current) {
      const range = typeof Range === 'function' ? new Range() : document.createRange();
      range.setStartBefore(rangestartRef.current);
      range.setEndAfter(rangeendRef.current);
      return range;
    }
    return null;
  }, [rangestartRef.current, rangeendRef.current]);

  const handleNext = () => {
    setCapturescreenTipVisible(false);
    storeApi.putSync('lx_write_capturescreen1', 'true', { noneUserRelated: true });
  };

  // 获取目标元素位置
  const calcPos = () => {
    if (!range) {
      return;
    }
    const triggerRefDom = Array.from(range.commonAncestorContainer.childNodes).slice(range.startOffset + 1, range.endOffset - 1);
    if (triggerRefDom) {
      // 500ms的定时器是为了解决 getBoundingClientRect 在dom未渲染完成时候，拿到数据不准确问题，但是 500ms 并不是一个绝对能解决问题的延时。正确的方式，是目标元素要css设置宽高。
      calcPosTimer = setTimeout(() => {
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
          let width = maxx - minx;
          let height = maxy - miny;
          setPosition({
            x: minx,
            y: miny,
            height: height,
            width: width,
          });
        }
      }, 500);
    } else {
      setPosition(null);
    }
  };

  useEffect(() => calcPos(), [range]);

  // 底部按钮
  const Footer = () => {
    return (
      <div className={styles.footer}>
        <button className={styles.butt} onClick={handleNext}>
          知道了
        </button>
      </div>
    );
  };

  const GuideContent = () => {
    return (
      <>
        {position && (
          <div className={styles.maskWrapper}>
            <div className={styles.archerWrapper} style={{ left: position.x, height: position.height, top: position.y, width: position.width }}>
              <div className={styles.guideBobble}>
                <p className={styles.title}>写信新增 截图 ({isMac ? '⌘ Shift A' : 'Alt A'}) 功能</p>
                <Footer />
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <span ref={rangestartRef} style={{ display: 'none' }}></span>
      <p className={styles.emojiTipImg} style={{ top: inEdm ? '40px' : '-41px' }}>
        <img src={EmojiTipImg} />
      </p>
      <span ref={rangeendRef} style={{ display: 'none' }}></span>
      {document?.body ? ReactDOM.createPortal(<GuideContent />, document.body) : <GuideContent />}
    </>
  );
};
export default EmojiTip;
