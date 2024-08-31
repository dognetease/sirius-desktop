import React from 'react';
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/question.svg';
import style from './QuestionPopover.module.scss';
import { Popover } from 'antd';

interface ComsProps {
  className?: string;
  content: string;
  placement: 'topLeft' | 'topRight' | 'top' | 'bottomLeft' | 'bottomRight' | 'bottom';
}

interface ContentProps {
  content: string;
}
const ContentDom = (porps: ContentProps) => {
  const { content } = porps;
  return <div style={{ width: 336, borderRadius: 6, padding: 16, border: '0.5px solid rgba(38, 42, 51, 0.2)' }}>{content}</div>;
};

const QuestionPopover: React.FC<ComsProps> = ({ content, placement, className, children }) => {
  return (
    <div className={`${style.customerButton} ${className}`}>
      <Popover placement={placement} content={<ContentDom content={content} />} trigger="click">
        {children ? children : <QuestionIcon />}
      </Popover>
    </div>
  );
};
export default QuestionPopover;
