/*
 * @Author: zhangqingsong
 * @Description: 联系人详情页面
 */
import React, { FC, useState, useEffect } from 'react';
import { message } from 'antd';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
// import SiriusPagination from '@web-common/components/UI/Pagination';
import SiriusPagination from '@lingxi-common-component/sirius-ui/Pagination';
// import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import Breadcrumb from '@lingxi-common-component/sirius-ui/Breadcrumb';
import lodashGet from 'lodash/get';
import { useSelector } from 'react-redux';
import { RootState } from '@web-common/state/createStore';
import { getBodyFixHeight } from '@web-common/utils/constant';
// import { ViewEdmContent } from '../../components/viewContent/viewContent';
import { apiHolder, apis, AiHostingApi, ContactDetailItem, ContactSource, RequestOperateListV2 } from 'api';
import { CompanyDetail } from '@/components/Layout/globalSearch/detail/CompanyDetail';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { openReadOnlyUniversalInWindow } from '@web-mail/util';
import { ReactComponent as SendTimesIcon } from '@/images/icons/edm/statistics1.svg';
import { ReactComponent as ArrivedIcon } from '@/images/icons/edm/statistics2.svg';
import { ReactComponent as OpenedIcon } from '@/images/icons/edm/statistics3.svg';
import { ReactComponent as ReplyedIcon } from '@/images/icons/edm/statistics4.svg';
// import { ReactComponent as UnsubscribedIcon } from '@/images/icons/edm/statistics5.svg';
import { ReactComponent as LinkTimesIcon } from '@/images/icons/edm/statistics6.svg';
// import { ReactComponent as CommodityIcon } from '@/images/icons/edm/statistics7.svg';
import styles from './contactDetail.module.scss';
import { getIn18Text } from 'api';
import { ReplyListModal } from '../ReplyContact/ReplyListModal';
import { openMail } from '../../detail/detailHelper';
import { ReactComponent as RightArrowLinkIcon } from '@/images/icons/edm/yingxiao/right-arrow-link.svg';

const aiHostingApi = apiHolder.api.requireLogicalApi(apis.aiHostingApiImpl) as AiHostingApi;

// 头部总体数据
type headerDataConfigType = {
  indKey: string;
  title: string;
  value?: string | number;
  render?: (value: number | string | undefined) => JSX.Element;
  companyEsId?: string;
};

// 上方总览展示配置
const headerDataConfig: headerDataConfigType[] = [
  {
    indKey: 'name',
    title: getIn18Text('LIANXIRENXINGMING：'),
    render: value => <span>{value || '-'}</span>,
  },
  {
    indKey: 'email',
    title: getIn18Text('YOUJIANDEZHI：'),
    render: value => <span>{value || '-'}</span>,
  },
  {
    indKey: 'unsubscribe',
    title: getIn18Text('SHIFOUTUIDING：'),
    render: value => <span>{value === 1 ? getIn18Text('SHI') : getIn18Text('FOU')}</span>,
  },
  {
    indKey: 'displayStatusDesc',
    title: getIn18Text('YINGXIAOZHUANGTAI：'),
    render: value => <span>{value || '-'}</span>,
  },
  {
    indKey: 'displayPlanName',
    title: getIn18Text('DANGQIANYINGXIAORENWU：'),
    render: value => <span>{value || '-'}</span>,
  },
  {
    indKey: 'displayRoundStatusDesc',
    title: getIn18Text('YINGXIAOLUNCI：'),
    render: value => <span>{value || '-'}</span>,
  },
  {
    indKey: 'recentSendTime',
    title: getIn18Text('ZUIJINFAXINSHIJIAN：'),
    render: value => <span>{value ? moment(value).format('YYYY-MM-DD') : '-'}</span>,
  },
  {
    indKey: 'createTime',
    title: getIn18Text('WAJUESHIJIAN：'),
    render: value => <span>{value ? moment(value).format('YYYY-MM-DD') : '-'}</span>,
  },
  {
    indKey: 'nextSendTime',
    title: getIn18Text('XIACIYUGUFAXINSHI'),
    render: value => <span>{value ? `${moment(value).format('YYYY-MM-DD')}之后` : '-'}</span>,
  },
  {
    indKey: 'userSource',
    title: getIn18Text('LIANXIRENLAIYUAN：'),
    render: value => <span>{value === 0 ? getIn18Text('SHOUDONGTIANJIA') : value ? getIn18Text('ZIDONGWAJUE') : '-'}</span>,
  },
  {
    indKey: 'companyName',
    title: getIn18Text('GONGSI：'),
    render: value => <span className={value ? styles.headerLight : {}}>{value || '-'}</span>,
  },
  {
    indKey: 'recReason',
    title: getIn18Text('TUIJIANLIYOU：'),
    render: value => <span>{value || '-'}</span>,
  },
];

