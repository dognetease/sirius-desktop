import { Checkbox } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import React, { useCallback } from 'react';
import { CustomsCtx } from '../search';
import { TreeNode } from './type';
import styles from '../search.module.scss';
import Flag from '../flag';
import { hasParentChecked } from './utils';

interface RowListProps {
  node: TreeNode;
}

function MenuItem(props: RowListProps) {
  const { node } = props;
  const customCtx = React.useContext(CustomsCtx);
  const { value, handleSelectChange, showCheckboxNode } = customCtx;

  const handleChange = useCallback(
    (event: CheckboxChangeEvent, item: TreeNode) => {
      const { checked } = event.target;
      showCheckboxNode && showCheckboxNode(item, false);
      handleSelectChange && handleSelectChange(item, checked);
    },
    [node]
  );

  const handleCheckboxChange = useCallback(
    (item: TreeNode) => {
      console.log('handleCheckboxChange-item: ', item);
      showCheckboxNode && showCheckboxNode(item, true);
      handleSelectChange && handleSelectChange(item, true);
    },
    [node]
  );

  return (
    <div className={styles.menuItem}>
      {node.countries &&
        node.countries.map((item, index) => {
          const checked = hasParentChecked(item, value);
          if (!item.showBox) {
            return (
              <div className={styles.checkboxStatus} onClick={() => handleCheckboxChange(item)}>
                <Flag IconName={item.code} />
                {item.label}
              </div>
            );
          }
          return (
            <Checkbox className={styles.checkboxStatusTrue} checked={checked} onChange={(e: CheckboxChangeEvent) => handleChange(e, item)} key={index}>
              <Flag IconName={item.code} />
              {item.label}
            </Checkbox>
          );
        })}
    </div>
  );
}

export default MenuItem;
