import React, { useReducer, useRef } from 'react';
import classnames from 'classnames';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { useVersionCheck } from '@web-common/hooks/useVersion';

import { ReactComponent as RefreshIcon } from '@/images/icons/regularcustomer/refresh.svg';
import { CustomerDiscoveryContext, initialState, reducer } from './context';
import { ManualTaskList } from './containers/ManualTaskList';
import style from './autorecommend.module.scss';
import { getIn18Text } from 'api';
const ManualRecommend: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const menuVersion = useVersionCheck();
  const isV2 = menuVersion === 'v2';
  const list = useRef<{
    reload(flg: boolean): void;
  }>();
  const els = (
    <CustomerDiscoveryContext.Provider value={{ state, dispatch }}>
      <div className={classnames([style.wrapper, style.flex, style.flexCol])}>
        <div className={style.top}>
          <div className={style.title}>
            {isV2 ? undefined : getIn18Text('SHOUDONGSHAIXUAN')}
            <span className={style.taskDesc}>{getIn18Text('TONGGUODINGZHIHUASHAIXUANTIAOJIAN\uFF0CSHEZHILISHIYOUJIANJUHERENWU\uFF0CTUISONGZHILIEBIAOZHONG')}</span>
            <span className={style.linkBtn} onClick={() => list?.current?.reload(false)}>
              <RefreshIcon />
              <span>{getIn18Text('SHUAXIN')}</span>
            </span>
          </div>
        </div>
        <div className={classnames([style.content, style.flex1, style.flex, style.flexCol])}>
          <ManualTaskList ref={list} />
        </div>
      </div>
    </CustomerDiscoveryContext.Provider>
  );
  if (isV2) {
    return els;
  }
  return (
    <PermissionCheckPage resourceLabel="PREVIOUS_CONTACT" accessLabel="CUSTOM_RECOMMEND" menu="PREVIOUS_CONTACT_CUSTOM_RECOMMEND">
      {els}
    </PermissionCheckPage>
  );
};
export default ManualRecommend;
