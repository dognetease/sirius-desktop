// eslint-disable-next-line no-use-before-define
import React, { useEffect, useState, useMemo } from 'react';
import { Modal } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { ContactAndOrgApi, DataTrackerApi, MailEntryModel, MailPlusCustomerApi, SystemApi, apiHolder as api, apis, getIn18Text } from 'api';
import style from './EdmReplyMark.module.scss';
import IconCard from '@web-common/components/UI/IconCard';
import classnames from 'classnames';
import { useLocation } from '@reach/router';
import { useAppSelector } from '@web-common/state/createStore';
import { useContactEmailRole, useContactModel } from '@web-common/hooks/useContactModel';
import { UniDrawerModuleId, showUniDrawer } from '@lxunit/app-l2c-crm';
import { BusinessContactVO } from '@lxunit/app-l2c-crm/models';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { refreshContactDataByEmails } from '@web-common/state/reducer/contactReducer';
const mailPlusCustomerApi = api.api.requireLogicalApi(apis.mailPlusCustomerApiImpl) as MailPlusCustomerApi;
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;

interface Props {
  content: MailEntryModel;
  directSecond?: boolean; // 营销场景使用，如果是true直接展示第二个弹窗
}

const EdmReplyMark: React.FC<Props> = props => {
  const { content, directSecond = false } = props;
  const { id: mid } = content || {};
  const location = useLocation();
  // 当前tab类型
  const currentTabType = useAppSelector(state => state.mailTabReducer.currentTab.type);

  // 首次弹窗
  const [open, setOpen] = useState(false);
  // 二次确认
  const [visible, setVisible] = useState(false);
  // 客户弹窗
  const [customerVisible, setCustomerVisible] = useState(false);
  // 抖动的状态控制
  const [shark, setShark] = useState(false);
  // 有操作客户的权限
  const hasCustomerPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'CONTACT', 'OP'));

  // 判断是否是客户，如果是客户就展示更新记录，不是则展示新增客户
  const account = content?._account || systemApi.getCurrentUser()?.id;
  const email = content.sender.contact ? contactApi.doGetModelDisplayEmail(content.sender.contact) : '';
  const name = content.sender.contact?.contact?.contactName;
  const emailRole = useContactEmailRole({ email, _account: account, name });
  // 是否是客户（我的客户，有权限的同事客户）
  const isCustomer = useMemo(() => emailRole === 'myCustomer' || emailRole === 'colleagueCustomer', [emailRole]);
  const contactModel = useContactModel({ email, needFull: false, _account: account });
  // 是否是同事
  const isColleage = useMemo(() => emailRole === 'enterprise' || contactModel?.contact?.type === 'enterprise', [emailRole, contactModel]);
  // 当前展示的客户详情id
  const customerId = useMemo(() => contactModel?.customerOrgModel?.companyId, [contactModel?.customerOrgModel?.companyId]);

  const onShark = () => {
    setShark(true);
    setTimeout(() => {
      setShark(false);
    }, 1000);
  };
  // 关闭第一弹窗
  const onCancel = (e: any) => {
    // 如果是蒙层，则添加动画
    if (e.target.classList.contains('ant-modal-wrap')) {
      // 添加动画
      onShark();
    } else {
      // 关闭第一个弹窗
      setOpen(false);
      // 如果是点击关闭则弹窗提示
      setVisible(true);
      try {
        trackApi.track('marketingemai_notautoreply_firsttime_mark_action', { actiontype: 'close' });
      } catch (error) {
        console.log(error);
      }
    }
  };
  // 关闭二次弹窗
  const onCancel2 = (e: any) => {
    // 如果是蒙层，则添加动画
    if (e.target.classList.contains('ant-modal-wrap')) {
      // 添加动画
      onShark();
    } else {
      // 关闭第一个弹窗
      setVisible(false);
      try {
        trackApi.track('marketingemai_notautoreply_secondtime_mark_action', { actiontype: 'close', source: directSecond ? 'edmtaskre' : 'emaillstre' });
      } catch (error) {
        console.log(error);
      }
    }
  };
  // 关闭客户弹窗
  const onCancel3 = () => {
    setVisible(false);
    setCustomerVisible(false);
    setOpen(false);
  };

  // 点击创建客户（调用uni打开创建客户）或者更新客户（调用uni查看客户）
  const onCustomerOk = () => {
    setCustomerVisible(false);
    if (isCustomer) {
      // 查看客户
      if (customerId) {
        showUniDrawer({
          moduleId: UniDrawerModuleId.CustomerView,
          moduleProps: {
            customerId: Number(customerId),
            visible: true,
            onClose: () => {},
          },
        });
      }
      // 打点：更新客户
      try {
        trackApi.track('marketingemai_notautoreply_updateclient', { actiontype: 'yes', source: directSecond ? 'edmtaskre' : 'emaillstre' });
      } catch (error) {
        console.log(error);
      }
    } else {
      // 新建客户
      const contactList = [
        {
          condition: 'company',
          contact_name: name,
          email,
        },
      ] as unknown as BusinessContactVO[];
      showUniDrawer({
        moduleId: UniDrawerModuleId.CustomerDetail,
        moduleProps: {
          visible: true,
          onClose: () => {},
          onSuccess: () => {
            // 请求成功后会返回新客户的id
            refreshContactDataByEmails(
              {
                [account as string]: [email],
              },
              new Map([[email, name]])
            );
          },
          customerData: {
            contact_list: contactList,
          },
          source: 'edmEmailReply',
        },
      });
      // 打点：创建客户
      try {
        trackApi.track('marketingemai_notautoreply_createcustomer', { actiontype: 'yes', source: directSecond ? 'edmtaskre' : 'emaillstre' });
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    let edmReplyMarkTimer: any;
    const showReadMail = ['readMain', 'read', 'customer'].includes(currentTabType);
    const curHash = location.hash;
    // 营销场景或空hash
    const toSecond = directSecond || !curHash;
    if (process.env.BUILD_ISEDM && mid && (curHash.indexOf('mailbox') >= 0 || toSecond) && showReadMail) {
      // 三秒后发出请求
      edmReplyMarkTimer = setTimeout(() => {
        mailPlusCustomerApi.doGetReplyMark(mid).then(res => {
          if (!!res.visible) {
            // 如果是营销场景使用，直接展示二弹窗
            if (toSecond) {
              setVisible(true);
            } else {
              setOpen(true);
              // 打点：营销信回复首次标记弹窗
              try {
                trackApi.track('marketingemai_notautoreply_firsttime_mark_window');
              } catch (error) {
                console.log(error);
              }
            }
          }
        });
      }, 3000);
    }
    return () => {
      // 如果邮件改变，则直接清除，不再发出请求
      setOpen(false);
      setVisible(false);
      clearTimeout(edmReplyMarkTimer);
    };
  }, [mid, location.hash, currentTabType]);

  // 外贸通标记是否有效回复邮件
  const edmReplyMarkConfirm = async (mid: string, valid: boolean) => {
    setOpen(false);
    setVisible(false);
    await mailPlusCustomerApi.doGetReplyMarkConfirm(mid, valid);
  };

  return (
    <>
      {/* 第一次弹窗 */}
      <Modal
        visible={open}
        className={classnames(style.modalClass, style.modalClassRightBottom, { [style.modalShake]: open && shark })}
        maskStyle={{ left: 0, background: 'rgba(0,0,0,0.04)' }}
        width={400}
        footer={[
          <Button
            btnType="minorGray"
            inline
            onClick={() => {
              edmReplyMarkConfirm(mid, true);
              if (hasCustomerPermisson && !isColleage) {
                setCustomerVisible(true);
              }
              try {
                trackApi.track('marketingemai_notautoreply_firsttime_mark_action', { actiontype: 'yes' });
              } catch (error) {
                console.log(error);
              }
            }}
          >
            {getIn18Text('HUI')}
          </Button>,
          <Button
            btnType="minorGray"
            inline
            onClick={() => {
              edmReplyMarkConfirm(mid, false);
              try {
                trackApi.track('marketingemai_notautoreply_firsttime_mark_action', { actiontype: 'no' });
              } catch (error) {
                console.log(error);
              }
            }}
          >
            {getIn18Text('BUHUI')}
          </Button>,
        ]}
        closable={true}
        mask={true}
        maskClosable={true}
        onCancel={onCancel}
        zIndex={9999}
        title={
          <>
            <span className={style.yiwen}>
              <IconCard style={{ pointerEvents: 'none' }} type="tongyong_yiwen_mian" />
            </span>
            <span>{getIn18Text('ZHEFENGYOUJIANNINHJXHFGTM？')}</span>
          </>
        }
      >
        <div>{getIn18Text('NINDEHUIDAKEYHKHMX，WNTGGJZDKHTJ')}</div>
      </Modal>
      {/* 第二次弹窗 */}
      <Modal
        visible={visible}
        className={style.modalClass}
        maskStyle={{ left: 0 }}
        centered={true}
        width={400}
        footer={[
          <Button
            btnType="minorGray"
            inline
            onClick={() => {
              edmReplyMarkConfirm(mid, true);
              if (hasCustomerPermisson && !isColleage) {
                setCustomerVisible(true);
              }
              try {
                trackApi.track('marketingemai_notautoreply_secondtime_mark_action', { actiontype: 'yes', source: directSecond ? 'edmtaskre' : 'emaillstre' });
              } catch (error) {
                console.log(error);
              }
            }}
          >
            {getIn18Text('HUIGOUTONG')}
          </Button>,
          <Button
            btnType="minorGray"
            inline
            onClick={() => {
              edmReplyMarkConfirm(mid, false);
              try {
                trackApi.track('marketingemai_notautoreply_secondtime_mark_action', { actiontype: 'no', source: directSecond ? 'edmtaskre' : 'emaillstre' });
              } catch (error) {
                console.log(error);
              }
            }}
          >
            {getIn18Text('BUHUIGOUTONG')}
          </Button>,
        ]}
        closable={true}
        mask={true}
        maskClosable={true}
        onCancel={onCancel2}
        zIndex={9999}
        title={
          <>
            <span className={style.yiwen}>
              <IconCard style={{ pointerEvents: 'none' }} type="tongyong_yiwen_mian" />
            </span>
            <span>{getIn18Text('ZHEFENGYOUJIANNINQRHHFGTM？')}</span>
          </>
        }
      >
        <div>{getIn18Text('NINDEHUIDAKEYHKHMX，WNTGGJZDKHTJ')}</div>
      </Modal>
      {/* 判断是否是更新记录还是新建客户的弹窗 */}
      <Modal
        visible={customerVisible}
        className={style.modalClass}
        maskStyle={{ left: 0 }}
        centered={true}
        width={400}
        footer={[
          <Button
            btnType="minorGray"
            inline
            onClick={() => {
              setCustomerVisible(false);
              try {
                if (isCustomer) {
                  // 打点：更新客户
                  trackApi.track('marketingemai_notautoreply_updateclient', { actiontype: 'no', source: directSecond ? 'edmtaskre' : 'emaillstre' });
                } else {
                  // 打点：新建客户
                  trackApi.track('marketingemai_notautoreply_createcustomer', { actiontype: 'no', source: directSecond ? 'edmtaskre' : 'emaillstre' });
                }
              } catch (error) {
                console.log(error);
              }
            }}
          >
            {isCustomer ? getIn18Text('SHAOHOUGENGXIN') : getIn18Text('SHAOHOUCHUANGJIAN')}
          </Button>,
          <Button
            btnType="primary"
            inline
            onClick={() => {
              onCustomerOk();
            }}
          >
            {isCustomer ? getIn18Text('GENGXINJILU') : getIn18Text('CHUANGJIANKEHU')}
          </Button>,
        ]}
        closable={false}
        mask={true}
        maskClosable={false}
        onCancel={onCancel3}
        zIndex={9999}
        title={
          <>
            <span style={{ marginRight: 6 }}>
              <IconCard style={{ pointerEvents: 'none' }} fill="#0FD683" type="tongyong_chenggong_mian" />
            </span>
            <span>{isCustomer ? getIn18Text('NINXIANZAIKEYIGXCHFYJLXRDKHXX') : getIn18Text('NINXIANZAIKEYIWCHFYJLXRCJKH')}</span>
          </>
        }
      >
        <div>{isCustomer ? getIn18Text('HOUXUKEZAIKEHGLMKJXKHXXCKHKHJDGJ') : getIn18Text('CHUANGJIANHOUKEZAIKHGLMKJXKHXXCKHKHJDGJ')}</div>
      </Modal>
    </>
  );
};

export default EdmReplyMark;
