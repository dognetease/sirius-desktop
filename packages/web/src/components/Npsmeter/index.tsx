import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api, apiHolder, apis, DataTrackerApi } from 'api';
import { useLocalStorageState } from 'ahooks';
import { SignJWT } from 'jose';
import qs from 'querystring';
import { TongyongGuanbiXian } from '@sirius/icons';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import NotificationCard from '@web-common/components/UI/NotificationCard';
import { npsmeter } from '@/components/util/nps';
// import { testData } from './test';
import style from './style.module.scss';

const systemApi = apiHolder.api.getSystemApi();
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
/**
 * 全局问卷  调研vpn使用情况
 * @returns null
 */
export const NpsVpnSurvey = () => {
  // npsmeter
  useEffect(() => {
    if (npsmeter) {
      npsmeter.open('e521cd2e5d3c3a1a');
    }
  }, []);

  return <></>;
};

/**
 * 全局问卷  linkedin使用调研
 * @returns null
 */
export const NpsLinkedIn = () => {
  // npsmeter
  useEffect(() => {
    npsmeter.open('37fb910a0f1feb4d');
  }, []);

  return <></>;
};

function encodeBase64(str: string) {
  try {
    return btoa(str);
  } catch (e) {
    return str;
  }
}

/**
 * 加密user字段
 */

enum EncodeType {
  Base64 = '1',
  JWT = '2',
}

const alg = 'HS256';
export async function signUserField(encodeType: EncodeType): Promise<Record<string, string>> {
  const user = systemApi.getCurrentUser() as unknown as Record<string, string>;
  try {
    const signedUser: Record<string, string> = {};
    if (encodeType === EncodeType.Base64) {
      // 编码方式采用base64
      Object.entries(user).map(async ([key, value]) => {
        const valueStr = JSON.stringify({ value });
        const signedValue = encodeBase64(valueStr);
        signedUser[key] = encodeURIComponent(signedValue);
      });
      return Promise.resolve(signedUser);
    }

    const secret = new TextEncoder().encode('wmnpsparamsecretkey');
    const task = Object.entries(user).map(async ([key, value]) => {
      const jwt = new SignJWT({ value });
      jwt.setProtectedHeader({ alg });
      const signedValue = await jwt.sign(secret);
      // 去掉加密头
      signedUser[key] = signedValue.split('.').slice(1).join('.');
    });
    await Promise.all(task);
    return signedUser;
  } catch (e) {
    return user;
  }
}

/**
 * 替换URL里面变量 （变量字段取自）systemApi.getCurrentUser()
 * @param url
 * @returns Promise<string>
 */
export async function parseNpsUrl(url: string): Promise<string> {
  if (!url) {
    return Promise.resolve('');
  }
  const query = qs.parse(String(url).split('?')[1]);
  let encodeType = EncodeType.JWT;
  if (query.encode) {
    encodeType = query.encode as EncodeType;
  }
  const signedUser = await signUserField(encodeType);
  return String(url).replace(/\$\{([^ {,}]*)\}/gi, (_: string, varKey: string) => signedUser[varKey] || '');
}

/**
 * 配置格式：
  [
    {
      "icon": "https://cowork-storage-public-cdn.lx.netease.com/common/2023/05/23/837a10dc842048f393e7248dc0b3554b.png",
      "title": "满意度调研",
      "desc": "诚邀您参与外贸通满意度调研，期待您的反馈",
      "href": "https://app.npsmeter.cn/webpage/#/index?id=a6217b772a1cb697&userid=${id}&username=${accountName}",
      "npsId": "",
      "target": "_blank"
    },
    {
      "icon": "",
      "title": "",
      "desc": "",
      "href": "",
      "npsId": "b706135efa01d160",
      "target": ""
    }
  ]
 * @returns
 */
interface NPSConfig {
  icon: string;
  desc: string;
  href: string;
  npsId: string;
  target: string;
  title: string;
  silentTime: number;
}

