import { AddressBookApi, EdmCustomsApi, EdmSendBoxApi, GlobalSearchApi, api, apis, apiHolder } from 'api';
import React, { ReactNode } from 'react';
import { ReactComponent as FacebookLogo } from './assets/facebook.svg';
import { ReactComponent as InstagramLogo } from './assets/instagram.svg';
import { ReactComponent as TwitterLogo } from './assets/twitter.svg';
import { ReactComponent as YoutubeLogo } from './assets/youtube.svg';
import { ReactComponent as LinkedinLogo } from './assets/linkedin.svg';

export const socialMedias = ['linkedin', 'twitter', 'facebook', 'youtube', 'instagram'];
export const mediasTipType = ['linkedin', 'instagram'];
export const logoMap: Record<string, ReactNode> = {
  linkedin: <LinkedinLogo />,
  twitter: <TwitterLogo />,
  facebook: <FacebookLogo />,
  youtube: <YoutubeLogo />,
  instagram: <InstagramLogo />,
};
export const addressBookApi = api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
export const edmApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
export const eventApi = api.getEventApi();
export const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
export const edmCustomsApi = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
export const MAX_SELECT_ROWS_LEN = 10000;
export const MAX_MARKET_ROWS_LEN = 50;
const { isMac } = apiHolder.env;
const systemApi = apiHolder.api.getSystemApi();
export const isWindows = systemApi.isElectron() && !isMac;
export const globalSearchGuideUrl = 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/10/20/195534fbc33c41f49e34c9a4f6faf3c7.mp4';
export const globalSearchHomUrl1 = 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/11/14/50417b67179448bc94a061175861d4ee.mp4';
export const globalSearchHomUrl2 = 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/11/14/a4548e843d124b7fa61981c2870fea51.mp4';
export const globalSearchDrawlerUrl1 = 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/11/14/50417b67179448bc94a061175861d4ee.mp4';

export const customsDataHome1 = 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/10/20/1718d0310922415797d83d757e85ef10.mp4';
export const customsDataHome2 = 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/11/14/de757ce3b8e64696962a4d61a3f93d80.mp4';

export const smartCmdUrl = 'https://cowork-storage-public-cdn.lx.netease.com/common/2023/11/14/2355f1059fac4556b2a678a8b8395014.mp4';
