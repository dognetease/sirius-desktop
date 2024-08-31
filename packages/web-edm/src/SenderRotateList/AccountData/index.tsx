import React, { FC, useState, Fragment, useEffect } from 'react';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { getIn18Text, EdmEmailInfo, apiHolder, apis, EdmSendBoxApi, MultiAccountOverviewRes, WarmUpAccountSource } from 'api';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import { Skeleton, message } from 'antd';
import accountData1 from '@/images/icons/edm/yingxiao/account-data1.png';
import accountData2 from '@/images/icons/edm/yingxiao/account-data2.png';
import accountData3 from '@/images/icons/edm/yingxiao/account-data3.png';
import accountData4 from '@/images/icons/edm/yingxiao/account-data4.png';

import styles from './AccountData.module.scss';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

const DataConf: {
  title: string;
  icon: any;
  key: keyof MultiAccountOverviewRes;
}[] = [
  {
    title: '邮箱数量',
    icon: accountData1,
    key: 'totalAccounts',
  },
  {
    title: '邮箱预热发送封数',
    icon: accountData2,
    key: 'totalSent',
  },
  {
    title: '收到预热邮件封数',
    icon: accountData3,
    key: 'totalReceived',
  },
  {
    title: '进垃圾箱后移除封数',
    icon: accountData4,
    key: 'totalSpam',
  },
];

export const AccountData: FC<{
  showOpenDetail?: boolean;
  sources?: WarmUpAccountSource[];
  openDetail?: () => void;
  onDayChange?: (day: number) => void;
}> = ({ showOpenDetail = true, openDetail, onDayChange, sources = [WarmUpAccountSource.system] }) => {
  const [accountData, setAccountData] = useState<MultiAccountOverviewRes>();
  const [option, setOption] = useState<
    Array<{
      label: string;
      value: any;
    }>
  >([
    {
      label: '近14天',
      value: 14,
    },
    {
      label: '近30天',
      value: 30,
    },
    {
      label: '近3个月',
      value: 90,
    },
    {
      label: '近6个月',
      value: 180,
    },
  ]);
  const [days, setDays] = useState(14);

  useEffect(() => {
    edmApi
      .multiAccountOverview({
        days,
        sources: sources,
      })
      .then(setAccountData)
      .catch(err => {
        message.error('获取账号数据失败');
      });
  }, [days]);

  const renderData = () => {
    if (accountData == null) {
      return <Skeleton active />;
    }

    return (
      <div className={styles.data}>
        {DataConf.map((conf, index) => (
          <Fragment key={index}>
            <div className={styles.dataItem}>
              <img src={conf.icon} alt="" />
              <div className={styles.dataInfo}>
                <div className={styles.dataInfoNum}>{accountData[conf.key]}</div>
                <div className={styles.dataInfoTitle}>{conf.title}</div>
              </div>
            </div>
            {index < 3 && <div className={styles.line}></div>}
          </Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>邮箱预热数据</div>
        <div className={styles.right}>
          <EnhanceSelect
            // className={styles.select}
            style={{ width: 119 }}
            // placeholder={getIn18Text('XUANZEYINGXIAOFANGAN')}
            value={days}
            onChange={value => {
              setDays(value);
              onDayChange && onDayChange(value);
            }}
            defaultValue={days}
            getPopupContainer={node => node}
          >
            {option?.map(item => (
              <InSingleOption value={item.value} key={item.value}>
                {item.label}
              </InSingleOption>
            ))}
          </EnhanceSelect>
          {showOpenDetail && (
            <Button
              style={{
                marginLeft: 8,
              }}
              btnType="minorLine"
              onClick={openDetail}
            >
              查看全部
            </Button>
          )}
        </div>
      </div>
      {renderData()}
    </div>
  );
};
