/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Tabs, Tooltip } from 'antd';
import { ClueDetail, CustomerAuthDataType, FollowsType } from 'api';
import classnames from 'classnames';
import outerStyle from './index.module.scss';
import style from './header.module.scss';
import clueLogo from '@/images/icons/customerDetail/clue-logo.png';
import { MailSidebarFollows } from './component/follows/follows';
import { AccountIcon, AddManagerIcon, EditIcon, NewFollowIcon, NewScheduleIcon, WebsiteIcon, BackToOpenSeaIcon } from './component/icons';
import { createNewScheduleModal } from '../editSchedule/editSchedule';
import { EmailList } from './component/emailList/list';
import { confirmClueToCustomerModal } from '../../Clue/components/CreateClinetBusinessModal/createClientBussinessModal';
import { ClueBaseInfo } from './component/clueBaseInfo';
import { ContactList } from './component/contactList/contactList';
import { createReturnToOpenSeaModal } from '../ReturnReasonModal/returnReasonModal';
import { CardType, MailSidebarTracker, SideBarActions, TabNameMap, TabShow } from './tracker';
import { getIn18Text } from 'api';
interface SidebarClueInfoProps {
  info?: ClueDetail;
  onEdit?: () => void;
  onEditContact?: (contactId: string, email?: string) => void;
}
const { TabPane } = Tabs;
const actions: Array<{
  key: string;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'edit',
    label: getIn18Text('BIANJI'),
    icon: <EditIcon />,
  },
  {
    key: 'clueToCustomer',
    label: getIn18Text('ZHUANKEHU'),
    icon: <AddManagerIcon />,
  },
  {
    key: 'newSchedule',
    label: getIn18Text('XINJIANRICHENG'),
    icon: <NewScheduleIcon />,
  },
  {
    key: 'newFollow',
    label: getIn18Text('XIEGENJIN'),
    icon: <NewFollowIcon />,
  },
  {
    key: 'backToOpeanSea',
    label: getIn18Text('TUIHUIGONGHAI'),
    icon: <BackToOpenSeaIcon />,
  },
];
const actionMap: Record<string, SideBarActions> = {
  edit: SideBarActions.Edit,
  clueToCustomer: SideBarActions.ClueToCustomer,
  newSchedule: SideBarActions.AddSchedule,
  newFollow: SideBarActions.AddFollowup,
  backToOpeanSea: SideBarActions.BackToOpenSea,
};
const CONVERT_TO_CUSTOMER_STATUS = '4';
// 线索信息展示，已经切换到ClueInfoNew文件
export const SidebarClueInfo = (props: SidebarClueInfoProps) => {
  const { info, onEdit, onEditContact } = props;
  const [activeTab, setActiveTab] = useState('1');
  const [isEditFollow, setIsEditFollow] = useState(false);
  const clueDisabled = useMemo(() => String(info?.status) === String(CONVERT_TO_CUSTOMER_STATUS), [info?.status]);
  const followsRef = useRef<any>(null);
  useEffect(() => {
    MailSidebarTracker.trackTabChange(CardType.Clue, TabNameMap[activeTab]);
  }, [activeTab]);
  const handleActionClick = (key: string) => {
    if (!info) return;
    switch (key) {
      case 'edit':
        onEdit && onEdit();
        break;
      case 'clueToCustomer':
        confirmClueToCustomerModal({
          clueId: info.id,
          onCancel(flag) {
            console.log('createModal', 'bo', flag);
          },
        });
        break;
      case 'newFollow':
        setActiveTab('1');
        setIsEditFollow(true);
        break;
      case 'newSchedule':
        createNewScheduleModal({
          id: info.id,
          type: 'clue',
          onCancel(flag) {
            console.log('createModal', 'schedule', flag);
            if (flag) {
              followsRef.current.refresh();
            }
          },
        });
        break;
      case 'backToOpeanSea':
        createReturnToOpenSeaModal({
          ids: [info.id],
          onCancel(flag) {
            console.log('createReturnToOpenSeaModal', flag);
          },
        });
        break;
      default:
        break;
    }
    MailSidebarTracker.trackAction(CardType.Clue, actionMap[key]);
  };
  const managers = info ? info.manager_list?.map(item => item.manager_name || '-').join('，') : '-';
  const resource = useMemo(
    () => ({
      id: info ? info.id : '',
      customerType: 'clue' as FollowsType,
    }),
    [info?.id]
  );
  return (
    <div className={classnames(style.infoContainer, outerStyle.columnFlexContainer)}>
      <div className={style.header}>
        <div className={style.headerInfo}>
          <div className={style.headerInfoMain}>
            <div className={style.flexRow}>
              <span className={style.companyName} title={info?.name}>
                {info?.name}
              </span>
            </div>
            <div className={style.row} style={{ marginTop: 8 }}>
              <Tooltip title={getIn18Text('WANGZHI')}>
                <WebsiteIcon />
              </Tooltip>
              <span>{info?.website || info?.company_domain || '-'}</span>
            </div>
            <div className={style.row}>
              <Tooltip title={getIn18Text('FUZEREN')}>
                <AccountIcon />
              </Tooltip>
              <Tooltip title={managers}>{managers}</Tooltip>
            </div>
          </div>
          <img alt="logo" width="50" height="50" src={clueLogo} />
        </div>
        {!clueDisabled ? (
          <div className={style.actions}>
            {actions.map(i => (
              <div key={i.key} onClick={() => handleActionClick(i.key)} className={style.actionButton}>
                <div className={style.actionIconWrap}>{i.icon}</div>
                <div>{i.label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className={style.body}>
        <Tabs className={classnames('waimao-tabs', style.flexTabs)} activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={getIn18Text('DONGTAI')} key="1">
            {info && (
              <MailSidebarFollows
                ref={followsRef}
                visible={activeTab === '1'}
                resource={resource}
                onEditorClose={() => setIsEditFollow(false)}
                isEdit={isEditFollow}
                disabled={clueDisabled}
              />
            )}
          </TabPane>
          <TabPane tab={getIn18Text('JICHUXINXI')} key="2">
            <ClueBaseInfo data={info as ClueDetail} />
          </TabPane>
          <TabPane tab={getIn18Text('LIANXIREN')} key="3">
            <ContactList list={info?.contact_list} onEdit={onEditContact} readonly={clueDisabled} />
          </TabPane>
          <TabPane tab={getIn18Text('WANGLAIYOUJIAN')} key="4">
            {info && <EmailList resourceId={info.id} condition={CustomerAuthDataType.Clue} />}
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};
