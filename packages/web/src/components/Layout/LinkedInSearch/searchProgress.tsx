import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import { Button, Space, Progress } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { WhatsAppAiSearchTaskStatus } from 'api';
import { ReactComponent as AiSearchWaitting } from '@/images/icons/whatsApp/ai-search-waitting.svg';
import { ReactComponent as AiSearchSearching } from '@/images/icons/whatsApp/ai-search-searching.svg';
import { ReactComponent as AiSearchFinished } from '@/images/icons/whatsApp/ai-search-finished.svg';
import { ReactComponent as AiSearchMinimize } from '@/images/icons/whatsApp/ai-search-minimize.svg';
import { ReactComponent as AiSearchMaximize } from '@/images/icons/whatsApp/ai-search-maximize.svg';
import { getTransText } from '@/components/util/translate';
import style from './searchProgress.module.scss';

interface SearchProgressProps {
  visible: boolean;
  total: number;
  minimize: boolean;
  taskStatus: WhatsAppAiSearchTaskStatus;
  isManualStop: boolean;
  onMinimizeChange: (minimize: boolean) => void;
  onStop: () => void;
  onFinish: () => void;
  translateKeyList: string[];
}

const SearchProgress: React.FC<SearchProgressProps> = props => {
  const { visible, total, minimize, taskStatus, isManualStop, onMinimizeChange, onStop, onFinish, translateKeyList } = props;

  const [percent, setPercent] = useState<number>(0);

  const percentRef = useRef(percent);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    percentRef.current = percent;
  }, [percent]);

  const intervalRef = useRef<NodeJS.Timer>(-1 as unknown as NodeJS.Timer);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const increasePercent = ({
    target,
    duration,
  }: {
    target: number; // 目标值
    duration: number; // 执行时长
  }) =>
    new Promise<void>(resolve => {
      clearInterval(intervalRef.current);

      const diffPercent = target - percentRef.current;

      if (diffPercent <= 0) {
        resolve();
        clearInterval(intervalRef.current);
      } else {
        const frequency = 500; // 执行频率
        const executeTime = duration / frequency; // 执行次数
        const unitPercent = diffPercent / executeTime; // 每次执行改变的值
        intervalRef.current = setInterval(() => {
          const nextPercent = percentRef.current + unitPercent;
          if (nextPercent < target) {
            setPercent(nextPercent);
          } else {
            setPercent(target);
            resolve();
            clearInterval(intervalRef.current);
          }
        }, frequency);
      }
    });

  useEffect(() => {
    if (taskStatus === WhatsAppAiSearchTaskStatus.SEARCHING) {
      setPercent(0);

      increasePercent({ target: 30, duration: 1000 })
        .then(() => increasePercent({ target: 50, duration: 60000 }))
        .then(() => increasePercent({ target: 70, duration: 120000 }))
        .then(() => increasePercent({ target: 90, duration: 180000 }));
    }
    if (taskStatus === WhatsAppAiSearchTaskStatus.STOP) {
      if (isManualStop) {
        setPercent(0);
      } else {
        setPercent(90);

        increasePercent({ target: 100, duration: 1000 }).then(() => {
          if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false;
          } else {
            onFinish();
          }

          setPercent(0);
        });
      }
    }
  }, [taskStatus]);

  let content = null;

  const getSearchTitleByPercent = (percent: number) => {
    switch (true) {
      case percent >= 0 && percent < 30:
        return getTransText('StartingSearch...');
      case percent >= 30 && percent <= 100:
        return (
          <>
            {getTransText('DataFoundPart1')}
            <span className={style.highlight}>{` ${Number(total).toLocaleString()} `}</span>
            {getTransText('DataFoundPart2')}
          </>
        );
      default:
        return null;
    }
  };

  const getMaximizeStepByPercent = (percent: number) => {
    const [key1, key2, key3, key4, key5] = translateKeyList;
    switch (true) {
      case percent < 15:
        return (
          <>
            <div className={style.name}>{getTransText(key1) || ''}</div>
            <div className={style.icon}>
              <AiSearchSearching className={style.spining} />
            </div>
          </>
        );
      case percent < 30:
        return (
          <>
            <div className={style.name}>{getTransText(key2) || ''}</div>
            <div className={style.icon}>
              <AiSearchSearching className={style.spining} />
            </div>
          </>
        );
      case percent < 90:
        return (
          <>
            <div className={style.name}>{getTransText(key3) || ''}</div>
            <div className={style.icon}>
              <AiSearchSearching className={style.spining} />
            </div>
          </>
        );
      case percent < 100:
        return (
          <>
            <div className={style.name}>{getTransText(key4) || ''}</div>
            <div className={style.icon}>
              <AiSearchSearching className={style.spining} />
            </div>
          </>
        );
      case percent === 100:
        return (
          <>
            <div className={style.name}>{getTransText(key5) || ''}</div>
            <div className={style.icon}>
              <AiSearchFinished />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  if (!minimize) {
    const [key1, key2, key3, key4, key5] = translateKeyList;
    content = (
      <div className={style.content}>
        <AiSearchMinimize className={style.minimizeTrigger} onClick={() => onMinimizeChange(true)} />
        <img className={style.picture} src="https://cowork-storage-public-cdn.lx.netease.com/common/2023/12/06/8d6479ccca1d4cc699ea987436d03773.gif" />
        <div className={style.title}>{getSearchTitleByPercent(percent)}</div>
        <div className={style.subTitle}>{getTransText('StoppedAtAnyTime') || ''}</div>
        <Progress className={style.progress} percent={percent} showInfo={false} strokeColor="#4C6AFF" />
        <div className={style.steps}>
          <div className={style.step}>
            <div className={style.name}>{getTransText(key1) || ''}</div>
            <div className={style.dashed} />
            <div className={style.icon}>
              {percent >= 0 && percent < 15 && <AiSearchSearching className={style.spining} />}
              {percent >= 15 && percent <= 100 && <AiSearchFinished />}
            </div>
          </div>
          <div className={style.step}>
            <div className={style.name}>{getTransText(key2) || ''}</div>
            <div className={style.dashed} />
            <div className={style.icon}>
              {percent >= 0 && percent < 15 && <AiSearchWaitting />}
              {percent >= 15 && percent < 30 && <AiSearchSearching className={style.spining} />}
              {percent >= 30 && percent <= 100 && <AiSearchFinished />}
            </div>
          </div>
          <div className={style.step}>
            <div className={style.name}>{getTransText(key3) || ''}</div>
            <div className={style.dashed} />
            <div className={style.icon}>
              {percent >= 0 && percent < 30 && <AiSearchWaitting />}
              {percent >= 30 && percent < 90 && <AiSearchSearching className={style.spining} />}
              {percent >= 90 && percent <= 100 && <AiSearchFinished />}
            </div>
          </div>
          <div className={style.step}>
            <div className={style.name}>{getTransText(key4) || ''}</div>
            <div className={style.dashed} />
            <div className={style.icon}>
              {percent >= 0 && percent < 30 && <AiSearchWaitting />}
              {percent >= 30 && percent < 90 && <AiSearchSearching className={style.spining} />}
              {percent >= 90 && percent <= 100 && <AiSearchFinished />}
            </div>
          </div>
          <div className={style.step}>
            <div className={style.name}>{getTransText(key5) || ''}</div>
            <div className={style.dashed} />
            <div className={style.icon}>
              {percent >= 0 && percent < 30 && <AiSearchWaitting />}
              {percent >= 30 && percent < 90 && <AiSearchSearching className={style.spining} />}
              {percent >= 90 && percent <= 100 && <AiSearchFinished />}
            </div>
          </div>
        </div>
        <div className={style.operations}>
          <Space>
            <Button type="primary" onClick={() => onMinimizeChange(true)}>
              {getTransText('Minimize') || ''}
            </Button>
            <Button onClick={onStop}>{getTransText('Stop') || ''}</Button>
          </Space>
        </div>
      </div>
    );
  } else {
    content = (
      <div className={style.content}>
        <AiSearchMaximize className={classnames('sirius-no-drag', style.maximizeTrigger)} onClick={() => onMinimizeChange(false)} />
        <img className={style.picture} src="https://cowork-storage-public-cdn.lx.netease.com/common/2023/12/06/8d6479ccca1d4cc699ea987436d03773.gif" />
        <div className={style.body}>
          <div className={style.title}>{getSearchTitleByPercent(percent)}</div>
          <div className={style.subTitle}>{getTransText('StoppedAtAnyTime') || ''}</div>
          <Progress className={style.progress} percent={percent} showInfo={false} strokeColor="#4C6AFF" />
          <div className={style.footer}>
            <div className={style.step}>{getMaximizeStepByPercent(percent)}</div>
            <a className={style.stop} onClick={onStop}>
              {getTransText('Stop') || ''}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={classnames(style.searchProgressRoot, {
        [style.maximize]: !minimize,
        [style.minimize]: minimize,
      })}
    >
      <Modal
        width={!minimize ? 420 : 442}
        className={style.searchProgress}
        closable={false}
        visible={visible}
        footer={null}
        // getContainer={`.${style.searchProgressRoot}`} // TODO:怀疑该属性导致弹窗未正常渲染
      >
        {content}
      </Modal>
    </div>
  );
};

export default SearchProgress;
