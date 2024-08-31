import { getIn18Text } from 'api';
import React, { useMemo } from 'react';
import { Button, message } from 'antd';
import { useAppSelector } from '@web-common/state/createStore';

import style from './orderStateTip.module.scss';
import noOrderImg from '../images/sns-order-state-tip.png';
import noOrderImg1 from '../images/sns-order-state-tip1.png';
import { SnsMarketingMenuData } from '../menu';

const checkedKeys = SnsMarketingMenuData[0].children.map(item => item._label);

// const rowData = [
//   {
//     title: '账号运营',
//     desc: '统一管理Facebook 、LinkedIn等社媒账号',
//   },
//   {
//     title: '智能发帖',
//     desc: 'AI一键生成发帖内容，并自动创建营销日历',
//   },
//   {
//     title: '互动管理',
//     desc: '一个平台回复各个账号的评论、私信',
//   },
//   {
//     title: '增值服务',
//     desc: '提供开户、基础运营、广告投放(Facebook&Google)等服务',
//   },
// ];

const SnsMarketingNoOrderTip = () => {
  const handleClick = () => {
    message.success(getIn18Text('QIYEZANWEIKAITONGGAI'));
  };
  return (
    <div className={style.noOrderTip}>
      <div className={style.inner}>
        <div className={style.left}>
          <h3>{getIn18Text('ZIDONGHUASHEMEIYUNYING')}</h3>
          <div style={{ margin: '22px 0 28px' }}>
            <img src={noOrderImg1} width="315" height="240" alt="" />
          </div>
          <Button block onClick={handleClick} type="primary" size="large" style={{ height: 36 }}>
            {getIn18Text('LIANXIKEHUJINGLILE')}
          </Button>
        </div>
        <div className={style.right}>
          <img src={noOrderImg} width="512" height="444" alt="" />
        </div>
      </div>
    </div>
  );
};

export function HocOrderState(WrapElement: React.FunctionComponent<any>) {
  const wrapOrderStateComponent: React.FC<any> = props => {
    const visibleMenuLabels = useAppSelector(state => state.privilegeReducer.visibleMenuLabels);
    const isBuySnsMarketing = useMemo(() => {
      return checkedKeys.some(key => key in visibleMenuLabels);
    }, [visibleMenuLabels]);

    if (isBuySnsMarketing) {
      return <WrapElement {...props} />;
    }

    return <SnsMarketingNoOrderTip />;
  };

  return wrapOrderStateComponent;
}
