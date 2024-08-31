import { getIn18Text } from 'api';
import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import classnames from 'classnames';
import moment from 'moment';
import {
  apiHolder,
  apis,
  SnsMarketingApi,
  SnsMarketingPost,
  SnsMarketingMedia,
  SnsMarketingMediaType,
  SnsPostStatus,
  getSnsPostStatusName,
  SnsPostPageListReq,
  DataTrackerApi,
} from 'api';
import _ from 'lodash';
import qs from 'querystring';
import { navigate, useLocation } from '@reach/router';
import { useOpenHelpCenter } from '@web-common/utils/utils';
import { Button, Checkbox } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import Avatar from '../components/Avatar';
import AccountsSelect from '../components/AccountsSelect';
import MediaList from '../components/MediaList';
import PostEditModal from '../components/PostEditModal';
import PostDetailDrawer from '../components/PostDetailDrawer';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import { EnhanceSelect as Select, InSingleOption as Option } from '@web-common/components/UI/Select';
import { EnhanceSelect as Select, InSingleOption as Option } from '@lingxi-common-component/sirius-ui/Select';
import OptionSeparator from '@web-common/components/UI/OptionSeparator';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { ReactComponent as RefreshIcon } from '@web-sns-marketing/images/refresh.svg';
import { PostStatusTag } from '../components/PostStatusTag';
import { camelToPascal } from '../utils';
import { useResponsiveTable } from '@/hooks/useResponsiveTable';
import style from './index.module.scss';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { HocOrderState } from '../components/orderStateTip';

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const SnsPostStatusName = getSnsPostStatusName();
const StatusOptions = [
  { value: SnsPostStatus.WAITING, label: SnsPostStatusName[SnsPostStatus.WAITING] },
  { value: SnsPostStatus.EXPIRES, label: SnsPostStatusName[SnsPostStatus.EXPIRES] },
  { value: SnsPostStatus.PAUSE, label: SnsPostStatusName[SnsPostStatus.PAUSE] },
  { value: SnsPostStatus.SUCCEED, label: SnsPostStatusName[SnsPostStatus.SUCCEED] },
  { value: SnsPostStatus.FAILED, label: SnsPostStatusName[SnsPostStatus.FAILED] },
];

const trackAction = (action: string, extraAttr?: Record<string, any>) => {
  trackerApi.track('waimao_SoMediaOperation__postlist_action', {
    type: action,
    ...extraAttr,
  });
};

interface PostManageProps {}

