import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';

import PageContentLayout from '@/layouts/Main/pageContentLayout';
import TeamCreator from './components/TeamCreator/teamCreator';
// import TeamSetting, {ChangeOwner, TeamInfoEditor} from './components/TeamSetting/teamSetting';

const IMTestPage: React.FC<{}> = () => (
  <PageContentLayout>
    <TeamCreator creatorType={0} />
  </PageContentLayout>
);

export default IMTestPage;
