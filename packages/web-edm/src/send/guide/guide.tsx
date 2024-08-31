import React, { useState, useEffect } from 'react';
import style from './guide.module.scss';
import classnames from 'classnames';
import TaskSubjectSvg from '@/images/icons/edm/task-subject-desc.svg';
import MailThemeSvg from '@/images/icons/edm/mail-theme-desc.svg';
import MailAbstractSvg from '@/images/icons/edm/mail-abstract-desc.svg';
import RightArrow from '@/images/icons/edm/edm-more-icon.svg';
import { apiHolder } from 'api';
import { edmDataTracker } from '../../tracker/tracker';
import { getIn18Text } from 'api';

const systemApi = apiHolder.api.getSystemApi();

const TaskSubject = () => {
  return (
    <div className={style.common}>
      <div>{getIn18Text('RENWUMINGCHENGWEIGAICI')}</div>
      <div>{getIn18Text('XITONGHUIMORENANZHAO')}</div>
      <img src={TaskSubjectSvg} />
    </div>
  );
};

const MailTheme = () => {
  const openGuidePage = () => {
    edmDataTracker.track('pc_markting_edm_subject_read_more_click');
    systemApi.openNewWindow('https://waimao.163.com/knowledge/article/29');
  };

  return (
    <div className={style.common}>
      <div className={style.subTitle}>{getIn18Text('WEISHENMEJIANYISHEZHI')}</div>
      <div>{getIn18Text('YOUJIANZHUTISHIXIYIN')}</div>
      <div>{getIn18Text('ZAISHEZHIFAJIANRENWU')}</div>
      <img src={MailThemeSvg} />
      <div className={style.button} onMouseDown={() => openGuidePage()}>
        <div className={style.title}>{getIn18Text('LIAOJIEGENGDUO')}</div>
        <img className={style.img} src={RightArrow} />
      </div>
    </div>
  );
};

const MailAbstract = () => {
  return (
    <div className={style.common}>
      <div className={style.subTitle}>{getIn18Text('YI、SHENMESHIYOUJIAN')}</div>
      <div>{getIn18Text('YOUJIANZHAIYAOTONGCHANGHUI')}</div>
      <div className={style.subTitle}>{getIn18Text('ER、WEISHENMEYAOZI')}</div>
      <div>{getIn18Text('FUYOUXIYINLIDEZHAI')}</div>
      <div>{getIn18Text('NINKEYIGENJUFASONG')}</div>
      <img src={MailAbstractSvg} />
    </div>
  );
};

const InsertVariable = () => {
  return (
    <div className={style.common}>
      <img src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/11/10/390a2484a7de49629fd998fc91d2d1ab.png" alt="" />
      <img src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/11/10/2d73615b93b24be485870d57cd2c8a16.png" alt="" />
      <img src="https://cowork-storage-public-cdn.lx.netease.com/common/2023/03/14/ceb2cb7efe794c14a9efe749d0864285.png" alt="" />
      <img src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/11/10/437ba753003f4c6991c402f4ae0ae4b4.png" alt="" />
      <img src="https://cowork-storage-public-cdn.lx.netease.com/lxbg/2022/11/10/77ed4f1a40c24172b21a17b75c092e64.png" alt="" />
    </div>
  );
};

export enum GuideType {
  Subject = 1, // 任务主题
  MailTheme, // 邮件主题
  MailAbstract, // 邮件摘要
  InsertVariable, // 插入变量
}

interface GuideObject {
  name: string;
  component: JSX.Element;
}

const noPaddingGuideType = [GuideType.InsertVariable];
// const clickCloseGuideType = [GuideType.InsertVariable];

const type2Component: Record<GuideType, GuideObject> = {
  [GuideType.Subject]: {
    name: getIn18Text('RENWUMINGCHENG'),
    component: <TaskSubject />,
  },
  [GuideType.MailTheme]: {
    name: getIn18Text('YOUJIANZHUTI'),
    component: <MailTheme />,
  },
  [GuideType.MailAbstract]: {
    name: getIn18Text('YOUJIANZHAIYAO'),
    component: <MailAbstract />,
  },
  [GuideType.InsertVariable]: {
    name: getIn18Text('CHARUBIANLIANG'),
    component: <InsertVariable />,
  },
};

export interface Props {
  guideType: GuideType;
  clickClose: () => void;
}

export const Guide = (Props: Props) => {
  const { guideType, clickClose } = Props;
  const [visible, setVisiable] = useState<boolean>(true);
  // const ref = useRef(null);
  // 普通任务下UI区分
  const [isCommon, setIsCommon] = useState<boolean>(false);

  const onCloseButtonClick = () => {
    clickClose();
    setVisiable(false);
  };

  useEffect(() => {
    const search = new URLSearchParams(window.location.hash?.split('?')[1]);
    setIsCommon(search.get('page') === 'write');
  }, []);

  return (
    <div className={classnames(style.root, isCommon ? style.rootCommon : '')} style={visible === false ? { display: 'none' } : {}}>
      {/* Title */}
      <div className={style.header}>
        <div className={style.title}>{type2Component[guideType].name}</div>
        <div className={style.icon} onClick={() => onCloseButtonClick()} />
      </div>
      {/* Body */}
      <div className={classnames(style.body, noPaddingGuideType.includes(guideType) ? style.bodyNoPadding : {})}>{type2Component[guideType].component}</div>
    </div>
  );
};
