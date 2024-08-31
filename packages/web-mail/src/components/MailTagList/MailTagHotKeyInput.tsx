/**
 * 业务组件-邮件标签快捷键录入验证组件
 * 功能：为邮件标签弹窗提供快捷键录入验证功能,邮件的业务冲突验证，本地存储都在该业务组件中完成。
 * 2023-12-05
 */

import React, { useEffect, useCallback, useMemo, useState, useContext, useRef, forwardRef, useImperativeHandle } from 'react';
// import IconCard from '@web-common/components/UI/IconCard';
import { util, isElectron as forElectron, NIMApi, apiHolder, DataStoreApi } from 'api';
import styles from './MailTag.module.scss';
import KeySwiftInput from '@web-mail/common/components/KeySwiftInput/KeySwiftInput';
import useStateRef from '@web-mail/hooks/useStateRef';
import useCreateCallbackForEvent from '@web-mail/hooks/useCreateCallbackForEvent';
import { MAIL_TAG_HOTKEY_LOCAL_KEY } from '@web-mail/common/constant';
import { getStateFromLocalStorage, setStateToLocalStorage, updateHKBindTagName, saveHKToLocal, getHKFromLocalByAccount } from '@web-mail/util';
import { stringMap } from '@web-mail/types';
import { apiHolder as api } from 'api';
const eventApi = api.api.getEventApi();

interface MailTagHotKeyInputProps {
  // 标签名称
  tagName: string;

  // 快捷键的默认值
  defaultValue?: string[];
  // 快捷键的值
  value?: string[];
  // 快捷键的值改变时触发
  onChange?: (value: string[]) => void;
  // 合法检测
  valid?: (value: string[]) => boolean;
  // 提示文字
  placeholder?: string;
  // 类名
  className?: string;
  // 样式
  style?: React.CSSProperties;
  // 所属账户 - 初始化必传
  account?: string;
}

export interface HkInputRef {
  saveHk2Local: (tagName?: string) => boolean;
  valid: (curTagName?: string) => boolean;
  updateHk2Local: (params: { oldName?: string; name: string; account?: string }) => void;
}
// const command = util.getCommonTxt();
// const specialKey = ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'];
// const showKey = ['Ctrl', 'Shift', 'Alt'];
// const globalShortcutKey = ['CommandOrControl', 'Ctrl', 'Shift', 'Alt'];

const getKeyByHkArrary = (list: string[]) => {
  return list.join('+');
};

const ctrlHkList = [
  ['Ctrl', '/'],
  ['Ctrl', 'W'],
  ['Ctrl', '+'],
  ['Ctrl', '-'],
  ['Ctrl', 'S'],
  ['Ctrl', '0'],
  ['Ctrl', '1'],
  ['Ctrl', '2'],
  ['Ctrl', '3'],
  ['Ctrl', '4'],
  ['Ctrl', '5'],
  ['Ctrl', 'M'],
  ['Ctrl', 'R'],
  ['Ctrl', 'A'],
];

const mailHkList = [
  ['Command', '/'],
  ['Command', 'W'],
  ['Command', '+'],
  ['Command', '-'],
  ['Command', 'S'],
  ['Command', '0'],
  ['Command', '1'],
  ['Command', '2'],
  ['Command', '3'],
  ['Command', '4'],
  ['Command', '5'],
  ['Command', 'M'],
  ['Command', 'R'],
  ['Command', 'A'],

  ['Ctrl', 'D'],
  ['Shift', 'Up'],
  ['Shift', 'Dpwn'],
  ['Ctrl', 'R'],
  ['Ctrl', 'A'],
  ...ctrlHkList,
];

const mailHkMap: stringMap = {};
mailHkList.forEach(item => {
  mailHkMap[getKeyByHkArrary(item)] = true;
});

