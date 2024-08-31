import React, { useMemo } from 'react';
import { Menu } from 'antd';
import classnames from 'classnames';
import style from './popItem.module.scss';
import { IconMapKey } from '@web-common/components/UI/IconCard';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
export interface PopItemProps {
  /** 展示名称 */
  name: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 图标类型 */
  iconType: IconMapKey;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** 显示分割线 */
  divider?: boolean;
  style?: React.CSSProperties;
  testId?: string;
}
const PopItem: React.FC<PopItemProps> = props => {
  const { name, disabled = false, hidden = false, onClick, divider = false, style: _style = {}, testId } = props;
  const key = useMemo(() => {
    return name + Math.random();
  }, [name]);
  const ckFun = e => {
    if (disabled) {
      Toast.info({ content: getIn18Text('MEIYOUQUANXIAN\uFF0C') });
    } else {
      onClick(e);
    }
  };
  return (
    <Menu.Item key={key} eventKey={key}>
      <div
        className={classnames(style.popItem, {
          [style.popItemDisabled]: disabled,
          [style.popItemDivider]: divider && !hidden,
        })}
        data-test-id={`disk_table_more_operation_${testId}_btn`}
        style={{ ..._style }}
        onClick={ckFun}
        hidden={hidden}
      >
        <span className={`${style.text}`}>{name}</span>
      </div>
    </Menu.Item>
  );
};
export default PopItem;
