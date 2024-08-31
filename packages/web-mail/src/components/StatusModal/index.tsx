import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { List, Tooltip, Button } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { api, apis, ContactAndOrgApi, ProductAuthorityFeature, MailConfApi, apiHolder, SystemApi } from 'api';
import { comIsShowByAuth } from '@web-common/utils/utils';
import classnames from 'classnames';
import { MailRefreshIcon, MailModalCloseIcon } from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import type { CustomIconComponentProps } from '@ant-design/icons/lib/components/Icon';
import { MailStatus, MailItemStatus } from '../../util';
import './index.scss';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import { inWindow } from 'api';
import { getIn18Text } from 'api';
import MailReadList from './read-list';
import Icon from '@ant-design/icons/es/components/Icon';
import type { IMailReadListItem, MailApi } from 'api';
import { useContactModel } from '@web-common/hooks/useContactModel';

const RefreshIcon = (props: Partial<CustomIconComponentProps>) => <Icon component={MailRefreshIcon} {...props} />;

const CloseIcon = (props: Partial<CustomIconComponentProps>) => <Icon component={MailModalCloseIcon} {...props} />;

const StatusItem: React.FC<{
  item: MailItemStatus;
  modifiedTime: string;
  isReadStatus: boolean;
  wordSeparator: string;
  isLoadingReadList: boolean;
  allReadList: Array<IMailReadListItem>;
  _account?: string;
}> = props => {
  const { item, isReadStatus, wordSeparator, isLoadingReadList, allReadList, modifiedTime, _account } = props;
  const model = useContactModel({ contactId: item?.contact?.contactId, email: item.email || item?.contact?.accountName, name: item.contactName, _account });
  const contactName = model?.contact?.contactName || item?.contactName;

  const email = item?.contact ? contactApi.doGetModelDisplayEmail(item.contact) : item.email;
  return (
    <>
      <List.Item extra={isReadStatus && <div className="u-item-time">{isReadStatus ? item.text : modifiedTime}</div>}>
        <List.Item.Meta
          avatar={
            <AvatarTag
              style={{ marginRight: '12px', marginLeft: '6px' }}
              size={32}
              contactId={item?.contact?.contact?.id}
              propEmail={item.email || item?.contact?.accountName}
              user={{
                name: item?.contact?.contact?.contactName,
                avatar: item?.contact?.contact?.avatar,
                color: item?.contact?.contact?.color,
              }}
            />
          }
          title={
            <>
              <Tooltip title={contactName} mouseEnterDelay={1} mouseLeaveDelay={0.15}>
                <div className="u-item-name">{contactName}</div>
              </Tooltip>
              {!isReadStatus && (
                <div className={classnames(['u-item-status', item.status == 'suc' || item?.rclResult === 9 ? 'u-suc' : ''])} style={{ color: item.color }}>
                  {item.status == 'suc'
                    ? getIn18Text('CHEHUICHENGGONG') + wordSeparator
                    : item.status == 'fail' || item?.rclResult === 9
                    ? getIn18Text('CHEHUISHIBAI') + wordSeparator
                    : item.text}
                </div>
              )}
            </>
          }
          description={
            <>
              <Tooltip title={email} mouseEnterDelay={1} mouseLeaveDelay={0.15}>
                <div className="u-item-email">{email}</div>
              </Tooltip>
              {!isReadStatus && <div className="u-item-time">{isReadStatus ? item.text : modifiedTime}</div>}
            </>
          }
        />
      </List.Item>
      {isReadStatus && (
        <MailReadList
          isLoadingReadList={isLoadingReadList}
          item={item}
          readList={allReadList && allReadList.length ? allReadList.filter(readItem => readItem.toAddr === email) : []}
        ></MailReadList>
      )}
    </>
  );
};

