import useEdmSendCount from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import React, { useState, useEffect } from 'react';
import { emailsType, HandlerData } from './marketingModal';
import { apiHolder, apis, CustomerApi, ReqMainContactList as contactType, ResMainContactList as ContactResType } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

/**
 * 联系人表的一键营销逻辑
 * 因为目前没有全选，且外层不是函数式组件，这里包一层，仅发一个请求 & 触发后续逻辑
 * 未来有全选的时候，这里才需要 modal，并且尽可能去复用 marketingModal 组件
 */

interface IContactMarketingModal {
  visible: boolean;
  onCancel: (param?: boolean) => void;
  // onSubmit: () => void;
  data: HandlerData;
}

export const ContactMarketingModal: React.FC<IContactMarketingModal> = ({ visible, onCancel, data }) => {
  const [emailList, setEmailList] = useState<emailsType[]>([]);
  useEdmSendCount(emailList);

  /*
   * 一键营销格式化
   */
  const marketingFormat = (emailItems: emailsType[]) => {
    let emails = emailItems.filter(item => item.contactEmail);
    setEmailList(emails.length ? emails : [{ contactEmail: 'noEmials', contactName: '' }]);
    onCancel();
    // if (emails.length) {
    // 	onCancel();
    // };
  };

  useEffect(() => {
    if (visible) {
      clientApi
        .uniEdmListFromContact({
          contact_ids: data.payload?.recordIds,
          // filterCondition: data.payload.filter,
          // mainContact: false,
          // allSelected: false,
        })
        .then(res => {
          if (res.contact_list && res.contact_list.length) {
            let emailList: emailsType[] = [];
            res.contact_list.forEach(contactItem => {
              emailList.push({
                contactEmail: contactItem.email,
                contactName: contactItem.contact_name,
              });
            });
            marketingFormat(emailList || []);
          }
        });
    }
  }, [visible]);

  return <></>;
};
