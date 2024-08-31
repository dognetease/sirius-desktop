import { getIn18Text } from 'api';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  apis,
  apiHolder,
  SnsMarketingApi,
  SnsMarketingAccount,
  SnsBindingAccountsReq,
  SnsAccountAuthorizedStatus,
  getSnsAccountAuthorizedStatusName,
  SnsMarketingPlatform,
  SnsPlatformName,
} from 'api';
import { navigate } from '@reach/router';
import { Alert, Spin, Pagination } from 'antd';
import { useOpenHelpCenter } from '@web-common/utils/utils';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import { EnhanceSelect as Select, InSingleOption as Option } from '@web-common/components/UI/Select';
import { EnhanceSelect as Select, InSingleOption as Option } from '@lingxi-common-component/sirius-ui/Select';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import AccountCard from './components/AccountCard';
import useAccountBinding from './useAccountBinding';
import { ReactComponent as SearchIcon } from '@web-sns-marketing/images/search.svg';
import { ReactComponent as AccountsEmptyIcon } from '@web-sns-marketing/images/accounts-empty.svg';
import { encodeAccountsQuery } from '../utils';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { HocOrderState } from '../components/orderStateTip';
import style from './index.module.scss';

const SnsAccountAuthorizedStatusName = getSnsAccountAuthorizedStatusName();

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;

const initialParams: SnsBindingAccountsReq = {
  order: 'ASC',
  page: 1,
  size: 20,
  sortBy: '',
  status: undefined,
  pageName: '',
  platform: undefined,
};

