import React from 'react';
import './index.scss';
export interface RenderTypeLinkProps {
  href?: string;
  style?: Object;
}

export const Link: React.FC<RenderTypeLinkProps> = props => {
  const { href, style } = props;

  return (
    <div
      style={{
        // margin: '20px 20px',
        // border: '1px solid gray',
        // borderRadius: '5px',
        padding: '0 15px 15px',
      }}
    >
      <a href={href} target="_blank" style={style}>
        {props.children}
      </a>
    </div>
  );
};
export default Link;