const PostManage: React.FC<PostManageProps> = props => {
  const location = useLocation();
  const { layout, growRef, scrollY } = useResponsiveTable();
  const [fetching, setFetching] = useState(false);
  const [data, setData] = useState<SnsMarketingPost[]>([]);
  const [total, setTotal] = useState<number>(0);
  const openHelpCenter = useOpenHelpCenter();

  const [params, setParams] = useState<SnsPostPageListReq>({
    accounts: [],
    page: 1,
    size: 20,
    order: 'DESC',
    sortBy: 'createTime',
    postContent: '',
    postStatus: undefined,
    onlyShowUnreadComment: false,
  });
  const [postEditModalVisible, setPostEditModalVisible] = useState<boolean>(false);
  const [editingPostDbId, setEditingPostDbId] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [detailPost, setDetailPost] = useState<SnsMarketingPost | null>(null);
  const detailPostIndex = useMemo(() => {
    if (!detailPost) return -1;

    return data.findIndex(item => item.postDbId === detailPost.postDbId);
  }, [detailPost, data]);

  const handleRefresh = () => {
    setParams({ ...params });
    trackAction('refresh');
  };

  const hasOpPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'SOCIAL_MEDIA', 'OP'));
  const hasDelPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'SOCIAL_MEDIA', 'DELETE'));

  const columns: ColumnsType<SnsMarketingPost> = [
    {
      title: getIn18Text('TIEZINEIRONG'),
      fixed: 'left',
      ellipsis: true,
      className: style.postContent,
      dataIndex: 'content',
    },
    {
      title: getIn18Text('TUPIAN'),
      dataIndex: 'mediaList',
      render: (mediaList: SnsMarketingMedia[], row: SnsMarketingPost) =>
        row.mediaType === SnsMarketingMediaType.IMAGE && Array.isArray(row.mediaList) && row.mediaList.length ? (
          <MediaList mediaList={mediaList} itemGap={8} itemSize={38} maxPreviewCount={2} />
        ) : (
          '-'
        ),
    },
    {
      title: getIn18Text('GONGGONGZHUYE'),
      dataIndex: 'account',
      render: (_, post: SnsMarketingPost) => (
        <div className={style.accountCell}>
          <Avatar className={style.accountAvatar} avatar={post.publishedAvatar} platform={post.platform} size={28} />
          <div className={style.accountName}>{post.publishedName}</div>
        </div>
      ),
    },
    {
      title: getIn18Text('ZHUANGTAI'),
      dataIndex: 'postStatus',
      render: (postStatus: SnsPostStatus) => <PostStatusTag status={postStatus} />,
    },
    {
      title: getIn18Text('FABUSHIJIAN'),
      dataIndex: 'createTime',
      render: (timestamp: number) => (timestamp ? moment(+timestamp).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: getIn18Text('FABUREN'),
      dataIndex: 'publishedName',
    },
    {
      title: getIn18Text('PINGLUNSHU'),
      dataIndex: 'commentCount',
      render: (commentCount: number, post: SnsMarketingPost) => {
        if (!commentCount) return '-';

        return (
          <div className={style.commentCountCell}>
            <span className={style.commentCount}>{commentCount}</span>
            {!!post.unReadCommentCount && <span className={style.unReadCommentCount}>+{post.unReadCommentCount}</span>}
          </div>
        );
      },
    },
    {
      title: getIn18Text('ZUIXINPINGLUNSHIJIAN'),
      dataIndex: 'latestCommentTime',
      render: (timestamp: number) => (timestamp ? moment(+timestamp).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: getIn18Text('CAOZUO'),
      fixed: 'right',
      dataIndex: 'options',
      render: (_, post: SnsMarketingPost) => {
        const commentItem = (
          <span
            onClick={() => {
              setDetailVisible(true);
              setDetailPost(post);
              snsMarketingApi.updateCommentUnReadCount({
                platform: post.platform,
                postId: post.postId,
                readCount: post.unReadCommentCount,
              });
              trackAction('answer');
            }}
          >
            {getIn18Text('CHENGXIAOFENXI')}
          </span>
        );
        const editItem = hasOpPermisson ? (
          <span
            onClick={() => {
              setEditingPostDbId(post.postDbId);
              setPostEditModalVisible(true);
              trackAction('detail');
            }}
          >
            {getIn18Text('BIANJI')}
          </span>
        ) : null;
        const deleteItem = hasDelPermisson ? (
          <span
            onClick={() =>
              Modal.confirm({
                title: getIn18Text('SHANCHUTIEZI'),
                content: (
                  <>
                    {getIn18Text('GAITIEZINEIRONGYIJI')}
                    <br />
                    {getIn18Text('ZHU：FABUDAOSHEMEI')}
                  </>
                ),
                onOk: () => snsMarketingApi.deleteSnsPost({ postDbId: post.postDbId }).then(() => setParams({ ...params })),
              })
            }
          >
            {getIn18Text('SHANCHU')}
          </span>
        ) : null;
        let options: Array<React.ReactChild | null> = [];

        if (post.postStatus === SnsPostStatus.WAITING) {
          options = [editItem, deleteItem];
        } else if (post.postStatus === SnsPostStatus.EXPIRES) {
          options = [editItem, deleteItem];
        } else if (post.postStatus === SnsPostStatus.PAUSE) {
          options = [editItem, deleteItem];
        } else if (post.postStatus === SnsPostStatus.SUCCEED) {
          options = [commentItem, editItem, deleteItem];
        } else if (post.postStatus === SnsPostStatus.FAILED) {
          options = [editItem, deleteItem];
        }
        options = options.filter(option => !!option);

        if (!options.length) return '-';

        return <OptionSeparator>{options}</OptionSeparator>;
      },
    },
  ];

  useEffect(() => {
    setFetching(true);

    params.sortBy = camelToPascal(params.sortBy);

    snsMarketingApi
      .getSnsPostPageList(params)
      .then(res => {
        setData(res.results);
        setTotal(res.total);
      })
      .finally(() => {
        setFetching(false);
      });
  }, [params]);

  useEffect(() => {
    const queryString = location.hash.substring(1).split('?')[1];

    if (queryString) {
      const query = qs.parse(queryString);
      const postDbId = query.postDbId as string;

      if (postDbId) {
        setEditingPostDbId(postDbId);
        setPostEditModalVisible(true);
      }
    }
  }, [location.hash]);

  const onKnowledgeCenterClick = (e: MouseEvent) => {
    openHelpCenter('/d/1665713091087720450.html');
    e.preventDefault();
  };

  return (
    <PermissionCheckPage resourceLabel="SOCIAL_MEDIA" accessLabel="VIEW" menu="SOCIAL_MEDIA_POST">
      <div className={classnames(style.postManage, layout.container)}>
        <div className={classnames(style.header, layout.static)}>
          <div className={style.title}>{getIn18Text('TIEZIGUANLIv16')}</div>
          <div className={style.subTitle}>{getIn18Text('BIANJIEGUANLITIEZI')}</div>
          <a className={style.learnMore} onClick={onKnowledgeCenterClick}>
            {getIn18Text('LIAOJIEGENGDUO')}
          </a>
          <div className={style.refresh} onClick={handleRefresh}>
            <RefreshIcon className={style.refreshIcon} />
            <span>{getIn18Text('SHUAXIN')}</span>
          </div>
        </div>
        <div className={classnames(style.filter, layout.static)}>
          <Input
            className={style.filterItem}
            style={{ width: 220 }}
            size="middle"
            allowClear
            placeholder={getIn18Text('QINGSHURUTIEZINEIRONG')}
            value={params.postContent}
            onChange={e => {
              setParams({
                ...params,
                postContent: e.target.value,
                page: 1,
              });
              trackAction('search');
            }}
          />
          <AccountsSelect
            className={style.filterItem}
            style={{ width: 160 }}
            placeholder={getIn18Text('QUANBUSHEMEI')}
            accounts={params.accounts}
            maxTagCount="responsive"
            dropdownMatchSelectWidth={false}
            onChange={nextAccounts => {
              setParams({
                ...params,
                accounts: nextAccounts,
                page: 1,
              });
              trackAction('filter');
            }}
          />
          <Select
            className={style.filterItem}
            style={{ width: 160 }}
            size="large"
            allowClear
            placeholder={getIn18Text('QUANBUZHUANGTAI')}
            options={StatusOptions}
            value={params.postStatus}
            onChange={nextStatus => {
              setParams({
                ...params,
                postStatus: nextStatus,
                page: 1,
              });
              trackAction('filter');
            }}
          ></Select>
          <Checkbox
            className={classnames(style.filterItem, style.unReadToggle)}
            checked={params.onlyShowUnreadComment}
            onChange={e => {
              setParams({
                ...params,
                onlyShowUnreadComment: e.target.checked,
                page: 1,
              });
              trackAction('unread');
            }}
          >
            <span>{getIn18Text('JINKANWEIDUPINGLUNDETIEZI')}</span>
            {/* <TipIcon className={style.unReadTip} /> */}
          </Checkbox>
          <PrivilegeCheck resourceLabel="SOCIAL_MEDIA" accessLabel="OP">
            <Button
              className={style.sendPost}
              type="primary"
              onClick={() => {
                navigate('#site?page=snsSendPost&from=snsPostManage');
                trackAction('send_post');
              }}
            >
              {getIn18Text('SHOUDONGFATIE')}
            </Button>
          </PrivilegeCheck>
        </div>
        <div className={classnames(style.body, layout.grow)} ref={growRef}>
          <Table
            className={style.table}
            rowKey="postDbId"
            loading={fetching}
            columns={columns}
            dataSource={data}
            scroll={{ x: 'max-content', y: scrollY }}
            pagination={{
              total,
              current: params.page,
              pageSize: params.size,
              showTotal: (total: number) => `共 ${total} 条数据`,
              showQuickJumper: true,
              showSizeChanger: true,
              pageSizeOptions: ['20', '50', '100'],
              // hideOnSinglePage: true,
            }}
            onChange={(pagination: any) => {
              setParams({
                ...params,
                size: pagination.pageSize as number,
                page: pagination.pageSize === params.size ? (pagination.current as number) : 1,
              });
            }}
          />
        </div>
        <PostEditModal
          visible={postEditModalVisible}
          postDbId={editingPostDbId}
          onCancel={() => {
            setPostEditModalVisible(false);
            setEditingPostDbId(null);
          }}
          onFinish={() => {
            Message.success(getIn18Text('BIANJIWANCHENG'));
            setPostEditModalVisible(false);
            setEditingPostDbId(null);
            setParams({ ...params });
          }}
        />
        <PostDetailDrawer
          visible={detailVisible}
          platform={detailPost?.platform}
          postId={detailPost?.postId}
          prevDisabled={detailPostIndex < 1 || data.slice(0, detailPostIndex).every(item => !item.postId)}
          nextDisabled={detailPostIndex > data.length - 2 || data.slice(detailPostIndex + 1).every(item => !item.postId)}
          onPrev={() => setDetailPost(data.slice(0, detailPostIndex).findLast(item => item.postId) || null)}
          onNext={() => setDetailPost(data.slice(detailPostIndex + 1).find(item => item.postId) || null)}
          onClose={() => {
            setDetailVisible(false);
            setParams({ ...params });
          }}
        />
      </div>
    </PermissionCheckPage>
  );
};

export default HocOrderState(PostManage);
