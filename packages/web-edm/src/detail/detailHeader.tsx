import React, { useState, useEffect } from 'react';
import { apiHolder, apis, EdmEmailInfo, EdmSendBoxApi, TemplateInfoModal, DataStoreApi, ResponseSendBoxDetail } from 'api';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { EdmDetailOperateType, edmDataTracker } from '../tracker/tracker';
import { Tooltip, Space, Button } from 'antd';
import defaultImg from '@/images/icons/edm/default-edm-thumb.png';
import { SaveAsTemplateModal } from '../mailTemplate/template/saveAsTemplate';
import { handlePreviewImage, transformStatus, timeFormat, getPercent } from '../utils';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import style from '../edm.module.scss';
import detailStyle from './detailHeader.module.scss';
import { timeZoneMap } from '@web-common/utils/constant';
import { MailTemplateActions, useActions } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
import { ReactComponent as TipsIcon } from '@/images/icons/edm/yingxiao/tips-blue.svg';
import MultAccountsLoginModal from '@web-common/components/UI/MultAccountsLoginModal/index';
import { canIBind } from '../utils/canIBind';

const ADD_DETAIL_TEMPLATE_TIP = 'add_detail_template_tip';

export interface Props {
  qs: Record<string, string>;
  info: EdmEmailInfo;
  multiVersionCount?: number;
  isLoop?: boolean;
  isCircle?: boolean;
  source?: 'list' | 'templateList';
  goBack?: () => void;
  handleViewContent?: () => void;
  level?: number;
  handleReuse?: () => void;
  handlePushUpdate?: (open: boolean) => void;
  detail?: ResponseSendBoxDetail;
  from: 'list' | 'templateList';
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

export const DetailHeader = (props: Props) => {
  const { info, multiVersionCount = 0, isLoop = false, isCircle = false, source = 'list', handleViewContent, level = 1, handleReuse, detail, from } = props;

  const [showTemplateTip, setShowTemplateTip] = useState(dataStoreApi.getSync(ADD_DETAIL_TEMPLATE_TIP)?.data !== 'true');
  const [templateInfo, setTemplateInfo] = useState<TemplateInfoModal>({});
  const [showReplayBind, setShowReplayBind] = useState(false);
  const [showBindModal, setShowBindModal] = useState(false);

  useEffect(() => {
    canIBind(info?.replyEmail || '').then(setShowReplayBind);
  }, [info, info?.replyEmail]);

  const { changeShowAddTemplatePop } = useActions(MailTemplateActions);

  const contentFilter = (content: string) => {
    const node = document.createElement('div');
    node.innerHTML = content;
    const signNode = node.querySelector('.lingxi-signature-container');
    signNode?.remove();
    const signNode2 = node.querySelector('.mail-signature-ent');
    signNode2?.remove();
    const signNode3 = node.querySelector('.mail-signature');
    signNode3?.remove();
    return node.innerHTML;
  };

  const handleSaveAsTemplate = async () => {
    // 获取模板详情，唤起写信
    try {
      const data = await edmApi.copyFromSendBox({ edmEmailId: info.edmEmailId });
      const tempContent = contentFilter(data?.contentEditInfo?.emailContent);
      setTemplateInfo({
        from: 'taskMail',
        title: getIn18Text('BAOCUNWEIMUBAN'),
        content: tempContent || '',
      });
      changeShowAddTemplatePop({ isShow: true });
    } catch (errMsg) {
      toast.error({ content: errMsg || '' });
    }
  };

  const status = transformStatus(info.emailStatus);
  const images = info.emailThumbnail?.split(',') || [];

  const isTopLevel = () => {
    return level === 1;
  };

  const handleCloseEditorTip = () => {
    setShowTemplateTip(false);
    dataStoreApi.put(ADD_DETAIL_TEMPLATE_TIP, 'true');
  };

  // 操作按钮
  const HeaderOperationComp = () => {
    return (
      <div className={detailStyle.buttons} style={{ float: 'right' }}>
        <Space>
          {isTopLevel() && (
            <PrivilegeCheck resourceLabel="EDM" accessLabel="OP">
              {showTemplateTip ? (
                <Tooltip
                  style={{ fontSize: '12px' }}
                  overlayInnerStyle={{ whiteSpace: 'break-spaces' }}
                  overlayClassName="show-arrow"
                  getPopupContainer={triggerNode => triggerNode}
                  placement="bottomRight"
                  visible
                  title={
                    <>
                      {getIn18Text('JIANGGAIRENWUDEYOUJIANNEIRONGBAOCUNWEIGERENMUBAN')}
                      <span onClick={handleCloseEditorTip} style={{ color: '#337EFF', marginLeft: '10px' }}>
                        {getIn18Text('ZHIDAOLE')}
                      </span>
                    </>
                  }
                >
                  <Button onClick={handleSaveAsTemplate}>{getIn18Text('BAOCUNWEIYOUJIANMUBAN')}</Button>
                </Tooltip>
              ) : (
                <Button onClick={handleSaveAsTemplate}>{getIn18Text('BAOCUNWEIYOUJIANMUBAN')}</Button>
              )}
            </PrivilegeCheck>
          )}
          {isTopLevel() && !isCircle && (
            <PrivilegeCheck resourceLabel="EDM" accessLabel="OP">
              <Button className={detailStyle.copyButton} onClick={handleReuse}>
                {getIn18Text('FUZHIRENWU')}
              </Button>
            </PrivilegeCheck>
          )}
        </Space>
      </div>
    );
  };

  const handelCoverImageClick = (item: EdmEmailInfo) => {
    // 如果可以查看则点击调用查看逻辑，如果不展示查看，则调用原点击图片逻辑
    if (source !== 'templateList' && !isCircle) {
      handleViewContent && handleViewContent();
    } else {
      edmDataTracker.trackEdmDetailOperation(EdmDetailOperateType.View, {
        buttonname: getIn18Text('CHAKANSUOLVETU'),
      });
      handlePreviewImage(item.emailThumbnail, item.edmSubject);
    }
  };

  useEffect(() => {
    if (showReplayBind) {
      edmDataTracker.taskDetailTip();
    }
  }, [showReplayBind]);

  const guard = (item?: any) => {
    return !(item === undefined || item === null);
  };

  const TagComp = () => {
    let percent = getPercent(info);
    const showPercent = info.emailStatus === 1 && percent;
    let type = 'label-6-1';
    let showName = status.statusName;
    switch (info.emailStatus) {
      case 1:
        type = 'warning-6';
        if (showPercent) {
          showName = `${status.statusName}...${percent}%`;
        }
        break;
      case 5:
        type = 'label-6-1';
        break;
      case 4:
        type = 'label-6-1-2';
        break;
      case 3:
        type = 'error-6';
        break;
      case 0:
        type = 'brand-6';
        break;
      case 2:
        type = 'success-6';
        break;
    }

    return (
      <div className={detailStyle.title}>
        <span className={detailStyle.tableItemName}>{info.edmSubject}</span>
        {multiVersionCount > 0 && <span className={detailStyle.aiModifyCount}>{`（共${multiVersionCount}种邮件内容）`}</span>}
        <span className={detailStyle.tableStateWrap}>
          <Tag type={type as any}>{showName}</Tag>
        </span>
        {info.sendStrategyOn && <Tag type="label-4-1">{getIn18Text('ANQUANFAXIN')}</Tag>}
        {[1, 4].includes(info.edmMode || 0) && <Tag type="label-1-1">{'多轮营销'}</Tag>}
        {guard(detail?.multipleContentInfo) && <Tag type="label-2-1">{getIn18Text('QIANYOUQIANMIAN')}</Tag>}
        {info.sendboxType === 1 && <Tag type="label-2-1">{getIn18Text('XUNHUANFASONG')}</Tag>}
      </div>
    );
  };

  const FiniShTimeComp = () => {
    if (![2].includes(info.emailStatus)) {
      return undefined;
    }
    let title = getIn18Text('WANCHENGSHIJIAN：');
    let time = info.completeTime || '';
    if (info.emailStatus === 0) {
      title = '预计发送时间：';
    }
    if (info.emailStatus === 1) {
      title = '预计完成时间：';
      time = info.expectCompleteTime || '';
    }
    if (info.emailStatus === 2) {
      title = '完成时间：';
    }
    return (
      <div className={detailStyle.item}>
        {title}
        {timeFormat(time)}
      </div>
    );
  };

  return (
    <div className={detailStyle.headerBg}>
      <div className={detailStyle.header}>
        <span>{getIn18Text('YINGXIAOXIANGQING')}</span>
        {source === 'templateList' ? null : HeaderOperationComp()}
      </div>
      <div className={detailStyle.info}>
        <div className={detailStyle.cover} onClick={() => handelCoverImageClick(info)}>
          <img src={images[0] || defaultImg} alt={info.edmSubject} />
          {source !== 'templateList' && !isCircle && <div className={detailStyle.check}>{getIn18Text('CHAKAN')}</div>}
        </div>
        <div className={detailStyle.setting}>
          {TagComp()}
          <div className={detailStyle.row}>
            {/* 发送模式： */}
            {!isLoop && info.sendModeDesc && <div className={detailStyle.item}>{`发送模式：${info.sendModeDesc}`}</div>}
            {/* 发件地址 */}
            {info?.senderEmail && (
              <div className={detailStyle.item}>
                {/* 发件地址： */}
                操作账号：
                <Tooltip title={info.senderEmail} placement="topLeft">
                  {info.senderEmail}
                </Tooltip>
              </div>
            )}
            {/* 回复邮箱 */}
            <div className={detailStyle.item}>
              {'回复邮箱：'}
              {/* {info?.replyEmail} */}
              <Tooltip title={info?.replyEmail || ''} placement="topLeft">
                <span className={detailStyle.email}>{info?.replyEmail}</span>
              </Tooltip>
              {showReplayBind && from === 'list' && (
                <div className={detailStyle.bind}>
                  <a
                    style={{
                      marginRight: 5,
                      marginLeft: 5,
                    }}
                    onClick={() => {
                      setShowBindModal(true);
                      edmDataTracker.taskDetailClick();
                    }}
                  >
                    {getIn18Text('QUBANGDING')}
                  </a>
                  <Tooltip title={'您的回复邮箱可以绑定在网易外贸通，查看回信更方便。'} placement="top">
                    <TipsIcon />
                  </Tooltip>
                </div>
              )}
            </div>
            {/* 创建时间 */}
            {info.createTime && (
              <div className={detailStyle.item}>
                {getIn18Text('CHUANGJIANSHIJIAN：')}
                {timeFormat(info.createTime)}
              </div>
            )}
            {/* 开始发送 */}
            {[0, 1, 2].includes(info.emailStatus) && info.sendTime && (
              <div className={detailStyle.item}>
                {'预计发送时间：'}
                {timeZoneMap[info.sendTimeZone]?.split('：')[0]} {timeFormat(info.sendTime)}
              </div>
            )}
            {/* 预计完成 */}
            {[0, 1].includes(info.emailStatus) && info.expectCompleteTime && (
              <div className={detailStyle.item}>
                {'预计完成时间：'}
                {timeFormat(info.expectCompleteTime)}
              </div>
            )}
            {/* 发送完成 */}
            {FiniShTimeComp()}
          </div>
        </div>
      </div>
      {/* 保存为模板 */}
      <SaveAsTemplateModal templateInfo={templateInfo} />
      {showBindModal && (
        <MultAccountsLoginModal
          loginInfo={{
            type: 'bind',
            way: 'mailSetting',
          }}
          closeModel={info => {
            setShowBindModal(false);
            if (info.email) {
              // message.success('绑定成功');
              setShowReplayBind(false);
            }
          }}
        />
      )}
    </div>
  );
};
