import { getIn18Text } from 'api';
import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { Popover } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import { Switch } from '@web-common/components/UI/Switch';
import Switch from '@lingxi-common-component/sirius-ui/Switch';
// import Tooltip from '@web-common/components/UI/Tooltip';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import { apis, apiHolder, AddressBookApi, AddressBookSyncType } from 'api';
import { ReactComponent as SyncSettingIcon } from '@/images/icons/edm/addressBook/sync-setting.svg';
import { ReactComponent as SyncTipIcon } from '@/images/icons/edm/addressBook/sync-tip.svg';
import { ReactComponent as SyncInfoIcon } from '@/images/icons/edm/addressBook/sync-info.svg';
import style from './useSyncConfig.module.scss';

const storeKey = 'address-book-crm-sync-guide';
const storeApi = apiHolder.api.getDataStoreApi();
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;

type UseSyncConfig = (props: { entryClassName?: string; tipClassName?: string; successContent?: string }) => {
  syncEntry: React.ReactElement;
  syncTip: React.ReactElement | null;
};

const useSyncConfig: UseSyncConfig = props => {
  const { entryClassName, tipClassName } = props;

  const [guideVisible, setGuideVisible] = useState<boolean>(false);
  const [configVisible, setConfigVisible] = useState<boolean>(false);

  const [isSync, setIsSync] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    const nextGuideVisible = !storeApi.getSync(storeKey).data;

    setGuideVisible(nextGuideVisible);
  }, []);

  useEffect(() => {
    addressBookApi.getAddressSyncConfigList().then(configList => {
      const item = configList.find(item => item.type === AddressBookSyncType.CRM);

      if (item) {
        setIsSync(item.status);
      }
    });
  }, []);

  const handleGuideOk = () => {
    storeApi.putSync(storeKey, '1');
    setGuideVisible(false);
  };

  const handleSyncChange = (checked: boolean) => {
    setUpdating(true);

    addressBookApi
      .updateAddressSyncConfig({
        type: AddressBookSyncType.CRM,
        status: checked,
      })
      .then(() => {
        setIsSync(checked);
      })
      .finally(() => {
        setUpdating(false);
      });
  };

  const syncTip = isSync ? (
    <Tooltip title={getIn18Text('YIKAIQIZIDONGTONGBU')}>
      <div className={classnames(style.syncTip, tipClassName)}>
        <SyncTipIcon className={style.icon} />
        <span className={style.text}>{getIn18Text('YIKAIQIZIDONGTONGBU')}</span>
      </div>
    </Tooltip>
  ) : null;

  const syncEntry = (
    <Popover
      overlayClassName={style.guidePopover}
      getPopupContainer={node => node.parentElement || document.body}
      placement="bottomRight"
      visible={guideVisible}
      title={getIn18Text('SHUJUZIDONGTONGBULA')}
      content={
        <div className={style.guideContent}>
          <div className={style.guideBody}>{getIn18Text('KAIQIZIDONGTONGBUHOU')}</div>
          <div className={style.guideFooter}>
            <Button btnType="primary" onClick={handleGuideOk}>
              {getIn18Text('ZHIDAOLE')}
            </Button>
          </div>
        </div>
      }
    >
      <Popover
        overlayClassName={style.configPopover}
        getPopupContainer={node => node.parentElement || document.body}
        placement="bottomRight"
        visible={!guideVisible && configVisible}
        onVisibleChange={nextVisible => setConfigVisible(nextVisible)}
        trigger={['click']}
        title={getIn18Text('ZIDONGTONGBUSHEZHI')}
        content={
          <div className={style.configContent}>
            <div className={style.configBody}>{getIn18Text('KAIQIHOUXUANZHONGMOKUAI')}</div>
            <div className={style.configFooter}>
              <span className={style.text}>{getIn18Text('ZIDONGTONGBUXIANSUOHE')}</span>
              <Tooltip title={getIn18Text('KAIQIZIDONGTONGBUSHE')}>
                <SyncInfoIcon className={style.icon} />
              </Tooltip>
              <Switch checked={isSync} loading={updating} onChange={handleSyncChange} />
            </div>
          </div>
        }
      >
        <Tooltip title={isSync ? getIn18Text('YIKAIQITONGBULIANXI') : getIn18Text('QUKAIQITONGBULIANXI')}>
          <div className={classnames(style.syncEntry, entryClassName)}>
            <SyncSettingIcon className={style.icon} />
            <span className={style.text}>{getIn18Text('ZIDONGTONGBUSHEZHI')}</span>
          </div>
        </Tooltip>
      </Popover>
    </Popover>
  );

  return { syncEntry, syncTip };
};

export default useSyncConfig;
