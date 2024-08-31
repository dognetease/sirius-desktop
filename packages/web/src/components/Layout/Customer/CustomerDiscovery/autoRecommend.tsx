import React, { useReducer, useRef } from 'react';
import classnames from 'classnames';
import { getIn18Text } from 'api';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { ReactComponent as RefreshIcon } from '@/images/icons/regularcustomer/refresh.svg';
import { CustomerDiscoveryContext, initialState, reducer } from './context';
import { AutoTaskList } from './containers/AutoTaskList';
import { OverView } from './containers/OverView';
import style from './autorecommend.module.scss';

const AutoRecommend: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const list = useRef<{
    reload(flg: boolean): void;
  }>();
  const menuVersion = useVersionCheck();
  const isV2 = menuVersion === 'v2';
  const els = (
    <CustomerDiscoveryContext.Provider value={{ state, dispatch }}>
      <div className={classnames([style.wrapper, style.flex, style.flexCol])}>
        <div className={style.top}>
          <div className={style.title}>
            {isV2 ? undefined : getIn18Text('ZIDONGSHAIXUAN')}
            <span className={style.taskDesc}>
              {getIn18Text(
                'YOUJIANFUWUHUIGENJUYOUJIANWANGLAIQINGKUANG\uFF0CYIHOUZHUIYUMINGJINXINGJUHETUIJIAN\u3002RUOWEIWANCHENGCHULIDERENWUDADAO3TIAO\uFF0CXITONGTUIJIANJIANGZANTING\uFF0CCHULIWANCHENGHOUZAIJIXUJINXINGTUIJIAN\u3002'
              )}
            </span>
            <span className={style.linkBtn} onClick={() => list?.current?.reload(false)}>
              <RefreshIcon />
              <span>{getIn18Text('SHUAXIN')}</span>
            </span>
          </div>
          <div className={style.ruleTitle}>{getIn18Text('WANGLAIYOUJIANSHAIXUANGUIZE')}</div>
          <OverView />
        </div>
        <div className={classnames([style.content, style.flex1, style.flex, style.flexCol])}>
          <AutoTaskList ref={list} />
        </div>
      </div>
    </CustomerDiscoveryContext.Provider>
  );
  if (isV2) {
    return els;
  }

  return (
    <PermissionCheckPage resourceLabel="PREVIOUS_CONTACT" accessLabel="AUTO_RECOMMEND" menu="PREVIOUS_CONTACT_AUTO_RECOMMEND">
      {els}
    </PermissionCheckPage>
  );
};
export default AutoRecommend;
