import React, { useEffect, useRef, useState } from 'react';
import { Popover } from 'antd';
import { TooltipPlacement } from 'antd/lib/tooltip';
import { apiHolder as api, ContactModel, SystemApi, apis, ContactAndOrgApi, DataTrackerApi, isEdm, AccountApi } from 'api';
import ContactDetail from '@web-contact/component/Detail/detail';
import { useContactModel } from '@web-common/hooks/useContactModel';
import { getIn18Text } from 'api';

interface Props {
  contact: ContactModel;
  type?: string;
  trigger?: string;
  originName?: string;
  placement?: TooltipPlacement;
  domName?: string;
  onNotifyParent?: () => void;
  // 禁用状态不会弹窗
  disabled?: boolean;
  showAccount?: boolean;
  // 显氏声明当前账号
  curAccount?: string;
  // 外贸客户标签
  customerLabel?: React.ReactNode;
  // 卡片打开事件
  handleVisible?: (visible: boolean) => void;
  // 是否被选中，外贸通发件箱用到
  isSelected?: boolean;
}
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

const ItemCard: React.FC<Props> = props => {
  const {
    contact,
    type,
    trigger,
    showAccount = true,
    children,
    originName = '',
    placement = 'bottomLeft',
    domName,
    onNotifyParent,
    disabled = false,
    curAccount = systemApi.getCurrentUser()?.id,
    customerLabel,
    handleVisible,
    isSelected,
  } = props;
  const _account = systemApi.getCurrentUser()?.id;
  const contactId = contact?.contact?.accountId;
  const email = contact?.contact?.hitQueryEmail || contact?.contact?.accountName;
  const name = contact?.contact?.contactName;
  const contactModel =
    useContactModel({
      email,
      contactId,
      isMainAccount: curAccount === _account,
      needFull: false,
      name,
      _account: curAccount,
    }) || contact;
  // useUpdateContactModel({ contactId, email, _account, name });
  const domContainer = domName ? document.body : document.getElementById('mailboxModule') || document.body;
  const [visible, setVisible] = useState<boolean>(false);
  const contactType = useRef('stranger');

  useEffect(() => {
    if (contactModel) {
      if (process.env.BUILD_ISEDM && contactModel.customerOrgModel) {
        contactType.current = contactModel.customerOrgModel.role;
      } else if (contactModel?.contact?.type === 'personal') {
        contactType.current = 'personal';
      } else if (contactModel?.contact?.type === 'enterprise') {
        contactType.current = 'enterprise';
      }
    }
  }, [contactModel]);

  // 埋点
  useEffect(() => {
    if (contactId && visible && contactType.current) {
      trackApi.track('waimao_mail_view_contactsDetailPage_contactType', { contactType: contactType.current });
    }
  }, [contactId, visible]);

  const renderCard = (model: ContactModel) => {
    let name = null;
    if (model) {
      // 1.25郭超修改.如果是个人邮箱的话用外部数据传入的email
      const displayEmail = model?.contact?.type === 'personal' ? email : contactApi.doGetModelDisplayEmail(model);
      if (curAccount === displayEmail) {
        // 处理三方挂在账号下，草稿箱发件人展示账号id问题
        const isThirdSubAccount = systemApi.getIsThirdSubAccountByEmailId(displayEmail); // 是否是三方挂载账号
        const displayEmail2 = isThirdSubAccount ? accountApi.getAgentEmailByEmail(displayEmail) : displayEmail;
        name = (
          <>
            <span className="u-card-theme" data-test-id="mail-head-name">
              {getIn18Text('WO')}
            </span>
            {showAccount ? (
              <span className="u-card-email" title={displayEmail}>
                &nbsp;&nbsp;{displayEmail2}
              </span>
            ) : null}
          </>
        );
      } else if (model?.contact?.type !== 'external' && model?.contact?.contactName) {
        name = (
          <>
            <span className="u-card-theme" data-test-id="mail-head-name" style={{ minWidth: process.env.BUILD_ISEDM ? '25px' : 'auto' }}>
              {model?.contact?.contactName || originName}
            </span>
            {showAccount && displayEmail ? (
              <span className="u-card-email" title={displayEmail} data-test-id="mail-head-email">
                &nbsp;&nbsp;{displayEmail}
              </span>
            ) : null}
          </>
        );
      } else {
        name = (
          <>
            <span className="u-card-theme" data-test-id="mail-head-name" style={{ minWidth: process.env.BUILD_ISEDM ? '25px' : 'auto' }}>
              {originName || model?.contact?.contactName || displayEmail}
            </span>
            {showAccount && displayEmail ? (
              <span className="u-card-email" title={displayEmail}>
                &nbsp;&nbsp;{displayEmail}
              </span>
            ) : null}
          </>
        );
      }
    }
    return name;
  };

  return disabled ? (
    <>
      {type === 'avatar' ? (
        children
      ) : (
        <div className={`u-card${isSelected ? ' u-card-selected' : ''}`}>
          {renderCard(contactModel)}
          {customerLabel ? customerLabel : null}
        </div>
      )}
    </>
  ) : (
    <Popover
      trigger="click"
      visible={visible}
      onVisibleChange={_visible => {
        setVisible(_visible);
        handleVisible && handleVisible(_visible);
      }}
      getPopupContainer={() => domContainer}
      overlayClassName="u-detail-popup contact-mumber-popover"
      placement={placement}
      // @ts-ignore
      onClick={(e: any) => e.stopPropagation()}
      content={
        <ContactDetail
          contact={contactModel}
          email={contactApi.doGetModelDisplayEmail(contactModel)}
          contactId={contactModel?.contact?.id}
          originName={originName}
          dividerLine={false}
          directSend
          branch
          toolipShow
          containerClassName="detail-read-container extheme"
          // @ts-ignore
          trigger={trigger}
          showClose={false}
          _account={curAccount}
          onNotifyParent={() => {
            onNotifyParent && onNotifyParent();
            setVisible(false);
          }}
        />
      }
    >
      {type === 'avatar' ? (
        children
      ) : (
        <div className={`u-card${isSelected ? ' u-card-selected' : ''}`}>
          {renderCard(contactModel)}
          {customerLabel ? customerLabel : null}
        </div>
      )}
    </Popover>
  );
};
export default ItemCard;
