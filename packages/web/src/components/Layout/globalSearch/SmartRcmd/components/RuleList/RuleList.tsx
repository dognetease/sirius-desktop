import { SmartRcmdItem, getIn18Text, ICompanySubFallItem } from 'api';
import React, { useState, useImperativeHandle } from 'react';
import styles from './rulelist.module.scss';
import classNames from 'classnames';
import { Col, Row } from 'antd';
import RuleListItem from './RuleListItem';
import { ReactComponent as ExpandArrow } from '../../assets/common-arrow-up.svg';
import { ReactComponent as AddIcon } from '../../assets/common-add.svg';
import { useMeasure } from 'react-use';
import { ReactComponent as GuideVideoBuleTipsSvg } from '@/images/globalSearch/videBuleTips.svg';
import { marketingDetail } from '@web-unitable-crm/api/helper';
import { ConfigActions } from '@web-common/state/reducer';
import { useAppDispatch } from '@web-common/state/createStore';

const LIST_ITEM_WIDTH = 274;
const LIST_ITEM_MARGIN_R = 12;

interface RuleListProps<T = SmartRcmdItem> extends React.HTMLAttributes<HTMLDivElement> {
  list: T[];
  selectedItem?: T | null;
  onUpdateList?(): void;
  onCreate?(): void;
  onUpdate?(item: T): void;
  onDelete?(item: T): void;
  onSelected?(item: T): void;
  tableList?: ICompanySubFallItem[];
}

export interface RuleRefProp {
  handleExpand(param: boolean): void;
}

const RuleList = React.forwardRef<RuleRefProp, RuleListProps>(
  ({ list, selectedItem, className, onUpdateList, onCreate, onUpdate, onDelete, onSelected, tableList = [], ...rest }, childRef) => {
    const [expand, setExpand] = useState<boolean>(false);
    const [ref, { width }] = useMeasure<HTMLDivElement>();

    useImperativeHandle(
      childRef,
      () => {
        return {
          handleExpand: vals => {
            setExpand(vals);
          },
        };
      },
      [expand]
    );
    const selectItemId = selectedItem?.id;
    const handleToggleExpand = () => {
      setExpand(!expand);
    };
    const listSingle = list.length === 1;
    const elementCountInOneRow = Math.floor(width / (LIST_ITEM_WIDTH + LIST_ITEM_MARGIN_R));
    const dispatch = useAppDispatch();
    const onPlayVideo = (params: { videoId: string; source: string; scene: string }) => {
      const { videoId, source, scene } = params;
      dispatch(ConfigActions.showVideoDrawer({ videoId: videoId, source, scene }));
    };
    return (
      <div className={classNames(styles.container, className)} {...rest}>
        {list.length > elementCountInOneRow && (
          <div
            className={classNames(styles.expandContainer, {
              [styles.expandContainerExpanded]: expand,
            })}
            onClick={handleToggleExpand}
            style={{
              left: elementCountInOneRow * (LIST_ITEM_WIDTH + LIST_ITEM_MARGIN_R),
            }}
          >
            <ExpandArrow />
          </div>
        )}
        <div
          className={classNames(styles.listWrapper, {
            [styles.listWrapperExpand]: expand,
            [styles.listWrapperSingle]: listSingle,
          })}
        >
          <div ref={ref} className={styles.list}>
            {list.map(item => (
              <div
                key={item.id}
                className={classNames(styles.listItem, {
                  [styles.listItemSingle]: listSingle,
                })}
                style={
                  listSingle
                    ? undefined
                    : {
                        // order: Number(selectItemId !== item.id),
                        width: LIST_ITEM_WIDTH,
                        marginRight: LIST_ITEM_MARGIN_R,
                      }
                }
              >
                <RuleListItem
                  single={listSingle}
                  onClick={() => {
                    onSelected?.(item);
                  }}
                  selected={selectItemId === item.id}
                  key={item.id}
                  item={item}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  openDetail={param => {
                    param &&
                      marketingDetail({
                        emailKey: param,
                        detailType: 'aiHosting',
                        from: 'smartrcmd',
                        backUrl: encodeURIComponent(`#wmData?page=smartrcmd&ruleId=${item.id}`),
                      });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.btnBox}>
          <a
            className={styles.createBtn}
            onClick={e => {
              e.preventDefault();
              onCreate?.();
            }}
          >
            <AddIcon />
            <span>{getIn18Text('XINJIANTUIJIANGUIZE')}</span>
          </a>
          {tableList.length > 0 && (
            <div className={styles.showTipsWrapper} onClick={() => onPlayVideo({ videoId: 'V8', source: 'kehufaxian', scene: 'kehufaxian_5' })}>
              <GuideVideoBuleTipsSvg />
              <span className={styles.searchTipsText}>如何通过智能推荐获客</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default RuleList;
