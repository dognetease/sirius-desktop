import { getIn18Text } from 'api';
import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import {
  apis,
  apiHolder,
  SnsMarketingApi,
  SnsMarketingPlatform,
  SnsMarketingAccount,
  SnsMarketingAccountType,
  SnsAccountBindingStatus,
  getSnsAccountBindingStatusName,
  SnsAccountAuthorizedStatus,
  getSnsAccountAuthorizedStatusName,
  SnsBindingThridLinkReq,
  SnsPlatformName,
} from 'api';
import { Button } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import { openWebUrlWithLoginCode } from '@web-common/utils/utils';
import BindingEntry from './components/BindingEntry';
import BindingEntryModal from './components/BindingEntryModal';
import AccountTypeModal from './components/AccountTypeModal';
import InstagramGuideModal from './components/InstagramGuideModal';
import Avatar from '../components/Avatar';
import { ReactComponent as BindingLoading } from '@web-sns-marketing/images/binding-loading.svg';
import { ReactComponent as BindingSuccess } from '@web-sns-marketing/images/binding-success.svg';
import { ReactComponent as BindingError } from '@web-sns-marketing/images/binding-error.svg';
import { ReactComponent as ArrowRight } from '@web-sns-marketing/images/arrow-right-current-color.svg';
import style from './useAccountBinding.module.scss';

const SnsAccountBindingStatusName = getSnsAccountBindingStatusName();
const SnsAccountAuthorizedStatusName = getSnsAccountAuthorizedStatusName();

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;

const bindingPlatforms = [
  { platform: SnsMarketingPlatform.LINKEDIN, name: SnsPlatformName.LINKEDIN },
  { platform: SnsMarketingPlatform.FACEBOOK, name: SnsPlatformName.FACEBOOK },
  { platform: SnsMarketingPlatform.INSTAGRAM, name: SnsPlatformName.INSTAGRAM },
];

const accountTypes = [
  { accountType: SnsMarketingAccountType.PERSONAL, name: getIn18Text('GERENZHUYE') },
  { accountType: SnsMarketingAccountType.PAGE, name: getIn18Text('GONGSIZHUYE') },
];

const CHECK_DELAY = 2000; // 检查频率
const CHECK_DURATION = 2 * 60 * 1000; // 检查时长

const getAccountAuthorized = (account: SnsMarketingAccount) => account.accountStatus === SnsAccountAuthorizedStatus.AUTHORIZED;

type UseAccountBinding = (config: { onBindFinish: () => void }) => {
  entryList: React.ReactElement;
  bindingModals: React.ReactElement[];
  handleEntryModalOpen: () => void;
  handleCheckingStart: (params: { checkCode: string; platform: SnsMarketingPlatform; accountType: SnsMarketingAccountType }) => void;
  handleBindStart: (platform: SnsMarketingPlatform) => void;
};

