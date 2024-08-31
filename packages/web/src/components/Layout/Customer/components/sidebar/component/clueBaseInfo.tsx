/* eslint-disable jsx-a11y/label-has-associated-control */

import React, { useState } from 'react';
import { CustomerDetail, EmailRoles, SocialPlatform, getIn18Text } from 'api';
import { message } from 'antd';
import style from './baseInfo.module.scss';
import EllipsisTooltip from '../../ellipsisTooltip/ellipsisTooltip';
import CopyToClipboard from 'react-copy-to-clipboard';
import { ReactComponent as CheckedCircleIcon } from '@/images/icons/checked_circle.svg';
import { ReactComponent as CloseCircleIcon } from '@/images/icons/close_circle.svg';
import { ReactComponent as CopyIcon } from '@/images/mailCustomerCard/clipboard-copy.svg';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import IconCard from '@web-common/components/UI/IconCard';
import moment from 'moment';

// 社媒展示组件
export const SocialMedia = ({ socialMediaList }: { socialMediaList: SocialPlatform[] }) => {
  if (!socialMediaList || socialMediaList.length === 0) {
    return <>-</>;
  }
  // 是否展示全部
  const [showAll, setShowAll] = useState(false);
  // 显示隐藏
  const handleClick = () => {
    setShowAll(!showAll);
  };

  if (socialMediaList.length > 2) {
    return (
      <div className={!showAll ? style.socialHide : ''}>
        {socialMediaList.map((s, idx) => (
          <EllipsisTooltip key={idx} className={style.socialItemOuter}>
            <div className={style.socialItem}>
              <span>{s.name}：</span>
              <span>{s.number}</span>
            </div>
          </EllipsisTooltip>
        ))}
        <div className={style.socialbtn}>
          <span onClick={() => handleClick()}>
            {showAll ? getIn18Text('SHOUQI') : getIn18Text('GENGDUOSHEMEIXINX')}
            <IconCard type={showAll ? 'tongyong_shuangjiantou_shang' : 'tongyong_shuangjiantou_xia'} />
          </span>
        </div>
      </div>
    );
  } else {
    return (
      <>
        {socialMediaList.map((s, idx) => (
          <EllipsisTooltip key={idx} className={style.socialItemOuter}>
            <div className={style.socialItem}>
              <span>{s.name}：</span>
              <span>{s.number}</span>
            </div>
          </EllipsisTooltip>
        ))}
      </>
    );
  }
};

