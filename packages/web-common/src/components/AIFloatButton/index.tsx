import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorageState } from 'ahooks';
import Draggable from 'react-draggable';
import { apiHolder, apis, EdmRoleApi, DataTrackerApi, getIn18Text } from 'api';
import { Drawer } from 'antd';
import { config } from 'env_def';
import classnames from 'classnames';
import { TongyongGuanbiXian, TongyongDaochu } from '@sirius/icons';
import aiIconAnimation from '@web-common/images/icons/aifloatbtn.png';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import aiIcon from '@web-common/images/icons/aidrawnormal.png';
import style from './index.module.scss';
import { bus } from '@web-common/utils/bus';
interface Props {
  visible?: boolean;
  showIcon?: boolean;
  openAiMaster?: boolean;
}

const { isMac } = apiHolder.env;
const POSITION_KEY = 'AIFloatToolY';
const AI_FLOATBTN_TIP = 'AI_FLOATBTN_TIP';
const isProd = config('stage') === 'prod';
const aiUrl = isProd ? 'https://ai-h5.waimao.163.com' : 'https://ai-h5.cowork.netease.com';
const pcUrl = isProd ? 'https://ai.waimao.163.com' : 'https://ai-test.waimao.163.com';
const systemApi = apiHolder.api.getSystemApi();
const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const isWindows = systemApi.isElectron() && !isMac;

export const AIFloatButton = (props: Props) => {
  const { visible = true, openAiMaster = false, showIcon = true } = props;
  const [open, setOpen] = useState(false);
  const [wmt, setWmt] = useState('');
  const draggingRef = useRef<boolean>(false);
  const [btnIcon, setBtnIcon] = useState(aiIconAnimation);
  const [transformY, setTransformY] = useLocalStorageState(POSITION_KEY, { defaultValue: 0 });
  const [showTip, setShowTip] = useLocalStorageState(AI_FLOATBTN_TIP, { defaultValue: true });
  const [shouldShowBtn, setShouldShowBtn] = useState(false);

  const defaultPosition = useMemo(() => {
    return transformY ? { x: 0, y: Number(transformY) } : undefined;
  }, [transformY]);

  const showAIDrawer = useCallback(async () => {
    if (draggingRef.current) return;
    const cookies = await systemApi.doGetCookies(true);
    setWmt(cookies?.QIYE_TOKEN || '');
    setOpen(true);
    trackApi.track('waimao_ai_master_click');
  }, []);

  const openFromBus = useCallback(async () => {
    const cookies = await systemApi.doGetCookies(true);
    setWmt(cookies?.QIYE_TOKEN || '');
    setOpen(true);
    trackApi.track('waimao_ai_master_click');
  }, []);

  useEffect(() => {
    bus.on('aimaster', openFromBus);
  }, []);

  const close = useCallback(async () => {
    setWmt('');
    setOpen(false);
  }, []);

  const linkToPc = useCallback(async () => {
    const cookies = await systemApi.doGetCookies(true);
    const token = cookies?.QIYE_TOKEN || '';
    systemApi.openNewWindow(`${pcUrl}/embedLanding?wmt=${token}`, false);
  }, []);

  useEffect(() => {
    // 是否在白名单，仅白名单用户展示按钮
    roleApi.aiFloatEntrance().then(res => {
      setShouldShowBtn(res?.showAIAssistance || false);
    });
  }, []);

  if (!visible || !shouldShowBtn) {
    return <></>;
  }

  return (
    <>
      {showIcon && (
        <Draggable
          bounds="body"
          axis="y"
          defaultPosition={defaultPosition}
          onDrag={() => {
            draggingRef.current = true;
          }}
          onStop={(_, data) => {
            setTransformY(Number(data.y));
            setTimeout(() => {
              draggingRef.current = false;
            });
          }}
        >
          <div className={style.buttonWrapper} onClick={showAIDrawer}>
            <Tooltip
              visible={showTip}
              placement="topRight"
              getTooltipContainer={node => node.parentElement || document.body}
              title={
                <div className={style.tip}>
                  <span>{getIn18Text('GONGXININHUODEYIGE')}</span>
                  <span
                    className={style.tipOk}
                    onClick={e => {
                      setShowTip(false);
                      e.stopPropagation();
                    }}
                  >
                    {getIn18Text('ZHIDAOLE')}
                  </span>
                </div>
              }
            >
              <img src={btnIcon} alt="AI" onError={() => setBtnIcon(aiIcon)} />
            </Tooltip>
          </div>
        </Draggable>
      )}
      <Drawer
        className={style.aiDrawer}
        placement="right"
        mask={false}
        maskClosable={false}
        style={{
          zIndex: 1111,
        }}
        width={375}
        bodyStyle={{ padding: 0, overflow: 'hidden' }}
        title={
          <div className={classnames(style.title, isWindows ? style.winapp : '')}>
            <span onClick={linkToPc}>
              <TongyongDaochu color="#3F465C" />
            </span>
            <span onClick={close}>
              <TongyongGuanbiXian color="#3F465C" />
            </span>
          </div>
        }
        closable={false}
        onClose={() => {
          setOpen(false);
        }}
        visible={open}
      >
        {open && (
          <div className={style.content}>
            <iframe className={style.frame} src={`${aiUrl}/embed?wmt=${wmt}`} frameBorder="0"></iframe>
          </div>
        )}
      </Drawer>
    </>
  );
};
