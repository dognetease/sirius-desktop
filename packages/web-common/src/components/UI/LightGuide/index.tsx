/**
 * 自主注册的飘新引导，防止不同的引导冲突重叠
 */
import React, { useState, useEffect, useRef } from 'react';
import { Tooltip } from 'antd';
import { apiHolder as api, DataStoreApi } from 'api';
import { getIn18Text } from 'api';
interface LightGuideProps {
  /**
   * 唯一id，是存入 localstroage 的 key，不同的引导必须保证 guideId 不同
   */
  guideId: string;
  /**
   * 提示文字
   */
  title: string;
  /**
   * 气泡框位置
   */
  placement?: any;
  /**
   * 引导tip宽度
   */
  width?: number;
  /**
   * 是否启用引导，由业务控制，启动后开始计时 5s 自动关闭
   */
  enable?: boolean;
  /**
   * 目标元素
   */
  children: React.ReactNode;
}
const storeApi: DataStoreApi = api.api.getDataStoreApi();
const LightGuide: React.FC<LightGuideProps> = props => {
  const { guideId, title, width, placement = 'right', enable = true, children } = props;
  const [tipVisible, setTipVisible] = useState<boolean>(false);
  const timerRef = useRef<any>(null);
  useEffect(() => {
    if (!enable) {
      return;
    }
    const { data, suc } = storeApi.getSync(guideId);
    if (suc && data === 'true') {
      setTipVisible(false);
    } else {
      setTipVisible(true);
      !timerRef.current &&
        (timerRef.current = setTimeout(() => {
          closeTip();
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }, 5000));
    }
  }, [enable]);
  if (!enable) {
    return <>{children}</>;
  }
  const closeTip = () => {
    storeApi.put(guideId, 'true');
    setTipVisible(false);
  };
  const TitleRender = () => {
    return (
      <>
        <span style={{ marginRight: '20px' }}>{title}</span>
        <span style={{ color: '#5383FE', cursor: 'pointer' }} onClick={closeTip}>
          {getIn18Text('ZHIDAOLE')}
        </span>
      </>
    );
  };
  return (
    <>
      {children}
      <div style={{ position: 'relative' }}>
        <Tooltip
          overlayStyle={{ maxWidth: width }}
          getPopupContainer={node => node.parentElement || document.body}
          placement={placement}
          title={TitleRender()}
          color="#2d2d2d"
          visible={tipVisible}
        ></Tooltip>
      </div>
    </>
  );
};
export default LightGuide;
