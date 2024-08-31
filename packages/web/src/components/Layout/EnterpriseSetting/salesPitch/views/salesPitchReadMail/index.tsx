import React from 'react';
import { Spin, Tooltip } from 'antd';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';

import { useAppDispatch } from '@web-common/state/createStore';
import { SalesPitchThunks } from '@web-common/state/reducer/salesPitchReducer/thunk';
import { goSalesPitchSetting } from '@/components/Layout/EnterpriseSetting/salesPitch/utils/util';
import style from './index.module.scss';
import SalesPitchSearch from '@/components/Layout/EnterpriseSetting/salesPitch/components/salesPitchSearch';
import useState2ReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import { SalesPitchScenes } from '@/components/Layout/EnterpriseSetting/salesPitch/types';
import SalesPitchStageTagList from '@/components/Layout/EnterpriseSetting/salesPitch/components/salesPitchStageTagList';
import SalesPitchListReadMail from '@/components/Layout/EnterpriseSetting/salesPitch/components/salesPitchListReadMail';
import useSalesPitchData from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useSalesPitchData';
import { getIn18Text } from 'api';

const SalesPitchReadMailPage: React.FC<{ scene?: SalesPitchScenes }> = ({ scene }) => {
  const dispatch = useAppDispatch();

  const [, setDrawerType] = useState2ReduxMock('drawerType');
  const [, setActiveScene] = useState2ReduxMock('activeScene');
  const [, setDrawerVisible] = useState2ReduxMock('drawerVisible');
  const [, setDrawerDataId] = useState2ReduxMock('drawerDataId');
  const [selectedStageTab] = useState2ReduxMock('selectedStageTab');

  const [isLoading] = useState2ReduxMock('isLoading');
  const [isFetchFailed] = useState2ReduxMock('isFetchFailed');

  const [searchInput] = useState2ReduxMock('searchInput');

  const [salesPitchDataMap] = useSalesPitchData();
  const sledPitchDataList = salesPitchDataMap[selectedStageTab].map(v => v.cardId);
  const hasData = sledPitchDataList.length > 0;

  // 点击新建话术
  const onCreate = () => {
    setActiveScene(scene || '');
    setDrawerType('ADD');
    setDrawerVisible(true);
    setDrawerDataId('');
  };

  const fetchData = () => {
    dispatch(SalesPitchThunks.fetchData({ queryKey: searchInput }));
  };

  return (
    <div className={style.salesPitchReadMailContainer}>
      <div className={style.salesPitchHeader}>
        <div className={style.salesPitchInputContainer}>
          <SalesPitchSearch style={{ width: 240 }} />
        </div>
        <Tooltip title={getIn18Text('GUANLIHUASHU')}>
          <div className={style.salesPitchSettingBtn} onClick={() => goSalesPitchSetting()} />
        </Tooltip>
        <Tooltip title={getIn18Text('XINJIANHUASHU')}>
          <div className={style.salesPitchCreateBtn} onClick={() => onCreate()} />
        </Tooltip>
      </div>
      <SalesPitchStageTagList />
      <div className={style.salesPitchContent}>
        {isLoading && (
          <div className={style.salesPitchListCommonContainer}>
            <Spin delay={500} tip="Loading..." indicator={<LoadingOutlined style={{ fontSize: 24, marginBottom: 12 }} spin />} />
          </div>
        )}
        {!isLoading && (
          <>
            <SalesPitchListReadMail idList={sledPitchDataList} />
            {isFetchFailed && (
              <div className={style.salesPitchNoDataContainer}>
                <div className={style.salesPitchError} />
                <div className={style.salesPitchNoDataText}>{getIn18Text('JIAZAISHIBAI')}</div>
                <div className={style.refreshText} onClick={() => fetchData()}>
                  {getIn18Text('SHUAXIN')}
                </div>
              </div>
            )}
            {!hasData && !isFetchFailed && (
              <div className={style.salesPitchNoDataContainer}>
                <div className={style.salesPitchNoDataBlock} />
                <span className={style.salesPitchNoDataText}>{getIn18Text('NEIRONGWEIKONG')}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SalesPitchReadMailPage;
