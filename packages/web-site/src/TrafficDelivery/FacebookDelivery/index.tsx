import React, { useState } from 'react';
import styles from './index.module.scss';
import { ReactComponent as ListItemIcon } from '@web-site/images/traffic-delivery/list-item-icon.svg';
// import Button from '@web-site/../../web-common/src/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import FaceBookImage from '@web-site/images/traffic-delivery/face-book-default-img.png';
import TrafficDeliveryConsultModal from '../TrafficDeliveryConsultModal';

const FacebookDelivery = (props: { switchGoogleStyle: boolean }) => {
  const [showConsultModal, setShowConsultModal] = useState(false);

  return (
    <div className={styles.facebookDeliveryPage}>
      <div className={styles.container}>
        <div className={styles.leftBlock}>
          <div className={styles.title}>{props.switchGoogleStyle ? 'Google投放' : 'Facebook投放'}</div>
          <div className={styles.listWrapper}>
            <div className={styles.listItem}>
              <div className={styles.itemTitle}>
                <ListItemIcon />
                {props.switchGoogleStyle ? '广告覆盖面广' : '庞大的用户群体'}
              </div>
              <div className={styles.itemContent}>
                {props.switchGoogleStyle
                  ? 'Google是全球最大的搜索引擎和广告平台之一，每天有数以亿计的用户通过Google搜索信息'
                  : 'Facebook 在全球拥有超过20亿的活跃用户，是用户数量最大、覆盖范围最广的社交媒体之一'}
              </div>
            </div>

            <div className={styles.listItem}>
              <div className={styles.itemTitle}>
                <ListItemIcon />
                {props.switchGoogleStyle ? '精准广告定位' : '精准的广告受众'}
              </div>
              <div className={styles.itemContent}>
                {props.switchGoogleStyle
                  ? '强大的广告定位技术，可以根据用户搜索历史、地理位置、设备类型和其他信息来定位广告，进而将广告精准地投放给潜在客户，从而提高广告效果和ROI'
                  : 'Facebook 可以从国家、职业、行为、兴趣等维度，进行精准的受众定位，让广告的效费比最大化'}
              </div>
            </div>

            <div className={styles.listItem}>
              <div className={styles.itemTitle}>
                <ListItemIcon />
                {props.switchGoogleStyle ? '丰富的广告格式' : '丰富的广告形式'}
              </div>
              <div className={styles.itemContent}>
                {props.switchGoogleStyle
                  ? '多种广告格式，包括搜索广告、展示广告、视频广告、应用广告等，根据客户需求选择最适合的广告格式'
                  : 'Facebook 支持官网引流、留资表单、WhatsApp引流等多样化的广告转化目标，让您高效获客'}
              </div>
            </div>

            <div className={styles.listItem}>
              <div className={styles.itemTitle}>
                <ListItemIcon />
                {props.switchGoogleStyle ? '数据分析和优化' : '灵活的广告策略'}
              </div>
              <div className={styles.itemContent}>
                {props.switchGoogleStyle
                  ? '丰富的数据分析和优化工具，随时监测广告效果和ROI，并根据数据调整广告投放策略。帮助客户更好地了解客户需求和市场趋势，从而制定更有效的广告策略'
                  : 'Facebook 广告的投放预算与投放配置可快速调整、频繁迭代，用最短的时间完成广告优化'}
              </div>
            </div>
          </div>

          <div className={styles.consultBtnWrapper}>
            <Button btnType="primary" style={{ width: 236, height: 36 }} onClick={() => setShowConsultModal(true)}>
              立即咨询
            </Button>
          </div>
        </div>
        <div className={styles.rightBlock}>
          <div className={styles.imgContainer}>
            <img src={FaceBookImage} />
          </div>
        </div>
      </div>

      <TrafficDeliveryConsultModal open={showConsultModal} onClose={() => setShowConsultModal(false)} />
    </div>
  );
};

export default FacebookDelivery;
