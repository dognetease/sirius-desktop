import React, { FC, MouseEvent, useEffect, useState } from 'react';
import { getIn18Text, GetDiagnosisDetailRes, apiHolder, apis, EdmSendBoxApi, GetSummaryInfoRes, GetSummaryDomainRes } from 'api';
import classnames from 'classnames';
import { Skeleton } from 'antd';
import { Typography, message } from 'antd';
import moment from 'moment';
import { navigate, useLocation } from '@reach/router';

// import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import Breadcrumb from '@lingxi-common-component/sirius-ui/Breadcrumb';
import { AiWriteMailReducer, useActions, useAppSelector } from '@web-common/state/createStore';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import { ReactComponent as Icon } from '@/images/icons/edm/yingxiao/alert.svg';
import { ReactComponent as ArrowIcon } from '@/images/icons/edm/yingxiao/arrow-right.svg';
import { ReactComponent as Icon2 } from '@web-common/images/newIcon/tongyong_guanbi_xian.svg';
import { ReactComponent as ImproveIcon } from '@/images/icons/edm/yingxiao/improve-icon.svg';
import { ReactComponent as SendedIcon } from '@/images/icons/edm/yingxiao/sended-icon.svg';
import { ReactComponent as ReceivedIcon } from '@/images/icons/edm/yingxiao/received-emails.svg';
import { ReactComponent as SuggestIcon } from '@/images/icons/edm/yingxiao/suggest.svg';
import { ReactComponent as OpenedIcon } from '@/images/icons/edm/yingxiao/opened-count.svg';
import { ReactComponent as TongyongShuomingXian } from '@web-common/images/newIcon/tongyong_shuoming_xian.svg';
import { ReactComponent as ReplyIcon } from '@/images/icons/edm/yingxiao/reply-count.svg';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
// import ToolTips from '@web-common/components/UI/Tooltip';
import ToolTips from '@lingxi-common-component/sirius-ui/Tooltip';
import type { ColumnType } from 'antd/lib/table';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import { getSendCount } from '@/components/Layout/Customer/components/hooks/useEdmSendCount';

import { OverflowShowTooltips } from '../components/OverflowShowTooltips';
import { edmDataTracker } from '../tracker/tracker';

import CompareNum from './compare/compare_num';
import CompareProgress from './compare/compare_progress';
import CompareSingleBar from './compare/compare_single_bar';
import CompareMultiBar from './compare/compare_multi_bar';

import { TradeMap, TradeMapType } from './TradeMap';
import { FailedReason } from './FailedReason';
import { Loading } from './Loading';
import styles from './TaskDiagnosis.module.scss';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

// 去发信
const systemApi = apiHolder.api.getSystemApi();
const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';
// 去写信
const handleAddNew = (pageName: string) => {
  navigate(`${routerWord}?page=${pageName}`);
};
// 去搜索
const goSearch = () => {
  edmDataTracker.belowfourCustomersdagnoseClick(1);
  const hash = systemApi.isWebWmEntry() ? '#wmData?page=globalSearch' : '#wmData';
  navigate(hash);
};
// 去添加
const goAddNew = () => {
  edmDataTracker.belowfourCustomersdagnoseClick(2);
  getSendCount({
    emailList: [],
    from: 'taskzhenduan',
    sendType: 'filter',
    back: encodeURIComponent(`${routerWord}?page=index&zhenduan=add`),
  });
};
// 去发信
const goSend = (type: number) => {
  edmDataTracker.belowfourCustomersdagnoseClick(type);
  getSendCount({
    emailList: [],
    from: 'taskzhenduan',
    back: encodeURIComponent(`${routerWord}?page=index&zhenduan=send`),
  });
};
// 大于4000 建议汇总点击
const diagnosisItemClick = (text: string) => {
  if (text.includes('安全发信')) {
    edmDataTracker.upfourCustomersdagnoseClick(0);
  } else if (text.includes('千邮千面')) {
    edmDataTracker.upfourCustomersdagnoseClick(1);
  } else if (text.includes('营销托管')) {
    edmDataTracker.upfourCustomersdagnoseClick(2);
  } else if (text.includes('优质域名')) {
    edmDataTracker.upfourCustomersdagnoseClick(3);
  }
};

const { Paragraph } = Typography;
const TotalSendCount = 4000;
// 不可发信的域名
const PRESENT = 'ntesmail.com';
const BounceTitle = '收件方邮箱不可用或不存在';
const RejectTitle = '收件方邮箱不可用或不存在';
// 优秀企业数据
const recommendData = {
  name: '优秀企业',
  sendCount: 200,
  averageSendCount: 20,
  maxSendCount: 50,
};
// 营销地址来源
const sourceMap: Record<
  string,
  {
    name: string;
    value: number;
  }
> = {
  globalSearchCount: {
    name: '全球搜索发送量',
    value: 1200,
  },
  customsCount: {
    name: '海关数据发送量',
    value: 800,
  },
  manualCount: {
    name: '手动添加发送量',
    value: 1200,
  },
  importCount: {
    name: '文件导入发送量',
    value: 800,
  },
};

const recommendSendData = {
  sendCount: 4000,
  email: '优秀企业',
  averageSendCount: 500,
  maxSendCount: 0,
};

const OverviewConf = [
  {
    title: '发送封数',
    key: 'sendCount',
    icon: <SendedIcon />,
  },
  {
    title: '送达封数',
    key: 'arriveCount',
    icon: <ReceivedIcon />,
    sub: {
      title: '送达率：',
      key: 'arriveRate',
    },
    improveUrl: '/d/1640684506989031426.html',
  },
  {
    title: '打开人数',
    key: 'readCount',
    icon: <OpenedIcon />,
    sub: {
      title: '打开率：',
      key: 'readRate',
    },
    improveUrl: '/d/1674041360610545665.html',
  },
  {
    title: '回复人数',
    key: 'replyCount',
    icon: <ReplyIcon />,
    sub: {
      title: '回复率：',
      key: 'replyRate',
    },
    // improveUrl: '',
  },
] as const;

