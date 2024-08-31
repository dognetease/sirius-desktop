import { getIn18Text } from 'api';
import * as React from 'react';
import {} from 'react';
import { SnsMarketingPlatform } from 'api';
import PlatformLogo from '../../components/PlatformLogo';
import { Button } from 'antd';
import style from './BindingEntry.module.scss';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';

interface BindingEntryProps {
  platforms: {
    platform: SnsMarketingPlatform;
    name: string;
  }[];
  fetchingPlatform: SnsMarketingPlatform | null;
  onBindStart: (platform: SnsMarketingPlatform) => void;
}

const BindingEntry: React.FC<BindingEntryProps> = props => {
  const { platforms, fetchingPlatform, onBindStart } = props;

  return (
    <div className={style.bindingEntry}>
      {platforms.map(item => {
        const loading = fetchingPlatform === item.platform;

        return (
          <div className={style.item}>
            <PlatformLogo className={style.logo} platform={item.platform} type="origin" size={50} />
            <div className={style.name}>{item.name}</div>
            <PrivilegeCheck resourceLabel="SOCIAL_MEDIA" accessLabel="OP">
              <Button className={style.option} type="primary" loading={loading} onClick={() => onBindStart(item.platform)}>
                {getIn18Text('QUSHOUQUAN')}
              </Button>
            </PrivilegeCheck>
          </div>
        );
      })}
    </div>
  );
};

export default BindingEntry;
