// 个人勋章 view
import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import { Modal, Carousel } from 'antd';
import { PersonMedalDetailInfo } from 'api';
import styles from './index.module.scss';
import Header from './Header';
import PresentWord from './PresentWord';
import { ReactComponent as IconClose } from '@/images/icons/mail/icon-close2.svg';
import { ReactComponent as IconArrowLeft } from '@/images/icons/mail/arrow-left.svg';
import { ReactComponent as IconArrowRight } from '@/images/icons/mail/arrow-right.svg';
import PraiseMedalItem from '../PraiseMedal';
import { getIn18Text } from 'api';
interface Props {
  personMedalData: PersonMedalDetailInfo[];
  isModalVisible: boolean;
  from: string; // contact other
  toIndex?: number;
  praiseOwner?: boolean; // contact是否是自己
  handleCancel: () => void;
}
const PersonPraiseMedal: React.FC<Props> = props => {
  const { personMedalData, isModalVisible, from, toIndex = 0, handleCancel, praiseOwner = false } = props;
  const carousel = useRef<any>(null);
  // 切换currentIndex
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (carousel && toIndex) {
      setCurrentIndex(toIndex);
      switchIndex(toIndex);
    }
  }, []);
  const prev = () => {
    carousel.current.prev();
  };
  const next = () => {
    carousel.current.next();
  };
  const afterChange = (index: number) => {
    setCurrentIndex(index);
  };
  const switchIndex = (index: number) => {
    carousel.current.goTo(index);
  };
  // 勋章详情
  const medalContentLeft = () => {
    if (!personMedalData) return null;
    return (
      <div className={styles.medalContentLeft}>
        <Carousel ref={carousel} className={styles.carouselWrap} afterChange={afterChange}>
          {personMedalData.map((medalData: PersonMedalDetailInfo) => {
            return (
              <PraiseMedalItem
                key={medalData.id}
                {...{
                  medalData: medalData,
                  styles: {
                    medalWidth: 180,
                    medalHeight: 180,
                    containStyle: {
                      height: 426,
                    },
                  },
                  from,
                  praiseOwner,
                }}
              />
            );
          })}
        </Carousel>
        {/* 切换Carousel的imgList */}
        <div className={styles.switchWrap}>
          {currentIndex === 0 ? <IconArrowLeft /> : <IconArrowRight style={{ transform: 'rotate(180deg)' }} onClick={prev} />}
          <div className={styles.switchList}>
            <div
              style={{
                display: 'flex',
                transition: '0.5s',
                marginLeft: currentIndex - 3 > 0 ? -(currentIndex - 3) * (52 + 17) : 0,
              }}
            >
              {personMedalData.map((medalData: PersonMedalDetailInfo, index: number) => {
                return (
                  <div
                    className={classnames(styles.switchItem, { [styles.switchItemsChange]: index === currentIndex })}
                    key={medalData.id}
                    onClick={() => switchIndex(index)}
                  >
                    <img src={medalData.count > 0 ? medalData.imageUrl : medalData.grayImageUrl} alt="" />
                  </div>
                );
              })}
            </div>
          </div>
          {currentIndex === personMedalData.length - 1 ? <IconArrowLeft style={{ transform: 'rotate(180deg)' }} /> : <IconArrowRight onClick={next} />}
        </div>
      </div>
    );
  };
  const praiseLetterNone = () => {
    return (
      <div className={styles.praiseLetterNone}>
        <span>{getIn18Text('WEIHUODEGAIXUN')}</span>
      </div>
    );
  };
  // 颁奖词信息
  const medalContentRight = () => {
    const currentPraiseLetter = personMedalData[currentIndex].praiseLetters;
    return (
      <div className={styles.medalContentRight}>
        {currentPraiseLetter?.length
          ? currentPraiseLetter.map(praiseLetter => {
              return <PresentWord praiseLetter={praiseLetter} key={praiseLetter.id} />;
            })
          : praiseLetterNone()}
      </div>
    );
  };
  return (
    <Modal
      title={<Header />}
      wrapClassName={styles.personalMedal}
      width={716}
      bodyStyle={{ padding: 0 }}
      visible={isModalVisible}
      footer={null}
      centered
      closeIcon={<IconClose />}
      onCancel={handleCancel}
    >
      <div className={styles.medalContent}>
        {medalContentLeft()}
        {medalContentRight()}
      </div>
    </Modal>
  );
};
export default PersonPraiseMedal;
