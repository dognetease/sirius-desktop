import React, { useEffect, useMemo, useState, useRef } from 'react';
import classnames from 'classnames';
import style from './detail_edm.module.scss';
import SendMailPop from './SendMailPop';
import { Popover, Spin } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { useContactModel, useCustomerModel } from '@web-common/hooks/useContactModel';
// import { emailRoleToText } from '@web-common/utils/contact_util';
import {
  anonymousFunction,
  apiHolder as api,
  apiHolder,
  apis,
  CustomerDiscoveryApi,
  CustomerEmailListCondition,
  CustomerOrgModel,
  DataTrackerApi,
  MailConfApi,
  getIn18Text,
  ContactModel,
  ICustomerModel,
  MailPlusCustomerApi,
} from 'api';
import { ReactComponent as CheckedCircleIcon } from '@/images/icons/checked_circle.svg';
import { ReactComponent as CloseCircleIcon } from '@/images/icons/close_circle.svg';
import { CopyIcon } from '@web-common/components/UI/Icons/icons';
import CopyToClipboard from 'react-copy-to-clipboard';
// import { createNewBusinessModal } from '@/components/Layout/Customer/Business/components/CreateNewBusinessModal/createNewBussinessModal';
// import { createClueToCustomerModal } from '@/components/Layout/Customer/Clue/components/CreateClinetBusinessModal/createClientBussinessModal';
// import CustomerDrawer from '@/components/Layout/Customer/NewClient/components/CustomerDetail/customerDetail';
// import ClueDrawer from '@/components/Layout/Customer/Clue/components/ClueDetail/clueDetail';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { DataSource } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import { doGetCustomerContactByEmails, doGetCustomersByIds } from '@web-common/state/reducer/contactReducer';
// import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { CustomerLabelByRole } from '@web-mail/components/ReadMail/component/CustomerLabel';
import EllipsisLabels from '@/components/Layout/Customer/components/ellipsisLabels/ellipsisLabels';
import { transICustomerLabelModel2LabelModel } from '@web-common/utils/contact_util';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import { UniDrawerModuleId, showUniDrawer } from '@lxunit/app-l2c-crm';

export type Source = keyof typeof DataSource;
interface CustomerDetailProps {
  email: string;
  contactId?: string;
  handleAddContact: anonymousFunction;
  onNotifyParent?: anonymousFunction;
  originName?: string;
  showClose?: boolean;
  requiredInfo?: {
    hideRelateMail?: boolean;
    hideAddContact?: boolean;
    hideAddChance?: boolean;
  };
  source?: Source;
  onlyCustomer?: boolean; // 只要客户数据
  _account?: string;
}
interface SelectListProps {
  id: string;
  name: string;
}
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const mailPlusCustomerApi = apiHolder.api.requireLogicalApi(apis.mailPlusCustomerApiImpl) as MailPlusCustomerApi;

