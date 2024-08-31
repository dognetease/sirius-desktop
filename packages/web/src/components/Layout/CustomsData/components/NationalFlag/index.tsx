import * as React from 'react';
import { useMemo } from 'react';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';

import dictionary from './dictionary';
import flagMap from './flagMap';
import style from './style.module.scss';
import { Tooltip } from 'antd';

type NationMap = {
  [n: string]: {
    component: string;
    label: string;
  };
};
type NationKey = keyof NationMap;
const nationComponentMap: NationMap = {};
for (const item of dictionary) {
  Object.assign(nationComponentMap, {
    [item.code]: {
      component: item.flag && require(`@/images/flags/${item.flag}`),
      label: item.label,
    },
  });
}

interface Props {
  name: string;
  style?: React.CSSProperties;
  showLabel?: boolean;
}
export default function NationFlag(props: Props) {
  const { name, showLabel = true } = props;
  const nation = useMemo(() => nationComponentMap[name as string] || { label: name, component: null }, [name]);
  return (
    <div style={{ display: 'inline-block', whiteSpace: 'nowrap', ...props.style }}>
      {nation.component &&
        (showLabel ? (
          <img style={{ width: 18, marginRight: 4 }} src={nation.component} />
        ) : (
          <Tooltip title={nation.label}>
            <img style={{ width: 18 }} src={nation.component} />
          </Tooltip>
        ))}
      {showLabel && (
        <div style={{ maxWidth: 60, display: 'inline-block' }}>
          <EllipsisTooltip>
            <span className={style.countryName}>{nation.label}</span>
          </EllipsisTooltip>
        </div>
      )}
    </div>
  );
}

interface NationFlagCompProps {
  code: string;
  className?: string;
}

/**
 * 给业务系统提供的国旗组件
 */
export const NationFlagComp = React.memo((props: NationFlagCompProps) => {
  const { code, className } = props;
  const flag = useMemo(() => (flagMap as any)[code], [code]);
  return flag ? <img className={className} src={flag} alt={code} /> : null;
});
