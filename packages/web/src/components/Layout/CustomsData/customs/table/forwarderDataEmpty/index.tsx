import { Empty } from 'antd';
import React from 'react';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { ImageEmptyNormal } from '@/components/Layout/globalSearch/search/EmptyResult/EmptyImge';
import styles from './index.module.scss';

interface ForwarderDataEmptyProps {
  onSearch?: () => void;
}

const ForwarderDataEmpty: React.FC<ForwarderDataEmptyProps> = ({ onSearch }) => {
  const searchSimilarity = () => {
    onSearch?.();
  };

  const getDesc = () => {
    const desc: React.ReactNode = (
      <div className={styles.tips}>
        <div>因出发地、目的地国家法律法规原因，未公开披露海关数据，无法找到目标企业</div>
        <div className={styles.desc}>可尝试通过以越南、印度等相似产业链国家作为出发港，寻找潜在客户</div>
      </div>
    );
    const resultOp: React.ReactNode = (
      <div className={styles.group}>
        <Button style={{ border: '1px solid #E1E3E8' }} btnType="minorWhite" onClick={searchSimilarity}>
          搜相似出发港
        </Button>
      </div>
    );
    return {
      desc,
      resultOp,
    };
  };
  const { desc, resultOp } = getDesc();
  return (
    <Empty className={styles.empty} description={desc} image={<ImageEmptyNormal />}>
      {resultOp}
    </Empty>
  );
};

export default ForwarderDataEmpty;
