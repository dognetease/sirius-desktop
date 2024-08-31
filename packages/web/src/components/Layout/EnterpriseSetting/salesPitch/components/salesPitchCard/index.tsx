import React, { useRef, useMemo, useState, useContext } from 'react';
import classNames from 'classnames';
import { Dropdown, Menu, message, Tooltip } from 'antd';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import cloneDeep from 'lodash/cloneDeep';

import { DrawerType } from '@web-common/state/reducer/salesPitchReducer/types';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import {
  apiHolder,
  apis,
  MailApi,
  AddSalesPitchModel,
  DeleteSalesPitchModel,
  WriteMailInitModelParams,
  SalesPitchStages,
  salesPitchHelper,
  SalesPitchModel,
  ContactAndOrgApi,
  AccountApi,
} from 'api';
import { salesPitchRequest as request } from '@web-common/state/reducer/salesPitchReducer/request';
import { SalesPitchThunks } from '@web-common/state/reducer/salesPitchReducer/thunk';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { CurrentMailIdContext } from '@web-mail/rightSidebar';
import { getSalePitchByCardID, salesPitchUseTrack } from '@/components/Layout/EnterpriseSetting/salesPitch/utils/util';
import { ReactComponent as More } from '@/images/icons/more.svg';
import { ReactComponent as Reply } from '@/images/icons/reply.svg';
import { ReactComponent as Sortable } from '@/images/icons/edm/sortable.svg';
import { SalesPitchCardProps } from '@/components/Layout/EnterpriseSetting/salesPitch/types';
import style from './index.module.scss';
import useState2ReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import useSalesPitchData from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useSalesPitchData';
import { getIn18Text } from 'api';

const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

// 提示文案
const dragTooltip = getIn18Text('TUOZHUAISHUNXU');
const sendTooltip = getIn18Text('KUAIJIEFASONG');
const sendTooltip1 = getIn18Text('SHIYONG');
const moreTooltip = getIn18Text('GENGDUOGONGNENG');

