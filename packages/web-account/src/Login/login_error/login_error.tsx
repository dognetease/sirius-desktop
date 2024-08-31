import React, { FC, useEffect } from 'react';
import { Button } from 'antd';
import { apiHolder, apis, locationHelper, DataTrackerApi } from 'api';
import LoginErrorBg from '@/images/login-error.png';
import style from './login_error.module.scss';
import { getIn18Text } from 'api';

const performanceApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
export const LoginError: FC<{
  sid: string; // sessionid
  show_old: string; // 返回标记
  hideBtn?: boolean;
}> = ({ sid, show_old, hideBtn }) => {
  const host = locationHelper.getHost();
  useEffect(() => {
    performanceApi.track('web_jump_page_err_showed', {
      host,
    });
    // 错误页面打点
    // performanceApi.point({
    //   statKey: 'jump_page_err_showed',
    //   statSubKey: host,
    //   valueType: 4,
    //   value: 1,
    //   flushAndReportImmediate: true,
    // });
  }, []);
  return (
    <div className={style.loginErrorWrapper}>
      <div>
        <img className={style.errorBg} src={LoginErrorBg} alt="" />
      </div>
      <div className={style.errorInfo}>{getIn18Text('AIYAJIAZAI')}</div>
      {!hideBtn ? (
        <div className={style.btnWrapper}>
          <Button
            onClick={() => {
              // 前往新版按钮打点
              performanceApi.track('web_jump_page_bt_clicked_new', {
                host,
              });
              if (history) {
                history.go(); // 刷新页面
              }
            }}
            type="primary"
            style={{ marginRight: '12px' }}
          >
            {getIn18Text('QIANWANGXINBAN')}
          </Button>
          <Button
            onClick={() => {
              // 返回旧版按钮打点
              performanceApi.track('web_jump_page_bt_clicked_old', {
                host,
              });
              location.assign('/js6/upgrade.jsp?style=12&sid=' + sid + '&show_old=' + show_old);
            }}
          >
            {getIn18Text('FANHUIJIUBAN')}
          </Button>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};
