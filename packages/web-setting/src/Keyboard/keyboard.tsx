import React, { useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { util, isElectron as forElectron, NIMApi, apiHolder, getOs, DataStoreApi } from 'api';
import classnames from 'classnames';
import { navigate } from 'gatsby';
import styles from './index.module.scss';
import { ReactComponent as DeleteIcon } from '@/images/icons/setting/keyboard_delete.svg';
import SiriusModel from '@web-common/components/UI/Modal/SiriusModal';
import { Input } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
import IconCard from '@web-common/components/UI/IconCard';
import { getHKFromLocalByAccount } from '@web-mail/util';
import { stringMap } from '@web-mail/types';
import CustomKey from './CustomKey';

const { config } = require('env_def');
const systemApi = apiHolder.api.getSystemApi();
const isWebWmEntry = systemApi.isWebWmEntry();
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const nimApi = apiHolder.api.requireLogicalApi('NIM') as NIMApi;
const setScreenCaptureShortcut = apiHolder.api.getSystemApi().setScreenCaptureShortcut;
const setMinimizeGlobalShortcutUI = apiHolder.api.getSystemApi().setMinimizeGlobalShortcutUI;
interface KeyboardProps {
  noBorder?: boolean;
  left?: number;
  isModel?: boolean;
}
interface KeyboardModelProps {
  visible: boolean;
  onCancel: () => void;
}
interface KeyProp {
  title: string;
  content: Array<{
    name: string;
    key: string | any;
    show?: boolean;
    content?: JSX.Element;
  }>;
}
type GlobalKeyboardMap = Record<string, boolean>;
const isElectron = forElectron();
const isMac = getOs() === 'mac';
// 通过store的值获取显示的快捷键 和 注册的快捷键
const getStoreShortcut = (storeKey: string, defaultShortKey: string) => {
  const storeShortcut = dataStoreApi.getSync(storeKey).data;
  let showShortcut = storeShortcut || defaultShortKey;
  if (showShortcut === 'noncapture') showShortcut = '';
  const oldShortcut = util.storeShortcutTransform(showShortcut || '');
  return { showShortcut, oldShortcut };
};
export const Keyboard: React.FC<KeyboardProps> = ({ noBorder, left = 16, isModel }) => {
  const [globalKeyboardMap, setGlobalKeyboardMap] = useState<GlobalKeyboardMap>({ minimize: true });
  const [enableIM, setEnableIM] = useState<boolean>(false);
  const [editCapture, setEditCapture] = useState(false);
  const [editMinimize, setEditMinimize] = useState(false);
  const [oldCaptureShortcut, setCaptureShortcut] = useState('');
  const [oldMinimizeShortcut, setOldMinimizeShortcut] = useState(''); // 注册的快捷键代码
  const [tagKeyKist, setTagKeyKist] = useState<string[]>([]);
  const [sendMailhk, setSendMailhk] = useState(() => {
    try {
      return !!localStorage.getItem('MAIL_WRITE_HOTKEY_LOCAL_KEY');
    } catch (e) {
      console.error('[error] sendMailhk', e);
    }
    return false;
  });
  const command = util.getCommonTxt();
  // const storeCaptureShortcut = dataStoreApi.getSync('captureScreenShortcut').data;
  const initCaptureShortcutDefault = isMac ? `${command} Shift A` : 'Alt A';
  // const storeMinimizeShortcut = dataStoreApi.getSync('minimizeShortcut').data;
  const initMinimizeShortcutDefault = isMac ? `${command} M` : `${command} Shift M`;
  // let initCaptureShortcut = storeCaptureShortcut || initCaptureShortcutDefault;
  // if (initCaptureShortcut === 'noncapture') initCaptureShortcut = '';
  // let initMinimizeShortcut = storeMinimizeShortcut || initMinimizeShortcutDefault;
  // if (initMinimizeShortcut === 'noncapture') initMinimizeShortcut = '';
  const [editCaptureInputVal, setEditCaptureInputVal] = useState('');
  const [editMinimizeInputVal, setMinimizeInputVal] = useState(''); // 显示的快捷键
  // const [changedKeys, setChangedKeys] = useState<string[]>([]);
  const shift = 'Shift';
  const enter = '↵';
  const up = '↑';
  const down = '↓';
  const mouseLeft = getIn18Text('ZUOJIAN');
  const del = <DeleteIcon />;
  const separator = ' ';

  // useEffect(() => {
  //   const oldCaptureShortcut = util.storeShortcutTransform(initCaptureShortcut || '');
  //   setCaptureShortcut(oldCaptureShortcut);
  // }, [initCaptureShortcut]);

  // useEffect(() => {
  //   const oldMinimizeShortcut = util.storeShortcutTransform(initMinimizeShortcut || '');
  //   setOldMinimizeShortcut(oldMinimizeShortcut);
  // }, [initMinimizeShortcut]);

  useEffect(() => {
    const { showShortcut: initCaptureShortcut, oldShortcut: oldCaptureShortcut } = getStoreShortcut('captureScreenShortcut', initCaptureShortcutDefault);
    const { showShortcut: initMinimizeShortcut, oldShortcut: oldMinimizeShortcut } = getStoreShortcut('minimizeShortcut', initMinimizeShortcutDefault);
    // setChangedKeys([initCaptureShortcut, initMinimizeShortcut].map(i => i.replaceAll(' ', '')));
    setEditCaptureInputVal(initCaptureShortcut);
    setCaptureShortcut(oldCaptureShortcut);
    setMinimizeInputVal(initMinimizeShortcut);
    setOldMinimizeShortcut(oldMinimizeShortcut);
  }, [initCaptureShortcutDefault, initMinimizeShortcutDefault]);

  useEffect(() => {
    if (isElectron) {
      window.electronLib.appManage.getGlobalKeyboard().then((res: GlobalKeyboardMap) => {
        res && setGlobalKeyboardMap(res);
      });
    }
  }, []);
  // 拿到打便签快捷键，做重复校验
  useEffect(() => {
    const localHkMap: stringMap = getHKFromLocalByAccount();
    console.log('localHkMap1', localHkMap);
    const keyList: string[] = [];
    Object.values(localHkMap).forEach((item: string[]) => {
      let ownKey = item.join('');
      ownKey = ownKey.replaceAll('Command', command);
      keyList.push(ownKey);
    });
    setTagKeyKist(keyList);
  }, []);

  const editBegin = (e, type: 'capturescreen' | 'minimize') => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    console.log('value----------11');
    setEditCapture(false);
    setEditMinimize(false);
    switch (type) {
      case 'capturescreen':
        setEditCapture(true);
        break;
      case 'minimize':
        setEditMinimize(true);
        break;
      default:
        break;
    }
  };

  const globalList = useMemo(() => {
    let list: (
      | string
      | {
          name: string;
          key: string | JSX.Element;
          filterKey: string;
          show?: boolean;
          content?: false | JSX.Element | '';
        }
    )[] = [
      {
        name: getIn18Text('CHAKANQUANBUKUAI'),
        key: command + separator + '/',
        filterKey: command + '/',
      },
      {
        name: isMac ? '隐藏至程序坞' : '隐藏至托盘',
        key: command + separator + 'W',
        filterKey: command + 'W',
        show: isElectron,
      },
      'minimize',
      {
        name: getIn18Text('QUANXUAN'),
        key: command + separator + 'A',
        filterKey: command + 'A',
        show: false,
      },
      'capturescreen',
      {
        name: getIn18Text('FANGDATUPIAN'),
        key: command + separator + '+',
        filterKey: command + '+',
        show: isElectron,
      },
      {
        name: getIn18Text('FANGXIAOTUPIAN'),
        key: command + separator + '-',
        filterKey: command + '-',
        show: isElectron,
      },
      {
        name: getIn18Text('BAOCUNTUPIAN'),
        key: command + separator + 'S',
        filterKey: command + 'S',
        show: isElectron,
      },
      {
        name: getIn18Text('DAKAISHEZHI'),
        key: command + separator + '0',
        filterKey: command + '0',
        show: isElectron,
      },
      {
        name: getIn18Text('DAKAIYOUXIANG'),
        key: command + separator + '1',
        filterKey: command + '1',
        show: isElectron,
      },
      {
        name: getIn18Text('DAKAIXIAOXI'),
        key: command + separator + '2',
        filterKey: command + '2',
        show: isElectron,
      },
      {
        name: getIn18Text('DAKAIRILI'),
        key: command + separator + '3',
        filterKey: command + '3',
        show: isElectron,
      },
      {
        name: getIn18Text('DAKAI\u201CYUNWEN'),
        key: command + separator + '4',
        filterKey: command + '4',
        show: isElectron,
      },
      {
        name: getIn18Text('DAKAI\u201CTONGXUN'),
        key: command + separator + '5',
        filterKey: command + '5',
        show: isElectron,
      },
    ];
    // 设置页key + 标签页key
    const allKeyList = [...tagKeyKist, ...list.map(item => (typeof item !== 'string' ? item.filterKey : ''))];
    const minimize = {
      name: '最小化/恢复客户端',
      // key: command + separator + 'M',
      key: editMinimize ? (
        <CustomKey
          setEditInputVal={setMinimizeInputVal}
          localKey="minimizeShortcut"
          editStatus={editMinimize}
          getStoreValue={() => {
            return getStoreShortcut('minimizeShortcut', initMinimizeShortcutDefault);
          }}
          setEditStatus={setEditMinimize}
          globalList={allKeyList}
          setShortcut={setMinimizeGlobalShortcutUI}
          oldShortcut={oldMinimizeShortcut}
          setOldShortcut={setOldMinimizeShortcut}
          editInputVal={editMinimizeInputVal}
        />
      ) : (
        editMinimizeInputVal || (
          <span
            onClick={e => {
              editBegin(e, 'minimize');
            }}
            style={{ color: '#9fa2ad' }}
          >
            点击设置快捷键
          </span>
        )
      ),
      filterKey: editMinimizeInputVal,
      show: isElectron,
      content: !editMinimize && editMinimizeInputVal && (
        <span
          onClick={e => {
            editBegin(e, 'minimize');
          }}
          className={styles.editCaptureEditIcon}
        >
          <IconCard type="hoverShuru" />
        </span>
      ),
    };
    const capturescreen = {
      name: '截图',
      key: editCapture ? (
        <CustomKey
          setEditInputVal={setEditCaptureInputVal}
          localKey="captureScreenShortcut"
          editStatus={editCapture}
          getStoreValue={() => {
            return getStoreShortcut('captureScreenShortcut', initCaptureShortcutDefault);
          }}
          setEditStatus={setEditCapture}
          globalList={allKeyList}
          setShortcut={setScreenCaptureShortcut}
          oldShortcut={oldCaptureShortcut}
          setOldShortcut={setCaptureShortcut}
          editInputVal={editCaptureInputVal}
        />
      ) : (
        editCaptureInputVal || (
          <span
            onClick={e => {
              editBegin(e, 'capturescreen');
            }}
            style={{ color: '#9fa2ad' }}
          >
            点击设置快捷键
          </span>
        )
      ),
      filterKey: editCaptureInputVal,
      content: !editCapture && editCaptureInputVal && (
        <span
          onClick={e => {
            editBegin(e, 'capturescreen');
          }}
          className={styles.editCaptureEditIcon}
        >
          <IconCard type="hoverShuru" />
        </span>
      ),
      show: isElectron,
    };
    list = list.map(item => {
      switch (item) {
        case 'capturescreen':
          return capturescreen;
        case 'minimize':
          return minimize;
        default:
          return item;
      }
    });
    return list;
  }, [
    globalKeyboardMap,
    editCapture,
    editMinimize,
    setEditCapture,
    setEditMinimize,
    editCaptureInputVal,
    editMinimizeInputVal,
    editBegin,
    oldCaptureShortcut,
    oldMinimizeShortcut,
    setScreenCaptureShortcut,
    setOldMinimizeShortcut,
  ]);
  const mailList = useMemo(
    () => [
      {
        name: getIn18Text('SHANGYIFENGYOUJIAN'),
        key: up,
      },
      {
        name: getIn18Text('XIAYIFENGYOUJIAN'),
        key: down,
      },
      {
        name: getIn18Text('SHANCHUYOUJIAN'),
        key: '',
        content: isMac ? <>Ctrl&nbsp;D</> : <>Ctrl&nbsp;D</>,
      },
      {
        name: getIn18Text('DUOXUANYOUJIAN'),
        key: command + separator + mouseLeft,
      },
      {
        name: getIn18Text('LIANXUDUOXUANYOU'),
        key: shift + separator + mouseLeft,
      },
      {
        name: getIn18Text('XUANZHONGYOUJIANXIN'),
        key: command + separator + 'R',
      },
      {
        name: getIn18Text('FASONGYOUJIAN'),
        key: (
          <span className={styles.keyboardContentWrap}>
            <span style={sendMailhk ? {} : { color: '#B7BAC2' }}>{command + separator + enter}</span>
            <span
              className={styles.linkTxt}
              onClick={() => {
                localStorage.setItem('MAIL_WRITE_HOTKEY_LOCAL_KEY', !sendMailhk ? '1' : '');
                setSendMailhk(!sendMailhk);
                message.info(!sendMailhk ? getIn18Text('DAKAICHENGGONG') : getIn18Text('GUANBICHENGGONG'));
              }}
            >
              {getIn18Text('DIANJI')}
              {sendMailhk ? getIn18Text('GUANBI') : getIn18Text('KAIQI')}
            </span>
          </span>
        ),
      },
    ],
    [sendMailhk]
  );
  const imList = useMemo(
    () => [
      {
        name: getIn18Text('FAXIAOXI'),
        key: enter,
      },
      {
        name: getIn18Text('SHANGYIFENGXIAOXI'),
        key: up,
        show: false,
      },
      {
        name: getIn18Text('XIAYIFENGXIAOXI'),
        key: down,
        show: false,
      },
      {
        name: getIn18Text('HUANXING'),
        key: shift + separator + enter + getIn18Text('\uFF0CHUOZHE') + command + separator + enter,
      },
      {
        name: getIn18Text('KUAIJIESOUSUO'),
        key: command + separator + 'F',
      },
    ],
    []
  );
  const diskList = useMemo(
    () => [
      {
        name: getIn18Text('KUAIJIESOUSUO'),
        key: command + separator + 'F',
      },
    ],
    []
  );
  const keyList = useMemo(() => {
    const list: KeyProp[] = [
      {
        title: getIn18Text('QUANJU'),
        content: globalList,
      },
      {
        title: getIn18Text('YOUXIANG'),
        content: mailList,
      },
      {
        title: getIn18Text('YUNWENDANG'),
        content: diskList,
      },
    ];
    if (enableIM) {
      list.splice(1, 0, {
        title: getIn18Text('XIAOXI'),
        content: imList,
      });
    }
    return list;
  }, [enableIM, globalKeyboardMap, globalList]);
  useEffect(() => {
    nimApi.getIMAuthConfig() && setEnableIM(true);
  }, []);
  return (
    <div className={styles.keyboardWrap}>
      {keyList.map(obj => (
        <div
          className={classnames(styles.keyTable, {
            [styles.noBorder]: noBorder,
          })}
          key={obj.title}
        >
          <div style={{ paddingLeft: left }} className={styles.keyTitle}>
            {obj.title}
          </div>
          <div className={styles.keyContent}>
            {obj.content.map(item => (
              <div className={styles.keyRow} hidden={item.show === undefined ? false : !item.show} key={item.name}>
                <div style={{ marginLeft: left }} className={styles.label}>
                  {item.name}
                </div>
                <div className={styles.key}>
                  {Array.isArray(item.key)
                    ? item.key.map((keyItem: any) => (
                        <>
                          {keyItem}
                          <span>&nbsp;</span>
                        </>
                      ))
                    : item.key}
                  {item.content || null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
export const KeyboardModel: React.FC<KeyboardModelProps> = ({ visible, onCancel }) => (
  <SiriusModel onCancel={onCancel} visible={visible} footer={null} title={getIn18Text('KUAIJIEJIAN')} width={476} className={styles.keyboardModelWrap}>
    <Keyboard noBorder left={24} isModel />
  </SiriusModel>
);
const KeyboardConfig: React.FC<{
  isVisible?: boolean;
}> = ({ isVisible }) => (
  <>
    <div className={classnames(styles.settingMenu, { [styles.settingMenuWeb]: !systemApi.isElectron(), [styles.webWmEntry]: isWebWmEntry })} hidden={!isVisible}>
      <div className={styles.configTitle}>
        <div className={styles.configTitleName}>{getIn18Text('KUAIJIEJIAN')}</div>
        {!isWebWmEntry && <div onClick={() => navigate(-1)} className={`dark-invert ${styles.configTitleIcon}`} />}
      </div>
      <div className={styles.configContent}>
        <div className={styles.configContentWrap}>
          <Keyboard />
        </div>
      </div>
    </div>
  </>
);
export default KeyboardConfig;
