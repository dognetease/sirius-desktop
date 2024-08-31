import React, { useContext, useMemo, useEffect, useState } from 'react';
// import { Tabs } from '@web-common/components/UI/Tabs';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
import { ContactAndOrgApi, api, apis, getIn18Text } from 'api';
import { WriteContext } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';
import { useAppSelector } from '@web-common/state/createStore';
import WriteContact from './writeContact';
import styles from './writeSide.module.scss';
import RightSidebar from '@web-mail/rightSidebar';
import { ContactItem, transMailContactModel2ContactItem } from '@web-common/utils/contact_util';
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
// 计算出收件人中的最高优先级email的简要信息
export const useHeightestPriorityEmail = () => {
  // 是否是邮件模版
  const { isMailTemplate } = useContext(WriteContext);
  // 是否是群发单显
  const isOneRcpt = useAppSelector(state => state.mailReducer.currentMail.isOneRcpt);
  // 聚合所有的发信人，密送，抄送
  const receivers = useAppSelector(state => (isMailTemplate ? state.mailTemplateReducer.mailTemplateContent?.receiver : state.mailReducer.currentMail?.receiver));
  // 当前选中的emails需要操作（滑选，点击，拖动（ui上带有蓝色底色）
  const selectedEmails = useAppSelector(state => (isMailTemplate ? state.tempContactReducer.selectedTags.emails : state.contactReducer.selectedTags.emails));

  // 选中的email中的第一个email
  const firstSelectedEmail = selectedEmails[0];
  // 计算出来的最高优先级的emailItem;
  const computedItem = useMemo(() => {
    // 必须要有发件人
    if (!receivers?.length) {
      return {
        contactItem: undefined,
        selectedEmail: undefined,
      };
    }
    // 当前选中的emails中的第一个
    if (firstSelectedEmail) {
      const findItem = receivers.find(item => {
        return contactApi.doGetModelDisplayEmail(item?.contact) === firstSelectedEmail;
      });
      if (findItem) {
        return {
          contactItem: transMailContactModel2ContactItem(findItem),
          selectedEmail: firstSelectedEmail,
        };
      }
    }
    // 群发单显展示第一个收件人
    if (isOneRcpt) {
      const contactItem = transMailContactModel2ContactItem(receivers[0]);
      return {
        contactItem,
        selectedEmail: undefined,
      };
    }
    // 收件人 > 抄送 > 密送 选其中的类型的第一个email
    let email: ContactItem | undefined, ccEmail: ContactItem | undefined, bccEmail: ContactItem | undefined;
    receivers.forEach(item => {
      const contactItem = transMailContactModel2ContactItem(item);
      if (contactItem) {
        if (!email && item.mailMemberType === 'to') {
          email = contactItem;
        }
        if (!email && !ccEmail && item.mailMemberType === 'cc') {
          ccEmail = contactItem;
        }
        if (!email && !ccEmail && !bccEmail && item.mailMemberType === 'bcc') {
          bccEmail = contactItem;
        }
      }
    });
    return {
      contactItem: email || ccEmail || bccEmail,
      selectedEmail: undefined,
    };
  }, [isOneRcpt, receivers, firstSelectedEmail]);
  return computedItem;
};
const WriteSideContent = () => {
  const [active, setActive] = useState<string>('writeContact');
  const { contactItem, selectedEmail } = useHeightestPriorityEmail();
  useEffect(() => {
    if (contactItem && contactItem.email === selectedEmail) {
      setActive('writeSide');
    }
  }, [contactItem, selectedEmail]);
  const hasContactItem = !!contactItem;
  const activeKey = useMemo(() => {
    return !hasContactItem ? 'writeContact' : active;
  }, [active, hasContactItem]);
  console.log('🚀 ~ WriteSideContent ~ contactItem:', contactItem);
  return (
    <Tabs
      activeKey={activeKey}
      onChange={val => setActive(val)}
      className={styles.writeSideContainer}
      renderTabBar={(props, TabComp) => {
        return (
          <div className={styles.writeSideTabBar}>
            <TabComp {...props} />
          </div>
        );
      }}
    >
      <Tabs.TabPane tab={getIn18Text('LIANXIREN')} key="writeContact">
        <WriteContact />
      </Tabs.TabPane>
      {contactItem && (
        <Tabs.TabPane tab={getIn18Text('LIANXIRENZILIAO')} key="writeSide">
          <RightSidebar noBorder email={contactItem.email} name={contactItem.name} _account={contactItem._account} />
        </Tabs.TabPane>
      )}
    </Tabs>
  );
};

const WriteSide = () => {
  // 是否是邮件模版
  const { isMailTemplate } = useContext(WriteContext);
  return process.env.BUILD_ISEDM && !isMailTemplate ? <WriteSideContent /> : <WriteContact />;
};

export default WriteSide;
