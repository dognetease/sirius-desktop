import React, { useCallback, useMemo } from 'react';
import './tree.scss';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { actions as mailTabActions, tabId } from '@web-common/state/reducer/mailTabReducer';

interface MailTabProps {
  active?: boolean;
  onActive?: () => void;
  config: any;
}

const MailTab: React.FC<MailTabProps> = props => {
  const { active, onActive, config } = props;

  const handleTabClick = useCallback(() => {
    onActive && onActive();
  }, [onActive]);

  return (
    <div onClick={handleTabClick} className={` ${active && 'subtab-active'} mail-subtab sirius-no-drag`}>
      {config?.title}
      {config?.extra?.unRead ? (
        <span className="subtab-number">{config?.extra?.unRead ? (config?.extra?.unRead > 999 ? '999+' : config?.extra?.unRead) : ''}</span>
      ) : (
        <></>
      )}
    </div>
  );
};

// 默认激活的二级tab id
const DefaultTabActiveId = '-1/-1';
const DefaultList: any[] = [];

const MailSubTab: React.FC = () => {
  const dispatch = useAppDispatch();
  // 获取二级tab
  const subTabList = useAppSelector(state => state.mailTabReducer?.tabList[0]?.subTabs) || DefaultList;
  // 获取当前的tab激活状态
  const curTab = useAppSelector(state => state.mailTabReducer?.currentTab);
  // 激活的id
  const activeTabId = useMemo(() => {
    // 如果当前激活的id是在二级tab中
    const atConfig = subTabList?.find(item => item?.id == curTab?.id);
    // 如果当前页签来源于某个二级页签
    if (curTab?.extra?.from && curTab?.extra?.from != '-1' && curTab?.id != tabId.readCustomer && curTab?.id != tabId.subordinate && curTab?.id != tabId.readMain) {
      return curTab?.extra?.from;
    }
    if (atConfig && atConfig?.id) {
      return atConfig?.id;
    }
    return DefaultTabActiveId;
  }, [subTabList, curTab?.id]);

  const handleTabActive = useCallback((id: string) => {
    dispatch(mailTabActions.doChangeCurrentTab(id));
  }, []);

  const TabElement = useMemo(() => {
    return (
      <div className={`mail-subtab-wrap ${subTabList.length >= 3 && 'mail-subtab-average'}`}>
        {subTabList.map(config => {
          return <MailTab active={config?.id == activeTabId} config={config} onActive={() => handleTabActive(config?.id)} />;
        })}
      </div>
    );
  }, [subTabList, activeTabId]);

  // 如果只有一个tab的时候，则当前组件整体不显示
  if (subTabList.length <= 1) {
    return <></>;
  }
  return TabElement;
};

export default MailSubTab;
