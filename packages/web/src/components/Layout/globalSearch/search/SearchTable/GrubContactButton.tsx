import React, { useEffect, useState } from 'react';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { TTableColumn } from './index';
import { globalSearchDataTracker } from '../../tracker';
import style from './index.module.scss';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { getIn18Text } from 'api';
interface GrubContactButtonProps {
  record: TTableColumn;
  onDeepSearch(id: string): void;
  onGotoDetail(id: string, s: string): void;
  grubCount: number;
  from?: string;
}

const getGrubStatusText = (grubStatus: TTableColumn['grubStatus'], grubCount: number) => {
  let text = '';
  switch (grubStatus) {
    case 'GRUBBED':
      text = grubCount > 0 ? getIn18Text('CHAKANWAJUEJIEGUO') : getIn18Text('YIWAJUE');
      break;
    case 'GRUBBING':
      text = getIn18Text('WAJUEZHONG...');
      break;
    case 'NOT_GRUBBING':
      text = getIn18Text('SHENWALIANXIREN');
      break;
    case 'OFFLINE_GRUBBING':
      text = '离线深挖中';
      break;
    case 'OFFLINE_GRUBBED':
      text = grubCount > 0 ? getIn18Text('CHAKANWAJUEJIEGUO') : '离线深挖完成';
      break;
    default:
      text = getIn18Text('SHENWALIANXIREN');
      break;
  }
  return text;
};

const GrubContactButton: React.FC<GrubContactButtonProps> = ({ record, onDeepSearch, onGotoDetail, grubCount }) => {
  const { grubStatus: propsGrubStatus, id } = record;
  const [grubStatus, setGrubStatus] = useState<TTableColumn['grubStatus']>(propsGrubStatus);
  const handleDeepSearch = () => {
    setGrubStatus('GRUBBING');
    onDeepSearch(id);
  };
  useEffect(() => {
    setGrubStatus(propsGrubStatus);
  }, [propsGrubStatus]);
  const hasGrubResult = grubCount !== undefined && grubCount > 0;
  const spStyle: React.CSSProperties = hasGrubResult ? { fontSize: 12 } : {};
  return grubStatus === 'GRUBBING' ? (
    <Button btnType="minorLine" style={spStyle} className={style.grubButton}>
      {' '}
      <LoadingOutlined />{' '}
    </Button>
  ) : (
    <Button
      btnType="minorLine"
      style={spStyle}
      className={style.grubButton}
      onClick={() => {
        if (hasGrubResult) {
          onGotoDetail(id, 'contact');
        } else {
          globalSearchDataTracker.trackDeepSearchContact('result');
          handleDeepSearch();
        }
      }}
      disabled={(grubStatus !== 'NOT_GRUBBING' && !hasGrubResult) || grubStatus === 'OFFLINE_GRUBBING'}
    >
      {getGrubStatusText(grubStatus, grubCount)}
    </Button>
  );
};

export default GrubContactButton;
