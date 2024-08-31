import React, { useState, useEffect, useMemo } from 'react';
import debounce from 'lodash/debounce';
import { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import styles from './unfinishedDraftMailEntry.module.scss';
import { UnfinishedDrafts } from './UnfinishedDrafts';
import { apiHolder, apis, MailDraftApi, MailEntryModel } from 'api';
import { useAppSelector } from '@web-common/state/createStore';
import ErrorBoundary from '@web-common/hooks/ErrorBoundary';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import { getIn18Text } from 'api';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { KEEP_PERIOS, FLOLDER } from '@web-mail/common/constant';
import { isMainAccount } from '@web-mail/util';
import useCreateCallbackForEvent from '@web-mail/hooks/useCreateCallbackForEvent';

const mailDraftApi = apiHolder.api.requireLogicalApi(apis.mailDraftApiImpl) as MailDraftApi;
const eventApi = apiHolder.api.getEventApi();

interface Prop {}

const UnfinishedDraftMailEntry: React.FC<Prop> = () => {
  const [draftMailVis, setDraftMailVis] = useState<boolean>(false);
  const [draftMailArr, setDraftMailArr] = useState<Array<{ cid: string; versions: MailEntryModel[] }>>([]);
  // 选中的文件夹
  const [selectedKeys] = useState2RM('selectedKeys');

  const edittingMails = useAppSelector(state => state.mailReducer.mails);
  // 未保持草稿 是否展示
  const unfinishedDraftTab = useMemo(() => selectedKeys.id == FLOLDER.DRAFT && isMainAccount(selectedKeys.accountId), [selectedKeys]);
  // 正在编辑的邮件
  const edittingCids = useMemo(() => {
    return edittingMails.map(item => item.cid);
  }, [edittingMails.length]);

  // 获取全部草稿邮件
  const getAllDraftMail = debounce(async () => {
    try {
      const allDraftMail = await mailDraftApi.getAllDraftMail();
      let filtedDraftMail = new Map();
      allDraftMail.forEach((item, key) => {
        if (!edittingCids.includes(key)) {
          filtedDraftMail.set(key, item);
        }
      });
      const res: Array<{ cid: string; versions: MailEntryModel[] }> = [];
      filtedDraftMail.forEach((value, key) => {
        res.push({ cid: key, versions: value });
      });
      setDraftMailArr(res);
    } catch (error) {
      console.log('获取邮件草稿失败', error);
    }
  }, 500);

  const delDraftMailByIndex = (index: number) => {
    try {
      if (draftMailArr?.length) {
        const draftArrCopy = JSON.parse(JSON.stringify(draftMailArr));
        draftArrCopy.splice(index, 1);
        setDraftMailArr(draftArrCopy);
        SiriusMessage.success({ content: getIn18Text('YISHANCHU') });
      }
    } catch (error) {
      console.log('delDraftMailByIndex error', index, error);
    }
  };

  const clickToView = () => {
    setDraftMailVis(true);
  };

  const closeDraft = () => {
    setDraftMailVis(false);
  };

  // 刷新草稿
  const refreshLocalDraft = useCreateCallbackForEvent(() => {
    // console.log('refreshLocalDraft');
    if (unfinishedDraftTab) {
      getAllDraftMail();
    }
  });

  useEffect(() => {
    if (unfinishedDraftTab) {
      getAllDraftMail();
    } else {
      setDraftMailVis(false);
      setDraftMailArr([]);
    }
  }, [unfinishedDraftTab]);

  useEffect(() => {
    const id = eventApi.registerSysEventObserver('refreshLocalDraft', { func: () => refreshLocalDraft() });
    return () => {
      eventApi.unregisterSysEventObserver('refreshLocalDraft', id);
    };
  }, []);

  return (
    <ErrorBoundary name="unfinishedDraftMailEntry">
      {unfinishedDraftTab && draftMailArr?.length > 0 ? (
        <>
          <div className={styles.unfinishedDraftMailEntry}>
            <span className={styles.unsaveMail}>
              {getIn18Text('NINGYOU')}
              <span className={styles.num}> {draftMailArr.length || 0} </span>
              {getIn18Text('FENGWEIBAOCUN')}
            </span>
            <span className={styles.clickToView} onClick={clickToView}>
              {getIn18Text('DIANJICHAKAN')}
            </span>
          </div>

          <SiriusHtmlModal visible={draftMailVis} width={580} onCancel={closeDraft} closeIcon={<CloseIcon className="dark-invert" />}>
            <UnfinishedDrafts draftMailArr={draftMailArr} getAllDraftMail={getAllDraftMail} delDraftMailByIndex={delDraftMailByIndex} close={closeDraft} />
          </SiriusHtmlModal>
        </>
      ) : (
        <></>
      )}
    </ErrorBoundary>
  );
};

export default UnfinishedDraftMailEntry;
