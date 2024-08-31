import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiHolder, apis, MailApi, MailEntryModel } from 'api';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import Future from '@/images/empty/future.png';
import StrangerList from './strangerList';
import MailExchange from './mailExchange';
import BatchStrangerOpt from './BatchStrangerOpt/batchStrangerOpt';
import { StrangerActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import ReadMail from '../components/ReadMail/ReadMail';
import ModuleHotKey from './moduleHotKey';
import MailSyncModal from '@web-mail/components/MailSyncModal/MailSyncModal';
import { stringMap } from 'types';
import useState2RM from '../hooks/useState2ReduxMock';
import useMailStore from '../hooks/useMailStoreRedux';
import MailBoxEventHander from '@web-mail/components/mailBoxEventHander/readMailEventHandler';
// import { setCurrentAccount } from '../util';
import { getIn18Text } from 'api';
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const systemApi = apiHolder.api.getSystemApi();
const eventApi = apiHolder.api.getEventApi();
const isElectron = systemApi.isElectron();
export interface StrangerMailsBoxProps {}
const StrangerMailsBox: React.FC<StrangerMailsBoxProps> = () => {
  // const curActiveStrangerIds = useAppSelector(state => state.strangerReducer.activeStrangerIds);
  const [curActiveStrangerIds, setCurActiveStrangerIds] = useState2RM('activeStrangerIds', 'doUpdateActiveStrangerIds');
  const allStrangers = useAppSelector(state => state.strangerReducer.strangers);
  const curStranger = useAppSelector(state => state.strangerReducer.curStranger);
  const [mailDataList, setMailList] = useMailStore('mailRelateStrangeMailList');
  // const selectedMail = useAppSelector(state => state.strangerReducer.selectedMail);
  const [selectedMail, setSelectMail] = useState2RM('mailRelateStrangerActiveId', 'doUpdateMailRelateStrangerActiveId');
  const [gettingAllStrangers, setGettingAllStrangers] = useState<boolean>(false);
  const MailBoxEventHanderMemo = useMemo(() => <MailBoxEventHander />, []);
  const curStrangerRef = useRef(curStranger);
  curStrangerRef.current = curStranger;
  const curActiveStrangerIdsRef = useRef(curActiveStrangerIds);
  curActiveStrangerIdsRef.current = curActiveStrangerIds;
  const allStrangersRef = useRef(allStrangers);
  allStrangersRef.current = allStrangers;
  // 是否展示批量处理
  const showBatchStangerOpt = useMemo(() => {
    return curActiveStrangerIds.length > 1;
  }, [curActiveStrangerIds]);
  const dispatch = useAppDispatch();
  // 邮件id到modal的映射
  const [mailIdMap, setMailMap] = useState<stringMap>({});
  useEffect(() => {
    let map: stringMap = {};
    mailDataList.forEach((item: MailEntryModel) => {
      map[item.entry.id] = item;
    });
    setMailMap(map);
  }, [mailDataList]);
  // 初始化
  const initStrangerMailsBox = async () => {
    setGettingAllStrangers(true);
    try {
      // 获取所有陌生人
      // setCurrentAccount();
      const allStrangers = await mailApi.doGetAllStrangers();
      dispatch(StrangerActions.setStrangers(allStrangers));
      // 默认第一个选中
      if (allStrangers[0]) {
        dispatch(StrangerActions.setCurStranger(allStrangers[0]));
        //dispatch(StrangerActions.setActiveStrangerIds([allStrangers[0].accountName]));
        setCurActiveStrangerIds([allStrangers[0].accountName]);
      }
      setGettingAllStrangers(false);
    } catch (error) {
      console.log(getIn18Text('HUOQUQUANBUMO'), error);
      setGettingAllStrangers(false);
    }
  };
  // 新窗口打开
  // const openNewWindow = (ids: string[]) => {
  //   if (ids && ids.length === 1) {
  //     const id = ids[0];
  //     // 正常情况下，应该通过id找到对应邮件，然后判断是否为聚合邮件，但是mailDataList不会存在聚合邮件与非聚合邮件混合的情况，并且遍历查找当前id的邮件也比较耗性能，所以简单拿第一封邮件进行了判断
  //     const isThread = mailDataList.length ? mailDataList[0]?.isThread : false;
  //     if (systemApi.isElectron()) {
  //       systemApi.createWindowWithInitData('readMail', { eventName: 'initPage', eventData: id, eventStrData: isThread ? 'isthread' : '' });
  //     } else {
  //       window.open(`/readMail?id=${id}${isThread ? '&isthread=1' : ''}`, 'readMail', 'menubar=0,scrollbars=1,resizable=1,width=800,height=600');
  //     }
  //   }
  // };
  useEffect(() => {
    // 仅用于web electron由initPage处理
    if (!isElectron) {
      initStrangerMailsBox();
    }
  }, []);
  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('initPage', {
      name: 'strangerMailBoxInitPage',
      func: _ => initStrangerMailsBox(),
    });
    const eid1 = eventApi.registerSysEventObserver('electronClose', {
      name: 'strangerMailBoxElectronClose',
      func: _ => {
        // 单例情况下数据会被保留！ 因此得手动清空
        dispatch(StrangerActions.setStrangers([]));
        // dispatch(StrangerActions.setMailList([]));
        setMailList([]);
        // dispatch(StrangerActions.setSelectedMail(''));
        setSelectMail('');
      },
    });
    // 陌生人列表发生改变时
    const eid2 = eventApi.registerSysEventObserver('emailListChange', {
      func: ev => {
        const { eventStrData, eventData } = ev;
        // 只关注被标记的情况
        if (eventStrData === 'mark') {
          const curStrangerVal = curStrangerRef?.current;
          const curActiveStrangerIdsVal = curActiveStrangerIdsRef?.current;
          const allStrangersVal = allStrangersRef?.current;
          // 被标记的账号
          const { markedAccountNames } = eventData;
          // console.log('markedAccountNames', markedAccountNames, curStrangerVal, curActiveStrangerIdsVal, allStrangersVal );
          // 从陌生人列表过滤
          dispatch(StrangerActions.setStrangers(allStrangersVal.filter(item => !markedAccountNames.includes(item.accountName))));
          // 选中的陌生人过滤
          // dispatch(StrangerActions.setActiveStrangerIds(curActiveStrangerIdsVal.filter(item => !markedAccountNames.includes(item))));
          setCurActiveStrangerIds(curActiveStrangerIdsVal.filter(item => !markedAccountNames.includes(item)));
          // 当前查看的账号被标记 清空页面内容
          if (markedAccountNames.includes(curStrangerVal?.accountName)) {
            dispatch(StrangerActions.setCurStranger(null));
            // dispatch(StrangerActions.setMailList([]));
            setMailList([]);
            setSelectMail('');
            // dispatch(StrangerActions.setSelectedMail(''));
          }
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('initPage', eid);
      eventApi.unregisterSysEventObserver('electronClose', eid1);
      eventApi.unregisterSysEventObserver('emailListChange', eid2);
    };
  }, []);
  return (
    <>
      <ModuleHotKey>
        {!!isElectron && <div style={{ width: '100%', height: '0.5px', position: 'absolute', top: 0, left: 0, background: '#d6d6d8', zIndex: 2 }} />}
        <PageContentLayout>
          {/* 陌生人 */}
          <SideContentLayout borderRight minWidth={288} defaultWidth={288} maxWidth={288}>
            <StrangerList gettingAllStrangers={gettingAllStrangers} />
          </SideContentLayout>
          {allStrangers?.length > 0 && (
            <>
              {!!showBatchStangerOpt ? (
                <BatchStrangerOpt />
              ) : (
                <>
                  <MailExchange SideContentLayout />
                  <div style={{ minWidth: 500, height: '100%' }}>
                    <ReadMail
                      mailId={{
                        id: selectedMail,
                        account: '',
                      }}
                      tempContent={mailIdMap[selectedMail]}
                      featureConfig={{
                        mailDiscuss: false,
                      }}
                    />
                  </div>
                </>
              )}
            </>
          )}
          {/*全部标记*/}
          {allStrangers?.length === 0 && !gettingAllStrangers && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%' }}>
                <img style={{ width: 160, height: 160, margin: '0 auto', display: 'block' }} src={Future} alt="noDoc" />
                <p
                  style={{
                    marginTop: '20px',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '18px',
                    color: 'rgba(38, 42, 51, 0.5)',
                    textAlign: 'center',
                  }}
                >
                  {getIn18Text('ZANWUXIANGGUANNEI')}
                </p>
              </div>
            </div>
          )}
        </PageContentLayout>
      </ModuleHotKey>
      <MailSyncModal />
      {MailBoxEventHanderMemo}
    </>
  );
};
export default StrangerMailsBox;
