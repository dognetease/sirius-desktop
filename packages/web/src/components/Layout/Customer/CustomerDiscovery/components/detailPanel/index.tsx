import React, { CSSProperties, ReactNode } from 'react';
import { Descriptions, Tooltip } from 'antd';
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/question.svg';
import style from './style.module.scss';

export interface Detail {
  label: string | ReactNode;
  value?: string | ReactNode;
  tips?: string | ReactNode;
}

export interface Props {
  title?: string;
  data: Array<Detail>;
  column?: number;
  labelStyle?: CSSProperties;
}

export const DetailPanel: React.FC<Props> = props => {
  const { title, data = [], column = 3, labelStyle } = props;

  return (
    <Descriptions className={style.wrapper} title={title} column={column} labelStyle={labelStyle}>
      {data.map(item => {
        const value = item.value === null || item.value === undefined ? '--' : item.value;
        let { label } = item;
        if (item.tips) {
          (label as ReactNode) = (
            <>
              <span>{label}</span>
              <Tooltip title={item.tips}>
                <QuestionIcon className={style.qicon} />
              </Tooltip>
            </>
          );
        }

        return <Descriptions.Item label={label}>{value}</Descriptions.Item>;
      })}
    </Descriptions>
  );
};
