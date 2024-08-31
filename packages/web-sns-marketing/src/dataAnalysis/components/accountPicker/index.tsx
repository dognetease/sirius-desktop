import { getIn18Text } from 'api';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Space, Select } from 'antd';
import { apiHolder, apis, SnsMarketingApi, SnsMarketingPlatform, SnsMarketingAccount, SnsAccountAuthorizedStatus, SnsMarketingAccountType } from 'api';
import PlatformLogo from '../../../components/PlatformLogo';
import Avatar from '../../../components/Avatar';
import style from './style.module.scss';

interface Props {
  value?: string;
  showPlatform?: boolean;
  showAccount?: boolean;
  allowClear?: boolean;
  onChange?: (platform: SnsMarketingPlatform | '', account: SnsMarketingAccount | null) => void;
}

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;
export const AccountPicker: React.FC<Props> = props => {
  const { showPlatform = true, showAccount = true, allowClear = false, onChange } = props;
  const [accountList, setAccountList] = useState<SnsMarketingAccount[]>([]);
  const [currentPlatform, setCurrentPlatform] = useState<SnsMarketingPlatform | ''>('');
  const [accountId, setAccountId] = useState<string | undefined>(undefined);

  const fetchAccount = useCallback(async () => {
    const res = await snsMarketingApi.getAllBindingAccount({
      status: SnsAccountAuthorizedStatus.AUTHORIZED,
    });
    setAccountList(res?.accountList || []);
  }, []);

  useEffect(() => {
    fetchAccount();
  }, []);

  const platformList: SnsMarketingPlatform[] = useMemo(() => {
    return [...new Set(accountList.map(account => account.platform))];
  }, [accountList]);

  const accountOptions = useMemo(() => {
    if (!showAccount) {
      return [];
    }

    if (!currentPlatform) {
      return accountList.slice();
    }

    return accountList.filter(account => account.platform === currentPlatform);
  }, [accountList, currentPlatform, showAccount]);

  const handleChange = useCallback(
    (platform: SnsMarketingPlatform | '', account: SnsMarketingAccount | null) => {
      if (onChange) {
        onChange(platform, account);
      }
    },
    [onChange]
  );

  useEffect(() => {
    if (accountList.length && props.value) {
      // 默认选中
      setAccountId(props.value);
      const item = accountList.find(acc => acc.accountId === props.value);
      handleChange(currentPlatform, item || null);
    }
  }, [accountList, props.value]);

  return (
    <Space className={style.wrapper}>
      {showPlatform && (
        <>
          <div
            className={`${style.platformItem} ${style.platformAll} ${currentPlatform === '' ? style.actived : ''}`}
            onClick={() => {
              setCurrentPlatform('');
              handleChange('', null);
              setAccountId(undefined);
            }}
          >
            All
          </div>
          {platformList.map(platform => {
            return (
              <div
                className={`${style.platformItem} ${currentPlatform === platform ? style.actived : ''}`}
                onClick={() => {
                  setCurrentPlatform(platform);
                  handleChange(platform, null);
                  setAccountId(undefined);
                }}
              >
                <PlatformLogo platform={platform} size={20} />
              </div>
            );
          })}
        </>
      )}
      {showAccount && (
        <Select
          className={style.accountSelect}
          allowClear={allowClear}
          placeholder={getIn18Text('QUANBUZHUYE')}
          value={accountId}
          onChange={accountId => {
            const item = accountList.find(acc => acc.accountId === accountId);
            handleChange(currentPlatform, item || null);
            setAccountId(accountId);
          }}
        >
          {accountOptions.map(account => (
            <Select.Option
              key={account.accountId}
              value={account.accountId}
              disabled={account.platform === SnsMarketingPlatform.LINKEDIN && account.accountType === SnsMarketingAccountType.PERSONAL}
            >
              <Space>
                <Avatar key={account.accountId} avatar={account.accountAvatar} platform={account.platform} size={26} />
                <span>{account.accountName}</span>
              </Space>
            </Select.Option>
          ))}
        </Select>
      )}
    </Space>
  );
};
