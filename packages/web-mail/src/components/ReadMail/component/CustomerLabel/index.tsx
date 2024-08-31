import React from 'react';
import './index.scss';
import { AccountApi, apiHolder as api, apis, ContactAndOrgApi, ContactModel, EmailRoles, SystemApi } from 'api';
import { useContactEmailRole } from '@web-common/hooks/useContactModel';
import { getIn18Text } from 'api';

const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

// 根据emailRole生成标签
interface CustomerLabelByRoleProps {
  role: EmailRoles;
  simpleStyle?: boolean;
  showEnterpriseLabel?: boolean;
  style?: any;
  isContact?: boolean; // 是否是联系人
}
// 提取出根据emailRole渲染标签的组件
export const CustomerLabelByRole: React.FC<CustomerLabelByRoleProps> = props => {
  const { role: emailRole, simpleStyle, style, isContact, showEnterpriseLabel = false } = props;
  let labelText = '';
  let labelClass = '';
  const emailRoleList = process.env.BUILD_ISEDM
    ? ['myCustomer', 'colleagueCustomer', 'colleagueCustomerNoAuth', 'enterprise', 'openSeaCustomer', 'myClue', 'colleagueClue', 'colleagueClueNoAuth', 'openSeaClue']
    : ['enterprise'];
  // 当前支持的标签：客户，同事的客户，同事的客户(无权限),同事, 公海客户（0815版本仅保留简单样式的同事标签）,我的线索，同事线索，公海线索
  if (!emailRoleList.includes(emailRole)) {
    return <></>;
  }
  // 标签title
  const textObj: Partial<Record<EmailRoles, string>> = {
    myCustomer: getIn18Text('WODEKEHU'),
    colleagueCustomer: getIn18Text('colleagueCustomer'),
    colleagueCustomerNoAuth: getIn18Text('colleagueCustomer'),
    openSeaCustomer: getIn18Text('GONGHAIKEHU'),
    enterprise: getIn18Text('colleague'),
    myClue: getIn18Text('WODEXIANSUO'),
    colleagueClue: getIn18Text('TONGSHIXIANSUO'),
    colleagueClueNoAuth: getIn18Text('TONGSHIXIANSUO'),
    openSeaClue: getIn18Text('GONGHAIXIANSUO'),
  };
  // 角色标签类名
  const classNameObj: Partial<Record<EmailRoles, string>> = {
    myCustomer: 'my-customer-label',
    colleagueCustomer: 'colleague-customer-label',
    colleagueCustomerNoAuth: 'colleague-customer-label',
    openSeaCustomer: 'openSea-customer-label',
    enterprise: 'enterprise-label',
    myClue: 'my-clue-label',
    colleagueClue: 'colleague-clue-label',
    colleagueClueNoAuth: 'colleague-clue-label',
    openSeaClue: 'openSea-clue-label',
  };
  // 联系人标签类名，目前仅支持一个，我的客户联系人
  const contactClassNameObj: Partial<Record<EmailRoles, string>> = {
    myCustomer: 'my-customer-contact-label',
    myClue: 'my-clue-contact-label',
  };

  labelText = textObj[emailRole] || '';
  // 如果是联系人，则取联系人的类名
  labelClass = isContact ? contactClassNameObj[emailRole] || '' : classNameObj[emailRole] || '';
  // 如果没有匹配到标签的返回空
  if (!labelText) {
    return <></>;
  }
  // 最简样式
  if (simpleStyle) {
    return (
      <span className="u-card-theme" style={style}>
        [{labelText}]
      </span>
    );
  }
  // 同事标签仅保留简单样式的标签，其他标签不再返回了
  if (emailRole === 'enterprise' && !showEnterpriseLabel) {
    return <></>;
  }
  // 默认样式
  return <span className={`tag-label ${labelClass}`} style={style} title={labelText}></span>;
};

interface Props {
  simpleStyle?: boolean;
  style?: any;
  contact: ContactModel;
  showEnterpriseLabel?: boolean;
  curAccount: string | undefined; // 当前账号信息，改成必填的
}

// 展示客户/线索/企业同事的Label
const CustomerLabel: React.FC<Props> = props => {
  const { simpleStyle, style = {}, contact, curAccount = '', showEnterpriseLabel = false } = props;

  const email = contact ? contactApi.doGetModelDisplayEmail(contact) : '';
  const account = curAccount || systemApi.getCurrentUser()?.id;
  const name = contact?.contact?.contactName;

  // 自己即『我』不显示客户、线索标签,比较是否一致，调用accountApi方法getIsSameSubAccountSync
  // 如果是自己则不展示任何标签
  if (accountApi.getIsSameSubAccountSync(account as string, email)) {
    return <></>;
  }
  // 使用新的hook，入参和useContactModel相同，出参直接是类型
  const emailRole = useContactEmailRole({ email, _account: account, name });
  return <CustomerLabelByRole role={emailRole} style={style} simpleStyle={simpleStyle} showEnterpriseLabel={showEnterpriseLabel} />;
};

export default CustomerLabel;
