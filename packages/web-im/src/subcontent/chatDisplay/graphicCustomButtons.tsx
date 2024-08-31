import React, { useEffect, useState } from 'react';
import { apiHolder, IMMessage, NIMApi, apis, DataTrackerApi } from 'api';
import debounce from 'lodash/debounce';
import lodashGet from 'lodash/get';
import merge from 'lodash/merge';
const lodashMerge = merge;
import classnames from 'classnames/bind';
import { Button } from 'antd';
import { useObservable } from 'rxjs-hooks';
import { judgeMsgType } from '@web-im/utils/im_team_util';
import { ButtonModule, ButtonFrameApi, ButtonItemApi } from '../../common/convertServerMsgV2';
import style from './chatItemGraphic.module.scss';

const realStyle = classnames.bind(style);

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const httpApi = apiHolder.api.getDataTransApi();
const systemApi = apiHolder.api.getSystemApi();
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const requestQiyeCookie = async () => {
  const cookies = await systemApi.doGetCookies(true);
  return cookies.QIYE_TOKEN as string;
};
export const ButtonItem: React.FC<{ data: ButtonItemApi; order: number; fields: string; msgId: string }> = props => {
  const { data, order, fields = '', msgId } = props;
  const [requestStatus, setRequestStatus] = useState<'complete' | 'ing'>('complete');
  const myAccount = useObservable(() => nimApi.imself.getMyField(), '');

  const handleTrack = () => {
    nimApi.excute('getLocalMsgByIdClient', { idClient: msgId }).then(({ msg }: { msg: IMMessage }) => {
      judgeMsgType(msg, 'customMsgType', 2000) && trackApi.track('pc_click_chat_mailMessage');
    });
  };

  const onClick = async () => {
    handleTrack();
    {
      /* zqstodo: 尊享版本的企业管理员首次登录会收到专属客服通知，并跳转相应地址 */
    }
    if (data.action_url.url_type === 'LINK') {
      return systemApi.handleJumpUrl(`${Math.random()}`, data.action_url.pc_url);
    }

    setRequestStatus('ing');
    let formData: Record<string, unknown> = {};
    try {
      formData = typeof data.action_url.value === 'string' ? JSON.parse(data.action_url.value) : data.action_url.value;
    } catch (ex) {}

    const token = await requestQiyeCookie();

    let response: Record<string, any> = {};
    try {
      const { data: res } = await httpApi.post(data.action_url.pc_url, formData, {
        contentType: 'json',
        timeout: 2000,
        headers: {
          QIYE_TOKEN: token,
        },
      });
      response = res as unknown as Record<string, any>;
    } catch (ex) {
      return setRequestStatus('complete');
    }

    const taskStatus = lodashGet(response, fields, '');
    setRequestStatus('complete');

    // 发送sysmsg 通知各端变更任务状态
    nimApi.excute('sendCustomSysMsg', {
      scene: 'p2p',
      to: myAccount,
      content: JSON.stringify({
        subType: 'changeBtnModuleStatus',
        data: JSON.stringify({
          msgId,
          moduleOrder: order,
          status: taskStatus,
        }),
      }),
    });
  };
  const buttonClassnames = {
    DEFAULT: realStyle('default'),
    FULL_BLUE: realStyle('fullBlue'),
    RED: realStyle('red'),
    FULL_RED: realStyle('fullRed'),
    FULL_GREY: realStyle('fullGray'),
    GREY: realStyle('gray'),
  };
  return (
    <Button
      loading={requestStatus === 'ing'}
      disabled={data.action_url.url_type === 'DISABLE'}
      onClick={onClick}
      className={realStyle('graphicButton', [Reflect.has(buttonClassnames, data.style) ? buttonClassnames[data.style] : buttonClassnames.DEFAULT])}
    >
      {data.content}
    </Button>
  );
};

export const Buttonlist: React.FC<{ data: ButtonFrameApi; order: number; msgId: string; fields: string }> = props => {
  const { data, order, msgId, fields } = props;
  return (
    <div className={realStyle('graphicButtons', [data.direction.pc_direction === 'VERTICAL' ? 'directionColumn' : 'directionRow'])}>
      {data.buttons.map(item => (
        <ButtonItem data={item} order={order} msgId={msgId} fields={fields} />
      ))}
    </div>
  );
};