const SalesPitchCard: React.FC<SalesPitchCardProps> = props => {
  const { cardId, provided, snapshot, isAllDragging = false, patchedStyle = {}, isDragDisabled = false, scene = 'settingBoard' } = props;
  const forReadMailScene = scene === 'readMailAside';
  const forWriteMail = scene === 'writePage'; // 是写信场景
  const forEdmTemplate = scene === 'edmTemplate'; // 是营销模板场景
  const forEdmMail = scene === 'edmMailEditor'; // 是营销邮件编辑器

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const dispatch = useAppDispatch();

  const [, setSaveAsMySalesPitch] = useState2ReduxMock('saveAsMySalesPitch');
  const [, setActiveScene] = useState2ReduxMock('activeScene');
  const [, setDrawerType] = useState2ReduxMock('drawerType');
  const [, setDrawerVisible] = useState2ReduxMock('drawerVisible');
  const [, setDrawerDataId] = useState2ReduxMock('drawerDataId');
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

  // 全部话术
  const [dataMap, setDataMap] = useSalesPitchData();
  // 当前话术
  const salesPitchModel = getSalePitchByCardID(cardId, dataMap);

  // 是否是管理员
  const isAdmin = useAppSelector(state => state.privilegeReducer.roles.some(role => role?.roleType === 'ADMIN'));
  // 是否可以编辑和删除
  const canEdit = useMemo(() => {
    // 如果不是管理员，并且当前话术类型是企业，则不可编辑，其他都可
    const isEnterprise = salesPitchModel?.type === 'ENTERPRISE';
    return !(!isAdmin && isEnterprise);
  }, [isAdmin, salesPitchModel?.type]);

  const [dropdownOpen, setDropDownOpen] = useState(false);

  const isSelfDragging = useMemo(() => (snapshot ? snapshot.isDragging : false), [snapshot?.isDragging]);
  const dragHandleProps = useMemo(() => (provided ? provided.dragHandleProps : {}), [provided?.dragHandleProps]);
  const draggableProps = useMemo(() => (provided ? provided.draggableProps : {}), [provided?.draggableProps]);

  const cardWrapperClassname = useMemo(() => {
    const isSelfDraggingStyle = isSelfDragging ? style.isSelfDragging : '';
    const isAllDraggingStyle = isAllDragging ? style.isAllDragging : '';
    return classNames(style.salesPitchCard, isSelfDraggingStyle, isAllDraggingStyle);
  }, [isSelfDragging, isAllDragging]);

  const allStyle = useMemo(() => {
    if (provided?.draggableProps.style) {
      return {
        ...patchedStyle,
        ...provided?.draggableProps.style,
      };
    }
    return patchedStyle;
  }, [provided?.draggableProps.style, patchedStyle]);

  const onDrawerHandler = (drawerHandleType: DrawerType) => {
    setActiveScene(scene);
    setDrawerType(drawerHandleType);
    setDrawerDataId(cardId);
    setDrawerVisible(true);
    // if (['ADD', 'EDIT'].includes(drawerHandleType) && salesPitchModel) {
    //   salesPitchManageTrack({ type: salesPitchModel.type, opera: drawerHandleType as 'ADD' });
    // }
    setDropDownOpen(false);
  };

  // 转存为自己的，其实就是新建一个自己的
  const saveAsMy = async () => {
    setDropDownOpen(false);
    setActiveScene(scene);
    setDrawerType('ADD');
    setDrawerDataId(cardId);
    setDrawerVisible(true);
    setSaveAsMySalesPitch({
      ...salesPitchModel,
      type: 'PERSONAL',
    } as SalesPitchModel);
  };

  // 点击删除
  const onDeleteHandler = () => {
    setDropDownOpen(false);
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

  // 点击发送,跳转到发信，并且使用当前的content
  const onSendHandler = async () => {
    salesPitchUseTrack({ opera: 'use', scene });
    setDropDownOpen(false);
    if (forWriteMail || forEdmTemplate || forEdmMail) {
      if (forEdmTemplate) {
        salesPitchModel && setEdmTemplateSalesPitch(salesPitchModel); // 营销模板
      } else if (forWriteMail) {
        salesPitchModel && setWritePageSalesPitch(salesPitchModel); // 写信
      } else if (forEdmMail) {
        salesPitchModel && setEdmMailSalesPitch(salesPitchModel); // 写信
      }
      setTimeout(() => {
        setWritePageOuterDrawerVisible(false);
        setEdmTemplateOuterDrawerVisible(false);
        setEdmMailOuterDrawerVisible(false);
      }, 100);
    } else {
      // const params: WriteMailInitModelParams = {
      //   mailType: 'common',
      //   writeType: 'common',
      //   originContent: salesPitchModel?.discourseContent || '',
      //   contact: senderEmail ? [senderEmail] : [],
      //   withoutPlaceholder: true
      // };
      // mailApi.callWriteLetterFunc(params);
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
  };

  const onCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget || !bottomRef.current?.contains(e.target as Node)) {
      onDrawerHandler('CHECK');
    }
  };

  const onCopyHandler = async () => {
    setDropDownOpen(false);
    const values = {
      type: canEdit ? salesPitchModel?.type : 'PERSONAL', // 有权限直接复制，无权限则则复制为我的话术
      discourseScene: salesPitchModel?.discourseScene + '1',
      discourseContent: salesPitchModel?.discourseContent,
      discourseStage: salesPitchModel?.discourseStage,
    } as AddSalesPitchModel;
    // 1.新建一个话术
    const result = await request.addSalesPitch(values);
    // 2.调整顺序到当前话术后面
    if (result?.success) {
      const sameStageSales = cloneDeep(dataMap[salesPitchModel?.discourseStage as SalesPitchStages]);
      const index = sameStageSales.findIndex(s => s.id === salesPitchModel?.id);
      // 新建出来的需要计算下cardId
      const insertSalesPitch = {
        ...result.data,
        cardId: salesPitchHelper.genSalesPitchCardId({
          stageId: result.data.discourseStage,
          type: result.data.type,
          id: result.data.id,
        }),
      };
      sameStageSales.splice(index + 1, 0, insertSalesPitch);
      setDataMap({ ...dataMap, [salesPitchModel?.discourseStage as string]: sameStageSales });
      // 发送请求，静默成功，失败重新刷数据（可以做本地回滚）
      dispatch(SalesPitchThunks.sortSalesPitch({ newList: sameStageSales, stageId: salesPitchModel?.discourseStage }));
    } else {
      // const content = getIn18Text('CAOZUOSHIBAI，12');
      const content = result.message || getIn18Text('CAOZUOSHIBAI，12');
      message.error(content);
    }
  };

  const renderBaseHandleEle = () => (
    <div className={forReadMailScene ? style.baseHandleContainerReadMail : style.baseHandleContainer} onClick={e => e.stopPropagation()}>
      <Tooltip placement="top" title={forWriteMail || forEdmTemplate ? sendTooltip1 : sendTooltip}>
        <div className={classNames(style.btn, 'send-sales-pitch')} style={{ marginRight: forReadMailScene ? 4 : 8 }} onClick={onSendHandler}>
          <Reply style={{ fill: '#6f7485', opacity: 1 }} />
        </div>
      </Tooltip>
      <Dropdown
        trigger={['click']}
        overlayStyle={{ width: 'auto' }}
        placement="bottomRight"
        visible={dropdownOpen}
        onVisibleChange={setDropDownOpen}
        overlay={
          <Menu>
            {/* 编辑删除需要权限 */}
            {canEdit && (
              <>
                <Menu.Item key="1" onClick={() => onDrawerHandler('EDIT')}>
                  {getIn18Text('BIANJI')}
                </Menu.Item>
                <Menu.Item key="2" onClick={onDeleteHandler}>
                  {getIn18Text('SHANCHU')}
                </Menu.Item>
                <Menu.Item key="3" onClick={onCopyHandler}>
                  {getIn18Text('FUZHI')}
                </Menu.Item>
              </>
            )}
            {!canEdit && (
              <Menu.Item key="3" onClick={saveAsMy}>
                {getIn18Text('saveAsMy')}
              </Menu.Item>
            )}
            <Menu.Item key="4" onClick={() => onDrawerHandler('CHECK')}>
              {getIn18Text('CHAKANQUANWEN')}
            </Menu.Item>
          </Menu>
        }
      >
        <Tooltip placement="left" title={moreTooltip}>
          <div className={style.btn}>
            <More style={{ fill: '#6f7485', opacity: 1 }} />
          </div>
        </Tooltip>
      </Dropdown>
    </div>
  );

  // 场景，标题
  const renderBaseTitleEle = () => (
    <div className={style.sceneContainer} title={salesPitchModel?.discourseScene || ''}>
      <div className={style.scene}>
        {salesPitchModel?.type === 'ENTERPRISE' && (
          <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <Tag type="label-3-1" hideBorder>
              {getIn18Text('GONGSI')}
            </Tag>
          </span>
        )}
        <span style={{ verticalAlign: 'middle' }}>{salesPitchModel?.discourseScene || ''}</span>
      </div>
      {forReadMailScene && renderBaseHandleEle()}
    </div>
  );

  // 内容
  const renderContentEle = () => <div className={style.content}>{salesPitchModel?.discourseContent.replace(/<.*?>/gi, '') || ''}</div>;

  if (forReadMailScene) {
    return (
      <div className={classNames(style.salesPitchCardReadMail, style.salesPitchCard)} style={allStyle} onClick={onCardClick}>
        {renderBaseTitleEle()}
        {renderContentEle()}
      </div>
    );
  }

  return (
    <div {...draggableProps} ref={provided?.innerRef} className={cardWrapperClassname} style={allStyle} onClick={onCardClick}>
      {renderBaseTitleEle()}
      {renderContentEle()}
      {/* 操作栏 */}
      <div ref={bottomRef} className={style.bottomBar} style={dropdownOpen ? { opacity: 1 } : {}}>
        <Tooltip placement="topLeft" title={dragTooltip}>
          <div {...dragHandleProps} className={classNames(style.btn, style.dragBtn, isDragDisabled ? style.isDragDisabled : '')} style={{ top: 4, left: 8 }}>
            <Sortable style={{ fill: '#6f7485', opacity: 1 }} />
          </div>
        </Tooltip>
        {!forReadMailScene && renderBaseHandleEle()}
      </div>
    </div>
  );
};

export default SalesPitchCard;
