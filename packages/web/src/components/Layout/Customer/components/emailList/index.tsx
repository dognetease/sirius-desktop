import React, { useState, useEffect } from 'react';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import classnames from 'classnames';
import { Space, Select, DatePicker, TablePaginationConfig, Table, Button, message, Modal, Tag, Spin, Tooltip } from 'antd';
import RightOutlined from '@ant-design/icons/RightOutlined';
import {
  CustomerEmailListReq,
  CustomerEmailEmailList,
  CustomerEmailTagItem,
  CustomerEmailsContact,
  CustomerAuthDataType,
  apiHolder,
  apis,
  CustomerDiscoveryApi,
  CustomerEmailItemHideState,
  CustomerEmailItem,
  SystemApi,
  MailApi,
  CustomerEmailAuthManager,
} from 'api';
import { Moment } from 'moment';
import ReadListIcons from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import IconCard, { IconMapKey } from '@web-common/components/UI/IconCard';
import { ReactComponent as ReciveIcon } from '@/images/icons/regularcustomer/mail-recive.svg';
import { ReactComponent as SendIcon } from '@/images/icons/regularcustomer/mail-send.svg';
import { regularCustomerTracker } from '../../CustomerDiscovery/report';
import style from './style.module.scss';
import { getIn18Text } from 'api';

