import React, { CSSProperties } from 'react';
import { List, ListRowProps } from 'react-virtualized';
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import BaseCard from '@/components/Layout/EnterpriseSetting/salesPitch/components/salesPitchCard';
import { BoardListBaseProps } from '@/components/Layout/EnterpriseSetting/salesPitch/types';
import useState2ReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import { getSalePitchByCardID } from '@/components/Layout/EnterpriseSetting/salesPitch/utils/util';
import style from './index.module.scss';

const ROW_HEIGHT = 126;
const ROW_GAP = 12;

const SalesPitchListReadMail: React.FC<BoardListBaseProps> = props => {
  const { idList } = props;

  const [dataMap] = useState2ReduxMock('dataMap');

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
      const patchedStyle: CSSProperties = {
        ...rowStyle,
        left: rowStyle.left as number,
        top: rowStyle.top as number,
        width: rowStyle.width,
        height: (rowStyle.height as number) - ROW_GAP,
        userSelect: 'none',
        marginBottom: ROW_GAP,
      };
      return (
        <div key={data.cardId} style={patchedStyle}>
          <BaseCard scene="readMailAside" cardId={cardId} patchedStyle={{ height: patchedStyle.height, marginBottom: patchedStyle.marginBottom }} />
        </div>
      );
    };

  return (
    <AutoSizer style={{ width: '100%', height: '100%' }}>
      {({ height, width }) => (
        <List height={height} rowCount={idList.length} rowHeight={ROW_HEIGHT} width={width} rowRenderer={getRowRender()} className={style.listScroll} />
      )}
    </AutoSizer>
  );
};

export default SalesPitchListReadMail;
