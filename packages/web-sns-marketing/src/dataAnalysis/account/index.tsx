import { getIn18Text } from 'api';
import React from 'react';
import { Space } from 'antd';
import { TongyongGuanbiXian } from '@sirius/icons';
import { ReactComponent as TipIcon } from '@web-sns-marketing/images/tip_blue.svg';
import { useLocalStorageState } from 'ahooks';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { SearchModule } from './module/search';
import { StateModule } from './module/state';
import { HotPostsModule } from './module/hotPosts';
import { StateProvider } from './stateProvider';
import { HocOrderState } from '../../components/orderStateTip';
import style from './style.module.scss';

interface Props {
  qs?: Record<string, string>;
}

export const SnsAccountData: React.FC<Props> = HocOrderState(props => {
  const [showTip, setShowTip] = useLocalStorageState('SnsGlobalDataTip', { defaultValue: true });

  return (
    <PermissionCheckPage resourceLabel="SOCIAL_MEDIA" accessLabel="VIEW" menu="SOCIAL_MEDIA_DATA">
      <StateProvider>
        <div className={style.wrapper}>
          <div className={style.panel}>
            <SearchModule accoundId={props?.qs?.accountId} />
          </div>

          {showTip && (
            <div className={style.panel}>
              <div className={style.tips}>
                <Space>
                  <TipIcon />
                  <span>{getIn18Text('NANINKEZAICICHAKAN')}</span>
                </Space>

                <span className={style.close}>
                  <TongyongGuanbiXian size={20} onClick={() => setShowTip(false)} />
                </span>
              </div>
            </div>
          )}

          <div className={style.panel}>
            <StateModule />
          </div>

          <div className={style.panel}>
            <HotPostsModule />
          </div>
        </div>
      </StateProvider>
    </PermissionCheckPage>
  );
});
