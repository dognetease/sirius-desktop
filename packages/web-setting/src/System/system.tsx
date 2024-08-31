import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Checkbox, Radio, RadioChangeEvent, Tooltip } from 'antd';
import {
  apiHolder as api,
  apis,
  SystemApi,
  inWindow,
  WebMailApi,
  conf,
  MailConfApi,
  SYSTEM_PROXY_TYPES,
  SYSTEM_PROXY_TYPE,
  defaultSystemProxyType,
  DataStoreApi,
  MailApi,
  getOs,
} from 'api';
import { navigate } from 'gatsby';
import classnames from 'classnames';
import styles from './index.module.scss';
import { getBodyFixHeight } from '@web-common/utils/constant';
import { ReactComponent as IconWarn } from '@/images/icons/icon-warn.svg';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import SwitchModal from '@web-common/components/LanguageSwitchModal/languageSwitchModal';
import { OldVersionModal } from '@web-mail/components/OldVersionEntry/OldVersionModal';
import { useAppDispatch } from '@web-common/state/createStore';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import { Input } from 'antd';
import SystemOptimize from './systemoptimize';
const isWebWmEntry = api.api.getSystemApi().isWebWmEntry();

type AutoLaunchType = 'CLOSE' | 'OPEN' | 'OPEN_TRAY';
type Lang = 'zh' | 'en';
let langTemp: Lang = 'zh';
const WEB_MAIL = 'webmail';
const SYSTEM_LANGUAGE = 'system_language';
const SYSTEM_THEME = 'system_theme';
const LOCAL_TIME_ZONE = -999;
const SYSTEM_ZOOM_KEY = -1;

const PAGE_ZOOM_LIST = [
  {
    key: SYSTEM_ZOOM_KEY,
    value: getIn18Text('GENSUIXITONG'),
  },
  ...[0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 3].map(key => {
    return {
      key: key,
      value: `${key * 100}%`,
    };
  }),
];
const TIMEZONE_LIST = [
  { key: LOCAL_TIME_ZONE, value: `跟随系统时区(${Intl.DateTimeFormat().resolvedOptions().timeZone})` },
  { key: 0, value: '标准时间(GMT)' },
  { key: 1, value: '罗马(GMT+01:00)' },
  { key: 2, value: '埃及(GMT+02:00)' },
  { key: 3, value: '俄罗斯(GMT+03:00)' },
  { key: 4, value: '阿拉伯(GMT+04:00)' },
  { key: 5, value: '西亚(GMT+05:00)' },
  { key: 6, value: '中亚(GMT+06:00)' },
  { key: 7, value: '曼谷(GMT+07:00)' },
  { key: 8, value: '中国(GMT+08:00)' },
  { key: 9, value: '东京(GMT+09:00)' },
  { key: 10, value: '西太平洋(GMT+10:00)' },
  { key: 11, value: '太平洋中部(GMT+11:00)' },
  { key: 12, value: '纽西兰(GMT+12:00)' },
  { key: -1, value: '亚速尔(GMT-01:00)' },
  { key: -2, value: '大西洋中部(GMT-02:00)' },
  { key: -3, value: '南美洲东部(GMT-03:00)' },
  { key: -4, value: '加拿大(GMT-04:00)' },
  { key: -5, value: '美加东部(GMT-05:00)' },
  { key: -6, value: '墨西哥(GMT-06:00)' },
  { key: -7, value: '美国山区(GMT-07:00)' },
  { key: -8, value: '太平洋(GMT-08:00)' },
  { key: -9, value: '阿拉斯加(GMT-09:00)' },
  { key: -10, value: '夏威夷(GMT-10:00)' },
  { key: -11, value: '萨摩亚(GMT-11:00)' },
  { key: -12, value: '国际换日线(GMT-12:00)' },
];
const TIMEZONE_LIST_EN = [
  { key: LOCAL_TIME_ZONE, value: `System TimeZone(${Intl.DateTimeFormat().resolvedOptions().timeZone})` },
  { key: 0, value: 'Standard Time(GMT)' },
  { key: 1, value: 'Rome (GMT+01:00)' },
  { key: 2, value: 'Egypt(GMT+02:00)' },
  { key: 3, value: 'Russia(GMT+03:00)' },
  { key: 4, value: 'Arab (GMT+04:00)' },
  { key: 5, value: 'West Asia(GMT+05:00)' },
  { key: 6, value: 'Central Asia(GMT+06:00)' },
  { key: 7, value: 'Bangkok(GMT+07:00)' },
  { key: 8, value: 'China(GMT+08:00)' },
  { key: 9, value: 'Tokyo(GMT+09:00)' },
  { key: 10, value: 'Western Pacific(GMT+10:00)' },
  { key: 11, value: 'Central Pacific(GMT+11:00)' },
  { key: 12, value: 'New Zealand(GMT+12:00)' },
  { key: -1, value: 'Azor(GMT-01:00)' },
  { key: -2, value: 'Central Atlantic(GMT-02:00)' },
  { key: -3, value: 'Eastern South America(GMT-03:00)' },
  { key: -4, value: 'Canada(GMT-04:00)' },
  { key: -5, value: 'Eastern America and Canada(GMT-05:00)' },
  { key: -6, value: 'Mexico(GMT-06:00)' },
  { key: -7, value: 'US Mountainous Areas(GMT-07:00)' },
  { key: -8, value: 'Pacific (GMT-08:00)' },
  { key: -9, value: 'Alaska(GMT-09:00)' },
  { key: -10, value: 'Hawaii(GMT-10:00)' },
  { key: -11, value: 'Samoa(GMT-11:00)' },
  { key: -12, value: 'International Date Line(GMT-12:00)' },
];
const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
const webmailApi = api.api.requireLogicalApi(apis.webmailApiImpl) as WebMailApi;
const mailConfApi: MailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
const storeApi: DataStoreApi = api.api.getDataStoreApi();
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
import { doSharedAccountAsync } from '@web-common/state/reducer/loginReducer';
import { getIn18Text } from 'api';

