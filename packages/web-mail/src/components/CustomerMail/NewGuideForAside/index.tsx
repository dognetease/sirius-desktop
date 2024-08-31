import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal, Button, Carousel } from 'antd';
import { apiHolder, DataStoreApi } from 'api';
import './index.scss';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';

import GlassIcon from '@web-mail/components/CustomerMail/NewGuideForAside/icons/GlassIcon';
import FileIcon from '@web-mail/components/CustomerMail/NewGuideForAside/icons/FileIcon';
import PcIcon from '@web-mail/components/CustomerMail/NewGuideForAside/icons/PcIcon';
import FlowIcon from '@web-mail/components/CustomerMail/NewGuideForAside/icons/FlowIcon';
import SlideItem from '@web-mail/components/CustomerMail/NewGuideForAside/SlideItem';
import SlideList from '@web-mail/components/CustomerMail/NewGuideForAside/SlideList';
import image1 from '@web-mail/components/CustomerMail/NewGuideForAside/Images/1.png';
import image2 from '@web-mail/components/CustomerMail/NewGuideForAside/Images/2.png';
import image3 from '@web-mail/components/CustomerMail/NewGuideForAside/Images/3.png';
import image4 from '@web-mail/components/CustomerMail/NewGuideForAside/Images/4.png';
import { setCurrentAccount } from '../../../util';
import { getIn18Text } from 'api';

const STORAGE_KEY = 'NEW_GUIDE_FOR_ASIDE';

const storeApi: DataStoreApi = apiHolder.api.getDataStoreApi();
const eventApi = apiHolder.api.getEventApi();

interface CarouselItem {
  key: string;
  title: string;
  content: string;
  icon: React.FC;
  image: string;
}

const CAROUSEL_CONTENTS: CarouselItem[] = [
  {
    key: '1',
    title: getIn18Text('YOUJIANKEHUSHUOMING1-1'),
    content: getIn18Text('YOUJIANKEHUSHUOMING1-2'),
    icon: GlassIcon,
    image: image1,
  },
  {
    key: '2',
    title: getIn18Text('YOUJIANKEHUSHUOMING2-1'),
    content: getIn18Text('YOUJIANKEHUSHUOMING2-2'),
    icon: FileIcon,
    image: image2,
  },
  {
    key: '3',
    title: getIn18Text('YOUJIANKEHUSHUOMING3-1'),
    content: getIn18Text('YOUJIANKEHUSHUOMING3-2'),
    icon: PcIcon,
    image: image3,
  },
  {
    key: '4',
    title: getIn18Text('YOUJIANKEHUSHUOMING4-1'),
    content: getIn18Text('YOUJIANKEHUSHUOMING4-2'),
    icon: FlowIcon,
    image: image4,
  },
];

const NewGuideForAside: React.FC<{ email: string }> = ({ email }) => {
  const [visible, setVisible] = useState2RM('newGuideForCustomerAside_cm');
  // const [mailEntities] = useState2RM('mailEntities');

  const [carouselSelected, setCarouselSelected] = useState(0);

  const carouselRef = useRef<any>(null);
  const hasShown = useRef(false);

  // const available = useMemo(() => {
  //   if (!process.env.BUILD_ISEDM) {
  //     return false;
  //   }
  //   if (!id) {
  //     return false;
  //   }
  //   const currentMail = mailEntities[id];
  //   if (!currentMail) {
  //     return false;
  //   }
  //   return true;
  // }, [id, mailEntities]);

  useEffect(() => {
    // setCurrentAccount();
    storeApi.get(STORAGE_KEY).then(({ suc, data }) => {
      const neverShown = !suc || data !== '1';
      if (!hasShown.current && neverShown && email) {
        hasShown.current = true;
        setVisible(true);
        storeApi.put(STORAGE_KEY, '1').then();
      }
    });
  }, [email]);

  const innerVisible = useMemo(() => {
    return visible && process.env.BUILD_ISEDM;
  }, [visible]);

  const onClose = () => {
    eventApi.sendSysEvent({
      eventName: 'mailMenuOper',
      eventData: {
        visible: false,
        email: '',
      },
      eventStrData: 'newGuideForAside',
    });
  };

  const onSlideSelect = (index: number) => {
    if (carouselRef?.current) {
      carouselRef.current.goTo(index);
    }
  };

  const onCarouselSlide = (_from: number, to: number) => {
    setCarouselSelected(to);
  };

  return (
    <Modal
      maskStyle={{ zIndex: 9999 }}
      wrapClassName="new-guide-for-aside-wrapper-mask"
      className="new-guide-for-aside-wrapper"
      visible={innerVisible}
      footer={null}
      width={'910px'}
      bodyStyle={{ padding: 0 }}
      onCancel={onClose}
    >
      <div className="new-guide-for-aside">
        <div className="new-guide-for-aside-left">
          <div className="ng-title">
            <span className="ng-title-text">
              {getIn18Text('YOUJIAN')}+{getIn18Text('KEHU')}
            </span>
            <span className="ng-title-label">{getIn18Text('YOUJIANKEHUSHUOMING5')}</span>
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

export default NewGuideForAside;
