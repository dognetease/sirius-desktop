import React, { useEffect, useState } from 'react';
import classnames from 'classnames/bind';
import style from './index.module.scss';
import { Item, MatchedTeam } from './item';

const realStyle = classnames.bind(style);

interface Props {
  keyword: string;
  displayAll?: boolean;
  afterGetRecord?: (obj) => void;
  teamlistData: MatchedTeam[];
  height?: number;
  [key: string]: any;
}

const name: React.FC<Props> = ({ displayAll, teamlistData, keyword, height, ...restProps }) => {
  // const [recods, setRecods] = useState([]);

  const [displayNum, setDisplayNum] = useState(3) as any;

  useEffect(() => {
    setDisplayNum(displayAll ? undefined : 3);
  }, [displayAll]);

  return (
    <div className={realStyle('teamlistWrapper')} style={{ height: `${height}px` }}>
      {
        // @ts-ignore
        teamlistData.slice(0, displayNum).map(item => (
          <Item teamInfo={item} key={item.teamId} keyword={keyword} {...restProps} />
        ))
      }
    </div>
  );
};

export default name;
