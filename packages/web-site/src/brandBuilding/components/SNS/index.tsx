import React, { useState, useEffect, useRef } from 'react';
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
import useAccountBinding from '@web-sns-marketing/accountBinding/useAccountBinding';
import { Card } from '../Card';
import BrandImg from '../../../images/brand-1.png';
import Loading from '../../../images/loading.gif';
import styles from './index.module.scss';
import { ReactComponent as LinkIcon } from '../../../images/link-icon.svg';
import { TongyongJiantou1Zuo, TongyongJiantou1You } from '@sirius/icons';
import FacebookOrigin from '@web-sns-marketing/images/FACEBOOK_ORIGIN.svg';
import LinkedInOrigin from '@web-sns-marketing/images/LINKEDIN_ORIGIN.svg';
import InstagramOrigin from '@web-sns-marketing/images/INSTAGRAM_ORIGIN.svg';
import DefaultAvatar from '@web-sns-marketing/images/default-avatar.svg';
import FacebookTiny from '@web-sns-marketing/images/FACEBOOK_TINY.svg';
import LinkedInTiny from '@web-sns-marketing/images/LINKEDIN_TINY.svg';
import InstagramTiny from '@web-sns-marketing/images/INSTAGRAM_TINY.svg';
import { encodeAccountsQuery } from '@web-sns-marketing/utils';

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;
interface Props {
  onClick: () => void;
}

const IconMap = {
  [SnsMarketingPlatform.FACEBOOK]: FacebookOrigin,
  [SnsMarketingPlatform.LINKEDIN]: LinkedInOrigin,
  [SnsMarketingPlatform.INSTAGRAM]: InstagramOrigin,
};

const SmallIconMap = {
  [SnsMarketingPlatform.FACEBOOK]: FacebookTiny,
  [SnsMarketingPlatform.LINKEDIN]: LinkedInTiny,
  [SnsMarketingPlatform.INSTAGRAM]: InstagramTiny,
};

const initialParams: SnsBindingAccountsReq = {
  order: 'ASC',
  page: 1,
  size: 4,
  sortBy: '',
  status: undefined,
  pageName: '',
  platform: undefined,
};

