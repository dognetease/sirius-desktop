import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocalStorageState } from 'ahooks';
import { apiHolder, apis, GlobalGuideApi, IGlobalGuide, DataTrackerApi } from 'api';
import { useLocation } from '@reach/router';
import { Popover, PopoverProps } from 'antd';
import { differenceInDays } from 'date-fns';
import { useAppSelector } from '@web-common/state/createStore';
import { ReactComponent as GuideIcon } from '@web-common/images/icons/guide.svg';
import classnames from 'classnames';
import { GuideModal } from './modal';
import style from './style.module.scss';

interface Props extends PopoverProps {}
type GuideStorage = Record<IGlobalGuide.TipType, { time: number; count: number }>;
type GuideStorageFlg = Record<string, GuideStorage>;
interface EventData {
  moduleType: IGlobalGuide.ModuleType;
  moduleName?: string[];
  page?: string[];
}
const GuideStorageKey = 'GlobalGuideFlag';
const globalGuideApi = apiHolder.api.requireLogicalApi(apis.globalGuideApiImpl) as GlobalGuideApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = apiHolder.api.getSystemApi();
const eventApi = apiHolder.api.getEventApi();
const isElectron = systemApi.isElectron();

/**
 * 模块、页面和ModuleType的映射关系
 */
const ModuleTypeMap: Record<string, Record<string, IGlobalGuide.ModuleType>> = {
  wmData: {
    '': IGlobalGuide.ModuleType.BIG_DATA,
    globalSearch: IGlobalGuide.ModuleType.BIG_DATA,
    customs: IGlobalGuide.ModuleType.BIG_DATA,
    forwarder: IGlobalGuide.ModuleType.BIG_DATA,
    // industryCommerceSearch: IGlobalGuide.ModuleType.BIG_DATA,
    intelligentSearch: IGlobalGuide.ModuleType.BIG_DATA,
    intelligent: IGlobalGuide.ModuleType.BIG_DATA,
    smartrcmd: IGlobalGuide.ModuleType.SMART_SEARCH,
    contomfair: IGlobalGuide.ModuleType.BIG_DATA,
    lbs: IGlobalGuide.ModuleType.BIG_DATA,
    linkedin: IGlobalGuide.ModuleType.BIG_DATA,
    // extension: IGlobalGuide.ModuleType.BIG_DATA,
    // tradeAnalysis: IGlobalGuide.ModuleType.BIG_DATA,
  },
  intelliMarketing: {
    aiHostingNew: IGlobalGuide.ModuleType.MAIL_MARKETING,
    aiHosting: IGlobalGuide.ModuleType.MAIL_MARKETING,
    write: IGlobalGuide.ModuleType.MAIL_MARKETING,
    index: IGlobalGuide.ModuleType.MAIL_MARKETING,
    addressBookIndex: IGlobalGuide.ModuleType.MAIL_MARKETING,
    '': IGlobalGuide.ModuleType.MAIL_MARKETING,
  },
  edm: {
    aiHostingNew: IGlobalGuide.ModuleType.MAIL_MARKETING,
    aiHosting: IGlobalGuide.ModuleType.MAIL_MARKETING,
    write: IGlobalGuide.ModuleType.MAIL_MARKETING,
    index: IGlobalGuide.ModuleType.MAIL_MARKETING,
    addressBookIndex: IGlobalGuide.ModuleType.MAIL_MARKETING,
    '': IGlobalGuide.ModuleType.MAIL_MARKETING,
  },
  worktable: {
    worktable: IGlobalGuide.ModuleType.DEFAULT,
    '': IGlobalGuide.ModuleType.DEFAULT,
  },
  mailbox: {
    mailbox: IGlobalGuide.ModuleType.DEFAULT,
    '': IGlobalGuide.ModuleType.DEFAULT,
  },
};

/**
 * Uni Crm 特殊路由模块
 */
