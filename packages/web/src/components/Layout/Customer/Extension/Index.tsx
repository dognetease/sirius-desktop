import React, { MouseEvent, useState } from 'react';
import classNames from 'classnames';
import { Button } from 'antd';
import HeaderLayout from '../components/headerLayout/headerLayout';
import ImportClueModal from './components/ImportClueModal/importClueModal';
import Bg from '@/images/extension-bg.png';
import { ReactComponent as ArrowRightIcon } from '@/images/icons/edm/arrow_right_1.svg';
import { ReactComponent as VideoIcon } from '@/images/icons/video.svg';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { CloseBtnWithWhiteBg } from '@/components/Layout/Worktable/icons/CloseBtnWithWhiteBg';
import { getTransText } from '@/components/util/translate';
import style from './style.module.scss';
import { getIn18Text } from 'api';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const record = {
  title: '外贸通小助手',
  dataCode: 'search',
  picture: {
    width: 660,
    height: 448,
    url: Bg,
  },
  featureList: [
    {
      title: '邮箱抓取',
      content: '聚合1.2亿+社交媒体和搜索引擎数据',
    },
    {
      title: '企业智能背调',
      content: '深度挖掘联系人邮箱',
    },
    {
      title: 'LinkedIn助手',
      content: '浏览网页的同时高效获取客户资料',
    },
    {
      title: 'WhatsAPP助手',
      content: '一键添加客户，联动外贸通客户管理',
    },
  ],
};
const Extension: React.FC<any> = () => {
  const openHelpCenter = useOpenHelpCenter();

  let [clueVisible, setClueVisible] = useState<boolean>(false);
  const [showVideo, setShowVideo] = useState(false);
  const handleClickPlayButton = () => {
    setShowVideo(true);
  };
  const handleCancelPlay = () => {
    setShowVideo(false);
  };
  const closeClueVisable = () => {
    setClueVisible(false);
  };
  const handleClick = () => {
    const url = document.body.dataset.extensionInstalled
      ? 'https://www.linkedin.com/in/grayson-peng-046074255/?openSidebar=true'
      : 'https://chrome.google.com/webstore/detail/%E7%BD%91%E6%98%93%E5%A4%96%E8%B4%B8%E9%80%9A%E5%8A%A9%E6%89%8B/fbaccmibmbdppbofdglbfakjalaepkna';
    window.open(url);
  };
  const onKnowledgeCenterClick = (e: MouseEvent) => {
    openHelpCenter('/d/1635158374637117442.html');
    e.preventDefault();
  };

  return (
    <>
      <div className={style.extensionWrap}>
        <HeaderLayout
          className={style.header}
          title={getTransText('CHAJIANHUOKE')}
          subTitle={
            <div className={style.hint}>
              安装插件后，可以通过设置过滤名单，屏蔽抓取某域名下的邮箱数据。
              <span className={style.btnSetting} onClick={() => setClueVisible(true)}>
                {getIn18Text('QUSHEZHI')}
              </span>
              <Button className={style.playBtn} onClick={handleClickPlayButton}>
                <VideoIcon />
                <span color="#4C6AFF">快速了解</span>
              </Button>
            </div>
          }
        ></HeaderLayout>
        <SiriusModal
          className={style.videoModal}
          visible={showVideo}
          width="70%"
          onCancel={handleCancelPlay}
          centered
          destroyOnClose
          footer={null}
          getContainer={document.body}
          maskClosable={false}
          closeIcon={<CloseBtnWithWhiteBg />}
        >
          <video width="100%" controls controlsList="nodownload" poster="https://image.moyincloud.com/20230428/484045709293785088">
            <source src="https://cowork-storage-public-cdn.lx.netease.com/common/2023/05/26/c1ab76d81b374283b2e9bc6c58248c96.mp4" type="video/mp4" />
            {getTransText('BUZHICHIH5VIDEO')}
          </video>
        </SiriusModal>
        {clueVisible && <ImportClueModal visible={clueVisible} onCancel={closeClueVisable} />}
        <div className={style.container}>
          <div className={style.content}>
            <div className={style.title}>{record.title}</div>
            {record.featureList.map((item, index) => (
              <div className={style.feature} key={index}>
                <div className={style.featureTitle}>{item.title}</div>
                <div className={style.featureContent}>{item.content}</div>
              </div>
            ))}
            <Button className={style.checkedBtn} type="primary" onClick={handleClick}>
              {document.body.dataset.extensionInstalled ? '立即使用' : '立即安装'}
            </Button>
            <div className={style.hint}>
              <span>如何使用网易外贸通助手？</span>
              <a href="" target="_blank" onClick={onKnowledgeCenterClick}>
                {getTransText('LIAOJIEGENGDUO')}
                <ArrowRightIcon />
              </a>
            </div>
          </div>
          <img className={style.picture} style={{ width: record.picture.width, height: record.picture.height }} src={record.picture.url} />
        </div>
      </div>
    </>
  );
};
export default Extension;