// 重启app
const restartApp = () => {
  if (process.env.BUILD_ISELECTRON) {
    systemApi.reLaunchApp();
  } else if (inWindow()) {
    history.go();
  }
};
const getLang = (): Lang => {
  return systemApi.getSystemLang();
};
const isWebmail = inWindow() && conf('profile') ? conf('profile').toString().includes('webmail') : false;

const isDarkThemeMode = () => {
  return window && window.matchMedia('(prefers-color-scheme: dark)').matches;
};
const getStorageTheme = () => {
  const { data } = storeApi.getSync(SYSTEM_THEME, { noneUserRelated: true });
  return data;
};
const bodyClassHandler = (value: string) => {
  const doc = document.querySelector('body');
  let className = '';
  if (value === 'dark' || (value === 'auto' && isDarkThemeMode())) {
    className = 'lx-theme-dark';
  }
  if (doc) {
    doc.classList.remove('lx-theme-dark');
    className && doc.classList.add(className);
  }
};

// // 回到旧版提示
// const OldversionTips = () => {
//   Modal.confirm({
//     title: '确认要前往旧版邮箱吗？',
//     content: null,
//     okText: '留在新版',
//     // onOk: () => {},
//     cancelText: '前往旧版',
//     onCancel: () => {
//       let sid = systemApi.getCurrentUser()?.sessionId || '';
//       // 获取 show_old
//       const SHOW_OLD = getShowOld();
//       location.assign('/js6/upgrade.jsp?style=9&sid=' + sid + '&show_old=' + SHOW_OLD);
//     },
//     centered: true
//   });
// };