const CrmModlueMap: Record<string, { autoShow: boolean; moduleType: IGlobalGuide.ModuleType }> = {
  '/unitable-crm/lead/list?activeTab=my': {
    autoShow: true,
    moduleType: IGlobalGuide.ModuleType.CRM_LEAD,
  },
  '/unitable-crm/lead/list': {
    autoShow: true,
    moduleType: IGlobalGuide.ModuleType.CRM_LEAD,
  },
  '/unitable-crm/lead/list?activeTab=all': {
    autoShow: true,
    moduleType: IGlobalGuide.ModuleType.CRM_LEAD,
  },
  '/unitable-crm/custom/list?activeTab=all': {
    autoShow: true,
    moduleType: IGlobalGuide.ModuleType.CRM_CUSTOMER,
  },
  '/unitable-crm/custom/list?activeTab=my': {
    autoShow: true,
    moduleType: IGlobalGuide.ModuleType.CRM_CUSTOMER,
  },
  '/unitable-crm/custom/list': {
    autoShow: true,
    moduleType: IGlobalGuide.ModuleType.CRM_CUSTOMER,
  },
};

/**
 * 需要自动弹出的模块
 */
const AutoShowModuleMap: Record<string, Record<string, boolean>> = {
  intelliMarketing: {
    index: true,
    '': true,
  },
  edm: {
    index: true,
    '': true,
  },
  worktable: {
    worktable: true,
    '': true,
  },
  mailbox: {
    mailbox: true,
    '': true,
  },
  wmData: {
    // intelligentSearch: true,
    smartrcmd: true,
  },
};

