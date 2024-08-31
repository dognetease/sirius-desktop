import React from 'react';
import { Button } from 'antd';

import style from './style.module.scss';
import CloseIcon from '@web-common/components/UI/Icons/svgs/CloseMailSvg';
import { getIn18Text } from 'api';

export const ProductTip = (props: { onClose: () => void; showProductModal: () => void }) => {
  const list = [
    {
      title: getIn18Text('SANDATESEGONGNENG'),
      block: [
        {
          name: getIn18Text('JINGMEIPAIBAN，TIGAO'),
          desc: getIn18Text('XITONGZISHIYINGYOUJIAN'),
          img: 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/02/21/803fc831a1754125a62f60c22f26c507.png',
        },
        {
          name: getIn18Text('KEHUXINGWEI，1V'),
          desc: getIn18Text('XITONGGENJUKEHUYOU'),
          img: 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/02/21/79c6d1ba851f48e7923811101ada6115.png',
        },
        {
          name: getIn18Text('TONGJISHUJU，ZHENDUAN'),
          desc: getIn18Text('TONGJISHUJUHUIGENJU'),
          img: 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/02/21/b5880f1ea01d46ae80a0cfb48bb84790.png',
        },
      ],
    },
    {
      title: getIn18Text('LIANGBUJIANYILIUCHENG'),
      block: [
        {
          name: getIn18Text('ZAISHANGPINZHONGXINSHANGCHUAN'),
          desc: getIn18Text('ZAI「KEHUYUYEWU'),
          img: 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/02/21/2bfb06fb7dae4a28a673155f54fa590d.png',
        },
        {
          name: getIn18Text('FASONGYINGXIAOYOUJIANSHI'),
          desc: getIn18Text('ZAI「YINGXIAORENWU '),
          img: 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/02/21/729e06e2c3d34ee6aacc8d1050488fd3.png',
        },
      ],
    },
  ];

  return (
    <div className={style.productTip}>
      <div className={style.productTipHeader}>{getIn18Text('YINGXIAORENWUTIANJIASHANG')}</div>
      <div className={style.productTipClose} onClick={props.onClose}>
        <CloseIcon />
      </div>
      {list.map((block, index) => (
        <div className={style.productTipBlock} key={index}>
          <h3>{block.title}</h3>
          <div className={style.productTipGray}>
            {block.block.map((item, index) => (
              <>
                <div className={style.productTipGrayName}>
                  <span className={style.productTipGrayNum}>{index + 1}</span>
                  <span>{item.name}</span>
                </div>
                <div className={style.productTipDesc}>{item.desc}</div>
                <div className={style.productTipGrayImg}>
                  <img src={item.img} />
                </div>
              </>
            ))}
          </div>
        </div>
      ))}
      <Button type="primary" onClick={props.showProductModal}>
        {getIn18Text('LIJITIANJIA')}
      </Button>
    </div>
  );
};
