import React from 'react';
import './index.scss';

interface Props {
  key: string;
  title: string;
  content: string;
  icon: React.FC;
}

const SlideItem: React.FC<Props> = ({ icon, title, content }) => {
  return (
    <div className="slide-item-container">
      <div className="slide-item-top">
        {icon({})}
        <span className="slide-item-title"> {title}</span>
      </div>
      <p className="slide-item-bottom">{content} </p>
    </div>
  );
};

export default SlideItem;