const columns: ColumnType<GetSummaryDomainRes[number]['verify'][number]>[] = [
  {
    title: '认证信息',
    width: 101,
    dataIndex: 'key',
    key: 'key',
  },
  {
    title: '主机记录',
    width: 136,
    dataIndex: 'record',
    key: 'record',
  },
  {
    title: '记录类型',
    width: 88,
    dataIndex: 'recordType',
    key: 'recordType',
  },
  {
    title: '验证状态',
    width: 88,
    dataIndex: 'verifyStatus',
    key: 'verifyStatus',
    render: (_, record) =>
      record.verifyStatus === 1 ? <div>验证成功</div> : record.verifyStatus === 2 ? <div className={styles.mark}>验证失败</div> : <div>验证中</div>,
  },
  {
    title: '优先级',
    width: 74,
    dataIndex: 'priority',
    key: 'priority',
    render: text => <div className={styles.ellipsis}>{text ?? '-'}</div>,
  },
  {
    title: '实际配置',
    // width: 216,
    dataIndex: 'realConfig',
    key: 'realConfig',
    render: text => (
      <>
        {/* <div className={classnames(styles.realConf, styles.ellipsis)}></div> */}
        <OverflowShowTooltips className={classnames(styles.realConf, styles.ellipsis)} value={text ?? '-'} />
      </>
    ),
  },
  {
    title: '推荐配置',
    width: 225,
    dataIndex: 'recommendConfig',
    key: 'recommendConfig',
    render: text => (
      <div className={styles.tableItem}>
        {/* <div className={styles.ellipsis}>{text ?? '-'}</div> */}
        <OverflowShowTooltips className={styles.ellipsis} value={text || '-'} />
        {/* <div className={styles.copy}>复制</div> */}
        {text && (
          <Paragraph
            copyable={{
              icon: [
                <div className={styles.copy} key="copy-icon">
                  复制
                </div>,
                <div className={styles.copy} key="copied-icon">
                  复制
                </div>,
              ],
              text,
              onCopy: () => {
                message.success('复制成功');
              },
              tooltips: false,
            }}
          ></Paragraph>
        )}
      </div>
    ),
  },
];

const ContentKeyType = {
  template: 'template',
  copy: 'copy',
  mutipleContent: 'mutipleContent',
} as const;

const ContentTableData = [
  {
    key: 'template',
    title: '模板',
    bestCompany: '相同内容被发送2000次后进行更换',
  },
  {
    key: 'copy',
    title: '复制任务',
    bestCompany: '相同内容被发送2000次后进行更换',
  },
  {
    key: 'mutipleContent',
    title: '千邮千面',
    bestCompany: '开启率80%以上',
  },
] as const;

// 趋势图配置，发送封数，送达封数，打开封数
const TradeMapConf = [
  {
    key: 'sendCount',
    title: '发送封数',
    recommend: 500,
  },
  {
    key: 'arriveCount',
    title: '送达封数',
    recommend: 490,
  },
  {
    key: 'readCount',
    title: '打开人数',
    recommend: 75,
  },
  // {
  //   key: 'replyCount',
  //   title: '回复人数',
  // },
] as const;