const MailTagHotKeyInput = forwardRef<HkInputRef, MailTagHotKeyInputProps>((props, ref) => {
  const { tagName, onChange, className, style, account } = props;

  // 验证是否出现错误
  const [conflict, setConflict] = useState(false);
  // 当前组件的快捷键值
  const [hkValue, setHkValue] = useState<string[]>([]);
  // 所有的快捷键对照Map key:快捷键 ”Command+Shift+1“ : tagName
  const [hkMap, setHkMap] = useState<{ [key: string]: string }>({});
  // 所有的快捷键对照Map key:tagName value:快捷键数组
  // const [tag2HkMap, setTag2HkMap] = useState<{ [key: string]: string[] }>({});
  // 转换为ref
  const hkMapRef = useStateRef(hkMap);
  // onChange转换为ref
  const onChangeRef = useCreateCallbackForEvent(onChange);

  const [initTagName] = useState(tagName);
  // tagName 转换为ref
  const tagNameRef = useStateRef(initTagName);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    saveHk2Local: curTagName => {
      const name = curTagName || initTagName;
      if (validHk(hkValue) && name && hkValue.length > 0) {
        setHkMap({ ...hkMap, [getKeyByHkArrary(hkValue)]: name });
        // setTag2HkMap({ ...tag2HkMap, [name]: hkValue });
        saveHKToLocal({
          name,
          hotKey: hkValue,
          account,
        });
        // setStateToLocalStorage(MAIL_TAG_HOTKEY_LOCAL_KEY, { ...tag2HkMap, [name]: hkValue });
        // 发送消息，通知重载下业务快捷键
        eventApi.sendSysEvent({
          eventName: 'mailMenuOper',
          eventData: {},
          eventStrData: 'reloadHotKey',
        });
        return true;
      }
      return false;
    },
    updateHk2Local: params => {
      const { oldName, name } = params;
      setHkMap({ ...hkMap, [getKeyByHkArrary(hkValue)]: name });
      // const newTag2HkMap = { ...tag2HkMap,  };
      // if (oldName) {
      //   delete newTag2HkMap[oldName];
      // }
      // newTag2HkMap[name] = hkValue
      // setTag2HkMap(newTag2HkMap);
      updateHKBindTagName({
        ...params,
        hotKey: hkValue,
        account,
      });
      // 发送消息，通知重载下业务快捷键
      eventApi.sendSysEvent({
        eventName: 'mailMenuOper',
        eventData: {},
        eventStrData: 'reloadHotKey',
      });
    },
    valid: curTagName => {
      return validHk(hkValue, curTagName);
    },
  }));

  // 检测快捷是否有冲突
  // todo： account
  const validHk = useCallback((keys: string[], curTagName?: string) => {
    if (!tagNameRef.current) {
      // 属于新建
      if (hkMapRef.current && hkMapRef.current[getKeyByHkArrary(keys)]) {
        return false;
      }
    } else {
      // 属于更新
      if (tagNameRef.current != curTagName) {
        if (hkMapRef.current && hkMapRef.current[getKeyByHkArrary(keys)] && hkMapRef.current[getKeyByHkArrary(keys)] !== tagNameRef.current) {
          return false;
        }
      }
    }
    // const tagName = curTagName || tagNameRef.current;
    // // 本地是否已经存储了快捷键
    // if (hkMapRef.current && tagName && hkMapRef.current[getKeyByHkArrary(keys)] && hkMapRef.current[getKeyByHkArrary(keys)] !== tagName ) {
    //   return false;
    // }
    // 检测是否与其他系统业务快捷键冲突
    if (hkMapRef.current && mailHkMap[getKeyByHkArrary(keys)]) {
      return false;
    }
    return true;
  }, []);

  // 处理快捷键变更
  const handleHkChange = useCallback((keys: string[]) => {
    setHkValue(keys);
    onChangeRef(keys);
  }, []);

  // 重置内部状态
  const reset = useCallback(() => {
    // setHkValue([]);
    setConflict(false);
  }, []);

  // 初始化读取本地存储的快捷键
  useEffect(() => {
    try {
      reset();
      // 读取本地 tagname: [ctrl,shift,alt]
      // todo: account
      const localHkMap: stringMap = getHKFromLocalByAccount(account);
      // setTag2HkMap(localHkMap);
      // 根据tagName获取对应的快捷键
      if (localHkMap) {
        if (localHkMap[initTagName]) {
          setHkValue(localHkMap[initTagName]);
        }
        // 计算本地快捷键 到 tagName的map
        const map: stringMap = {};
        for (let i in localHkMap) {
          try {
            const hkKeys = getKeyByHkArrary(localHkMap[i]);
            map[hkKeys] = i;
          } catch (e) {
            console.error('[error] mailtagHotKey error localData', e);
          }
        }
        setHkMap(map);
      }
    } catch (e) {
      console.error('[error] mailtagHotKey error read local', e);
    }
  }, []);

  return (
    <div className="mailtag-hk-wrap" data-test-id="mailtag-hk-wrap">
      <KeySwiftInput
        value={hkValue}
        style={style}
        className={className}
        _data_test_id="mailtag-hk-input"
        valid={validHk}
        onValidError={() => setConflict(true)}
        onValidSuccess={() => setConflict(false)}
        onChange={handleHkChange}
      />
      {conflict ? (
        <div className={styles.errorInfo} data-test-id="mailtag-hk-info" style={{ marginTop: 5 }}>
          与已有快捷键冲突，请重新输入
        </div>
      ) : (
        <></>
      )}
    </div>
  );
});

export default MailTagHotKeyInput;
