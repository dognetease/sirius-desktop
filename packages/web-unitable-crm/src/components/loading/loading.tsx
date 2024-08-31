import React from 'react';
// import cn from 'classNamenames';
import './loading.scss';
export const Loading = () => {
  return (
    <div className="uni-loading">
      <div className="uni-loading-left uni-loading-bg">
        <svg width="180" height="264" viewBox="0 0 208 264" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect y="40" width="208" height="24" rx="4" fill="#F4F6F7" />
          <rect y="80" width="208" height="24" rx="4" fill="#F4F6F7" />
          <rect y="120" width="208" height="24" rx="4" fill="#F4F6F7" />
          <rect y="160" width="208" height="24" rx="4" fill="#F4F6F7" />
          <rect y="200" width="208" height="24" rx="4" fill="#F4F6F7" />
          <rect y="220" width="208" height="24" rx="4" fill="#F4F6F7" />
          <rect width="110" height="24" rx="4" fill="#F4F6F7" />
          <rect x="176" width="32" height="24" rx="4" fill="#F4F6F7" />
        </svg>
      </div>
      <div className="uni-loading-right">
        <div className="uni-loading-right-row uni-loading-bg">
          <div className="flex-space-between" style={{ display: 'flex' }}>
            <div className="uni-loading-placement" style={{ width: '196px' }}></div>
            <div className="uni-loading-placement" style={{ width: '77px' }}></div>
          </div>
          <div className="uni-loading-placement loaindg-mt-13" style={{ width: '100%' }}></div>
        </div>

        <div className="uni-loading-content uni-loading-tip-wrap">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              opacity="0.27"
              d="M17.4071 9.99982C17.4071 5.90882 14.0907 2.59241 9.99969 2.59241C5.90869 2.59241 2.59228 5.90882 2.59228 9.99982C2.59229 14.0908 5.90869 17.4072 9.99969 17.4072C14.0907 17.4072 17.4071 14.0908 17.4071 9.99982Z"
              stroke="#386EE7"
              stroke-width="2.5"
            />
            <path
              d="M2.59277 10.0005C2.59277 5.90949 5.90918 2.59308 10.0002 2.59308C12.4942 2.59308 14.7003 3.82561 16.0426 5.71477"
              stroke="#386EE7"
              stroke-width="2.5"
              stroke-linecap="round"
            >
              <animateTransform attributeName="transform" begin="0s" dur="1s" type="rotate" from="0 10 10" to="360 10 10" repeatCount="indefinite"></animateTransform>
            </path>
          </svg>
          <span>数据加载中...</span>
        </div>
      </div>
    </div>
  );
};
