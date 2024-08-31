import React, { useState, useEffect, useMemo } from 'react';
import { Button, message } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { useAppSelector } from '@web-common/state/createStore';
import { getIsFreeVersionUser } from '@web-common/state/reducer/privilegeReducer';
import { apis, apiHolder, AccountApi } from 'api';
import { usePaidUpgrade } from '@web-entry-ff/layouts/hooks/usePaidUpgrade';
import SitePicture from './images/site.png';
import CustomersPicture from './images/customers-picture.png';
import EdmPicture from './images/edm-picture.png';
import WAPicture from './images/wa-picture.png';
import styles from './index.module.scss';

const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

export const renderMap = {
  wmData: {
    title: '全球海量数据  精准定位客户',
    dataCode: 'search',
    picture: {
      width: 426,
      height: 346,
      url: CustomersPicture,
    },
    content: '',
    featureList: [
      {
        title: '20亿+权威外贸海关数据，1.2亿条企业数据信息',
        content: '覆盖全球230+国家和地区，数据源真实可靠更新及时​。网罗真实可靠的全球企业信息，2亿+条企业联系人数据，触达全球各个角落的商机。',
      },
      {
        title: '企业信息真实准确，精准获客',
        content: '全面整合企业信息，包括企业官网、主流社交媒体平台等，聚合全球各大商业API接口，高效布局营销策略。',
      },
    ],
  },
  edm: {
    title: '优质的邮件营销通道\n 全球畅通收发，送达率高',
    dataCode: 'edm',
    picture: {
      width: 426,
      height: 312,
      url: EdmPicture,
    },
    content: '',
    featureList: [
      {
        title: '海量专属优质IP',
        content: '邮箱领域领先品牌，25年技术沉淀，海量高信誉度IP，邮件投递能力强，送达率行业领先。',
      },
      {
        title: '真实账号发信',
        content: '专业邮件服务商，邮件营销使用真实账号发件不代发，有效提高送达率打开率。',
      },
      {
        title: '无效地址智能过滤',
        content: '智能过滤无效邮箱，降低信誉度受损风险，提高邮件送达率。',
      },
    ],
  },
  site: {
    title: '无门槛搭建专属网站\n 精准获取客户线索',
    dataCode: 'site',
    picture: {
      width: 426,
      height: 346,
      url: SitePicture,
    },
    content: '',
    featureList: [
      {
        title: '低成本无门槛搭建',
        content: '多套模板供选择，10分钟编辑修改即可生成专属企业网站。',
      },
      {
        title: '打通多种转化场景，一键插入商品信息',
        content: '天然融合邮件营销、社媒营销等场景，一键插入商品信息转化获取精准线索',
      },
    ],
  },
  whatsApp: {
    title: '官方发送通道  保障高效触达',
    dataCode: 'whatsapp',
    picture: {
      width: 426,
      height: 346,
      url: WAPicture,
    },
    content: '',
    featureList: [
      {
        title: 'WhatsApp官方通道发信，高效获客',
        content: '网易外贸通采用WhatsApp Business API官方认证通道合规群发，账号信誉度高，降低封号风险，有效提升信息发送量。',
      },
      {
        title: '无需添加好友，直接群发触达',
        content: 'WhatsApp营销群发无需存入通讯录，直接批量发送触达客户，并配有多种消息模板，营销效率高。',
      },
      {
        title: '实时沟通，客户反馈及时',
        content: '对于有意向的客户可通过WhatsApp进行沟通，直接回复问题、发送文件等，及时知晓客户反馈。',
      },
    ],
  },
};
export type Keys = keyof typeof renderMap;
// type Values = typeof renderMap[Keys]

interface Props {
  code: Keys;
  children?: null | JSX.Element;
}

const Guide: React.FC<Props> = props => {
  const isFreeVersionUser = useAppSelector(state => getIsFreeVersionUser(state.privilegeReducer));
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const { loading, handleClickUpgrade } = usePaidUpgrade();

  useEffect(() => {
    accountApi.doGetAccountIsAdmin().then(isAdmin => setIsAdmin(isAdmin));
  }, []);

  const record = renderMap[props.code];
  if (!isFreeVersionUser && props.children) {
    return props.children;
  }
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
        {isAdmin && (
          <Button className={styles.checkedBtn} loading={loading} type="primary" onClick={() => handleClickUpgrade(record.dataCode)}>
            立即开通
          </Button>
        )}
        <div className={styles.hint}>开通外贸通付费版即可立即使用</div>
      </div>
      <img className={styles.picture} style={{ width: record.picture.width, height: record.picture.height }} src={record.picture.url} />
    </div>
  );
};

export default Guide;
