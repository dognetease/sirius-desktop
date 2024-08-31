import React, { useState, useEffect, useImperativeHandle, ReactNode } from 'react';
import { Dropdown, Menu, Tooltip, message } from 'antd';
import classnames from 'classnames';
import { navigate } from '@reach/router';
import { apiHolder, apis, getIn18Text, EdmSendBoxApi, PrevScene, AiMarketingContact, DataTrackerApi, environment } from 'api';
import { AiWriteMailReducer, useActions } from '@web-common/state/createStore';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { ButtonType } from '@web-common/components/UI/Button/button';
import CaretDownOutlined from '@ant-design/icons/CaretDownOutlined';
import { SechemeAndGroupBoxModal } from '../../AIHosting/components/SechemeAndGroupBox/index';
import styles from './aiMarketingEnter.module.scss';

const storageApi = apiHolder.api.getDataStoreApi();
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

export const env = typeof environment === 'string' ? environment : 'local';
export const isDev = !['prod', 'prev'].includes(env);

interface DropdownItem {
  key: string;
  value: ReactNode;
}

interface AiMarketingEnterProps {
  // 按钮类型 text-纯文字 menu-下拉（20231010去掉，但代码里做了兼容防止依旧传menu的入口样式有问题） custom-针对任务详情的自定义样式 ButtonType-继承组件样式
  btnType?: 'text' | 'menu' | 'custom' | ButtonType;
  // 点击类型 直接新建传create 是包含自动获客任务的完全新建 大数据量传bigData 跳转任务类型选择页传assembly 其他默认normal
  handleType?: 'create' | 'normal' | 'bigData' | 'assembly';
  // 按钮文案
  text?: string;
  // 按钮自定义样式
  btnClass?: string;
  // 联系人数据
  contacts?: AiMarketingContact[];
  // 是否需要过滤联系人
  needFilter?: boolean;
  // 需要展示的引导的缓存key（一次性 存入本地）
  guideKey?: string;
  // 是否需要置灰，联系人列表为空时点击默认toast，传入则直接置灰不可点击（仅按钮有此状态）
  needDisable?: boolean;
  // 页面来源，用于展示面包屑名称
  from?: PrevScene;
  // 返回路由 #xxx ，用于面包屑点击返回
  back?: string;
  // 自定义按钮的场景
  renderBtn?: () => JSX.Element;
  // 按钮点击之后的回调
  afterClick?: () => void;
  // 按钮点击回调同步执行还是异步执行 async-执行afterClick的同时直接执行handleHosting  sync-只执行afterClick等待调用方执行handleHosting
  afterClickType?: 'async' | 'sync';
  // 创建方案及确定按钮点击之后的回调
  afterCompleteClick?: () => void;
  // 下拉数据
  dropdownList?: DropdownItem[];
  // 下拉点击
  dropdownClick?: (item?: DropdownItem) => void;
  // 下拉自定义样式
  menuClass?: string;
  // 传入的企业id
  ids?: string[];
  // 选择当前方案完成方案分组选择操作后的回调以及新建方案完成后的回调
  completeCallback?: (planId: string, groupId: string, groupName: string, ids?: string[], hideToast?: boolean) => void;
  // 统计来源 用于埋点
  trackFrom?: string;
}

