import { apiHolder as api, apis, DataTrackerApi } from 'api';
import React, { useCallback, useMemo } from 'react';
import styles from './cloudMailSearchEntry.module.scss';
import { useActions, useAppDispatch, useAppSelector, MailActions } from '@web-common/state/createStore';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { getIn18Text } from 'api';

const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface Prop {}

const CloudMailSearchEntry: React.FC<Prop> = () => {
  const dispatch = useAppDispatch();
  const reducer = useActions(MailActions);
  const { extraSearchCloudMailListObjStatus, extraSearchCloudMailListObj, mailSearchAccount, mailSearchStateMap } = useAppSelector(state => state.mailReducer);
  const entryShow = useMemo(() => {
    if (!mailSearchAccount || !mailSearchStateMap) return false;
    const searchType = mailSearchStateMap[mailSearchAccount];
    return searchType === 'local' && extraSearchCloudMailListObjStatus;
  }, [mailSearchAccount, mailSearchStateMap, extraSearchCloudMailListObjStatus]);

  const cloudMailListTotal = useMemo(() => {
    if (extraSearchCloudMailListObj) return extraSearchCloudMailListObj?.total || 0;
    return 0;
  }, [extraSearchCloudMailListObj]);

  // 展示全部
  const showAll = useCallback(() => {
    if (!mailSearchAccount) return;
    reducer.beforeSearchServer({ account: mailSearchAccount });
    dispatch(
      Thunks.loadSearchMailList({
        startIndex: 0,
        noCache: false,
      })
    );
    trackApi.track('pcMail_executeMailSearch', {
      searchMode: '全文搜索（云端）',
    });
  }, [mailSearchAccount]);

  // 重新搜索云端邮件
  const searchCloudMail = () => {
    reducer.resetExtraSearchCloudMailList({});
    dispatch(
      Thunks.searchCloudMailListExtra({
        startIndex: 0,
      })
    );
  };

  return (
    <>
      {entryShow && (
        <div className={styles.cloudMailSearchEntry}>
          {extraSearchCloudMailListObjStatus === 'pending' && <>{getIn18Text('ZHENGZAISOUSUOYUNDUANYOUJIAN')}</>}
          {extraSearchCloudMailListObjStatus === 'success' && (
            <>
              {cloudMailListTotal > 0 ? (
                <>
                  {getIn18Text('TONGSHIGONGFAXIAN')}
                  {cloudMailListTotal}
                  {getIn18Text('FENGYUNDUANYOUJIANSHIFOU')}{' '}
                  <span className={styles.showAll} onClick={showAll}>
                    {getIn18Text('ZHANSHIQUANBU')}
                  </span>
                </>
              ) : (
                ''
              )}
            </>
          )}
          {extraSearchCloudMailListObjStatus === 'fail' && (
            <>
              {getIn18Text('YUNDUANSOUSUOSHIBAI')}
              <span className={styles.showAll} onClick={searchCloudMail}>
                {getIn18Text('SOUSUOYUNDUANYOUJIAN')}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default CloudMailSearchEntry;
