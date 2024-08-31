import React, { useEffect } from 'react';
import styles from './index.module.scss';
import { ReactComponent as RightArrowIcon } from '../../images/right-arrow.svg';
import { getIn18Text } from 'api';

export interface Template {
  templateId: string;
  templateName: string;
}

export interface Ref {
  current: {
    chooseTemplate?: (value: Template) => void;
  };
}

interface Props {
  value?: Template;
  onChange?: (value: Template) => void;
  onChoose: () => void;
  parentRef: Ref;
  isEdit: boolean;
}

export const ChooseTemplateStatus: React.FC<Props> = props => {
  const { value, onChange, parentRef, onChoose, isEdit } = props;

  useEffect(() => {
    parentRef.current = {
      chooseTemplate: (templateData: Template) => {
        onChange?.(templateData);
      },
    };
  }, []);

  return (
    <div className={styles.chooseTemplateStatus}>
      {value?.templateName ? (
        <div className={styles.haveChoose}>
          {value.templateName}
          {isEdit ? null : (
            <div className={styles.editBtn} onClick={onChoose}>
              {getIn18Text('XIUGAI')}
              <RightArrowIcon />
            </div>
          )}
        </div>
      ) : (
        <div className={styles.noChoose} onClick={onChoose}>
          {getIn18Text('QUXUANZE')} <RightArrowIcon />
        </div>
      )}
    </div>
  );
};
