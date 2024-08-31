import React from 'react';
import { Space } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import styles from './emptyPage.module.scss';
import { ReactComponent as EmptyImages } from './assets/emptyIcon.svg';

export interface IEmptyPageProps {
  linkList: {
    label: string;
    onClick: () => void;
  }[];
}

export const EmptyPage = ({ linkList = [] }: IEmptyPageProps) => (
  <div className={styles.empty}>
    <Space direction="vertical" align="center" size={0}>
      <p className={styles.bc}>
        <EmptyImages />
      </p>
      <p className={styles.tip1}>未能检索到相关内容，建议更换其他关键词</p>
      <p className={styles.tip2}>推荐使用其它搜索方式</p>
      <Space className={styles.btns}>
        {linkList.map(each => {
          const { label, onClick } = each;
          return (
            <Button btnType="primary" onClick={onClick} className={styles.button}>
              {label}
            </Button>
          );
        })}
      </Space>
    </Space>
  </div>
);
