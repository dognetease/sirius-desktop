// 17版本智能模式下线后，此文件无引用，观察一个版本后，可以删除
import React, { useMemo } from 'react';
import { getIn18Text } from 'api';
export interface FolderNameProps {
  showAIName?: boolean;
  mailBoxName: string;
}

const FolderName: React.FC<FolderNameProps> = props => {
  const { showAIName, mailBoxName } = props;
  const nameEl = useMemo(
    () => (
      <span className="u-foldername">
        {showAIName ? getIn18Text('ZHINENG') : ''}
        {mailBoxName}
      </span>
    ),
    [showAIName, mailBoxName]
  );
  return <>{nameEl}</>;
};

export default FolderName;
