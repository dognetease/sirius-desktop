import React, { useState, useEffect } from 'react';
import style from './editorHelper.module.scss';
import { ReactComponent as CloseIcon } from '@/images/icons/edm/yingxiao/edm-editor-close.svg';
import { ReactComponent as OpenIcon } from '@/images/icons/edm/yingxiao/edm-editor-open.svg';
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/yingxiao/selectTask/select-task-question.svg';
import { ReactComponent as QuestionMark } from '@/images/icons/edm/yingxiao/selectTask/select-task-question-mark.svg';
import { ReactComponent as ArrowIcon } from '@/images/icons/edm/yingxiao/selectTask/select-task--arrow.svg';
import { ReactComponent as ReplyIncreaseIcon } from '@/images/icons/edm/yingxiao/selectTask/select-task-reply-increase.svg';
import { useOpenHelpCenter } from '@web-common/utils/utils';
import { DataStoreApi, apiHolder } from 'api';

interface EditorHelperProps {}

interface EditorHelperNumberItemData {
  detail: string;
  number: number;
}

const storeApi: DataStoreApi = apiHolder.api.getDataStoreApi();

export const EditorHelperComponent: React.FC<EditorHelperProps> = props => {
  const {} = props;
  const closeState = storeApi.getSync('editorHelperComponentCloseState').data;
  const [close, setClose] = useState(closeState === 'true' ? true : false);
  const openHelpCenter = useOpenHelpCenter();

  useEffect(() => {}, []);

  const onClickState = () => {
    const isClose = !close;
    storeApi.put('editorHelperComponentCloseState', isClose ? 'true' : 'false');
    setClose(isClose);
  };

  const StateOpComp = () => {
    return (
      <div className={style.opIcon} onClick={onClickState}>
        {!close && <CloseIcon />}
        {close && <OpenIcon />}
      </div>
    );
  };

  const clickCorrectUseButton = () => {
    openHelpCenter('/d/1641339855990423553.html');
  };

  const clickPracticalButton = () => {
    openHelpCenter('/d/1663094862923243522.html');
  };

  const effectQuestionDataSource = () => {
    return [
      '在网易外贸通「营销托管」功能中，您只要花费几分钟的时间，设置收件人、输入要发送内容的基本信息后，系统能够在合适的时间和对应的发信条件（未回复的邮件）下，自动完成多轮邮件营销工作，业务员只需要关注有效回复跟进询盘即可。',
    ];
  };

  const recommendDataSource = () => {
    const items: EditorHelperNumberItemData[] = [
      {
        detail: '多轮营销回复率，约涨3倍',
        number: 1,
      },
      {
        detail: '超便捷的多轮营销设置，坐等询盘信',
        number: 2,
      },
      {
        detail: '多种营销策略可选',
        number: 3,
      },
      {
        detail: '智能回信',
        number: 4,
      },
      {
        detail: '营销信效果如何？一个看板全部掌握',
        number: 5,
      },
    ];
    return items;
  };

  const numberComp = (number: number) => {
    return (
      <div className={style.recommendContent}>
        <span className={style.recommendNumber}>{number}</span>
      </div>
    );
  };

  return (
    <>
      <div className={style.root}>
        <div className={style.content} style={{ display: close ? 'none' : 'block' }}>
          <div className={style.question}>
            <div className={style.questionTop}>
              <QuestionIcon className={style.questionIcon} />
              <div className={style.questionTitle}>什么是营销托管？</div>
            </div>
            <div className={style.questionContent}>
              {effectQuestionDataSource().map(detail => {
                return (
                  <div className={style.questionContentItem}>
                    <QuestionMark className={style.questionContentItemMark} />
                    {detail}
                  </div>
                );
              })}
            </div>
          </div>
          <div className={style.question}>
            <div className={style.questionTop}>
              <QuestionIcon className={style.questionIcon} />
              <div className={style.questionTitle}>为什么推荐使用营销托管？</div>
            </div>
            <div className={style.recommend}>
              {recommendDataSource().map((data: EditorHelperNumberItemData) => {
                return (
                  <div className={style.recommendItem}>
                    {numberComp(data.number)}
                    <div className={style.recommendDetail}>{data.detail}</div>
                    {data.number === 1 ? <ReplyIncreaseIcon /> : <></>}
                  </div>
                );
              })}
            </div>
            <div className={style.openContainer} onClick={clickCorrectUseButton}>
              <span className={style.openContainerTitle}>查看正确使用方法</span>
              <ArrowIcon className={style.openContainerIcon} />
            </div>
          </div>
          <div className={style.question}>
            <div className={style.questionTop}>
              <QuestionIcon className={style.questionIcon} />
              <div className={style.questionTitle}>优秀企业如何使用营销托管？</div>
            </div>
            <div style={{ marginTop: '0px' }} className={style.openContainer} onClick={clickPracticalButton}>
              <span className={style.openContainerTitle}>查看最佳实践案例</span>
              <ArrowIcon className={style.openContainerIcon} />
            </div>
          </div>
        </div>
        {StateOpComp()}
      </div>
    </>
  );
};
