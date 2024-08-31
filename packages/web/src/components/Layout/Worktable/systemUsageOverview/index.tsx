import React, { useCallback, useEffect, useState } from 'react';
import { api, getIn18Text, ResWorktableSysUsage, WorkTableActionsItem, WorktableApi, WorktableFunctionsItem } from 'api';
import { WorktableCard } from '../card';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { navigate } from 'gatsby';
import classNames from 'classnames';
import { useAppSelector } from '@web-common/state/createStore';
import { workTableTrackAction } from '../worktableUtils';
import { routeMenu } from '@lxunit/app-l2c-crm';
import { useVersionCheck } from '@web-common/hooks/useVersion';
import styles from './index.module.scss';

const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;
const systemApi = api.getSystemApi();
const isEdmWeb = systemApi.isWebWmEntry();

export const SystemUsageOverview = () => {
  const [viewList, setViewList] = useState<ResWorktableSysUsage[]>([]);
  const menuKeys = useAppSelector(s => s.privilegeReducer.visibleMenuLabels);
  const [loading, setLoading] = useState(false);
  const v1v2 = useVersionCheck();
  const SYSUSAGETEXT: any = {
    GLOBAL_SEARCH: {
      description: getIn18Text('CustomerAcquisitionByData'),
      GLOBAL_SEARCH: {
        description: getIn18Text('QUANQIUSOU'),
        jumpTo: '#wmData?page=globalSearch',
        unusedBtnText: getIn18Text('QUSOUKE'),
        usageBtnText: getIn18Text('QUSOUKE'),
        actionId: 'data_acquisition_global_search',
        usageText: getIn18Text('WEISHIYONG'),
        globalTotalSearchCount: {
          description: getIn18Text('JIANSUO'),
          unit: getIn18Text('CI'),
        },
      },
      CUSTOMS_DATA: {
        description: getIn18Text('HAIGUANSHUJU'),
        jumpTo: '#wmData?page=customs',
        unusedBtnText: getIn18Text('QUSOUKE'),
        usageBtnText: getIn18Text('QUSOUKE'),
        actionId: 'data_acquisition_customs_data',
        usageText: getIn18Text('WEISHIYONG'),
        customsTotalSearchCount: {
          description: getIn18Text('JIANSUO'),
          unit: getIn18Text('CI'),
        },
      },
      BROWSER_PLUGIN: {
        description: getIn18Text('LIULANQICHAJIAN'),
        jumpTo: document.body.dataset.extensionInstalled
          ? '#wmData?page=extension'
          : 'https://chrome.google.com/webstore/detail/%E7%BD%91%E6%98%93%E5%A4%96%E8%B4%B8%E9%80%9A%E5%8A%A9%E6%89%8B/fbaccmibmbdppbofdglbfakjalaepkna',
        unusedBtnText: getIn18Text('WEISHIYONG'),
        usageBtnText: document.body.dataset.extensionInstalled ? getIn18Text('QUSHIYONG') : getIn18Text('ANZHUANGCHAJIAN'),
        actionId: 'data_acquisition_browser_plugin',
        usageText: getIn18Text('WEISHIYONG'),
        PULL: {
          description: getIn18Text('YOUXIANGZHUAQU'),
          unit: getIn18Text('CI'),
        },
      },
      INTELLIGENT_SUBSCRIPTION: {
        description: getIn18Text('ZHINENGDINGYUE'),
        jumpTo: '#wmData?page=star',
        unusedBtnText: getIn18Text('QUDINGYUE'),
        usageBtnText: getIn18Text('CHAKANDINGYUE'),
        actionId: 'data_acquisition_smart_subscription',
        usageText: getIn18Text('WEISHIYONG'),
        collectTotalCount: {
          description: getIn18Text('DINGYUE'),
          unit: getIn18Text('GEGONGSI'),
        },
        subscribeTotalCount: {
          description: '',
          unit: getIn18Text('GECHANPIN'),
        },
      },
    },
    EDM: {
      description: getIn18Text('ZHINENGYINGXIAO'),
      MARKETING_HOSTING: {
        description: getIn18Text('YINGXIAOTUOGUAN'),
        jumpTo: isEdmWeb ? '#intelliMarketing?page=aiHosting' : '#edm?page=aiHosting',
        unusedBtnText: getIn18Text('QUPEIZHI'),
        usageBtnText: getIn18Text('QUPEIZHI'),
        actionId: 'intelligent_marketing_marketing_hosting',
        usageText: getIn18Text('WEIPEIZHI'),
        CONFIG: {
          description: getIn18Text('YIPEIZHI'),
        },
      },
      EMAIL_MARKETING: {
        description: getIn18Text('YOUJIANYINGXIAO'),
        jumpTo: isEdmWeb ? '#intelliMarketing?page=write' : '#edm?page=write',
        unusedBtnText: getIn18Text('QUFAXIN'),
        usageBtnText: getIn18Text('QUFAXIN'),
        actionId: 'intelligent_marketing_email_marketing',
        usageText: getIn18Text('WEISHIYONG'),
        USE: {
          description: getIn18Text('LEIJIFASONG'),
          unit: getIn18Text('GERENWU'),
        },
      },
      EMAIL_AI: {
        description: getIn18Text('AIXIEXIN/GAIXIE'),
        jumpTo: isEdmWeb ? '#intelliMarketing?page=write&from=template' : '#edm?page=write&from=template',
        unusedBtnText: getIn18Text('QUSHIYONG'),
        usageBtnText: getIn18Text('QUSHIYONG'),
        actionId: 'intelligent_marketing_ai_production_content',
        usageText: getIn18Text('WEISHIYONG'),
        USE: {
          description: getIn18Text('SHIYONG'),
          unit: getIn18Text('CI'),
        },
      },
      SECOND_MARKETING: {
        description: '多轮营销',
        jumpTo: isEdmWeb ? '#intelliMarketing?page=write&from=template' : '#edm?page=write&from=template', // ?
        unusedBtnText: getIn18Text('QUSHIYONG'),
        usageBtnText: getIn18Text('QUSHIYONG'),
        actionId: 'intelligent_marketing_secondary_marketing',
        usageText: getIn18Text('WEISHIYONG'),
        USE: {
          description: getIn18Text('SHIYONG'),
          unit: getIn18Text('CI'),
        },
      },
      AUTO_MARKETING: {
        description: getIn18Text('ZIDONGHUAYINGXIAO'),
        jumpTo: isEdmWeb ? '#intelliMarketing?page=autoMarketTask' : '#edm?page=autoMarketTask',
        unusedBtnText: getIn18Text('QUPEIZHI'),
        usageBtnText: getIn18Text('QUPEIZHI'),
        actionId: 'intelligent_marketing_automated_marketing',
        usageText: getIn18Text('WEISHIYONG'),
        CONFIG: {
          description: getIn18Text('YIPEIZHI'),
          unit: getIn18Text('GERENWU'),
        },
        EXEC: {
          description: getIn18Text('ZHIXING'),
          unit: getIn18Text('CI'),
        },
      },
    },
    WEBSITE_ADMIN: {
      description: getIn18Text('ZHANDIANGUANLIv16'),
      WEBSITE_ADMIN: {
        description: getIn18Text('ZHANDIANFABU'), // 未发布
        unDeployDesc: getIn18Text('NINDEZHANDIANWEIFABU'), // 未发布
        unDeployBtnText: getIn18Text('QUFABU'),

        deployScanTitle: getIn18Text('ZHANDIANFANGWEN'), // 已发布、有浏览
        deployBtnText: getIn18Text('QUCHAKANV2'),

        deployNoScanBtnText: getIn18Text('QUGUANLI'), // 已发布、没有浏览
        deployNoScanText: getIn18Text('JINQIRIMEIYOUKEHU'), // 已发布、没有浏览

        jumpTo: '#site?page=mySite', // 无站点，去发布 / 有站点，无数据
        deployJumpTo: '/#site?page=stat', // 有站点，有数据
        actionId: 'site_management',
        onlineSiteNum: {
          description: '',
        },
        referIntentionNum: {
          description: '',
          unit: getIn18Text('GEKEHULIUZI'),
        },
        viewCustomerNum: {
          description: getIn18Text('JINQIRI'), // 已发布、有浏览
          unit: getIn18Text('GEKEHULIULAN'),
        },
      },
    },
    CONTACT: {
      description: getIn18Text('KEHUGUANLI'),
      CUSTOMER: {
        description: getIn18Text('KEHU'),
        jumpTo: 'custom',
        unusedBtnText: getIn18Text('CHUANGJIANKEHU'),
        usageBtnText: getIn18Text('CHUANGJIANKEHU'),
        actionId: 'customer_management_customer',
        usageText: getIn18Text('WEISHIYONG'),
        CREATE: {
          description: getIn18Text('LEIJICHUANGJIAN'),
          unit: getIn18Text('GEKEHU'),
        },
      },
      OPPORTUNITY: {
        description: getIn18Text('SHANGJI'),
        jumpTo: 'business',
        unusedBtnText: getIn18Text('CHUANGJIANSHANGJI'),
        usageBtnText: getIn18Text('CHUANGJIANSHANGJI'),
        actionId: 'customer_management_business_opportunity',
        usageText: getIn18Text('WEISHIYONG'),
        CREATE: {
          description: getIn18Text('LEIJICHUANGJIAN'),
          unit: getIn18Text('GESHANGJI'),
        },
      },
      ORDER: {
        description: getIn18Text('DINGDAN'),
        jumpTo: 'sellOrder',
        unusedBtnText: getIn18Text('GUANLIDINGDAN'),
        usageBtnText: getIn18Text('GUANLIDINGDAN'),
        actionId: 'customer_management_order',
        usageText: getIn18Text('WEISHIYONG'),
        CREATE: {
          description: getIn18Text('LEIJICHUANGJIAN'),
          unit: getIn18Text('GEDINGDAN'),
        },
      },
      PRODUCT: {
        description: getIn18Text('SHANGPIN'),
        jumpTo: 'localProduct',
        unusedBtnText: getIn18Text('GUANLIBENDESHANGPIN'),
        usageBtnText: getIn18Text('GUANLIBENDESHANGPIN'),
        actionId: 'customer_management_local_shops',
        usageText: getIn18Text('WEISHIYONG'),
        CREATE: {
          description: getIn18Text('LEIJICHUANGJIAN'),
          unit: getIn18Text('GEBENDESHANGPIN'),
        },
      },
    },
  };

  const getSysUsageView = useCallback(async (menuKeys: Record<string, boolean>) => {
    try {
      const res = await worktableApi.getSysUsageView();
      setLoading(false);
      const filteredData = res.map(module => {
        let filteredFunctions: string | any[] = [];
        if (v1v2 === 'v2') {
          filteredFunctions = module.functions.filter(func => menuKeys[func.menu2]);
        } else {
          filteredFunctions = module.functions.filter(func => menuKeys[func.menu]);
        }
        if (filteredFunctions.length > 0) {
          return { ...module, functions: filteredFunctions };
        }
        return null;
      });
      const viewList = filteredData.filter(module => module !== null) as ResWorktableSysUsage[];
      setViewList(viewList);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (Object.keys(menuKeys).length > 0) {
      setLoading(true);
      getSysUsageView(menuKeys);
    }
  }, [getSysUsageView, menuKeys]);

  const getActions = (prefix: string = '', fun: WorkTableActionsItem[], view: ResWorktableSysUsage, f: WorktableFunctionsItem) => {
    let str: string = '';
    fun.forEach(item => {
      if (prefix === 'WEBSITE_ADMIN' && item.action === 'onlineSiteNum') {
        return;
      }
      if (item.num !== 0) {
        const text = SYSUSAGETEXT[view?.module][f?.function][item?.action];
        str += text?.description + (prefix === 'MARKETING_HOSTING' ? '' : item.num) + (text?.unit || '') + '，';
      }
    });
    const newStr = str.replace(/^，|，$/g, '');

    const parts = newStr.split(/(\d+)/g).map((part, index) => {
      if (/^\d+$/.test(part)) {
        // 如果是数字，用 <span> 标签包裹并设置样式
        return (
          <span key={index} className={styles.numStr}>
            {part}
          </span>
        );
      } else {
        // 如果不是数字，直接渲染
        return <span key={index}>{part}</span>;
      }
    });
    return <span>{parts}</span>;
  };

  const checkConfig = (fun: WorkTableActionsItem[], view: ResWorktableSysUsage, f: WorktableFunctionsItem): string => {
    const moduleName = view?.module || '';
    if (moduleName === 'WEBSITE_ADMIN') {
      // onlineSiteNum：站点发布数
      // referIntentionNum：客户留资数
      // viewCustomerNum：客户浏览数
      const deployNum = fun.find(item => item.action === 'onlineSiteNum')?.num || 0;
      const scanNum = fun.find(item => item.action === 'viewCustomerNum')?.num || 0;
      if (deployNum <= 0) {
        return SYSUSAGETEXT[view?.module][f?.function]?.unDeployDesc;
      } else {
        if (scanNum > 0) {
          return '';
        } else {
          return SYSUSAGETEXT[view?.module][f?.function]?.deployNoScanText;
        }
      }
    } else {
      const target = fun.every(item => item.num === 0);
      return target ? SYSUSAGETEXT[view?.module][f?.function]?.usageText : '';
    }
  };

  const handleClick = (fun: WorkTableActionsItem[], prefix: any, view: ResWorktableSysUsage) => {
    let url: string = prefix?.jumpTo || '';
    const actionId: string = prefix?.actionId || '';
    const moduleName = view?.module || '';
    workTableTrackAction('waimao_worktable_feature', actionId);
    if (moduleName === 'CONTACT') {
      window.location.hash = '#/unitable-crm' + routeMenu[url]['path'];
    } else if (moduleName === 'WEBSITE_ADMIN') {
      const deployNum = fun.find(item => item.action === 'onlineSiteNum')?.num || 0;
      const scanNum = fun.find(item => item.action === 'viewCustomerNum')?.num || 0;
      if (deployNum > 0 && scanNum > 0) {
        url = prefix?.deployJumpTo || '';
      }
      navigate(url);
    } else {
      if (url.includes('https')) {
        window.open(url, '_blank');
      } else {
        url && navigate(url);
      }
    }
  };

  const getBtnText = (fun: WorkTableActionsItem[], view: ResWorktableSysUsage, f: WorktableFunctionsItem) => {
    const moduleName = view.module;
    if (moduleName === 'WEBSITE_ADMIN') {
      const deployNum = fun.find(item => item.action === 'onlineSiteNum')?.num || 0;
      const scanNum = fun.find(item => item.action === 'viewCustomerNum')?.num || 0;
      if (deployNum <= 0) {
        return SYSUSAGETEXT[view?.module][f?.function]?.unDeployBtnText;
      } else {
        if (scanNum > 0) {
          return SYSUSAGETEXT[view?.module][f?.function]?.deployBtnText;
        } else {
          return SYSUSAGETEXT[view?.module][f?.function]?.deployNoScanBtnText;
        }
      }
    } else {
      const target = fun.every(item => item.num === 0);
      return target ? SYSUSAGETEXT[view?.module][f?.function]?.unusedBtnText : SYSUSAGETEXT[view?.module][f?.function]?.usageBtnText;
    }
  };

  const getTitle = (fun: WorkTableActionsItem[], view: ResWorktableSysUsage, f: WorktableFunctionsItem, prefix: any) => {
    const deployNum = fun.find(item => item.action === 'onlineSiteNum')?.num || 0;
    if (deployNum <= 0) {
      return prefix?.description;
    } else {
      return SYSUSAGETEXT[view?.module][f?.function]?.deployScanTitle;
    }
  };

  return (
    <WorktableCard
      title={getIn18Text('GONGNENGSHIYONGGAILAN')}
      titleStyles={{
        fontSize: 16,
      }}
      wrapStyles={{ padding: '20px 18px 0px 18px' }}
      loading={loading}
    >
      <div className={classNames(styles.body, 'wk-no-drag')}>
        {viewList.map(view => (
          <div className={styles.viewWrapper}>
            <p>{SYSUSAGETEXT[view.module].description}</p>
            <div className={styles.actionView}>
              {view?.functions.map(f => {
                const prefix = SYSUSAGETEXT[view?.module][f?.function];
                return (
                  <>
                    {prefix?.description && (
                      <div className={styles.viewBox}>
                        <div className={styles.top}>{getTitle(f.actions, view, f, prefix)}</div>
                        <div className={styles.middle}>{checkConfig(f.actions, view, f) || getActions(f?.function, f.actions, view, f)}</div>
                        <span>
                          <Button inline size="small" className={styles.actionBtn} onClick={() => handleClick(f.actions, prefix, view)}>
                            {getBtnText(f.actions, view, f)}
                          </Button>
                        </span>
                      </div>
                    )}
                  </>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </WorktableCard>
  );
};
