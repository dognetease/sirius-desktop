import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import style from './marktingGuide.module.scss';
import { message } from 'antd';
import classnames from 'classnames/bind';
import { ReactComponent as LightIcon } from './images/lightIcon.svg';
import { navigate } from '@reach/router';
import { AiWriteMailReducer, useActions } from '@web-common/state/createStore';

const realStyle = classnames.bind(style);

export const MarktingAihostingConfig: React.FC<{
  autoCount: number;
  manualCount: number;
  manualContactCount: number;
}> = ({ autoCount, manualCount, manualContactCount }) => {
  const { changeAiHostingInitObj } = useActions(AiWriteMailReducer);

  const gotoManualTaskConfig = () => {
    changeAiHostingInitObj({
      type: 'normal',
      from: 'addressBook',
      back: '#edm?page=addressBookIndex',
      trackFrom: 'addressBook',
    });
    navigate('#edm?page=aiHosting');
  };
  const gotoAutoTaskConfig = () => {
    // navigate('#wmData?page=customs');
    changeAiHostingInitObj({
      type: 'automatic',
      from: 'addressBook',
      back: '#edm?page=addressBookIndex',
      trackFrom: 'contactTask',
    });
    navigate('#edm?page=aiHosting');
  };

  const gotoAddContact = () => {
    changeAiHostingInitObj({
      type: 'contactAdd',
      from: 'addressBook',
      back: '#edm?page=addressBookIndex',
      trackFrom: 'addressBook',
    });
    navigate('#edm?page=aiHosting');
  };

  return (
    <div className={realStyle('marktingGuideWrapper')}>
      {autoCount <= 0 || manualCount <= 0 || manualContactCount <= 0 ? (
        <p className={realStyle('tips')}>您有未配置的营销托管多轮营销或自动获客任务，完成配置可以进一步提升营销效果</p>
      ) : (
        <p className={realStyle('tips', 'success')}>非常棒！已完成营销托管-多轮营销任务和自动获客任务的配置，在高效获客的路上狂奔！</p>
      )}

      <div className={realStyle('guideList')}>
        <div className={realStyle('guideItem', 'withStatus', [manualCount > 0 ? 'success' : 'warning'])}>
          配置营销托管-多轮营销任务，对联系人自动进行多轮营销，回复率提升50%
          <span className={realStyle('marktingAction')} onClick={gotoManualTaskConfig}>
            去配置
          </span>
        </div>
        <div className={realStyle('guideItem', 'withStatus', [autoCount > 0 ? 'success' : 'warning'])}>
          配置营销托管-自动获客任务，A自动推荐目标客户，自动完成多轮营销，大幅提升营销效率，获得不休息的A业务员
          <span className={realStyle('marktingAction')} onClick={gotoAutoTaskConfig}>
            去配置
          </span>
        </div>

        {autoCount > 0 && manualCount > 0 ? (
          <div className={realStyle('guideItem', 'withStatus', [manualContactCount > 0 ? 'success' : 'warning'])}>
            {manualContactCount > 0 ? '当前营销托管有营销中的联系人，可以继续添加更多联系人' : '当前营销托管任务无营销中的联系人，请及时添加联系人进行多轮营销'}
            <span className={realStyle('marktingAction')} onClick={gotoAddContact}>
              去添加联系人
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
