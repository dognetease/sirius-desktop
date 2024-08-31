import React from 'react';
import AiSearchPicture from '@/images/icons/whatsApp/ai-search-picture.png';
import { getTransText } from '@/components/util/translate';
import style from './emptyContent.module.scss';

interface EmptyConentProps {
  height?: string | number;
}

const EmptyConent: React.FC<EmptyConentProps> = props => {
  const { height } = props;

  return (
    <div className={style.emptyContent} style={{ height }}>
      <div className={style.content}>
        <div className={style.paragraph}>
          <div className={style.h1} style={{ marginBottom: 22 }}>
            {getTransText('EngineSearching') || ''}
          </div>
          <div className={style.h2} style={{ marginBottom: 8 }}>
            {getTransText('WhatIsEngineSearching') || ''}
          </div>
          <div className={style.text} style={{ marginBottom: 24 }}>
            {getTransText('CollectFromMainstreamPlatforms') || ''}
          </div>
          <div className={style.h2} style={{ marginBottom: 14 }}>
            {getTransText('WhatCanEngineSearchingDo') || ''}
          </div>
          <div className={style.h3} style={{ marginBottom: 4 }}>
            {getTransText('RootedInGlobalSocialPlatforms') || ''}
          </div>
          <div className={style.text} style={{ marginBottom: 14 }}>
            {getTransText('CoveringNetworkData') || ''}
          </div>
          <div className={style.h3} style={{ marginBottom: 4 }}>
            {getTransText('CollectPotentialCustomerInformation') || ''}
          </div>
          <div className={style.text}>{getTransText('EfficiencyGreatlyImproved') || ''}</div>
        </div>
        <img className={style.picture} src={AiSearchPicture} />
      </div>
    </div>
  );
};

export default EmptyConent;
