import React, { useState, useEffect, useMemo } from 'react';
import { Button, message } from 'antd';
import { apis, apiHolder, WhatsAppApi, AccountApi, SystemApi } from 'api';
import { getTransText } from '@/components/util/translate';
import { whatsAppTracker } from '@/components/Layout/SNS/tracker';
import AiSearchPicture from './images/ai-search.png';
import JobPicture from './images/job.png';
import MessagePicture from './images/message.png';
import StatisticPicture from './images/statistic.png';
import TemplatePicture from './images/template.png';
import styles from './index.module.scss';
import { getIn18Text } from 'api';

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;

export const renderMap = {
  whatsAppAiSearch: {
    title: typeof window !== 'undefined' ? getTransText('EngineSearching') : '',
    picture: {
      width: 450,
      height: 366,
      url: AiSearchPicture,
    },
    content: (
      <>
        <div className={styles.subTitle}>{getIn18Text('AISOUKESHISHENME')}</div>
        <p className={styles.text}>{typeof window !== 'undefined' ? getTransText('CollectFromMainstreamPlatforms') : ''}</p>
      </>
    ),
    featureList: [
      {
        title: getIn18Text('RootedInGlobalSocialPlatforms'),
        content: getIn18Text('FUGAI 200 '),
      },
      {
        title: getIn18Text('CollectPotentialCustomerInformation'),
        content: getIn18Text('GENGGAOXIAODESOUJIKE'),
      },
    ],
  },
  whatsAppJob: {
    title: getIn18Text('QUNFARENWU'),
    picture: {
      width: 480,
      height: 370,
      url: JobPicture,
    },
    content: '',
    featureList: [
      {
        title: getIn18Text('GENGGAOCHUDALV、DA'),
        content: getIn18Text('WhatsAp'),
      },
      {
        title: getIn18Text('YOUXIAOJIANGDIFENGHAOFENG'),
        content: getIn18Text('WAIMAOTONGSHIYONGWh'),
      },
      {
        title: getIn18Text('DADATISHENGYINGXIAOXIN'),
        content: getIn18Text('SHIYONGZHUANSHUSHANGYEZHANG'),
      },
    ],
  },
  whatsAppMessage: {
    title: getIn18Text('XIAOXI'),
    picture: {
      width: 450,
      height: 370,
      url: MessagePicture,
    },
    content: '',
    featureList: [
      {
        title: getIn18Text('DUOYANGHUADEMOBANNENG'),
        content: getIn18Text('XIAOXIMOBANZHICHISHANG'),
      },
      {
        title: getIn18Text('QIANRENQIANMIANDEYINGXIAO'),
        content: getIn18Text('MOBANNEIRONGZHICHITIAN'),
      },
    ],
  },
  whatsAppStatistic: {
    title: getIn18Text('SHUJUTONGJI'),
    picture: {
      width: 485,
      height: 370,
      url: StatisticPicture,
    },
    content: '',
    featureList: [
      {
        title: getIn18Text('GENGGAOXIAODEJINXINGZAI'),
        content: getIn18Text('SHIYONGWhats'),
      },
    ],
  },
  whatsAppTemplate: {
    title: getIn18Text('XIAOXIMOBAN'),
    picture: {
      width: 477,
      height: 386,
      url: TemplatePicture,
    },
    content: '',
    featureList: [
      {
        title: getIn18Text('DUOYANGHUADEMOBANNENG'),
        content: getIn18Text('XIAOXIMOBANZHICHISHANG'),
      },
      {
        title: getIn18Text('QIANRENQIANMIANDEYINGXIAO'),
        content: getIn18Text('MOBANNEIRONGZHICHITIAN'),
      },
    ],
  },
};
export type Keys = keyof typeof renderMap;
type Values = (typeof renderMap)[Keys];

interface Props {
  comp: Values;
  setChecked: () => void;
}

const WhatsAppAd: React.FC<Props> = props => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const user = systemApi.getCurrentUser();

  useEffect(() => {
    accountApi.doGetAccountIsAdmin().then(isAdmin => setIsAdmin(isAdmin));
  }, []);

  const btnText = useMemo(() => {
    return isAdmin ? getIn18Text('LIANXIKEHUJINGLILE') : getIn18Text('LIANXIGUANLIYUANKAITONG');
  }, [isAdmin]);

  const handleClick = () => {
    if (!isAdmin) {
      // props.setChecked();
      message.success(getIn18Text('QIYEZANWEIKAITONGGAI'));
      whatsAppTracker.trackBusiness('button_to_manager');
      return;
    }
    setLoading(true);
    whatsAppTracker.trackBusiness('button_to_salse');
    whatsAppApi
      .reportWhatsAppOpportunity({
        // 产品类型
        productType: 'WHATSAPP',
        // 线索来源
        clueSource: systemApi.isElectron() ? 'LX_DESKTOP' : 'LX_WEB',
        // 联系人手机号
        mobile: user?.mobile,
        // 联系人姓名
        nickName: user?.nickName,
        // 联系人角色
        contactRo: getIn18Text('GUANLIYUAN'),
        // 组织架构
        organization: user?.contact?.contact.position?.flat(Infinity).join('/'),
        // 企业名称
        orgName: user?.company,
      })
      .then(() => {
        // props.setChecked();
        message.success(getIn18Text('TIJIAOCHENGGONG，WOFANG'));
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const record = props.comp;
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.title}>{record.title}</div>
        {record.content}
        {record.featureList.map((item, index) => (
          <div className={styles.feature} key={index}>
            <div className={styles.featureTitle}>{item.title}</div>
            <div className={styles.featureContent}>{item.content}</div>
          </div>
        ))}
        {btnText && (
          <Button className={styles.checkedBtn} loading={loading} type="primary" onClick={handleClick}>
            {btnText}
          </Button>
        )}
      </div>
      <img className={styles.picture} style={{ width: record.picture.width, height: record.picture.height }} src={record.picture.url} />
    </div>
  );
};

export default WhatsAppAd;