const { RangePicker } = DatePicker;
interface Props {
  condition: CustomerAuthDataType;
  height?: number;
  mainResourceId: string;
  title?: string;
  relationName?: string;
  relationDomain?: string;
  showTotal?: boolean;
  closeModal?: () => void;
}
interface SelectOption {
  key: string;
  value: string;
  children: string;
  disabled: boolean;
  group: string;
}
enum FidType {
  Received = 1,
  Draft = 2,
  Sent = 3,
}
interface ManagerInfo {
  list: Array<CustomerEmailAuthManager>;
  loading: boolean;
}
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
const systemApi: SystemApi = apiHolder.api.getSystemApi();
const isElectron = systemApi.isElectron();
export const EmailList: React.FC<Props> = props => {
  const { condition, height = 500, mainResourceId, title, relationName = '', relationDomain = '', showTotal = true, closeModal } = props;
  const [searchParams, setSearchParams] = useState<CustomerEmailListReq>({
    condition,
    main_resource_id: mainResourceId,
    page: 1,
    page_size: 20,
  } as CustomerEmailListReq);
  const [loading, setLoading] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    pageSize: 20,
    current: 1,
    total: 0,
    // hideOnSinglePage: true
  });
  const [contactEmails, setContactEmails] = useState<CustomerEmailEmailList>({} as CustomerEmailEmailList);
  const [tagList, setTagList] = useState<Array<CustomerEmailTagItem>>([]);
  const [emailsContacts, setEmailsContacts] = useState<CustomerEmailsContact>({
    from_email_list: [],
    to_email_list: [],
  } as CustomerEmailsContact);
  const [managerInfo, setManager] = useState<ManagerInfo>({ list: [], loading: false });
  async function fetchData() {
    try {
      if (!mainResourceId) {
        return;
      }
      setLoading(true);
      const res = await customerDiscoveryApi.getCustomerEmailList({
        ...searchParams,
        data_source: 'UNI_TABLE',
        main_resource_id: mainResourceId,
      });
      setPagination({ ...pagination, total: res.total_size || 0 });
      setContactEmails(res);
    } finally {
      setLoading(false);
    }
  }
  async function fetchTags() {
    if (!mainResourceId) {
      return;
    }
    const res = await customerDiscoveryApi.getCustomerEmailTags(condition, mainResourceId, 'UNI_TABLE');
    setTagList(res);
  }
  async function getEmailContacts() {
    if (!mainResourceId) {
      return;
    }
    const res = await customerDiscoveryApi.getCustomerEmailContacts(condition, mainResourceId, 'UNI_TABLE');
    setEmailsContacts(res);
  }
  const fetchManagerList = async () => {
    if (managerInfo?.list?.length) {
      return;
    }
    try {
      setManager({ list: [], loading: true });
      const managers = await customerDiscoveryApi.getAuthManagerList();
      setManager({ list: managers, loading: false });
    } catch {
      setManager({ ...managerInfo, loading: false });
    }
  };
  const dateChange = (date: Moment[]) => {
    const [start, end] = date || [];
    setPagination({ ...pagination, current: 1 });
    setSearchParams({
      ...searchParams,
      start_date: start?.format('YYYY-MM-DD'),
      end_date: end?.format('YYYY-MM-DD'),
      page: 1,
    });
  };
  const emailTypeChange = (v: string) => {
    setPagination({ ...pagination, current: 1 });
    setSearchParams({
      ...searchParams,
      type: v,
      page: 1,
    });
  };
  const contactChange = (items: SelectOption[]) => {
    const from: string[] = [];
    const to: string[] = [];
    items.forEach(concat => {
      if (concat.group === 'from') {
        from.push(concat.value);
        return;
      }
      if (concat.group === 'to') {
        to.push(concat.value);
      }
    });
    setPagination({ ...pagination, current: 1 });
    setSearchParams({
      ...searchParams,
      from: from.join(','),
      to: to.join(','),
      page: 1,
    });
  };
  const emailTagChange = (items: SelectOption[]) => {
    const labels = items.map(tag => tag.value);
    setPagination({ ...pagination, current: 1 });
    setSearchParams({
      ...searchParams,
      labels,
      page: 1,
    });
  };
  const pageChange = (current: number, pageSize = 20) => {
    setPagination({ ...pagination, current, pageSize });
    setSearchParams({
      ...searchParams,
      page: current,
      page_size: pageSize,
    });
  };
  const renderEmailRelation = (useGrantInfo = false) => {
    let fromList;
    let toList;
    let totalSize;
    if (useGrantInfo) {
      fromList = contactEmails?.grantRecord?.fromNicknameSet ?? [];
      toList = contactEmails?.grantRecord?.toNicknameSet ?? [];
      totalSize = contactEmails?.grantRecord?.totalEmailNum ?? 0;
    } else {
      fromList = contactEmails?.need_permission_publisher ?? [];
      toList = contactEmails?.need_permission_receiver ?? [];
      totalSize = contactEmails?.hide_size ?? 0;
    }
    return (
      <div className={style.authInfo}>
        <span>{getIn18Text('BAOHAN')}</span>
        {
          // eslint-disable-next-line
          (fromList || []).map((name, index) => {
            const nickName = String(name).trim();
            if (index !== 0) {
              return <span className={style.nickName}>,{nickName}</span>;
            }
            return <span className={style.nickName}>{nickName}</span>;
          })
        }
        <span>{getIn18Text('YU')}</span>
        {
          // eslint-disable-next-line
          (toList || []).map((name, index) => {
            const nickName = String(name).trim();
            if (index !== 0) {
              return <span className={style.nickName}>,{nickName}</span>;
            }
            return <span className={style.nickName}>{nickName}</span>;
          })
        }
        <span>{getIn18Text('DE')}</span>
        <span className={style.num}>{totalSize ?? '--'}</span>
        <span>{getIn18Text('FENGWANGLAIYOUJIANNEIRONG')}</span>
      </div>
    );
  };
  /**
   * 预览邮件
   * @param snapshot_id
   */
  const readEmailDetail = async (snapshotId: string) => {
    const previewLink = await customerDiscoveryApi.getCustomerEmailPreviewUrl(condition, snapshotId, mainResourceId as string);
    if (previewLink) {
      if (isElectron) {
        systemApi.createWindowWithInitData('iframePreview', {
          eventName: 'initPage',
          eventData: {
            iframeSrc: previewLink,
          },
        });
      } else {
        window.open(previewLink);
      }
    }
  };
  /**
   * 申请查看权限
   */
  let lock = false;
  const createAuthorization = async () => {
    if (lock) {
      return;
    }
    lock = true;
    Modal.confirm({
      centered: true,
      content: renderEmailRelation(),
      onOk: async () => {
        try {
          await customerDiscoveryApi.createAuth({
            relationDomain: relationDomain as string,
            relationName: relationName as string,
            relationId: mainResourceId as string,
            relationType: condition,
            resources: contactEmails.need_permission,
          });
          message.success(getIn18Text('SHENQINGCHENGGONG'));
          regularCustomerTracker.trackMailAuthApply(condition);
          fetchData();
        } finally {
          lock = false;
        }
      },
      onCancel: () => {
        lock = false;
      },
    });
  };
  const replyEmail = (e: React.MouseEvent, email: CustomerEmailItem, isAll: boolean) => {
    e.stopPropagation();
    mailApi.doReplayMail(email.mail_id, isAll).then(() => closeModal && closeModal());
  };
  const transEmail = (e: React.MouseEvent, email: CustomerEmailItem) => {
    e.stopPropagation();
    mailApi.doForwardMail(email.mail_id).then(() => closeModal && closeModal());
  };
  /** 显示授权详情 */
  const showAuthInfo = () => {
    setAuthModalVisible(true);
  };
  useEffect(() => {
    fetchData();
  }, [searchParams, mainResourceId]);
  useEffect(() => {
    fetchTags();
    getEmailContacts();
  }, [mainResourceId]);
  const columns = [
    {
      render(_: string, email: CustomerEmailItem) {
        // eslint-disable-next-line
        const parsedNames = (mailApi as any).contactHandler.parseContactStr([email.from, email.to]).parsed;
        const fromName = parsedNames[0]?.name ?? getIn18Text('WEIZHI');
        const toName = parsedNames[1]?.name ?? getIn18Text('WEIZHI');
        if (email.hideState === CustomerEmailItemHideState.NoNeedAuth) {
          return (
            <div className={style.listItem} onClick={() => readEmailDetail(email.snapshot_id)}>
              <div className={style.icon}>{email.fid === FidType.Sent ? <SendIcon /> : <ReciveIcon />}</div>
              <div className={style.content}>
                <div className={style.emailSender}>
                  {fromName}
                  {getIn18Text('XIANG')}
                  {toName}
                  {getIn18Text('FASONG')}
                </div>
                <div className={style.emailTitle}>{email.subject || '--'}</div>
                <div className={style.emailContent}>{email.summary || '--'}</div>
                {email?.attachments?.length > 0 ? (
                  <Space wrap className={style.emailAttachment}>
                    {email.attachments.map(attachment => (
                      <span className={style.emailAttachFile}>
                        <IconCard type={attachment.file_type as IconMapKey} width={16} height={16} />
                        <span className={style.emailFileName}>{attachment.file_name}</span>
                      </span>
                    ))}
                  </Space>
                ) : (
                  ''
                )}
              </div>
              <div className={style.date}>
                {email.sent_date}
                <div>
                  {email.isSelf === false ? (
                    <Tag className={style.emailTag}>{getIn18Text('TONGSHIDEYOUJIAN')}</Tag>
                  ) : (
                    <div className={style.operate}>
                      <Tooltip placement="bottom" title={getIn18Text('HUIFU')} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
                        <div className="u-tool-btn" onClick={e => replyEmail(e, email, false)}>
                          <ReadListIcons.ReplySvg />
                        </div>
                      </Tooltip>
                      <Tooltip placement="bottom" title={getIn18Text('HUIFUQUANBU')} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
                        <div className="u-tool-btn" onClick={e => replyEmail(e, email, true)}>
                          <ReadListIcons.ReplyAllSvg />
                        </div>
                      </Tooltip>
                      <Tooltip placement="bottom" title={getIn18Text('ZHUANFA')} mouseEnterDelay={0.3} mouseLeaveDelay={0.15}>
                        <div className="u-tool-btn" onClick={e => transEmail(e, email)}>
                          <ReadListIcons.TransmitSvg />
                        </div>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className={classnames([style.listItem])}>
            <div className={style.icon} style={{ paddingTop: 10 }}>
              {email.fid === FidType.Sent ? <SendIcon /> : <ReciveIcon />}
            </div>
            <div className={style.content}>
              <div className={style.emailSender}>
                {fromName}
                {getIn18Text('XIANG')}
                {toName}
                {getIn18Text('FASONG')}
              </div>
              <div className={style.emailTitle}>
                {getIn18Text('ZANWUQUANXIANCHAKAN')}
                {email.hideState === CustomerEmailItemHideState.NeedAuth ? (
                  <span className={style.linkBtn} onClick={createAuthorization}>
                    {getIn18Text('SHENQINGCHAKAN')}
                    <RightOutlined />
                  </span>
                ) : (
                  <span className={style.linkBtn} onClick={showAuthInfo}>
                    {getIn18Text('SHENQINGZHONG')}
                    <RightOutlined />
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
  ];
  return (
    <div style={{ height: `${height}px` }} className={style.wrapper}>
      {title ? <div className={style.title}>{title}</div> : ''}
      <div className={style.search}>
        <Space>
          <Select style={{ width: 120 }} placeholder={getIn18Text('ANSHOUFALEIXING')} allowClear onChange={v => emailTypeChange(v as string)}>
            <Select.Option value="receive">{getIn18Text('SHOUJIAN')}</Select.Option>
            <Select.Option value="send">{getIn18Text('FAJIAN')}</Select.Option>
          </Select>
          <Select
            style={{ width: 180 }}
            placeholder={getIn18Text('ANSHOUFARENYUAN')}
            mode="multiple"
            maxTagCount="responsive"
            allowClear
            onChange={(v, items) => contactChange(items as SelectOption[])}
          >
            <Select.OptGroup label={getIn18Text('SHOUJIANREN')}>
              {(emailsContacts.to_email_list || []).map((contact, index) => (
                <Select.Option value={contact.email} key={`${contact.email}_${index + 1}_to`} group="to">
                  {contact.name}
                </Select.Option>
              ))}
            </Select.OptGroup>
            <Select.OptGroup label={getIn18Text('FAJIANREN')}>
              {(emailsContacts.from_email_list || []).map((contact, index) => (
                <Select.Option value={contact.email} key={`${contact.email}_${index + 1}_from`} group="from">
                  {contact.name}
                </Select.Option>
              ))}
            </Select.OptGroup>
          </Select>
          <Select
            style={{ width: 180 }}
            placeholder={getIn18Text('ANYOUJIANBIAOQIAN')}
            allowClear
            mode="multiple"
            maxTagCount="responsive"
            onChange={(v, items) => emailTagChange(items as SelectOption[])}
          >
            {tagList.map(tag => (
              <Select.Option value={tag.name} key={tag.labelId}>
                {tag.name}
              </Select.Option>
            ))}
          </Select>
          <RangePicker
            separator=" - "
            placeholder={[getIn18Text('KAISHISHIJIAN'), getIn18Text('JIESHUSHIJIAN')]}
            locale={cnlocale}
            format="YYYY/MM/DD"
            onChange={date => dateChange(date as Moment[])}
          />
          {showTotal && <div className={style.total}>共{contactEmails.total_size || 0}条</div>}
        </Space>
      </div>
      <Table
        loading={loading}
        dataSource={contactEmails.content}
        columns={columns}
        scroll={{ y: title ? height - 140 : height - 100 }}
        pagination={
          (pagination?.total as number) > 20
            ? {
                ...pagination,
                onChange: pageChange,
                size: 'small',
                className: 'pagination-wrap',
              }
            : false
        }
      />

      <Modal
        title={getIn18Text('SHOUQUANSHENQING')}
        visible={authModalVisible}
        centered
        onCancel={() => setAuthModalVisible(false)}
        footer={
          <Button type="primary" onClick={() => setAuthModalVisible(false)}>
            {getIn18Text('QUEDING')}
          </Button>
        }
      >
        {renderEmailRelation(true)}
        <div>
          {getIn18Text('YIXIANG')}
          <span className={style.linkBtn} onClick={fetchManagerList}>
            {getIn18Text('GUANLIYUAN')}
          </span>
          {getIn18Text('FAQISHENQING\uFF0CSHENPITONGGUOHOUKECHAKAN')}
        </div>
        <div className={style.managerList}>
          {managerInfo.loading ? (
            <Spin />
          ) : (
            <>
              {managerInfo.list.length > 0 ? <span>{getIn18Text('GUANLIYUAN\uFF1A')}</span> : ''}
              {(managerInfo.list || []).map((manager, index) => {
                const nickName = String(manager.accNickname).trim();
                if (index !== 0) {
                  return <span className={style.nickName}>,{nickName}</span>;
                }
                return <span className={style.nickName}>{nickName}</span>;
              })}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
