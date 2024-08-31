import React from 'react';
import styles from './index.module.scss';
import { IHsCode, THsCodeFunc } from '../search';
import { ReactComponent as ArrowRightIcon } from '@/images/icons/customs/right.svg';

export function HScodeSelect(props: { hsSelectOptions: IHsCode[]; onSelectCode: THsCodeFunc; onGetNext: THsCodeFunc }) {
  const { hsSelectOptions = [], onSelectCode, onGetNext } = props;
  return (
    <div className={styles.hscode}>
      {hsSelectOptions.map(({ code, content, hasNext }) => (
        <>
          <div
            key={code}
            className={styles.hscodeRow}
            onClick={() => {
              if (hasNext) {
                onGetNext(code);
              }
            }}
          >
            <div
              className={styles.hscodeRowTitle}
              onClick={e => {
                e.stopPropagation();
                onSelectCode(code);
              }}
            >
              {code}
            </div>
            <div className={styles.hscodeRowContent}>{content}</div>
            <div className={styles.hscodeRowNext}>{hasNext && <ArrowRightIcon />}</div>
          </div>
        </>
      ))}
    </div>
  );
}
