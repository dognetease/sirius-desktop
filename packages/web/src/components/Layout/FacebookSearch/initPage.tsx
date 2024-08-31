import React, { useContext } from 'react';
import styles from './index.module.scss';

import { FacebookInput } from './facebookInput';
import { ReactComponent as CheckIcon } from '@/images/icons/customs/check.svg';
import { ReactComponent as DescIcon1 } from '../LinkedInSearch/assets/search_linkin_icon1.svg';
import { ReactComponent as DescIcon2 } from '../LinkedInSearch/assets/search_linkin_icon2.svg';
import { ReactComponent as DescIcon3 } from '../LinkedInSearch/assets/search_linkin_icon3.svg';
import { Row, Col } from 'antd';
import { FacebookContext } from './facebookProvider';
import { getIn18Text } from 'api';

export const FacebookInitPage = () => {
  const { state } = useContext(FacebookContext);
  if (!state.isInit) {
    return null;
  }
  return (
    <div className={styles.init}>
      <div className={styles.initTop}>
        <h3 className={styles.title}>{'Facebook' + getIn18Text('SOUSUO')}</h3>
        <div className={styles.desc}>
          <span>
            <CheckIcon />
            <span>{getIn18Text('facebookTip1')}</span>
          </span>
          <span>
            <CheckIcon />
            <span>{getIn18Text('facebookTip2')}</span>
          </span>
          <span>
            <CheckIcon />
            <span>{getIn18Text('facebookTip3')}</span>
          </span>
          <span>
            <CheckIcon />
            <span>{getIn18Text('facebookTip4')}</span>
          </span>
        </div>
        <div className={styles.search}>
          <FacebookInput />
        </div>
      </div>
      <div className={styles.initBottom}>
        <div className={styles.title}>{getIn18Text('ProductFeatures')}</div>
        <Row justify="space-between" gutter={20}>
          <Col span={8}>
            <div className={styles.descCard}>
              <div className={styles.descIcon}>
                <DescIcon1 />
              </div>
              <div className={styles.descContent}>
                <div className={styles.descTitle}>{getIn18Text('facebookTitle1')}</div>
                <div className={styles.descText}>{getIn18Text('facebookDesc1')}</div>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className={styles.descCard}>
              <div className={styles.descIcon}>
                <DescIcon2 />
              </div>
              <div className={styles.descContent}>
                <div className={styles.descTitle}>{getIn18Text('facebookTitle2')}</div>
                <div className={styles.descText}>{getIn18Text('facebookDesc2')}</div>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className={styles.descCard}>
              <div className={styles.descIcon}>
                <DescIcon3 />
              </div>
              <div className={styles.descContent}>
                <div className={styles.descTitle}>{getIn18Text('facebookTitle3')}</div>
                <div className={styles.descText}>{getIn18Text('facebookDesc3')}</div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};
