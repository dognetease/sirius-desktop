import { getIn18Text } from 'api';
import React, { useMemo } from 'react';
import classnames from 'classnames';
import { Dropdown, Menu } from 'antd';
import {
  SnsMarketingAccount,
  SnsMarketingPlatform,
  SnsAccountAuthorizedStatus,
  getSnsAccountAuthorizedStatusName,
  SnsMarketingAccountType,
  SnsMarketingAuthorizeType,
} from 'api';
import { Tooltip, Space } from 'antd';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { navigate } from '@reach/router';
import { ReactComponent as TipIcon } from '../../images/tip-deep-small.svg';
import { ReactComponent as EllipsisIcon } from '../../images/ellipsis.svg';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import Avatar from '../../components/Avatar';
import style from './AccountCard.module.scss';

const SnsAccountAuthorizedStatusName = getSnsAccountAuthorizedStatusName();

interface AccountCardProps {
  account: SnsMarketingAccount;
  onTaskCreate: () => void;
  onAccountCancel: () => void;
  onAccountDelete: () => void;
  onAccountRebind: () => void;
}

const AccountCard: React.FC<AccountCardProps> = props => {
  const { account, onTaskCreate, onAccountCancel, onAccountDelete, onAccountRebind } = props;

  const isAuthorized = account.accountStatus === SnsAccountAuthorizedStatus.AUTHORIZED;
  const isPersonalLinkedin = account.platform === SnsMarketingPlatform.LINKEDIN && account.accountType === SnsMarketingAccountType.PERSONAL;
  const isAllocation = account.authorizeType === SnsMarketingAuthorizeType.ALLOCATION;

  const showData = useMemo(() => {
    if (!isAuthorized) {
      // 未绑定
      return false;
    }

    if (account.accountType === SnsMarketingAccountType.PERSONAL && account.platform === SnsMarketingPlatform.LINKEDIN) {
      // 领英的个人账号
      return false;
    }

    return true;
  }, [isAuthorized, account]);

  return (
    <div className={style.accountCard}>
      <div className={style.header}>
        <div
          className={classnames(style.statusIcon, {
            [style.statusIconError]: !isAuthorized,
          })}
        />
        <div className={style.statusName}>{SnsAccountAuthorizedStatusName[account.accountStatus]}</div>
        {!isAllocation && (
          <Dropdown
            getPopupContainer={triggerNode => triggerNode.parentElement || document.body}
            placement="bottomRight"
            overlay={
              <Menu className={style.dropdownMenu}>
                <PrivilegeCheck resourceLabel="SOCIAL_MEDIA" accessLabel="UNBIND">
                  {isAuthorized && <Menu.Item onClick={onAccountCancel}>{getIn18Text('QUXIAOSHOUQUAN')}</Menu.Item>}
                </PrivilegeCheck>
                <PrivilegeCheck resourceLabel="SOCIAL_MEDIA" accessLabel="DELETE">
                  <Menu.Item onClick={onAccountDelete}>{getIn18Text('SHANCHUSHEMEIZHUYE')}</Menu.Item>
                </PrivilegeCheck>
              </Menu>
            }
          >
            <div className={style.dropdownTrigger}>
              <EllipsisIcon className={style.icon} />
            </div>
          </Dropdown>
        )}
      </div>
      <div className={style.body}>
        <Avatar className={style.accountAvatar} size={72} avatar={account.accountAvatar} platform={account.platform} />
        <div className={style.accountName}>{account.accountName}</div>
        <div className={style.oauthTime}>
          {getIn18Text('SHOUQUANSHIJIAN：')}
          {account.oauthTime}
        </div>
        <div className={style.stats}>
          <div className={style.stat}>
            <div className={style.statCount}>{isPersonalLinkedin ? '--' : account.contactCount}</div>
            <div className={style.statName}>
              {getIn18Text('FENSISHU')}
              {isPersonalLinkedin && (
                <Tooltip title={getIn18Text('LinkedI')}>
                  <TipIcon className={style.statTip} />
                </Tooltip>
              )}
            </div>
          </div>
          <div className={style.stat}>
            <div className={style.statCount}>{account.postCount}</div>
            <div className={style.statName}>{getIn18Text('TIEZISHU')}</div>
          </div>
          <div className={style.stat}>
            <div className={style.statCount}>{isPersonalLinkedin ? '--' : account.commentCount}</div>
            <div className={style.statName}>
              {getIn18Text('PINGLUNSHU')}
              {isPersonalLinkedin && (
                <Tooltip title={getIn18Text('LinkedI')}>
                  <TipIcon className={style.statTip} />
                </Tooltip>
              )}
            </div>
          </div>
        </div>
        <Space className={style.btnWrapper}>
          {showData && (
            <Button
              className={style.option}
              btnType="minorLine"
              onClick={() => {
                navigate(`#site?page=snsAccountDataAnalysis&accountId=${account.accountId}`);
              }}
            >
              {getIn18Text('SHUJUFENXI')}
            </Button>
          )}

          {isAuthorized ? (
            <PrivilegeCheck resourceLabel="SOCIAL_MEDIA" accessLabel="OP">
              <Button className={style.option} btnType="minorLine" onClick={onTaskCreate}>
                {getIn18Text('CHUANGJIANYINGXIAORENWU')}
              </Button>
            </PrivilegeCheck>
          ) : isAllocation ? null : (
            <Button className={style.option} onClick={onAccountRebind}>
              {getIn18Text('CHONGXINSHOUQUAN')}
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
};

export default AccountCard;
