import React, { useEffect, useState } from 'react';
import { apiHolder, NIMApi } from 'api';
import classnames from 'classnames/bind';
import ReactItem from '../RecordItem';
import style from './index.module.scss';

const realStyle = classnames.bind(style);

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

interface Props {
  keyWord: string;
  displayAll?: boolean;
  afterGetRecord?: (obj) => void;
  recordData: any;
  height?: number;
  [key: string]: any;
}

const name: React.FC<Props> = ({ displayAll, recordData, keyWord, height, ...restProps }) => {
  // const [recods, setRecods] = useState([]);

  const [displayNum, setDisplayNum] = useState(3) as any;

  // const getLocalMsgsDone = (err, data) => {
  //     setRecods(data.msgs);
  //     if (afterGetRecord) afterGetRecord({data});
  // };

  // useEffect(() => {
  //     if (!keyWord) return;
  //     nimApi.getLocalMsgs({
  //         keyword: keyWord,
  //         done: getLocalMsgsDone
  //     });
  // }, [keyWord]);

  useEffect(() => {
    setDisplayNum(displayAll ? undefined : 3);
  }, [displayAll]);

  return (
    <div className={realStyle('recordWrapper')} style={{ height: `${height}px` }}>
      {
        // @ts-ignore
        recordData.slice(0, displayNum).map(item => (
          <ReactItem key={item.idServer} msg={item} keyword={keyWord} {...restProps} />
        ))
      }
    </div>
  );
};

export default name;
