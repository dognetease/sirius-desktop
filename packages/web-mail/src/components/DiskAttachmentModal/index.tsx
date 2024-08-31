import React, { useEffect, useState, useMemo } from 'react';
import { Button, Tabs, Select, Modal, Tooltip } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { api, apiHolder, apis, SystemApi, ProductTagEnum, DataTrackerApi, NetStorageApi, ProductAuthorityFeature } from 'api';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import {
  actions as DiskAttActions,
  DiskAttachmentsInfo,
  doAddDiskAttachment,
  doGetAttsAsync,
  doGetRootInfoAsync,
  selectedTotalSizeOver100M,
  tabMsgsKeys,
} from '@web-common/state/reducer/diskAttReducer';
import { DiskAttachmentList } from './DiskAttachmentList';
import { ModalCloseSmall } from '@web-common/components/UI/Icons/icons';
import style from './index.module.scss';
import ProductAuthTag from '@web-common/components/UI/ProductAuthTag/ProductAuthTag';
import IconCard from '@web-common/components/UI/IconCard';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import { comIsShowByAuth, getIfHaveAuth } from '@web-common/utils/utils';
import { getIn18Text } from 'api';
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const { TabPane } = Tabs;
const { Option } = Select;

const iconStyle = { width: 15, height: 15, marginRight: 8, position: 'relative', top: 3 };
const XUQI_TEXT = getIn18Text('XUQI');