// 中部卡片数据
type statDataConfigType = {
  indKey?: string;
  title?: string;
  value?: string;
  render?: (value: number) => JSX.Element;
  icon?: JSX.Element;
};

const statDataConfig: statDataConfigType[] = [
  {
    indKey: 'sendNum',
    title: getIn18Text('FASONGCISHU'),
    icon: <SendTimesIcon className={styles.statisticsIcon} />,
  },
  {
    indKey: 'arriveNum',
    title: getIn18Text('SONGDACISHU'),
    icon: <ArrivedIcon className={styles.statisticsIcon} />,
  },
  {
    indKey: 'readNum',
    title: getIn18Text('DAKAICISHU'),
    icon: <OpenedIcon className={styles.statisticsIcon} />,
  },
  {
    indKey: 'replyNum',
    title: getIn18Text('HUIFUCISHU'),
    icon: <ReplyedIcon className={styles.statisticsIcon} />,
  },
  {
    indKey: 'traceClickNum',
    title: getIn18Text('LIANJIEDIANJICISHU'),
    icon: <LinkTimesIcon className={styles.statisticsIcon} />,
  },
  // {
  //   key: 'commodityClickNum',
  //   title: '商品点击次数',
  //   icon: <CommodityIcon className={styles.statisticsIcon} />,
  // },
];

