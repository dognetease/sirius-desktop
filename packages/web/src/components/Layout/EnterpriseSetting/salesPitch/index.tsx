import React, { useEffect } from 'react';
import { SalesPitchActions, useAppDispatch } from '@web-common/state/createStore';
import { SalesPitchThunks } from '@web-common/state/reducer/salesPitchReducer/thunk';
import SalesPitchHandleDrawer from '@/components/Layout/EnterpriseSetting/salesPitch/components/salesPitchHandleDrawer';
import SalesPitchSettingPage from '@/components/Layout/EnterpriseSetting/salesPitch/views/salesPitchSetting';
import SalesPitchReadMailPage from '@/components/Layout/EnterpriseSetting/salesPitch/views/salesPitchReadMail';
import { SalesPitchPageProps, SalesPitchScenes } from '@/components/Layout/EnterpriseSetting/salesPitch/types';
import { salesPitchManageTrack } from '@/components/Layout/EnterpriseSetting/salesPitch/utils/util';
import useState2ReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';

const SalesPitchPageSingleton: React.FC<SalesPitchPageProps> = props => {
  const { scene = 'settingBoard', refresh } = props;

  const [activeScene] = useState2ReduxMock('activeScene');

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(SalesPitchActions.doResetPage());
    dispatch(SalesPitchThunks.getSalesPitchConfig({}));
    dispatch(SalesPitchThunks.getSalesPitchData({}));
    salesPitchManageTrack({ opera: 'SHOW' });
  }, [refresh]);

  return (
    <div style={{ width: '100%', height: '100%' }} className="salesPitchPage">
      {scene === 'readMailAside' ? <SalesPitchReadMailPage scene={scene} /> : <SalesPitchSettingPage scene={scene} />}
      {scene === activeScene ? <SalesPitchHandleDrawer scene={scene} /> : null}
    </div>
  );
};

const SalesPitchPageHoc = (scene: SalesPitchScenes) => {
  // let Instance: React.ReactElement;

  const Comp: React.FC<{ refresh?: boolean }> = ({ refresh }) => {
    // if (!Instance) {
    //   Instance = <SalesPitchPageSingleton scene={scene} refresh={refresh} />;
    // }
    return <SalesPitchPageSingleton scene={scene} refresh={refresh} />;
  };
  return Comp;
};

export default SalesPitchPageHoc;