export const DiskAttachmentModal = () => {
  const dispatch = useAppDispatch();
  const { diskModalVisible, rootInfo, currentType, tabMsgs, selectedRows, listLoading } = useAppSelector(state => state.diskAttReducer);
  const [firstIn, setFirstIn] = useState<boolean>(true);
  const list = useMemo(() => {
    return tabMsgs[currentType as tabMsgsKeys].list || [];
  }, [tabMsgs, currentType]);
  const isLocked = useMemo(() => {
    return tabMsgs['personal'].isLocked || false;
  }, [tabMsgs]);
  const isTotalSizeOver100M = useAppSelector(selectedTotalSizeOver100M);
  const systemApi = api.getSystemApi() as SystemApi;
  const mailId = useAppSelector(state => state?.mailReducer?.currentMail?.cid);
  const [attachmentType, setAttachmentType] = useState<DiskAttachmentsInfo['addType']>('normal');
  // 普通附件是否可用
  const [normalDisabled, setNormalDisabled] = useState<boolean>(false);
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();
  // 往来附件不可以云附件形式上传
  const cloudDisabled = useMemo(() => currentType === 'normalAtt', [currentType]);
  const over100Remark = useMemo(() => {
    // 往来附件不可超过100M
    if (currentType === 'normalAtt') {
      return getIn18Text('TIANJIAZIWANGLAI');
    }
    // 个人 + 企业 + 云附件
    // 云附件开关是否开启
    const cloudSwitchOpen = getIfHaveAuth(ProductAuthorityFeature.ORG_SETTING_BIG_ATTACH_SHOW);
    if (cloudSwitchOpen) {
      return getIn18Text('YOUYUXUANZHONGDE');
    }
    return getIn18Text('TIANJIADEWENJIANZONGDAXIAO');
  }, [currentType]);
  const closeModal = () => dispatch(DiskAttActions.doToggleDiskModal(false));
  // 添加不可用
  // 以后得优化...
  const disableAdd = useMemo(() => {
    return (
      list?.length === 0 ||
      selectedRows.length === 0 ||
      (currentType === 'normalAtt' && isTotalSizeOver100M) ||
      (['personal', 'ent', 'cloud'].includes(currentType) && isTotalSizeOver100M && !getIfHaveAuth(ProductAuthorityFeature.ORG_SETTING_BIG_ATTACH_SHOW))
    );
  }, [list, selectedRows, listLoading, isTotalSizeOver100M, currentType]);
  // 续期不可用
  const disableRenew = useMemo(() => {
    // 旗舰版 + 云附件 + 已选择 + 未loading 才可以续期
    return !(productVersionId === 'ultimate' && currentType === 'cloudAtt' && list?.length > 0 && selectedRows?.length > 0 && !listLoading);
  }, [list.length, selectedRows.length, listLoading, currentType, productVersionId]);

  // tab切换
  const tabChange = (type: string) => {
    dispatch(DiskAttActions.doSwitchType(type as tabMsgsKeys));
  };
  // modal展示时 请求根目录信息
  useEffect(() => {
    if (firstIn) return;
    // 隐藏 重置
    if (!diskModalVisible) {
      dispatch(DiskAttActions.doResetData());
    }
    // 刷新根目录
    dispatch(doGetRootInfoAsync());
    // 重置附件类型
    setAttachmentType('normal');
  }, [diskModalVisible]);
  useEffect(() => {
    // 首次进入
    if (firstIn) {
      // 获取根目录内容
      dispatch(doGetRootInfoAsync());
      // 静默获取云附件和往来附件 提高速度
      dispatch(doGetAttsAsync({ type: 'cloudAtt' }));
      dispatch(doGetAttsAsync({ type: 'normalAtt' }));
      setFirstIn(false);
    }
  }, []);
  /**
   * 根据文件大小
   * 动态高亮 普通附件/云附件 RadioButton
   */
  useEffect(() => {
    // 超过100M且云附件可用
    // 自动设为云附件 并禁用普通附件
    if (isTotalSizeOver100M && getIfHaveAuth(ProductAuthorityFeature.ORG_SETTING_BIG_ATTACH_SHOW)) {
      setAttachmentType('cloud');
      setNormalDisabled(true);
    } else {
      setAttachmentType('normal');
      setNormalDisabled(false);
    }
  }, [isTotalSizeOver100M]);

  // 从云文档添加附件
  const handleAddAttachments = async () => {
    trackApi.track('pcMail_click_docsAttachments_writeMailPage', { spaceTab: currentType });
    mailId && dispatch(doAddDiskAttachment({ files: selectedRows, addType: attachmentType, mailId }));
  };

  // 续期
  const renewal = async () => {
    const identities: string[] = [];
    selectedRows.forEach(item => {
      const { identity } = item as any;
      identity && identities.push(identity);
    });
    if (identities.length < 1) {
      console.log('无云附件选中');
      return;
    }
    try {
      const res = await diskApi.renewAttachments({ identities });
      if (res === true) {
        message.success({
          icon: <IconCard type="saved" stroke="#4C6AFF" style={iconStyle} />,
          content: getIn18Text('XUQICHENGGONG'),
        });
        dispatch(DiskAttActions.doSetSelectedKeys([]));
        // 刷新云附件
        if (currentType === 'cloudAtt') {
          dispatch(doGetAttsAsync({ type: 'cloudAtt', init: true }));
        }
      } else {
        message.error({
          icon: <IconCard type="info" stroke="#FE5B4C" style={iconStyle} />,
          content: getIn18Text('XUQISHIBAIQINGCHONGSHI'),
        });
      }
    } catch (err) {
      console.log('续期失败', err);
      message.error({
        icon: <IconCard type="info" stroke="#FE5B4C" style={iconStyle} />,
        content: getIn18Text('XUQISHIBAIQINGCHONGSHI'),
      });
    }
  };

  const renderModalContent = () => {
    if (isLocked && currentType === 'personal') {
      return (
        <div className={style.empty}>
          <div className="sirius-empty sirius-empty-doc" />
          <div className={style.emptyText}>
            <p>{getIn18Text('GERENKONGJIANYI')}</p>
            <p>{getIn18Text('DANGQIANBANBENZAN')}</p>
            <p style={{ marginTop: 12 }}>{getIn18Text('KEQIANWANGJIUBAN')}</p>
            <p>
              <a onClick={() => systemApi?.openNewWindow('http://qiye.163.com/login')}>qiye.163.com/login</a>
            </p>
            <p>{getIn18Text('GUANBIANQUANSUO')}</p>
          </div>
        </div>
      );
    }
    return <DiskAttachmentList />;
  };

  const renderModalFooter = () => (
    <div className={style.modalFooter}>
      <div className={style.leftCont}>
        {/* 往来附件不展示select，只能选为普通附件 */}
        {!cloudDisabled && (
          <div className={style.attTyArea}>
            {getIn18Text('TIANJIAWEI')}
            <Select
              className={style.attTySelect}
              onChange={value => setAttachmentType(value)}
              value={attachmentType}
              style={{ width: 120 }}
              bordered={false}
              dropdownClassName={style.attTyDropdown}
              suffixIcon={<IconCard className="dark-invert" type="downTriangle" />}
            >
              <Option className={style.attTyOpt} disabled={normalDisabled} value="normal">
                {getIn18Text('PUTONGFUJIAN')}
              </Option>
              {comIsShowByAuth(
                ProductAuthorityFeature.ORG_SETTING_BIG_ATTACH_SHOW,
                <Option className={style.attTyOpt} disabled={cloudDisabled} value="cloud">
                  {getIn18Text('YUNFUJIAN')}
                </Option>
              )}
            </Select>
          </div>
        )}
        <div className={style.remark} hidden={!isTotalSizeOver100M}>
          {over100Remark}
        </div>
      </div>

      <div className={style.rightButtons}>
        <Button size="small" onClick={closeModal}>
          {getIn18Text('QUXIAO')}
        </Button>
        {/* 续期按钮 */}
        {currentType === 'cloudAtt' && (
          <>
            {productVersionId === 'free' && (
              <Tooltip title={getIn18Text('MIANFEIBANBUZHICHIXUQI')}>
                <Button size="small" disabled={true}>
                  {XUQI_TEXT}
                </Button>
              </Tooltip>
            )}
            {productVersionId === 'ultimate' && (
              <Button size="small" disabled={disableRenew} onClick={renewal}>
                {XUQI_TEXT}
              </Button>
            )}
          </>
        )}
        <Button onClick={handleAddAttachments} size="small" type="primary" disabled={disableAdd}>
          {getIn18Text('TIANJIA')}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      wrapClassName={style.diskModal}
      visible={diskModalVisible}
      bodyStyle={{ overflow: 'hidden' }}
      width={760}
      // 关闭即销毁
      destroyOnClose
      closeIcon={<ModalCloseSmall className="dark-invert" />}
      onCancel={closeModal}
      footer={renderModalFooter()}
    >
      <div>
        <div>
          <div className={style.modalTitle}>{<ProductAuthTag tagName={ProductTagEnum.NETDISK_ATTACHMENT}>{getIn18Text('CONGYUNWENDANGTIAN')}</ProductAuthTag>}</div>
          <Tabs className={style.attTabs} defaultActiveKey={currentType} onChange={tabChange}>
            {rootInfo.personal && <TabPane tab={getIn18Text('GERENKONGJIAN')} key="personal" />}
            {rootInfo.ent && <TabPane tab={getIn18Text('QIYEKONGJIAN')} key="ent" />}
            {comIsShowByAuth(ProductAuthorityFeature.ORG_SETTING_BIG_ATTACH_SHOW, <TabPane tab={getIn18Text('YUNFUJIANKONGJIAN')} key="cloudAtt" />)}
            <TabPane tab={getIn18Text('WANGLAIFUJIAN')} key="normalAtt" />
          </Tabs>
        </div>
        {renderModalContent()}
      </div>
    </Modal>
  );
};
