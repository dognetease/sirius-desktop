import { useState } from 'react';
import { apis, apiHolder, WhatsAppApi, SystemApi, DataTrackerApi, DataTransApi, MailConfApi } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { getIn18Text } from 'api';

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const mailConfigApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const httpApi = apiHolder.api.getDataTransApi() as DataTransApi;
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const { confirm } = Modal;

export const usePaidUpgrade = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const user = systemApi.getCurrentUser();

  const handleClickUpgrade = (type: string) => {
    handleBackEnd();
    confirm({
      icon: null,
      title: '是否已完成支付开通网易外贸通？',
      okText: '已完成支付',
      cancelText: '未支付',
      onOk() {
        console.log('OK');
        window.location.reload();
      },
      onCancel() {
        console.log('Cancel');
      },
    });
    setLoading(true);
    whatsAppApi
      .reportWhatsAppOpportunity({
        // 产品类型
        productType: 'Service_Foreign_Trade',
        // 线索来源
        clueSource: systemApi.isElectron() ? 'WAIMAO_DESKTOP' : 'WAIMAO_WEB',
        // 联系人手机号
        mobile: user?.mobile,
        // 联系人姓名
        nickName: user?.nickName,
        // 联系人角色
        contactRo: '管理员',
        // 企业名称
        orgName: user?.company,
      })
      .finally(() => {
        setLoading(false);
      });
    trackApi.track('pc_register_pay', { type });
  };
  // 管理后台
  const handleBackEnd = async () => {
    const redirectUrl =
      mailConfigApi.getWebMailHost(true) +
      '/admin/login.do?hl=zh_CN&uid=' +
      systemApi.getCurrentUser()?.id +
      '&app=admin&all_secure=1&target=product*tradelink&from=tradelink';
    const url: string | undefined = await mailConfigApi.getWebSettingUrlInLocal('', { url: redirectUrl });
    if (url && url.length > 0) {
      // 应用内免登
      // systemApi.openNewWindow(url, true, undefined, undefined, true);
      // 跳转浏览器
      systemApi.openNewWindow(url, false, undefined, undefined, true);
    } else {
      Toast.warn({
        content: getIn18Text('WUFADAKAIZHI'),
        duration: 3,
      });
    }
  };
  // 跳转到登录页
  const jumpToLogin = (retry: number) => {
    setTimeout(() => {
      const logoutPage = httpApi.getLogoutPage();
      console.warn('jump to logout page ', logoutPage);
      if (systemApi.getCurrentUser() == undefined) {
        window.location.assign(logoutPage);
      } else if (retry > 0) {
        jumpToLogin(retry - 1);
      } else {
        window.localStorage.clear();
        window.location.assign(logoutPage);
      }
    }, 700);
  };
  return { loading, handleClickUpgrade };
};
