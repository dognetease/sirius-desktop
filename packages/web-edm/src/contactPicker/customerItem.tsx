import React from 'react';
import { getLabelStyle } from '../utils/utils';
import { Checkbox, CheckboxProps } from 'antd';
import classnames from 'classnames';
import style from './customerItem.module.scss';

interface CustomerItemProps extends CheckboxProps {
  name: string;
  showCheckAll?: boolean;
  labels: {
    label_id: string;
    label_name: string;
  }[];
}

const CustomerItem: React.FC<CustomerItemProps> = props => {
  const { name, labels, children, showCheckAll = false, ...rest } = props;

  return (
    <>
      {name ? (
        <div className={classnames([style.customerItem, showCheckAll ? style.customerItemCheckall : ''])}>
          {showCheckAll ? <Checkbox style={{ marginRight: '10px' }} {...rest}></Checkbox> : ''}
          {name}
          {labels.map(label => (
            <span className={style.label} key={label.label_id} style={getLabelStyle(label.label_id)}>
              {label.label_name}
            </span>
          ))}
        </div>
      ) : (
        ''
      )}
      {children}
    </>
  );
};

CustomerItem.defaultProps = {};

export default CustomerItem;
