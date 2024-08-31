import React, { useState, useEffect, useCallback } from 'react';
import {
  apiHolder as api,
  apis,
  AdvertApi,
  SurveyConfig,
  conf,
  inWindow,
  SystemApi,
  surveySpaceCode_electron,
  surveySpaceCode_web_new,
  surveySpaceCode_web_old,
  isEdm,
} from 'api';
import debounce from 'lodash/debounce';

const advertApi = api.api.requireLogicalApi(apis.advertApiImpl) as AdvertApi;
const systemApi = api.api.getSystemApi() as SystemApi;
// 是否从webmail过来
const isWebmail = inWindow() && conf('profile') ? conf('profile').toString().includes('webmail') : false;

// 调查问券
const SurveySpace: React.FC = () => {
  // 广告配置
  const [surveyConfig, setSurveyConfig] = useState<SurveyConfig | null>(null);

  const fetchAdConfig = useCallback(
    debounce(async () => {
      // 获取广告位
      try {
        let curSpaceCode = null;
        if (process.env.BUILD_ISEDM) {
          curSpaceCode = null;
        } else if (process.env.BUILD_ISELECTRON) {
          curSpaceCode = surveySpaceCode_electron;
        } else {
          curSpaceCode = isWebmail ? surveySpaceCode_web_new : surveySpaceCode_web_old;
          // curSpaceCode = surveySpaceCode_dev;
        }
        if (!curSpaceCode) return;
        const res = await advertApi.fetchConfig(curSpaceCode);
        const { success, data, message } = res;
        if (!success) {
          console.log('接口获取调查问券广告失败', message);
          return;
        }
        if (data) {
          // 广告列表
          const { itemList } = data;
          if (itemList?.length) {
            const { advertResourceList } = itemList[0];
            // 物料列表
            if (advertResourceList?.length) {
              const { content } = advertResourceList[0];
              // 物料内容
              const { clickContent } = content;
              if (clickContent) {
                try {
                  const surveyConfig = JSON.parse(clickContent);
                  const { surveyId } = surveyConfig;
                  if (surveyId) {
                    const currentUser = systemApi.getCurrentUser();
                    if (!currentUser) return;
                    surveyConfig.query = {
                      ...surveyConfig.query,
                      uid: currentUser.id,
                      orgName: currentUser.company || '',
                    };
                    console.log('surveyConfigsurveyConfig', surveyConfig);
                    setSurveyConfig(surveyConfig);
                    loadSDK(surveyConfig, currentUser.id);
                  }
                } catch (error) {
                  console.log('解析广告配置失败', error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.log('获取调查问券广告失败', error);
      }
    }, 2000),
    []
  );

  const showSurvey = () => {
    window?._dw &&
      _dw('checkUser', {
        complete(result) {
          console.log('checkUserResult', result);
          if (result.status) {
            console.log('当前用户可以答题');
            setTimeout(() => {
              _dw('open');
            }, 500);
          } else {
            console.log('当前用户不可答题');
          }
        },
      });
  };

  // 加载sdk
  const loadSDK = (config: SurveyConfig, id: string) => {
    window.localStorage.setItem('dw_clientId', id);
    // 已加载
    if (window?._dw) {
      _dw('updateConfig', config);
      showSurvey();
      return;
    }

    (function (w, d, n) {
      w[n] =
        w[n] ||
        function () {
          return (w[n].queue = w[n].queue || []).push(arguments);
        };
      const j = d.createElement('script');
      j.async = true;
      j.src = 'https://nos.netease.com/qiyukf/web-survey-js-sdk/js/sdk.js';
      d.body.appendChild(j);
      j.onload = a => {
        if (window?._dw) {
          _dw('setConfig', config);
          showSurvey();
        }
      };
    })(window, document, '_dw');
  };

  useEffect(() => {
    console.log('initFetch');
    fetchAdConfig();
  }, []);

  return <></>;
};

export default SurveySpace;
