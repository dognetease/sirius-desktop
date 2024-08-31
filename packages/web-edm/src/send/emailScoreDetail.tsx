import React, { useState } from 'react';
import classnames from 'classnames';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import EmailScoreCheck from '@/images/icons/edm/email-score-check.png';
import EmailScoreArrow from '@/images/icons/edm/email-score-arrow-right.png';
import { ReactComponent as SuccessIcon } from '@/images/icons/edm/emailscore/success.svg';
import { ReactComponent as AlertIcon1 } from '@/images/icons/edm/emailscore/alert_level1.svg';
import { ReactComponent as AlertIcon2 } from '@/images/icons/edm/emailscore/alert_level2.svg';
import { ReactComponent as AlertIcon3 } from '@/images/icons/edm/emailscore/alert_level3.svg';
import style from './emailScoreDetail.module.scss';
import { apiHolder, getIn18Text } from 'api';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const systemApi = apiHolder.api.getSystemApi();

interface EmailScoreDetailProps {
  detail: any;
}
const EmailScoreDetail: React.FC<EmailScoreDetailProps> = props => {
  if (!props.detail) return null;
  const { title, score, list } = props.detail;
  const openHelpCenter = useOpenHelpCenter();
  const [openKey, setOpenKey] = useState<string | null>(null);
  function renderIcon() {
    if (score < 3) {
      return (
        <>
          <div className={style.icon}>
            <AlertIcon3 />
          </div>
          <div className={style.title}>
            {score}
            {getIn18Text('FEN\uFF0CBUJIGE')}
          </div>
        </>
      );
    }
    if (score < 5) {
      return (
        <>
          <div className={style.icon}>
            <AlertIcon2 />
          </div>
          <div className={style.title}>
            {score}
            {getIn18Text('FEN\uFF0CJIGELE')}
          </div>
        </>
      );
    }
    if (score < 7) {
      return (
        <>
          <div className={style.icon}>
            <AlertIcon1 />
          </div>
          <div className={style.title}>
            {score}
            {getIn18Text('FEN\uFF0CJIGELE')}
          </div>
        </>
      );
    }
    if (score < 9) {
      return (
        <>
          <div className={style.icon}>
            <SuccessIcon />
          </div>
          <div className={style.title}>
            {score}
            {getIn18Text('FEN\uFF0CJIHUWANMEI')}
          </div>
        </>
      );
    }
    return (
      <>
        <div className={style.icon}>
          <SuccessIcon />
        </div>
        <div className={style.title}>
          {score}
          {getIn18Text('FEN\uFF0CWOW! WANMEI')}
        </div>
      </>
    );
  }

  const GuideComp = () => {
    const openGuidePage = () => {
      openHelpCenter('/d/1674043251663912961.html');
      // systemApi.openNewWindow('https://waimao.163.com/knowledgeCenter#/d/1674043251663912961.html');
    };
    return (
      <div
        className={style.guide}
        onClick={() => {
          openGuidePage();
        }}
      >
        <div style={{ height: '2px', background: '#E7EBF9', width: '100%' }}></div>
        <div className={style.title}>《如何修改邮件内容降低垃圾率》</div>
        <div style={{ height: '2px', background: '#E7EBF9', width: '100%' }}></div>
      </div>
    );
  };

  return (
    <div className={style.emailScoreDetail}>
      {renderIcon()}
      {parseInt(score) !== 10 && GuideComp()}
      <div className={style.list}>
        {list.map(item => {
          const isDefect = item.mark < 0;
          const hasSubList = isDefect && Array.isArray(item.list) && !!item.list.length;
          const isOpen = openKey === item.name;
          return (
            <div
              className={classnames(style.item, {
                [style.itemDefect]: isDefect,
              })}
              key={item.name}
            >
              <div className={style.dataItem} onClick={() => isDefect && setOpenKey(isOpen ? null : item.name)}>
                {hasSubList && (
                  <img
                    className={classnames(style.arrowIcon, {
                      [style.arrowIconOpen]: isOpen,
                    })}
                    src={EmailScoreArrow}
                    alt="arrow-icon"
                  />
                )}
                <div className={style.name}>{item.name}</div>
                <div className={style.mark}>{isDefect ? item.mark : <img src={EmailScoreCheck} />}</div>
              </div>
              {hasSubList && (
                <div
                  className={style.subList}
                  style={{
                    height: isOpen ? 'auto' : 0,
                  }}
                >
                  {item.list.map((subItem, index) => (
                    <div className={style.dataItem} key={index}>
                      <div className={style.name}>
                        <EllipsisTooltip>{subItem.description}</EllipsisTooltip>
                      </div>
                      <div className={style.mark}>{subItem.mark}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default EmailScoreDetail;
