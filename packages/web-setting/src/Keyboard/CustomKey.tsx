import React, { useEffect, useState } from 'react';
import { apiHolder, DataStoreApi, util, isElectron as inElectron } from 'api';
import { Input, message } from 'antd';
import styles from './index.module.scss';
import classnames from 'classnames';
import { getBodyFixHeight } from '@web-common/utils/constant';
import IconCard from '@web-common/components/UI/IconCard';

const systemApi = apiHolder.api.getSystemApi();
const isWebWmEntry = systemApi.isWebWmEntry();
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const isElectron = inElectron();

interface ICustomKeyProps {
  editInputVal: string;
  setEditInputVal: (val: string) => void;
  localKey: string;
  getStoreValue: () => { showShortcut: string; oldShortcut: string };
  editStatus: boolean;
  setEditStatus: (val: boolean) => void;
  globalList: any[];
  setShortcut: (data: { oldShortcut: string; newShortcut?: string }) => void;
  oldShortcut: string;
  setOldShortcut: (val: string) => void;
}

export const CustomKey: React.FC<ICustomKeyProps> = ({
  editInputVal,
  setEditInputVal,
  localKey,
  editStatus,
  globalList,
  setEditStatus,
  setShortcut,
  oldShortcut,
  getStoreValue,
  setOldShortcut,
}) => {
  const command = util.getCommonTxt();
  const specialKey = ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'];
  const showKey = [command, 'Ctrl', 'Shift', 'Alt', 'Ctrl'];
  const globalShortcutKey = ['CommandOrControl', 'Ctrl', 'Shift', 'Alt'];
  const changeShortcut = data => {
    const newShortcut = data.newShortcut;
    setShortcut({ oldShortcut, newShortcut });
    setOldShortcut(newShortcut);
    console.log('value------22----', oldShortcut, newShortcut);
  };
  const editCaptureKeyDown = e => {
    if (!editStatus) return;
    const key = e.key;

    const validKeys: string[] = [];
    const registerKeys = [];
    specialKey.forEach((item, index) => {
      if (e[item]) {
        validKeys.push(showKey[index]);
        registerKeys.push(globalShortcutKey[index]);
      }
    });
    if (/^\w$/.test(key) && validKeys.length) {
      validKeys.push(key.toUpperCase());
      registerKeys.push(key.toUpperCase());
      const reduplicateKey = globalList.includes(validKeys.join(''));
      if (reduplicateKey) {
        // 重复
        message.error('与已有快捷键冲突，请重新输入');
        e.stopPropagation();
        e.nativeEvent?.stopImmediatePropagation();
        return;
      }
      setEditInputVal(validKeys.join(' '));
      // CommandOrControl+Shift+A
      changeShortcut({ newShortcut: registerKeys.join('+') });
      dataStoreApi.putSync(localKey, validKeys.join(' ') || 'noncapture');
      setEditStatus(false);
    } else {
      if (/^\w$/.test(key)) validKeys.push(key.toUpperCase());
      setEditInputVal(validKeys.join(' '));
    }
    console.log('value----------', e);
  };

  const editCaptureKeyUp = e => {
    if (!editStatus) return;
    let keyupKeys = '';
    ['Meta', 'Ctrl', 'Shift', 'Alt', 'Control'].forEach((item, index) => {
      if (e.key === item) {
        keyupKeys = showKey[index];
      }
    });
    console.log('value----------112', keyupKeys, e);
    setEditInputVal(val => {
      return val.replace(keyupKeys, '').trim().replace(/\s+/g, ' ');
    });
  };

  const editCaptureChange = e => {
    setEditStatus(false);
    const { showShortcut } = getStoreValue();
    setEditInputVal(showShortcut);
  };

  useEffect(() => {
    document.addEventListener('keydown', editCaptureKeyDown);
    document.addEventListener('keyup', editCaptureKeyUp);
    document.addEventListener('click', editCaptureChange);
    return () => {
      document.removeEventListener('keydown', editCaptureKeyDown);
      document.removeEventListener('keyup', editCaptureKeyUp);
      document.removeEventListener('click', editCaptureChange);
    };
  }, [editStatus, setEditInputVal, setEditStatus, oldShortcut, setOldShortcut]);
  return (
    <>
      <Input
        value={editInputVal}
        onClick={e => e.nativeEvent.stopImmediatePropagation()}
        placeholder="输入新的快捷键"
        className={styles.editCaptureEditInput}
        suffix={
          <span
            className={styles.editCaptureEditIcon}
            onClick={e => {
              e.nativeEvent.stopImmediatePropagation();
              setEditInputVal('');
              dataStoreApi.putSync(localKey, 'noncapture');
              setShortcut({ oldShortcut });
            }}
          >
            <IconCard type="closeCircle" />
          </span>
        }
      />
    </>
  );
};

export default CustomKey;
