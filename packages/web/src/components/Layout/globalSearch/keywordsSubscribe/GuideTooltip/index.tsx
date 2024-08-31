import { api } from 'api';
import { Tooltip } from 'antd';
import { TooltipPropsWithTitle } from 'antd/es/tooltip';
import React, { useContext, useEffect, useState } from 'react';
import classNames from 'classnames';
import styles from './index.module.scss';
import { SubKeyWordContext } from '../subcontext';
import { getIn18Text } from 'api';
const storeApi = api.getDataStoreApi();
const storedValue = 'true';
interface GuideTooltip extends TooltipPropsWithTitle {
  storeId: string;
  onOk?(): void;
  prefixId?: string;
}
const GuideToolTip: React.FC<GuideTooltip> = ({ storeId, title, overlayClassName, onOk, visible: propVisible, prefixId, ...props }) => {
  const defaultVisible = storeApi.getSync(storeId).data !== storedValue;
  const [visible, setVisile] = useState<boolean>(defaultVisible || !!propVisible);
  const { placement = 'bottom' } = props;
  const [state, dispatch] = useContext(SubKeyWordContext);
  const handleDisVisible = () => {
    setVisile(false);
    storeApi.put(storeId, storedValue);
    dispatch({
      type: 'OK_TOOL_TIP',
      payload: storeId,
    });
    onOk?.();
  };
  useEffect(() => {
    if (propVisible !== undefined) {
      setVisile(propVisible);
    }
  }, [propVisible]);
  if (prefixId !== undefined && !state.clickedToolTip.includes(prefixId)) {
    return <>{props.children}</>;
  }
  return (
    <Tooltip
      visible={visible}
      autoAdjustOverflow={false}
      overlayClassName={classNames(overlayClassName, styles.tooltipOverlay, {
        [styles.tooltipOverlayBottom]: placement.toLocaleLowerCase().startsWith('bottom'),
        [styles.tooltipOverlayTop]: placement.toLocaleLowerCase().startsWith('top'),
        [styles.tooltipOverlayLeft]: placement.toLocaleLowerCase().startsWith('left'),
        [styles.tooltipOverlayRight]: placement.toLocaleLowerCase().startsWith('right'),
      })}
      title={
        <>
          <div className={styles.title}>{title}</div>
          <div className={styles.footer}>
            <a href="javascript:void(0)" onClick={handleDisVisible}>
              {getIn18Text('ZHIDAOLE')}
            </a>
          </div>
        </>
      }
      {...props}
    />
  );
};
export default GuideToolTip;
