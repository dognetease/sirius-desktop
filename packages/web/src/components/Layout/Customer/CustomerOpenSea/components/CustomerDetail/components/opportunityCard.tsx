import React, { useState, useRef } from 'react';
import classnames from 'classnames';
import { OpportunityDetail } from 'api';
import InfoLayout from '@/components/Layout/Customer/components/infoLayout/infoLayout';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import useEventListener from '@web-common/hooks/useEventListener';
import style from './opportunityCard.module.scss';

interface OpportunityCardProps {
  className?: string;
  data: OpportunityDetail;
  mode?: 'simple' | 'complete';
  readonly?: boolean;
  onEdit?: (contactId: string) => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = props => {
  const { className, data, mode, onEdit, readonly } = props;

  const [scrollTop, setScrollTop] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const onBodyScroll = event => setScrollTop(event.target.scrollTop);

  useEventListener('scroll', onBodyScroll, bodyRef.current);

  const list = [
    {
      key: 'number',
      label: '商机编号',
      content: data.number,
    },
    {
      key: 'manager_list',
      label: '负责人',
      content: data?.manager_list?.map(item => item.name || '-').join('，'),
    },
    {
      key: 'company_name',
      label: '关联客户',
      content: data.company_name,
    },
    {
      key: 'currency',
      label: '币种',
      content: data.currency_name,
    },
    {
      key: 'contacts',
      label: '关联联系人',
      content: InfoLayout.renderList(data.contact_name_list),
    },
    {
      key: 'source',
      label: '商机来源',
      content: data.source_name,
    },
    {
      key: 'product',
      label: '需求产品',
      content: data.product,
    },
    {
      key: 'estimate',
      label: '预估商机金额',
      content: () => {
        const value = data.estimate !== null ? Number(data.estimate).toLocaleString() : '';

        return data.currency_code ? `${data.currency_code} ${value}` : value;
      },
    },
    {
      key: 'stage_name',
      label: '销售阶段',
      content: data.stage_name,
    },
    {
      key: 'turnover',
      label: '成交金额',
      content: () => {
        const value = data.turnover !== null ? Number(data.turnover).toLocaleString() : '';

        return data.currency_code ? `${data.currency_code} ${value}` : value;
      },
    },
    {
      key: 'deal_at',
      label: '成交日期',
      content: data.deal_at,
    },
  ];

  return (
    <div className={classnames([style.opportunityCard, className])}>
      {mode === 'simple' && (
        <div className={style.simple}>
          <div className={style.icon} />
          <EllipsisTooltip className={style.name}>{data.name}</EllipsisTooltip>
          <div className={style.edit} onClick={() => onEdit && onEdit(data.id)} />
        </div>
      )}
      {mode === 'complete' && (
        <div className={style.complete}>
          <div className={classnames([style.header], { [style.shadow]: scrollTop > 0 })}>
            <div className={style.icon} />
            <EllipsisTooltip className={style.name}>{data.name}</EllipsisTooltip>
            {!readonly && <div className={style.edit} onClick={() => onEdit && onEdit(data.id)} />}
          </div>
          <div className={style.body} ref={bodyRef}>
            <InfoLayout list={list} itemWidth={376} itemMarginRight={36} itemMarginBottom={12} />
          </div>
        </div>
      )}
    </div>
  );
};

OpportunityCard.defaultProps = {
  data: {} as OpportunityDetail,
  mode: 'simple',
};

export default OpportunityCard;