const ContactDetail: FC<{
  taskId: string;
  email: string;
  // 返回ai页面
  goBackAi: () => void;
  // 返回联系人管理
  goBackManage: () => void;
  goTaskDetail: () => void;
  source?: ContactSource;
}> = props => {
  const { taskId, email, goBackAi, goBackManage, goTaskDetail, source = 'manage' } = props;
  const ifFromSingleTask = ['autoTask', 'handTask'].includes(source);
  const modulePermission = useSelector((state: RootState) => state.privilegeReducer.modules);
  // 列表表头配置
  const columns = [
    {
      title: getIn18Text('FAJIANDEZHI'),
      width: 180,
      dataIndex: 'senderEmail',
      key: 'senderEmail',
      render: (value: string) => <span className={styles.tableAstrict}>{value || '-'}</span>,
    },
    // {
    //   title: '联系人姓名',
    //   width: 180,
    //   dataIndex: 'name',
    //   render: (value: string) => <span className={styles.tableAstrict}>{value}</span>,
    // },
    {
      title: getIn18Text('FASONGSHIJIAN'),
      width: 180,
      dataIndex: 'sendTime',
      render: (value: number) => <span>{value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : '-'}</span>,
    },
    {
      title: getIn18Text('YINGXIAORENWU'),
      width: 180,
      dataIndex: 'displayPlanName',
      render: (value: string) => <span>{value || '-'}</span>,
    },
    {
      title: getIn18Text('YINGXIAOLUNCI'),
      width: 180,
      dataIndex: 'displayRoundStatusDesc',
      render: (value: string) => <span>{value || '-'}</span>,
    },
    {
      title: getIn18Text('SHIFOUSONGDA'),
      width: 88,
      dataIndex: 'arrive',
      render: (value: number) => <span>{value === 1 ? getIn18Text('SHI') : getIn18Text('FOU')}</span>,
    },
    {
      title: getIn18Text('SHIFOUDAKAI'),
      width: 88,
      dataIndex: 'read',
      render: (value: number) => <span>{value === 1 ? getIn18Text('SHI') : getIn18Text('FOU')}</span>,
    },
    {
      title: getIn18Text('SHIFOUHUIFU'),
      width: 88,
      dataIndex: 'reply',
      render: (value: number, item: ContactDetailItem) => (
        <span
        // onClick={() => {
        //   if (value === 1) {
        //     openMail(item?.emailMid);
        //     // setReplyOperates({
        //     //   contactEmail: item.email,
        //     // });
        //     // setReplyListVisible(true);
        //   }
        // }}
        // className={`${value === 1 ? styles.replyed : ''}`}
        >
          {value === 1 ? getIn18Text('SHI') : getIn18Text('FOU')}
        </span>
      ),
    },
    {
      title: getIn18Text('LIANJIEDIANJICISHU'),
      width: 120,
      dataIndex: 'traceClickNum',
      render: (value: number) => <span>{value || 0}</span>,
    },
    // {
    //   title: '商品点击次数',
    //   width: 88,
    //   dataIndex: 'commodityClickNum',
    // },
    {
      title: getIn18Text('YOUJIANXIANGQING'),
      fixed: 'right',
      width: 100,
      dataIndex: '',
      render: (item: ContactDetailItem) => (
        <span className={styles.operation} onClick={() => handleCheck(item)}>
          {getIn18Text('CHAKAN')}
        </span>
      ),
    },
  ];
  // 列表分页配置
  const [pageInfo, setPageInfo] = useState({ current: 1, pageSize: 20, total: 0 });
  // 列表数据加载状态
  const [loading, setLoading] = useState<boolean>(false);
  // 查看邮件弹窗
  // const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  // 当前查看邮件mid
  // const [previewMid, setPreviewMid] = useState<string>('');
  // 头部统计卡片数据
  const [headerData, setHeaderData] = useState<headerDataConfigType[]>([]);
  // 统计卡片数据
  const [statData, setStatData] = useState<statDataConfigType[]>([]);
  // 列表数据
  const [tableData, setTableData] = useState<ContactDetailItem[]>([]);
  // 展示公司全球搜页面抽屉
  const [showCompanyId, setShowCompanyId] = useState<string>('');

  // 回复列表显示
  const [replyListVisible, setReplyListVisible] = useState<boolean>(false);
  const [replyOperates, setReplyOperates] = useState<RequestOperateListV2>();
  // 查看
  const handleCheck = (item: ContactDetailItem) => {
    // setPreviewMid(item.emailMid);
    // setShowPreviewModal(true);
    // openReadOnlyUniversalInWindow(item.emailMid);
    const email = headerData.find(item => item.indKey === 'email')?.value;
    if (item?.edmEmailId && email) {
      openMail('', item.edmEmailId, '', `${email}|undefined`);
    } else {
      message.error('缺少查询参数');
    }
  };

  // 分页器相关操作
  const updatePageInfo = pInfo => {
    setPageInfo(pInfo);
  };

  const initData = async () => {
    setLoading(true);
    // 头部总体和中间的统计数据
    const statParams = { taskId, email };
    const statResult = await aiHostingApi.getAiHostingContactDetailStatistics(statParams);
    const hData = headerDataConfig.map(item => {
      if (item.indKey === 'email') {
        // email不从返回数据中获取
        return {
          ...item,
          value: email,
        };
      } else if (item.indKey === 'companyName') {
        // 公司额外携带公司id
        return {
          ...item,
          value: lodashGet(statResult, `user.${item.indKey}`, item.value),
          companyEsId: lodashGet(statResult, 'user.companyEsId', ''),
        };
      } else if (item.indKey) {
        // 正常情况
        return {
          ...item,
          value: lodashGet(statResult, `user.${item.indKey}`, item.value),
        };
      }
      // 异常情况
      return {
        ...item,
        value: item?.value,
      };
    });
    const sData = statDataConfig.map(item => ({
      ...item,
      value: item.indKey ? lodashGet(statResult, `user.${item.indKey}`, 0) : 0,
    }));
    setHeaderData(hData);
    setStatData(sData);
    // 列表数据
    const listParams = { taskId, email, page: pageInfo.current, pageSize: pageInfo.pageSize };
    const listResult = await aiHostingApi.getAiHostingContactDetailList(listParams);
    const listData = listResult?.userList
      ? listResult?.userList.map(item => ({
          ...item,
          email,
          name: lodashGet(statResult, 'user.name', ''),
        }))
      : [];
    updatePageInfo({ ...pageInfo, total: listResult.totalSize });
    setTableData(listData);
    setLoading(false);
  };

  const renderBreadcrumbBySource = () => {
    return (
      <>
        <Breadcrumb.Item className={styles.breadcrumbItem} onClick={goBackAi}>
          {getIn18Text('YINGXIAOTUOGUAN')}
        </Breadcrumb.Item>
        <Breadcrumb.Separator>/</Breadcrumb.Separator>
        {ifFromSingleTask ? (
          <Breadcrumb.Item className={styles.breadcrumbItem} onClick={goTaskDetail}>
            {getIn18Text('YINGXIAOFANGANXIANGQING')}
          </Breadcrumb.Item>
        ) : (
          <Breadcrumb.Item className={styles.breadcrumbItem} onClick={goBackManage}>
            {getIn18Text('GUANLILIANXIREN')}
          </Breadcrumb.Item>
        )}
      </>
    );
  };

  useEffect(() => {
    initData();
  }, [pageInfo.current, pageInfo.pageSize]);

  // 初始化获取数据
  useEffect(() => {
    initData();
  }, []);

  // 头部点击
  const handleHeaderClick = (item: headerDataConfigType) => {
    if (item?.companyEsId) {
      if (modulePermission?.['GLOBAL_SEARCH']) {
        setShowCompanyId(item.companyEsId);
      } else {
        message.warn(getIn18Text('ZANWUQUANQIUSOUYEMIAN'));
      }
    }
  };

  return (
    <div className={styles.contactDetail}>
      {/* 面包屑区域 */}
      <Breadcrumb separator="">
        {renderBreadcrumbBySource()}
        {/* <Breadcrumb.Item className={styles.breadcrumbItem} onClick={goBackAi}>
          {getIn18Text('YINGXIAOTUOGUAN')}
        </Breadcrumb.Item>
        <Breadcrumb.Separator>/</Breadcrumb.Separator>
        <Breadcrumb.Item className={styles.breadcrumbItem} onClick={goBackManage}>
          {getIn18Text('GUANLILIANXIREN')}
        </Breadcrumb.Item> */}
        <Breadcrumb.Separator>/</Breadcrumb.Separator>
        <Breadcrumb.Item>{getIn18Text('LIANXIRENXIANGQING')}</Breadcrumb.Item>
      </Breadcrumb>
      <div className={styles.header}>
        {headerData.map((item, index) => (
          <div className={styles.headerItem} key={index}>
            <span className={styles.headerTitle}>{item.title}</span>
            <span className={styles.headerValue} onClick={() => handleHeaderClick(item)}>
              {item.render ? item.render(item.value) : item.value}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.statistics}>
        {statData.map((item, index) => {
          const showReplyCountBtn = item?.indKey === 'replyNum' && Number(item?.value) > 0;

          return (
            <div className={styles.statisticsItem} key={index}>
              {item.icon}
              <div>
                {showReplyCountBtn ? (
                  <div
                    style={{ display: 'flex' }}
                    className={styles.itemReply}
                    onClick={() => {
                      setReplyOperates({
                        taskId,
                        contactEmail: email,
                      });
                      setReplyListVisible(true);
                    }}
                  >
                    <p className={`${styles.link} ${styles.itemTitle}`}>{item.title}</p>
                    <RightArrowLinkIcon className={styles.icon} />
                  </div>
                ) : (
                  <p className={styles.itemTitle}>{item.title}</p>
                )}
                <p className={styles.itemValue}>{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>
      <SiriusTable
        className={styles.table}
        loading={loading}
        rowKey={record => record.emailMid}
        columns={columns}
        dataSource={tableData}
        scroll={{ x: 'max-content', y: `calc(100vh - ${getBodyFixHeight(true, undefined, true) + 434}px)` }}
        pagination={false}
        onChange={updatePageInfo}
      />
      <div className={styles.pagination}>
        <SiriusPagination
          showTotal={total => `共${total}条数据`}
          showQuickJumper
          current={pageInfo.current}
          pageSize={pageInfo.pageSize}
          total={pageInfo.total}
          onChange={(current: number, pageSize?: number) => updatePageInfo({ ...pageInfo, current, pageSize: pageSize || pageInfo.pageSize })}
        />
      </div>
      <Drawer visible={!!showCompanyId} width={786} onClose={() => setShowCompanyId('')}>
        <CompanyDetail origin="marketing" id={showCompanyId} reloadToken={0} />
      </Drawer>
      {replyListVisible && <ReplyListModal visible={replyListVisible} replyOperates={replyOperates} onCancel={() => setReplyListVisible(false)} />}
    </div>
  );
};

export default ContactDetail;
