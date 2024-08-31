import React, { useCallback, useEffect } from 'react';
import { navigate } from 'gatsby';
import { Spin } from 'antd';
import { InquiryPage } from '@lxunit/app-l2c-crm';
import { apiHolder as api, getIn18Text, SystemApi, MailEntryModel, MailApi, apis, WorktableApi } from 'api';
import { useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import { getEmailInquirySwitchAsync } from '@web-common/state/reducer/worktableReducer';
import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import { NoPermissionPage } from '@/components/UI/PrivilegeEnhance';
import { handleRawMailContents, parseMailContent } from './utils';

import styles from './index.module.scss';

const systemApi: SystemApi = api.api.getSystemApi();
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const worktableApi = api.api.requireLogicalApi('worktableApiImpl') as WorktableApi;

const EmailInquiry: React.FC<{}> = () => {
  const { loading, data } = useAppSelector(state => state?.worktableReducer?.emailInquirySwitch);
  const showEmailInquiry = data?.entranceSwitch;

  const appDispatch = useAppDispatch();
  useEffect(() => {
    if (!data) {
      appDispatch(getEmailInquirySwitchAsync());
    }
  }, []);

  const getCurrentUserEmail = () => systemApi.getCurrentUser()?.id;

  const overviewEmail = useCallback((id: string, mail: MailEntryModel) => {
    worktableApi.markEmailInquiryRead(id);
    if (systemApi.isElectron()) {
      systemApi
        .createWindowWithInitData(
          { type: 'readMailReadOnly', additionalParams: { account: '' } },
          {
            eventName: 'initPage',
            eventData: { mid: mail?.id, handoverEmailId: id },
            eventStrData: '',
            _account: '',
          }
        )
        .catch(() => {});
    } else {
      window.open(
        `${systemApi.getContextPath()}/readMailReadOnly/?id=${mail?.id}&handoverEmailId=${id}`,
        'readMail',
        'menubar=0,scrollbars=1,resizable=1,width=800,height=600'
      );
    }
  }, []);

  const replayEmail = useCallback((id: string, mail: MailEntryModel) => {
    worktableApi.markEmailInquiryRead(id);
    mailApi.callWriteLetterFunc({
      writeWay: 'newWin',
      writeType: 'reply',
      mailType: 'common',
      id: mail?.id,
    });
  }, []);

  if (loading) return <Spin />;
  if (!showEmailInquiry) return <NoPermissionPage />;

  return (
    <div className={styles.container}>
      <Breadcrumb arrowSeparator className={styles.breadcrumb}>
        <Breadcrumb.Item>
          <a
            onClick={e => {
              e.preventDefault();
              navigate('#worktable');
            }}
            className={styles.homeLink}
          >
            {getIn18Text('GONGZUOTAI')}
          </a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <span className={styles.curLink}>{getIn18Text('ZHUANSHUXUNPAN')}</span>
        </Breadcrumb.Item>
      </Breadcrumb>
      <div>
        {/* <div
          onClick={() => {
            // FIXME:CQ
            overview({ isThread: false, isTpMail: false, _account: 'admin@waimao.elysys.net', id: 'AIAA2QB6GPGgw6IJXZMjEKo6', owner: 'admin@waimao.elysys.net' } as any);
          }}
        >
          点击查看
        </div>
        <div
          onClick={() => {
            // FIXME:CQ
            replay({ isThread: false, isTpMail: false, _account: 'admin@waimao.elysys.net', id: 'AIAA2QB6GPGgw6IJXZMjEKo6', owner: 'admin@waimao.elysys.net' } as any);
          }}
        >
          立即回复
        </div> */}
        <InquiryPage
          overviewEmail={overviewEmail}
          replayEmail={replayEmail}
          parseMailContent={parseMailContent}
          handleRawMailContents={handleRawMailContents}
          getCurrentUserEmail={getCurrentUserEmail}
        />
      </div>
    </div>
  );
};

export default EmailInquiry;
