import { getIn18Text } from 'api';
import React, { useEffect, useState } from 'react';
import { Divider, Input, Tooltip } from 'antd';
import { useMap } from 'react-use';
import { navigate } from 'gatsby';
import classnames from 'classnames';
import debounce from 'lodash/debounce';
import { apiHolder, apis, FacebookApi, MainPagesRefs, PublicPagesResults, DataStoreApi, inWindow } from 'api';
import type { AlignType } from 'rc-trigger/lib/interface';
import { ColumnsType } from 'antd/es/table';
import { EdmPageProps } from '@web-edm/pageProps';
import { useActions } from '@web-common/state/createStore';
import { FacebookActions } from '@web-common/state/reducer';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { useAppSelector } from '@web-common/state/createStore';
import { useResponsiveTable } from '@/hooks/useResponsiveTable';
import { facebookTracker } from '@/components/Layout/SNS/tracker';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { Authorize } from '../components/authorize';
import { getTransText } from '@/components/util/translate';
import { ReactComponent as PageTotal } from '@/images/icons/edm/page-total.svg';
import { ReactComponent as FansTotal } from '@/images/icons/edm/fans-total.svg';
import { ReactComponent as AddedFans } from '@/images/icons/edm/added-fans.svg';
import { ReactComponent as PostsTotal } from '@/images/icons/edm/posts-total.svg';
import { ReactComponent as CommentTotal } from '@/images/icons/edm/comment-total.svg';
import { ReactComponent as Account } from '@/images/icons/edm/account.svg';
import { ReactComponent as FbTips } from '@/images/icons/edm/fb-tips.svg';
import { ReactComponent as FbSearch } from '@/images/icons/edm/fb-search.svg';
import { ReactComponent as FbOauth } from '@/images/icons/edm/fb-oauth.svg';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';

import edmStyle from '@web-edm/edm.module.scss';
import styles from './mainPages.module.scss';

const facebookApi = apiHolder.api.requireLogicalApi(apis.facebookApiImpl) as unknown as FacebookApi;
const storeApi: DataStoreApi = apiHolder.api.getDataStoreApi();
const systemApi = apiHolder.api.getSystemApi();
const PagesGuideKey = `FacebookPagesGuideCode-${systemApi.getCurrentUser()?.accountName}`;
const CONCAT_TIPS = getTransText('YUOGONGGONGZHUYEYOULIUYAN');
const sysLang = inWindow() && window.systemLang === 'en';

const headerListInit = [
  {
    icon: <PageTotal />,
    count: '-',
    desc: <EllipsisTooltip className={styles.headerDesc}>{getTransText('GONGONGZHUYESHULIANG')}</EllipsisTooltip>,
  },
  {
    icon: <FansTotal />,
    count: '-',
    desc: (
      <>
        <span>
          <EllipsisTooltip className={styles.headerDesc}>{getTransText('FACEBOOKLIANXIRENSHU')}</EllipsisTooltip>
        </span>
        <Tooltip overlayClassName={styles.toolTipOver} placement="bottom" trigger="hover" title={CONCAT_TIPS}>
          <FbTips className={styles.fbTips} />
        </Tooltip>
      </>
    ),
  },
  {
    icon: <AddedFans />,
    count: '-',
    desc: <EllipsisTooltip className={styles.headerDesc}>{getTransText('ZUORIXINZENGFENSI')}</EllipsisTooltip>,
  },
  {
    icon: <PostsTotal />,
    count: '-',
    desc: <EllipsisTooltip className={styles.headerDesc}>{getTransText('ZONGTIEZI')}</EllipsisTooltip>,
  },
  {
    icon: <CommentTotal />,
    count: '-',
    desc: <EllipsisTooltip className={styles.headerDesc}>{getTransText('ZONGPINGLUN')}</EllipsisTooltip>,
  },
];

interface HeaderList {
  icon: React.ReactNode;
  count: string;
  desc: string | React.ReactNode;
}

type pageType = {
  pageNumber: number;
  pageSize: number;
  pageName?: string;
};

interface IProps {
  ref?: React.Ref<MainPagesRefs>;
}

const alignConfig = {
  points: ['tr', 'br'], // align top left point of sourceNode with top right point of targetNode
  offset: [0, 0], // the offset sourceNode by 0px in x and 0px in y,
  targetOffset: [0, 0], // the offset targetNode by 0px of targetNode width in x and 0px of targetNode height in y,
  overflow: { adjustX: true, adjustY: false }, // auto adjust position when sourceNode is overflowed
} as AlignType;

