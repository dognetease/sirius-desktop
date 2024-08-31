/*
 * @Author: your name
 * @Date: 2022-03-09 15:45:24
 * @LastEditTime: 2022-03-21 11:17:52
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/Layout/Write/components/MailInfo/taskMail/TaskMailBtn.tsx
 */
import React, { useState } from 'react';
import classnames from 'classnames';
import { apiHolder as api, DataStoreApi } from 'api';
import { Button } from 'antd';
import { useAppSelector } from '@web-common/state/createStore';
import taskStyle from './taskMail.module.scss';
import IconCard from '@web-common/components/UI/IconCard';
import { getIn18Text } from 'api';
const storeApi: DataStoreApi = api.api.getDataStoreApi();
interface Props {}
const GuideCard: React.FC<Props> = () => {
  const infoStatus = useAppSelector(state => state.mailReducer.currentMail.status);
  const taskMailShow = infoStatus?.taskMailShow;
  const [showCard, setShowCard] = useState(true);
  const followerCardHide = storeApi.getSync('followerCardHide').data;
  const clickKnow = () => {
    storeApi.put('followerCardHide', 'true');
    setShowCard(false);
  };
  return showCard && !followerCardHide && taskMailShow ? (
    <div className={classnames(taskStyle.taskMailCard, taskStyle.followerCard)}>
      <span className={classnames(taskStyle.triangleIcon)}>
        <IconCard type="upTriangle" width="24" height="12" fill="#386ee7" fillOpacity="1" />
      </span>
      <div className={classnames(taskStyle.desc)}>{getIn18Text('RENWUGUANZHUREN')}</div>
      <div className={classnames(taskStyle.footer)}>
        <Button className={classnames(taskStyle.btn, taskStyle.taskBtn)} onClick={clickKnow}>
          {getIn18Text('ZHIDAOLE')}
        </Button>
      </div>
    </div>
  ) : null;
};
export default GuideCard;
