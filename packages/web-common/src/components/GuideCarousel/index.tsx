import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal, Button, Carousel } from 'antd';
import './index.scss';
import SlideItem from './SlideItem';
import SlideList from './SlideList';
import { NotificationProps } from '@web-common/state/reducer/notificationReducer';

import { getIn18Text } from 'api';

interface GuideCarouselProps {
  config: NotificationProps['config'];
  onClose: () => void;
}

const GuideCarousel: React.FC<GuideCarouselProps> = props => {
  const [carouselSelected, setCarouselSelected] = useState(0);

  const carouselRef = useRef<any>(null);

  const CAROUSEL_CONTENTS = props.config?.list || [];

  const onClose = () => {
    props.onClose();
  };

  const onSlideSelect = (index: number) => {
    if (carouselRef?.current) {
      carouselRef.current.goTo(index);
    }
  };

  const onCarouselSlide = (_from: number, to: number) => {
    setCarouselSelected(to);
  };
  if (!props.config) {
    return null;
  }

  return (
    <Modal
      maskStyle={{ zIndex: 9999, left: 0 }}
      wrapClassName="new-guide-for-aside-wrapper-mask"
      className="new-guide-for-aside-wrapper"
      visible={true}
      footer={null}
      width={'910px'}
      centered
      maskClosable={false}
      bodyStyle={{ padding: 0 }}
      onCancel={onClose}
    >
      <div className="new-guide-for-aside">
        <div className="new-guide-for-aside-left">
          <div className="ng-title">
            <span className="ng-title-text">{props.config.title}</span>
            <span className="ng-title-label">{props.config.label}</span>
          </div>
          <div className="ng-slide-container">
            <SlideList itemHeight={96} onSelect={onSlideSelect} trigger="hover" selected={carouselSelected}>
              {CAROUSEL_CONTENTS.map(v => (
                <SlideItem {...v} />
              ))}
            </SlideList>
          </div>
          <div className="ng-btn-footer">
            <Button type="primary" onClick={onClose} className="ng-confirm-btn">
              {getIn18Text('LIJITIYAN')}
            </Button>
          </div>
        </div>
        <div className="new-guide-for-aside-right">
          <Carousel ref={carouselRef} dots={{ className: 'new-guide-carousel-dots' }} beforeChange={onCarouselSlide} speed={320}>
            {CAROUSEL_CONTENTS.map(v => (
              <div className="new-guide-carousel-img-container" key={v.key}>
                <img className="new-guide-carousel-img" src={v.image} alt="" />
              </div>
            ))}
          </Carousel>
        </div>
      </div>
    </Modal>
  );
};

export default GuideCarousel;
