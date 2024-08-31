import { getIn18Text } from 'api';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import { apis, apiHolder, SnsMarketingApi, SnsMarketingAccount, SnsAccountAuthorizedStatus } from 'api';
import { Select, Checkbox, Tag, Empty } from 'antd';
import Avatar from './Avatar';
import useAccountBinding from '../accountBinding/useAccountBinding';
import { ReactComponent as DownArrow } from '../images/arrow-down.svg';
import style from './AccountsSelect.module.scss';

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;

interface AccountsSelectProps {
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  accounts?: SnsMarketingAccount[];
  disabled?: boolean;
  avatarSize?: number;
  onBlur?: (accounts: SnsMarketingAccount[]) => void;
  onChange?: (accounts: SnsMarketingAccount[]) => void;
  [propName: string]: any;
}

const createUniqueId = (account: SnsMarketingAccount) => `${account.platform}_${account.accountId}`;

const AccountsSelect: React.FC<AccountsSelectProps> = props => {
  const {
    className,
    style: styleFromProps,
    placeholder = '请选择社媒主页',
    accounts: accountsFromProps = [],
    disabled,
    onBlur,
    avatarSize = 28,
    onChange,
    ...restProps
  } = props;
  const accounts = accountsFromProps.map(item => ({
    ...item,
    uniqueId: createUniqueId(item),
  }));
  const value = accounts.map(item => item.uniqueId);
  const [options, setOptions] = useState<(SnsMarketingAccount & { uniqueId: string })[]>([]);
  const [fetching, setFetching] = useState<boolean>(false);

  const accountsMap: Record<string, SnsMarketingAccount> = accounts.reduce(
    (accumulator, account) => ({
      ...accumulator,
      [account.uniqueId]: account,
    }),
    {}
  );

  const optionsMap: Record<string, SnsMarketingAccount> = options.reduce(
    (accumulator, account) => ({
      ...accumulator,
      [account.uniqueId]: account,
    }),
    {}
  );

  // 可能会出现 props.accounts 中有某个账号, 但 options 里还没有滚动加载到该账号
  // 如果 options 有该账号，从 options 取值返回, 否则从 props.accounts 取值返回
  const getAccountByUniqueId: (uniqueId: string) => SnsMarketingAccount | null = uniqueId => optionsMap[uniqueId] || accountsMap[uniqueId] || null;

  // TODO: 加载更多实现
  const handleOptionsFetch = () => {
    setFetching(true);

    snsMarketingApi
      .getSnsBindingAccountsAll({
        status: SnsAccountAuthorizedStatus.AUTHORIZED,
      })
      .then(res => {
        setOptions(
          res.accountList.map(item => ({
            ...item,
            uniqueId: createUniqueId(item),
          }))
        );
      })
      .finally(() => {
        setFetching(false);
      });
  };

  const { bindingModals, handleEntryModalOpen } = useAccountBinding({
    onBindFinish: handleOptionsFetch,
  });

  useEffect(() => {
    handleOptionsFetch();
  }, []);

  const selectRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Select<string[]>
        ref={selectRef}
        className={classnames(style.accountsSelect, className)}
        dropdownClassName={style.accountsSelectDropdown}
        style={styleFromProps}
        mode="multiple"
        disabled={disabled}
        showArrow
        allowClear
        suffixIcon={DownArrow}
        placeholder={placeholder}
        value={value}
        filterOption={(inputValue, option) => {
          const uniqueId = option?.value || ('' as string);
          const account = getAccountByUniqueId(uniqueId);

          if (!account) return false;

          return account.accountName.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase());
        }}
        onBlur={() => onBlur && onBlur(accounts)}
        onChange={nextValue => {
          const nextAccounts = nextValue.map(uniqueId => getAccountByUniqueId(uniqueId)).filter((item): item is SnsMarketingAccount => item !== null);

          onChange && onChange(nextAccounts);
          selectRef.current?.focus();
        }}
        options={options.map(account => ({
          label: (
            <div className={style.option}>
              <Checkbox className={style.checkbox} checked={value.includes(account.uniqueId)} />
              <Avatar className={style.accountAvatar} size={36} avatar={account.accountAvatar} platform={account.platform} />
              <div className={style.accountName}>{account.accountName}</div>
            </div>
          ),
          value: account.uniqueId,
        }))}
        tagRender={tagProps => {
          const uniqueId = tagProps.value as string;
          const account = getAccountByUniqueId(uniqueId);

          if (!account) return <></>;

          return (
            <Tag className={style.tag} closable onClose={tagProps.onClose}>
              <Avatar className={style.accountAvatar} size={avatarSize} avatar={account.accountAvatar} platform={account.platform} />
              <div className={style.accountName}>{account.accountName}</div>
            </Tag>
          );
        }}
        dropdownRender={content =>
          options.length ? (
            <div className={style.dropdown}>
              {content}
              <a className={style.addAccount} onClick={handleEntryModalOpen}>
                {getIn18Text('TIANJIASHEMEIZHUYE')}
              </a>
            </div>
          ) : (
            <Empty
              className={style.empty}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <>
                  <span>{getIn18Text('ZANWUSHUJU')}</span>
                  <a onClick={handleEntryModalOpen}>{getIn18Text('TIANJIASHEMEIZHUYE')}</a>
                </>
              }
            />
          )
        }
        {...restProps}
      />
      {bindingModals}
    </>
  );
};

export default AccountsSelect;
