/* eslint-disable jsx-a11y/media-has-caption */
import React, { FC, ReactNode, useEffect } from 'react';
import { getIn18Text } from 'api';
import ReactDOM from 'react-dom';
import style from './index.module.scss';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import Modal from '@/components/Layout/components/Modal/modal';
import tipsImg1 from '@/images/globalSearch/search-tips-1.png';
import tipsImg2 from '@/images/globalSearch/search-tips-2.png';
import tipsImg3 from '@/images/globalSearch/search-tips-3.png';
import { ReactComponent as GuideVideoBuleTipsSvg } from '@/images/globalSearch/videBuleTips.svg';
import { globalSearchDataTracker } from '../../tracker';
import { ConfigActions } from '@web-common/state/reducer';
import { useAppDispatch } from '@web-common/state/createStore';

export const VideoGuide: FC<{
  visible: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: ReactNode;
  form?: string;
}> = props => {
  const { visible, onClose, videoUrl, title, form } = props;
  const videRef = React.useRef<HTMLVideoElement>(null);
  const handleVideoPlayStart = () => {
    globalSearchDataTracker.tractVideoPlay(form);
  };
  const handleCancel = () => {
    let ratioNumber = (Number(videRef.current?.currentTime) / Number(videRef.current?.duration)) * 100;
    globalSearchDataTracker.tractVideoFinish({ time: videRef.current?.currentTime, ratio: (ratioNumber.toFixed(2) || 0.0) + '%', form });
    onClose();
  };
  return (
    <Modal getContainer={document.body} bodyStyle={{ padding: '0 24px' }} width={780} title={title} footer={false} visible={visible} onCancel={handleCancel}>
      <video autoPlay width="100%" controls controlsList="nodownload" onPlay={handleVideoPlayStart} ref={videRef}>
        <source src={videoUrl || ''} type="video/mp4" />
        {getIn18Text('BUZHICHIH5VIDEO')}
      </video>
    </Modal>
  );
};

export const showVideoGuide = (paramsObj: { url: string; title?: ReactNode; form?: string }) => {
  const { url, title, form } = paramsObj;
  const container = document.createElement('div');
  document.body.appendChild(container);

  const closeHandler = () => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
  };
  ReactDOM.render(<VideoGuide visible videoUrl={url} title={title} onClose={closeHandler} form={form} />, container);
};

interface Props {
  visible: boolean;
  onClose: () => void;
  type?: string;
}

interface TipsItem {
  title: string;
  desc: ReactNode;
  imgUrl?: string;
}

const tipsList: TipsItem[] = [
  {
    title: '使用AI扩展相关词汇',
    desc: '使用搜索框下的AI拓词功能，根据你的搜索词，系统会智能生成与搜索词相关的词汇。勾选后，你可以查询到更多相关结果。也可以将拓展出的词汇填入输入框，让AI帮你拓展更多相似的词汇。',
    imgUrl: tipsImg1,
  },
  {
    title: '尽量使用具体的产品名称',
    desc: '如果你的公司经营的产品是服装，直接搜索大类“clothing”可能会得到较少的结果。你可尝试查询具体的产品名称，如“shirt”“sweater”“jeans”等。',
    imgUrl: tipsImg2,
  },
  {
    title: '在国外电商网站上查找真实的产品名称',
    desc: '翻译软件对产品中文名称的翻译结果并不一定是该产品的真实名称。你可以尝试在Amazon、eBay等网站上搜索该产品的真实名称。例如，“湿厕纸”这个产品在Google翻译中的结果是“wet toilet paper”，但在Amazon中搜索后发现更常用的名称是“wet wipes”。',
    imgUrl: tipsImg3,
  },
  {
    title: '搜索目标客户的经营范围',
    desc: '你可以尝试搜索你的下游公司的行业类型。例如，售卖甜味剂的公司可以寻找食品厂、啤酒厂等公司的联系方式。',
  },
];

export const SearchGuide: React.FC<Props> = props => {
  const { visible, onClose, type } = props;
  useEffect(() => {
    if (visible) {
      globalSearchDataTracker.trackSearchTips({
        from:
          {
            server: 'unexpanded',
            tips: 'fewResults',
            default: 'manual',
          }[type || 'default'] || '',
      });
    }
  }, [visible, type]);
  const dispatch = useAppDispatch();
  const onPlayVideo = (params: { videoId: string; source: string; scene: string }) => {
    const { videoId, source, scene } = params;
    dispatch(ConfigActions.showVideoDrawer({ videoId: videoId, source, scene }));
  };
  return (
    <Drawer contentWrapperStyle={{ minWidth: '504px', width: '504px' }} visible={visible} onClose={onClose}>
      <div className={style.headerTitle}>
        <span>如何搜到更多数据</span>
        <span className={style.showTipsWrapper} onClick={() => onPlayVideo({ videoId: 'V6', source: 'kehufaxian', scene: 'kehufaxian_3' })}>
          <GuideVideoBuleTipsSvg />
          <span className={style.searchTipsText}>视频教程</span>
        </span>
      </div>
      <div className={style.listWrapper}>
        {tipsList.map(({ title, desc, imgUrl }, index) => (
          <React.Fragment key={title}>
            <div className={style.lineWrapper}>
              <div className={style.tipsNo}>{index + 1}</div>
              <div className={style.tipsTitle}>{title}</div>
            </div>
            <div className={style.tipsDesc}>{desc}</div>
            <img className={style.tipsImg} src={imgUrl} alt="" />
          </React.Fragment>
        ))}
      </div>
    </Drawer>
  );
};

export const showSearchGuide = (type?: string) => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const closeHandler = () => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
  };
  ReactDOM.render(<SearchGuide visible type={type} onClose={closeHandler} />, container);
};
