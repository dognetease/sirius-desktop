import React, { useEffect, useRef, useState } from 'react';
import { Tooltip } from 'antd';
import { apiHolder, DataStoreApi, inWindow } from 'api';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import outerStyle from './index.module.scss';
import { ReactComponent as HelpIcon } from '@/images/mailCustomerCard/help.svg';
import { getIn18Text } from 'api';

interface HelpInfoProps {
  // visible: boolean; // 不再使用，因为必然是true
  onClickHelp?: () => void;
}

const storeApi: DataStoreApi = apiHolder.api.getDataStoreApi();
const STORAGE_KEY = 'HELPER_ICON_VISIBLE';

export const HelpInfo = ({ onClickHelp }: HelpInfoProps) => {
  const [helpIconVisible, setHelpIconVisible] = useState(false);

  const timerRef = useRef(0);

  const handleClickHelp = () => {
    onClickHelp && onClickHelp();
  };

  useEffect(
    () => () => {
      if (inWindow() && timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    },
    []
  );

  // 监听新手引导弹窗的关闭事件，首次关闭引导弹窗后展示3s的 tooltip，自动关闭，后续不再展示
  useMsgRenderCallback('mailMenuOper', ev => {
    if (ev?.eventStrData === 'newGuideForAside') {
      const _helpIconVisible = ev.eventData.visible;
      if (_helpIconVisible === false) {
        storeApi.get(STORAGE_KEY).then(({ suc, data }) => {
          const neverShown = !suc || data !== '1';
          if (inWindow() && !timerRef.current && neverShown) {
            setHelpIconVisible(true);
            storeApi.put(STORAGE_KEY, '1').then();
            timerRef.current = window.setTimeout(() => {
              setHelpIconVisible(false);
            }, 3000);
          }
        });
      }
    }
  });

  return (
    <Tooltip placement="bottom" title={getIn18Text('KEZAIZHELICHAKANGONGNENGJIESHAO')} visible={helpIconVisible}>
      <HelpIcon className={outerStyle.topBannerIcon} onClick={handleClickHelp} />
    </Tooltip>
  );
};
