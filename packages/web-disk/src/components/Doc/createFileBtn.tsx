import React, { useEffect, useState, useRef } from 'react';
import { Dropdown, Menu, Tooltip } from 'antd';
import { apiHolder, DataStoreApi, NSCreateFileType } from 'api';
import IconCard from '@web-common/components/UI/IconCard/index';
import { DiskActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { DiskTipKeyEnum, checkDiskGuideTipsPriority } from '../../disk';
import { mulTableDropItem, unitableType } from '../../helper/constant';
import classes from './createFileBtn.module.scss';
import { templateTrack, trackerCreateBaseCached, trackerTransitionCached } from '../MainPage/extra';
import { useCreateFile } from '../../commonHooks/useCreateFile';
import { useTemplateModal } from '../../commonHooks/useTemplateModal';
import { useCheckCreateUnitableAvailable } from '../../commonHooks/useCheckCreateUnitableAvailable';
import { getIn18Text } from 'api';
const dataStoreApi: DataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
type MenuClickEventHandler = React.ComponentProps<typeof Menu>['onClick'];
export const CreateFileMenu: React.FC<{
  unitableAvailable: boolean;
  handleMenuClick: MenuClickEventHandler;
}> = ({ unitableAvailable, handleMenuClick }) => {
  const createMenus = [
    { key: 'excel', value: getIn18Text('XIETONGBIAOGE'), icon: <IconCard type="lxxls" width={16} height={16} /> },
    { key: 'doc', value: getIn18Text('XIETONGWENDANG'), icon: <IconCard type="lxdoc" /> },
    unitableAvailable ? mulTableDropItem : null,
    { key: 'template', value: getIn18Text('YONGMOBANXINJIAN'), icon: <IconCard type="template" width={16} height={16} /> },
  ].filter(item => item != null) as Array<{
    key: string;
    value: string;
    icon: JSX.Element;
  }>;
  const menu = (
    <Menu onClick={handleMenuClick}>
      {createMenus.map(item => {
        const menuItem = (
          <Menu.Item key={item.key}>
            <span className={classes.menuTextWrapper}>
              {item.icon}
              <span className={classes.menuText}>{item.value}</span>
            </span>
          </Menu.Item>
        );
        return menuItem;
      })}
    </Menu>
  );
  return menu;
};
const CreateFileBtn: React.FC<{
  className: string;
}> = ({ className, children }) => {
  const dispatch = useAppDispatch();
  const guideTipsInfo = useAppSelector(state => state.diskReducer.guideTipsInfo);
  const [tipVisible, setTipVisible] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canCreateFile, createFile, spaceInfo] = useCreateFile();
  const dirId = spaceInfo?.dirId!;
  const [templateModal, setTemplateModalVisible] = useTemplateModal(dirId);
  useEffect(() => {
    const isTipShowed = guideTipsInfo[DiskTipKeyEnum.DOC_CREATE_TIP].showed;
    const isCurPriority = checkDiskGuideTipsPriority(guideTipsInfo, DiskTipKeyEnum.DOC_CREATE_TIP);
    const visible = !isTipShowed && isCurPriority;
    setTipVisible(visible);
  }, [guideTipsInfo]);
  const closeTip = () => {
    setTipVisible(false);
    dataStoreApi.put(DiskTipKeyEnum.DOC_CREATE_TIP, 'true');
    dispatch(
      DiskActions.setGuideTipsInfoByKey({
        key: DiskTipKeyEnum.DOC_CREATE_TIP,
        value: {
          ...guideTipsInfo[DiskTipKeyEnum.DOC_CREATE_TIP],
          showed: true,
          visiable: false,
        },
      })
    );
  };
  const [unitableAvailable] = useCheckCreateUnitableAvailable();
  const handleMenuClick: MenuClickEventHandler = React.useCallback(
    info => {
      const { key } = info;
      const docType = key === 'template' ? undefined : key;
      trackerTransitionCached.way = 'filePage-new';
      templateTrack({
        operaType: 'show',
        way: trackerTransitionCached.way,
      });
      setTemplateModalVisible(true, docType);
    },
    [createFile]
  );
  const menu = React.useMemo(() => <CreateFileMenu unitableAvailable={unitableAvailable} handleMenuClick={handleMenuClick} />, [unitableAvailable, handleMenuClick]);
  const tipContent = (
    <div>
      <span className={classes.tipText}>{getIn18Text('XINJIANWENJIANHUI')}</span>
      <span className={classes.tipBtn} onClick={closeTip}>
        {getIn18Text('ZHIDAOLE')}
      </span>
    </div>
  );
  return (
    <>
      {canCreateFile && (
        <div ref={containerRef} className="extheme">
          <Tooltip
            overlayClassName={classes.createTooltip}
            visible={tipVisible}
            placement="bottomRight"
            title={tipContent}
            getPopupContainer={() => containerRef?.current!}
          >
            <Dropdown overlay={menu} placement="bottomRight" trigger={tipVisible ? ['click'] : ['hover', 'click']} overlayClassName={`extheme ${classes.createMenu}`}>
              <div
                className={className}
                onClick={() => {
                  closeTip();
                }}
              >
                {children ?? <IconCard type="addFile" />}
              </div>
            </Dropdown>
          </Tooltip>
          {templateModal}
        </div>
      )}
    </>
  );
};
export default CreateFileBtn;
