import React from 'react';
import classnames from 'classnames';
import IconCard, { IconMapKey } from '@web-common/components/UI/IconCard';
import style from './rowName.module.scss';
import { getIn18Text } from 'api';
interface Props {
  id?: number;
  type: IconMapKey | string;
  showExtShare?: boolean;
  name: string;
  openFileOrDir?: Function;
  collectAble?: boolean; // 是否可收藏
  starred?: boolean;
  collectAction?: (params: { id: number; collect: boolean; type: 'folder' | 'file' }) => void;
}
const RowName: React.FC<Props> = ({ id, type, showExtShare = false, name, openFileOrDir, collectAble, starred, collectAction }) => {
  const frontName = name.slice(0, -8);
  const endFront = name.slice(-8);
  const clickRowName = () => {
    openFileOrDir && openFileOrDir();
  };
  const ckStar = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    id && collectAction && collectAction({ id, collect: !starred, type: type === 'dir' ? 'folder' : 'file' });
  };
  return (
    <div className={style.nameColumn} data-test-id="disk_table_file_column_btn" onClick={clickRowName} title={name}>
      <div className={style.nameIcon}>{type === 'dir' ? <IconCard type="dir" /> : <IconCard type={type} width="24px" height="24px" />}</div>
      <div className={style.nameText}>
        <span className={style.frontName}>{frontName}</span>
        <span>{endFront}</span>
        <span hidden={!showExtShare} className={style.shareExternal}>
          {getIn18Text('WAIBU')}
        </span>
        {/* 收藏 */}
        {collectAble && (
          <div
            className={classnames([style.starBlk], {
              [style.starGold + ' starGold']: starred,
              [style.starGray + ' starGray']: !starred,
            })}
            onClick={e => ckStar(e)}
            data-test-id="disk_table_file_mark_btn"
          >
            <IconCard type={starred ? 'starGold' : 'starGray'} />
          </div>
        )}
      </div>
    </div>
  );
};
export default RowName;
