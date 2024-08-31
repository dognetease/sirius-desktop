import React, { useState, useImperativeHandle, forwardRef, useEffect, useRef } from 'react';
import { Button, Modal, Dropdown, Space, Menu, Divider, Tooltip } from 'antd';
import { DropDownProps } from 'antd/lib/dropdown';
import { ButtonProps } from 'antd/lib/button';
import { apis, api, apiHolder, WhatsAppApi, WhatsAppFileExtractStatus, WhatsAppJobSendType, WhatsAppJobSubmitType, RequestEditWhatsAppJob, GlobalSearchApi } from 'api';
import classnames from 'classnames';
import { navigate } from '@reach/router';
import DownOutlined from '@ant-design/icons/DownOutlined';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/question.svg';
import useEdmSendCount, { IEdmEmailList } from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import { getTransText } from '@/components/util/translate';
import { LinkedInSearchTracker } from '../tracker';
import style from './style.module.scss';
import getPageRouterWithoutHash from '../../globalSearch/hook/getPageRouterWithoutHash';
import { useWhatsAppMarket } from '../../SNS/BizWhatsApp/useWhatsAppMarket';
const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

type ContactEmail = {
  contactName: string;
  contactEmail: string;
};
interface Props extends Partial<DropDownProps> {
  emails: string[];
  phoneNums: string[];
  buttonType?: 'button' | 'text';
  buttonProps?: ButtonProps;
  needCheckMail?: { contactName: string; contactEmail: string }[];
  shouldConfirm?: (needCheckMail: ContactEmail[], allMail: ContactEmail[]) => void;
  onRef?: any;
  checkedEmails?: ContactEmail[];
  tablSendMail?: ContactEmail[];
  needCheckByTable?: boolean;
  emailCount?: number;
  phoneCount?: number;
  clickByYijian?: () => void;
  id?: any;
  activeTab?: string;
}

