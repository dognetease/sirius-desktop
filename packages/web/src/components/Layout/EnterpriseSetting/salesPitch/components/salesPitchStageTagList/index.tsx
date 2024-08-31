import React from 'react';
import classNames from 'classnames';
import { SALES_PITCH_STAGE_CONFIG_LIST } from '@web-common/state/reducer/salesPitchReducer/config';
import useState2ReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import style from './index.module.scss';

const SalesPitchStageTagList = () => {
  const [selectedStageTab, setSelectedStageTab] = useState2ReduxMock('selectedStageTab');

  return (
    <div className={style.salesPitchStageTagList}>
      {SALES_PITCH_STAGE_CONFIG_LIST.map(v => (
        <div key={v.id} className={classNames(style.salesPitchStageTag, selectedStageTab === v.id ? style.checked : '')} onClick={() => setSelectedStageTab(v.id)}>
          {v.name}
        </div>
      ))}
    </div>
  );
};

export default SalesPitchStageTagList;
