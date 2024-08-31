import { Popover, Skeleton, Table, Dropdown, Menu } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { navigate } from '@reach/router';
import classnames from 'classnames';

import style from '../edm.module.scss';
import { EdmPageProps } from '../pageProps';
import _ from 'lodash';
import { apiHolder, apis, EdmDraftListItem, EdmSendBoxApi } from 'api';
import toast from '@web-common/components/UI/Message/SiriusMessage';

import defaultImg from '@/images/icons/edm/default-edm-thumb.png';
import { handlePreviewImage } from '../utils';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import MoreActionIcon from '@/components/UI/Icons/svgs/MoreAction';
import { edmDataTracker, EdmDraftListOperateType, EDMPvType } from '../tracker/tracker';
import { EmptyList } from '../components/empty/empty';
import { RefreshSvg } from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { ReactComponent as CaretDownOutlined } from '@/images/icons/edm/caretDownOutlined.svg';
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/question.svg';
import { getIn18Text } from 'api';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { ReactComponent as VideoIcon } from '@/images/icons/edm/video.svg';
import { ConfigActions, useActions } from '@web-common/state/createStore';

const videoDrawerConfig = { videoId: 'V17', source: 'kehukaifa', scene: 'kehukaifa_9' };

const editMail = (item, trigger: string) => {
  edmDataTracker.trackDraftListOperation(trigger as EdmDraftListOperateType);

  // draftType: 0:普通草稿 1:分批任务草稿 6: 大发信
  if (item.draftType === 0) {
    navigate(`#edm?page=write&from=draft&id=${item.draftId}`);
  }
  if (item.draftType === 1) {
    navigate(`#edm?page=write&from=draft&id=${item.draftId}`);
  }
  if (item.draftType === 6) {
    navigate(`#edm?page=write&from=draft&id=${item.draftId}&channel=senderRotate`);
  }
};

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export const Draft: React.FC<EdmPageProps> = () => {
  // 列表数据
  const [list, setList] = useState<EdmDraftListItem[]>([]);
  // loading状态
  const [loading, setLoading] = useState(true);
  // table外层容器
  const tableScrollerRef = useRef<HTMLDivElement>(null);

  // 顶部日期
  const [tableHeaderTitle, setTableHeaderTitle] = useState(0);

  const { showVideoDrawer } = useActions(ConfigActions);

  // 根据scrollTop 设置顶部日期数据
  const getScrollHeight = () => {
    // table 的DOM
    const taleDom = tableScrollerRef.current;
    if (taleDom) {
      setTableHeaderTitle(Math.floor(taleDom.scrollTop / 113));
    }
  };
  const debounceGetScrollHeight = _.debounce(getScrollHeight, 500);
  // 获取列表数据
  const getListData = () => {
    setLoading(true);
    edmApi.getDraftList().then(data => {
      setList(data.edmDraftInfoList.filter(i => i.draftType === 0));
      setLoading(false);
    });
  };

  useEffect(() => {
    getListData();
    edmDataTracker.trackPv(EDMPvType.Draft);
  }, []);

  const handleDelete = item => {
    SiriusModal.confirm({
      title: getIn18Text('SHIFOUQUERENSHANCHU'),
      okText: getIn18Text('SHANCHU'),
      onOk: () => {
        edmDataTracker.trackDraftListOperation(EdmDraftListOperateType.Delete);
        edmApi
          .delDraftByList({ draftIds: item.draftId })
          .then(failedId => {
            if (failedId.length > 0) {
              toast.error({ content: getIn18Text('SHANCHUCAOGAOSHIBAI') });
            } else {
              const arr = list.filter(i => i.draftId !== item.draftId);
              setList(arr);
              toast.success({ content: getIn18Text('CAOZUOCHENGGONG') });
            }
          })
          .catch(data => toast.error({ content: data.message }));
      },
    });
  };

  const columns = [
    {
      width: 108,
      title: '',
      dataIndex: 'emailThumbnail',
      className: style.firstColumn,
      render(_: any, item: EdmDraftListItem) {
        const images = (item.emailThumbnail || '').split(',');
        return (
          <img
            src={images[0] || defaultImg}
            className={style.coverImage}
            style={{ width: 72, height: 72 }}
            alt={item.edmSubject}
            onClick={() => handlePreviewImage(item.emailThumbnail, item.edmSubject)}
          />
        );
      },
    },
    {
      dataIndex: '',
      key: 'edmSubject',
      ellipsis: true,
      render(_, item: EdmDraftListItem) {
        return (
          <div style={{ minHeight: 72 }}>
            <div>
              <span className={style.tableItemName}>{item.edmSubject || getIn18Text('WUZHUTI')}</span>
              <span className={`${style.tableItemState} state-${item.currentStage}`}>{getIn18Text('DAIFASONG')}</span>
              {item.draftType === 1 && <span className={`${style.tableItemState} batch`}>{getIn18Text('XUNHUANFASONG')}</span>}
            </div>
            <div className={style.draftSendTime}>
              {getIn18Text('SHANGCIBIANJISHIJIAN\uFF1A')}
              {item.editTime}
            </div>
            {item.currentStage === 3 && (
              <PrivilegeCheck resourceLabel="EDM" accessLabel="OP">
                <div className={style.tableItemTask}>
                  {getIn18Text('DANGQIANRENWUYIWANCHENGDEZHIGUOLV\uFF0CLIFASONGZHICHAZUIHOUYIBU\uFF0C')}
                  <span>
                    {getIn18Text('DIANJI')}
                    <a onClick={() => editMail(item, 'send')}>{getIn18Text('LIJIFASONG')}</a>
                  </span>
                </div>
              </PrivilegeCheck>
            )}
          </div>
        );
      },
    },
    {
      title: '',
      dataIndex: '',
      width: 185,
      key: 'updateTime',
      className: 'action-column',
      render(_, item: EdmDraftListItem) {
        return (
          <div style={{ textAlign: 'right' }}>
            <div>
              <Popover
                overlayClassName="hide-arrow"
                placement="bottomRight"
                content={
                  <div className={style.popoverContent}>
                    <div onClick={() => handleDelete(item)} className={style.popoverContentTitle}>
                      {getIn18Text('SHANCHU')}
                    </div>
                  </div>
                }
                trigger="click"
              >
                <span style={{ cursor: 'pointer' }}>
                  <MoreActionIcon />
                </span>
              </Popover>
            </div>
            <PrivilegeCheck resourceLabel="EDM" accessLabel="OP">
              <Button btnType="primary" ghost className={style.detailButton} onClick={() => editMail(item, 'edit')}>
                {getIn18Text('BIANJI')}
              </Button>
            </PrivilegeCheck>
          </div>
        );
      },
    },
  ];
  const handleAddNew = (pageName: string) => {
    edmDataTracker.trackDraftListOperation(EdmDraftListOperateType.NewObject);
    navigate(`#edm?page=${pageName}`);
  };
  const time = list[tableHeaderTitle] ? moment(list[tableHeaderTitle].editTime).format('yyyy-MM') : '';
  return (
    <PermissionCheckPage resourceLabel="EDM" accessLabel="VIEW" menu="EDM_DRAFT_LIST">
      <div className={style.draftContainer}>
        <div className={classnames(style.pageHeader, style.pageHeader2)}>
          <div className={style.rightHeader}>
            <span className={style.title}>{getIn18Text('QUANBUCAOGAO')}</span>
            {list.length > 0 && (
              <span className={style.subTitle}>
                {`${getIn18Text('JINBAOLIUZUIJINYIGEYUE')} `}
                {getIn18Text('GONG')}
                <span className={style.num}>{list.length}</span>
                {getIn18Text('TIAOCAOGAO')}
              </span>
            )}
            <a onClick={() => getListData()} className="edm-page-refresh">
              <RefreshSvg />
            </a>
          </div>

          <div className={style.rightHeader}>
            <p className={style.videoTip} onClick={() => showVideoDrawer(videoDrawerConfig)} style={{ marginRight: '16px' }}>
              <VideoIcon /> <span>快速了解邮件营销如何提升送达效果</span>
            </p>
            <PrivilegeCheck accessLabel="OP" resourceLabel="EDM">
              <Button
                btnType="primary"
                className={classnames('ant-btn-wide', 'sirius-no-drag', style.dropdownButton)}
                style={{ float: 'right', minWidth: 'auto' }}
                onClick={() => handleAddNew('write')}
              >
                {getIn18Text('XINJIANRENWU')}
              </Button>
            </PrivilegeCheck>
          </div>
        </div>
        <div className={style.draftMainContent}>
          <Skeleton active loading={loading} paragraph={{ rows: 4 }}>
            <div className={style.draftTableWrapper} ref={tableScrollerRef} onScrollCapture={debounceGetScrollHeight}>
              {list.length > 0 && (
                <Table className={style.table} rowKey="draftId" pagination={false} columns={columns} dataSource={list} showHeader={false} loading={loading} />
              )}
              {list.length === 0 && (
                <EmptyList style={{ height: '80%' }}>
                  <p>
                    {getIn18Text('DANGQIANMEIYOURENHEFAJIANRENWU')}
                    <br />
                    <PrivilegeCheck resourceLabel="EDM" accessLabel="OP">
                      {getIn18Text('QINGDIANJIXINJIAN')}
                      <a onClick={() => handleAddNew('write')}>{getIn18Text('YINGXIAORENWU')}</a>
                      {getIn18Text('HUO')}
                    </PrivilegeCheck>
                  </p>
                </EmptyList>
              )}
            </div>
          </Skeleton>
        </div>
      </div>
    </PermissionCheckPage>
  );
};

export default Draft;
