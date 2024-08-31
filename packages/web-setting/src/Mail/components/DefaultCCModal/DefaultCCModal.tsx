/**
 * 设置页-默认抄送人弹窗
 */
import React, { useState, useEffect } from 'react';
import { getIn18Text } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { ContactItem, MailApi, apiHolder, apis, ContactAndOrgApi, ContactModel } from 'api';
import ContactScheduleModal from '@web-common/components/UI/SiriusContact/scheduleModal';
import { buildContactModel } from '@web-common/utils/contact_util';
import { useUpdateEffect } from 'ahooks';
import './DefaultCCModal.scss';
const mailApi: MailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
import Message from '@web-common/components/UI/Message/SiriusMessage';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import useDebounceForEvent from '@web-common/hooks/useDebounceForEvent';
import { emailPattern } from '@web-common/utils/constant';

interface Props {
  // 是否展示弹窗
  visible: boolean;
  // 关闭弹窗
  onModelClose: () => void;
  /**
   * 数据变化-抄送人和密送人
   */
  onDataChange: (params: { cc: string[]; bcc: string[] }) => void;
}

// 获取联系人的邮箱
const getMailsFromContactItem = (contactItems: ContactItem[]): string[] => {
  if (contactItems && contactItems.length) {
    return contactItems.map(item => item.email);
  }
  return [];
};

