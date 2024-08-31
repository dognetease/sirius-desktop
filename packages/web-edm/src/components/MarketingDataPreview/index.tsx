import React, { FC, useState, useRef, useEffect, useCallback } from 'react';
import { apiHolder, configKeyStore, inWindow, apis, EdmSendBoxApi, QueryReportRes } from 'api';
import { Progress, Button, message } from 'antd';
// import CaretDownOutlined from '@ant-design/icons/CaretDownOutlined';
// import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import moment from 'moment';
import { generatePdf } from '../../utils/html2pdf';

import { StatItemData } from '../../utils';
import { edmDataTracker } from '../../tracker/tracker';
import styles from './MarketingDataPreview.module.scss';
import { ComparedData } from './comparedData';
import { OpenedData } from './openedData';
import { OpenedState } from './openedState';
import { OpenedPeople } from './openedPeople';
import { OpenedEnds } from './openedEnds';
import { ReplayedData } from './replayedData';
import { ReplayedTime } from './replayedTime';
import { TdPeople } from './tdPeople';
import { LinkClickedCount } from './linkClickedCount';
import { Loading } from './Loading';
import { getIn18Text } from 'api';

const systemApi = apiHolder.api.getSystemApi();
const inElectron = apiHolder.api.getSystemApi().isElectron;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

// 单任务时长500ms
const unit_time = 500;

/**
 * 当前页面状态
 */
type PageState = 0 | 1 | 2;

const tabConf = [
  {
    title: getIn18Text('FAJIANZONGSHU'),
    dataIndex: 'sendCount',
  },
  {
    title: getIn18Text('SONGDAZONGSHU'),
    subtitle: getIn18Text('SONGDALV'),
    dataIndex: 'arriveCount',
    subIndex: 'arriveRatio',
  },
  {
    title: getIn18Text('DAKAIRENSHU'),
    dataIndex: 'readCount',
    subtitle: getIn18Text('DAKAILV'),
    subIndex: 'readRatio',
  },
  {
    title: getIn18Text('HUIFUZONGSHU'),
    dataIndex: 'replyCount',
    subtitle: getIn18Text('HUIFULV'),
    subIndex: 'replyRatio',
  },
  {
    title: getIn18Text('TUIDINGZONGSHU'),
    dataIndex: 'unsubscribeCount',
  },
  {
    title: getIn18Text('LIANJIEDIANJIRENSHU'),
    dataIndex: 'traceCount',
  },
];
/**
 * title: string;
    num: number;
    subtitle?: string;
    subnum?: string;
    hide?: boolean;
 */
const transformPreviewData = (data: any): Array<StatItemData> => {
  if (data) {
    return tabConf.map(tab => {
      return {
        title: tab['title'],
        num: data[tab['dataIndex']],
        subtitle: tab['subtitle'],
        subnum: tab['subIndex'] ? data[tab['subIndex']] : '',
      };
    });
  }
  return [];
};

let start = 0;
let timeLength = 0;

