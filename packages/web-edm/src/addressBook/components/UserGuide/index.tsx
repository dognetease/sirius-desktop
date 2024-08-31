import React, { useState, useRef } from 'react';
import './index.scss';
import { Button, Carousel } from 'antd';
import SlideItem from '@web-mail/components/CustomerMail/NewGuideForAside/SlideItem';
import SlideList from '@web-mail/components/CustomerMail/NewGuideForAside/SlideList';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';

interface CarouselItem {
  key: string;
  title: string;
  content: string;
  icon: React.FC;
  image: string;
}

export interface UserGuideProps {
  visible: boolean;
  carouseItems: CarouselItem[];
  onClose: () => void;
}

export const UserGuide = (props: UserGuideProps) => {
  const { visible, carouseItems = [], onClose } = props;

  const [carouselSelected, setCarouselSelected] = useState(0);
  const carouselRef = useRef<any>(null);

  const onSlideSelect = (index: number) => {
    if (carouselRef?.current) {
      carouselRef.current.goTo(index);
    }
  };

  const onCarouselSlide = (_from: number, to: number) => {
    setCarouselSelected(to);
  };

  return (
    <Modal className="address-guide-for-aside-wrapper" visible={visible} footer={null} width={'910px'} bodyStyle={{ padding: 0 }} onCancel={onClose}>
      <div className="new-guide-for-aside">
        <div className="new-guide-for-aside-left">
          <div className="ng-title">
            <span className="ng-title-text">{getIn18Text('YINGXIAOLIANXIREN')}</span>
          </div>
          <div className="ng-slide-container">
            <SlideList itemHeight={96} onSelect={onSlideSelect} trigger="hover" selected={carouselSelected}>
              {carouseItems.map(v => (
                <SlideItem {...v} />
              ))}
            </SlideList>
          </div>
          <div className="ng-btn-footer">
            <Button type="primary" onClick={onClose} className="ng-confirm-btn">
              {getTransText('LIJITIYAN')}
            </Button>
          </div>
        </div>
        <div className="new-guide-for-aside-right">
          <Carousel ref={carouselRef} dots={{ className: 'new-guide-carousel-dots' }} beforeChange={onCarouselSlide} speed={320}>
            {carouseItems.map(v => (
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
