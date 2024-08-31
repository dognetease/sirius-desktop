/*
 * @Author: your name
 * @Date: 2022-03-09 15:45:24
 * @LastEditTime: 2022-03-21 11:12:01
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/Layout/Write/components/MailInfo/taskMail/TaskMailBtn.tsx
 */
import React, { useEffect, useState, useEffect } from 'react';
import classnames from 'classnames';
import { apiHolder as api, DataStoreApi, DataTrackerApi, apis } from 'api';
import { Button } from 'antd';
import { MailActions, useActions, useAppSelector } from '@web-common/state/createStore';
import taskStyle from './taskMail.module.scss';
import { initTaskMailState } from './TaskMailBtn';

const storeApi: DataStoreApi = api.api.getDataStoreApi();
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
const systemApi = api.api.getSystemApi();
const isElectron = systemApi.isElectron();

interface Props {}

const GuideCard: React.FC<Props> = () => {
  const mailActions = useActions(MailActions);
  const infoStatus = useAppSelector(state => state.mailReducer.currentMail.status);
  const showWebWriteLetter = useAppSelector(state => state.mailReducer.showWebWriteLetter);
  const taskMailShow = infoStatus?.taskMailShow;
  const [showCard, setShowCard] = useState(true);
  const notFirstTaskMail = storeApi.getSync('notFirstTaskMail').data;

  useEffect(() => {
    if (!taskMailShow && !notFirstTaskMail && showCard) {
      if (isElectron || showWebWriteLetter) {
        trackApi.track('pcMail_show_taskPraiseBeginner_writeMailPage');
      }
    }
  }, [taskMailShow, notFirstTaskMail, showCard, showWebWriteLetter]);

  const clickTaskMail = async () => {
    mailActions.doTaskShow(true);
    mailActions.doTaskMailSetting(true);
    const taskMail = initTaskMailState();
    mailActions.doTaskMailChange(taskMail);
    storeApi.put('notFirstTaskMail', 'true');
    trackClickBtn('去添加任务');
  };

  const tryLater = () => {
    setShowCard(false);
    storeApi.put('notFirstTaskMail', 'true');
    trackClickBtn('下次再说');
  };

  const trackClickBtn = (buttonName: string) => {
    trackApi.track('pcMail_show_taskPraiseBeginner_writeMailPage', { buttonName });
  };

  const trackShowCard = () => {
    trackApi.track('pcMail_show_taskPraiseBeginner_writeMailPage');
    return null;
  };

  useEffect(() => {
    if (!taskMailShow && !notFirstTaskMail && showCard) trackShowCard();
  }, [showCard]);
  //  && notFirstTaskMail
  return !taskMailShow && !notFirstTaskMail && showCard ? (
    // return 1 ? (
    <div className={classnames(taskStyle.guideCard, taskStyle.taskMailCard)}>
      <div className={classnames(taskStyle.title)}>新增“任务”和“表扬”功能</div>
      <div className={classnames(taskStyle.desc)}>通过邮件的方式可以更好的实现任务的创建和跟踪。</div>
      <div className={classnames(taskStyle.footer)}>
        <Button className={classnames(taskStyle.btn, taskStyle.taskBtn)} onClick={clickTaskMail}>
          去添加任务
        </Button>
        <Button className={classnames(taskStyle.btn)} onClick={tryLater}>
          下次再说
        </Button>
      </div>
      {/*{trackShowCard()}*/}
    </div>
  ) : null;
};

export default GuideCard;
