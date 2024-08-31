import React from 'react';
import classnames, { Argument as ClassnamesType } from 'classnames';
import { OpportunityDetail } from 'api';
import { Empty } from 'antd';
import OpportunityCard from './opportunityCard';
import style from './opportunities.module.scss';

interface OpportunitiesProps {
  className?: ClassnamesType;
  list: OpportunityDetail[];
  mode: 'simple' | 'complete';
  readonly?: boolean;
  onEdit?: (opportunityId: string) => void;
}

const Opportunities: React.FC<OpportunitiesProps> = props => {
  const { className, list, mode, onEdit, readonly } = props;

  if (!(Array.isArray(list) && list.length)) {
    return <Empty className={style.empty} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  if (mode === 'simple') {
    return (
      <div className={classnames(style.simple, className)}>
        {list.map(item => (
          <OpportunityCard key={item.id} className={style.opportunityCard} data={item} mode={mode} readonly={readonly} onEdit={onEdit} />
        ))}
      </div>
    );
  }

  if (mode === 'complete') {
    return (
      <div className={classnames(style.complete, className)}>
        <div className={style.completeLayout}>
          {list.map(item => (
            <OpportunityCard key={item.id} className={style.opportunityCard} data={item} mode={mode} readonly={readonly} onEdit={onEdit} />
          ))}
        </div>
      </div>
    );
  }

  return null;
};

Opportunities.defaultProps = {
  list: [],
  mode: 'simple',
};

export default Opportunities;
