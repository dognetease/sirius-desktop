import React from 'react';
import { api, inWindow } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';

const systemApi = api.getSystemApi();
const isElectron = systemApi.isElectron();

export const versionConflictHandler = () => {
  Modal.info({
    title: '操作提示',
    content: '菜单版本冲突，请刷新页面',
    hideCancel: true,
    keyboard: false,
    closable: false,
    maskClosable: false,
    okText: '刷新',
    onOk: () => {
      if (isElectron) {
        systemApi.reLaunchApp();
      } else if (inWindow()) {
        window.location.reload();
      }
    },
  });
};