const SystemConfig: React.FC<{
  isVisible?: boolean;
}> = ({ isVisible }) => {
  const [autoOpen, setAutoOpen] = useState<AutoLaunchType>();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState<boolean>(false);
  const [lang, setLang] = useState<Lang>(getLang());
  const [theme, setTheme] = useState(getStorageTheme() || 'light');
  const [oldEntryModal, setOldEntryModal] = useState(false);
  const [isLowMemoryMode, setIsLowMemoryMode] = useState<boolean>(false);
  const [timeZone, setTimeZone] = useState<number>(0);
  const [timeZoneTemp, setTimeZoneTemp] = useState<number>(0);
  const dispatch = useAppDispatch();
  const [mailCacheDir, setMailCacheDir] = useState<string>(getIn18Text('GETTING_PWAIT'));

  useEffect(() => {
    mailApi
      .getMailCachePath()
      .then(res => {
        if (res) {
          setMailCacheDir(res);
        }
      })
      .catch((ex: any) => {
        console.error(ex);
        setMailCacheDir(getIn18Text('GET_MAIL_CACHE_FAIL'));
      });
  }, []);

  const timezoneSwitchContent =
    process.env.BUILD_ISELECTRON || process.env.BUILD_ISEDM ? getIn18Text('setting_system_switch_timezone_info') : getIn18Text('setting_system_switch_timezone_info_web');
  const timeZoneList = useMemo(() => {
    if (lang === 'en') {
      return TIMEZONE_LIST_EN;
    }
    return TIMEZONE_LIST;
  }, [lang]);
  useEffect(() => {
    dispatch(doSharedAccountAsync());
    mailConfApi.loadMailConf().then(() => {
      if (mailConfApi.getLocalTimezone()) {
        setTimeZone(LOCAL_TIME_ZONE);
      } else {
        setTimeZone(mailConfApi.getTimezone());
      }
    });
  }, []);

  useEffect(() => {
    const isLowMemoryMode = systemApi.getIsLowMemoryModeSync();
    setIsLowMemoryMode(isLowMemoryMode);
  }, []);

  const [systemProxy, setSystemProxy] = useState<SYSTEM_PROXY_TYPE>(defaultSystemProxyType);

  useEffect(() => {
    const systemProxy = systemApi.getSystemProxyTypeSync();
    setSystemProxy(systemProxy);
  }, []);

  const handleUseSystemProxyCheckChanged = (e: any) => {
    const { value } = e.target;
    SiriusModal.confirm({
      title: getIn18Text('TISHI'),
      content: getIn18Text('app_use_system_proxy_change_tip'),
      okText: getIn18Text('LIJIZHONGQI'),
      cancelText: getIn18Text('QUXIAO'),
      onOk: () => {
        setSystemProxy(value);
        systemApi.setSystemProxyType(value);
        setTimeout(() => {
          systemApi.reLaunchApp();
        }, 16);
      },
    });
  };
  const handleTimezoneChange = useCallback(
    val => {
      setTimeZoneTemp(val);
      setShowTimezoneModal(true);
    },
    [setTimeZoneTemp, setShowTimezoneModal]
  );

  const doSetTimezoneRequest = (timezone: number) => {
    if (timezone === LOCAL_TIME_ZONE) {
      return mailConfApi.setLocalTimezone(true);
    }
    // 如果设置其他时区，需要先重置（默认使用本地时区）配置
    return mailConfApi.setLocalTimezone(false).then(() => {
      return mailConfApi.setTimezone(timezone);
    });
  };
  const handleLowMemoryModeCheckChanged = (e: any) => {
    const { checked } = e.target;
    SiriusModal.confirm({
      title: getIn18Text('LOW_MEMORY_CHANGE_TIP_TITLE'),
      content: getIn18Text('LOW_MEMORY_CHNAGE_TIP'),
      okText: getIn18Text('LIJIZHONGQI'),
      cancelText: getIn18Text('QUXIAO'),
      onOk: () => {
        setIsLowMemoryMode(checked);
        systemApi.setIsLowMemoryMode(checked);
        setTimeout(() => {
          systemApi.reLaunchApp();
        }, 16);
      },
    });
  };

  // isVisible = isVisible;
  const [showEntry, setShowEntry] = useState(false); // 是否展示返回旧版入口
  useEffect(() => {
    if (process.env.BUILD_ISELECTRON) {
      systemApi.getAutoLaunch().then(isAutoLaunch => {
        if (!isAutoLaunch) {
          setAutoOpen('CLOSE');
        } else {
          systemApi.getIsAutoLaunchToTray().then(isAutoLaunchToTray => {
            setAutoOpen(isAutoLaunchToTray ? 'OPEN_TRAY' : 'OPEN');
          });
        }
      });
    }

    // 是否展示前往旧版配置
    const state = webmailApi.getState();
    const isWebmail = conf('profile') ? conf('profile').toString().includes(WEB_MAIL) : false;
    if (state['show_old'] != null && +(state['show_old'] as string) === 2 && isWebmail) {
      setShowEntry(true);
    }
  }, []);

  const handleChangeAutoOpen = async (value: AutoLaunchType) => {
    setAutoOpen(value);
    switch (value) {
      case 'CLOSE':
        await systemApi.setIsAutoLaunchToTray(false);
        await systemApi.setAutoLaunch(false);
        break;
      case 'OPEN':
        await systemApi.setIsAutoLaunchToTray(false);
        await systemApi.setAutoLaunch(true);
        break;
      case 'OPEN_TRAY':
        await systemApi.setIsAutoLaunchToTray(true);
        await systemApi.setAutoLaunch(true);
        break;
    }
  };
  const [hostType, setHostType] = useState<string>(() => systemApi.getCurrentHostType());
  const handleHostTypeChanged = (ev: RadioChangeEvent) => {
    const value = ev.target.value;
    if (!window) return;
    if (window.electronLib) {
      SiriusModal.confirm({
        title: getIn18Text('QIEHUANXIANLUTI'),
        content: getIn18Text('QIEHUANXIANLUXU'),
        okText: getIn18Text('LIJIZHONGQI'),
        cancelText: getIn18Text('QUXIAO'),
        onOk: () => {
          setHostType(value);
          systemApi.setCurrentHostType(value);
          setTimeout(() => {
            systemApi.reLaunchApp();
          }, 16);
        },
      });
    } else {
      setHostType(value);
      systemApi.setCurrentHostType(value);
      systemApi.jumpToWebHostLogin();
    }
  };
  const onThemeChange = (value: string) => {
    setTheme(value);
    storeApi.putSync(SYSTEM_THEME, value, { noneUserRelated: true });
    bodyClassHandler(value);
  };
  const handleOpenMailCacheDir = async () => {
    if (mailCacheDir) {
      try {
        await window.electronLib.fsManage.open(mailCacheDir);
      } catch (ex: any) {
        console.error('handleOpenMailCacheDir-error', ex);
      }
    }
  };

  const showUIError = (msg: string) => {
    SiriusModal.error({
      title: '错误提示',
      content: msg,
      hideCancel: true,
    });
  };

  const handleChangeMailCacheDir = async () => {
    try {
      SiriusModal.confirm({
        title: getIn18Text('TISHI'),
        content: getIn18Text('CHANGE_CACHEDIR_RELAUNCH'),
        okText: getIn18Text('CHANGE_DIR'),
        cancelText: getIn18Text('QUXIAO'),
        onOk: async () => {
          const res = await mailApi.selectMailCacheDirPath();
          if (res && res.success) {
            if (res.path) {
              const selectPath = res.path;
              if (selectPath.length === 3 && selectPath.endsWith(':\\')) {
                const targetPath = `${selectPath}lingxi-download`;
                SiriusModal.confirm({
                  title: getIn18Text('TISHI'),
                  content: getIn18Text('CACHE_DIR_AUTO_CREATE_TIP', { targetPath }),
                  onOk: () => {
                    setMailCacheDir(targetPath);
                    mailApi.setMailCachePath(targetPath);
                    restartApp();
                  },
                });
              } else {
                setMailCacheDir(res.path);
                mailApi.setMailCachePath(res.path);
                restartApp();
              }
            }
          } else {
            if (res.errorMsg) {
              showUIError(res.errorMsg);
            }
          }
        },
      });
    } catch (ex: any) {
      console.error('handleChangeMailCacheDir-error', ex);
    }
  };
  const [zoomVal, setZoomVal] = useState<number>(SYSTEM_ZOOM_KEY);
  const handleZoomChanged = (value: number) => {
    try {
      SiriusModal.confirm({
        title: getIn18Text('TISHI'),
        content: getIn18Text('CHANGE_ZOOM_TIP'),
        onOk: async () => {
          setZoomVal(value);
          await systemApi.setPageZoomValue(value);
          setTimeout(() => {
            restartApp();
          }, 16);
        },
      });
    } catch (ex) {
      console.error('handleZoomChanged-error', ex);
    }
  };
  useEffect(() => {
    systemApi.getPageZoomValue().then(res => {
      setZoomVal(res);
    });
  }, []);
  const isEnglish = inWindow() ? window.systemLang === 'en' : false;
  return (
    <>
      <div
        className={classnames('ant-allow-dark', styles.settingMenu, {
          [styles.webWmEntry]: isWebWmEntry,
        })}
        style={{ top: getBodyFixHeight(true) }}
        hidden={!isVisible}
      >
        <div className={styles.configTitle}>
          <div className={styles.configTitleName}>{getIn18Text('XITONGSHEZHI')}</div>
          {!isWebWmEntry && <div onClick={() => navigate(-1)} className={`dark-invert ${styles.configTitleIcon}`} />}
        </div>
        <div className={styles.configContent}>
          <div className={styles.configContentWrap}>
            {process.env.BUILD_ISELECTRON && (
              <div className={styles.configContentCheckbox}>
                <div className={styles.configContentCheckboxTitle}>{getIn18Text('KAIJIZIQIDONG')}</div>
                <EnhanceSelect
                  value={autoOpen}
                  onChange={handleChangeAutoOpen}
                  className={styles.configContentCheckboxSelect}
                  style={{ width: isEnglish ? '220px' : '180px' }}
                >
                  <InSingleOption value="CLOSE">{getIn18Text('CLOSE_AUTOLAUNCH')}</InSingleOption>
                  <InSingleOption value="OPEN">{getIn18Text('AUTO_LAUNCH_TO_DESKTOP')}</InSingleOption>
                  <InSingleOption value="OPEN_TRAY">{getIn18Text(getOs() === 'mac' ? 'AUTO_LAUNCH_TO_TRAY_MAC' : 'AUTO_LAUNCH_TO_TRAY')}</InSingleOption>
                </EnhanceSelect>
              </div>
            )}
            {process.env.BUILD_ISELECTRON && getOs() !== 'mac' && (
              <div className={styles.configContentCheckbox}>
                <div className={styles.configContentCheckboxTitle}>{getIn18Text('MAIN_PAGE_ZOOM_TITLE')}</div>
                <EnhanceSelect value={zoomVal} onChange={handleZoomChanged} className={styles.configContentCheckboxSelect}>
                  {PAGE_ZOOM_LIST.map(zoomItem => {
                    return <InSingleOption value={zoomItem.key}>{zoomItem.value}</InSingleOption>;
                  })}
                </EnhanceSelect>
              </div>
            )}
            {!process.env.BUILD_ISEDM && (
              <div className={styles.configContentCheckbox}>
                <div className={styles.configContentCheckboxTitle}>
                  {getIn18Text('WAIGUAN')}
                  <span className={styles.betaTag}>
                    <i>BETA</i>
                  </span>
                </div>
                <EnhanceSelect value={theme} onChange={onThemeChange} dropdownClassName="extheme" className={styles.configContentCheckboxSelect}>
                  <InSingleOption value="light">{getIn18Text('QIANSE')}</InSingleOption>
                  <InSingleOption value="dark">{getIn18Text('SHENSE')}</InSingleOption>
                  <InSingleOption value="auto">{getIn18Text('GENSUIXITONG')}</InSingleOption>
                </EnhanceSelect>
              </div>
            )}
            {process.env.BUILD_ISELECTRON && (
              <div className={styles.configContentCheckbox}>
                <div className={styles.configContentCheckboxTitle}>{getIn18Text('LOW_MEMORY_MODE_TXT')}</div>
                <Checkbox checked={isLowMemoryMode} onChange={e => handleLowMemoryModeCheckChanged(e)} defaultChecked={isLowMemoryMode}>
                  {getIn18Text('KAIQI')}
                </Checkbox>
              </div>
            )}
            {process.env.BUILD_ISELECTRON && process.env.BUILD_ISEDM && (
              <div className={styles.configContentCheckbox}>
                <div className={styles.configContentCheckboxTitle}>
                  {getIn18Text('app_use_system_proxy')}
                  <Tooltip title={getIn18Text('app_use_system_proxy_tip')} placement="right" overlayClassName={styles.hostChangeTooltip}>
                    <span style={{ verticalAlign: 'middle' }}>
                      <IconWarn style={{ cursor: 'pointer', marginLeft: '5px', width: '13px', height: '13px' }} />
                    </span>
                  </Tooltip>
                </div>
                <div className={styles.configContentCheckbox}>
                  <Radio.Group value={systemProxy} onChange={handleUseSystemProxyCheckChanged} defaultValue={systemProxy}>
                    {SYSTEM_PROXY_TYPES.map(typeStr => {
                      return <Radio value={typeStr}>{getIn18Text(typeStr)}</Radio>;
                    })}
                  </Radio.Group>
                </div>
              </div>
            )}
            {!isWebmail && (
              <div className={styles.configContentCheckbox}>
                <div className={styles.configContentCheckboxTitle}>
                  {getIn18Text('KEHUDUANXIANLU')}
                  <Tooltip title={getIn18Text('LIANJIEVPN')} placement="right" overlayClassName={styles.hostChangeTooltip}>
                    <span style={{ verticalAlign: 'middle' }}>
                      <IconWarn style={{ cursor: 'pointer', marginLeft: '5px', width: '13px', height: '13px' }} />
                    </span>
                  </Tooltip>
                </div>
                <div className={styles.configContentCheckbox}>
                  <Radio.Group value={hostType} onChange={handleHostTypeChanged}>
                    <Radio value="smartDNSHost">{getIn18Text('MORENXIANLU')}</Radio>
                    <Radio value="domestic">{getIn18Text('GUONEIXIANLU')}</Radio>
                  </Radio.Group>
                </div>
              </div>
            )}
            {
              <div className={styles.configContentCheckbox}>
                <div className={styles.configContentCheckboxTitle}>{getIn18Text('setting_system_language')}</div>
                <EnhanceSelect
                  value={lang}
                  onChange={value => {
                    langTemp = value;
                    setShowModal(true);
                  }}
                  dropdownClassName="extheme"
                  className={styles.configContentCheckboxSelect}
                >
                  <InSingleOption value="zh">简体中文</InSingleOption>
                  <InSingleOption value="en">English</InSingleOption>
                  <InSingleOption value="zh-trad">繁體中文</InSingleOption>
                </EnhanceSelect>
              </div>
            }
            {
              <div className={styles.configContentCheckbox}>
                <div className={styles.configContentCheckboxTitle}>{getIn18Text('TIMEZONE')}</div>
                <EnhanceSelect value={timeZone} onChange={handleTimezoneChange} dropdownClassName="extheme" size="large" style={{ minWidth: 304 }}>
                  {timeZoneList.map(({ key, value }) => (
                    <InSingleOption value={key}>{value}</InSingleOption>
                  ))}
                </EnhanceSelect>
              </div>
            }

            {process.env.BUILD_ISELECTRON && getOs() !== 'mac' && (
              <>
                <div className={styles.configContentCheckbox}>
                  <div className={styles.configContentCheckboxTitle}>{getIn18Text('DATA_CACHE_PATH')}</div>
                  <div className={styles.configContentCheckboxInfo + ' ' + styles.cachePath}>
                    <Input
                      disabled={true}
                      value={mailCacheDir}
                      style={{ width: '400px' }}
                      suffix={
                        <a className={styles.cacheDirLink} href="javascript:void(0)" onClick={handleChangeMailCacheDir}>
                          {getIn18Text('CHANGE_DIR')}
                        </a>
                      }
                    ></Input>
                    <a style={{ marginLeft: '12px' }} className={styles.cacheDirLink} href="javascript:void(0)" onClick={handleOpenMailCacheDir}>
                      {getIn18Text('OPEN_FILE_PATH')}
                    </a>
                  </div>
                </div>
              </>
            )}

            <SystemOptimize />

            {showEntry && (
              <div className={styles.configContentCheckbox}>
                <div className={styles.configContentCheckboxTitle}>{getIn18Text('setting_system_version')}</div>
                <div className={styles.configContentCheckboxInfo}>
                  切换邮箱版本
                  <a
                    onClick={() => {
                      setOldEntryModal(true);
                    }}
                    className={styles.configContentCheckboxInfoLink}
                  >
                    前往旧版
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* 切换语言弹窗 */}
        <SwitchModal
          visible={showModal}
          lang={langTemp}
          onClose={(onOk: boolean) => {
            setShowModal(false);
            if (onOk) {
              systemApi.setSystemLang(langTemp);
              restartApp();
              setLang(langTemp);
            }
          }}
        />
        {/* 切换时区弹窗 */}
        <SwitchModal
          visible={showTimezoneModal}
          content={timezoneSwitchContent}
          onClose={(onOk: boolean) => {
            setShowTimezoneModal(false);
            if (onOk) {
              // let timeZoneSetRequest = timeZone === LOCAL_TIME_ZONE ? mailConfApi.setLocalTimezone : mailConfApi.setTimezone
              doSetTimezoneRequest(timeZoneTemp).then(() => {
                restartApp();
              });
            }
          }}
        />
        <OldVersionModal defaultVisible={oldEntryModal} closeModal={() => setOldEntryModal(false)} title="lingxiWeb" />
      </div>
    </>
  );
};
export default SystemConfig;