const MarketingDataPreview: FC = props => {
  const [loading, setLoading] = useState(true);
  const [loadingType, setLoadingType] = useState<0 | 1 | 2>(0);
  const [btnLoading, setBtnLoading] = useState(false);
  const [reportData, setReportData] = useState<QueryReportRes | null>(null);
  const [pageState, setPageState] = useState<PageState>(0);
  const [data, setData] = useState<Array<StatItemData>>([]);
  const contentRef = useRef<HTMLDivElement | null>(null);
  // const [time, setTime] = useState(0);
  // const [start, setStart] = useState(0);
  const [percent, setPercent] = useState(0);
  const percentRef = useRef<number>(0);
  // const timeRef = useRef<number>(0);
  // const startRef = useRef<number>(0);

  useCallback(() => {
    percentRef.current = percent;
  }, [percent]);
  // useCallback(() => {
  //   timeRef.current = time;
  // }, [time]);
  // useCallback(() => {
  //   startRef.current = start;
  // }, [startRef]);

  // todo 重写一下这个轮询方法
  const queryData = useCallback(async id => {
    let tempTime = Date.now();

    try {
      const result = await edmApi.queryReport({
        dataReportId: id,
      });
      if (result.status === 2) {
        // 埋点
        edmDataTracker.generateReportResult(getIn18Text('CHENGGONG'));
        // 时长
        edmDataTracker.generateReportTime(Date.now() - start);

        setPercent(100);
        setData(transformPreviewData(result.overviewStat));
        setReportData(result);

        setTimeout(() => {
          setLoading(false);
        }, 500);
        // 最少loading1s
        // const time = Date.now();
        // const rangeTime = time - start;
        // if (rangeTime > 0) {
        //   setTimeout(() => {
        //     setLoading(false);
        //   }, rangeTime);
        // } else {
        //   setLoading(false);
        // }
      } else if (result.status == 3) {
        edmDataTracker.generateReportResult(getIn18Text('SHIBAI'));
        setLoadingType(1);
      } else {
        setTimeQuery(id, start, timeLength, Date.now() - tempTime);
      }
    } catch (err) {
      // queryData(id);
      setLoadingType(2);
    }
  }, []);

  const setTimeQuery = useCallback(
    (id: string, start: number, time: number, curTimeRange: number) => {
      setTimeout(() => {
        if (percent < 91) {
          const temp = Date.now();
          const rangeTime = temp - curTimeRange - start;
          let cur = 0;
          if (rangeTime < time) {
            cur = +((rangeTime / time) * 100).toFixed(0);
          } else {
            cur = 90;
          }
          setPercent(cur);
        }
        void queryData(id);
      }, unit_time);
    },
    [unit_time]
  );

  const closeWindow = useCallback(() => {
    edmDataTracker.reportPageViewTime(Date.now() - start);
  }, []);

  // 获取id
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(location.search);
      const id = search.get('id');
      const count = search.get('count') || 0;
      const curTime = +count * unit_time;
      // setTime(time);
      timeLength = curTime;
      if (id) {
        // const start = Date.now();
        // setStart(start);
        start = Date.now();
        setTimeQuery(id, start, timeLength, 0);
      }

      window.addEventListener('beforeunload', closeWindow);
      // 关闭埋点
      return () => {
        window.removeEventListener('beforeunload', closeWindow);
      };
    }
  }, []);

  const TabListComp = () => {
    return data.map((stat, index) => {
      const item = Array.isArray(stat) ? stat[0] : stat;
      return (
        <div className={styles.tabItem} key={index}>
          <div className={styles.itemLeft}>
            <i className={`${styles.itemIcon} ${styles['statisticsIcon' + index]}`} />
          </div>
          <div className={styles.itemRight}>
            <div className={styles.tabItemTitle}>{item.title}</div>
            <div className={styles.tabItemNum}>{item.num}</div>
            {item.subtitle && (
              <span className={styles.subTitle}>
                {item.subtitle}:<span className={styles.subNum}>{item.subnum}</span>
              </span>
            )}
          </div>
        </div>
      );
    });
  };

  const renderItemTitle = (title: string) => (
    <div className={styles.itemTitle + ' ' + 'yingxiao-header'}>
      <div className={styles.line}></div>
      <div className={styles.title}>{title}</div>
    </div>
  );

  const renderInfo = (info: string | JSX.Element) => <div className={styles.infoBox}>{info}</div>;

  const renderHeader2 = (title: string) => (
    <div className={styles.detailItemTitle + ' ' + 'yingxiao-header'}>
      <div className={styles.circle}></div>
      <div className={styles.title2}>{title}</div>
    </div>
  );

  const renderReportContent = () => (
    <>
      {reportData?.overviewStat != null && (
        <div className={styles.reportWrapper}>
          <div className={styles.reportContentBox}>
            <div className={styles.reportContentWrapper}>
              <div className={styles.reportContent} ref={contentRef}>
                <div className={styles.itemDataBox}>
                  {renderItemTitle(getIn18Text('SHUJUGAILAN'))}
                  {renderInfo(
                    <>
                      {getIn18Text('ZHANGHAOv16')}
                      {reportData.overviewStat?.accEmailList && reportData.overviewStat?.accEmailList.join('、')}
                      {getIn18Text('FASONGLE')}
                      {reportData.overviewStat?.sendEdmCount || 0}
                      {getIn18Text('CIYINGXIAORENWU，GONG')}
                      {reportData.overviewStat?.sendEmailCount}
                      {getIn18Text('FENGYINGXIAOYOUJIAN，YOU')}
                      {reportData.overviewStat?.arriveCount}
                      {getIn18Text('GEQIANZAIKEHU。')}
                    </>
                  )}
                  <div className={styles.totalCount}>{TabListComp()}</div>
                </div>
                {reportData.compareStat && (
                  <div className={styles.itemDataBox}>
                    {renderItemTitle(getIn18Text('DUIBISHUJU'))}
                    {renderInfo(getIn18Text('GENWAIMAOTONGDEPINGJUN'))}
                    <div className={styles.chartBox}>
                      <ComparedData data={reportData.compareStat} />
                    </div>
                  </div>
                )}
                <div className={styles.dataDetail}>
                  {reportData.readStat?.readList != null && reportData.readStat?.readList.length > 0 && (
                    <>
                      <div className={styles.itemDataTitle}>
                        {renderItemTitle(getIn18Text('DAKAISHUJU'))}
                        {renderInfo(getIn18Text('DUISUOXUANYINGXIAORENWU'))}
                      </div>
                      <div className={styles.detailItem}>
                        {renderHeader2(getIn18Text('DAKAILVPAIMING：'))}
                        <div>
                          <OpenedData originData={reportData.readStat?.readList} />
                        </div>
                      </div>
                    </>
                  )}
                  {reportData.readStat?.countryList != null && reportData.readStat?.countryList.length > 0 && (
                    <div className={styles.detailItem}>
                      {renderItemTitle(getIn18Text('DAKAIYONGHUDEGUOJIA'))}
                      <div className={styles.chartBox}>
                        <OpenedState data={reportData.readStat?.countryList} />
                      </div>
                    </div>
                  )}
                  {reportData.readStat?.timeList != null && reportData.readStat?.timeList.length > 0 && (
                    <div className={styles.detailItem}>
                      {renderItemTitle(getIn18Text('DAKAIYONGHUDEDAKAI'))}
                      <div className={styles.chartBox2}>
                        <OpenedPeople data={reportData.readStat?.timeList} />
                      </div>
                    </div>
                  )}
                  {reportData.readStat?.platFormList != null && reportData.readStat?.platFormList.length > 0 && (
                    <div className={styles.detailItem}>
                      {renderItemTitle(getIn18Text('DAKAIYONGHUDEJIXING'))}
                      <div>
                        <OpenedEnds data={reportData.readStat?.platFormList} />
                      </div>
                    </div>
                  )}
                </div>
                {/* 回复数据 */}
                {reportData.replyStat && (
                  <div className={styles.dataDetail}>
                    <div className={styles.itemDataBox}>
                      {renderItemTitle(getIn18Text('HUIFUSHUJU'))}
                      {renderInfo(getIn18Text('DUISUOXUANYINGXIAORENWU'))}
                    </div>
                    {reportData.replyStat?.replyList != null && reportData.replyStat?.replyList.length > 0 && (
                      <div className={styles.detailItem}>
                        {renderHeader2(getIn18Text('HUIFULVPAIMING：'))}
                        <div>
                          <ReplayedData data={reportData.replyStat?.replyList} />
                        </div>
                      </div>
                    )}
                    {reportData.replyStat?.timeList != null && reportData.replyStat?.timeList.length > 0 && (
                      <div className={styles.detailItem}>
                        {renderHeader2(getIn18Text('DAKAIHOUHUIFUSHIJIAN'))}
                        <div className={styles.chartBox2}>
                          <ReplayedTime data={reportData.replyStat?.timeList} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* 退订数据&链接点击数据 */}
                {((reportData.unsubscribeStat != null && reportData.unsubscribeStat?.unsubscribeList != null) || reportData.traceStat?.traceList != null) && (
                  <div className={styles.dataDetail}>
                    <div className={styles.itemDataBox}>{renderItemTitle(getIn18Text('TUIDINGSHUJU&LIANJIE'))}</div>
                    {reportData.unsubscribeStat?.unsubscribeList != null && reportData.unsubscribeStat?.unsubscribeList.length > 0 && (
                      <div className={styles.detailItem}>
                        {renderHeader2(getIn18Text('TUIDINGRENSHUPAIMING：'))}
                        <div>
                          <TdPeople data={reportData.unsubscribeStat?.unsubscribeList} />
                        </div>
                      </div>
                    )}
                    {reportData.traceStat?.traceList != null && reportData.traceStat?.traceList.length > 0 && (
                      <div className={styles.detailItem}>
                        {renderHeader2(getIn18Text('LIANJIEDIANJIPAIMING：'))}
                        <div>
                          <LinkClickedCount data={reportData.traceStat?.traceList} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* 诊断分析 */}
                {reportData.analysis && (
                  <div className={styles.dataDetail}>
                    {renderItemTitle(getIn18Text('ZHENDUANFENXI'))}
                    <div
                      style={{
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      <div className={styles.chapter}>
                        {getIn18Text('NINYIGONGFASONGLE')}
                        {reportData.analysis.edmEmailSendCount}
                        {getIn18Text('CIYINGXIAORENWU。XIANG')}
                        {reportData.analysis.arriveRatioCompare}。
                        {reportData.analysis.arriveRatioCompare != null &&
                          (!reportData.analysis.arriveRatioCompare.includes(getIn18Text('DICHU')) ? (
                            <>
                              {getIn18Text('GONGXINI，YIGONGYOU')}
                              {reportData.analysis.arriveCount}
                              {getIn18Text('MINGKEHUCHENGGONGJIESHOU')}
                            </>
                          ) : (
                            <>
                              {getIn18Text('BUYAOQINEI，SONGDA')}
                              <strong>{getIn18Text('GENDUOGEYINSUXIANGGUAN')}</strong>
                              {getIn18Text('，NINZAIFASONGYOUJIAN')}
                            </>
                          ))}
                      </div>
                      <div className={styles.chapter}>
                        {getIn18Text('XIANGJIAOYUPINGJUNDAKAI')}
                        {reportData.analysis.readRatioCompare}，{/* 恭喜和不要灰心 */}
                        {!reportData.analysis.readRatioCompare.includes(getIn18Text('DICHU')) ? (
                          <>
                            {getIn18Text('GONGXINI，ZHEYIWEI')}
                            {reportData.analysis.readCount}
                            {getIn18Text('MINGSHOUJIANRENDUININDE')}
                            <strong>{getIn18Text('GENGJINGZHUN')}</strong>
                            {getIn18Text('，XIANGGUANSHUJUBIAOMING1010')}
                            <strong>{getIn18Text('BIANLIANG')}</strong>
                            {getIn18Text('、76%DEYOUJIAN')}
                            <strong>{getIn18Text('TUWENMOBAN')}</strong>
                            {getIn18Text('DEYOUJIANGENGHAODEJIE')}
                          </>
                        ) : (
                          <>
                            {getIn18Text('BUYAOHUIXIN，XIANGYAO')}
                            <strong>{getIn18Text('GENGJINGZHUN')}</strong>
                            {getIn18Text('，XIANGGUANSHUJUBIAOMING')}
                            <strong>{getIn18Text('BIANLIANG')}</strong>
                            {getIn18Text('、76%DEYOUJIAN')}
                            <strong>{getIn18Text('TUWENMOBAN')}</strong>
                            {getIn18Text('DEYOUJIANGENGHAODEJIE')}
                          </>
                        )}
                      </div>
                      <div className={styles.chapter}>
                        {reportData.analysis.countryList != null && reportData.analysis.countryList.length > 0 && (
                          <span>
                            {getIn18Text('DAKAININDEYINGXIAOYOU')}
                            <strong>{reportData.analysis.countryList.join('、')}</strong>
                            {getIn18Text('，NINZAISOUSUOKEHU')}
                          </span>
                        )}
                        {reportData.analysis.platFormList != null && reportData.analysis.platFormList.length > 0 && (
                          <>
                            {getIn18Text('DABUFENYONGHUZHUYAO')}
                            {reportData.analysis.platFormName}
                            {getIn18Text('SHEBEIDAKAIYOUJIAN，')}
                            <strong>{reportData.analysis.platFormName}</strong>
                            {getIn18Text('DEYULANZHANSHIXIAOGUO')}
                          </>
                        )}
                        {!!reportData.analysis.readHighestTime && !!reportData.analysis.replyHighestTime && (
                          <>
                            {reportData.analysis.readHighestTime && (
                              <>
                                {getIn18Text('ZAIFASONGYOUJIANHOU，')}
                                {reportData.analysis.readHighestTime}
                                {getIn18Text('DIANDAKAIDEGAILVZUI')}
                              </>
                            )}
                            {reportData.analysis.replyHighestTime && (
                              <>
                                {getIn18Text('、ZAI')}
                                {reportData.analysis.replyHighestTime}
                                {getIn18Text('DIANHUIFUDEGAILVZUI')}
                              </>
                            )}
                            {getIn18Text('，NINKEYIGENJUDA')}
                            {!!reportData.analysis.replyHighestTime && <>{getIn18Text('、DUOGUANZHUGAOFENGHUI')}</>}。
                          </>
                        )}
                      </div>
                      <div className={styles.chapter}>
                        {reportData.analysis.unsubscribeCount != null && reportData.analysis.unsubscribeCount > 1 && (
                          <span>
                            {getIn18Text('YIGONGYOU')}
                            {reportData.analysis.unsubscribeCount}
                            {getIn18Text('MINGYONGHUDIANJILETUI')}
                          </span>
                        )}
                        {reportData.analysis.clickHighestCount && reportData.analysis.clickHighestCount > 1 && (
                          <span>
                            <span
                              style={{
                                wordBreak: 'break-all',
                              }}
                            >
                              {reportData.analysis.traceHighestUrl}
                            </span>
                            {getIn18Text('LIANJIEZUISHOUHUANYING，')}
                            {reportData.analysis.clickHighestCount}
                            {getIn18Text('MINGYONGHU，DIANJILE')}
                            {reportData.analysis.clickHighestNum}
                            {getIn18Text('CI，HOUXUKEYIDUO')}
                          </span>
                        )}
                      </div>
                      <div className={styles.chapter2}>{getIn18Text('ZHU：SHUJUBAOGAONEI')}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={styles.bottomBtn}>
            <Button
              type="primary"
              loading={btnLoading}
              ghost
              onClick={() => {
                if (contentRef.current) {
                  // 埋点
                  edmDataTracker.generateReportPdfClick();

                  setBtnLoading(true);
                  generatePdf({
                    filename: `邮件营销-数据报告-${moment().format('YYYY-MM-DD-HH-mm')}`,
                    target: contentRef.current,
                  })
                    .then(() => {
                      setBtnLoading(false);
                    })
                    .catch(err => {
                      message.error(getIn18Text('SHENGCHENGpdfSHIBAI'));
                      setBtnLoading(false);
                    });
                  //   savePdf(contentRef.current, 'test').then(() => {
                  //     setBtnLoading(false);
                  //   });
                }
              }}
            >
              {getIn18Text('BAOCUNWEIPDFWEN')}
            </Button>
          </div>
        </div>
      )}
    </>
  );

  if (loading || reportData == null) {
    return <Loading percent={percent} type={loadingType} />;
  }

  return <div className={styles.outBox}>{renderReportContent()}</div>;
};

export default MarketingDataPreview;
