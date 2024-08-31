/**
 * 设置页-默认抄送人弹窗
 */
import React, { useState, useEffect } from 'react';
import { getIn18Text } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { ContactItem, MailApi, apiHolder, apis, ContactAndOrgApi, ContactModel, MailConfApi, MailSettingKeys } from 'api';
import ContactScheduleModal from '@web-common/components/UI/SiriusContact/scheduleModal';
import { buildContactModel } from '@web-common/utils/contact_util';
import { useUpdateEffect } from 'ahooks';
import './BlackListModal.scss';
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
import Message from '@web-common/components/UI/Message/SiriusMessage';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import useDebounceForEvent from '@web-common/hooks/useDebounceForEvent';
import { emailPattern } from '@web-common/utils/constant';
const mailConfApi: MailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
import { Select, Tooltip } from 'antd';
import TagCloseIcon from '@web-common/components/UI/Icons/svgs/TagCloseSvg';

function verifyEmail(email: string): boolean {
  // const emailReg = /^([a-zA-Z0-9][a-zA-Z0-9_\-.+#']+)@([a-zA-Z0-9_\-.]+\.[a-zA-Z]{2,})$/;
  const emailReg = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  return emailReg.test(email);
}

const renderTagFunc = (props: any) => {
  const { value, onClose } = props;
  let email = value;
  const valiteEmail = verifyEmail(String(email?.trim()));
  return (
    <div data-test-id="contact_select_input_tag_item" className={`tagWrapper  ${!valiteEmail ? 'tagWrapperError' : ''}`}>
      <Tooltip title={email} placement="bottom">
        <div className={`tagName ${!valiteEmail ? 'tagNameError' : ''}`}>{value}</div>
      </Tooltip>
      <span onClick={onClose} data-test-id="contact_select_input_btn_tagClose" className={'tagClose'}>
        <TagCloseIcon className="dark-invert" />
      </span>
    </div>
  );
};

