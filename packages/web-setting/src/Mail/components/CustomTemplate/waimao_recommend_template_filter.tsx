import React from 'react';
import classnames from 'classnames';
import { WaimaoRecommendTemplateTag, WaimaoRecommendTemplateOrder } from 'api';
import style from './waimao_recommend_template_filter.module.scss';

interface WaimaoRecommendTemplateFilterProps {
  tags: WaimaoRecommendTemplateTag[];
  tagId: number | undefined;
  orders: WaimaoRecommendTemplateOrder[];
  orderKey: string;
  onTagChange: (tagId: number | undefined) => void;
  onOrderChange: (orderKey: string) => void;
}

const WaimaoRecommendTemplateFilter: React.FC<WaimaoRecommendTemplateFilterProps> = props => {
  const { tags, tagId, orders, orderKey, onTagChange, onOrderChange } = props;

  return (
    <div className={style.waimaoRecommendTemplateFilter}>
      <div className={style.row}>
        <div className={style.label}>分组</div>
        <div className={style.content}>
          {tags.map(tag => (
            <div
              className={classnames(style.contentItem, {
                [style.contentItemActive]: tag.tagId === tagId,
              })}
              key={tag.tagId}
              onClick={() => tag.tagId !== tagId && onTagChange(tag.tagId)}
            >
              {tag.tagName}
            </div>
          ))}
        </div>
      </div>
      {/* <div className={style.row}>
        <div className={style.label}>排序</div>
        <div className={style.content}>
          {orders.map(order => (
            <div
              className={classnames(style.contentItem, {
                [style.contentItemActive]: order.orderKey === orderKey,
              })}
              key={order.orderKey}
              onClick={() => order.orderKey !== orderKey && onOrderChange(order.orderKey)}
            >
              {order.orderName}
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
};

export default WaimaoRecommendTemplateFilter;
