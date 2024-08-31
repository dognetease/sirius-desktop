import { SmartRcmdItem } from 'api';
import React, { useMemo, useRef } from 'react';
import { ReactComponent as DelelteIcon } from '../../assets/common-delete.svg';
import { ReactComponent as EditIcon } from '../../assets/common-edit.svg';
import styles from './rulelist.module.scss';
import classNames from 'classnames';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import { ReactComponent as DisableIcon } from '../../assets/disable_edit.svg';

interface RuleListItemProps<T = SmartRcmdItem> extends React.HTMLAttributes<HTMLDivElement> {
  onUpdate?(item: T): void;
  onDelete?(item: T): void;
  item: T;
  selected?: boolean;
  single?: boolean;
  openDetail?: (params?: string) => void;
}

const RuleListItem: React.FC<RuleListItemProps> = ({ item, onUpdate, onDelete, selected, className, single, openDetail, ...rest }) => {
  const taskTip = useMemo(() => {
    if (item.extPlanId && item.extTaskId) {
      return (
        <>
          <span className={styles.tips}>
            若需修改推荐规则{' '}
            <a
              href="javascript:;"
              style={{ color: '#7088ff' }}
              onClick={() => {
                openDetail && openDetail(item.extPlanId);
              }}
            >
              请前往自动获客任务
            </a>
          </span>
        </>
      );
    } else {
      return '编辑';
    }
  }, [item.extPlanId]);
  return (
    <div
      {...rest}
      className={classNames(styles.card, className, {
        [styles.cardSelect]: selected,
        [styles.cardSingle]: single,
      })}
    >
      <Tooltip title={item.value} placement="bottom">
        <p
          className={classNames(styles.title, {
            [styles.titleNew]: item.status === 1,
          })}
        >
          {item.value}
        </p>
      </Tooltip>
      <div
        className={classNames(styles.countryWrapper, {
          [styles.countryWrapperHasCountry]: item.country && item.country.length > 0,
        })}
      >
        <span className={styles.country}>{item.country?.join('，') || '不限国家'}</span>
        {item.country && item.country.length > 2 && <span className={styles.countryCount}>{`共${item.country.length}个国家`}</span>}
        <div className={styles.operate}>
          <Tooltip title={taskTip}>
            {!item.extPlanId ? (
              <span
                onClick={e => {
                  e.stopPropagation();
                  onUpdate?.(item);
                }}
              >
                <EditIcon />
              </span>
            ) : (
              <span
                onClick={e => {
                  e.stopPropagation();
                }}
              >
                <DisableIcon />
              </span>
            )}
          </Tooltip>
          <Tooltip title="删除">
            <span
              onClick={e => {
                e.stopPropagation();
                onDelete?.(item);
              }}
            >
              <DelelteIcon />
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default RuleListItem;
