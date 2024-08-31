import React, { useEffect, useState } from 'react';
import style from './subscribe.module.scss';
// import { Tabs } from '@web-common/components/UI/Tabs';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
// import Tabs from '@/components/Layout/Customer/components/UI/Tabs/tabs';
const { TabPane } = Tabs;

const buttonHtml = (title: string, type: number, lan: 'zh' | 'en') => {
  if (type === 1) {
    // 因为圆角 + 渐变实现方案的问题, 所以边框占了2px, 所以设置的width是66, 展示是68.高度同理
    return `<div style="
    display: flex; 
    pointer-events: none; 
    -webkit-user-modify: read-only;
    align-items: center;
    justify-content: center;
    gap: 2px;
    width: ${lan == 'zh' ? '66px' : '110px'};
    height: 26px;
    border: none;
    background-image: linear-gradient(#fff, #fff), linear-gradient(to bottom right, #f7ad6b, #f96d7c);
    padding: 1px;
    border-radius: 4px;
    background-clip: content-box, padding-box;
 ">
    <div style="width: 16px; height: 16px;">
      <img style="vertical-align: baseline; max-width: 16px; max-height: 16px" src="data:image/png;base64,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" />
    </div>
    <div style="font-size: 12px; line-height: 16px; color: #FE6C5E;">
        ${title}
    </div>
</div>`;
  }
  if (type === 2) {
    return `<div
    style="pointer-events: none; -webkit-user-modify: read-only; width: ${lan == 'zh' ? '68px' : '112px'}; height: 28px; 
    background:linear-gradient(92deg, #f96d7c 2.62%, #f8b972 98.12%); 
    display: table-cell; 
    text-align: center;
    vertical-align: middle;
    border-radius: 4px; 
    justify-content: center;
    font-weight: 500; 
    font-size: 12px;
    line-height: 20px;
    color: #fff;
    ">${title}</div>
    `;
  }
  if (type === 3) {
    return `<div
    style="pointer-events: none; -webkit-user-modify: read-only; width: ${lan == 'zh' ? '68px' : '112px'}; height: 28px; 
    background:linear-gradient(92deg, #70b6fe 2.62%, #ac93fe 98.12%);
    display: table-cell; 
    text-align: center;
    vertical-align: middle;
    border-radius: 4px; 
    justify-content: center;
    font-weight: 500; 
    font-size: 12px;
    line-height: 20px;
    color: #fff;
    ">${title}</div>
    `;
  }
  return '';
};

export interface Props {
  onClickButton?: (content: string) => void;
}
export const SubscribeEntry = (props: Props) => {
  const { onClickButton } = props;

  useEffect(() => {}, []);

  const [lan, setLan] = useState<'zh' | 'en'>('zh');

  const TabComp = () => {
    return (
      <Tabs
        defaultActiveKey="1"
        onChange={value => {
          if (value === '1') {
            setLan('zh');
          }
          if (value === '2') {
            setLan('en');
          }
        }}
      >
        <TabPane tab={'中文'} key={'1'} />
        <TabPane tab={'英文'} key={'2'} />
      </Tabs>
    );
  };

  const getName = () => {
    if (lan === 'zh') {
      return '订阅';
    } else {
      return 'subscription';
    }
  };

  const ButtonOneComp = () => {
    // gmail的适配有问题, 暂时先把带图片的这个样式拿掉  @hanxu  23.12.07
    return null;

    // return (
    //   <div className={style.wrap}>
    //     <div
    //       className={style.style1}
    //       onClick={() => {
    //         onClickButton && onClickButton(buttonHtml(getName(), 1, lan));
    //       }}
    //     >
    //       <div style={{ width: '16px', height: '16px' }}>
    //         <img
    //           style={{ verticalAlign: 'baseline' }}
    //           src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2IiBmaWxsPSJub25lIj4KICA8cGF0aCBkPSJNOCAxMy41QzggMTMuNSA1Ljc1IDExLjI1IDUgMTAuNUM0IDkuNSAyIDguMDQ0OTMgMiA2LjI1QzIgNC40NTUwNyAzLjQ1NTA3IDMgNS4yNSAzQzYuNDA3ODggMyA3LjQyNDM0IDMuNjA1NTEgOCA0LjUxNzE2QzguNTc1NjYgMy42MDU1MSA5LjU5MjEyIDMgMTAuNzUgM0MxMi41NDQ5IDMgMTQgNC40NTUwNyAxNCA2LjI1QzE0IDguMDQ0OTMgMTMgOC41IDExLjUgMTBDMTAuNzUgMTAuNzUgOCAxMy41IDggMTMuNVoiIHN0cm9rZT0idXJsKCNwYWludDBfbGluZWFyXzQyMTZfMjAwMzQ3KSIvPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzQyMTZfMjAwMzQ3IiB4MT0iMTIuNSIgeTE9IjExLjUiIHgyPSIzIiB5Mj0iMyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjRkE2RTdEIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0Y4QUU2QyIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+Cjwvc3ZnPg=="
    //         />
    //       </div>
    //       <div className={style.title}>{getName()}</div>
    //     </div>
    //   </div>
    // );
  };
  const ButtonTwoComp = () => {
    return (
      <div className={style.wrap}>
        <div
          className={style.style2}
          onClick={() => {
            onClickButton && onClickButton(buttonHtml(getName(), 2, lan));
          }}
        >
          <div className={style.title}>{getName()}</div>
        </div>
      </div>
    );
  };
  const ButtonThreeComp = () => {
    return (
      <div className={style.wrap}>
        <div
          className={style.style3}
          onClick={() => {
            onClickButton && onClickButton(buttonHtml(getName(), 3, lan));
          }}
        >
          <div className={style.title}>{getName()}</div>
        </div>
      </div>
    );
  };

  const BodyComp = () => {
    return (
      <div className={style.body}>
        {ButtonOneComp()}
        {ButtonTwoComp()}
        {ButtonThreeComp()}
      </div>
    );
  };

  return (
    <div className={style.root} style={{ width: lan === 'zh' ? '96px' : '140px' }}>
      {TabComp()}
      {BodyComp()}
    </div>
  );
};