const AiMarketingEnter = React.forwardRef((props: AiMarketingEnterProps, ref) => {
  const {
    btnType = 'default',
    handleType = 'normal',
    text = getIn18Text('YINGXIAOTUOGUAN'),
    btnClass,
    contacts = [],
    needFilter = false,
    guideKey,
    needDisable = false,
    renderBtn,
    from,
    back,
    afterClick,
    afterClickType = 'async',
    afterCompleteClick,
    dropdownList = [{ key: 'oneHosting', value: '一键营销' }],
    dropdownClick,
    menuClass,
    ids,
    completeCallback,
    trackFrom,
  } = props;

  const [loading, setLoading] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [taskId, setTaskId] = useState<string>('');

  // aiHostingInitObj为营销入口携带数据，仅在此文件中更新
  // type值含义：new-包含自动任务的完全新建任务 create-选择方案分组弹窗中的新建任务（不包含自动任务） normal-没有手动任务下新建任务 filter-已有手动任务下过滤联系人
  // 四种情况下执行清除aiHostingInitObj操作：创建流程面包屑导航返回或取消、不过滤联系人情况下创建成功、过滤联系人情况下创建成功后中断联系人过滤操作（包括选择方案分组弹窗点击取消或关闭）、过滤联系人情况下完全执行完过滤流程
  const { changeAiHostingInitObj } = useActions(AiWriteMailReducer);

  // 初始获取是否需要展示引导
  useEffect(() => {
    if (guideKey) {
      const storageRes = storageApi.getSync(guideKey, { noneUserRelated: true }).data;
      setShowGuide(!storageRes);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    handleHosting,
  }));

  const handleHostingBefore = () => {
    // 执行传入的点击回调
    afterClick && afterClick();
    if (afterClickType === 'sync') {
      return;
    }
    handleHosting();
  };

  // 营销托管点击
  const handleHosting = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    // 接口获取是否已有手动创建的营销托管，已开启则需要拿到taskId
    const result = await edmApi.getSendBoxConf({ type: 2 });
    const manualTask = result?.manualPlan === 1;
    const taskId = result.hostingTaskId || '';
    // 包含自动获客任务的完全新建
    if (handleType === 'create') {
      changeAiHostingInitObj({ type: 'new', contacts, taskId, from, back, filter: needFilter, trackFrom });
      navigate('#edm?page=aiHosting');
    } else if (handleType === 'assembly') {
      changeAiHostingInitObj({ type: 'write', contacts, taskId, from, back, filter: needFilter, trackFrom });
      navigate(`#edm?page=write&from=${from}&back=${back}`);
    }
    // 大数据量录入不考虑是否有营销任务，直接在当前页面展示方案分组选择弹窗
    else if (handleType === 'bigData') {
      setModalVisible(true);
      setTaskId(taskId);
    }
    // 正常情况
    else if (contacts.length <= 0) {
      message.warn('请选择联系人');
    } else if (manualTask && taskId && !needFilter) {
      // 已有且不需要过滤
      setModalVisible(true);
      setTaskId(taskId);
    } else if (manualTask && taskId && needFilter) {
      // 已有且需要过滤 - 跳转营销大盘页面，弹出联系人过滤抽屉
      // handleType === 'bigData'不走这个逻辑，因为不需要过滤
      setTaskId(taskId);
      changeAiHostingInitObj({ type: 'filter', contacts, taskId, from, back, filter: needFilter, trackFrom });
      navigate('#edm?page=aiHosting');
    } else {
      // 没有或者还没创建营销托管
      changeAiHostingInitObj({ type: 'normal', contacts, taskId, from, back, filter: needFilter, trackFrom });
      navigate('#edm?page=aiHosting');
    }
    setLoading(false);
  };

  // 新建任务
  const handleCreate = () => {
    setModalVisible(false);
    afterCompleteClick && afterCompleteClick();
    changeAiHostingInitObj({ type: 'create', handleType, contacts, taskId, from, back, filter: needFilter, completeCallback, ids, trackFrom });
    navigate('#edm?page=aiHosting');
  };

  // 下拉点击处理
  const handleDropdown = ({ item }: { item: DropdownItem }) => {
    dropdownClick && dropdownClick(item);
  };

  // 引导点击知道了
  const handleGuideConfirm = () => {
    if (guideKey) {
      storageApi.putSync(guideKey, 'true', { noneUserRelated: true });
    }
    setShowGuide(false);
  };

  const handleModalConfirm = async (groupId: string, planId: string, name: string = '') => {
    // 大数据量场景下交给组件调用方处理
    if (handleType === 'bigData') {
      completeCallback && completeCallback(planId, groupId, name, ids);
      setModalVisible(false);
      return;
    }
    let param = {
      taskId,
      groupId,
      planId,
      contacts: contacts.map(item => ({
        name: item.contactName,
        email: item.contactEmail,
        sourceName: item.sourceName || '',
        increaseSourceName: item.increaseSourceName || '',
      })),
      name,
      check: 1,
    };
    const result = await edmApi.addContactPlan(param);
    if (result) {
      message.success(getIn18Text('TIANJIALIANXIRENCHENGGONG'));
      setModalVisible(false);
      afterCompleteClick && afterCompleteClick();
      trackApi.track('pc_marketing_edm_host_addSuccess', { source: trackFrom || 'host', from: 'popTask' });
    } else {
      message.error(getIn18Text('TIANJIASHIBAI'));
    }
  };

  const renderBtnComp = () => {
    if (renderBtn) {
      return renderBtn();
    }
    const btnDisabled = needDisable ? contacts.length <= 0 : false;
    if (btnType === 'text') {
      return (
        <span className={classnames(styles.aiMarketingText, btnClass)} onClick={handleHostingBefore}>
          {text}
        </span>
      );
    }
    // 20231010去掉下拉样式（地址簿除外），将各入口的【营销托管按钮及下拉一键营销】更换为一键营销按钮，走统一的任务类型选择页
    else if (btnType === 'menu' && handleType !== 'assembly') {
      return (
        <Dropdown.Button
          className={classnames(styles.aiMarketingDropdown, btnClass)}
          onClick={handleHostingBefore}
          icon={<CaretDownOutlined />}
          trigger={['click']}
          type="primary"
          overlay={
            <Menu className={classnames(styles.aiMarketingMenu, menuClass)} onClick={handleDropdown}>
              {dropdownList.map((item: DropdownItem) => (
                <Menu.Item key={item.key}>{item.value}</Menu.Item>
              ))}
            </Menu>
          }
          disabled={btnDisabled}
        >
          {text}
        </Dropdown.Button>
      );
    } else if (btnType === 'custom') {
      return (
        <div className={classnames(styles.aiMarketingCustom, btnClass)} onClick={handleHostingBefore}>
          {text}
        </div>
      );
    }
    return (
      <Button
        className={classnames(styles.aiMarketingBtn, btnClass)}
        btnType={btnType === 'menu' ? 'default' : btnType}
        onClick={handleHostingBefore}
        disabled={btnDisabled}
      >
        {text}
      </Button>
    );
  };

  return (
    <div className={styles.aiMarketingEnter}>
      <Tooltip
        arrowPointAtCenter={true}
        destroyTooltipOnHide
        placement="bottomLeft"
        trigger="hover"
        getPopupContainer={triggerNode => triggerNode}
        title={
          <div className={styles.aiMarketingGuide}>
            {getIn18Text('ZIDONGDUOLUNYINGXIAO，')}
            <span onClick={handleGuideConfirm} className={styles.aiMarketingKnow}>
              {getIn18Text('ZHIDAOLE')}
            </span>
          </div>
        }
        visible={showGuide}
      >
        {renderBtnComp()}
      </Tooltip>
      <SechemeAndGroupBoxModal
        title={handleType === 'bigData' ? `共添加${ids?.length || 0}个企业的联系人，请完成设置` : `共添加${contacts.length}个联系人，请完成设置`}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onConfirm={handleModalConfirm}
        taskId={taskId}
        onCreate={() => handleCreate()}
        // tipMsg={handleType === 'bigData' ? '联系人较多，系统进行后台处理，添加成功后会发送消息提醒' : ''}
      />
    </div>
  );
});

export default AiMarketingEnter;