interface Props {
  visible: boolean;
  onClose(): void;
  refreshData?(): void;
  readListData?: MailStatus;
  onUpgradeModel?(): void;
  onProductModal?(): void;
  tid?: string;
  account?: string;
}
const systemApi: SystemApi = apiHolder.api.getSystemApi();
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const mailConfApi: MailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const StatusModal: React.FC<Props> = ({ visible, readListData, refreshData, onClose, onUpgradeModel, onProductModal, tid, account }) => {
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();
  const timeZone = mailConfApi.getTimezone();
  const [allReadList, setAllReadList] = useState<Array<IMailReadListItem>>([]);
  const [isLoadingReadList, setIsLoadingReadList] = useState<boolean>(false);
  const [isRefresh, setIsRefresh] = useState<boolean>(false);

  const loadReadList = () => {
    if (tid) {
      setIsLoadingReadList(true);
      setIsRefresh(true);
      mailApi.getMailReadList(tid, account).then(res => {
        if (!res.success) {
          setAllReadList([]);
        } else {
          setAllReadList(res.data || []);
        }
        setIsLoadingReadList(false);
        setTimeout(() => {
          setIsRefresh(false);
        }, 1000);
      });
    }
  };

  useEffect(() => {
    loadReadList();
  }, [tid]);

  const [tabIndex, setTabIndex] = useState<number>(0);
  const [tabList, setTabList] = useState<string[]>([]);
  const [listData, setListData] = useState<MailItemStatus[]>();
  const [status, setStatus] = useState<string>();
  const refreshList = () => {
    if (refreshData) {
      setTabIndex(0);
      setStatus('');
      refreshData();
    }
    loadReadList();
  };
  const isReadStatus = readListData?.isrcl ? false : true;
  const wordSeparator = inWindow() && window.systemLang === 'en' ? ' ' : '';
  const UnpermissionEle = () => {
    return (
      <div className="u-status-list-unPermission">
        <div className="icon"></div>

        <div className="content">
          <span>{getIn18Text('SHENGJIFUWUTAO')}</span>
          <span className="u-status-learn" onClick={onProductModal}>
            {getIn18Text('LEJIEFUWUTAO')}
          </span>
        </div>
        {comIsShowByAuth(
          ProductAuthorityFeature.ADMIN_SITE_ENTRANCE_SHOW,
          <Button type="primary" onClick={onUpgradeModel}>
            {getIn18Text('LIJISHENGJI')}
          </Button>
        )}
      </div>
    );
  };

  // 阅读状态列表
  const ListEle = () => {
    return (
      <List
        itemLayout="horizontal"
        header={
          status == 'unkown'
            ? // <div>暂只支持查看企业/组织内收件人的邮件阅读状态，邮件列表、外部邮箱的阅读状态无法自动获取</div>
              null
            : readListData?.isrcl && status !== 'fail'
            ? getIn18Text('CHEHUICHENGGONGHOU')
            : ''
        }
        dataSource={listData}
        locale={{
          emptyText: (
            <>
              <div className="u-status-empty-img" />
              {getIn18Text('MEIYOUNEIRONG')}
            </>
          ),
        }}
        renderItem={item => {
          const modifiedTime = dayjs(systemApi.getDateByTimeZone(item.modifiedTime, timeZone, true)).format('YYYY-MM-DD HH:mm:ss');
          const email = item?.contact ? contactApi.doGetModelDisplayEmail(item.contact) : item.email;

          return (
            <StatusItem
              item={item}
              modifiedTime={modifiedTime}
              isReadStatus={isReadStatus}
              wordSeparator={wordSeparator}
              isLoadingReadList={isLoadingReadList}
              allReadList={allReadList}
              _account={account}
            />
          );
        }}
      />
    );
  };
  const isEnglish = window.systemLang === 'en';
  const UpdateTabEle = () => {
    return (
      <>
        <div className="u-status-list-tips" style={{ height: isEnglish ? 'auto' : '50px' }}>
          <div className="u-status-list-contain">
            {getIn18Text('SHENGJIZUNXIANGBAN')}
            <span className="u-status-learn" onClick={onProductModal}>
              {getIn18Text('LEJIEFUWUTAO')}
            </span>
            {comIsShowByAuth(
              ProductAuthorityFeature.ADMIN_SITE_ENTRANCE_SHOW,
              <Button type="primary" onClick={onUpgradeModel} style={{ width: isEnglish ? 'auto' : '100px' }}>
                {getIn18Text('LIJISHENGJI')}
              </Button>
            )}
          </div>
        </div>
      </>
    );
  };
  const RenderEle = () => {
    if (productVersionId === 'sirius') {
      return ListEle();
    }
    if (status === 'unkown' || status === 'fail' || !status) {
      return ListEle();
    } else {
      if (productVersionId === 'free') {
        return UnpermissionEle();
      } else {
        return ListEle();
      }
    }
  };
  const RenderUpdateTips = () => {
    if (productVersionId === 'sirius') {
      return null;
    }
    // 免费、旗舰版 的 全部和未知 会有提醒
    if (!status || status === 'unkown') {
      return UpdateTabEle();
    }
    return null;
  };
  const ResetListHeight = () => {
    if (productVersionId === 'sirius') {
      return '350px';
    }
    if (status === 'read' || status === 'unread') {
      return '350px';
    }
    return '300px';
  };
  const handleStatusChange = index => {
    setTabIndex(index);
    if (readListData?.isrcl) {
      setStatus(['', 'suc', 'fail'][index]);
    } else {
      setStatus(['', 'read', 'unread', 'unkown'][index]);
    }
  };

  // useEffect(() => {
  //     const _listData = status ? readListData?.data?.filter((item) => {
  //         // 未读列表需要把未知的加上
  //         return status === 'fail' ? (item.status === status || item.status === 'unkown') : item.status === status;
  //     }) : readListData?.data;
  //     setListData(_listData);
  // }, [status]);

  useEffect(() => {
    if (!status) {
      setListData(readListData?.data);
      return;
    }
    const _listData = readListData?.data?.filter(item => {
      // 未读列表需要把未知的加上
      if (status === 'fail') {
        return item.status === status || item.status === 'unkown';
      }
      // 未知的把域外的加上
      if (status === 'unkown') {
        return item.status === status || item.status === 'outdomain';
      }
      return item.status === status;
    });
    setListData(_listData);
  }, [status]);

  useEffect(() => {
    if (productVersionId === 'free') {
      handleStatusChange(3);
    }
  }, [productVersionId]);

  // 只是获取长度...
  useEffect(() => {
    const sucList: MailItemStatus[] = [];
    const failList: MailItemStatus[] = [];
    const readList: MailItemStatus[] = [];
    const unreadList: MailItemStatus[] = [];
    const unkownList: MailItemStatus[] = [];
    if (readListData) {
      setListData(readListData.data);
      if (readListData.data?.length) {
        readListData.data.forEach(item => {
          if (item.status == 'suc') {
            sucList.push(item);
          } else if (item.status == 'fail') {
            failList.push(item);
          } else if (item.status == 'read') {
            readList.push(item);
          } else if (item.status == 'unread') {
            unreadList.push(item);
          } else {
            unkownList.push(item);
          }
        });
      }
      if (readListData.isrcl) {
        setTabList([getIn18Text('QUANBU'), `撤回成功(${sucList.length})`, `撤回失败(${failList.length})`]);
      } else {
        // 未知当做未读处理
        setTabList([
          getIn18Text('QUANBU'),
          `${getIn18Text('YIDU')}(${readList.length})`,
          `${getIn18Text('WEIDU')}(${unreadList.length})`,
          `${getIn18Text('WEIZHI')}(${unkownList.length})`,
        ]);
        // setTabList(['全部', `已读(${readList.length})`, `未读(${unreadList.length + unkownList.length})`]);
      }
    }
  }, [readListData]);

  return (
    <>
      <Modal
        footer={null}
        visible={visible}
        width={700}
        wrapClassName="status-modal-wrap"
        closeIcon={
          <div className="u-status-icon dark-svg-invert">
            <span className="icons" style={{ cursor: 'pointer' }} onClick={() => refreshList()}>
              <RefreshIcon spin={isRefresh} />
            </span>
            <span
              className="icons"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                onClose();
                setTabIndex(0);
              }}
            >
              <CloseIcon />
            </span>
          </div>
        }
        isGlobal={!systemApi.isMainPage()}
        getContainer={document.body}
      >
        <div
          className="u-status"
          // style={{ paddingTop: (readListData?.isrcl || productVersionId === 'sirius') ? '73px' : '109px'}}
          style={{ paddingTop: '73px' }}
        >
          <div className="u-status-header">
            <div className="u-status-title">{readListData?.isrcl ? getIn18Text('CHEHUIJIEGUO') : getIn18Text('YUEDUZHUANGTAI')}</div>
            {/* {!readListData?.isrcl && productVersionId !== 'sirius' && <div className="u-status-info"><span className="u-status-tips">企业外收件人阅读状态追踪功能，限时体验</span></div>} */}
            <div className="u-status-tab">
              {tabList.map((item, index) => (
                <span className={classnames(['u-status-text', index == tabIndex ? 'on' : ''])} onClick={e => handleStatusChange(index)} key={index}>
                  {item}
                </span>
              ))}
            </div>
          </div>
          {RenderUpdateTips()}
          <div className="u-status-list" style={{ height: ResetListHeight() }}>
            {RenderEle()}
          </div>
        </div>
      </Modal>
    </>
  );
};
export default StatusModal;
