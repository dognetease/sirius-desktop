import { getIn18Text } from 'api';
import React, { useEffect, useState, useMemo } from 'react';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import { ColumnsType } from 'antd/lib/table';
import { apis, apiHolder, SnsMarketingApi, SnsMarketingState, SnsMarketingMedia, SnsMarketingMediaType, SnsPostStatus } from 'api';
import { useAntdTable } from 'ahooks';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import OptionSeparator from '@web-common/components/UI/OptionSeparator';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import MediaList from '../../components/MediaList';
import Avatar from '../../components/Avatar';
import PostEditModal from '../../components/PostEditModal';
import PostDetailDrawer from '../../components/PostDetailDrawer';
import { PostStatusTag } from '../../components/PostStatusTag';
import style from './style.module.scss';

interface Props {
  id: string;
}

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;
export const PostList: React.FC<Props> = props => {
  const hasOpPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'SOCIAL_MEDIA', 'OP'));
  const hasDelPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'SOCIAL_MEDIA', 'DELETE'));
  const [postEditModalVisible, setPostEditModalVisible] = useState<boolean>(false);
  const [editingPostDbId, setEditingPostDbId] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [detailPost, setDetailPost] = useState<SnsMarketingState.TaskPostStateItem | null>(null);

  async function getOrderList(params: { pageSize: number; current: number; sorter: any }) {
    let order = '';
    if (params?.sorter?.order) {
      order = params?.sorter?.order === 'ascend' ? 'ASC' : 'DESC';
    }
    const res = await snsMarketingApi.getTaskPostState({
      size: params.pageSize,
      page: params.current,
      taskId: props.id,
      order,
      sortBy: params?.sorter?.field || '',
    });

    return {
      list: res?.results || [],
      total: res?.total || 0,
    };
  }

  const { tableProps, search } = useAntdTable(getOrderList, { defaultPageSize: 20 });
  const { submit } = search;

  const detailPostIndex = useMemo(() => {
    if (!detailPost) return -1;

    return tableProps.dataSource.findIndex(item => item.postDbId === detailPost.postDbId);
  }, [detailPost, tableProps.dataSource]);

  useEffect(() => {
    if (props.id) {
      submit();
    }
  }, [props.id]);

  const columns: ColumnsType<SnsMarketingState.TaskPostStateItem> = [
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
      render: (mediaList: SnsMarketingMedia[], row: SnsMarketingState.TaskPostStateItem) =>
        row.mediaType === SnsMarketingMediaType.IMAGE && Array.isArray(row.mediaList) && row.mediaList.length ? (
          <MediaList mediaList={mediaList} itemGap={8} itemSize={38} />
        ) : (
          '-'
        ),
    },
    {
      title: getIn18Text('GONGGONGZHUYE'),
      dataIndex: 'account',
      render: (_, post: SnsMarketingState.TaskPostStateItem) => (
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
      sorter: true,
      render: (timestamp: number) => (timestamp ? moment(+timestamp).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: getIn18Text('TIEZIFUGAIRENSHU'),
      dataIndex: 'uniqueImpressionCount',
      className: style.number,
    },
    {
      title: getIn18Text('TIEZIHUDONGCISHU'),
      dataIndex: 'engagementCount',
      className: style.number,
    },
    {
      title: getIn18Text('DIANZANSHU'),
      dataIndex: 'likeCount',
      className: style.number,
    },
    {
      title: getIn18Text('PINGLUNSHU'),
      dataIndex: 'commentCount',
      className: style.number,
    },
    {
      title: getIn18Text('FENXIANGCISHU'),
      dataIndex: 'shareCount',
      className: style.number,
    },
    {
      title: getIn18Text('CAOZUO'),
      fixed: 'right',
      // width: 140,
      dataIndex: 'options',
      render: (_, post: SnsMarketingState.TaskPostStateItem) => {
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
                onOk: () => snsMarketingApi.deleteSnsPost({ postDbId: post.postDbId }).then(() => submit()),
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

  return (
    <div className={style.wrapper}>
      <div className={style.title}>{getIn18Text('TIEZIGUANLIv16')}</div>
      <div className={style.table}>
        <Table columns={columns} {...tableProps} className={style.table} scroll={{ x: 'max-content' }} />

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
            submit();
          }}
        />

        <PostDetailDrawer
          visible={detailVisible}
          platform={detailPost?.platform}
          postId={detailPost?.postId}
          prevDisabled={detailPostIndex < 1 || tableProps.dataSource?.slice(0, detailPostIndex).every(item => !item.postId)}
          nextDisabled={detailPostIndex > tableProps.dataSource?.length - 2 || tableProps.dataSource?.slice(detailPostIndex + 1).every(item => !item.postId)}
          onPrev={() => setDetailPost(tableProps.dataSource?.slice(0, detailPostIndex).findLast(item => item.postId) || null)}
          onNext={() => setDetailPost(tableProps.dataSource?.slice(detailPostIndex + 1).find(item => item.postId) || null)}
          onClose={() => {
            setDetailVisible(false);
            submit();
          }}
        />
      </div>
    </div>
  );
};
