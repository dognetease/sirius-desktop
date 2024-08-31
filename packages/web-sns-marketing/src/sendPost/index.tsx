import { getIn18Text } from 'api';
import * as React from 'react';
import { useState } from 'react';
import classnames from 'classnames';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import SendAiPost from './components/SendAiPost';
import SendManualPost from './components/SendManualPost';
import { ReactComponent as AiTipIcon } from '@web-sns-marketing/images/ai-tip.svg';
import { ReactComponent as EditIcon } from '@web-sns-marketing/images/edit.svg';
import style from './index.module.scss';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';

const SendPost = () => {
  const [type, setType] = useState<'AI' | 'manual'>('AI');
  const tabs = (
    <div className={style.tabs}>
      <Button className={classnames(style.tab, { [style.active]: type === 'AI' })} btnType={type === 'AI' ? 'default' : 'minorLine'} onClick={() => setType('AI')}>
        <AiTipIcon className={style.tabIcon} />
        {getIn18Text('AIXIETIE')}
      </Button>
      <Button
        className={classnames(style.tab, { [style.active]: type === 'manual' })}
        btnType={type === 'manual' ? 'default' : 'minorLine'}
        onClick={() => setType('manual')}
      >
        <EditIcon className={style.tabIcon} />
        {getIn18Text('SHOUDONGXIETIE')}
      </Button>
    </div>
  );

  return (
    <PermissionCheckPage resourceLabel="SOCIAL_MEDIA" accessLabel="VIEW+OP" menu="SOCIAL_MEDIA_POST">
      <div className={style.sendPost}>
        <SendAiPost className={style.sendAiPost} visible={type === 'AI'} tabs={tabs} />
        <SendManualPost className={style.sendManualPost} visible={type === 'manual'} tabs={tabs} />
      </div>
    </PermissionCheckPage>
  );
};

export default SendPost;