type TimeoutID = ReturnType<typeof setTimeout>;
const GuideTooltip = (props: Props) => {
  const { className } = props;
  const [show, setShow] = useState(false);
  const newbieTask = useAppSelector(state => state.notificationReducer.newbieTask);
  const [guideStorage, setGuideStorage] = useLocalStorageState<GuideStorageFlg>(GuideStorageKey, {
    defaultValue: {} as GuideStorageFlg,
  });
  const [modalData, setModalData] = useState<IGlobalGuide.Modal>({} as IGlobalGuide.Modal);
  const location = useLocation();
  const delayTimer = useRef<TimeoutID>(null as unknown as TimeoutID);

  const hasCoverImg = useMemo(() => {
    return Boolean(modalData?.image?.imageUrl || modalData?.video?.videoRenderType === IGlobalGuide.VideoType.COVER);
  }, [modalData]);

  const getModuleType = useCallback((): [IGlobalGuide.ModuleType, moduleName: string, page: string] => {
    const urlSpl = String(window.location.hash).slice(1).split('?');
    const moduleName = urlSpl[0];
    const params = new URLSearchParams(urlSpl[1] || '');
    const page = params.get('page') || '';

    if (CrmModlueMap[moduleName]) {
      // CRM 特殊路由
      return [CrmModlueMap[moduleName].moduleType, moduleName, page];
    }

    return [ModuleTypeMap?.[moduleName]?.[page] || IGlobalGuide.ModuleType.DEFAULT, moduleName, page];
  }, [location]);

  const checkIfShouldShowTip = useCallback(async (): Promise<boolean> => {
    const selectorList = [
      '.upgradeweb', // web端更新弹窗
      '[class*="versionGuide-module-"]', // web端更新弹窗
      '[class*="versionPrompt-module-"]', // web端更新弹窗
      '[class*="hasMaskGuide-module-"]', // 通用全局组件
      '.l2c-crm-user-guide', // unicrm 用户引导
      '.new-guide-for-aside-wrapper-mask', // 邮件 + 用户提示
      '.ant-modal-root [class*="AihostingModal-module-"]', // 营销托管引导弹窗
      '.ant-modal-root [class*="upgradeModalContainer--"]', // 全局升级提示弹窗
    ];

    for (let i = 0, len = selectorList.length; i < len; i++) {
      const el = document.querySelector(selectorList[i]) as HTMLElement;
      if (el && el?.style?.display !== 'none') {
        // 弹窗存在
        return false;
      }
    }

    return true;
  }, []);

  /**
   * 请求对应模块的引导弹窗
   * 对应模块有全局引导时不弹出
   * 由于全局弹窗分散在各个模块且部分模块依赖接口，并有各自较为复杂的出现逻辑，所以目前实现方案：
   *  1. 自动弹出的引导延迟3秒出现
   *  2. 通过检测全局dom节点判断是否存在全局蒙层，如果有，则本引导不出现
   *  3. 低概率（模块弹窗判定接口延迟大于3秒） 可能会出现冲突，目前产品可以接受
   */
  const requireGuideModal = useCallback(
    async (moduleType: IGlobalGuide.ModuleType) => {
      clearTimeout(delayTimer.current);
      delayTimer.current = setTimeout(async () => {
        const shouldShowTip = await checkIfShouldShowTip();
        if (!shouldShowTip) {
          return;
        }
        const modalData = await globalGuideApi.getGuideContent(moduleType);
        if (!modalData) {
          return;
        }

        const { tipType, freezeDays = 0, maxTipLimit = 0 } = modalData;

        if (freezeDays < 0) {
          // 永久冻结
          return;
        }

        const user = await systemApi.getCurrentUser();
        const flag = guideStorage[user?.id as string];
        if (maxTipLimit > 0 && flag?.[tipType]?.count >= maxTipLimit) {
          // 弹窗最多出现多少次
          return;
        }

        if (flag?.[tipType]?.time) {
          const days = differenceInDays(new Date(), new Date(+flag?.[tipType]?.time));
          if (days < freezeDays) {
            // 一周内出现过
            return;
          }
        }
        setModalData({
          ...modalData,
          trigget: 'auto',
        });
        setShow(true);
        trackApi.track('waimao_best_user_guide', { opera_type: 'auto_show', popup_type: tipType });
      }, 3000);
    },
    [guideStorage, checkIfShouldShowTip]
  );

  const manualTrigger = useCallback(async () => {
    const [moduleType] = getModuleType();
    const modalData = await globalGuideApi.getGuideContent(moduleType);
    if (!modalData) {
      return;
    }
    setModalData({
      ...modalData,
      trigget: 'manual',
    });
    setShow(true);
    trackApi.track('waimao_best_user_guide', { opera_type: 'manual_show', popup_type: modalData?.tipType });
  }, [getModuleType]);

  const onClose = useCallback(
    async (tipType: IGlobalGuide.TipType, trigger?: 'manual' | 'auto') => {
      // 手动触发 不设置本地标记
      if (trigger !== 'manual') {
        const user = await systemApi.getCurrentUser();
        const key = user?.id || '';
        if (!guideStorage[key]) {
          guideStorage[key] = {} as GuideStorage;
        }

        const count = guideStorage[key]?.[tipType]?.count || 0;
        guideStorage[key][tipType] = {
          time: +new Date(),
          count: count + 1,
        };

        setGuideStorage({ ...guideStorage });
      }
      setModalData({} as IGlobalGuide.Modal);
      setShow(false);
    },
    [guideStorage]
  );

  useEffect(() => {
    // 部分模块自动触发模块
    const [moduleType, moduleName, page] = getModuleType();
    // 路由变化先关闭当前
    clearTimeout(delayTimer.current);
    setModalData({} as IGlobalGuide.Modal);
    setShow(false);

    if (CrmModlueMap?.[moduleName]?.autoShow || AutoShowModuleMap?.[moduleName]?.[page]) {
      if (!newbieTask) {
        // 自动弹出
        requireGuideModal(moduleType);
      }
    }
  }, [getModuleType, newbieTask]);

  useEffect(() => {
    const id = eventApi.registerSysEventObserver('requireModuleGuide', {
      func(event: { eventData?: EventData }) {
        if (!event?.eventData?.moduleType) {
          return;
        }

        const [_, moduleName, page] = getModuleType();
        if (event?.eventData?.moduleName?.length) {
          if (!event.eventData.moduleName.includes(moduleName)) {
            // 当前模块不是对应模块  不弹出
            return;
          }
        }

        if (event?.eventData?.page?.length) {
          if (!event.eventData.page.includes(page)) {
            // 当前页面不是对应页面  不弹出
            return;
          }
        }

        requireGuideModal(event.eventData.moduleType);
      },
    });

    return () => {
      eventApi.unregisterSysEventObserver('requireModuleGuide', id);
    };
  }, []);

  return (
    <Popover
      placement={props.placement || 'bottomRight'}
      {...props}
      visible={show}
      overlayClassName={classnames(style.userGuidePopover, hasCoverImg ? style.hasCoverImg : '', isElectron ? style.fixedPosition : '')}
      content={<GuideModal modalData={modalData} onClose={onClose} />}
      autoAdjustOverflow={!isElectron}
    >
      <div className={classnames(className, style.guideBtn)} onClick={manualTrigger}>
        <GuideIcon />
      </div>
    </Popover>
  );
};

export const UsageGuide = (props: Props) => {
  const appVersion = useAppSelector(state => state.privilegeReducer.version);

  if (!['FREE', 'FASTMAIL', 'FASTMAIL_AND_WEBSITE'].includes(appVersion)) {
    // 版本错误  不展示引导
    return <></>;
  }

  return <GuideTooltip {...props} />;
};