interface GraphicCustomMsgContentApi {
  subType: string;
  data: {
    msgId: string;
    moduleOrder: number;
    status: string;
  };
}

export const Frames: React.FC<{ data: ButtonModule; idClient: string; order: number }> = props => {
  const { data, idClient, order } = props;
  const [frameStatus, setFrameStatus] = useState(data.elements[0].status);
  // 从缓存中读取
  useEffect(() => {
    nimApi.excute('getLocalMsgByIdClient', { idClient }).then(({ msg }: { msg: IMMessage }) => {
      let localCustom = {};
      try {
        localCustom = JSON.parse(msg.localCustom as string);
      } catch (ex) {}

      const status = lodashGet(localCustom, `taskStatus.${order}`, '');
      if (status !== '') {
        setFrameStatus(status);
      }
    });
  }, []);

  const updateLocalTaskStatus = async (idClient: string, order: number, status: string) => {
    const msg = (await nimApi.excute('getLocalMsgByIdClient', { idClient })) as IMMessage;

    let localCustom = {};
    try {
      localCustom = JSON.parse(msg.localCustom as string);
    } catch (ex) {}
    nimApi.excute('updateLocalMsg', {
      idClient,
      localCustom: JSON.stringify(
        lodashMerge(localCustom, {
          taskStatus: {
            [order]: status,
          },
        })
      ),
    });
  };

  // oncustommsg更新按钮状态
  const oncustomSys = (sys: { content: string }) => {
    const sysContent: GraphicCustomMsgContentApi = {} as GraphicCustomMsgContentApi;
    try {
      const { subType, data: _data } = JSON.parse(sys.content as string) as GraphicCustomMsgContentApi;
      sysContent.subType = subType;
      sysContent.data = typeof _data === 'string' ? JSON.parse(_data) : _data;
    } catch (ex) {}

    if (lodashGet(sysContent, 'subType', '') !== 'changeBtnModuleStatus') {
      return;
    }
    // 设置当前任务状态
    if (sysContent.data.msgId === idClient && sysContent.data.moduleOrder === order) {
      setFrameStatus(sysContent.data.status);
      updateLocalTaskStatus(idClient, order, sysContent.data.status);
    }
  };

  useEffect(() => {
    nimApi.subscrible('oncustomsysmsg', oncustomSys);
    return () => {
      nimApi.unSubcrible('oncustomsysmsg', oncustomSys);
    };
  }, []);

  // 主动请求任务状态
  // 更新Task状态
  const requestTaskStatus = async (url: string, fields: string, statusList: string[]) => {
    if (!url || !url.length) {
      return;
    }
    const token = await requestQiyeCookie();
    const { data: res } = await httpApi.get(
      url,
      {},
      {
        headers: {
          QIYE_TOKEN: token,
        },
        noErrorMsgEmit: true,
      }
    );
    const tempStatus = lodashGet(res, fields, '');

    // 如果当前任务状态=初始任务状态 OR 枚举的状态集合中不包含当前任务状态
    if (!statusList.includes(tempStatus)) {
      return;
    }

    setFrameStatus(tempStatus);
    updateLocalTaskStatus(idClient, order, tempStatus);
  };

  // 主动向服务端请求状态
  useEffect(() => {
    // 如果状态已经变更过 OR 服务端表示不需要发送请求 不需要处理
    if (frameStatus !== data.elements[0].status || !data.interactive) {
      return () => {};
    }
    const _debounceRequest = debounce(requestTaskStatus, 20);
    const statusList = data.elements.map(item => item.status);
    _debounceRequest(data.status_url, data.status_field, statusList);
    return () => {
      _debounceRequest.cancel();
    };
  }, [frameStatus]);

  return <Buttonlist msgId={idClient} order={order} fields={data.status_field} data={data.elements.find(item => item.status === frameStatus) || data.elements[0]} />;
};