interface BaseInfoConfig<T> {
  key: string;
  label: string;
  render?: (data: T) => React.ReactNode | React.ReactDOM | string;
}
// 我的线索，同事线索配置
const baseConfig: BaseInfoConfig<CustomerDetail>[] = [
  {
    key: 'leads_name',
    label: getIn18Text('XIANSUOMINGCHENG'),
  },
  {
    key: 'leads_number',
    label: getIn18Text('XIANSUOBIANHAO'),
  },
  {
    key: 'company_name',
    label: getIn18Text('GONGSIMINGCHENG'),
  },
  {
    key: 'area',
    label: getIn18Text('GUOJIADEQU'),
    render(data) {
      return Array.isArray(data.area) ? data.area.filter(i => !!i).join('/') : data.area;
    },
  },
  {
    key: 'website',
    label: getIn18Text('GONGSIGUANWANG'),
    render(data) {
      const href = data.website || data.company_domain;
      if (href) {
        const link = href.startsWith('https://') || href.startsWith('http://') ? href : 'http://' + href;
        return (
          <a href={link} target="_blank" rel="noreferrer">
            {href}
          </a>
        );
      }
      return '-';
    },
  },
  {
    key: 'telephone',
    label: getIn18Text('ZUOJIDIANHUA'),
    render(data) {
      if (!data.telephone) {
        return '-';
      }
      return (
        <div>
          <span>{data.telephone || '-'}</span>
          <CopyToClipboard
            onCopy={(_, result) => {
              message.success({
                icon: result ? <CheckedCircleIcon /> : <CloseCircleIcon />,
                content: <span style={{ marginLeft: 8 }}>{result ? getIn18Text('FUZHICHENGGONG') : getIn18Text('FUZHISHIBAI')}</span>,
              });
            }}
            text={data.telephone}
          >
            <CopyIcon className={style.rowIcon} />
          </CopyToClipboard>
        </div>
      );
    },
  },
  {
    key: 'address',
    label: getIn18Text('GONGSIDIZHI'),
  },
  {
    key: 'source',
    label: getIn18Text('XIANSUOLAIYUAN'),
  },
  {
    // 公司社媒展示jjwtodo
    key: 'social_media',
    label: getIn18Text('GONGSISHEMEI'),
    render(data) {
      return <SocialMedia socialMediaList={data.social_media} />;
    },
  },
  {
    key: 'star_level',
    label: getIn18Text('XIANSUOXINGJI'),
    render(data) {
      return data.star_level ? (
        <div style={{ display: 'flex' }}>
          <Tag type="label-6-1" hideBorder={true}>
            {data.star_level}
          </Tag>
        </div>
      ) : (
        '-'
      );
    },
  },
  {
    key: 'manager_list',
    label: getIn18Text('FUZEREN'),
    render(data) {
      return <EllipsisTooltip>{data.manager_list?.map(item => item.name || '-').join('，')}</EllipsisTooltip>;
    },
  },
  {
    key: 'create_time',
    label: getIn18Text('CHUANGJIANSHIJIAN'),
    render(data) {
      return data.system_info?.create_time ? moment(+data.system_info?.create_time).format('YYYY-MM-DD HH:mm:ss') : '-';
    },
  },
  {
    key: 'create_user',
    label: getIn18Text('CHUANGJIANREN'),
    render(data) {
      return <EllipsisTooltip>{data.system_info?.create_user}</EllipsisTooltip>;
    },
  },
  {
    key: 'remark',
    label: getIn18Text('BEIZHU'),
    render(data) {
      return <EllipsisTooltip>{data.remark}</EllipsisTooltip>;
    },
  },
];
// 公海线索配置
const openSeaConfig: BaseInfoConfig<CustomerDetail>[] = [
  {
    key: 'leads_name',
    label: getIn18Text('XIANSUOMINGCHENG'),
  },
  {
    key: 'leads_number',
    label: getIn18Text('XIANSUOBIANHAO'),
  },
  {
    key: 'company_name',
    label: getIn18Text('GONGSIMINGCHENG'),
  },
  {
    key: 'area',
    label: getIn18Text('GUOJIADEQU'),
    render(data) {
      return Array.isArray(data.area) ? data.area.filter(i => !!i).join('/') : data.area;
    },
  },
  {
    key: 'website',
    label: getIn18Text('GONGSIGUANWANG'),
    render(data) {
      const href = data.website || data.company_domain;
      if (href) {
        const link = href.startsWith('https://') || href.startsWith('http://') ? href : 'http://' + href;
        return (
          <a href={link} target="_blank" rel="noreferrer">
            {href}
          </a>
        );
      }
      return '-';
    },
  },
  {
    key: 'telephone',
    label: getIn18Text('ZUOJIDIANHUA'),
    render(data) {
      if (!data.telephone) {
        return '-';
      }
      return (
        <div>
          <span>{data.telephone || '-'}</span>
          <CopyToClipboard
            onCopy={(_, result) => {
              message.success({
                icon: result ? <CheckedCircleIcon /> : <CloseCircleIcon />,
                content: <span style={{ marginLeft: 8 }}>{result ? getIn18Text('FUZHICHENGGONG') : getIn18Text('FUZHISHIBAI')}</span>,
              });
            }}
            text={data.telephone}
          >
            <CopyIcon className={style.rowIcon} />
          </CopyToClipboard>
        </div>
      );
    },
  },
  {
    key: 'address',
    label: getIn18Text('GONGSIDIZHI'),
  },
  {
    key: 'source',
    label: getIn18Text('XIANSUOLAIYUAN'),
  },
  {
    // 公司社媒展示jjwtodo
    key: 'social_media',
    label: getIn18Text('GONGSISHEMEI'),
    render(data) {
      return <SocialMedia socialMediaList={data.social_media} />;
    },
  },
  {
    key: 'star_level',
    label: getIn18Text('XIANSUOXINGJI'),
    render(data) {
      return data.star_level ? (
        <div style={{ display: 'flex' }}>
          <Tag type="label-6-1" hideBorder={true}>
            {data.star_level}
          </Tag>
        </div>
      ) : (
        '-'
      );
    },
  },

  {
    key: 'return_time',
    label: getIn18Text('ZUIJINTUIHUIGONGHSJ'),
  },
  {
    key: 'return_remark',
    label: getIn18Text('ZUIJINTUIHUIGONGHBZ'),
    render(data) {
      return <EllipsisTooltip>{data?.return_remark || '-'}</EllipsisTooltip>;
    },
  },
  {
    key: 'return_managers',
    label: getIn18Text('QIANFUZEREN'),
    render(data) {
      return <EllipsisTooltip>{data?.return_managers?.map(item => item.name || '-').join('，') || '-'}</EllipsisTooltip>;
    },
  },
];
const renderFun = (data: CustomerDetail | undefined, item: BaseInfoConfig<CustomerDetail>) => {
  if (!data) {
    return '-';
  }
  if (item.render) {
    return item.render(data) || '-';
  }
  return (data as any)[item.key] || '-';
};
export const ClueBaseInfo = ({ data, emailRole }: { data?: CustomerDetail; emailRole: EmailRoles }) => {
  const config = emailRole === 'openSeaClue' ? openSeaConfig : baseConfig;
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ position: 'absolute', overflow: 'hidden auto', height: '100%', width: '100%' }}>
        {config.map(item => (
          <div key={item.key} className={style.infoRow}>
            <label>{item.label}</label>
            <div className={style.rowValue}>{renderFun(data, item)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
