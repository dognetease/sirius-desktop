import React, { FC } from 'react';
import classnames from 'classnames';
import { Popover } from 'antd';
import Button from '@web-common/components/UI/Button';
import UnionIcon from '@/images/icons/edm/union-icon.svg';

import { handlePreviewImage } from '../../utils';
import styles from './MailTemplateListV2.module.scss';

export const RecommendCard: FC<{
  title: string;
  imgUrl: string;
}> = ({ title, imgUrl }) => {
  return (
    <div className={classnames(styles.taskItem)}>
      <div className={classnames(styles.taskCard, styles.recommendCard)}>
        {/* 分组信息 */}
        <div className={styles.tag}>我是分组信息</div>
        <div className={classnames(styles.taskCardTitle, styles.ellipsis)}>{title}</div>
        <div className={styles.taskCardImg}>
          <img src={imgUrl} alt="" />
        </div>
        <div className={styles.labels}>
          <div className={styles.labelItem}>打开率: 12.2%</div>
          <div className={styles.labelItem}>回复率: 12.2%</div>
        </div>
        <div className={styles.cardOp}>
          <Popover
            title={null}
            trigger="click"
            getPopupContainer={node => node}
            placement="topLeft"
            content={
              <>
                <div className={styles.popoverContent}>
                  <div className={classnames(styles.popoverBtn)}>保存为个人模板</div>
                </div>
              </>
            }
          >
            <div className={styles.popoverWrap}>
              <img src={UnionIcon} alt="" />
            </div>
          </Popover>
          <Button
            className={styles.templateBtn}
            style={{
              width: 74,
              height: 28,
            }}
            onClick={() => {}}
            btnType="minorLine"
          >
            查看
          </Button>
          <Button
            className={styles.templateBtn}
            style={{
              width: 74,
              height: 28,
            }}
            // type="primary"
            btnType="primary"
            onClick={() => {}}
          >
            使用
          </Button>
        </div>
      </div>
    </div>
  );
};
