// 17版本智能模式下线后，此文件无引用了，可以删除，建议观察一个版本
import React, { useState, useEffect, useLayoutEffect } from 'react';
import ReactDom from 'react-dom';

import { api, apiHolder, apis, MailConfApi as MailConfApiType } from 'api';
import styles from './hollow_out_tip.module.scss';
import classnames from 'classnames';

const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApiType;
const storeApi = api.getDataStoreApi();

interface IntBoxFreshTipProps {
  stepId: Array<string | HTMLElement>;
}

const intboxTipOpKey = 'int_box_tip_op_key';

let opMemory = false;

const hasOprated = () => {
  const result = storeApi.getSync(intboxTipOpKey);
  return (result.suc && result.data === 'true') || opMemory;
};

const setOprated = (event: CustomEvent<unknown> | undefined) => {
  // 触发自定义事件
  if (event != null) {
    document.dispatchEvent(event);
  }

  opMemory = true;
  return storeApi.putSync(intboxTipOpKey, 'true');
};

const getShowTipCondition = async () => {
  // 1.Get LocalStorage tip showment
  // 2.Get current mail list mode type (merge/intbox)
  // 3.Get the app version (1.10.0)
  // const mode = await mailConfApi.isShowAIMailBox();
  // return mode && !hasOprated();
  // 17版本下线，直接修改为返回false
  return Promise.resolve(false);
};

const getTargetNode = (id: string | HTMLElement) => {
  if (typeof window !== undefined && typeof document !== undefined) {
    if (typeof id === 'string') {
      const node = document.getElementsByClassName(id);
      return node[0];
    }
    return id;
  }
  return null;
};

const Tip: React.FC<IntBoxFreshTipProps> = ({ stepId }) => {
  const [position, setPosition] = useState<DOMRect | null>(null);
  const [step, setStep] = useState<number>(0);
  const target = stepId[step];
  const [event, setEvent] = useState<CustomEvent<unknown>>();
  // tip距离顶端元素
  const offsetTop = 16;

  const handleNext = () => {
    if (step + 1 === stepId.length) {
      setOprated(event);
    }
    setStep(step + 1);
  };

  useEffect(() => {
    // 自定义事件，用于广播新手引导完成
    setEvent(new CustomEvent('guideClosed'));
  }, []);

  const renderFooter = () => {
    const stepIn = step + 1;
    return (
      <div className={styles.footer}>
        <span>
          {stepIn} / {stepId.length}
        </span>
        <button className={styles.button} onClick={handleNext}>
          {stepId[stepIn] ? '下一步' : '知道了'}
        </button>
      </div>
    );
  };
  useLayoutEffect(() => {
    const node = target ? getTargetNode(target) : undefined;
    if (node) {
      const p = node.getBoundingClientRect();
      setPosition(p);
    } else {
      setPosition(null);
    }
  }, [target]);
  if (stepId.length === 0 || !stepId[step] || position === null || hasOprated()) {
    return null;
  }
  return (
    <div className={styles.maskWrapper}>
      {/* <div className={styles.mask} style={{ left: 0, top: 0, right: 0, height: position.y }}></div>
      <div className={styles.mask} style={{ left: 0, top: position.y, width: position.x, height: position.height }}></div>
      <div className={styles.mask} style={{ left: position.x + position.width, top: position.y, right: 0, height: position.height }}></div>
      <div className={styles.mask} style={{ left: 0, bottom: 0, top: position.y + position.height, right: 0 }}></div>
       */}
      <div className={styles.mask} style={{ left: position.x, height: position.height, top: position.y, width: position.width }}></div>
      {step < stepId.length && (
        <div
          style={{
            left: position.x,
            top: position.y + offsetTop + position.height,
          }}
          className={classnames(styles.tip, {
            [styles.tip1]: step === 0,
            [styles.tip2]: step === 1,
          })}
        >
          {step === 0 && (
            <>
              <p className={styles.title}>收件箱升级为智能收件箱啦！</p>
              <p>1. 高优邮件展示在“优先处理”中</p>
              <p>2. 低优邮件展示在“全部”中</p>
              <p>3. 聚合邮件在智能模式下暂不生效哦</p>
            </>
          )}
          {step === 1 && <p className={styles.title}>高优邮件将展示在这里</p>}
          {renderFooter()}
        </div>
      )}
    </div>
  );
};

export const IntBoxFreshTip: React.FC<IntBoxFreshTipProps> = ({ stepId }) => {
  const [tip, setTip] = useState<React.ReactNode>(null);
  useEffect(() => {
    getShowTipCondition().then(res => {
      if (res) {
        const tip = ReactDom.createPortal(<Tip stepId={stepId} />, document.body);
        setTip(tip);
      }
    });
  }, []);
  return <>{tip}</>;
};
