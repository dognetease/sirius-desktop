import React, { useEffect, useState } from 'react';
import lodashGet from 'lodash/get';
import { apiHolder, IMMessage, NIMApi } from 'api';
import classnames from 'classnames/bind';
import { Frame } from './chatItemAltFooterFrame';
import style from './chatItemAltFooter.module.scss';
import { FooterAction } from '../../common/customTplFooter';

const httpApi = apiHolder.api.getDataTransApi();
const systemApi = apiHolder.api.getSystemApi();
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const realStyle = classnames.bind(style);
interface Props {
  footerAction: FooterAction;
  msg: IMMessage;
}

interface TaskContentField {
  subType: 'changeTaskStatus';
  data: {
    msgId: string;
    status: string;
  };
}

const requestQiyeCookie = async () => {
  const cookies = await systemApi.doGetCookies(true);
  return cookies.QIYE_TOKEN as string;
};

export const AltFooter: React.FC<Props> = props => {
  const { footerAction, msg } = props;
  // 初始任务状态
  const initTaskStatus = lodashGet(footerAction, 'elements[0].status', '') as string;

  // 获取任务状态
  const [taskStatus, setTaskStatus] = useState(() => {
    const initTaskStatus = lodashGet(footerAction, 'elements[0].status', '') as string;
    let tempTaskStatus = initTaskStatus;
    try {
      const { localCustom = '' } = msg;
      tempTaskStatus = lodashGet(JSON.parse(localCustom), 'taskStatus', initTaskStatus);
    } catch (ex) {}

    const isIncluded = footerAction.elements.map(item => item.status).includes(tempTaskStatus);
    return isIncluded ? tempTaskStatus : initTaskStatus;
  });

  // 更新Task状态
  const requestTaskStatus = async () => {
    const { resp_field: resField, req_api: requestUrl, elements } = footerAction;
    const token = await requestQiyeCookie();
    const { data: res } = await httpApi.get(
      requestUrl,
      {},
      {
        headers: {
          QIYE_TOKEN: token,
        },
      }
    );
    const tempStatus = lodashGet(res, resField, initTaskStatus);

    // 如果当前任务状态=初始任务状态 OR 枚举的状态集合中不包含当前任务状态
    const isIncluded = elements.map(item => item.status).includes(tempStatus);
    if (tempStatus === initTaskStatus || !isIncluded) {
      return;
    }

    setTaskStatus(tempStatus);
    let tempLocalCustom: Record<string, string> = {};
    try {
      const { localCustom = '' } = msg;
      tempLocalCustom = JSON.parse(localCustom) as {};
    } catch (ex) {}
    // 更新本地缓存
    nimApi.excute('updateLocalMsg', {
      idClient: props.msg.idClient,
      localCustom: JSON.stringify({
        ...tempLocalCustom,
        taskStatus: tempStatus,
      }),
    });
  };
  useEffect(() => {
    /**
     * 以下三种情况不发送请求
     * taskStatus发生了变更(只要变更 就是最终状态)
     * req_api没有配置
     * 消息过期
     */
    const isStopRequest = [
      () => taskStatus !== initTaskStatus,
      () => lodashGet(footerAction, 'req_api.length', 0) === 0,
      () => {
        if (typeof footerAction.max_age !== 'number') {
          return true;
        }
        const maxAge = footerAction.max_age * 60 * 60 * 1000;
        // const maxAge = 30 * 24 * 60 * 60 * 1000;
        const duration = new Date().getTime() - new Date(props.msg.time).getTime();
        return duration > maxAge;
      },
    ].some(call => call());
    !isStopRequest && requestTaskStatus();
  }, [taskStatus]);

  // 接受系统通知
  const oncustomSys = (sys: { content: string }) => {
    const sysContent: TaskContentField = {} as TaskContentField;
    try {
      const { subType, data } = JSON.parse(sys.content as string) as TaskContentField;
      sysContent.subType = subType;
      sysContent.data = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (ex) {}

    if (lodashGet(sysContent, 'subType', '') !== 'changeTaskStatus') {
      return;
    }
    // 设置当前任务状态
    if (sysContent.data.msgId === msg.idClient) {
      setTaskStatus(sysContent.data.status);
    }
  };
  useEffect(() => {
    nimApi.subscrible('oncustomsysmsg', oncustomSys);
    return () => {
      nimApi.unSubcrible('oncustomsysmsg', oncustomSys);
    };
  }, []);

  return <Frame frame={footerAction.elements.find(item => item.status === taskStatus) || footerAction.elements[0]} msgId={msg.idClient} />;
};
