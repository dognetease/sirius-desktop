import React, { useEffect, useState } from 'react';
import { apiHolder, apis, DataTrackerApi } from 'api';
import IconCard from '@web-common/components/UI/IconCard/index';
import debounce from 'lodash/debounce';
import { MailActions } from '@web-common/state/reducer';
import { useActions } from '@web-common/state/createStore';
import style from './discussIntro.module.scss';
import { getIn18Text } from 'api';
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
interface DiscussIntroProps {
  hideBtn?: boolean;
  close: () => void;
  mailMid?: string;
}
const DiscussIntro: React.FC<DiscussIntroProps> = props => {
  const { hideBtn = false, close, mailMid = '' } = props;
  const [contHeight, setContHeight] = useState<number>(0);
  const mailActions = useActions(MailActions);
  const closeSelf = () => close && close();
  const toStartDiscuss = () => {
    trackApi.track('pcmail_click_mailDetail_mailChatList_mailChatIntroduce_addNewMailChat', {});
    closeSelf();
    mailActions.doUpdateShareMailMid(mailMid);
  };
  const calcH = () => {
    const ch = document.querySelector('.discuss-intro-wrap')?.clientHeight;
    if (ch) {
      const contH = ch - 64 * 2 - 64 - (hideBtn ? 64 : 0);
      setContHeight(contH);
    }
  };
  const handleResize = debounce(() => calcH(), 500);
  useEffect(() => {
    calcH();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <div className={style.discussIntro} style={{ visibility: contHeight > 0 ? 'visible' : 'hidden' }}>
      <div className={style.header}>
        {getIn18Text('SHENMESHIYOUJIAN')}
        <div className={style.closeButt} onClick={closeSelf}>
          <IconCard type="close" />
        </div>
      </div>
      <div className={style.content} style={{ height: contHeight + 'px' }}>
        <img
          className={style.part0}
          src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/04/21/80bb6f8109464c79bf8e185881f225b5.jpg"
          alt={getIn18Text('YOUJIANTAOLUN')}
        />

        <div className={style.part1}>
          <div className={style.brightPoint}>
            <img
              className={style.brightPointNum}
              src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/04/21/e4452f0d4f21420ba4e02ea9e8edd50d.png"
              alt={getIn18Text('LIANGDIAN1')}
            />
            <p className={style.boldIntro}>
              {getIn18Text('ZHENDUIYOUJIANFA')}
              <br />
              {getIn18Text('JIAQIYOUJIANGOU')}
            </p>
            <p className={style.intro}>{getIn18Text('ZAIYOUXIANGMOKUAI')}</p>
          </div>
          <img className={style.animation} src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/04/25/480ac4a1a5534ed9bdd55ef7df5106f5.gif" alt="" />
        </div>

        <div className={style.part2}>
          <p className={style.part2Intro}>{getIn18Text('DANGFAQIYOUJIAN')}</p>
          <div className={style.mods}>
            <img
              className={style.mailMod}
              src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/05/24/5721cbced89742368ac5588b0112d63c.png"
              alt={getIn18Text('YOUJIANMOKUAI')}
            />
            <img
              className={style.msgMod}
              src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/04/21/25517fe44c2449d3b6649e0328b051fd.jpg"
              alt={getIn18Text('XIAOXIMOKUAI')}
            />
          </div>
        </div>

        <div className={style.part3}>
          <div className={style.brightPoint}>
            <img
              className={style.brightPointNum}
              src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/04/21/e747af66bc3044fb83dec788aa0db882.png"
              alt={getIn18Text('LIANGDIAN2')}
            />
            <p className={style.boldIntro}>
              {getIn18Text('TAOLUNZUNEIJU')}
              <br />
              {getIn18Text('JISHIGOUTONGYU')}
            </p>
            <p className={style.intro}>{getIn18Text('ZAIXIAOXIMOKUAI')}</p>
          </div>
          <img className={style.introPic} src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/05/24/905c770804ce41b39ce89ad1f0d255a7.png" alt="" />
        </div>
      </div>
      {hideBtn ? null : (
        <div className={style.footer}>
          <button className={style.startDiscuss} onClick={toStartDiscuss}>
            {getIn18Text('QUFAQIYOUJIAN')}
          </button>
        </div>
      )}
    </div>
  );
};
export default DiscussIntro;
