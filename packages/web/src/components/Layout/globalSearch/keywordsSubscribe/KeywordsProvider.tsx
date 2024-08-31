import { ReadCountActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { api, apis, GlobalSearchApi } from 'api';
import React, { createContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { useLocation } from '@reach/router';
import { parseUrl } from 'query-string';
import { refreshSubListReducer, refreshSubListInitialState, SubKeyWordContext } from './subcontext';
import SubKeywordFormModal from './SubKeywordFormModal/SubkeyWordFormModal';
import EmailGuess from '../EmailGuess/EmailGuess';
import { createPortal } from 'react-dom';

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
export const WmBigDataPageLayoutContext = createContext<{ detailRootDom?: HTMLElement | null }>({
  detailRootDom: null,
});
export default (props: { children: React.ReactNode; emailGuessPortalEl?: Element | null }) => {
  const [state, dispatch] = useReducer(refreshSubListReducer, refreshSubListInitialState);
  const currentCount = useAppSelector(state => state.readCountReducer.unreadCount.globalSearch) || 0;
  const currentCompanySubCount = useAppSelector(state => state.readCountReducer.unreadCount.customsData) || 0;
  const readAction = useActions(ReadCountActions);
  const emailGuessModalDefRef = useRef<HTMLDivElement>(null);
  const detailRootRef = useRef<HTMLDivElement | null>(null);
  const { hash } = useLocation();

  const [moduleName, modulePage] = useMemo(() => {
    const [_, path = ''] = hash.split('#');
    const parsedUrl = parseUrl(path);
    return [parsedUrl.url, parsedUrl.query.page];
  }, [hash]);
  useEffect(() => {
    // 进入关键词订阅页面 消除红点
    if (moduleName !== 'wmData' || modulePage !== 'keywords') {
      return;
    }
    if (currentCount > 0) {
      globalSearchApi.doReadSubList().then();
      readAction.updateGloablSearchUnreadCount(0);
    }
    dispatch({
      type: 'LIST_REFRESH',
    });
  }, [moduleName, modulePage]);

  // 公司订阅 借用一下这个Provider, 桌面端是套在最外层了
  useEffect(() => {
    if (moduleName !== 'wmData' || modulePage !== 'star') {
      return;
    }
    if (currentCompanySubCount > 0) {
      globalSearchApi.doReadCompanySubList().then();
      readAction.updateCustomStarUnreadCount(0);
    }
  }, [moduleName, modulePage]);

  useEffect(() => {
    globalSearchApi
      .doGetSubList({
        page: 0,
        size: 20,
      })
      .then(res => {
        dispatch({
          type: 'LIST_FINISH',
          payload: {
            list: res,
          },
        });
      });

    return () => {};
  }, [state.tag]);

  const emailGuessModalPortalEl = props.emailGuessPortalEl || emailGuessModalDefRef.current;

  return (
    <SubKeyWordContext.Provider value={[state, dispatch]}>
      <WmBigDataPageLayoutContext.Provider value={{ detailRootDom: detailRootRef.current }}>
        {props.children}
        <SubKeywordFormModal />
        <div ref={detailRootRef} />
        <div ref={emailGuessModalDefRef}></div>
        {emailGuessModalPortalEl &&
          createPortal(
            <EmailGuess
              {...state.emailGuessState}
              container={emailGuessModalPortalEl as HTMLElement}
              onClose={() => {
                dispatch({
                  type: 'EMAIL_GUESS_CHANGE_VISIBLE',
                  payload: {
                    visible: false,
                  },
                });
              }}
            />,
            emailGuessModalPortalEl
          )}
      </WmBigDataPageLayoutContext.Provider>
    </SubKeyWordContext.Provider>
  );
};
