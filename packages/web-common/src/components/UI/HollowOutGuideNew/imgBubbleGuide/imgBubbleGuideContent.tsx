import React from 'react';
import ImgBubbleFooter from './imgBubbleFooter';
import styles from './imgBubbleGuide.module.scss';

export interface ImgBubbleGuideContentProps {
  guideId: string;
  step?: number;
  onStep: number;
  okText?: string;
  title: React.ReactNode;
  intro?: string | JSX.Element;
  renderFooter?: JSX.Element;
  contentImg?: string;
  onClose?: () => void;
}
const ImgBubbleGuideContent: React.FC<ImgBubbleGuideContentProps> = props => {
  const { title, intro = '', renderFooter, guideId, step, onStep, okText, contentImg, onClose } = props;
  return (
    <div className={styles.guideBobble}>
      {contentImg && <p className={styles.contentImg} style={{ backgroundImage: `url(${contentImg})` }}></p>}
      <p className={styles.title}>{title}</p>
      {typeof intro === 'string' ? (
        <p className={styles.intro} hidden={!intro}>
          {intro}
        </p>
      ) : (
        intro
      )}
      {renderFooter ? renderFooter : <ImgBubbleFooter {...{ guideId, step, onStep, okText, onClose }} />}
    </div>
  );
};

export default ImgBubbleGuideContent;
