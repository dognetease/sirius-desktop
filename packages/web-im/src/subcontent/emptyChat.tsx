import React, { useState } from 'react';
import classnames from 'classnames/bind';
import style from './emptyChat.module.scss';
import { ReactComponent as Boarding1 } from './boarding/boarding1.svg';
import { ReactComponent as Boarding2 } from './boarding/boarding2.svg';
import { ReactComponent as Boarding3 } from './boarding/boarding3.svg';
import { ReactComponent as Boarding4 } from './boarding/boarding4.svg';
import { ReactComponent as Boarding5 } from './boarding/boarding5.svg';
const realStyle = classnames.bind(style);
// import {} from 'react'
import { getIn18Text } from 'api';
const imSubMenuPannel: React.FC<{}> = () => {
  // const [serialNum] = useState(1);
  const [serialNum] = useState(Math.floor(Math.random() * 5));
  const [boardingList] = useState([
    {
      pic: Boarding1,
      title: getIn18Text('ZIDONGCHUANLIAN '),
      content: getIn18Text('CHAKANXIAOXIHUI'),
    },
    {
      pic: Boarding2,
      title: getIn18Text('CHEHUIXIAOXI '),
      content: getIn18Text('CHEHUIXIAOXIZHONG'),
    },
    {
      pic: Boarding3,
      title: getIn18Text('BIAOQINGHUIFU '),
      content: getIn18Text('SHIYONGBIAOQINGKUAI'),
    },
    {
      pic: Boarding4,
      title: getIn18Text('ZHIDINGHUIHUA '),
      content: getIn18Text('ZHONGYAOHUIHUAYI'),
    },
    {
      pic: Boarding5,
      title: getIn18Text('QUNLIAOXIAOXI '),
      content: getIn18Text('XINRUQUNLIAOCHA'),
    },
  ]);
  return (
    <div className={realStyle('emptyWrap')}>
      <div className={`dark-img-invert-grayscale ${realStyle('noChat')}`}>
        {React.createElement(boardingList[serialNum].pic, {})}
        <p className={realStyle('title')}>{boardingList[serialNum].title}</p>
        <p className={realStyle('content')}>{boardingList[serialNum].content}</p>
      </div>
    </div>
  );
};
export default imSubMenuPannel;
