import React, { useState, useMemo, useRef, useCallback } from 'react';
import { getUnitableCellContactList } from '@web-disk/components/Unitable/api';
import { ContactBridgeApi, ContactInfo, GetContactListParams } from '@lxunit/bridge-types';
import SiriusContactModal from '@web-common/components/UI/SiriusContact/modal';
import { transContactModel2ContactItem } from '@web-common/components/util/contact';
import { contactApi, mailConfApi } from '../api';
import { ContactItem } from 'api';
import { toContactInfo } from '@web-disk/components/Doc/doc';

type Params = Parameters<ContactBridgeApi['callSelectContactModal']>[0] & {
  contactItems: ContactItem[];
};
/**
 *
 * 选择联系人组件调用不能直接通过ReactDOM.render 方式插入到dom上，因为有联系人组件消费了context。
 * 因此为了实现callSelectContactModal bridge方法，声明了这个hook函数
 * @returns
 *  * callSelectContractHandle 是 callSelectContactModal bridge方法的实现
 *  * siriusContactModalEl 是 联系人组件
 */
export const useSelectContactModal = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [params, setParams] = useState<Params>();
  const promiseHandleRef = useRef<void | {
    resolve: Function;
    reject: Function;
  }>();

  const callSelectContractHandle: ContactBridgeApi['callSelectContactModal'] = useCallback(
    params => {
      return new Promise(async (resolve, reject) => {
        if (modalVisible) {
          return resolve({
            code: 'cancel',
          });
        }
        let contactItems: ContactItem[] = [];
        if (params && params.selected && params.selected.length) {
          const contactModals = await contactApi.doGetContactById(params.selected);
          contactItems = contactModals.map(transContactModel2ContactItem);
        }

        setParams({
          ...params,
          contactItems,
        });

        setModalVisible(true);
        promiseHandleRef.current = {
          resolve,
          reject,
        };
      });
    },
    [modalVisible]
  );

  const onSureHandle = useCallback((items: ContactItem[]) => {
    const handle = async () => {
      try {
        const ids = items.map(item => {
          return item.id!;
        });
        const contactModals = await contactApi.doGetContactById(ids);
        const contactInfoList = contactModals.map(toContactInfo);
        promiseHandleRef.current?.resolve({
          code: 'success',
          data: contactInfoList,
        });
        setModalVisible(false);
      } catch (error) {
        promiseHandleRef.current?.resolve({
          code: 'cancel',
        });
        setModalVisible(false);
      }
    };
    handle();
  }, []);

  const siriusContactModalEl = useMemo(() => {
    // 如果明确指定 multiple 为false 则返回false，否则返回true
    const multiple = params?.multiple === false ? false : true;
    return modalVisible ? (
      <SiriusContactModal
        visible={modalVisible}
        multiple={multiple}
        // 多选展示checkbox，单选不展示checkbox
        showCheckbox={multiple}
        includeSelf={true}
        defaultSelectList={params?.contactItems}
        onCancel={() => {
          promiseHandleRef.current?.resolve({
            code: 'cancel',
          });
          setModalVisible(false);
        }}
        onSure={onSureHandle}
      />
    ) : null;
  }, [modalVisible, params]);
  return {
    callSelectContractHandle,
    siriusContactModalEl,
  };
};
/**
 * * callSelectContactModal bridge方法需要配合useSelectContactModal 使用
 */
export const contactBridgeApiImpl: Omit<ContactBridgeApi, 'callSelectContactModal'> = {
  getContactList(params: GetContactListParams, resourceId?: number): Promise<ContactInfo[]> {
    return getUnitableCellContactList(params, resourceId);
  },
  /**根据邮箱查看往来邮件 */
  async checkMailRelated(email: string) {
    let info = [{ mail: email, contactName: '' }];
    const contactInfo = await contactApi.doGetContactByEmails(info, '');
    mailConfApi.doOpenRelatedPage(contactInfo[0].contact);
  },
  getContactApi() {
    return contactApi;
  },
};