//  检测邮箱是否合法
const checkEmails = (emails: string[]) => {
  try {
    const reg = emailPattern;
    for (let i = 0; i < emails.length; i++) {
      if (!reg.test(emails[i].trim())) {
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('[checkEmails Error]', err);
    return false;
  }
};

const DefaultCCModal: React.FC<Props> = props => {
  const { visible, onModelClose, onDataChange } = props;

  // 默认抄送数据
  const [CCData, settCCData] = useState<ContactItem[]>([]);
  // 默认密送数据
  const [BCCData, settBCCData] = useState<ContactItem[]>([]);

  // 默认抄送数据-临时状态
  const [CCDataTemp, settCCDataTemp] = useState<ContactItem[] | null>(null);
  // 默认密送数据-临时状态
  const [BCCDataTemp, settBCCDataTemp] = useState<ContactItem[] | null>(null);

  // 检测临时数据与默认数据是否相同
  const checkDataIsDiff = () => {
    // 检测长度是否有变化
    if (CCDataTemp) {
      if (CCDataTemp.length !== CCData.length) {
        return true;
      }
      // 检测默认抄送人
      const CCemailCache: { [key: string]: boolean } = {};
      CCData.map(item => {
        CCemailCache[item.email] = true;
      });
      // 检测对应的邮件地址是否一直
      for (let i = 0; i < CCDataTemp.length; i++) {
        if (!CCemailCache[CCDataTemp[i].email]) {
          return true;
        }
      }
    }

    if (BCCDataTemp) {
      if (BCCDataTemp.length !== BCCData.length) {
        return true;
      }
      // 检测默认密送人
      const BCCemailCache: { [key: string]: boolean } = {};

      BCCData.map(item => {
        BCCemailCache[item.email] = true;
      });
      for (let i = 0; i < BCCDataTemp.length; i++) {
        if (!BCCemailCache[BCCDataTemp[i].email]) {
          return true;
        }
      }
    }

    return false;
  };

  // 清除临时数据
  const clearTempData = () => {
    settCCData([]);
    settCCDataTemp(null);
    settBCCData([]);
    settBCCDataTemp(null);
  };

  // 关闭弹窗
  const cancelModel = useDebounceForEvent(
    (needDiff: boolean = true) => {
      if (needDiff) {
        // 检测临时数据与默认数据是否相同
        const isDiff = checkDataIsDiff();

        if (isDiff) {
          Modal.confirm({
            title: getIn18Text('TUICHUHOUXIUGAIBHBBC，QRTCM？'),
            onOk: () => {
              // 关闭弹窗
              onModelClose && onModelClose();
              clearTempData();
            },
          });
        } else {
          // 关闭弹窗
          onModelClose && onModelClose();
          clearTempData();
        }
      } else {
        onModelClose && onModelClose();
        clearTempData();
      }
    },
    300,
    {
      leading: true,
      trailing: false,
    }
  );

  // 获取数据
  const getData = () => {
    // 请求数据
    // 将数据转换为数组
    mailApi
      .getDefaultCCBCC()
      .then(async res => {
        const { cc, bcc } = res;

        // 数据变化
        onDataChange && onDataChange({ cc, bcc });

        /**
         * 处理cc部分email到ContactModel的转换
         */

        // 存放转换为ContactModel的cc emails
        let ccContact = [];
        // 查找到的已经在通讯录中的
        let CCcontactInAddressBook: ContactModel[] = [];
        let CCexternalContacts: ContactModel[] = [];
        try {
          // 获取已经存在的contactModel
          const contactInAddressBookMap = await contactApi.doGetContactByEmail({ emails: cc });
          Object.values(contactInAddressBookMap).forEach(item => {
            if (!item || !item.length) {
              return;
            }
            const [firstItem] = item;
            CCcontactInAddressBook.push(firstItem);
          });
        } catch (err) {
          console.error('[error getDefaultCCBCC doGetContactByEmailFilter CC fail]', err);
        }
        // 对比已经存在的contactModel和cc，如果有不存在的，就创建
        if (CCcontactInAddressBook.length < cc.length) {
          // 有不存在的
          const externalEmails = cc.filter(e => !CCcontactInAddressBook.find(c => c.email === e));
          CCexternalContacts = externalEmails.map(email => {
            return buildContactModel({ email: email, type: 'external', name: email });
          });
        }
        // 合并
        ccContact = [...CCcontactInAddressBook, ...CCexternalContacts];

        /**
         * 处理cc部分email到ContactModel的转换
         */
        let BccContact = [];
        // 查找到的已经在通讯录中的
        let BCCcontactInAddressBook: ContactModel[] = [];
        let BCCexternalContacts: ContactModel[] = [];
        try {
          // 获取已经存在的contactModel
          const contactInAddressBookMap = await contactApi.doGetContactByEmail({ emails: bcc });
          BCCcontactInAddressBook = Array.from(
            Object.values(contactInAddressBookMap).map(item => {
              return item[0];
            })
          );
        } catch (err) {
          console.error('[error getDefaultCCBCC doGetContactByEmailFilter BCC fail]', err);
        }
        // 对比已经存在的contactModel和cc，如果有不存在的，就创建
        if (BCCcontactInAddressBook.length < bcc.length) {
          // 有不存在的
          const externalEmails = bcc.filter(e => !BCCcontactInAddressBook.find(c => c.email === e));
          BCCexternalContacts = externalEmails.map(email => {
            return buildContactModel({ email: email, type: 'external', name: email });
          });
        }
        // 合并
        BccContact = [...BCCcontactInAddressBook, ...BCCexternalContacts];

        /**
         * 将contactModel转换为ContactItem
         */
        const ccContactItem = ccContact.map(item => contactApi.transContactModel2ContactItem(item)) || [];
        const bccContactItem = BccContact.map(item => contactApi.transContactModel2ContactItem(item)) || [];

        settCCData(ccContactItem);
        settCCDataTemp(ccContactItem);
        settBCCData(bccContactItem);
        settBCCDataTemp(bccContactItem);
      })
      .catch(err => {
        console.error('[error getDefaultCCBCC fail]', err);
      });
  };

  // 保存数据
  const saveData = (ccMails: string[], bccMails: string[]) => {
    // 请求接口
    return mailApi
      .setDefaultCCBCC({
        cc: ccMails,
        bcc: bccMails,
      })
      .then(res => {
        if (res) {
          // 数据变化
          onDataChange &&
            onDataChange({
              cc: ccMails,
              bcc: bccMails,
            });
        }
        return res;
      });
  };

  // 抄送人发选择送变化
  const onCCChange = (value: ContactItem[]) => {
    settCCDataTemp(value);
  };

  // 密送人发生变化
  const onBCCChange = (value: ContactItem[]) => {
    settBCCDataTemp(value);
  };

  // 弹窗确定按钮
  const handleModalBtnOk = useDebounceForEvent(
    () => {
      const CCMails = getMailsFromContactItem(CCDataTemp || []);
      const BCCMails = getMailsFromContactItem(BCCDataTemp || []);
      // 进行邮箱格式正确性验证
      if (!checkEmails(CCMails) || !checkEmails(BCCMails)) {
        Message.error({ content: getIn18Text('YOUXIANGDIZHIGESCW') });
        return;
      }

      saveData(CCMails, BCCMails)
        .then(res => {
          if (res) {
            Message.success({ content: getIn18Text('BAOCUNCHENGGONG') });
          }
        })
        .catch(err => {
          Message.error({ content: getIn18Text('CAOZUOSHIBAIQINGZS') });
        })
        .finally(() => {
          // 关闭弹窗
          cancelModel(false);
        });
    },
    300,
    {
      leading: true,
      trailing: false,
    }
  );

  /**
   * 组件展示的时候请求下数据
   * 首次不调动
   */
  useUpdateEffect(() => {
    if (visible) {
      getData();
    }
  }, [visible]);

  /**
   * 初始化的时候请求下数据
   */
  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      {
        <>
          <Modal
            className="defaultCCModal-wrap"
            title={getIn18Text('XIEXINMORENCHAOSR/MSR')}
            destroyOnClose
            centered
            width={480}
            visible={visible}
            onCancel={() => cancelModel()}
            footer={null}
          >
            <div className="defaultCCModal-content">
              <div className="defaultCCModal-title">{getIn18Text('MORENCHAOSONGREN')}</div>
              <div className="defaultCCModal-contactModel-wrap">
                <ContactScheduleModal
                  placeholder={getIn18Text('QINGSHURUCHAOSONGRYXDZ')}
                  showSuffix
                  defaultSelectList={CCDataTemp || CCData}
                  style={{
                    // maxHeight: '100px',
                    borderRadius: '4px',
                  }}
                  onChange={onCCChange}
                />
              </div>

              <div className="defaultCCModal-title" style={{ marginTop: '15px' }}>
                {getIn18Text('MORENMISONGREN')}
              </div>
              <div className="defaultCCModal-contactModel-wrap">
                <ContactScheduleModal
                  placeholder={getIn18Text('QINGSHURUMISONGRYXDZ')}
                  showSuffix
                  defaultSelectList={BCCDataTemp || BCCData}
                  style={{
                    // maxHeight: '100px',
                    borderRadius: '4px',
                  }}
                  onChange={onBCCChange}
                />
              </div>
            </div>
            <div className="defaultCCModal-tip">{getIn18Text('ZHU：SHEZHIMORCSR/MSRH，MCXX、HFHZFDHJSZDCSR/MSRZDTR。')}</div>
            <div className="defaultCCModal-footer">
              <Button btnType="minorLine" onClick={() => cancelModel()} style={{ marginRight: '5px' }}>
                {getIn18Text('QUXIAO')}
              </Button>
              <Button btnType="primary" onClick={handleModalBtnOk}>
                {getIn18Text('BAOCUN')}
              </Button>
            </div>
          </Modal>
        </>
      }
    </>
  );
};
export default DefaultCCModal;
