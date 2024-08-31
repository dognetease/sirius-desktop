import React, { useMemo, useState, useEffect, useRef, useContext } from 'react';

import { SalesPitchActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { apiHolder, apis, ContactAndOrgApi, DeleteSalesPitchModel, MailApi, SalesPitchModel, SalesPitchStages, WriteMailInitModelParams } from 'api';
import { Button, message } from 'antd';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import { readWrapperNoAdjustImage } from '@web-mail/components/ReadMail/util';
import { ReactComponent as TongyongDaochu } from '@web-common/images/newIcon/tongyong_daochu.svg';
import { ReactComponent as Right } from '@/images/icons/collapsibleList/right.svg';
import { ReactComponent as Left } from '@/images/icons/collapsibleList/left.svg';
import { ReactComponent as IconEdit } from '@/images/icons/mail/icon-edit.svg';
import { ReactComponent as Reply } from '@/images/icons/reply.svg';
import { ReactComponent as IconDelete } from '@/images/icons/mail/icon-delete.svg';
import useState2ReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import {
  filterSalesPitchDataMap,
  getIndexByCardId,
  getSalePitchByCardID,
  getSiblingSalePitchByCardID,
} from '@/components/Layout/EnterpriseSetting/salesPitch/utils/util';
import styles from './index.module.scss';
import { SalesPitchDrawerProps } from '../../types';
import { CurrentMailIdContext } from '@web-mail/rightSidebar';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { salesPitchRequest as request } from '@web-common/state/reducer/salesPitchReducer/request';
import { SalesPitchThunks } from '@web-common/state/reducer/salesPitchReducer/thunk';
import { getIn18Text } from 'api';

const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
// const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;

// 按钮文案
const nextText = getIn18Text(['CHAKAN', 'XIAYIGE']);
const prevText = getIn18Text(['CHAKAN', 'SHANGYIGE']);
const previewText = getIn18Text('YULAN');

interface SalesPitchCheckProps extends SalesPitchDrawerProps {}

const SalesPitchCheck: React.FC<SalesPitchCheckProps> = props => {
  const { scene } = props || {};
  const [config] = useState2ReduxMock('config');
  const [dataMap] = useState2ReduxMock('dataMap');
  const [searchDataMap] = useState2ReduxMock('searchDataMap');
  const [searchInput] = useState2ReduxMock('searchInput');
  const isSearching = useMemo(() => !!searchInput, [searchInput]);
  const salesPitchDataMap = filterSalesPitchDataMap(isSearching ? searchDataMap : dataMap, {
    type: config.showEnterprise ? 'ALL' : 'PERSONAL',
  });

  const frameRef = useRef<HTMLIFrameElement>(null);

  const [, setDrawerType] = useState2ReduxMock('drawerType');
  const [drawerDataId, setDrawerDataId] = useState2ReduxMock('drawerDataId');
  const [drawerVisible] = useState2ReduxMock('drawerVisible');

  const salesPitchModel = getSalePitchByCardID(drawerDataId, dataMap);
  const { discourseScene, discourseContent } = salesPitchModel || {};

  const [forwardDisable, setForwardDisable] = useState(false);
  const [backwardDisable, setBackwardDisable] = useState(false);
  const [, setSaveAsMySalesPitch] = useState2ReduxMock('saveAsMySalesPitch');
  const [, setWritePageSalesPitch] = useState2ReduxMock('writePageSalesPitch');
  const [, setEdmTemplateSalesPitch] = useState2ReduxMock('edmTemplateSalesPitch');
  const [, setEdmMailSalesPitch] = useState2ReduxMock('edmMailSalesPitch');
  const [, setWritePageOuterDrawerVisible] = useState2ReduxMock('writePageOuterDrawerVisible');
  const [, setEdmTemplateOuterDrawerVisible] = useState2ReduxMock('edmTemplateOuterDrawerVisible');
  const [, setEdmMailOuterDrawerVisible] = useState2ReduxMock('edmMailOuterDrawerVisible');

  // 当前tab在读的邮件
  const currentMailId = useContext(CurrentMailIdContext);
  const [mailEntities] = useState2RM('mailEntities');

  // 当前在读邮件的发件人
  const senderEmail = useMemo(() => {
    if (currentMailId) {
      const currentMail = mailEntities[currentMailId];
      if (currentMail) {
        let email = '';
        if (currentMail.sender?.contact) {
          email = contactApi.doGetModelDisplayEmail(currentMail.sender?.contact?.contact);
        }
        return email || '';
      }
      return '';
    }
    return '';
  }, [currentMailId]);
  // 当前在读邮件账号
  const currentMailAccount = useMemo(() => {
    if (currentMailId) {
      const currentMail = mailEntities[currentMailId];
      return currentMail?._account || '';
    }
    return '';
  }, [currentMailId]);

  // 是否是管理员
  const isAdmin = useAppSelector(state => state.privilegeReducer.roles.some(role => role?.roleType === 'ADMIN'));
  // 是否可以编辑和删除
  const canEdit = useMemo(() => {
    // 如果不是管理员，并且当前话术类型是企业，则不可编辑，其他都可
    const isEnterprise = salesPitchModel?.type === 'ENTERPRISE';
    return !(!isAdmin && isEnterprise);
  }, [isAdmin, salesPitchModel?.type]);

  const dispatch = useAppDispatch();

  const onChangeCard = (forward: boolean) => {
    setDrawerType('CHECK');
    const nextData = getSiblingSalePitchByCardID(drawerDataId, salesPitchDataMap, forward);
    if (nextData) {
      setDrawerDataId(nextData.cardId);
    }
  };

  const setBtnDisable = () => {
    const { index, idInfo } = getIndexByCardId(drawerDataId, salesPitchDataMap) || {};
    if (idInfo && index !== undefined) {
      const targetColumn = salesPitchDataMap[idInfo.stageId as SalesPitchStages];
      setForwardDisable(index >= targetColumn.length - 1);
      setBackwardDisable(index <= 0);
    }
  };

  // 转存为自己的，其实就是新建一个自己的
  const saveAsMy = async () => {
    setDrawerType('ADD');
    setSaveAsMySalesPitch({
      ...salesPitchModel,
      type: 'PERSONAL',
    } as SalesPitchModel);
  };

  // 查看转编辑,仅仅修改type即可
  const checkToEdit = () => {
    dispatch(
      SalesPitchActions.doUpdateAny({
        name: 'drawerType',
        data: 'EDIT',
      })
    );
  };

  // 关闭抽屉
  const closeHandle = () => {
    dispatch(SalesPitchActions.doCloseDrawer());
  };

  // 使用话术
  const onSendHandler = () => {
    // 是写信场景或者营销模板场景
    if (scene === 'writePage' || scene === 'edmTemplate' || scene === 'edmMailEditor') {
      if (scene === 'writePage') {
        salesPitchModel && setWritePageSalesPitch(salesPitchModel);
      } else if (scene === 'edmTemplate') {
        salesPitchModel && setEdmTemplateSalesPitch(salesPitchModel);
      } else if (scene === 'edmMailEditor') {
        salesPitchModel && setEdmMailSalesPitch(salesPitchModel);
      }
    } else {
      // 如果有当前在读的邮件，则类似回复邮件，内容是当前话术内容，否则就是写信
      if (currentMailId && senderEmail) {
        // accountApi.setCurrentAccount({ email: currentMailAccount });
        // mailApi.doReplayMail(currentMailId, false, false, salesPitchModel?.discourseContent || '', currentMailAccount);
        const params: WriteMailInitModelParams = {
          originContent: salesPitchModel?.discourseContent || '',
          contact: [],
          withoutPlaceholder: true,
          mailType: 'common',
          writeType: 'reply',
          id: currentMailId,
          _account: currentMailAccount,
        };
        mailApi.callWriteLetterFunc(params);
      } else {
        const params: WriteMailInitModelParams = {
          mailType: 'common',
          writeType: 'common',
          originContent: salesPitchModel?.discourseContent || '',
          contact: [],
          withoutPlaceholder: true,
        };
        mailApi.callWriteLetterFunc(params);
      }
    }
    // 先关闭外围的大抽屉，再延时关闭里面的小抽屉
    setWritePageOuterDrawerVisible(false);
    setEdmTemplateOuterDrawerVisible(false);
    setEdmMailOuterDrawerVisible(false);
    setTimeout(() => {
      closeHandle();
    }, 100);
  };

  // 点击删除
  const onDeleteHandler = () => {
    SiriusModal.confirm({
      title: getIn18Text('confirmDeleteSalesPitch'),
      content: null,
      okText: getIn18Text('QUEREN'),
      okButtonProps: { type: 'primary' },
      okType: 'primary',
      cancelText: getIn18Text('QUXIAO'),
      onOk: async () => {
        if (salesPitchModel) {
          const params = {
            discourseID: salesPitchModel.id,
            discourseType: salesPitchModel.type,
          } as unknown as DeleteSalesPitchModel;
          const success = await request.deleteSalesPitch(params);
          if (success) {
            // 关闭弹窗
            closeHandle();
            // toast
            message.success(getIn18Text('SHANCHUCHENGGONG'));
            // 重新刷新列表
            dispatch(SalesPitchThunks.fetchData({}));
          } else {
            message.error(getIn18Text('SHANCHUSHIBAI'));
          }
        }
      },
    });
  };

  useEffect(() => {
    setBtnDisable();
  }, [drawerVisible, drawerDataId]);

  useEffect(() => {
    if (frameRef.current) {
      // 加载正文
      frameRef.current.setAttribute('style', 'padding: 0px');
      const doc = frameRef.current.contentDocument;
      doc?.open();
      doc?.write(readWrapperNoAdjustImage(discourseContent || ''));
      doc?.close();
    }
  }, [discourseContent]);

  return (
    <>
      <div className={styles.btnGroup}>
        {/* 非写信场景下，才出现此按钮 */}
        {scene !== 'writePage' && scene !== 'edmTemplate' && scene !== 'edmMailEditor' && (
          <Button type="text" onClick={onSendHandler} style={{ display: 'flex', alignItems: 'center', border: 'none' }}>
            <Reply style={{ fill: '#6f7485', opacity: 1 }} />
            <span style={{ marginLeft: 10 }}>{getIn18Text('KUAIJIEFASONG')}</span>
          </Button>
        )}
        {/* 有权限，则展示编辑，删除 */}
        {canEdit ? (
          <>
            <Button type="text" onClick={checkToEdit} style={{ display: 'flex', alignItems: 'center', border: 'none' }}>
              <IconEdit />
              <span style={{ marginLeft: 10 }}>{getIn18Text('checkToEdit')}</span>
            </Button>
            <Button type="text" onClick={onDeleteHandler} style={{ display: 'flex', alignItems: 'center', border: 'none' }}>
              <IconDelete />
              <span style={{ marginLeft: 10 }}>{getIn18Text('SHANCHU')}</span>
            </Button>
          </>
        ) : (
          // 无权限则展示保存为我的
          <Button type="text" onClick={saveAsMy} style={{ display: 'flex', alignItems: 'center', border: 'none' }}>
            <TongyongDaochu />
            <span style={{ marginLeft: 10 }}>{getIn18Text('saveAsMy')}</span>
          </Button>
        )}
      </div>
      <div className={styles.check}>
        <div className={styles.scene}>
          {/* 话术类型，不是公司就是个人 */}
          {salesPitchModel?.type === 'ENTERPRISE' ? (
            <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
              <Tag type="label-3-1" hideBorder>
                {getIn18Text('GONGSI')}
              </Tag>
            </span>
          ) : (
            <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
              <Tag type="label-1-1" hideBorder>
                {getIn18Text('GEREN')}
              </Tag>
            </span>
          )}
          <span style={{ verticalAlign: 'middle' }}>{discourseScene}</span>
        </div>
        <div className={styles.content}>
          <iframe title={previewText} ref={frameRef} width="100%" height="100%" src="about:blank" frameBorder="0" />
        </div>
      </div>
      <div className={styles.footer} style={{ textAlign: 'left' }}>
        <Button disabled={backwardDisable} onClick={() => onChangeCard(false)}>
          <span style={{ paddingRight: 10 }}>
            <Left />
          </span>
          {prevText}
        </Button>
        <Button disabled={forwardDisable} onClick={() => onChangeCard(true)} style={{ marginLeft: 12 }}>
          {nextText}
          <span style={{ paddingLeft: 10 }}>
            <Right />
          </span>
        </Button>
        {(scene === 'writePage' || scene === 'edmTemplate' || scene === 'edmMailEditor') && (
          <>
            <Button onClick={onSendHandler} type="primary" style={{ marginLeft: 12, float: 'right' }}>
              {getIn18Text('SHIYONG')}
            </Button>
            <Button onClick={() => closeHandle()} style={{ float: 'right' }}>
              {getIn18Text('BACKTOLIST')}
            </Button>
          </>
        )}
      </div>
    </>
  );
};

export default SalesPitchCheck;