export const TaskDiagnosis: FC<{
  goBack: () => void;
  // diagnosisDetail?: GetDiagnosisDetailRes;
}> = props => {
  // const [data, setData] = useState<GetSummaryInfoRes>({
  //   stats: {
  //     sendCount: 5000,
  //     arriveCount: 12,
  //     arriveRate: '40%',
  //     readCount: 10,
  //     readRate: '20%',
  //     replyCount: 0,
  //     days: [
  //       // 时间倒序
  //       {
  //         sendCount: 8,
  //         arriveCount: 7,
  //         readCount: 6,
  //         replyCount: 5,
  //         days: null,
  //       },
  //       {
  //         sendCount: 7,
  //         arriveCount: 6,
  //         readCount: 5,
  //         replyCount: 4,
  //         days: null,
  //       },
  //     ],
  //   },
  //   sourceStats: {
  //     globalSearchCount: 1,
  //     customsCount: 2,
  //     importCount: 5,
  //     manualCount: 12,
  //   },
  //   emailStats: [
  //     {
  //       sendCount: 12,
  //       email: '123@.com',
  //       averageSendCount: 0,
  //       maxSendCount: 8,
  //     },
  //   ],
  //   domainStats: [
  //     {
  //       sendCount: 12,
  //       domain: 'test',
  //       averageSendCount: 1,
  //       maxSendCount: 2,
  //       sameDomainOverSendTaskCount: 3, //     单任务同企业收件人超过20人任务数
  //     },
  //   ],
  //   taskContentStats: {
  //     moreThanTenTaskCount: 10, // 发信量大于10人的任务数
  //     totalTaskCount: 10,
  //     dynamicTaskCount: 2, // 千邮千面
  //     safeTaskCount: 3,
  //     copyTaskStats: [
  //       {
  //         rootEdmEmailId: '',
  //         subject: '我是主题',
  //         taskCount: 12,
  //         sendCount: 21,
  //       },
  //     ],
  //     templateTaskStats: [
  //       {
  //         templateId: '',
  //         templateName: '我是模板',
  //         taskCount: 12,
  //         sendCount: 2,
  //       },
  //     ],
  //   },
  //   bounceStats: [
  //     {
  //       reason: '收件方邮箱不可用或不存在',
  //       count: 1,
  //     },
  //     {
  //       reason: '其他',
  //       count: 1,
  //     },
  //   ],
  //   // 拒信原因占比
  //   rejectStats: [
  //     {
  //       reason: '收件方邮箱不可用或不存在',
  //       count: 2,
  //     },
  //     {
  //       reason: '其他',
  //       count: 1,
  //     },
  //   ],
  //   domainVerifyStatusList: [
  //     {
  //       domain: 'office1@163.com',
  //       verify: [
  //         {
  //           key: '11',
  //           record: '11',
  //           recordType: '11',
  //           verifyStatus: 1,
  //           priority: 12,
  //           realConfig: '11',
  //           recommendConfig: '11',
  //         },
  //         {
  //           key: '22',
  //           record: '22',
  //           recordType: '22',
  //           verifyStatus: 0,
  //           priority: 12,
  //           realConfig: '22',
  //           recommendConfig: '22',
  //         },
  //       ],
  //     },
  //     {
  //       domain: 'office2@163.com',
  //       verify: [
  //         {
  //           key: '1122',
  //           record: '1122',
  //           recordType: '1122',
  //           verifyStatus: 0,
  //           priority: 12,
  //           realConfig: '1122',
  //           recommendConfig: '1122',
  //         },
  //         {
  //           key: '2222',
  //           record: '2222',
  //           recordType: '2222',
  //           verifyStatus: 1,
  //           priority: 12,
  //           realConfig: '2222',
  //           recommendConfig: '2222',
  //         },
  //       ],
  //     },
  //   ],
  // });
  const hostEmail = systemApi.getCurrentUser()?.id ?? '';
  const [data, setData] = useState<GetSummaryInfoRes>();
  const [loading, setLoading] = useState(true);
  const [tradeValue, setTradeValue] = useState<(typeof TradeMapConf)[number]['key']>('sendCount');
  const [tradeTitle, setTradeTitle] = useState<(typeof TradeMapConf)[number]['title']>();
  const [tradeMapValue, setTradeMapValue] = useState<TradeMapType>();
  // 发信量是否大于4000
  const [morethenLimitSend, setMorethenLimitSend] = useState(false);
  // 域名基础认证相关
  const [available, setAvailable] = useState<GetSummaryDomainRes>();
  const [domain, setDomain] = useState<string>();
  const [domainTable, setDomainTable] = useState<GetSummaryDomainRes[number]['verify']>();
  const openHelpCenter = useOpenHelpCenter();

  useEffect(() => {
    if (available && available[0] != null) {
      if (hostEmail) {
        const curDomain = available.find(item => hostEmail.includes(item.domain))!;
        if (curDomain) {
          setDomain(curDomain.domain);
        } else {
          setDomain(available[0].domain);
        }
      } else {
        setDomain(available[0].domain);
      }
    }
  }, [available]);
  // 切换了domain
  useEffect(() => {
    if (available) {
      const curDomain = available?.find(item => item.domain === domain)!;
      curDomain && setDomainTable(curDomain.verify);
    }
  }, [domain, available]);
  // 收件人质量
  const [bounceRadio, setBounceRadio] = useState<number>();
  const [rejectRadio, setRejectRadio] = useState<number>();
  useEffect(() => {
    if (data != null) {
      const moreThanCount = (data.stats?.sendCount || 0) > TotalSendCount;
      setMorethenLimitSend(moreThanCount);
      // 是否大于4000埋点
      edmDataTracker.taskListDiagnosisClick(moreThanCount ? 1 : 0);
      // 过滤掉不可发信的域名
      // setAvailable(data.domainVerifyStatusList?.filter(item => !item.domain.includes(PRESENT)));
      // 收件人质量计算
      // 计算退信率
      const bounce = data.bounceStats?.find(item => item.reason === BounceTitle);
      if (bounce && bounce.count != null) {
        let count = 0;
        data.bounceStats?.forEach(item => {
          if (item?.count != null) {
            count += item.count;
          }
        });
        count ? setBounceRadio(+((bounce.count / count) * 100).toFixed(2)) : setBounceRadio(0);
      }
      // 计算拒信
      const reject = data.rejectStats?.find(item => item.reason === RejectTitle);
      if (reject && reject.count != null) {
        let count = 0;
        data.rejectStats?.forEach(item => {
          if (item?.count != null) {
            count += item.count;
          }
        });
        count ? setRejectRadio(+((reject.count / count) * 100).toFixed(2)) : setRejectRadio(0);
      }
    }
  }, [data]);

  const { goBack } = props;
  const diagnosisDetail = useAppSelector(state => state.aiWriteMailReducer.diagnosisDetail);

  // 埋点
  useEffect(() => {
    edmDataTracker.taskDiagnosisPv();
  }, []);

  useEffect(() => {
    if (data == null) {
      return;
    }
    const curTrade = TradeMapConf.find(item => item.key === tradeValue)!;
    let curData = data.stats?.days || [];
    curData = [...curData].reverse();
    const tempData = {
      recommend: curTrade.recommend,
      data: curData.map((item, index) => {
        const name = moment()
          .subtract(14 - index, 'days')
          .format('MM-DD');
        return {
          value: item[curTrade.key],
          name,
        };
      }),
    };
    setTradeMapValue(tempData);
    setTradeTitle(curTrade.title);
  }, [tradeValue, data]);

  useEffect(() => {
    // 请求诊断数据
    edmApi
      .getSummaryInfo()
      .then(data => {
        setLoading(false);
        setTimeout(() => {
          setData(data);
        }, 200);
      })
      .catch(err => {
        message.error('获取诊断数据失败，请稍后重试！');
      });
    // 单独请求域名数据
    edmApi
      .getSummaryDomain()
      .then(res => {
        setAvailable(res?.filter(item => !item.domain.includes(PRESENT)));
      })
      .catch(err => {
        // message.error('获取诊断数据失败，请稍后重试！');
      });
  }, []);

  const renderCompanyResult = (key: keyof typeof ContentKeyType): JSX.Element => {
    if (data == null || data.taskContentStats == null) {
      return <></>;
    }
    switch (key) {
      case 'template': {
        let totalCount = 0;
        let totalCountTask = 0;
        data.taskContentStats.templateTaskStats.forEach(task => {
          totalCount += task.sendCount;
          totalCountTask += task.taskCount;
        });
        return (
          <div className={styles.list}>
            <div>
              合计发送带有邮件模板的任务数{totalCountTask}个，共发送{totalCount}次
            </div>
            <ul className={styles.listItem}>
              {data.taskContentStats.templateTaskStats.slice(0, 5).map(task => (
                <li key={task.templateId}>
                  <div className={styles.itemLine}>
                    模版《
                    <OverflowShowTooltips className={classnames(styles.contentTitle, styles.ellipsis)} value={task.templateName} />
                    》使用{task.taskCount}次，被发送{task.sendCount}次
                  </div>
                </li>
              ))}
              {/* <li key="1">
                模版《
                <OverflowShowTooltips className={classnames(styles.contentTitle, styles.ellipsis)} value="dwaddwadwadwadwadawdawdwadwadwdawda" />
                》使用30次，被发送5000次
              </li>
              <li key="2">
                模版《
                <OverflowShowTooltips className={classnames(styles.contentTitle, styles.ellipsis)} value="男鞋推广" />
                》使用30次，被发送5000次
              </li> */}
            </ul>
          </div>
        );
      }
      case 'copy': {
        let totalCountTask = 0;
        let totalCountSend = 0;
        data.taskContentStats.copyTaskStats.forEach(task => {
          totalCountSend += task.sendCount;
          totalCountTask += task.taskCount;
        });
        return (
          <div className={styles.list}>
            <div>
              {data.taskContentStats.copyTaskStats.length}个任务共被复制{totalCountTask}次，共发送{totalCountSend}次
            </div>
            <ul className={styles.listItem}>
              {data.taskContentStats.copyTaskStats.slice(0, 5).map(item => (
                <li key={item.rootEdmEmailId}>
                  <div className={styles.itemLine}>
                    任务《
                    <OverflowShowTooltips className={classnames(styles.contentTitle, styles.ellipsis)} value={item.subject} />
                    》被复制{item.taskCount}次，被发送{item.sendCount}次
                  </div>
                </li>
              ))}
              {/* <li>
                任务《
                <OverflowShowTooltips className={classnames(styles.contentTitle, styles.ellipsis)} value="品牌主力男鞋推广" />
                》被复制30次，被发送9000次
              </li>
              <li>
                任务《
                <OverflowShowTooltips className={classnames(styles.contentTitle, styles.ellipsis)} value="品牌主力男鞋推广" />
                》被复制30次，被发送9000次
              </li> */}
            </ul>
          </div>
        );
      }
      case 'mutipleContent': {
        let radio = data.taskContentStats.moreThanTenTaskCount
          ? ((data.taskContentStats.dynamicTaskCount / data.taskContentStats.moreThanTenTaskCount) * 100).toFixed(2) + '%'
          : '0%';
        return (
          <div>
            大于10人的发送任务{data.taskContentStats.moreThanTenTaskCount}个，开启千邮千面发送任务{data.taskContentStats.dynamicTaskCount}个，占比{radio}
          </div>
        );
      }
    }
  };

  const ContentTableColumns: ColumnType<any>[] = [
    {
      title: '分类',
      width: 120,
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '贵司结果',
      width: 500,
      dataIndex: 'key1',
      key: 'key1',
      render: (_, item) => renderCompanyResult(item.key),
    },
    {
      title: '优秀企业',
      // width: 101,
      dataIndex: 'bestCompany',
      key: 'bestCompany',
    },
  ];

  const renderWrap = (children: JSX.Element) => (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Breadcrumb separator={<SeparatorSvg />}>
            <Breadcrumb.Item className={styles.breadcrumb} onClick={goBack}>
              任务列表
            </Breadcrumb.Item>
            <Breadcrumb.Item>诊断与建议</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        <div className={styles.tipsInfo}>*数据来源：按照实际发信时间筛选近14天发送数 (不包含当天)</div>
      </div>
      {children}
    </div>
  );

  if (data == null || loading) {
    return renderWrap(
      <div className={classnames(styles.sectionWrap, styles.sectionWrapSpin)}>
        <Loading loading={loading} />
      </div>
    );
  }

  const renderDiagnosis = () => {
    if (!morethenLimitSend) {
      return (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>建议汇总</div>
          <div className={classnames(styles.sectionContent, styles.sectionContent2)}>
            <div className={classnames(styles.info, styles.info1)}>
              根据近14天发信数据，已为您诊断出以下
              <span className={styles.mark}>1</span>
              条优化建议，请按建议操作，能更好的提升营销效果
            </div>
            <div className={styles.tipsItem}>
              <div className={styles.tipsItemInfo}>
                <div className={styles.tipsItemInfoTitle}>
                  <Icon className={classnames(styles.tipsItemInfoIcon)} />
                  <div>发信量低，提升营销效果的基础是提升发信量</div>
                </div>
                <div className={styles.tipsItemInfoBottom}>
                  <Icon className={classnames(styles.tipsItemInfoIcon, styles.hide)} />
                  <span className={classnames(styles.tipsBottomInfo)}>
                    “近14天您的总发信量为{data.stats?.sendCount || 0}封相比与优秀企业近14天发信量{TotalSendCount}封还有提升空间”
                  </span>
                  <a onClick={() => goSend(0)}>
                    <div className={classnames(styles.tipsBottomAction)}>去发信</div>
                    {/* <div className={styles.tipsBottomIcon}>{tipItem.action.text}</div> */}
                    <ArrowIcon className={styles.tipsBottomIcon} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <>
        {diagnosisDetail != null && diagnosisDetail?.diagnosisList.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>建议汇总</div>
            <div className={classnames(styles.sectionContent, styles.sectionContent2)}>
              <div className={classnames(styles.info, styles.info1)}>
                {getIn18Text('YIWEININZHENDUANCHUYI')}
                <span className={styles.mark}>{diagnosisDetail?.diagnosisList.length}</span>
                {getIn18Text('TIAOYOUHUAJIANYI，QING')}
              </div>
              {renderTipsItem()}
            </div>
          </div>
        )}
      </>
    );
  };

  const renderTipsItem = () =>
    diagnosisDetail?.diagnosisList.map((tipItem, index) => (
      <div key={index} className={styles.tipsItem}>
        <div className={styles.tipsItemInfo}>
          <div className={styles.tipsItemInfoTitle}>
            <Icon className={classnames(styles.tipsItemInfoIcon, tipItem.level === 1 ? styles.tipsItemInfoIcon2 : '')} />
            <div>{tipItem.problem}</div>
          </div>
          <div className={styles.tipsItemInfoBottom}>
            <Icon className={classnames(styles.tipsItemInfoIcon, styles.hide)} />
            <span className={classnames(styles.tipsBottomInfo)}>“{tipItem.solution}”</span>
            {tipItem.jumpText && (
              <a target="_blank" href={tipItem.jumpUrl} onClick={() => diagnosisItemClick(tipItem.solution)}>
                <div className={classnames(styles.tipsBottomAction)}>{tipItem.jumpText}</div>
                {/* <div className={styles.tipsBottomIcon}>{tipItem.action.text}</div> */}
                <ArrowIcon className={styles.tipsBottomIcon} />
              </a>
            )}
          </div>
        </div>
      </div>
    ));

  const onKnowledgeCenterClick = (e: MouseEvent, url?: string) => {
    if (url) {
      openHelpCenter(url);
      e.preventDefault();
    }
  };

  const renderOverview = () =>
    OverviewConf.map(conf => (
      <div className={styles.overviewItem}>
        {/* <div className={styles.overviewItemIcon}></div> */}
        {conf.icon}
        <div className={styles.overviewItemRight}>
          <div className={styles.itemTitle}>{conf.title}</div>
          <div className={styles.itemCount}>{data.stats[conf.key]}</div>
          {(conf as any)?.sub != null && (
            <div className={styles.itemSub}>
              <div className={styles.itemSubTitle}>{(conf as any).sub.title}</div>
              <div className={styles.itemSubCount}>{data.stats[(conf as any).sub.key]}</div>
            </div>
          )}
        </div>
        {(conf as any)?.improveUrl != null && (
          <a className={styles.improve} href="" onClick={e => onKnowledgeCenterClick(e, (conf as any)?.improveUrl)} target="_blank">
            <div className={styles.improveTitle}>去提升</div>
            <ImproveIcon />
          </a>
        )}
      </div>
    ));

  // 只增加过滤条件，拼接条件服务端做了
  const transformSendEmail = (
    curData: Array<{
      name: string;
      value: number;
    }>
  ) => {
    return curData.filter(data => !data.name.includes(PRESENT));
    // let curArr: Array<{
    //   name: string;
    //   value: number;
    // }> = [];
    // if (available) {
    //   available.forEach(item => {
    //     if (data.emailStats?.find(item1 => item1.email === item.domain) == null) {
    //       curArr.push({
    //         name: item.domain,
    //         value: 0,
    //       });
    //     }
    //   });
    // }
    // return [...curData, ...curArr];
  };

  const transformSendEmail2 = (
    curData: {
      sendCount: number;
      email: string;
      averageSendCount: number;
      maxSendCount: number;
    }[]
  ) => {
    return curData
      .filter(data => !data.email.includes(PRESENT))
      .sort((pre, next) => next.sendCount - pre.sendCount)
      .slice(0, 5);
    // let curArr: {
    //   sendCount: number;
    //   email: string;
    //   averageSendCount: number;
    //   maxSendCount: number;
    // }[] = [];
    // if (available) {
    //   available.forEach(item => {
    //     if (data.emailStats?.find(item1 => item1.email === item.domain) == null) {
    //       curArr.push({
    //         sendCount: 0,
    //         email: item.domain,
    //         averageSendCount: 0,
    //         maxSendCount: 0,
    //       });
    //     }
    //   });
    // }
    // return [...curData, ...curArr].sort((pre, next) => next.sendCount - pre.sendCount).slice(0, 5);
  };

  const renderRecipient = () => {
    if (morethenLimitSend) {
      return (
        <>
          {/* 三个柱状图 */}
          {data.emailStats && (
            <div className={styles.reasonWrap}>
              <div className={classnames(styles.reasonItem, styles.reasonItem2)} key={1}>
                <CompareSingleBar
                  recommendValue={4000}
                  data={transformSendEmail(
                    data.emailStats.map(email => ({
                      name: email.email,
                      value: email.sendCount,
                    }))
                  )}
                  title="单域名发件地址总发送量"
                  titleLineColor="#4C6AFF"
                />
              </div>
              <div className={classnames(styles.reasonItem, styles.reasonItem2)} key={2}>
                <CompareSingleBar
                  recommendValue={500}
                  data={transformSendEmail(
                    data.emailStats.map(email => ({
                      name: email.email,
                      value: email.averageSendCount,
                    }))
                  )}
                  title="单域名发件地址日均发送量"
                  titleLineColor="#0FD683"
                />
              </div>
              <div className={classnames(styles.reasonItem, styles.reasonItem2)} key={3}>
                <CompareSingleBar
                  recommendValue={500}
                  data={transformSendEmail(
                    data.emailStats.map(email => ({
                      name: email.email,
                      value: email.maxSendCount,
                    }))
                  )}
                  title="单域名发件地址单日最大发送量"
                  titleLineColor="#FFB54C"
                />
              </div>
            </div>
          )}
          {/* 同企业收件人 */}
          <div className={styles.reasonWrap}>
            <div className={classnames(styles.reasonItem, styles.reasonItem2)} key={3}>
              <CompareMultiBar
                type="domain"
                data={[
                  recommendData,
                  ...(data.domainStats ?? [])
                    .map(item => ({
                      name: item.domain,
                      sendCount: item.sendCount,
                      averageSendCount: item.averageSendCount,
                      maxSendCount: item.maxSendCount,
                    }))
                    .sort((pre, next) => next.sendCount - pre.sendCount)
                    .slice(0, 5),
                ]}
                title={
                  <div className={styles.tooltipsHeader}>
                    同企业收件人
                    <ToolTips title="被多次营销的企业 (前5名) 发送数据">
                      <TongyongShuomingXian className={styles.tooltipsIcon} />
                    </ToolTips>
                  </div>
                }
                titleLineColor="#A259FF"
                needAxisEllipsis
              />
            </div>
          </div>
          {/* 总结 */}
          <div className={styles.reasonWrap}>
            {data.domainStats != null && data.domainStats[0] != null && (
              <div
                style={{
                  height: 160,
                }}
                className={classnames(styles.reasonItem, styles.reasonItem2)}
                key={3}
              >
                <CompareNum
                  title="单任务同企业收件人超过20人任务数"
                  info="优秀企业"
                  controlValue={5}
                  value={data.domainStats[0].sameDomainOverSendTaskCount}
                  // value={120}
                />
              </div>
            )}
            {data.taskContentStats != null && (
              <div
                style={{
                  height: 160,
                }}
                className={classnames(styles.reasonItem, styles.reasonItem2)}
                key={4}
              >
                <CompareProgress
                  title="安全发信开启率"
                  value={[
                    { intro: '优秀企业', percent: 80, strokeColor: '#E1E3E8' },
                    {
                      intro: '贵司结果',
                      percent: data.taskContentStats?.moreThanTenTaskCount
                        ? +(data.taskContentStats.safeTaskCount / data.taskContentStats.moreThanTenTaskCount).toFixed(2) * 100
                        : 0,
                      strokeColor: 'linear-gradient(180deg, rgba(76, 106, 255, 0.70) 0%, #4C6AFF 100%)',
                    },
                  ]}
                />
              </div>
            )}
          </div>
        </>
      );
    }
    return (
      <div className={styles.reasonWrap}>
        {data.sourceStats && (
          <div className={classnames(styles.reasonItem, styles.reasonItem2)} key={3}>
            <CompareMultiBar
              type="source"
              data={Object.keys(data.sourceStats).map(item => ({
                name: sourceMap[item].name,
                curValue: sourceMap[item].value,
                value: data.sourceStats ? data.sourceStats[item] : [],
              }))}
              title="营销地址来源统计"
              titleLineColor="#4C6AFF"
            />
          </div>
        )}
        {data.emailStats && (
          <div className={classnames(styles.reasonItem, styles.reasonItem2)} key={4}>
            <CompareMultiBar
              type="sendEmail"
              data={[{ name: '总发信量' }, { name: '发件地址日均发送量' }]}
              secondList={transformSendEmail2(data.emailStats)}
              title="发件地址"
              titleLineColor="#00CCAA"
              needLegendEllipsis
            />
          </div>
        )}
      </div>
    );
  };

  const renderDomainSection = () => (
    <>
      {/* 域名基础认证 */}
      <div
        className={styles.sectionContent}
        style={{
          marginTop: 16,
        }}
      >
        <div className={styles.sectionContentHeader1}>
          <div className={styles.sectionContentHeader}>域名基础认证</div>
          <div className={styles.headerSelect}>
            <div className={styles.selectIcon}>@</div>
            <div className={styles.line}></div>
            <EnhanceSelect
              style={{ width: 169 }}
              // placeholder={getIn18Text('RENWUXINJIANZHUANGTAI')}
              // suffixIcon={<DownTriangle />}
              value={domain}
              onChange={setDomain}
              // dropdownClassName="edm-selector-dropdown"
              // className={style.borderSelect}
              bordered={false}
            >
              {available?.map(item => (
                <InSingleOption value={item.domain} key={item.domain}>
                  {item.domain}
                </InSingleOption>
              ))}
            </EnhanceSelect>
          </div>
        </div>
        <Table className={styles.myTable} key={domain} pagination={false} bordered columns={columns} dataSource={domainTable} />
        <div
          style={{
            marginTop: 12,
          }}
          className={styles.tipsInfo}
        >
          *可联系您的专属客户经理协助升级配置
        </div>
      </div>
    </>
  );

  // 发送数据优化建议
  const renderSendDataTips = () => {
    // if (data.stats == null) {
    //   return <></>;
    // }
    if (morethenLimitSend) {
      let renderLi1 = null;
      if (
        data.emailStats != null &&
        (data.emailStats.some(item => item.sendCount > 4000) ||
          data.emailStats.some(item => item.averageSendCount > 500) ||
          data.emailStats.some(item => item.maxSendCount > 500))
      ) {
        renderLi1 = (
          <li className={styles.suggestWithLink}>
            您当前的发送量相比于优秀企业过于集中，建议制定合理发信计划，将发送量均衡的分散到每天，同时当您发信量较大的情况下，也可以联系您的专属客户经理咨询多域名营销功能
          </li>
        );
      }
      let renderLi2 = null;
      if (
        data.domainStats?.reduce((pre, next) => pre || next.sendCount > 200 || next.averageSendCount > 20 || next.maxSendCount > 50, false) ||
        data.domainStats == null ||
        data.domainStats[0] == null ||
        data.domainStats[0].sameDomainOverSendTaskCount > 5
      ) {
        renderLi2 = (
          <li className={styles.suggestWithLink}>
            您当前针对同一个域名企业的营销过于集中，建议进行进行筛选关键KP或者将相同企业的联系人进行拆分，通过多轮营销的方式持续的进行营销触达
          </li>
        );
      }
      let renderLi3 = null;
      if (!data.taskContentStats?.moreThanTenTaskCount || data.taskContentStats.safeTaskCount / data.taskContentStats.moreThanTenTaskCount < 0.8) {
        renderLi3 = (
          <li className={styles.suggestWithLink}>
            您当前超过10人的发件任务开启安全发送的占比低于优秀企业，建议在发送营销任务时，开启安全发送功能，系统将拟人化进行发信间隔控制
          </li>
        );
      }
      if (renderLi1 || renderLi2 || renderLi3) {
        return (
          <div className={styles.suggest}>
            <div className={styles.suggestTag}>优化建议</div>
            <ol className={styles.myOl}>
              {renderLi1}
              {renderLi2}
              {renderLi3}
            </ol>
          </div>
        );
      }
      return (
        <div className={styles.suggest}>
          <div className={styles.suggestTag}>优化建议</div>
          <ol className={styles.myOl}>
            <li className={styles.suggestWithLink}>建议在总量不变的条件下，延长发信周期，以提升送达效果</li>
            <li className={styles.suggestWithLink}>提升营销托管的使用率，在您空闲时间，一样可以进营销触达客户</li>
            <li className={styles.suggestWithLink}>您可以使用多域名营销能力，降低域名被拉黑的概率，以提升送达效果</li>
          </ol>
        </div>
      );
    }
    return (
      <div className={styles.suggest}>
        <div className={styles.suggestTag}>优化建议</div>
        <ol className={styles.myOl}>
          {(data.sourceStats == null || data.sourceStats.globalSearchCount < 1200 || data.sourceStats.customsCount < 800) && (
            <li className={styles.suggestWithLink}>
              您当前营销联系人来源于数据获客模块的数量少于优秀企业指标，建议您在数据获客模块搜索更多线索联系人来进行营销
              <a className={styles.link} onClick={goSearch}>
                <div className={classnames(styles.tipsBottomAction)}>去搜索</div>
                {/* <div className={styles.tipsBottomIcon}>{tipItem.action.text}</div> */}
                <ArrowIcon className={styles.tipsBottomIcon} />
              </a>
            </li>
          )}
          {(data.sourceStats == null || data.sourceStats.manualCount < 1200 || data.sourceStats.importCount < 800) && (
            <li className={styles.suggestWithLink}>
              您当前营销联系人来源于主动添加的数量少于优秀企业指标，建议可针对现有客户进行营销以及针对老客户进行推广
              <a className={styles.link} onClick={goAddNew}>
                <div className={classnames(styles.tipsBottomAction)}>去添加</div>
                {/* <div className={styles.tipsBottomIcon}>{tipItem.action.text}</div> */}
                <ArrowIcon className={styles.tipsBottomIcon} />
              </a>
            </li>
          )}
          {(data.stats == null || data.stats.sendCount < TotalSendCount || data.stats.sendCount / 14 < 500) && (
            <li className={styles.suggestWithLink}>
              您当前发件地址的发送数量少于优秀企业单域名发件地址的发送数量，建议您可以均衡提升每天的发送数量
              <a className={styles.link} onClick={() => goSend(3)}>
                <div className={classnames(styles.tipsBottomAction)}>去发信</div>
                {/* <div className={styles.tipsBottomIcon}>{tipItem.action.text}</div> */}
                <ArrowIcon className={styles.tipsBottomIcon} />
              </a>
            </li>
          )}
        </ol>
      </div>
    );
  };

  // 收件人质量建议
  const renderRecipientTips = () => {
    if ((bounceRadio || 0) > 20 || (rejectRadio || 0) > 20) {
      return (
        <div className={styles.suggest}>
          <div className={styles.suggestTag}>优化建议</div>
          <ol className={styles.myOl}>
            <li className={styles.suggestWithLink}>
              相比优秀企业，您退信和拒信数据中，收件方邮箱不可用或不存在原因占比过高，建议优化当前咱们收件人质量，可以进行背调和发信前进行邮箱过滤
            </li>
          </ol>
        </div>
      );
    }
    return (
      <div className={styles.suggest}>
        <div className={styles.suggestTag}>优化建议</div>
        <ol className={styles.myOl}>
          <li className={styles.suggestWithLink}>在保持收件人质量的同时，可逐步提升发信量，以提升营销覆盖面</li>
        </ol>
      </div>
    );
  };

  return renderWrap(
    <div className={styles.sectionWrap}>
      {/* todo 和发件4000封有联系吗？ */}
      {renderDiagnosis()}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>诊断总览</div>
        {/* <CompareSingleBar title="单域名发件地址总发送量" titleLineColor="#0FD683" />
        <CompareMultiBar title="同企业收件人" />
        <CompareNum title="单任务同企业收件人超过20人任务数" info="优秀企业" value={14} controlValue={75} />
        <CompareProgress
          title="安全发信开启率"
          value={[
            { intro: '优秀企业', percent: 80, strokeColor: '#E1E3E8' },
            { intro: '贵司结果', percent: 60, strokeColor: { from: 'rgba(76, 106, 255, 0.70)', to: '#4C6AFF' } },
          ]}
        /> */}
        <div className={styles.sectionContent}>
          <div className={styles.sectionContentHeader}>任务数据总览</div>
          <div className={styles.overview}>{renderOverview()}</div>
        </div>
        <div
          className={styles.sectionContent}
          style={{
            marginTop: 16,
          }}
        >
          <div className={styles.sectionContentHeader1}>
            <div className={styles.sectionContentHeader}>效果趋势</div>
            <EnhanceSelect
              style={{ width: 120 }}
              // placeholder={getIn18Text('RENWUXINJIANZHUANGTAI')}
              // suffixIcon={<DownTriangle />}
              value={tradeValue}
              onChange={setTradeValue}
              // dropdownClassName="edm-selector-dropdown"
              // className={style.borderSelect}
            >
              {TradeMapConf.map(item => (
                <InSingleOption value={item.key} key={item.key}>
                  {item.title}
                </InSingleOption>
              ))}
            </EnhanceSelect>
          </div>
          <TradeMap title={tradeTitle} data={tradeMapValue?.data || []} recommend={tradeMapValue?.recommend ?? 0} />
        </div>
      </div>
      {/* 第三部分 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          分析和建议
          <div className={styles.headerTips}>
            <SuggestIcon className={styles.headerTipsIcon} />
            更详细的诊断分析，联系您的专属客户经理进行获取
          </div>
        </div>
        {morethenLimitSend && renderDomainSection()}
        {available != null && (
          <>
            {/* 发送数据 */}
            <div
              className={styles.sectionContent}
              style={{
                marginTop: 16,
              }}
            >
              <div className={styles.sectionContentHeader1}>
                <div className={classnames(styles.sectionContentHeader, styles.tooltipsHeader)}>
                  发送数据
                  <ToolTips title="按照实际发信时间筛选近14天发送数 (不包含当天)">
                    <TongyongShuomingXian className={styles.tooltipsIcon} />
                  </ToolTips>
                </div>
              </div>
              {renderRecipient()}
              <div
                className={styles.reasonWrap}
                style={{
                  marginBottom: 0,
                }}
              >
                <div className={classnames(styles.reasonItem, styles.reasonItem3)} key={3}>
                  *剩余共 <span className={styles.reasonMark}>22项</span> 数据诊断，可联系您的专属客户经理获取
                </div>
              </div>
              {/* 建议提示 */}
              {renderSendDataTips()}
              <div
                style={{
                  marginTop: 16,
                }}
                className={styles.tipsInfo}
              >
                *更多优化建议联系您的专属客户经理获取
              </div>
            </div>
            {/* 收件人质量 */}
            {morethenLimitSend && (
              <div
                className={styles.sectionContent}
                style={{
                  marginTop: 16,
                }}
              >
                <div className={styles.sectionContentHeader1}>
                  <div className={styles.sectionContentHeader}>收件人质量</div>
                </div>
                {/* 饼图区域 */}
                <div
                  className={styles.reasonWrap}
                  style={{
                    marginBottom: 0,
                  }}
                >
                  <FailedReason
                    data={(data.bounceStats || []).map(item => ({
                      value: item.count,
                      name: item.reason,
                    }))}
                    title="退信原因占比"
                    resultTitle="退信收件方邮箱不可用或不存在"
                    currentCount={bounceRadio}
                    bestCount="20%"
                    key="1"
                  />
                  <FailedReason
                    data={(data.rejectStats || []).map(item => ({
                      value: item.count,
                      name: item.reason,
                    }))}
                    title="拒信原因占比"
                    resultTitle="拒信收件方邮箱不可用或不存在"
                    currentCount={rejectRadio}
                    bestCount="20%"
                    key="2"
                  />
                </div>
                {/* 建议提示 */}
                {renderRecipientTips()}
                <div
                  style={{
                    marginTop: 16,
                  }}
                  className={styles.tipsInfo}
                >
                  *更多优化建议联系您的专属客户经理获取
                </div>
              </div>
            )}
            {/* 内容情况 */}
            {morethenLimitSend && (
              <div
                className={styles.sectionContent}
                style={{
                  marginTop: 16,
                }}
              >
                <div className={styles.sectionContentHeader1}>
                  <div className={styles.sectionContentHeader}>内容情况</div>
                </div>
                {/* 内容情况表格 */}
                <Table className={styles.myTable} dataSource={ContentTableData} bordered columns={ContentTableColumns} pagination={false} />
                {/* 建议提示 */}
                <div className={styles.suggest}>
                  <div className={styles.suggestTag}>优化建议</div>
                  参考优秀企业内容发送数据，相同内容在发送2000次后，需要进行更换，以降低被服务商判定垃圾的情况
                </div>
                <div
                  style={{
                    marginTop: 16,
                  }}
                  className={styles.tipsInfo}
                >
                  *更多优化建议联系您的专属客户经理获取
                </div>
              </div>
            )}
          </>
        )}
        {!morethenLimitSend && renderDomainSection()}
      </div>
    </div>
  );
};