const AccountBinding = () => {
  const [params, setParams] = useState<SnsBindingAccountsReq>({ ...initialParams });
  const [accounts, setAccounts] = useState<SnsMarketingAccount[]>([]);
  const [fetching, setFetching] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const fetchedTimeRef = useRef<number>(0);
  const noAccountsBound = fetchedTimeRef.current <= 1 && !accounts.length;
  const openHelpCenter = useOpenHelpCenter();

  const { entryList, bindingModals, handleEntryModalOpen, handleCheckingStart } = useAccountBinding({
    onBindFinish: () => setParams({ ...initialParams }),
  });

  useEffect(() => {
    let didCancel = false;

    setFetching(true);

    snsMarketingApi
      .getSnsBindingAccounts(params)
      .then(res => {
        if (didCancel) return;

        fetchedTimeRef.current = fetchedTimeRef.current + 1;
        setAccounts(res.results);
        setTotal(res.total);
      })
      .finally(() => {
        if (didCancel) return;

        setFetching(false);
      });

    return () => {
      didCancel = true;
    };
  }, [params]);

  const handleTaskCreate = (account: SnsMarketingAccount) => {
    const accounts = encodeAccountsQuery([account]);

    navigate(`#site?page=snsMarketingTaskEdit&from=snsAccountBinding&accounts=${accounts}`);
  };

  const handleAccountCancel = (account: SnsMarketingAccount) => {
    Modal.confirm({
      title: getIn18Text('QUXIAOSHOUQUAN'),
      content: getIn18Text('QUXIAOSHOUQUANHOU，GAI'),
      onOk: () =>
        snsMarketingApi.cancelSnsBindingAccount({ id: account.id }).then(() => {
          setParams({ ...params });
        }),
    });
  };

  const handleAccountDelete = (account: SnsMarketingAccount) => {
    Modal.confirm({
      title: getIn18Text('SHANCHUSHEMEIZHUYE'),
      content: getIn18Text('SHANCHUHOU，GAIZHUYE'),
      onOk: () =>
        snsMarketingApi.deleteSnsBindingAccount({ id: account.id }).then(() => {
          setParams({ ...params });
        }),
    });
  };

  const handleAccountRebind = (account: SnsMarketingAccount) => {
    const { platform, accountType } = account;

    snsMarketingApi.getSnsBindingThridLink({ platform, accountType }).then(res => {
      window.open(res.loginUrl, '_blank');
      handleCheckingStart({
        checkCode: res.checkCode,
        platform,
        accountType,
      });
    });
  };

  const onKnowledgeCenterClick = (e: MouseEvent) => {
    openHelpCenter('/d/1665713091087720450.html');
    e.preventDefault();
  };

  return (
    <PermissionCheckPage resourceLabel="SOCIAL_MEDIA" accessLabel="VIEW" menu="SOCIAL_MEDIA_ACCOUNT">
      <div className={style.accountBinding}>
        <div className={style.header}>
          <div className={style.title}>{getIn18Text('SHEMEISHOUQUAN')}</div>
          <div className={style.subTitle}>{getIn18Text('DUIYISHOUQUANDESHEMEI')}</div>
          <a className={style.learnMore} onClick={onKnowledgeCenterClick}>
            {getIn18Text('LIAOJIEGENGDUO')}
          </a>
          <PrivilegeCheck resourceLabel="SOCIAL_MEDIA" accessLabel="OP">
            <Button className={style.addPage} btnType="primary" onClick={handleEntryModalOpen}>
              {getIn18Text('TIANJIASHEMEIZHUYE')}
            </Button>
          </PrivilegeCheck>
        </div>
        <div className={style.body}>
          <Alert
            className={style.notice}
            message={noAccountsBound ? getIn18Text('WENXINTISHI：SHOUQUAN') : getIn18Text('GUANLININSUOYOUDESHE')}
            type="warning"
            showIcon
            closable
          />
          {!noAccountsBound && (
            <div className={style.filter}>
              <Select
                placeholder={getIn18Text('QUANBUSHEMEIPINGTAI')}
                size="large"
                value={params.platform}
                allowClear
                dropdownMatchSelectWidth={false}
                onChange={platform =>
                  setParams({
                    ...params,
                    platform,
                    page: 1,
                    size: 20,
                  })
                }
              >
                <Option value={SnsMarketingPlatform.LINKEDIN}>{SnsPlatformName.LINKEDIN}</Option>
                <Option value={SnsMarketingPlatform.FACEBOOK}>{SnsPlatformName.FACEBOOK}</Option>
                <Option value={SnsMarketingPlatform.INSTAGRAM}>{SnsPlatformName.INSTAGRAM}</Option>
              </Select>
              <Select
                placeholder={getIn18Text('QUANBUSHOUQUANZHUANGTAI')}
                size="large"
                value={params.status}
                allowClear
                dropdownMatchSelectWidth={false}
                onChange={status =>
                  setParams({
                    ...params,
                    status,
                    page: 1,
                    size: 20,
                  })
                }
              >
                <Option value={SnsAccountAuthorizedStatus.AUTHORIZED}>{SnsAccountAuthorizedStatusName.AUTHORIZED}</Option>
                <Option value={SnsAccountAuthorizedStatus.EXPIRES}>{SnsAccountAuthorizedStatusName.EXPIRES}</Option>
              </Select>
              <Input
                className={style.pageName}
                size="middle"
                placeholder={getIn18Text('QINGSHURUZHUYEMINGCHENG')}
                value={params.pageName}
                onChange={e =>
                  setParams({
                    ...params,
                    pageName: e.target.value,
                    page: 1,
                    size: 20,
                  })
                }
                prefix={<SearchIcon />}
              />
            </div>
          )}
          <div className={style.content}>
            {fetching ? (
              <Spin className={style.loading} spinning />
            ) : noAccountsBound ? (
              entryList
            ) : accounts.length ? (
              <div className={style.accounts}>
                {accounts.map(account => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onTaskCreate={() => handleTaskCreate(account)}
                    onAccountCancel={() => handleAccountCancel(account)}
                    onAccountDelete={() => handleAccountDelete(account)}
                    onAccountRebind={() => handleAccountRebind(account)}
                  />
                ))}
              </div>
            ) : (
              <div className={style.empty}>
                <AccountsEmptyIcon className={style.emptyIcon} />
                <div className={style.emptyTip}>{getIn18Text('ZANWEIZHAODAOSOUSUONEI')}</div>
              </div>
            )}
          </div>
          <Pagination
            className={style.pagination}
            total={total}
            current={params.page}
            pageSize={params.size}
            pageSizeOptions={['20', '50', '100']}
            hideOnSinglePage
            onChange={(page, size) => {
              setParams({
                ...params,
                page: size === params.size ? page : 1,
                size: size as number,
              });
            }}
          />
        </div>
        {bindingModals}
      </div>
    </PermissionCheckPage>
  );
};

export default HocOrderState(AccountBinding);
