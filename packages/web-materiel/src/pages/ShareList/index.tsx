import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import debounce from 'lodash/debounce';
import moment from 'moment';
import { TongyongSousuo } from '@sirius/icons';
import { apiHolder, apis, MaterielApi, MaterielShareListReq, MaterielShare, MaterielShareAccount, DataTrackerApi } from 'api';
import { ColumnsType } from 'antd/lib/table';
import { Divider } from 'antd';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import { EnhanceSelect as Select, InMultiOption as Option } from '@web-common/components/UI/Select';
import { EnhanceSelect as Select, InSingleOption as Option } from '@lingxi-common-component/sirius-ui/Select';
// import DatePicker from '@web-common/components/UI/DatePicker';
import DatePicker from '@lingxi-common-component/sirius-ui/DatePicker';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import { navigate } from '@reach/router';
import { timestampFormatter } from '@web-materiel/utils';
import { useResponsiveTable } from '@/hooks/useResponsiveTable';
import { formatFileSize } from '@web-common/utils/file';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { ShareWaModal } from '@web-materiel/components/ShareWaModal';
import { enhanceLink } from '@web-materiel/utils';
import { FileCard } from '@web-materiel/components/FileCard';
import style from './index.module.scss';
import SendDetail from '../components/sendDetail';
import { ChatHistoryDrawer } from '@web/components/Layout/WhatsAppChat/components/chatHistoryDrawer';
import { UniDrawerModuleId } from '@lxunit/app-l2c-crm';
import { ShareWhatsappUserResponse } from 'api';
import { showUniDrawer } from '@/components/Layout/CustomsData/components/uniDrawer';

const materielApi = apiHolder.api.requireLogicalApi(apis.materielApiImpl) as unknown as MaterielApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const { RangePicker } = DatePicker;

interface ShareListProps {}

