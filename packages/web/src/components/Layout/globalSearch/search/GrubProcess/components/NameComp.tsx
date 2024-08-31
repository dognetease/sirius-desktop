import React, { FC, useMemo } from 'react';
import { Tooltip } from 'antd';
import { GrubProcessCodeEnum, GrubProcessTypeEnum, GrubProcessTypeStyleDict, grubProcessCodeTextDict } from '../constants';
import styles from '../index.module.scss';

interface Props {
  code?: string;
  type: GrubProcessTypeEnum;
  name: string;
  desc?: string;
}

export const GrubNameComp: FC<Props> = ({ code, type, name, desc }) => {
  const showText = useMemo(() => (code ? grubProcessCodeTextDict[code as GrubProcessCodeEnum] ?? '' : ''), [code]);
  const fullDesc = useMemo(() => (desc ? `（${desc}）` : ''), [desc]);
  return (
    <Tooltip title={`${name}${fullDesc}`}>
      <span className={styles.grubName}>
        {showText && (
          <span style={GrubProcessTypeStyleDict[type]} className={styles.grubNameTag}>
            {showText}
          </span>
        )}
        {name}
        {fullDesc && <span style={{ color: '#747A8C' }}>{fullDesc}</span>}
      </span>
    </Tooltip>
  );
};
