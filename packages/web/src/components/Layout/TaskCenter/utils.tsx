import React from 'react';
import qs from 'querystring';
import { api } from 'api';
import { WindowLocation } from '@reach/router';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { getTransText } from '@/components/util/translate';

const systemApi = api.getSystemApi();
const isWebWmEntry = systemApi.isWebWmEntry();
const noviceTaskPath = isWebWmEntry ? getTransText('GERENTOUXIANG-XINSHOURENWU') : getTransText('GERENTOUXIANG-RENWUZHONGXIN-XINSHOURENWU');

export const showNoviceTaskCloseTip = () => {
  Modal.warning({
    title: `${getTransText('YIGUANBIXINSHOURENWUNIKEYI')}"${noviceTaskPath}"${getTransText('ZAICISHIYONG')}`,
    icon: <i className="icon warn-icon" />,
    okText: getTransText('ZHIDAOLE'),
    hideCancel: true,
  });
};

type GetSystemTaskModuleTypes = (location: WindowLocation<unknown>) => {
  moduleName: string;
  moduleTypes: string[];
};

export const getSystemTaskEntryProps: GetSystemTaskModuleTypes = location => {
  const [moduleKey, queryString = ''] = location.hash.substring(1).split('?');
  let { page = '' } = qs.parse(queryString);
  let moduleName: string = getTransText('QUANBU');
  let moduleTypes: string[] = [];

  if (Array.isArray(page)) {
    page = page.pop() || '';
  }

  if (moduleKey === 'mailbox') {
    moduleName = getTransText('YOUXIANGXIANGGUAN');
    moduleTypes = ['CONTACT_EMAIL'];
  }

  if (moduleKey === 'site') {
    moduleName = getTransText('ZHANDIANGUANLI');
    moduleTypes = ['SITE_MANAGEMENT'];
  }

  if (moduleKey === 'edm') {
    moduleName = getTransText('YINGXIAOXIANGGUAN');
    moduleTypes = ['EDM'];
  }

  return { moduleName, moduleTypes };
};
