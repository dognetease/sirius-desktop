import React, { useState, useEffect, useContext, useRef } from 'react';
import styles from './index.module.scss';
import { FacebookContext } from './facebookProvider';
import GrubProcess, { GrubProcessRef } from '../globalSearch/search/GrubProcess/GrubProcess';
import { CompanyDetail } from '../globalSearch/detail/CompanyDetail';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import { getIn18TextWithPlaceholder } from '../utils/index';
import { FacebookInput } from './facebookInput';
import { MarketingOperation } from '../LinkedInSearch/marketingOperation/index';
import { Table, Checkbox, Drawer, Space, Breadcrumb, Divider, Button, message, Skeleton, Tooltip } from 'antd';
import { EmptyPage } from '../LinkedInSearch/EmptyPage';
import { navigate } from '@reach/router';
import { ReactComponent as CertifyIcon } from './assets/certificate.svg';
import { ReactComponent as FacebookIcon } from './assets/facebookIcon.svg';
import { ReactComponent as FollowIcon } from './assets/followIcon.svg';
import { ReactComponent as ThumbsUpIcon } from './assets/thumbsUpIcon.svg';
// import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import Translate from '@/components/Layout/CustomsData/components/Translate/translate';
import SearchProgress from '../LinkedInSearch/searchProgress';
import { WhatsAppAiSearchTaskStatus } from 'api';
import classnames from 'classnames';
import { getIn18Text } from 'api';

