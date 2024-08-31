import React, { useContext, useEffect, useMemo, useState } from 'react';
import classnames from 'classnames/bind';
import { useLocation, navigate } from '@reach/router';

import ImEmptySession from './emptyChat';
import styles from './imSubContentPanel.module.scss';
import { getParams } from '../common/query';
import { inWindow } from 'api';

const realStyles = classnames.bind(styles);

const ImSubMenuPannel: React.FC<any> = () => {
  const ImChatContent = inWindow() ? useMemo(() => React.lazy(() => import('./imChatContent')), []) : null;
  const location = useLocation();
  const [sessionId, setSessionId] = useState<string | null>('');
  const [toAccount, setToAccount] = useState('');
  const [scene, setScene] = useState('');
  const [mode, setMode] = useState<'normal' | 'history' | null>('normal');
  const [idClient, setIdClient] = useState('');
  useEffect(() => {
    const sessionId = getParams(location.hash, 'sessionId');
    setSessionId(sessionId);

    const mode = getParams(location.hash, 'mode') || 'normal';
    setMode(mode);

    const idClient = getParams(location.hash, 'idClient') || '';
    setIdClient(idClient);
    if (sessionId) {
      const [scene, to] = sessionId.split('-') as string[];
      setScene(scene);
      setToAccount(to);
    }
    return () => {
      setSessionId(null);
      setToAccount('');
      setScene('');
    };
  }, [location.hash]);

  useEffect(() => {}, [idClient]);

  if (!sessionId || !sessionId.length) {
    return <ImEmptySession />;
  }

  return (
    <div className={realStyles('imSubcontentPanelWrapper')}>
      {/* 接受销毁前的保存草稿和消息引用任务 */}

      {inWindow() && (
        <React.Suspense fallback={<div>loading...</div>}>
          {/* 缓存数据减少渲染开销 */}
          <ImChatContent
            key={mode === 'history' ? [mode, sessionId, idClient].join('|') : [mode, sessionId].join('|')}
            scene={scene}
            toAccount={toAccount}
            sessionId={sessionId}
            mode={mode}
            idClient={idClient}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default ImSubMenuPannel;