const CustomerDetail: React.FC<CustomerDetailProps> = props => {
  const { email, contactId, handleAddContact, onNotifyParent, _account, originName, showClose, requiredInfo, source, onlyCustomer = false } = props;
  // const [showDrawerType, setShowDrawerType] = useState<string>();
  const [drawerOpenLoading, setDrawerOpenLoading] = useState(false);
  // 用来切换的公司列表
  const [contactList, setContactList] = useState<SelectListProps[]>([]);
  // 线索状态映射
  const [statusObj, setStatusObj] = useState<Record<number, string>>();
  // 线索星级映射
  const [starLevelObj, setStarLevelObj] = useState<Record<number, string>>();
  // 客户阶段映射
  const [customerStageObj, setCustomerStageObj] = useState<Record<number, string>>();
  // 调用UNI弹窗
  // const [, setUniCustomerParam] = useState2RM('uniCustomerParam');
  // 调用UNI弹窗
  // const [, setUniClueViewParam] = useState2RM('uniClueViewParam');

  const [onlyContactModel, setOnlyContactModel] = useState<ContactModel | undefined>();
  const [onlyCustomerModel, setOnlyCustomerModel] = useState<ICustomerModel | undefined>();
  // 获取客户联系人简要信息
  const contactModel = onlyCustomer ? onlyContactModel : useContactModel({ email, needFull: false, _account });
  const [selectedId, setSelectedId] = useState<string>();
  const role = contactModel?.customerOrgModel?.role;
  // 是否是无权限的同事客户
  const isNoAuth = useMemo(() => contactModel && (role === 'colleagueCustomerNoAuth' || role === 'colleagueClueNoAuth'), [contactModel]);
  // 当前展示的客户详情id
  const customerId = useMemo(() => {
    return selectedId || contactModel?.customerOrgModel?.companyId;
  }, [contactModel?.customerOrgModel?.companyId, selectedId]);

  // 获取客户详情信息
  const customerModel = onlyCustomer ? onlyCustomerModel : useCustomerModel({ customerId, email, _account, emailRole: role });

  // 当客户详情发生变化，获取该客户下的拥有 email 的联系人信息，并设置查找到联系人的id为展示的联系人id（用来更新当前联系人基本信息）
  const name = useMemo(() => {
    let str = contactModel?.contact.contactName || originName || email;
    if (customerModel && selectedId) {
      customerModel?.contactList?.some(item => {
        if (item.email === email) {
          str = item.name;
          return true;
        }
        return false;
      });
    }
    return str;
  }, [contactModel?.contact.contactName, customerModel, selectedId, originName, email]);

  useEffect(() => {
    if (onlyCustomer) {
      doGetCustomerContactByEmails({ emails: [email] }).then(res => {
        if (res[email]) {
          setOnlyContactModel(res[email]);
        }
      });
    }
  }, [onlyCustomer, email]);

  const onlyCustomerId = onlyContactModel?.customerOrgModel?.companyId;
  useEffect(() => {
    if (onlyCustomer && onlyCustomerId) {
      doGetCustomersByIds([onlyCustomerId], 'server').then(res => {
        if (res?.length) {
          setOnlyCustomerModel(res[0]);
        }
      });
    }
  }, [onlyCustomer, onlyCustomerId]);
  /**
   * 当联系人详情发生变化
   * 确定是否是客户联系人
   * 获取当前联系人对应的客户id并且修改展示的客户id
   * 设置最初始的联系人id 对应的relatedCompanyInfo为切换公司的列表
   * */
  useEffect(() => {
    if (contactModel?.customerOrgModel) {
      const { relatedCompanyInfo } = contactModel.customerOrgModel as CustomerOrgModel;
      if (contactModel.contact?.id === contactId && relatedCompanyInfo) {
        setContactList(
          relatedCompanyInfo.map(item => ({
            id: item.companyId,
            name: item.companyName,
          }))
        );
      }
    }
  }, [contactModel?.contact?.id, contactId]);

  // const customerLabel = role && emailRoleToText(role); // 内容重新生成
  const isCustomer = ['myCustomer', 'colleagueCustomer', 'colleagueCustomerNoAuth', 'openSeaCustomer'].includes(role); // 判断是客户或者线索
  const isClue = ['myClue', 'colleagueClue', 'colleagueClueNoAuth', 'openSeaClue'].includes(role); // 判断是客户或者线索
  const isOpenSea = ['openSeaCustomer', 'openSeaClue'].includes(role); // 判断是否是公海

  // 获取一次字典
  const getStatusInfo = () => {
    mailPlusCustomerApi.doGetClueStatus(isCustomer ? 'customer' : 'leads').then(res => {
      const objStatus: Record<number, string> = {};
      const objStarLevel: Record<number, string> = {};
      const objCustomerStage: Record<number, string> = {};
      // 线索状态
      res?.status?.forEach(i => {
        objStatus[i.id] = i.value as string;
      });
      // 线索星级
      res?.star_level?.forEach(i => {
        objStarLevel[i.id] = i.value as string;
      });
      // 客户阶段
      res?.customer_stage?.forEach(i => {
        objCustomerStage[i.id] = i.value as string;
      });
      setStatusObj(objStatus);
      setStarLevelObj(objStarLevel);
      setCustomerStageObj(objCustomerStage);
    });
  };
  useEffect(() => {
    if (isCustomer || isClue) {
      getStatusInfo();
    }
  }, [role]);
  // 没有数据
  if (!contactModel || (!isNoAuth && !customerModel)) {
    return null;
  }
  /**
   * 点击关闭按钮
   */
  const handleClose = () => {
    onNotifyParent && onNotifyParent();
  };

  /**
   * 往来邮件
   */
  const handleRelateMail = () => {
    handleClose();
    mailConfApi.doOpenRelatedPage(contactModel);
  };

  /**
   * 打开客户详情
   */
  const handleOpenCustomerDetail = () => {
    if (isCustomer) {
      trackApi.track('waimao_mail_view_contactsDetailPage​_action', { action: 'viewCustomer' });
    }
    setDrawerOpenLoading(true);
    // 利用了往来邮件的接口，提前判断是否有权限来查看客户信息 // todo 迁移UI进行验证
    const mainResourceId = contactModel?.customerOrgModel?.companyId;
    if (mainResourceId) {
      customerDiscoveryApi
        .getCustomerEmailList({
          condition: isCustomer ? CustomerEmailListCondition.Company : CustomerEmailListCondition.Clue,
          main_resource_id: mainResourceId,
          page: 1,
          page_size: 1,
          noErrorMsgEmit: true,
        })
        .then(() => {
          // 打开查看客户详情弹窗
          OpenUniDrawer();
        })
        .catch(e => {
          if (typeof e === 'string') {
            message.error(e).then(() => {});
          } else {
            message.error(getIn18Text('DUIBUQIMEIQUANXIAN')).then(() => {});
          }
        })
        .finally(() => {
          setDrawerOpenLoading(false);
        });
    } else {
      setDrawerOpenLoading(false);
    }
  };

  // 调用UNI查看客户客户详情
  const OpenUniDrawer = () => {
    if (isCustomer) {
      const customerId = isOpenSea ? customerModel?.originCompanyId : customerModel?.id;
      if (customerId) {
        // setUniCustomerParam({
        //   visible: true,
        //   customerId: Number(customerId),
        //   source: source ?? 'mailListCustomer',
        //   onSuccess: () => {},
        // });
        showUniDrawer({
          moduleId: UniDrawerModuleId.CustomerView,
          moduleProps: {
            customerId: Number(customerId),
            visible: true,
            onClose: () => {},
          },
        });
      }
    }
    if (isClue) {
      const customerId = isOpenSea ? customerModel?.originCompanyId : customerModel?.id;
      if (customerId) {
        // setUniClueViewParam({
        //   visible: true,
        //   isOpenSea,
        //   leadsId: Number(customerId),
        //   source: 'mailListCustomer',
        //   onClose: shouleUpdate => {
        //     // shouleUpdate为true有修改
        //   },
        // });
        showUniDrawer({
          moduleId: UniDrawerModuleId.LeadsView,
          moduleProps: {
            leadsId: Number(customerId),
            visible: true,
            isOpenSea,
            onClose: shouleUpdate => {
              // shouleUpdate为true有修改
            },
            source: 'mailListCustomer',
          },
        });
      }
    }
    // 如果展示了关闭按钮，则自动关闭
    showClose && handleClose();
  };
  /**
   * 渲染选择item
   * @param item
   */
  const renderSelectItem = (item: SelectListProps) => {
    return (
      <div
        key={item.id}
        className={classnames(style.customerSelectItem, customerId === item.id && style.selected)}
        onClick={() => {
          setSelectedId(item.id);
        }}
      >
        <div className={style.itemTxt}>{item.name}</div>
        <div className={style.selectedIcon}></div>
      </div>
    );
  };
  /**
   * 渲染选择select
   */
  const renderSelect = () => {
    return <div className={style.customerSelectList}>{contactList.map(item => renderSelectItem(item))}</div>;
  };
  // 网址
  const website = customerModel?.website || customerModel?.domain;
  // 标签列表
  const labelList = transICustomerLabelModel2LabelModel(customerModel?.labelList);
  return (
    <div className={style.edmContainer}>
      <div className={style.operateWrap}>
        {contactList.length > 1 && (
          <Popover
            placement="bottomRight"
            content={renderSelect}
            trigger="click"
            getPopupContainer={e => (e.parentElement ? e.parentElement : e)}
            overlayClassName={style.customerSelectListWrap}
          >
            <div className={style.switchIcon} />
          </Popover>
        )}
        {showClose && <div className={style.closeIcon} onClick={handleClose} />}
      </div>
      <div className={style.cardContainer}>
        <div className={style.header}>
          <div className={style.headerField}>
            <div className={style.headerNameWrap}>
              <label className={style.headerName}>{name}</label>
              {/* 客户标签替换 */}
              {role && <CustomerLabelByRole role={role} style={{ marginLeft: 8, marginRight: 50, transform: 'scale(1.2)', transformOrigin: 'left' }} />}
            </div>
            {/* <div className={classnames(style.flexCenter, style.headerDesc)}>
              {customerModel?.orgName && (
                <div className={style.labelWrap}>
                  <span className={classnames(style.companyIcon, style.labelIcon)} />
                  <label className={style.headerLabel}>{customerModel?.orgName}</label>
                </div>
              )}
              {website && (
                <div className={style.labelWrap}>
                  <span className={classnames(style.mgL, style.labelIcon)}></span>
                  <label className={style.headerLabel}>{website}</label>
                </div>
              )}
            </div> */}
          </div>
        </div>
        <div className={style.detail}>
          <div className={style.detailRow}>
            <label className={style.detailRowLabel}>邮箱：</label>
            <div className={style.flexCenter}>
              <span className={style.detailRowEnt}>{email}</span>
              <a className={classnames(style.headerCopy, style.flexCenter)}>
                <CopyToClipboard
                  onCopy={(_, result) => {
                    message.success({
                      icon: result ? <CheckedCircleIcon /> : <CloseCircleIcon />,
                      content: <span style={{ marginLeft: 8 }}>{result ? getIn18Text('FUZHICHENGGONG') : getIn18Text('FUZHISHIBAI')}</span>,
                    });
                  }}
                  text={email}
                >
                  <CopyIcon />
                </CopyToClipboard>
              </a>
            </div>
          </div>

          {!requiredInfo?.hideRelateMail && (
            <div className={style.detailRow}>
              <label className={style.detailRowLabel}>往来邮件：</label>
              {/* 如果是无权限客户则展示- */}
              {isNoAuth ? (
                <div>-</div>
              ) : (
                <div onClick={handleRelateMail}>
                  <a>查看</a>
                </div>
              )}
            </div>
          )}
          {/*<div className={style.detailRow}>*/}
          {/*  <label className={style.detailRowLabel}>官网：</label>*/}
          {/*  <div>opensource.org</div>*/}
          {/*</div>*/}
          <div className={style.detailRow}>
            <label className={style.detailRowLabel}>公司名称：</label>
            <div style={{ display: 'flex', maxWidth: 344, flexGrow: 1 }}>
              <div style={{ width: 'auto', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{customerModel?.orgName || '-'}</div>
              <div style={{ flexGrow: 1, marginLeft: 8 }}>
                <EllipsisLabels hideAdd={true} labelMaxWidth="initial" className={style.labels} isMailPlus={true} list={labelList} deletable={false} />
              </div>
            </div>
          </div>
          <div className={style.detailRow}>
            <label className={style.detailRowLabel}>国家地区：</label>
            <div>{customerModel?.area || '-'}</div>
          </div>
          <div className={style.detailRow}>
            <label className={style.detailRowLabel}>公司官网：</label>
            <div>{website || '-'}</div>
          </div>
          {isCustomer && (
            <>
              <div className={style.detailRow}>
                <label className={style.detailRowLabel}>客户阶段：</label>
                <div>
                  {customerStageObj && customerModel?.customer_stage && customerStageObj[+customerModel?.customer_stage] ? (
                    <Tag type="label-6-1" hideBorder={true}>
                      {customerStageObj[+customerModel?.customer_stage]}
                    </Tag>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
              <div className={style.detailRow}>
                <label className={style.detailRowLabel}>客户星级：</label>
                <div>
                  {customerModel?.cLevelName ? (
                    <Tag type="label-6-1" hideBorder={true}>
                      {customerModel?.cLevelName}
                    </Tag>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
            </>
          )}
          {isClue && (
            <>
              <div className={style.detailRow}>
                <label className={style.detailRowLabel}>线索状态：</label>
                <div>
                  {statusObj && customerModel?.status && statusObj[+customerModel?.status] ? (
                    <Tag type="label-6-1" hideBorder={true}>
                      {statusObj[+customerModel?.status]}
                    </Tag>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
              <div className={style.detailRow}>
                <label className={style.detailRowLabel}>线索星级：</label>
                <div>
                  {starLevelObj && customerModel?.starLevel && starLevelObj[+customerModel?.starLevel] ? (
                    <Tag type="label-6-1" hideBorder={true}>
                      {starLevelObj[+customerModel?.starLevel]}
                    </Tag>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
            </>
          )}
          <div className={style.detailRow}>
            <label className={style.detailRowLabel}>负责人：</label>
            <div>{customerModel?.managerNames.join(' ') || '-'}</div>
          </div>
        </div>
        <div className={style.bottom}>
          {
            // 如果是无权限的同事客户，则不展示查看客户
            !isNoAuth && (
              <div>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} />} spinning={drawerOpenLoading} delay={500}>
                  <a className={style.bottomLink} onClick={handleOpenCustomerDetail}>
                    {isCustomer ? getIn18Text('CHAKANKEHU') : getIn18Text('CHAKANXIANSUO')}
                  </a>
                </Spin>
              </div>
            )
          }
          <div>
            <SendMailPop
              mailList={[email]}
              onSend={() => {
                handleClose();
              }}
            >
              <a className={style.bottomLink}>{getIn18Text('FAYOUJIAN')}</a>
            </SendMailPop>
          </div>
          {!requiredInfo?.hideAddContact && (
            <div>
              <a className={style.bottomLink} onClick={handleAddContact}>
                {getIn18Text('TIANJIATONGXUNLU')}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