export const ShareList: React.FC<ShareListProps> = props => {
  const { layout, growRef, scrollY } = useResponsiveTable();
  const [params, setParams] = useState<MaterielShareListReq>({
    page: 1,
    pageSize: 20,
    query: '',
    accIds: [],
  });
  const [data, setData] = useState<MaterielShare[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [fetching, setFetching] = useState(false);
  const [accounts, setAccounts] = useState<MaterielShareAccount[]>([]);
  const lastFetchTime = useRef<number>(0);
  const [share, setShare] = useState<MaterielShare | null>(null);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [shareWaVisible, setShareWaVisible] = useState<boolean>(false);
  const [sendDetailVisible, setSendDetailVisible] = useState<boolean>(false);
  const [chatHistoryVisible, setChatHistoryVisible] = useState<boolean>(false);
  const [msgData, setMsgData] = useState({ chatId: '', userId: '', messageId: '' });
  const previewSrc = share ? enhanceLink(share.shareLink, { preview: 1 }) : undefined;

  const handleFetch = (params: MaterielShareListReq) => {
    const fetchTime = (lastFetchTime.current = Date.now());
    setFetching(true);
    materielApi
      .getShareList(params)
      .then(res => {
        if (fetchTime !== lastFetchTime.current) return;
        setData(res.content || []);
        setTotal(res.totalSize);
      })
      .finally(() => {
        if (fetchTime !== lastFetchTime.current) return;
        setFetching(false);
      });
    trackApi.track('personal_WA_shared_files', {
      type: 'search',
      opera_way: 'shared_files',
    });
  };

  const handleFetchDebounced = useRef(
    debounce((value: MaterielShareListReq) => {
      handleFetch(value);
    }, 300)
  ).current;

  const handleRangeChange = (values: any) => {
    const nextParams: MaterielShareListReq = {
      ...params,
      startTime: undefined,
      endTime: undefined,
      page: 1,
    };
    if (values && values[0] && values[1]) {
      nextParams.startTime = values[0].startOf('day').valueOf();
      nextParams.endTime = values[1].endOf('day').valueOf();
    }
    setParams(nextParams);
    handleFetch(nextParams);
    trackApi.track('personal_WA_shared_files', {
      type: 'date',
      opera_way: 'shared_files',
    });
  };

  useEffect(() => {
    handleFetch(params);
  }, []);

  useEffect(() => {
    materielApi.getShareAccounts().then(accounts => {
      setAccounts(accounts || []);
    });
  }, []);

  const handleSendDetailClick = (share: MaterielShare) => {
    setShare(share);
    setSendDetailVisible(true);
  };

  const handleSendItemClick = (info: ShareWhatsappUserResponse) => {
    if (!info.bizId) {
      setMsgData({
        chatId: info.chatId || '',
        userId: info.userId || '',
        messageId: info.messageId || '',
      });
    } else {
      setChatHistoryVisible(false);
      showUniDrawer({
        moduleId: UniDrawerModuleId.CustomerView,
        moduleProps: {
          visible: true,
          customerId: info?.bizId || 0,
          onClose: () => {},
        },
      });
    }
  };

  const handlePreviewClick = (share: MaterielShare) => {
    setShare(share);
    setPreviewVisible(true);
  };

  const handleShareWaClick = (share: MaterielShare) => {
    setShare(share);
    setShareWaVisible(true);
  };

  useEffect(() => {
    const { chatId, userId, messageId } = msgData;
    if (chatId && userId && messageId) {
      setChatHistoryVisible(true);
    }
  }, [msgData]);

  const columns: ColumnsType<MaterielShare> = [
    {
      title: '分享标题',
      fixed: 'left',
      width: 200,
      ellipsis: true,
      dataIndex: 'title',
      className: style.maxWidthCell,
    },
    {
      title: '文件名',
      width: 200,
      ellipsis: true,
      dataIndex: 'fileName',
      className: style.maxWidthCell,
      render: (_, item: MaterielShare) => <FileCard className={style.fileCard} fileName={item.fileName} iconSize={28} />,
    },
    {
      title: '创建人',
      width: 100,
      ellipsis: true,
      dataIndex: 'createBy',
    },
    {
      title: '创建时间',
      width: 200,
      dataIndex: 'createAt',
      render: (timestamp: number) => timestampFormatter(timestamp),
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      render: (size: number) => formatFileSize(size, 1024),
    },
    {
      title: 'WA分享次数/浏览数/访客数/下载数',
      width: 280,
      dataIndex: 'count',
      render: (_, item: MaterielShare) => <div className={style.statCount}>{[item.shareCount, item.viewCount, item.userCount, item.downloadCount].join(' / ')}</div>,
    },
    {
      title: '操作',
      fixed: 'right',
      dataIndex: 'options',
      render: (_, item: MaterielShare) => {
        const fileDeleted = !item.fileName;
        const commonAction = (
          <>
            <Divider type="vertical" />
            <a onClick={() => handlePreviewClick(item)}>预览</a>
            <PrivilegeCheck accessLabel="SHARE_RECORD" resourceLabel="WHATSAPP_PERSONAL_MANAGE">
              <Divider type="vertical" />
              <a onClick={() => handleShareWaClick(item)}>WA分享</a>
            </PrivilegeCheck>
          </>
        );

        return (
          <>
            {item.shareState === 'SHARED' ? (
              <>
                <a onClick={() => handleSendDetailClick(item)}>发送详情</a>
                {commonAction}
              </>
            ) : (
              <>
                <PrivilegeCheck accessLabel="SHARE_RECORD" resourceLabel="WHATSAPP_PERSONAL_MANAGE">
                  <a onClick={() => navigate(`#wa?page=materielShareEdit&shareId=${item.shareId}`)}>{fileDeleted ? '重新编辑' : '编辑分享'}</a>
                </PrivilegeCheck>
                {!fileDeleted && commonAction}
              </>
            )}
          </>
        );
      },
    },
  ];

  return (
    <div className={classnames(style.shareList, layout.container)}>
      <div className={classnames(style.title, layout.static)}>分享记录</div>
      <div className={classnames(style.filter, layout.static)}>
        <Input
          className={style.input}
          placeholder="请输入分享标题/文件名"
          value={params.query}
          allowClear
          prefix={<TongyongSousuo wrapClassName={classnames('wmzz', style.searchIcon)} />}
          onChange={event => {
            const nextParams: MaterielShareListReq = { ...params, query: event.target.value, page: 1 };
            setParams(nextParams);
            handleFetchDebounced(nextParams);
          }}
        />
        <Select
          className={style.select}
          placeholder="请选择员工"
          value={params.accIds}
          mode="multiple"
          maxTagCount="responsive"
          allowClear
          onChange={accIds => {
            const nextParams: MaterielShareListReq = { ...params, accIds, page: 1 };
            setParams(nextParams);
            handleFetchDebounced(nextParams);
            trackApi.track('personal_WA_shared_files', {
              type: 'accounts',
              opera_way: 'shared_files',
            });
          }}
        >
          {accounts.map(item => (
            <Option value={item.accId}>{item.nickName}</Option>
          ))}
        </Select>
        <RangePicker
          className={style.rangePicker}
          placeholder={['开始时间', '结束时间']}
          value={params.startTime && params.endTime ? [moment(params.startTime), moment(params.endTime)] : undefined}
          allowClear
          separator="~"
          onChange={handleRangeChange}
        />
        <PrivilegeCheck accessLabel="SHARE_RECORD" resourceLabel="WHATSAPP_PERSONAL_MANAGE">
          <Button
            className={style.create}
            btnType="primary"
            onClick={() => {
              navigate('#wa?page=materielShareEdit');
              trackApi.track('personal_WA_shared_files', {
                type: 'add',
                opera_way: 'shared_files',
              });
            }}
          >
            新建
          </Button>
        </PrivilegeCheck>
      </div>
      <div className={classnames(style.tableWrapper, layout.grow)} ref={growRef}>
        <Table
          className={style.table}
          rowKey="shareId"
          loading={fetching}
          columns={columns as any}
          dataSource={data}
          scroll={{ x: 'max-content', y: scrollY }}
          pagination={{
            total,
            current: params.page,
            pageSize: params.pageSize,
            showTotal: (total: number) => `共 ${total} 条数据`,
            showQuickJumper: true,
            showSizeChanger: true,
            pageSizeOptions: ['20', '50', '100'],
          }}
          onChange={(pagination: any) => {
            const nextParams: MaterielShareListReq = {
              ...params,
              pageSize: pagination.pageSize as number,
              page: pagination.pageSize === params.pageSize ? (pagination.current as number) : 1,
            };
            setParams(nextParams);
            handleFetch(nextParams);
          }}
        />
      </div>
      {sendDetailVisible && (
        <SendDetail
          destroyOnClose
          shareId={share?.shareId || ''}
          showModal={sendDetailVisible}
          onItem={handleSendItemClick}
          handleClose={() => {
            setSendDetailVisible(false);
            setChatHistoryVisible(false);
          }}
        />
      )}
      {chatHistoryVisible && (
        <ChatHistoryDrawer
          title="发送详情"
          mask={false}
          chatId={msgData.chatId}
          userId={msgData.userId}
          messageId={msgData.messageId}
          deleted={false}
          visible={chatHistoryVisible}
          goBack={() => setChatHistoryVisible(false)}
          onClose={() => {
            setSendDetailVisible(false);
            setChatHistoryVisible(false);
          }}
        />
      )}
      <Modal
        className={style.previewModal}
        title="分享预览"
        width={700}
        visible={!!share && previewVisible}
        footer={null}
        onCancel={() => {
          setShare(null);
          setPreviewVisible(false);
        }}
      >
        <iframe className={style.previewIframe} src={previewSrc} />
      </Modal>
      <ShareWaModal
        share={share}
        visible={shareWaVisible}
        onCancel={() => {
          setShare(null);
          setShareWaVisible(false);
        }}
        onFinish={(channelId, chatId) => {
          setShare(null);
          setShareWaVisible(false);
          Modal.success({
            title: '发送成功',
            content: '跳转至 WhatsApp 会话列表？',
            onOk: () => {
              navigate(`#wa?page=waChatList&transportId=${channelId}&defaultChatId=${chatId}`);
            },
          });
        }}
      />
    </div>
  );
};
