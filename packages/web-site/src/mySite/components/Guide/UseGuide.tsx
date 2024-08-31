import React, { useState, useRef } from 'react';
import { Button, Carousel } from 'antd';
import SlideItem from '@web-mail/components/CustomerMail/NewGuideForAside/SlideItem';
import SlideList from '@web-mail/components/CustomerMail/NewGuideForAside/SlideList';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import './UserGuide.scss';
import { getIn18Text } from 'api';

interface CarouselItem {
  key: string;
  title: string;
  content: string;
  icon: React.FC;
  image: string;
  left: number; // 轮播图位置调整
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
    <Modal className="site-guide-wrapper" visible={visible} footer={null} width={'910px'} bodyStyle={{ padding: 0 }} onCancel={onClose}>
      <div className="new-guide-for-aside">
        <div className="new-guide-for-aside-left">
          <div className="ng-title">
            <span className="ng-title-text">外贸通建站</span>
            <span className="ng-title-label">5分钟快速建站</span>
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
              {getIn18Text('LIJITIYAN')}
            </Button>
          </div>
        </div>
        <div className="new-guide-for-aside-right">
          <Carousel ref={carouselRef} dots={{ className: 'new-guide-carousel-dots' }} beforeChange={onCarouselSlide} speed={320}>
            {carouseItems.map((v, index) => (
              <div className="new-guide-carousel-img-container" key={v.key}>
                <img className="new-guide-carousel-img" src={v.image} alt="" style={{ marginLeft: v.left + 'px' }} />
              </div>
            ))}
          </Carousel>
        </div>
      </div>
    </Modal>
  );
};
