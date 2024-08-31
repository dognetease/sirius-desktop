import React from 'react';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import { ColumnsType, SorterResult } from 'antd/lib/table/interface';
import { PagePostListReq, PagePostItem } from 'api';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import edmStyle from '@web-edm/edm.module.scss';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import classnames from 'classnames';
import { facebookTracker } from '@/components/Layout/SNS/tracker';
import { getTransText } from '@/components/util/translate';
import style from './tableData.module.scss';
import { Pagination } from '../type';
import maskSrc from '@/images/icons/facebook/eye.png';
import { getHandyTime } from '@/components/Layout/SNS/utils';
interface PostsTableProps {
  tableData: PagePostItem[];
  loading: boolean;
  scrollY?: number;
  pagination: Pagination;
  currentPage: number;
  onChange: (params: (data: PagePostListReq) => PagePostListReq) => void;
  openDetial: (id: string, newNums: number) => void;
}

const PostsTable = (props: PostsTableProps) => {
  const { tableData, pagination, scrollY, currentPage, onChange, openDetial } = props;
  const imgPreview = (urls: string[]) => {
    let data = urls.map(url => ({
      downloadUrl: url,
      previewUrl: url,
      OriginUrl: url,
      size: 480,
    }));
    ImgPreview.preview({
      data,
      startIndex: 0,
    });
  };
  const columns: ColumnsType<PagePostItem> = [
    {
      title: getTransText('TIEZINEIRONG'),
      dataIndex: 'postContent',
      width: 160,
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getTransText('TUPIAN'),
      width: 48,
      dataIndex: 'mediaUrl',
      render: (text, record) => {
        if (record.mediaType === 3) {
          return (
            <div className={style.imgBox}>
              {text ? <img className={style.img} src={text && text[0]} /> : ''}
              <div onClick={() => imgPreview(text)} className={style.mask}>
                <img src={maskSrc} />{' '}
              </div>
            </div>
          );
        }
        return <div className={style.imgBox}></div>;
      },
    },
    {
      title: getTransText('GONGGONGZHUYE'),
      width: 100,
      dataIndex: 'pageName',
      render: text => <EllipsisTooltip>{text || '-'}</EllipsisTooltip>,
    },
    {
      title: getTransText('FABUSHIJIAN'),
      width: 160,
      sorter: true,
      dataIndex: 'createTime',
    },
    {
      title: getTransText('FABUREN'),
      width: 100,
      dataIndex: 'publishedName',
      render: text => <EllipsisTooltip>{text}</EllipsisTooltip>,
    },
    {
      title: getTransText('PINGLUNSHU'),
      width: 80,
      dataIndex: 'commentCount',
      render: (text, record) => (
        <EllipsisTooltip>
          {text && record.unReadCommentCount ? (
            <>
              <span className={style.commmetText}>{text || ''}</span>
              <span className={style.newComment}>{`+${record.unReadCommentCount || 0}`}</span>
            </>
          ) : (
            <span className={style.commmetText}>{text || '-'}</span>
          )}
        </EllipsisTooltip>
      ),
    },
    {
      title: getTransText('ZUIXINPINGLUNSHIJIAN'),
      width: 160,
      dataIndex: 'latestCommentTime',
      render: text => <EllipsisTooltip>{text ? getHandyTime(new Date(text).getTime()) : '-'}</EllipsisTooltip>,
    },
    {
      title: getTransText('CAOZUO'),
      width: 60,
      fixed: 'right',
      render: (text, record) => (
        <div
          className={style.color}
          onClick={() => {
            openDetial(record.postId, record.unReadCommentCount);
            facebookTracker.trackPostsAction('detail');
          }}
        >
          {getTransText('XIANGQING')}
        </div>
      ),
    },
  ];

  return (
    <>
      <Table
        className={classnames(edmStyle.contactTable, style.fbPostTable)}
        rowClassName={(record, index) => (index % 2 == 0 ? `${style.odd}` : `${style.even}`)}
        rowKey="postId"
        columns={columns}
        loading={props.loading}
        dataSource={tableData}
        scroll={{
          x: '100%',
          y: scrollY,
        }}
        pagination={{
          className: 'pagination-wrap',
          size: 'small',
          total: pagination.total,
          current: currentPage,
          pageSize: pagination.pageSize,
          pageSizeOptions: ['20', '50', '100'],
          showSizeChanger: true,
        }}
        onChange={(currentPagination, filters, sorterResult: SorterResult<PagePostItem> | SorterResult<PagePostItem>[]) => {
          let sort: string;
          const sorter = Array.isArray(sorterResult) ? sorterResult[0] : sorterResult;
          let order = sorter?.order ? (sorter.order.startsWith('asce') ? 'asc' : 'desc') : '';
          if (sorter?.field && sorter?.order) {
            sort = `${sorter.field},${order}`;
          }
          onChange(previous => ({
            ...previous,
            size: currentPagination.pageSize as number,
            page: currentPagination.pageSize === previous.size ? (currentPagination.current as number) : 1,
            sort,
          }));
        }}
      />
    </>
  );
};

export default PostsTable;
