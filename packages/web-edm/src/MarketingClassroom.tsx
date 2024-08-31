import { getIn18Text } from 'api';
import React, { useEffect, useState, useCallback, useImperativeHandle } from 'react';
import style from './MarketingClassroom.module.scss';
import { EdmSendBoxApi, SendBoxConfRes, apiHolder, apis, externalJumpUrls } from 'api';
import TongyongJianTouYou from '@web-common/images/newIcon/tongyong_jiantou_you';
import Classroom from '@/images/icons/edm/edm-marketing-classroom.svg';
import { edmDataTracker } from './tracker/tracker';
import { ReactComponent as Title } from '@/images/icons/edm/yingxiao/edm-marketing-classroom.svg';
import { useOpenHelpCenter } from '@web-common/utils/utils';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const systemApi = apiHolder.api.getSystemApi();

export interface Interface {
  refresh: () => void;
}
export interface Props {
  visiable?: boolean;
  sendBoxCof?: SendBoxConfRes;
}

export const MarketingClassroom = React.forwardRef<Interface, Props>((props, ref) => {
  const { visiable, sendBoxCof } = props;
  const [conf, setConf] = useState<SendBoxConfRes>();
  const openHelpCenter = useOpenHelpCenter();

  // const query = useCallback(async () => {
  //   try {
  //     const result = await edmApi.getSendBoxConf({ type: 1 });
  //     setConf(result);
  //   } catch (err) {}
  // }, [setConf]);

  useEffect(() => {
    setConf(sendBoxCof);
  }, [sendBoxCof]);

  useImperativeHandle(ref, () => ({
    refresh: () => {
      // query();
    },
  }));

  useEffect(() => {
    if (visiable && conf) {
      edmDataTracker.track('pc_markting_edm_tasklist_knowledgeCenter_show', {
        more: true,
      });
      conf.items.forEach(item => {
        edmDataTracker.track('pc_markting_edm_tasklist_knowledgeCenter_show', {
          title: item.desc,
        });
      });
    }
  }, [visiable]);

  // useEffect(() => {
  //   query();
  // }, []);

  const TitleComp = () => {
    return (
      <div
        className={style.titleArea}
        onClick={() => {
          openPage('/c/1598628693143560194.html', true);
        }}
      >
        <Title />
        {/* <img className={style.icon} src={Classroom} /> */}
        {/* <span className={style.title}>营销课堂</span> */}
      </div>
    );
  };

  const openPage = (url: string, helpCenter = true) => {
    if (url.startsWith('/knowledgeCenter') || helpCenter) {
      openHelpCenter(url);
    } else {
      systemApi.openNewWindow(url);
    }
  };

  const BodyComp = () => {
    let temp = new Array();

    conf?.items.forEach((item, index) => {
      temp.push(item);
      if (index !== conf.items.length - 1) {
        temp.push({ desc: 'line' });
      }
    });

    return (
      <div className={style.bodyArea}>
        {temp.map(item => {
          if (item.desc === 'line') {
            return <div className={style.line}></div>;
          }
          return (
            <div
              className={style.title}
              onClick={() => {
                edmDataTracker.track('pc_markting_edm_tasklist_knowledgeCenter_click', {
                  title: item.desc,
                });
                openPage(item.jumpUrl);
              }}
            >
              {item.desc}
            </div>
          );
        })}
      </div>
    );
  };

  const MoreComp = () => {
    return (
      <div
        className={style.moreArea}
        onClick={() => {
          edmDataTracker.track('pc_markting_edm_tasklist_knowledgeCenter_click', {
            more: true,
          });
          openPage('/c/1598628693143560194.html', true);
        }}
      >
        <span className={style.title}>{getIn18Text('GENGDUO')}</span>
        <TongyongJianTouYou fill={'#8D92A1'} />
      </div>
    );
  };

  if (!conf || conf.items.length === 0) {
    return undefined;
  }

  return (
    <div className={style.root}>
      {TitleComp()}
      {BodyComp()}
      {MoreComp()}
    </div>
  );
});