const PUBLIC_PAGE = getTransText('KEYIGUANLI');
const MainPages: React.FC<EdmPageProps & IProps> = React.forwardRef(() => {
  const { setFacebookModalShow } = useActions(FacebookActions);
  const { isAuthorized, authorizedLoading, fresh } = useAppSelector(state => state.facebookReducer);
  const [pageList, setPageList] = useState<PublicPagesResults[]>([]);
  const [headerList, setHeaderList] = useState<HeaderList[]>(headerListInit);
  const [pageParams, { set, setAll }] = useMap<pageType & { total?: number }>({ pageNumber: 1, pageSize: 10, total: 0 });
  const [tableLoading, setTbLoading] = useState(false);
  const [tipShow, setShow] = useState<boolean>(false);
  const { layout, growRef, scrollY } = useResponsiveTable();

  const fetchPageList = ({ pageNumber, pageSize, pageName }: pageType) => {
    setTbLoading(true);
    facebookApi
      .getFacebookPagesList({ pageName: pageName || '', pageNumber, pageSize })
      .then(res => {
        const { results, page, size, total } = res;
        setPageList(results);
        setAll({ pageNumber: page, pageSize: size, total });
      })
      .catch(err => console.log(err))
      .finally(() => {
        setAll({ pageNumber, pageSize });
        setTbLoading(false);
      });
  };

  useEffect(() => {
    facebookApi.getPagesStatistic().then(res => {
      const { addedContactCount, publicPageCount, totalCommentCount, totalContactCount, totalPostCount } = res;
      const hd = headerListInit.map((item, idx) => {
        switch (idx) {
          case 0:
            return { ...item, count: '' + publicPageCount };
          case 1:
            return { ...item, count: '' + totalContactCount };
          case 2:
            return { ...item, count: '+' + addedContactCount };
          case 3:
            return { ...item, count: '' + totalPostCount };
          case 4:
            return { ...item, count: '' + totalCommentCount };
          default:
            return item;
        }
      });
      setHeaderList(hd);
    });
  }, []);

  useEffect(() => {
    fetchPageList({ pageNumber: 1, pageSize: 10 });
  }, [fresh]);

  const handlePosts = () => {
    facebookTracker.trackPagesAction('post');
    window.open('https://business.facebook.com/latest/posts/published_posts', '_blank');
  };

  const handleDetail = (record: PublicPagesResults) => {
    facebookTracker.trackPagesAction('detail');
    navigate(`#edm?page=facebookPosts&id=${record.pageId}`);
  };

  const handleReAuth = () => {
    facebookTracker.trackPagesAction('bind');
    setFacebookModalShow({ accModal: false, offsiteModal: true, source: 'table' });
  };

  const columns: ColumnsType<PublicPagesResults> = [
    {
      title: <span className={styles.columnsPadding}>{getTransText('ZHUYEMINGCHENG')}</span>,
      dataIndex: 'pageName',
      key: 'pageName',
      width: 210,
      render: (text: string, record: PublicPagesResults) => (
        <span className={classnames(styles.accClass, styles.columnsPadding)}>
          <img src={record.pageNameAvatar} alt="" />
          <EllipsisTooltip className={styles.text}>{text}</EllipsisTooltip>
        </span>
      ),
    },
    {
      title: getTransText('SUOSHUZHANGHAO'),
      dataIndex: 'belongUserName',
      key: 'belongUserName',
      width: 150,
      render: (text: string, record: PublicPagesResults) => (
        <span className={styles.accClass}>
          <img src={record.belongUserAvatar} alt="" />
          <EllipsisTooltip>{text}</EllipsisTooltip>
        </span>
      ),
    },
    {
      title: (
        <>
          <span>{getTransText('FACEBOOKLIANXIRENSHU')}</span>
          <Tooltip overlayClassName={styles.toolTipOver} placement="bottom" trigger="hover" title={CONCAT_TIPS}>
            <FbTips className={styles.fbTips} />
          </Tooltip>
        </>
      ),
      dataIndex: 'contactCount',
      key: 'contactCount',
      width: 80,
      render: (text: string) => <EllipsisTooltip className={styles.numClass}>{text}</EllipsisTooltip>,
    },
    {
      title: getTransText('TIEZISHU'),
      dataIndex: 'postCount',
      key: 'postCount',
      width: 60,
      render: (text: string) => <EllipsisTooltip className={styles.numClass}>{text}</EllipsisTooltip>,
    },
    {
      title: getTransText('PINGLUNSHU'),
      dataIndex: 'commentsCount',
      key: 'commentsCount',
      width: 60,
      render: (text: string) => <EllipsisTooltip className={styles.numClass}>{text}</EllipsisTooltip>,
    },
    {
      title: getTransText('FACEBOOKZHUANGTAI'),
      dataIndex: 'pageStatus',
      key: 'pageStatus',
      width: 90,
      render: (text: string, _: any) => (
        <span>
          {text === getIn18Text('YISHOUQUAN') ? <EllipsisTooltip>{text}</EllipsisTooltip> : <EllipsisTooltip className={styles.status}>{text}</EllipsisTooltip>}
        </span>
      ),
    },
    {
      title: getTransText('CAOZUO'),
      dataIndex: 'action',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_: string, record: PublicPagesResults) => (
        <span className={styles.action}>
          {record.pageStatus === getIn18Text('YISHOUQUAN') ? (
            <>
              <span onClick={handlePosts}>{getTransText('FATIE')}</span>
              <Divider type="vertical" />
              <span onClick={() => handleDetail(record)}>{getTransText('CHAKAN')}</span>
            </>
          ) : (
            <span className={styles.reAuth} onClick={handleReAuth}>
              <FbOauth />
              {getTransText('CHONGXINSHOUQUAN')}
            </span>
          )}
        </span>
      ),
    },
  ];

  const triggerChange = debounce(value => {
    fetchPageList({ pageNumber: 1, pageSize: 10, pageName: value });
  }, 500);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    facebookTracker.trackPagesAction('search');
    triggerChange(e?.target?.value || '');
  };

  const handlePageOnchange = (page: number, pageSize?: number | undefined) => {
    fetchPageList({ pageNumber: page, pageSize: pageSize ?? pageParams.pageSize });
  };

  const title = () => {
    return (
      <span className={styles.outer}>
        {getTransText('CHAKANBINGGUANLI')}
        <span
          className={styles.know}
          onClick={() => {
            setShow(false);
            storeApi.put(PagesGuideKey, 'true');
          }}
        >
          {getTransText('ZHIDAOLE')}
        </span>
      </span>
    );
  };

  useEffect(() => {
    const FbPage = storeApi.getSync(PagesGuideKey);
    const { data, suc } = FbPage;
    setShow(!(suc && data === 'true'));
  }, []);

  const handleAccountClick = () => {
    !tipShow && setFacebookModalShow({ accModal: true });
    facebookTracker.trackPagesAction('account');
  };

  return (
    <PermissionCheckPage resourceLabel="FACEBOOK" accessLabel="VIEW" menu="FACEBOOK_MY_MAIN_PAGE">
      {!isAuthorized ? (
        <Authorize loading={authorizedLoading} trackType="pages" />
      ) : (
        <div
          className={classnames(layout.container, styles.container, {
            [styles.enLang]: sysLang,
          })}
        >
          <div className={classnames(layout.static)}>
            <div className={styles.title}>
              <span className={styles.pageManage}>
                {getTransText('wodezhuyeguanli')}
                <Tooltip overlayClassName={styles.toolTipOver} placement="bottom" trigger="hover" title={PUBLIC_PAGE}>
                  <FbTips />
                </Tooltip>
              </span>
              <span className={styles.accManage} onClick={handleAccountClick}>
                <Tooltip
                  getPopupContainer={node => node.parentNode as HTMLElement}
                  align={alignConfig}
                  overlayClassName={styles.fbTooltips}
                  title={title}
                  visible={tipShow}
                >
                  <Account />
                  {getTransText('FACEBOOKZHANGHAOGUANLI')}
                </Tooltip>
              </span>
            </div>
            <div className={styles.fbHeader}>
              {headerList.map(item => {
                return (
                  <div className={styles.viewBox}>
                    <div className={styles.headerItem}>
                      {item.icon}
                      <div className={styles.right}>
                        <p className={styles.count}>{item.count}</p>
                        <p>{item.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={styles.search}>
              <Input width={220} prefix={<FbSearch />} placeholder={getTransText('QINGSHURUZHUYEMINGCHENG')} onChange={handleOnChange} />
            </div>
          </div>
          <div className={classnames(layout.grow, styles.table)} ref={growRef}>
            {
              <Table
                className={edmStyle.contactTable}
                rowClassName={(record, index) => (index % 2 == 0 ? `${styles.odd}` : `${styles.even}`)}
                dataSource={pageList}
                columns={columns}
                loading={tableLoading}
                scroll={{
                  x: 'max-content',
                  y: scrollY,
                }}
                pagination={{
                  size: 'small',
                  total: pageParams.total,
                  pageSize: pageParams.pageSize,
                  current: pageParams.pageNumber,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  className: 'pagination-wrap',
                  showSizeChanger: true,
                  showQuickJumper: true,
                  defaultCurrent: 1,
                  onChange: handlePageOnchange,
                }}
              />
            }
          </div>
        </div>
      )}
    </PermissionCheckPage>
  );
});

export default MainPages;
