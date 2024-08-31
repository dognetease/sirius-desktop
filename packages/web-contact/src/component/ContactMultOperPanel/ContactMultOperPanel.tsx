import React, { useCallback } from 'react';
import styles from './ContactMultOperPanel.module.scss';
import { inWindow, locationHelper, apiHolder, apis, MailApi, PersonalMarkParams, ContactItem } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { isOrg, SelectedContactOrgMap, transContactModel2ContactItem } from '@web-common/components/util/contact';

import { contactApi } from '@web-common/utils/contact_util';
import { getIn18Text } from 'api';
import { personalOrgToYingxiao } from '../../util';
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
export interface Props {
  checkedContacts: SelectedContactOrgMap;
  visiblePersonalEdit?: boolean;
  visiblePersonalDelete?: boolean;
  visiblePersonalMarkCancel?: boolean;
  handlePersonalGroup(): void;
  handleDeletePersonal(): void;
  _account?: string;
}
const ContactMultOperPanel: React.FC<Props> = props => {
  const {
    handlePersonalGroup,
    handleDeletePersonal,
    visiblePersonalEdit,
    visiblePersonalDelete,
    visiblePersonalMarkCancel,
    checkedContacts: _checkedContacts,
    _account,
  } = props;
  const checkedContacts: SelectedContactOrgMap = _checkedContacts || new Map();
  const orgIdList: string[] = [];
  // 发邮件
  const handleSend = useCallback(async () => {
    if (checkedContacts && checkedContacts.size > 0) {
      const emailSet: Set<string> = new Set<string>();
      checkedContacts.forEach(item => {
        if (item) {
          if ('orgType' in item) {
            orgIdList.push(item.id);
          } else {
            emailSet.add(item.email);
          }
        }
      });
      if (orgIdList?.length) {
        const contactList = await contactApi.doGetContactByOrgId({ orgId: orgIdList, _account });
        contactList.forEach(item => {
          const email = contactApi.doGetModelDisplayEmail(item);
          if (email) {
            emailSet.add(email);
          }
        });
      }
      mailApi.doWriteMailToContact([...emailSet]);
    } else {
      SiriusMessage.error({ content: getIn18Text('QINGXUANZELIANXI') });
    }
  }, [checkedContacts]);

  // 一键营销
  const handleYingxiao = useCallback(async () => {
    if (checkedContacts && checkedContacts.size > 0) {
      const itemList: ContactItem[] = [];
      checkedContacts.forEach(item => {
        if (item) {
          if ('orgType' in item) {
            orgIdList.push(item.id);
          } else {
            itemList.push(item);
          }
        }
      });
      if (orgIdList?.length) {
        const contactList = await contactApi.doGetContactByOrgId({ orgId: orgIdList, _account });
        if (contactList?.length) {
          itemList.push(...contactList.map(transContactModel2ContactItem));
        }
      }
      personalOrgToYingxiao(itemList);
    } else {
      SiriusMessage.error({ content: getIn18Text('QINGXUANZELIANXI') });
    }
  }, [checkedContacts]);

  // 取消星标
  const handlePersonalMarkCancel = useCallback(async () => {
    const list: PersonalMarkParams[] = [];
    checkedContacts.forEach(item => {
      if (item?.id) {
        list.push({
          id: item.id,
          type: isOrg(item) ? 2 : 1,
        });
      }
    });
    SiriusModal.error({
      title: getIn18Text('personalBathDelToastTitle'),
      content: getIn18Text('personalBathDelToastContent'),
      onOk: async () => {
        const { success, msg } = await contactApi.doBatchOperatePersonalMark(list, 'cancel');
        if (success) {
          SiriusMessage.success(getIn18Text('cancelMarkSuccess'));
        } else {
          SiriusMessage.error(msg || getIn18Text('addMarkFail'));
        }
      },
    });
  }, [checkedContacts]);

  return (
    <div
      className={styles.uReadWrapper}
      style={{
        height: inWindow() && !locationHelper.isMainPage() ? 'calc(100% - 32px)' : '100%',
      }}
    >
      <div className={styles.mailMopWrap} data-test-id="contact_multiple_panel">
        <div className={styles.mopContetn}>
          <div className={styles.detailWrap}>
            <div className={styles.logoWrap}>
              <div className={styles.logoWrapIcon} />
            </div>
            <div className={styles.numWrap}>
              <div className={styles.num}>{checkedContacts.size}</div>
              <div className={styles.tip}>{getIn18Text('YIXUANZELIANXI')}</div>
            </div>
          </div>
          <div className={styles.operWrap}>
            {process.env.BUILD_ISEDM && (
              <div data-test-id="contact_multiple_panel_btn_yingxiao" className={styles.btnWrap} onClick={handleYingxiao}>
                {getIn18Text('YIJIANYINGXIAO')}
              </div>
            )}
            <div data-test-id="contact_multiple_panel_btn_send" className={styles.btnWrap} onClick={handleSend}>
              {getIn18Text('FAYOUJIAN')}
            </div>
            {visiblePersonalEdit && (
              <div
                data-test-id="contact_multiple_panel_btn_personalOrg"
                className={styles.btnWrap}
                onClick={() => {
                  handlePersonalGroup();
                }}
              >
                {getIn18Text('JIANGLIANXIRENFEN')}
              </div>
            )}
            {visiblePersonalDelete && (
              <div
                className={styles.btnWrap}
                data-test-id="contact_multiple_panel_btn_delete"
                onClick={e => {
                  e.stopPropagation();
                  SiriusModal.error({
                    title: getIn18Text('QUERENYAOSHANCHU11'),
                    content: getIn18Text('LIANXIRENHUIZAI'),
                    onOk: handleDeletePersonal,
                    okType: 'danger',
                    okText: getIn18Text('SHANCHU'),
                  });
                }}
              >
                {getIn18Text('SHANCHU')}
              </div>
            )}
            {visiblePersonalMarkCancel && (
              <div
                className={styles.btnWrap}
                data-test-id="contact_multiple_panel_btn_mark"
                onClick={() => {
                  handlePersonalMarkCancel();
                }}
              >
                {getIn18Text('cancelMark')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ContactMultOperPanel;
