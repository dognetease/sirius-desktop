import React, { useState, useEffect } from 'react';
import { apiHolder, apis, TaskCenterApi, DataTrackerApi } from 'api';
import { Checkbox } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import NotificationCard from '@web-common/components/UI/NotificationCard';
import { showNoviceTaskCloseTip } from '../../utils';
import { navigate } from '@reach/router';
import { getTransText } from '@/components/util/translate';
import style from './index.module.scss';

const eventApi = apiHolder.api.getEventApi();
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const taskCenterApi = apiHolder.api.requireLogicalApi(apis.taskCenterApiImpl) as unknown as TaskCenterApi;

interface NoviceTaskEntryProps {}

const NoviceTaskEntry: React.FC<NoviceTaskEntryProps> = props => {
  const [visible, setVisible] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  useEffect(() => {
    const id = eventApi.registerSysEventObserver('NoviceTaskRemind', {
      func: e => {
        setVisible(true);
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('NoviceTaskRemind', id);
    };
  }, []);

  const handleRemindLaterClick = () => {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const nextRemindTime = Date.now() + ONE_DAY;

    if (checked) {
      taskCenterApi.closeNoviceTaskRemind();
    } else {
      taskCenterApi.setNoviceTaskNextRemindTime(nextRemindTime);
    }

    setVisible(false);
    showNoviceTaskCloseTip();
  };

  const handleNavigateClick = () => {
    const HALF_DAY = 12 * 60 * 60 * 1000;
    const nextRemindTime = Date.now() + HALF_DAY;

    if (checked) {
      taskCenterApi.closeNoviceTaskRemind();
    } else {
      taskCenterApi.setNoviceTaskNextRemindTime(nextRemindTime);
    }

    setVisible(false);
    navigate('#noviceTask?page=noviceTask');
  };

  return (
    <NotificationCard show={visible}>
      <div className={style.noviceTaskEntry}>
        <div className={style.header}>
          <div className={style.title}>{getTransText('HUANYINGLAIDAOWAIMAOTONG')}</div>
        </div>
        <div className={style.body}>{getTransText('HUANYINGLAIDAOWAIMAOTONGWANCHENGXINSHOURENWU')}</div>
        <div className={style.footer}>
          <Checkbox
            className={style.neverRemind}
            checked={checked}
            onChange={event => {
              setChecked(event.target.checked);
              trackApi.track('waimao_newusertask_guide', {
                action: 'no_reminder',
              });
            }}
          >
            {getTransText('BUZAITIXING')}
          </Checkbox>
          <Button
            btnType="minorLine"
            onClick={() => {
              handleRemindLaterClick();
              trackApi.track('waimao_newusertask_guide', {
                action: 'todo_later',
              });
            }}
          >
            {getTransText('SHAOHOUZAISHUO')}
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              handleNavigateClick();
              trackApi.track('waimao_newusertask_guide', {
                action: 'go_now',
              });
            }}
          >
            {getTransText('XIANZAIJIUQU')}
          </Button>
        </div>
      </div>
    </NotificationCard>
  );
};

export default NoviceTaskEntry;
