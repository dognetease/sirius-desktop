// eslint-disable-next-line import/no-unresolved
import { Lib } from 'api/src/gen/bundle';
import { ApiPolicy, ApiResposity, NIMInterface, StringTypedMap } from 'api';

declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
declare module 'quill-image-drop-module';

declare global {
  interface Window {
    api: ApiResposity;
    siriusVersion: string;
    electronLib: Lib;
    SDK: {
      Chatroom: any;
      NIM: NIMInterface;
      util: {
        [k: string]: any;
      };
    };
    navigateTo: any;
    apiPolicies: StringTypedMap<ApiPolicy>;
    pageInitTime: number;
    featureSupportInfo: {
      supportNativeProxy: boolean;
    };
  }
}
