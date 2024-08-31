import React, { useState, FC } from 'react';
import { Popover } from 'antd';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import CloseIcon from '@web-common/components/UI/Icons/svgs/ModalCloseSmall';
import IconCard from '@web-common/components/UI/IconCard';
import styles from './cloudAttCont.module.scss';
import { getIn18Text } from 'api';

interface ExpireTimeTitleProps {
  // 用于排序
  isDesc?: boolean;
  changeOrder?: () => void;
  showSort?: boolean;
}

const GUOQITEXT = getIn18Text('GUOQISHIJIAN');

// 过期时间table header title
export const ExpireTimeTitle: FC<ExpireTimeTitleProps> = ({ isDesc, changeOrder, showSort }) => {
  // 设置隐藏popover
  const [show, setShow] = useState<boolean>(false);
  let timer: number; // 记录timer
  const setHidden = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      setShow(false);
    }, 200);
  };
  // 当前版本信息
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();
  // table date
  const spaceInfo = [
    {
      spaceType: getIn18Text('DANGEDAXIAO'),
      free: '1G',
      flagship: '3G',
      exclusive: '5G',
    },
    {
      spaceType: getIn18Text('GUOQISHIJIAN'),
      free: getIn18Text('15TIAN'),
      flagship: getIn18Text('15TIAN'),
      exclusive: getIn18Text('YONGBUGUOQI'),
    },
    {
      spaceType: getIn18Text('ZHENGTIKONGJIAN'),
      free: '3G',
      flagship: '16G',
      exclusive: '32G',
    },
    {
      spaceType: getIn18Text('SHIFOUKEXUFEI'),
      free: getIn18Text('BUZHICHI'),
      flagship: getIn18Text('ZHICHI'),
      exclusive: getIn18Text('WUXU'),
    },
  ];
  // '免费版', '旗舰版', '尊享版'
  const versions = {
    free: getIn18Text('MIANFEIBAN'),
    ultimate: getIn18Text('QIJIANBAN'),
    sirius: getIn18Text('ZUNXIANGBAN'),
  };
  const renderCurrentTag = (): JSX.Element => <div className={styles.currentTag}>{getIn18Text('DANGQIANBANBEN')}</div>;

  return (
    // container
    <div className={styles.expireTimeTitle}>
      {showSort ? (
        <div className={styles.expireTime} style={{ cursor: 'pointer' }} onClick={() => changeOrder && changeOrder()}>
          <span>{GUOQITEXT}</span>
          <IconCard style={{ paddingLeft: '5px' }} type={isDesc ? 'descend' : 'ascend'} />
        </div>
      ) : (
        <div className={styles.expireTime}>
          <span>{GUOQITEXT}</span>
        </div>
      )}
      <Popover
        className={styles.expireTimePopover}
        visible={show}
        content={
          <div
            onMouseEnter={() => {
              if (timer != null) {
                clearTimeout(timer);
              }
            }}
            onMouseLeave={() => {
              setHidden();
            }}
            className={styles.popoverContainer}
          >
            {/* header title */}
            <div className={styles.headerWrapper}>
              <div className={styles.headerLeft}>{getIn18Text('YOUJIANYUNFUJIAN12')}</div>
              <div
                onClick={() => {
                  setShow(false);
                }}
                className={styles.headerCloseIcon}
              >
                <CloseIcon />
              </div>
            </div>
            {/* content part */}
            <div className={styles.contentWrapper}>
              {/* header aspect */}
              <div className={styles.featureInfo}>
                <div className={styles.versionTitle}>{getIn18Text('BANBENGONGNENG')}</div>
                {/* 版本列表 */}
                {(Object.keys(versions) as Array<keyof typeof versions>).map(version => (
                  <div key={version} className={styles.versionItem}>
                    <span className={styles.versionLabel}>
                      {versions[version]}
                      {/* 当前版本tag */}
                      {productVersionId === version && renderCurrentTag()}
                    </span>
                  </div>
                ))}
              </div>
              {/* space limit info */}
              {spaceInfo.map(info => (
                <div className={styles.featureContentItem} key={info.spaceType}>
                  <div className={styles.featureType}>{info.spaceType}</div>
                  <div className={styles.spaceSize}>{info.free}</div>
                  <div className={styles.spaceSize}>{info.flagship}</div>
                  <div className={styles.spaceSize}>{info.exclusive}</div>
                </div>
              ))}
            </div>
          </div>
        }
      >
        {/* popover anchor */}
        <div
          className={styles.infoIcon}
          onMouseEnter={() => {
            if (timer != null) {
              clearTimeout(timer);
            }
            setShow(true);
          }}
          onMouseLeave={() => {
            setHidden();
          }}
        >
          <IconCard type="info" />
        </div>
      </Popover>
    </div>
  );
};