/* eslint react/jsx-props-no-spreading: 0 */
const systemApi = apiHolder.api.getSystemApi();
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
export const MarketingOperation = forwardRef((props: Props, ref) => {
  const {
    emails,
    phoneNums,
    buttonType = 'button',
    buttonProps,
    needCheckMail,
    shouldConfirm,
    checkedEmails,
    tablSendMail,
    needCheckByTable,
    emailCount,
    phoneCount,
    clickByYijian,
    id,
    activeTab,
    ...rest
  } = props;
  const [loading, setLoading] = useState(false);
  const [emailList, setEmailList] = useState<Array<IEdmEmailList>>([]);
  const { className, ...restButtonProps } = buttonProps || {};
  const needCheckEmailList = React.useRef<{ contactName: string; contactEmail: string }[]>([]);
  const emailRef = React.useRef<{
    all: ContactEmail[];
    needCheck: ContactEmail[];
    id?: string | null;
  }>({
    all: [],
    needCheck: [],
    id: '',
  });
  const usePhoneRef = React.useRef<{ contactName: string; contactEmail: string }[]>([]);

  const { whatsAppLoading, whatsAppMarket } = useWhatsAppMarket();

  useEdmSendCount(emailList, undefined, undefined, undefined, 'linkedin', 'linkedin', getPageRouterWithoutHash());

  const edmMarketing = async () => {
    if (clickByYijian && activeTab === 'company') {
      const data: any = await handleGetContactById(id);
      handleCompanyData(data, 'company');
      if (needCheckEmailList.current.length > 0) {
        shouldConfirm && shouldConfirm(needCheckEmailList.current, emailRef.current.all);
      } else {
        setEmailList(
          data.map((item: any) => {
            return {
              contactEmail: item.contact,
              contactName: '',
              sourceName: '领英搜索',
              increaseSourceName: 'linkedin',
            };
          })
        );
      }
    } else {
      setEmail();
    }
  };

  const handleCompanyData = (list: any, type: 'company' | 'Lxr') => {
    console.log(list, 'xxxxx');
    handleEmailData(list);
  };

  const handleEmailData = (contactList: any) => {
    let emails;
    emails = contactList
      .map((item: any) => ({
        contactName: item.name ? item.name : '',
        contactEmail: item.contact ? item.contact : '',
        sourceName: '领英搜索',
        increaseSourceName: 'linkedin',
      }))
      .filter((item: any) => item.contactEmail);
    // setHasEmail(emails.length > 0)
    console.log(contactList, 'marketing', 22222);
    // return
    needCheckEmailList.current = contactList
      .filter((item: any) => !item.checkStatus)
      .map((item: any) => ({
        contactName: item.name ? item.name : '',
        contactEmail: item.contact ? item.contact : '',
        sourceName: '领英搜索',
        increaseSourceName: 'linkedin',
      }))
      .filter((item: any) => item.contactEmail);

    if (emails && emails?.length) {
      emailRef.current.all = emails;
    } else {
      emailRef.current.all = [];
    }
  };

  const setEmail = () => {
    setEmailList(emails.map(contactEmail => ({ contactEmail, contactName: '', sourceName: '领英搜索', increaseSourceName: 'linkedin' })));
    LinkedInSearchTracker.trackBatchOperation('sendEdm', (id || []).length);
  };

  const directSendEmail = (emailList: ContactEmail[] = emailRef.current.all) => {
    setEmailList(
      emailList.map((item: any) => {
        return {
          contactEmail: item.contactEmail,
          contactName: '',
          sourceName: '领英搜索',
          increaseSourceName: 'linkedin',
        };
      })
    );
  };

  useImperativeHandle(ref, () => {
    return {
      setEmail,
      directSendEmail,
    };
  });

  useEffect(() => {
    if (checkedEmails && checkedEmails.length > 0 && needCheckEmailList.current.length > 0) {
      setEmailList(checkedEmails);
    }
  }, [checkedEmails]);

  // useEffect(()=>{
  //   if (tablSendMail && tablSendMail.length > 0) {
  //     setEmailList(tablSendMail.map(item => ({
  //       contactEmail: item.contactEmail,
  //       contactName: '',
  //       sourceName: '领英搜索'
  //     })))
  //   }
  // },[tablSendMail?.length])

  // useEffect(() => {
  //   if (needCheckMail && needCheckMail.length > 0) {
  //     shouldConfirm && shouldConfirm()
  //   }
  // },[needCheckMail])

  const handleMarketHandler = async (phoneNumbers: string[]) => {
    let phoneData;
    if (activeTab === 'company') {
      const data: any = await handleGetContactById(id);
      const mobiles = data
        .filter((item: any) => item.phone && item.phone.length > 0)
        .map((item: any) => item.phone)
        .flat();
      phoneData = mobiles;
    } else {
      phoneData = phoneNumbers;
    }
    whatsAppMarket(phoneData);
  };

  const whatsAppMarketing = async () => {
    if (!phoneNums?.length && !phoneCount) {
      return;
    }
    // const contactData = await handleGetContactById(id)

    handleMarketHandler(phoneNums);
    LinkedInSearchTracker.trackListClick('bizWhatsapp');
  };

  const whatsAppPersonalMarketing = async () => {
    let phoneData;
    let numLength = phoneNums?.length;
    if (!numLength && !phoneCount) {
      return;
    }

    if (activeTab === 'company') {
      const data: any = await handleGetContactById(id);
      const mobiles = data
        .filter((item: any) => item.phone && item.phone.length > 0)
        .map((item: any) => item.phone)
        .flat();
      numLength = mobiles.length;
      phoneData = mobiles;
    } else {
      phoneData = phoneNums;
    }

    if (numLength > 100) {
      // 每次群发任务不能超过100条，否则易造成封号，请重新选择
      Toast.error(getTransText('PersonalWAMarketingError') || '');
      return;
    }

    // navigate(`#edm?page=pernsonalWhatsapp&tab=job&phoneList=${phoneNums.join(',')}`);
    if (systemApi.isElectron()) {
      systemApi.createWindowWithInitData('personalWhatsapp', { eventName: 'initPage', eventData: { tab: 'job', phoneList: phoneData.join(',') } });
    } else {
      window.open(`/personalWhatsapp/?tab=job&phoneList=${phoneData.join(',')}`, 'personalWhatsapp');
    }
  };

  const handleGetContactById = (list: string[]) => {
    return new Promise((reslove, reject) => {
      try {
        globalSearchApi
          .globalSearchGetContactById(list)
          .then(data => {
            let list: any = [];
            console.log(list, '22222xxxxsxsxsxs');
            Object.values(data).forEach(item => {
              list = [...list, ...item];
            });
            reslove(list);
          })
          .catch(() => {
            reject('接口错误');
          });
      } catch (error) {
        reject(error);
      }
    });
  };

  return (
    <Dropdown
      {...rest}
      overlay={
        <Menu>
          <Menu.Item disabled={!emails?.length && !emailCount} onClick={edmMarketing}>
            <Space className={style.alCenter}>
              {getTransText('EDMMarketing')}
              {!emails?.length && !emailCount ? (
                <Tooltip title={getTransText('EDMMarketingTip')}>
                  <QuestionIcon />
                </Tooltip>
              ) : (
                ''
              )}
            </Space>
          </Menu.Item>
          <Menu.Item disabled={(!phoneNums?.length && !phoneCount) || whatsAppLoading} onClick={whatsAppMarketing}>
            <Space className={style.alCenter}>
              {getTransText('WAMarketing')}
              {!phoneNums?.length && !phoneCount ? (
                <Tooltip title={getTransText('WAMarketingTip')}>
                  <QuestionIcon />
                </Tooltip>
              ) : (
                ''
              )}
            </Space>
          </Menu.Item>
          <Menu.Item disabled={(!phoneNums?.length && !phoneCount) || whatsAppLoading} onClick={whatsAppPersonalMarketing}>
            <Space className={style.alCenter}>
              {getTransText('PersonalWAMarketing')}
              {!phoneNums?.length && !phoneCount ? (
                <Tooltip title={getTransText('PersonalWAMarketingTip')}>
                  <QuestionIcon />
                </Tooltip>
              ) : (
                ''
              )}
            </Space>
          </Menu.Item>
        </Menu>
      }
    >
      {buttonType === 'button' ? (
        <Button type="primary" className={classnames(className, style.button)} {...restButtonProps}>
          {getTransText('YIJIANYINGXIAO')}
          <Divider type="vertical" className={style.divider} />
          <div className={style.downTriangle}>
            <DownTriangle />
          </div>
        </Button>
      ) : (
        <Space>
          <span className={style.linkBtn}>{getTransText('YIJIANYINGXIAO')}</span>
          <DownOutlined className={style.linkBtnIcon} />
        </Space>
      )}
    </Dropdown>
  );
});
