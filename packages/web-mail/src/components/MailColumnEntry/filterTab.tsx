// 邮件列表顶部的tab切换效果，从index中抽离出来
import React from 'react';
import classnames from 'classnames';
import styles from './filterTab.module.scss';

interface FilterTabProps {
  // tab列表
  list: any[];
  // 点击tab
  clickItem: (item: any) => void;
  // 当前选中tab的类型
  selectedType: string;
  // 后面的按钮
  suffix?: any;
}

const FilterTabCompontent: React.FC<FilterTabProps> = (props: FilterTabProps) => {
  const { list, clickItem, selectedType, suffix } = props || {};
  // 点击tab
  const clickTab = (item: any) => {
    clickItem(item);
  };
  // 返回dom
  return (
    <>
      <div className={classnames(styles.mListTitle, 'sirius-no-drag')}>
        <div className={styles.mListTab}>
          {list && list.length > 0
            ? list.map((item: any, index: number) => (
                <span
                  key={index}
                  className={classnames([styles.text, 'sirius-no-drag', item.type == selectedType ? styles.on : ''])}
                  onClick={() => {
                    clickTab(item);
                  }}
                >
                  {item.show ? item.show() : item.title}
                </span>
              ))
            : null}
        </div>
        {suffix ? <div className={classnames(styles.uMarkRead, 'sirius-no-drag')}>{suffix}</div> : ''}
      </div>
    </>
  );
};
export default FilterTabCompontent;