export const SNS = (props: Props) => {
  const { onClick } = props;
  const [params, setParams] = useState<SnsBindingAccountsReq>({ ...initialParams });
  const [accounts, setAccounts] = useState<SnsMarketingAccount[]>([]);
  const [fetching, setFetching] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const fetchedTimeRef = useRef<number>(0);
  const { bindingModals, handleBindStart, handleCheckingStart } = useAccountBinding({
    onBindFinish: () => setParams({ ...initialParams }),
  });

  const getPlatform = () => {
    return snsMarketingApi.getSnsBindingAccountsAll({ toastError: false } as any).then(res => {
      const list: SnsMarketingAccount[] = [];
      const accountList = res.accountList;
      if (accountList.every(i => i.platform !== SnsMarketingPlatform.FACEBOOK)) {
        list.push({
          id: '',
          accountId: '',
          accountAvatar: '',
          accountName: 'Facebook 未绑定',
          platform: SnsMarketingPlatform.FACEBOOK,
        } as any);
      }
      if (accountList.every(i => i.platform !== SnsMarketingPlatform.LINKEDIN)) {
        list.push({
          id: '',
          accountId: '',
          accountAvatar: '',
          accountName: 'Linkedin 未绑定',
          platform: SnsMarketingPlatform.LINKEDIN,
        } as any);
      }
      if (accountList.every(i => i.platform !== SnsMarketingPlatform.INSTAGRAM)) {
        list.push({
          id: '',
          accountId: '',
          accountAvatar: '',
          accountName: 'Instagram 未绑定',
          platform: SnsMarketingPlatform.INSTAGRAM,
        } as any);
      }
      return list;
    });
  };

  useEffect(() => {
    let didCancel = false;

    setFetching(true);
    Promise.all([
      getPlatform(),
      snsMarketingApi.getSnsBindingAccounts({ ...params, toastError: false } as any).then(res => {
        if (didCancel) return;

        fetchedTimeRef.current = fetchedTimeRef.current + 1;
        return res;
      }),
    ])
      .then(res => {
        const [pList, accountList] = res;
        if (accountList && accountList.total) {
          setAccounts([...accountList.results, ...pList].slice(0, 4));
          setTotal(accountList.total + pList.length);
        }
      })
      .finally(() => {
        if (didCancel) return;

        setFetching(false);
      });

    return () => {
      didCancel = true;
    };
  }, [params]);

  // 去站点数据
  const goAccount = () => {
    navigate('#site?page=snsAccountBinding');
  };

  const goPrev = () => {
    if (params.page <= 1) return;
    setParams({ ...params, page: params.page - 1 });
  };

  const goNext = () => {
    if (params.page >= Math.ceil(total / 4)) return;
    setParams({ ...params, page: params.page + 1 });
  };

  const handleTaskCreate = (account: SnsMarketingAccount) => {
    const accounts = encodeAccountsQuery([account]);

    navigate(`#site?page=snsMarketingTaskEdit&from=brandBuilding&accounts=${accounts}`);
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

  return (
    <Card
      title="我的社媒"
      ops={
        !fetching && !accounts.length ? null : (
          <div className={styles.pagnation}>
            <div className={params.page === 1 ? styles.prevDisabled : styles.prev} onClick={goPrev}>
              <TongyongJiantou1Zuo wrapClassName="wmzz" size={16} />
            </div>
            <div className={params.page === Math.ceil(total / 4) ? styles.nextDisabled : styles.next} onClick={goNext}>
              <TongyongJiantou1You wrapClassName="wmzz" size={16} />
            </div>
          </div>
        )
      }
    >
      {!fetching && !accounts.length ? (
        <div className={styles.container}>
          <img src={BrandImg} />
          <div className={styles.content}>
            <div className={styles.title}>
              <span>海外社媒</span>
              <span className={styles.more}>「一站式管理」</span>
              <span>，轻松做品牌</span>
            </div>
            <div className={styles.subTitle}>链接海外20亿用户，精准触达做宣传</div>
            <div className={styles.list}>
              <div className={styles.item}>
                <div className={styles.itemTitle}>
                  <span></span>
                  账号管理
                </div>
                <div className={styles.itemInfo}>账号代申请｜新手养号｜粉丝代增长</div>
              </div>
              <div className={styles.split}></div>
              <div className={styles.item}>
                <div className={styles.itemTitle}>
                  <span></span>
                  账号运管
                </div>
                <div className={styles.itemInfo}>自动化推送｜AI助手｜营销日历</div>
              </div>
            </div>
          </div>
          <div className={styles.btnFace} onClick={goAccount}>
            <LinkIcon />
            绑定社媒账号
          </div>
        </div>
      ) : (
        <div className={styles.accountList}>
          {accounts.map(account => {
            const { accountAvatar, accountName, id, postCount, commentCount, contactCount, platform, accountStatus } = account;
            return (
              <div className={styles.account} key={id || accountName}>
                <div className={styles.accountContainer}>
                  {<img src={(id ? accountAvatar : IconMap[platform]) || DefaultAvatar} className={styles.avatar} />}
                  {id && platform && SmallIconMap[platform] ? <img src={SmallIconMap[platform]} className={styles.platformIcon} /> : null}

                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{accountName}</div>
                    <div className={styles.accountInfoList}>
                      {id ? (
                        <>
                          {accountStatus === SnsAccountAuthorizedStatus.AUTHORIZED ? (
                            <>
                              <div className={styles.accountInfo}>{contactCount >= 10000 ? `${(contactCount / 10000).toFixed(1)}w` : contactCount}粉丝</div>
                              <span />
                              <div className={styles.accountInfo}>{postCount >= 10000 ? `${(postCount / 10000).toFixed(1)}w` : postCount}帖子</div>
                              <span />
                              <div className={styles.accountInfo}>{commentCount >= 10000 ? `${(commentCount / 10000).toFixed(1)}w` : commentCount}评论</div>
                            </>
                          ) : (
                            <div className={styles.failed}>授权失败</div>
                          )}
                        </>
                      ) : (
                        <div className={styles.accountInfo}>绑定账号高效管理</div>
                      )}
                    </div>
                  </div>
                </div>
                {id ? (
                  <>
                    {accountStatus === SnsAccountAuthorizedStatus.AUTHORIZED ? (
                      <div className={styles.createBtn} onClick={() => handleTaskCreate(account)}>
                        创建任务
                      </div>
                    ) : (
                      <div className={styles.bindNow} onClick={() => handleAccountRebind(account)}>
                        重新授权
                        <TongyongJiantou1You wrapClassName="wmzz" size={16} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.bindNow} onClick={() => handleBindStart(platform)}>
                    立即绑定
                    <TongyongJiantou1You wrapClassName="wmzz" size={16} />
                  </div>
                )}
              </div>
            );
          })}
          {fetching ? <img className={styles.loading} src={Loading} /> : null}
          {bindingModals}
        </div>
      )}
    </Card>
  );
};
