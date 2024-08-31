import { message } from 'antd';
import { api, apis, GlobalSearchApi, GlobalSearchMenuAuth, PrevScene } from 'api';
import { navigate } from 'gatsby';
import React, { useCallback, useEffect, useState } from 'react';
import HollowOutGuide, { HollowOutGuideProps } from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
import { getIn18Text } from 'api';

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

let MenuList: GlobalSearchMenuAuth[] = [];

type IUseAutoAiEdmAuthFunc = (params: {
  emailList: Array<{
    contactName: string;
    contactEmail: string;
    sourceName?: PrevScene;
  }>;
  from?: PrevScene;
}) => void;

type PopoverType = React.FC<Omit<HollowOutGuideProps, 'title' | 'guideId'>>;

type IUseAutoAiEdmAuth = () => [boolean, IUseAutoAiEdmAuthFunc, PopoverType];

export const useAutoAiEdmAuth: IUseAutoAiEdmAuth = () => {
  const [menuList, setMenuList] = useState<Array<GlobalSearchMenuAuth>>([]);
  useEffect(() => {
    if (MenuList.length === 0) {
      globalSearchApi.doGetGlobalSearachGetMenuAuth().then(res => {
        setMenuList(res);
      });
    } else {
      setMenuList(MenuList);
    }
  }, []);
  const visible = !!menuList.find(menu => menu.menuCode === 'autoAiEdm')?.isVisible;
  const doAutoAiEdm = useCallback(
    (params: {
      emailList: Array<{
        contactName: string;
        contactEmail: string;
        sourceName?: string;
      }>;
      from?: PrevScene;
    }) => {
      const { emailList, from = 'customs' } = params;
      if (!visible) {
        // 无权限
        return;
      } else if (emailList.length === 0) {
        // 没邮箱
        message.warn({
          content: getIn18Text('SUOXUANKEHUZANWUYOUXIANG'),
        });
        return;
      } else {
        localStorage.setItem(
          'aiHostingMarketingEmails',
          JSON.stringify(
            emailList.map(e => ({
              ...e,
              sourceName: e.sourceName ? e.contactName : from,
            }))
          )
        );
        // source auto_ai_edm代表从一键托管这个路径来
        // from是场景 和useEdmSendCount的PrevScene类型一致
        navigate(`#edm?page=aiHosting&source=auto_ai_edm&from=${from}&_t=` + new Date().getTime());
      }
    },
    [visible]
  );
  const Popover: PopoverType = props => {
    if (visible) {
      return (
        <HollowOutGuide
          guideId="AI_AUTO_EDM_WM_DATA"
          placement="topRight"
          title={<span style={{ whiteSpace: 'normal' }}>一键生成智能营销方案，自动发送多轮营销邮件，显著提升营销效率，让您更聚焦有效线索</span>}
          {...props}
        />
      );
    }
    return <>{props.children}</>;
  };

  return [visible, doAutoAiEdm, Popover];
};