export const NpsSurvey = () => {
  const [npsFlg, setNpsFlag] = useLocalStorageState<Record<string, string>>('WM_NPS_CUSTOMER_FLAG', { defaultValue: {} });
  const [npsConfigs, setNpsConfigs] = useState<NPSConfig[]>([]);
  const [showMap, setShowMap] = useState<Record<string, boolean>>({});
  const flagRef = useRef<Record<string, string>>(npsFlg);

  const delayShow = useCallback(
    (key: string, time: number) => {
      setShowMap(pre => ({ ...pre, [key]: false }));
      setNpsFlag(pre => ({ ...pre, [key]: String(+new Date()) }));
      setTimeout(() => {
        setShowMap(pre => ({ ...pre, [key]: true }));
      }, time);
      trackApi.track('waimao_nps_action', {
        action: 'remind_later',
      });
    },
    [setShowMap, setNpsFlag]
  );

  const hideNps = useCallback(
    (key: string, action: string) => {
      setNpsFlag(pre => ({ ...pre, [key]: 'done' }));
      setShowMap(pre => ({ ...pre, [key]: false }));
      trackApi.track('waimao_nps_action', {
        action,
      });
    },
    [setShowMap, setNpsFlag]
  );

  const linkToNps = useCallback(async (key: string, action: string) => {
    const url = await parseNpsUrl(key);
    systemApi.openNewWindow(url);
    hideNps(key, action);
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.getDataTransApi().get(api.getSystemApi().getUrl('getABSwitch'), {
        wmConfigType: 'nps_config',
        matchPath: 'desktop_optimize',
      });
      const configJsonStr = res?.data?.data?.desktop_optimize?.wm_nps_v2 ?? '';
      let npsConfig: NPSConfig[] = [];
      try {
        npsConfig = JSON.parse(configJsonStr) as NPSConfig[];
      } catch (e) {
        console.error('configJsonStr parse', e);
      }
      // const npsConfig = JSON.parse(configJsonStr) as NPSConfig[];
      // const npsConfig = testData || JSON.parse(configJsonStr) as NPSConfig[];
      const npsState = flagRef.current; // 因为有定时器，此处引用ref
      if (npsConfig && npsConfig?.length) {
        const linkNps = npsConfig.filter(item => {
          if (item?.npsId) {
            // 如果配置了id 则认为是普通问卷
            npsmeter.open(item.npsId);
            return false;
          }

          // 有href以及desc 则认为是站外链接，弹窗显示
          if (item?.href && item?.desc) {
            if (npsState[item.href] === 'done') {
              // 已弹出过 过滤掉，不再展示
              return false;
            }

            if (npsState[item.href] && Number(npsState[item.href])) {
              // 延迟提醒，但在触发前刷新了页面，需要根据情况恢复展示逻辑
              const { silentTime = 3600000 } = item;
              const time = +new Date() - Number(npsState[item.href]);
              if (time < silentTime) {
                // delayShow(item.href, silentTime - time);
                return false;
              }
            }

            // 需立即展示 正常初始化
            setShowMap(pre => ({ ...pre, [item.href]: true }));
            return true;
          }

          // 配置错误 直接过滤
          return false;
        });
        setNpsConfigs(linkNps);
      }
    } finally {
      // 定期刷新配置
      setTimeout(() => fetchConfig(), 60000);
    }
  }, []);

  // 从配置中获取npsId
  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    flagRef.current = npsFlg;
  }, [npsFlg]);

  return (
    <>
      {npsConfigs.map(config => {
        if (!showMap[config.href]) {
          return null;
        }
        return (
          <NotificationCard show={!!true}>
            <div className={style.noviceTaskEntry}>
              <span className={style.closeIcon}>
                <TongyongGuanbiXian onClick={() => hideNps(config.href, 'close')} />
              </span>
              <div className={style.header}>
                {config.icon ? (
                  <div className={style.icon}>
                    <img alt={config.title} src={config.icon} />
                  </div>
                ) : (
                  ''
                )}
                {config.title ? <div className={style.title}>{config.title}</div> : ''}
              </div>
              <div className={style.body}>
                <pre>{config.desc}</pre>
              </div>
              <div className={style.footer}>
                <Button btnType="minorLine" className={style.delayBtn} onClick={() => delayShow(config.href, config.silentTime)}>
                  稍后再说
                </Button>
                <Button btnType="primary" className={style.closeBtn} onClick={() => linkToNps(config.href, 'fill_in_immediately')}>
                  {/* <a
                      className={style.link}
                      onClick={() => hideNps(config.href, 'fill_in_immediately')}
                      href={parseNpsUrl(config.href)}
                      target={config.target || '_blank'}
                    >
                      立即参与
                    </a> */}
                  立即参与
                </Button>
              </div>
            </div>
          </NotificationCard>
        );
      })}
    </>
  );
};