export const FacebookPage = () => {
  const { state, updatePagination, updateSelected, updateIsInit, updateCertifyStatus, updateGrubStatus, fetchData, updateTable, updateTaskStatus, cancelTimeoutTask } =
    useContext(FacebookContext);

  const [contacts, setContacts] = useState({
    emails: [] as string[],
    phoneNums: [] as string[],
  });
  const [detailPageId, setDetailPageId] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [translateHoverIndex, setTranslateHoverIndex] = useState(-1);
  const grubProcessRef = useRef<GrubProcessRef>(null);
  const [taskMinimize, setTaskMinimize] = useState(false);
  // const [taskStatus, setTaskStatus] = useState<WhatsAppAiSearchTaskStatus>(WhatsAppAiSearchTaskStatus.STOP);
  const [taskManualStop, setTaskManualStop] = useState(false);
  const [detailReloadToken, setDetailReloadToken] = useState(Date.now());

  useEffect(() => {
    const selected = state.tableData.filter(each => {
      return state.selectedKeys.includes(each.id);
    });
    const personAddress = selected.map(each => each.contacts).flat();
    setContacts({
      emails: personAddress.filter(each => each.email && each.email.length).map(each => each.email),
      phoneNums: personAddress.filter(each => each.mobile && each.mobile.length).map(each => each.mobile),
    });
  }, [state.tableData, state.selectedKeys]);

  useEffect(() => {}, [state.isTasking]);

  const goDetailPage = (id: string) => {
    setDetailPageId(id);
    setDetailVisible(true);
  };
  const goInitPage = () => {
    updateIsInit(true);
  };
  const deepSearching = (id: string, name: string, grubStatus: string) => {
    grubProcessRef.current &&
      grubProcessRef.current.addProcess({
        id,
        name,
        grubStatus,
      });
  };

  const deepSearch = (id: string) => {
    const target = state.tableData.find(each => each.id === id);
    if (!target) {
      return;
    }
    const { name, grubStatus } = target;
    updateGrubStatus({
      id,
      grubStatus: 'GRUBBING',
    });
    deepSearching(id, name, grubStatus);
  };
  const onTaskStop = () => {
    cancelTimeoutTask();
    updateTaskStatus(0, state.total);
    updateTable({
      status: 'data',
    });
    message.warn(`${getIn18Text('StopAISearchPrefix')}${state.total}${getIn18Text('StopAISearchSuffix')}`);
  };
  const onTaskFinish = () => {
    updateTaskStatus(0, state.total);
  };

  if (state.isInit) {
    return null;
  }

  const tableJSX = (
    <Table
      dataSource={state.tableData}
      className={styles.result}
      tableLayout="fixed"
      rowKey={record => record.id}
      columns={[
        {
          title: getIn18Text('GONGSIMINGCHENG'),
          dataIndex: 'company',
          width: 200,
          render(text: string, record) {
            const { name, facebookLink, thumbsUp, follow, isCertify, heightLightName } = record;
            const displayLinkText = facebookLink;
            let link = '';
            if (link === '')
              if (facebookLink) {
                link = facebookLink.startsWith('http') ? facebookLink : 'http://' + facebookLink;
              } else {
                link = '-';
              }
            return (
              <div className={styles.company}>
                <div className={styles.title}>
                  <div
                    className={classnames(styles.titleWrapper, styles.textOverflow)}
                    style={{
                      maxWidth: isCertify ? 200 - 16 : 200,
                    }}
                  >
                    <span
                      dangerouslySetInnerHTML={{
                        __html: heightLightName,
                      }}
                    ></span>
                  </div>
                  {isCertify && (
                    <div className={styles.iconWrapper}>
                      <Tooltip title={getIn18Text('certifyPage')}>
                        <CertifyIcon />
                      </Tooltip>
                    </div>
                  )}
                </div>
                <div className={styles.link}>
                  <div className={styles.iconWrapper}>
                    <FacebookIcon />
                  </div>

                  {link === '-' ? (
                    <span className={styles.text}>-</span>
                  ) : (
                    <a
                      className={styles.text}
                      href={link}
                      target="_blank"
                      onClick={e => {
                        e.stopPropagation();
                      }}
                    >
                      {displayLinkText}
                    </a>
                  )}
                </div>
                <div className={styles.info}>
                  <Space size={4}>
                    <span className={styles.infoExtra}>
                      <FollowIcon />
                      <span className={styles.text}>{follow}</span>
                    </span>
                    <Divider type="vertical" />
                    <span className={styles.infoExtra}>
                      <ThumbsUpIcon />
                      <span className={styles.text}>{thumbsUp}</span>
                    </span>
                  </Space>
                </div>
              </div>
            );
          },
        },
        {
          title: getIn18Text('XIANGGUANXINXI'),
          dataIndex: 'information',
          render(text: string, record, index) {
            const { information } = record;
            return (
              <div className={styles.information} onMouseEnter={() => setTranslateHoverIndex(index)} onMouseLeave={() => setTranslateHoverIndex(-1)}>
                {information}
                {translateHoverIndex === index && information.length && <Translate bodyContainer={true} classnames={styles.translate} title={information} />}
              </div>
            );
          },
        },
        {
          title: getIn18Text('LIANXIRENYOUXIANG'),
          dataIndex: 'emails',
          render(text: string, record) {
            const { contacts } = record;
            const emails = contacts.filter(each => each.email && each.email.length > 0).map(each => each.email);
            if (emails.length === 0) {
              return '-';
            }

            return (
              <div className={styles.contact}>
                <div className={styles.textOverflow}>{emails[0]}</div>
                {emails.length > 1 && <a>{getIn18TextWithPlaceholder('seeAllMails', emails.length)}</a>}
              </div>
            );
          },
        },
        {
          title: getIn18Text('contactMobiles'),
          dataIndex: 'mobiles',
          render(text: string, record) {
            const { contacts } = record;
            const mobiles = contacts.filter(each => each.mobile && each.mobile.length > 0).map(each => each.mobile);
            if (mobiles.length === 0) {
              return '-';
            }

            return (
              <div className={styles.contact}>
                <div className={styles.textOverflow}>{mobiles[0]}</div>
                {mobiles.length > 1 && <a>{getIn18TextWithPlaceholder('seeAllNumbers', mobiles.length)}</a>}
              </div>
            );
          },
        },
        {
          title: getIn18Text('CAOZUO'),
          dataIndex: 'operation',
          render(text: string, record) {
            const { contacts, grubStatus, name, id } = record;
            const mobiles = contacts.filter(each => each.mobile && each.mobile.length > 0).map(each => each.mobile);
            const emails = contacts.filter(each => each.email && each.email.length > 0).map(each => each.email);

            return (
              <div onClick={e => e.stopPropagation()}>
                <Space direction="vertical" className={styles.op}>
                  <Button
                    disabled={grubStatus === 'GRUBBED'}
                    onClick={() => {
                      // deepSearching(id, name, grubStatus);
                      // updateGrubStatus({
                      //   id,
                      //   grubStatus: 'GRUBBING'
                      // });
                      deepSearch(id);
                    }}
                    loading={grubStatus === 'GRUBBING'}
                    type="primary"
                    style={{ minWidth: 100 }}
                  >
                    {grubStatus === 'NOT_GRUBBING' ? getIn18Text('SHENWALIANXIREN') : grubStatus === 'GRUBBING' ? getIn18Text('WAJUEZHONG...') : getIn18Text('YIWAJUE')}
                  </Button>
                  <MarketingOperation emails={emails} phoneNums={mobiles} buttonProps={{ className: styles.marketing }} />
                </Space>
              </div>
            );
          },
        },
      ]}
      onRow={(record: any) => {
        return {
          onClick: () => {
            const { id } = record;
            goDetailPage(id);
          },
        };
      }}
      locale={{
        emptyText: () => {
          return (
            <EmptyPage
              linkList={[
                {
                  label: getIn18Text('searchCompanyInGlobal'),
                  onClick: () => {
                    navigate(`#wmData?page=globalSearch&type=company&keywords=${state.query}`);
                  },
                },
                {
                  label: getIn18Text('HAIGUANSHUJU'),
                  onClick: () => {
                    navigate('#wmData?page=customs');
                  },
                },
              ]}
            />
          );
        },
      }}
      rowSelection={{
        selectedRowKeys: state.selectedKeys,
        onChange: keys => {
          updateSelected(keys as string[]);
        },
      }}
      pagination={{
        className: 'pagination-wrap',
        size: 'small',
        pageSize: state.pageSize,
        total: state.total,
        current: state.page,
        hideOnSinglePage: true,
        showQuickJumper: true,
        onChange: (page, pageSize) => {
          if (state.query.length < 2) {
            message.error(getIn18Text('queryNotLongTip'));
            return;
          }
          updatePagination({
            page,
            pageSize,
          });
          updateTable({
            total: 0,
            tableData: [],
            status: 'loading',
          });
          fetchData(false, page, pageSize);
        },
        showTotal: (_total: number) => {
          return (
            <span style={{ position: 'absolute', left: 0 }}>
              {getIn18Text('TotalDataPart1')}
              {Number(_total).toLocaleString()}
              {getIn18Text('TotalDataPart2')}
            </span>
          );
        },
      }}
    />
  );

  return (
    <div className={styles.page}>
      <Breadcrumb className={styles.pageBread} separator={<SeparatorSvg />}>
        <Breadcrumb.Item>
          <a
            onClick={e => {
              e.preventDefault();
              goInitPage();
            }}
          >
            <span>{getIn18Text('getClientFromSocial')}</span>
          </a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <span>{'Facebook' + getIn18Text('SOUSUO')}</span>
        </Breadcrumb.Item>
      </Breadcrumb>
      <div className={styles.pageSearch}>
        <FacebookInput isBorder={true} />
      </div>
      <div className={styles.pageTable}>
        <div className={styles.filter}>
          <MarketingOperation disabled={!state.selectedKeys.length} emails={contacts.emails} phoneNums={contacts.phoneNums} />
          <div className={styles.checkbox}>
            <Checkbox checked={state.isCertify} onChange={e => updateCertifyStatus(e.target.checked)} />
            <span style={{ marginLeft: 9 }}>{getIn18Text('seeCertifyLink')}</span>
          </div>
        </div>
        {state.tableStatus === 'loading' ? <Skeleton active /> : tableJSX}
      </div>
      {/* <GrubProcess
      // 提取为外贸大数据全局组件
      // 用事件的方式传递消息
      // 见 packages/web/src/components/Layout/globalSearch/search/GrubProcess/GrubProcess.tsx
      // 中事件监听的用法，列表页主要是监听任务成功事件
      /> */}
      <SearchProgress
        visible={state.isTasking}
        total={state.extraTotal}
        minimize={taskMinimize}
        taskStatus={state.isTasking ? WhatsAppAiSearchTaskStatus.SEARCHING : WhatsAppAiSearchTaskStatus.STOP}
        isManualStop={taskManualStop}
        onMinimizeChange={setTaskMinimize}
        onStop={onTaskStop}
        onFinish={onTaskFinish}
        translateKeyList={['facebookTaskDesc1', 'facebookTaskDesc2', 'facebookTaskDesc3', 'facebookTaskDesc4', 'facebookTaskDesc5']}
      />
      <Drawer
        visible={detailVisible}
        onClose={() => {
          setDetailVisible(false);
          setDetailPageId('');
        }}
        closable={false}
        width={872}
        zIndex={1000}
      >
        {detailVisible ? (
          <CompanyDetail scene="facebook" id={detailPageId} onDeepSearchContact={deepSearch} reloadToken={detailReloadToken} showNextDetail={id => {}} />
        ) : null}
      </Drawer>
    </div>
  );
};
