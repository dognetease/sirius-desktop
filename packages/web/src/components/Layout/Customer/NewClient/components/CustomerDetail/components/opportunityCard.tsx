import React, { useState, useRef } from 'react';
import classnames from 'classnames';
import { OpportunityDetail } from 'api';
import InfoLayout from '@/components/Layout/Customer/components/infoLayout/infoLayout';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import useEventListener from '@web-common/hooks/useEventListener';
import style from './opportunityCard.module.scss';
import { getIn18Text } from 'api';
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
      label: getIn18Text('SHANGJIBIANHAO'),
      content: data.number,
    },
    {
      key: 'manager_list',
      label: getIn18Text('FUZEREN'),
      content: data?.manager_list?.map(item => item.name || '-').join('，'),
    },
    {
      key: 'company_name',
      label: getIn18Text('GUANLIANKEHU'),
      content: data.company_name,
    },
    {
      key: 'currency',
      label: getIn18Text('BIZHONG'),
      content: data.currency_name,
    },
    {
      key: 'contacts',
      label: getIn18Text('GUANLIANLIANXIREN'),
      content: InfoLayout.renderList(data.contact_name_list),
    },
    {
      key: 'source',
      label: getIn18Text('SHANGJILAIYUAN'),
      content: data.source_name,
    },
    {
      key: 'product',
      label: getIn18Text('XUQIUCHANPIN'),
      content: data.product,
    },
    {
      key: 'estimate',
      label: getIn18Text('YUGUSHANGJIJINE'),
      content: () => {
        const value = data.estimate !== null ? Number(data.estimate).toLocaleString() : '';
        return data.currency_code ? `${data.currency_code} ${value}` : value;
      },
    },
    {
      key: 'stage_name',
      label: getIn18Text('XIAOSHOUJIEDUAN'),
      content: data.stage_name,
    },
    {
      key: 'turnover',
      label: getIn18Text('CHENGJIAOJINE'),
      content: () => {
        const value = data.turnover !== null ? Number(data.turnover).toLocaleString() : '';
        return data.currency_code ? `${data.currency_code} ${value}` : value;
      },
    },
    {
      key: 'deal_at',
      label: getIn18Text('CHENGJIAORIQI'),
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
