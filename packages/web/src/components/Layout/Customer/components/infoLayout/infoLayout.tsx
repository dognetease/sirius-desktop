import React from 'react';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import Label from '../label/label';
import style from './infoLayout.module.scss';
import { ReactComponent as CountryIcon } from '@/images/icons/edm/country.svg';
import { apiHolder, apis, EdmCustomsApi } from 'api';
import { Popover } from 'antd';
import { getIn18Text } from 'api';
const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
export interface InfoLayoutItem {
  key: string;
  label: string;
  className?: string;
  content: React.ReactNode | (() => React.ReactNode);
  canJump?: boolean;
}
interface InfoLayoutProps {
  list: InfoLayoutItem[];
  itemWidth?: number | string;
  itemMarginRight?: number;
  itemMarginBottom?: number;
  itemPlaceholder?: React.ReactNode;
}
interface InfoLayoutTypes extends React.FC<InfoLayoutProps> {
  renderStar: (count: number) => React.ReactNode;
  renderCountry: (country: string, fromate: boolean) => React.ReactNode;
  renderImage: (images: string[]) => React.ReactNode;
  renderList: (list: React.ReactNode) => React.ReactNode;
  renderLabels: (item: any[]) => React.ReactNode;
  renderSocialMedeia: (
    item: {
      type: string;
      number: string;
      name: string;
    }[]
  ) => React.ReactNode;
}
const checkContentEmpty = (content: any) => [undefined, null, ''].includes(content);
const InfoLayout: InfoLayoutTypes = props => {
  const { list, itemWidth, itemMarginRight, itemMarginBottom, itemPlaceholder } = props;
  return (
    <div
      className={style.infoLayout}
      style={{
        marginRight: `-${itemMarginRight}px`,
        marginBottom: `-${itemMarginBottom}px`,
      }}
    >
      {list.map(item => {
        const content = typeof item.content === 'function' ? item.content() : item.content;
        return (
          <div
            className={style.item}
            key={item.key}
            style={{
              width: itemWidth,
              marginRight: itemMarginRight,
              marginBottom: itemMarginBottom,
            }}
          >
            <div className={`${style.label} ${item.className}`}>{item.label}</div>
            <div className={style.content}>
              {checkContentEmpty(content) ? itemPlaceholder : item.canJump ? <a onClick={() => edmCustomsApi.openThirdUrl(content)}>{content}</a> : content}
            </div>
          </div>
        );
      })}
    </div>
  );
};
InfoLayout.defaultProps = {
  list: [],
  itemWidth: 376,
  itemMarginRight: 30,
  itemMarginBottom: 12,
  itemPlaceholder: '-',
};
// 展示国家
const PopoverCountry = () => {
  return (
    <Popover
      placement="bottomLeft"
      content={<span style={{ padding: '15px', display: 'inline-block' }}>{getIn18Text('GUOJIADEQUZIDUANGESHIBUBIAOZHUN\uFF0CKEZHONGXINBIANJI')}</span>}
      trigger="hover"
    >
      <div style={{ paddingLeft: 5, color: '#FFAA00', cursor: 'pointer', height: 16, display: 'inline-block', verticalAlign: 'middle' }}>
        <CountryIcon style={{ display: 'block' }} />
      </div>
    </Popover>
  );
};
InfoLayout.renderCountry = (country: string, fromate: boolean) => {
  if (fromate) {
    return country;
  }
  return (
    <>
      {country} <PopoverCountry />
    </>
  );
};
InfoLayout.renderStar = count => {
  if (typeof count === 'number' && count > 0) {
    return (
      <div className={style.star}>
        {Array.from({ length: count }).map((item, index) => (
          <div className={style.starItem} key={index} />
        ))}
      </div>
    );
  }
  return null;
};
InfoLayout.renderImage = images => {
  if (Array.isArray(images) && images.length) {
    const previewData = images.map(src => ({
      previewUrl: src,
      downloadUrl: src,
      OriginUrl: src,
      name: `${src}-${Date.now()}`,
      size: 480,
    }));
    return (
      <div className={style.image}>
        {images.map((src, index) => (
          <div
            className={style.imageItem}
            key={index}
            style={{ backgroundImage: `url(${src})` }}
            onClick={() => ImgPreview.preview({ data: previewData, startIndex: 0 })}
          />
        ))}
      </div>
    );
  }
  return null;
};
InfoLayout.renderList = list => {
  if (Array.isArray(list) && list.length) {
    return (
      <div className={style.list}>
        {list.map((item, index) => (
          <div className={style.listItem} key={index}>
            {item}
          </div>
        ))}
      </div>
    );
  }
  return null;
};
InfoLayout.renderSocialMedeia = list => {
  if (Array.isArray(list) && list.length) {
    return (
      <div className={style.list}>
        {list.map((item, index) => (
          <div className={style.listItem} key={index}>
            {`${item.name}: ${item.number || '-'}`}
          </div>
        ))}
      </div>
    );
  }
  return null;
};
InfoLayout.renderLabels = labels => {
  if (Array.isArray(labels) && labels.length) {
    return (
      <div className={style.labels}>
        {labels.map(item => (
          <Label className={style.labelItem} key={item.label_id} color={item.label_color} name={item.label_name} />
        ))}
      </div>
    );
  }
  return null;
};
export default InfoLayout;