const useAccountBinding: UseAccountBinding = config => {
  const { onBindFinish } = config;
  const timerRef = useRef<NodeJS.Timer | null>(null);
  const timeoutRef = useRef<number>(0);
  const [fetchingPlatform, setFetchingPlatform] = useState<SnsMarketingPlatform | null>(null);
  const [fetchingAccountType, setFetchingAccountType] = useState<SnsMarketingAccountType | null>(null);
  const [bindingModalVisible, setBindingModalVisible] = useState<boolean>(false);
  const [accountTypeModalVisible, setAccountTypeModalVisible] = useState<boolean>(false);
  const [checkingModalVisible, setCheckingModalVisible] = useState<boolean>(false);
  const [accountPickModalVisible, setAccountPickModalVisible] = useState<boolean>(false);
  const [accountPickList, setAccountPickList] = useState<SnsMarketingAccount[]>([]);
  const [accountPickedIds, setAccountPickedIds] = useState<string[]>([]);
  const [accountAdding, setAccountAdding] = useState<boolean>(false);
  const [accountPlatform, setAccountPlatform] = useState<SnsMarketingPlatform | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState<boolean>(false);
  const [errorModalVisible, setErrorModalVisible] = useState<boolean>(false);
  const [errorReason, setErrorReason] = useState<string>('');
  const lastThridLinkParams = useRef<SnsBindingThridLinkReq | null>(null);
  const [instagramGuideVisible, setInstagramGuideVisible] = useState<boolean>(false);
  const [instagramLinkFetching, setInstagramLinkFetching] = useState<boolean>(false);
  const [instagramDocsMap, setInstagramDocsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    snsMarketingApi.getSnsHelpDocs({ platform: SnsMarketingPlatform.INSTAGRAM }).then(res => {
      setInstagramDocsMap(
        res.helpDocs.reduce(
          (accumulator, item) => ({
            ...accumulator,
            [item.type]: item.url,
          }),
          {} as Record<string, string>
        )
      );
    });
  }, []);

  const handleTimerClear = () => {
    timerRef.current && clearInterval(timerRef.current);
    timeoutRef.current = 0;
  };

  const handleTimerStart: (params: { checkCode: string; platform: SnsMarketingPlatform; accountType: SnsMarketingAccountType }) => void = ({
    checkCode,
    platform,
    accountType,
  }) => {
    handleTimerClear();

    timeoutRef.current = Date.now() + CHECK_DURATION;

    timerRef.current = setInterval(() => {
      const isTimeout = Date.now() > timeoutRef.current;

      if (isTimeout) {
        handleTimerClear();
        setCheckingModalVisible(false);
        setErrorModalVisible(true);
        setErrorReason(getIn18Text('GUANFANGSHEMEIPINGTAIXIANG'));
        setFetchingPlatform(null);

        return;
      }

      setAccountPlatform(platform);

      snsMarketingApi
        .getSnsBindingAccountStatus({ checkCode })
        .then(res => {
          // 未操作, 即绑定中, 继续轮询
          if (res.bindStatus === SnsAccountBindingStatus.NO_OPERATE) {
            return Promise.reject();
          }
          // 绑定成功
          if (res.bindStatus === SnsAccountBindingStatus.BIND_SUCCESS) {
            handleTimerClear();

            return snsMarketingApi.getSnsBindingAccountDetail({
              checkCode,
              platform,
              accountType,
            });
          }
          // 绑定出错
          handleTimerClear();
          setCheckingModalVisible(false);
          setErrorModalVisible(true);
          setErrorReason(SnsAccountBindingStatusName[res.bindStatus] || '未知错误');
          setFetchingPlatform(null);
          return Promise.reject();
        })
        .then(accounts => {
          setCheckingModalVisible(false);
          setAccountPickList(accounts);
          setAccountPickModalVisible(true);
        });
    }, CHECK_DELAY);
  };

  const handleAccountAdd = () => {
    const accounts = accountPickList.filter(item => accountPickedIds.includes(item.id));

    setAccountAdding(true);

    snsMarketingApi
      .addSnsBindingAccount({
        accountInfos: accounts.map(item => ({
          id: item.id,
          select: true,
          platform: accountPlatform!,
        })),
      })
      .then(() => {
        setAccountPickModalVisible(false);
        setAccountPickList([]);
        setAccountPickedIds([]);
        setAccountPlatform(null);
        setSuccessModalVisible(true);
        onBindFinish();
      })
      .finally(() => {
        setAccountAdding(false);
      });
  };

  useEffect(() => handleTimerClear, []);

  const entryList = (
    <BindingEntry
      platforms={bindingPlatforms}
      fetchingPlatform={fetchingPlatform}
      onBindStart={platform => {
        if (platform === SnsMarketingPlatform.LINKEDIN) {
          setAccountTypeModalVisible(true);
        } else if (platform === SnsMarketingPlatform.INSTAGRAM) {
          setInstagramGuideVisible(true);
        } else {
          setFetchingPlatform(platform);

          lastThridLinkParams.current = {
            platform,
            accountType: SnsMarketingAccountType.PAGE,
          };

          snsMarketingApi
            .getSnsBindingThridLink({
              platform,
              accountType: SnsMarketingAccountType.PAGE,
            })
            .then(res => {
              handleTimerStart({
                checkCode: res.checkCode,
                platform,
                accountType: SnsMarketingAccountType.PAGE,
              });
              setCheckingModalVisible(true);
              window.open(res.loginUrl, '_blank');
            })
            .finally(() => {
              setFetchingPlatform(null);
            });
        }
      }}
    />
  );

  const handleBindStart = (platform: SnsMarketingPlatform) => {
    if (platform === SnsMarketingPlatform.LINKEDIN) {
      setAccountTypeModalVisible(true);
      setBindingModalVisible(false);
    } else if (platform === SnsMarketingPlatform.INSTAGRAM) {
      setInstagramGuideVisible(true);
      setBindingModalVisible(false);
    } else {
      setFetchingPlatform(platform);

      lastThridLinkParams.current = {
        platform,
        accountType: SnsMarketingAccountType.PAGE,
      };

      snsMarketingApi
        .getSnsBindingThridLink({
          platform,
          accountType: SnsMarketingAccountType.PAGE,
        })
        .then(res => {
          handleTimerStart({
            checkCode: res.checkCode,
            platform,
            accountType: SnsMarketingAccountType.PAGE,
          });
          setCheckingModalVisible(true);
          window.open(res.loginUrl, '_blank');
        })
        .finally(() => {
          setFetchingPlatform(null);
          setBindingModalVisible(false);
        });
    }
  };

  const entryModal = (
    <BindingEntryModal
      visible={bindingModalVisible}
      platforms={bindingPlatforms}
      fetchingPlatform={fetchingPlatform}
      onCancel={() => setBindingModalVisible(false)}
      onBindStart={platform => {
        if (platform === SnsMarketingPlatform.LINKEDIN) {
          setAccountTypeModalVisible(true);
          setBindingModalVisible(false);
        } else if (platform === SnsMarketingPlatform.INSTAGRAM) {
          setInstagramGuideVisible(true);
          setBindingModalVisible(false);
        } else {
          setFetchingPlatform(platform);

          lastThridLinkParams.current = {
            platform,
            accountType: SnsMarketingAccountType.PAGE,
          };

          snsMarketingApi
            .getSnsBindingThridLink({
              platform,
              accountType: SnsMarketingAccountType.PAGE,
            })
            .then(res => {
              handleTimerStart({
                checkCode: res.checkCode,
                platform,
                accountType: SnsMarketingAccountType.PAGE,
              });
              setCheckingModalVisible(true);
              window.open(res.loginUrl, '_blank');
            })
            .finally(() => {
              setFetchingPlatform(null);
              setBindingModalVisible(false);
            });
        }
      }}
    />
  );

  const accountTypeModal = (
    <AccountTypeModal
      visible={accountTypeModalVisible}
      title={getIn18Text('QINGXUANZEYAOLIANJIEDE')}
      accountTypes={accountTypes}
      okLoading={!!fetchingAccountType}
      onOk={accountType => {
        const platform = SnsMarketingPlatform.LINKEDIN;

        setFetchingAccountType(accountType);

        lastThridLinkParams.current = {
          platform,
          accountType,
        };

        snsMarketingApi
          .getSnsBindingThridLink({
            platform,
            accountType,
          })
          .then(res => {
            handleTimerStart({
              checkCode: res.checkCode,
              platform,
              accountType,
            });
            setCheckingModalVisible(true);
            window.open(res.loginUrl, '_blank');
          })
          .finally(() => {
            setFetchingAccountType(null);
            setAccountTypeModalVisible(false);
          });
      }}
      onCancel={() => setAccountTypeModalVisible(false)}
    />
  );

  const instagramGuideModal = (
    <InstagramGuideModal
      visible={instagramGuideVisible}
      okLoading={instagramLinkFetching}
      docsMap={instagramDocsMap}
      onOk={() => {
        const platform = SnsMarketingPlatform.INSTAGRAM;
        const accountType = SnsMarketingAccountType.PAGE;

        setInstagramLinkFetching(true);

        lastThridLinkParams.current = {
          platform,
          accountType,
        };

        snsMarketingApi
          .getSnsBindingThridLink({
            platform,
            accountType,
          })
          .then(res => {
            handleTimerStart({
              checkCode: res.checkCode,
              platform,
              accountType,
            });
            setCheckingModalVisible(true);
            window.open(res.loginUrl, '_blank');
          })
          .finally(() => {
            setInstagramLinkFetching(false);
            setInstagramGuideVisible(false);
            setAccountTypeModalVisible(false);
          });
      }}
      onCancel={() => setInstagramGuideVisible(false)}
    />
  );

  const checkingModal = (
    <Modal
      className={style.progress}
      width={356}
      title={null}
      footer={null}
      closable={false}
      keyboard={false}
      maskClosable={false}
      visible={checkingModalVisible}
      getContainer={() => document.body}
    >
      <div className={style.content}>
        <BindingLoading className={classnames(style.icon, style.loading)} />
        <div className={style.title}>{getIn18Text('ZHENGZAIHUODESHEMEIPING')}</div>
        <div className={style.subTitle}>{getIn18Text('XITONGYITIAOZHUANDAOGUAN')}</div>
        <div className={style.options}>
          <Button
            className={style.button}
            type="primary"
            onClick={() => {
              handleTimerClear();
              setCheckingModalVisible(false);
            }}
          >
            {getIn18Text('QUXIAOSHOUQUAN')}
          </Button>
        </div>
      </div>
    </Modal>
  );

  const accountPickModal = (
    <Modal
      title={getIn18Text('XUANZENINYAOTIANJIADE')}
      visible={accountPickModalVisible}
      width={638}
      keyboard={false}
      maskClosable={false}
      getContainer={() => document.body}
      onCancel={() => {
        setAccountPickModalVisible(false);
        setAccountPickList([]);
        setAccountPickedIds([]);
        setErrorModalVisible(true);
        setErrorReason(getIn18Text('WEIXUANZESHOUQUANSHEMEI'));
      }}
      footer={
        <Button type="primary" loading={accountAdding} disabled={!accountPickedIds.length} onClick={handleAccountAdd}>
          {getIn18Text('XIAYIBU')}
        </Button>
      }
    >
      <Table
        rowKey="id"
        scroll={{ y: 312 }}
        columns={[
          {
            title: getIn18Text('ZHUYE'),
            dataIndex: 'account',
            render: (_: any, account: SnsMarketingAccount) => {
              const isAuthorized = getAccountAuthorized(account);

              return (
                <div className={style.accountPickRow}>
                  <Avatar className={style.accountAvatar} size={36} avatar={account.accountAvatar} platform={account.platform} />
                  <div className={style.accountName}>{account.accountName}</div>
                  {isAuthorized && <div className={style.accountStatus}>{SnsAccountAuthorizedStatusName[account.accountStatus]}</div>}
                </div>
              );
            },
          },
        ]}
        pagination={false}
        rowSelection={{
          selectedRowKeys: accountPickedIds,
          getCheckboxProps: (account: SnsMarketingAccount) => {
            const isAuthorized = getAccountAuthorized(account);

            return { disabled: isAuthorized };
          },
          onChange: setAccountPickedIds,
        }}
        onRow={(account: SnsMarketingAccount) => {
          return {
            onClick: () => {
              const isAuthorized = getAccountAuthorized(account);

              if (isAuthorized) return;

              if (accountPickedIds.includes(account.id)) {
                setAccountPickedIds(ids => ids.filter(id => id !== account.id));
              } else {
                setAccountPickedIds(ids => [...ids, account.id]);
              }
            },
          };
        }}
        dataSource={accountPickList}
      />
    </Modal>
  );

  const successModal = (
    <Modal
      className={style.progress}
      width={356}
      title={null}
      footer={null}
      closable={false}
      keyboard={false}
      maskClosable={false}
      visible={successModalVisible}
      getContainer={() => document.body}
    >
      <div className={style.content}>
        <BindingSuccess className={style.icon} />
        <div className={style.title}>{getIn18Text('SHEMEIZHUYESHOUQUANCHENG')}</div>
        <div className={style.subTitle}>{getIn18Text('KEJIXUTIANJIAQITA')}</div>
        <div className={style.options}>
          <Button
            className={style.button}
            onClick={() => {
              setSuccessModalVisible(false);
            }}
          >
            {getIn18Text('WANCHENG')}
          </Button>
          <Button
            className={style.button}
            type="primary"
            onClick={() => {
              setSuccessModalVisible(false);
              setBindingModalVisible(true);
            }}
          >
            {getIn18Text('JIXUSHOUQUAN')}
          </Button>
        </div>
      </div>
    </Modal>
  );

  const isInstagram = accountPlatform === SnsMarketingPlatform.INSTAGRAM;

  const errorModal = (
    <Modal
      className={classnames(style.progress, {
        [style.insErrorModal]: isInstagram,
      })}
      width={isInstagram ? 388 : 356}
      title={null}
      footer={null}
      closable={false}
      keyboard={false}
      maskClosable={false}
      visible={errorModalVisible}
      getContainer={() => document.body}
    >
      <div className={style.content}>
        <BindingError className={style.icon} />
        <div className={style.title}>{getIn18Text('SHEMEIZHUYESHOUQUANSHI')}</div>
        <div className={style.subTitle}>{errorReason}</div>
        {isInstagram && (
          <div className={style.suggestions}>
            <a className={style.helpLink} onClick={() => instagramDocsMap.Details && openWebUrlWithLoginCode(instagramDocsMap.Details)}>
              <span>{getIn18Text('CHAKANBANGZHU')}</span>
              <ArrowRight />
            </a>
            <div className={classnames(style.suggestion, style.suggestionHeader)}>{getIn18Text('NINKEYI：')}</div>
            <div className={style.suggestion}>1、检查要授权的Instagram个人账号已切换为 [业务账号]</div>
            <div className={style.suggestion}>{getIn18Text('2、JIANCHAIns')}</div>
          </div>
        )}
        <div className={style.options}>
          <Button
            className={style.button}
            onClick={() => {
              setErrorModalVisible(false);

              // 避免弹窗关闭动画途中样式闪动
              setTimeout(() => {
                setAccountPlatform(null);
              }, 300);
            }}
          >
            {getIn18Text('CLOSE_TXT')}
          </Button>
          <Button
            className={style.button}
            type="primary"
            loading={!!fetchingPlatform}
            onClick={() => {
              if (lastThridLinkParams.current) {
                const { platform, accountType } = lastThridLinkParams.current;

                setFetchingPlatform(platform);

                snsMarketingApi
                  .getSnsBindingThridLink({
                    platform,
                    accountType,
                  })
                  .then(res => {
                    handleTimerStart({
                      checkCode: res.checkCode,
                      platform,
                      accountType,
                    });
                    setCheckingModalVisible(true);
                    window.open(res.loginUrl, '_blank');
                  })
                  .finally(() => {
                    setFetchingPlatform(null);
                    setErrorModalVisible(false);
                  });
              }
            }}
          >
            {getIn18Text('ZHONGSHI')}
          </Button>
        </div>
      </div>
    </Modal>
  );

  return {
    entryList,
    bindingModals: [entryModal, accountTypeModal, instagramGuideModal, checkingModal, accountPickModal, successModal, errorModal],
    handleEntryModalOpen: () => {
      setBindingModalVisible(true);
    },
    handleCheckingStart: ({ checkCode, platform, accountType }) => {
      lastThridLinkParams.current = { platform, accountType };
      handleTimerStart({ checkCode, platform, accountType });
      setCheckingModalVisible(true);
    },
    handleBindStart,
  };
};

export default useAccountBinding;