interface Props {
  // 是否展示弹窗
  visible: boolean;
  // 关闭弹窗
  onModelClose: () => void;
  /**
   * 数据变化-抄送人和密送人
   */
  onDataChange: (params: { blackList: string[]; whiteList: string[] }) => void;
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

// 检测Domain是否合法
const checkDomain = (domains: string[]) => {
  try {
    const reg = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    for (let i = 0; i < domains.length; i++) {
      if (!reg.test(domains[i].trim())) {
        Message.error({ content: domains[i] + getIn18Text('BUSHIHEFAYUM') });
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('[checkEmails Error]', err);
    return false;
  }
};

const BlackListModal: React.FC<Props> = props => {
  const { visible, onModelClose, onDataChange } = props;

  // 默认黑名单数据
  const [BlackListData, setBlackListData] = useState<ContactItem[]>([]);
  // 默认白名单数据
  const [WhiteListData, setWhiteListData] = useState<ContactItem[]>([]);
  // 默认黑名单域名
  const [BlackListDomainData, setBlackListDomainData] = useState<string[]>([]);
  // 默认白名单数据
  const [WhiteListDomainData, setWhiteListDomainData] = useState<string[]>([]);

  // 默认黑名单数据-临时状态
  const [BlackListDataTemp, setBlackListDataTemp] = useState<ContactItem[] | null>(null);
  // 默认白名单数据-临时状态
  const [WhiteListDataTemp, setWhiteListDataTemp] = useState<ContactItem[] | null>(null);
  // 默认黑名单域名数据-临时状态
  const [BlackListDomainDataTemp, setBlackListDomainDataTemp] = useState<string[] | null>(null);
  // 默认白名单域名数据-临时状态
  const [WhiteListDomainDataTemp, setWhiteListDomainDataTemp] = useState<string[] | null>(null);

  // 检测临时数据与默认数据是否相同
  const checkDataIsDiff = () => {
    // 检测长度是否有变化
    if (BlackListDataTemp) {
      if (BlackListDataTemp.length !== BlackListData.length) {
        return true;
      }
      // 检测默认抄送人
      const CCemailCache: { [key: string]: boolean } = {};
      BlackListData.map(item => {
        CCemailCache[item.email] = true;
      });
      // 检测对应的邮件地址是否一直
      for (let i = 0; i < BlackListDataTemp.length; i++) {
        if (!CCemailCache[BlackListDataTemp[i].email]) {
          return true;
        }
      }
    }

    if (WhiteListDataTemp) {
      if (WhiteListDataTemp.length !== WhiteListData.length) {
        return true;
      }
      // 检测默认密送人
      const BCCemailCache: { [key: string]: boolean } = {};

      WhiteListData.map(item => {
        BCCemailCache[item.email] = true;
      });
      for (let i = 0; i < WhiteListDataTemp.length; i++) {
        if (!BCCemailCache[WhiteListDataTemp[i].email]) {
          return true;
        }
      }
    }

    if (BlackListDomainDataTemp) {
      if (BlackListDomainDataTemp.length !== BlackListDomainData.length) {
        return true;
      }
      // 检测默认抄送人
      const CCemailCache: { [key: string]: boolean } = {};
      BlackListDomainData.map(item => {
        CCemailCache[item] = true;
      });
      // 检测对应的邮件地址是否一直
      for (let i = 0; i < BlackListDomainDataTemp.length; i++) {
        if (!CCemailCache[BlackListDomainDataTemp[i]]) {
          return true;
        }
      }
    }

    if (WhiteListDomainDataTemp) {
      if (WhiteListDomainDataTemp.length !== WhiteListDomainData.length) {
        return true;
      }
      // 检测默认抄送人
      const CCemailCache: { [key: string]: boolean } = {};
      WhiteListDomainData.map(item => {
        CCemailCache[item] = true;
      });
      // 检测对应的邮件地址是否一直
      for (let i = 0; i < WhiteListDomainDataTemp.length; i++) {
        if (!CCemailCache[WhiteListDomainDataTemp[i]]) {
          return true;
        }
      }
    }

    return false;
  };

  // 清除临时数据
  const clearTempData = () => {
    setBlackListData([]);
    setBlackListDataTemp(null);
    setBlackListDomainData([]);
    setWhiteListDomainData([]);
    setWhiteListData([]);
    setWhiteListDataTemp(null);
    setBlackListDomainDataTemp(null);
    setWhiteListDomainDataTemp(null);
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
    const blackListKey = MailSettingKeys.nRefuseList;
    const whiteListKey = MailSettingKeys.nSaveList;
    // 请求数据
    // 将数据转换为数组
    mailConfApi
      .doGetUserAttr([whiteListKey, blackListKey])
      .then(async res => {
        const { refuselist, safelist } = res;
        const blackList: string[] = [];
        const blackDomainList: string[] = [];
        const whiteList: string[] = [];
        const whiteDomainList: string[] = [];

        if (refuselist) {
          refuselist
            .split(',')
            .filter(item => item.trim())
            .map(item => {
              if (!item.includes('@') || item.includes('*@')) {
                blackDomainList.push(item.replace('*@', ''));
              } else {
                blackList.push(item);
              }
            });
        }

        if (safelist) {
          safelist
            .split(',')
            .filter(item => item.trim())
            .map(item => {
              if (!item.includes('@') || item.includes('*@')) {
                whiteDomainList.push(item.replace('*@', ''));
              } else {
                whiteList.push(item);
              }
            });
        }

        // 数据变化
        onDataChange && onDataChange({ blackList: [...blackList, ...blackDomainList], whiteList: [...whiteList, ...whiteDomainList] });

        /**
         * 处理blackList部分email到ContactModel的转换
         */

        // 存放转换为ContactModel的blackList emails
        let blackListContact = [];
        // 查找到的已经在通讯录中的
        let blcokContactInAddressBook: ContactModel[] = [];
        let blockexternalContacts: ContactModel[] = [];
        try {
          // 获取已经存在的contactModel
          const contactInAddressBookMap = await contactApi.doGetContactByEmail({ emails: blackList });
          Object.values(contactInAddressBookMap).forEach(item => {
            if (!item || !item.length) {
              return;
            }
            const [firstItem] = item;
            blcokContactInAddressBook.push(firstItem);
          });
        } catch (err) {
          console.error('[error getDefaultCCBCC doGetContactByEmailFilter CC fail]', err);
        }
        // 对比已经存在的contactModel和blackList，如果有不存在的，就创建
        if (blcokContactInAddressBook.length < blackList.length) {
          // 有不存在的
          const externalEmails = blackList.filter(e => !blcokContactInAddressBook.find(c => contactApi.doGetModelDisplayEmail(c) === e));
          blockexternalContacts = externalEmails.map(email => {
            return buildContactModel({ email: email, type: 'external', name: email });
          });
        }
        // 合并
        blackListContact = [...blcokContactInAddressBook, ...blockexternalContacts];

        /**
         * 处理cc部分email到ContactModel的转换
         */
        let whiteListContact = [];
        // 查找到的已经在通讯录中的
        let whiteContactInAddressBook: ContactModel[] = [];
        let whiteExternalContacts: ContactModel[] = [];
        try {
          // 获取已经存在的contactModel
          const contactInAddressBookMap = await contactApi.doGetContactByEmail({ emails: whiteList });

          Object.values(contactInAddressBookMap).forEach(item => {
            if (!item || !item.length) {
              return;
            }
            const [firstItem] = item;
            whiteContactInAddressBook.push(firstItem);
          });
        } catch (err) {
          console.error('[error getDefaultCCBCC doGetContactByEmailFilter BCC fail]', err);
        }
        // 对比已经存在的contactModel和cc，如果有不存在的，就创建
        if (whiteContactInAddressBook.length < whiteList.length) {
          // 有不存在的
          const externalEmails = whiteList.filter(e => !whiteContactInAddressBook.find(c => contactApi.doGetModelDisplayEmail(c) === e));
          whiteExternalContacts = externalEmails.map(email => {
            return buildContactModel({ email: email, type: 'external', name: email });
          });
        }
        // 合并
        whiteListContact = [...whiteContactInAddressBook, ...whiteExternalContacts];

        /**
         * 将contactModel转换为ContactItem
         */
        const blackListContactItem = blackListContact.map(item => contactApi.transContactModel2ContactItem(item)) || [];
        const whiteListContactItem = whiteListContact.map(item => contactApi.transContactModel2ContactItem(item)) || [];

        setBlackListData(blackListContactItem);
        setBlackListDataTemp(blackListContactItem);
        setWhiteListData(whiteListContactItem);
        setWhiteListDataTemp(whiteListContactItem);
        setBlackListDomainData(blackDomainList);
        setBlackListDomainDataTemp(blackDomainList);
        setWhiteListDomainData(whiteDomainList);
        setWhiteListDomainDataTemp(whiteDomainList);
      })
      .catch(err => {
        console.error('[error getDefaultCCBCC fail]', err);
      });
  };

  // 保存数据
  const saveData = (blackListMails: string[], whiteListMails: string[]) => {
    // 请求接口
    return mailConfApi
      .setMailBlackList({
        blackList: blackListMails,
        whiteList: whiteListMails,
      })
      .then(res => {
        if (res) {
          // 数据变化
          onDataChange &&
            onDataChange({
              blackList: blackListMails,
              whiteList: whiteListMails,
            });
        }
        return res;
      });
  };

  // 抄送人发选择送变化
  const onCCChange = (value: ContactItem[]) => {
    setBlackListDataTemp(value);
  };

  // 密送人发生变化
  const onBCCChange = (value: ContactItem[]) => {
    setWhiteListDataTemp(value);
  };

  // 检测是否有邮箱同事存在于黑白名单
  const checkEmailsInBlackAndWhiteList = () => {
    // 检测黑名单和白名单中的邮件地址是否有交集
    try {
      const BlackListMails = getMailsFromContactItem(BlackListDataTemp || []);
      const WhiteListMails = getMailsFromContactItem(WhiteListDataTemp || []);
      const whiteListSet = new Set([...WhiteListMails, ...(WhiteListDomainDataTemp || [])]);
      const intersection = new Set([...BlackListMails, ...(BlackListDomainDataTemp || [])].filter(x => whiteListSet.has(x)));
      // 返回不同的邮件列表
      if (intersection.size > 0) {
        return [...intersection];
      }
    } catch (err) {
      console.error(err);
    }
    return [];
  };

  // 弹窗确定按钮
  const handleModalBtnOk = useDebounceForEvent(
    () => {
      const BlackListMails = getMailsFromContactItem(BlackListDataTemp || []);
      const WhiteListMails = getMailsFromContactItem(WhiteListDataTemp || []);
      // 进行邮箱格式正确性验证
      if (!checkEmails(BlackListMails) || !checkEmails(WhiteListMails)) {
        Message.error({ content: getIn18Text('YOUXIANGDIZHIGESCW') });
        return;
      }
      // 进行Domain格式正确性验证
      if (!checkDomain(BlackListDomainDataTemp || []) || !checkDomain(WhiteListDomainDataTemp || [])) {
        return;
      }

      // 检测是否有邮箱同事存在于黑白名单
      const intersection = checkEmailsInBlackAndWhiteList();
      if (intersection.length) {
        const mailStr = intersection[0];
        Message.error({ content: getIn18Text('BUNENGTONGSHIZAIHBMDZ', { mailStr }) });
        return;
      }

      const submitBlDomainList = BlackListDomainDataTemp
        ? BlackListDomainDataTemp.map(item => {
            if (item.includes('*@')) {
              return item;
            }
            return '*@' + item;
          })
        : [];

      const submitWhiteDomainList = WhiteListDomainDataTemp
        ? WhiteListDomainDataTemp.map(item => {
            if (item.includes('*@')) {
              return item;
            }
            return '*@' + item;
          })
        : [];

      saveData([...BlackListMails, ...submitBlDomainList], [...WhiteListMails, ...submitWhiteDomainList])
        .then(res => {
          if (res) {
            Message.success({ content: getIn18Text('BAOCUNCHENGGONG') });
            cancelModel(false);
          }
        })
        .catch(err => {
          if (err?.code === 'FA_LIST_FULL') {
            Message.error({ content: getIn18Text('CHAOGUOMINGDANSHULZDXZ') });
          } else {
            Message.error({ content: getIn18Text('CAOZUOSHIBAIQINGZS') });
          }
        });
    },
    300,
    {
      leading: true,
      trailing: false,
    }
  );

  // 黑名单域发成变化
  const handleBlDomainChange = (value: string[]) => {
    setBlackListDomainDataTemp(res => {
      return [...value];
    });
  };

  // 白名单域名变化
  const handleWhiteDomainCHange = (value: string[]) => {
    setWhiteListDomainDataTemp(res => {
      return [...value];
    });
  };

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
            className="BlackListModal-wrap"
            title={getIn18Text('HEIBAIMINGDAN')}
            destroyOnClose
            centered
            width={480}
            visible={visible}
            onCancel={() => cancelModel()}
            footer={null}
          >
            <div className="defaultCCModal-content">
              <div className="defaultCCModal-title">
                {getIn18Text('TIANJIAHEIMINGDANYX')}
                <span className="defaultCCModal-tip">{getIn18Text('RU')}: mail@example.com</span>
              </div>
              <div className="defaultCCModal-contactModel-wrap">
                <ContactScheduleModal
                  placeholder={getIn18Text('QINGSHURUYXDZ')}
                  showSuffix
                  defaultSelectList={BlackListDataTemp || BlackListData}
                  style={{
                    // maxHeight: '100px',
                    borderRadius: '4px',
                  }}
                  onChange={onCCChange}
                />
              </div>
              <div className="defaultCCModal-title" style={{ marginTop: '15px' }}>
                {getIn18Text('TIANJIAHEIMINGDANYM')}
                <span className="defaultCCModal-tip">{getIn18Text('RU')}: example.com</span>
              </div>
              <div className="defaultCCModal-contactModel-wrap">
                <Select
                  mode="tags"
                  style={{ width: '100%' }}
                  value={BlackListDomainDataTemp || BlackListDomainData}
                  onChange={handleBlDomainChange}
                  options={[]}
                  open={false}
                  tagRender={renderTagFunc}
                  placeholder={getIn18Text('QINGSHURUYUMING')}
                />
              </div>

              <div className="defaultCCModal-title" style={{ marginTop: '30px' }}>
                {getIn18Text('TIANJIABAIMINGDANYX')}
                <span className="defaultCCModal-tip">{getIn18Text('RU')}: mail@example.com</span>
              </div>
              <div className="defaultCCModal-contactModel-wrap">
                <ContactScheduleModal
                  placeholder={getIn18Text('QINGSHURUYXDZ')}
                  showSuffix
                  defaultSelectList={WhiteListDataTemp || WhiteListData}
                  style={{
                    // maxHeight: '100px',
                    borderRadius: '4px',
                  }}
                  onChange={onBCCChange}
                />
              </div>
            </div>
            {/* <div className="defaultCCModal-tip">{getIn18Text('RU')}: mail@example.com</div> */}
            <div className="defaultCCModal-title" style={{ marginTop: '15px' }}>
              {getIn18Text('TIANJIABAIMINGDANYM')}
              <span className="defaultCCModal-tip">{getIn18Text('RU')}: example.com</span>
            </div>
            <div className="defaultCCModal-contactModel-wrap">
              <Select
                mode="tags"
                style={{ width: '100%' }}
                value={WhiteListDomainDataTemp || WhiteListDomainData}
                onChange={handleWhiteDomainCHange}
                options={[]}
                open={false}
                tagRender={renderTagFunc}
                placeholder={getIn18Text('QINGSHURUYUMING')}
              />
            </div>

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
export default BlackListModal;
