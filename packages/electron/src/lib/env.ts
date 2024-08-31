// import {remote} from "electron";
// import * as remote from '@electron/remote';
// import { config } from 'env_def';
// import { appManage } from './appManage';
// import {version} from '../../package.json'

import { getOs } from './../util/osConf';

import { version, versionTime, stage } from 'envDef';

export const env = {
  // isMac: process.platform === 'darwin',
  isMac: getOs() === 'mac',
  userDataPath: '',
  version: version,
  showVersion: version + (stage !== 'prod' ? '-' + versionTime : ''),
  stage: stage,
};
