import React, { CSSProperties } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { List, ListRowProps } from 'react-virtualized';
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import style from './index.module.scss';
import BaseCard from '@/components/Layout/EnterpriseSetting/salesPitch/components/salesPitchCard';
import { SalesPitchBoardListProps } from '@/components/Layout/EnterpriseSetting/salesPitch/types';
import { getSalePitchByCardID, CARD_CONFIG } from '@/components/Layout/EnterpriseSetting/salesPitch/utils/util';
import useSalesPitchData from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useSalesPitchData';

const SalesPitchBoardList: React.FC<SalesPitchBoardListProps> = props => {
  const { stageId, idList } = props;

  const [dataMap] = useSalesPitchData();

  const getRowRender =
    () =>
    ({ index, style: rowStyle }: ListRowProps) => {
      const cardId = idList[index];
      if (!cardId) {
        return null;
      }
      const data = getSalePitchByCardID(cardId, dataMap);
      if (!data) {
        return null;
      }
      const isLastCard = index === idList.length - 1;
      const patchedStyle: CSSProperties = {
        ...rowStyle,
        left: rowStyle.left as number,
        top: rowStyle.top as number,
        width: rowStyle.width,
        height: (rowStyle.height as number) - (isLastCard ? 0 : CARD_CONFIG.ROW_GAP),
        userSelect: 'none',
        // o(╥﹏╥)o 这个属性看着没用，但是实际上是靠它补齐 rowHeight（212）与内部卡片的height（200）的差距，否则拖动时会上下抖动一下
        marginBottom: isLastCard ? 0 : CARD_CONFIG.ROW_GAP,
      };
      return (
        <div key={data.cardId} style={patchedStyle}>
          <Draggable draggableId={data.cardId} index={index}>
            {(provided, snapshot) => (
              <BaseCard
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
                cardId={cardId}
                provided={provided}
                snapshot={snapshot}
                patchedStyle={{ height: patchedStyle.height, marginBottom: patchedStyle.marginBottom }}
              />
            )}
          </Draggable>
        </div>
      );
    };

  return (
    <div className={classNames(style.salesPitchBoardList, idList.length === 0 ? style.salesPitchBoardListNoData : '')}>
      <AutoSizer style={{ width: '100%', height: '100%' }}>
        {({ height, width }) => (
          <Droppable
            droppableId={stageId}
            // 不同列暂时不支持跨列拖拽，使用 type 比 isDropDisabled更简单，而且使用 isDropDisabled，会有延迟的问题，拖拽会在其他列发生一次
            // https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/api/droppable.md#conditionally-dropping
            // isDropDisabled={isDropDisabled}
            type={stageId}
            mode="virtual"
            renderClone={(provided, snapshot, rubric) => (
              <BaseCard
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
                cardId={idList[rubric.source.index]}
                provided={provided}
                snapshot={snapshot}
                patchedStyle={{ margin: 0, height: CARD_CONFIG.ROW_HEIGHT - CARD_CONFIG.ROW_GAP }}
              />
            )}
          >
            {(droppableProvided, snapshot) => {
              const itemCount = snapshot.isUsingPlaceholder ? idList.length + 1 : idList.length;
              return (
                <List
                  /* eslint-disable-next-line react/jsx-props-no-spreading */
                  {...droppableProvided.droppableProps}
                  height={height}
                  rowCount={itemCount}
                  rowHeight={CARD_CONFIG.ROW_HEIGHT}
                  width={width}
                  ref={ref => {
                    if (ref) {
                      // eslint-disable-next-line react/no-find-dom-node
                      const el = ReactDOM.findDOMNode(ref);
                      // 如果是react18，不支持findDOMNode，可以使用下面的临时方案
                      // const el = document.getElementsByClassName('ReactVirtualized__Grid')[0];
                      if (el instanceof HTMLElement) {
                        droppableProvided.innerRef(el);
                      }
                    }
                  }}
                  className={style.listScroll}
                  rowRenderer={getRowRender()}
                />
              );
            }}
          </Droppable>
        )}
      </AutoSizer>
    </div>
  );
};

export default SalesPitchBoardList;
