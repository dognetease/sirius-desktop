import React from 'react';
import { Row, Col } from 'antd';
import { ReactComponent as CustomMailIcon } from '@/images/icons/edm/autoMarket/customMail.svg';
import { ReactComponent as SelectMailTempIcon } from '@/images/icons/edm/autoMarket/selectMailTemp.svg';
import { ReactComponent as SelectMailListIcon } from '@/images/icons/edm/autoMarket/selectMailList.svg';
import { getTransText } from '@/components/util/translate';
import style from './emailSource.module.scss';
import { getIn18Text } from 'api';

interface EmailSourceProps {
  onCustomClick: () => void;
  onEdmClick: () => void;
  onTemplateClick?: () => void;
}

const EmailSource: React.FC<EmailSourceProps> = props => (
  <>
    <div className={style.emailSource}>
      <Row gutter={12}>
        <Col span={8}>
          <div className={style.emailSourceItem} onClick={props.onCustomClick}>
            <CustomMailIcon />
            <div className={style.emailSourceName}>{getIn18Text('CustomMailContent')}</div>
          </div>
        </Col>
        <Col span={8}>
          <div className={style.emailSource}>
            <div className={style.emailSourceItem} onClick={props.onTemplateClick}>
              <SelectMailTempIcon />
              <div className={style.emailSourceName}>{getTransText('SelectEdmTemplate')}</div>
            </div>
          </div>
        </Col>
        <Col span={8}>
          <div className={style.emailSourceItem} onClick={props.onEdmClick}>
            <SelectMailListIcon />
            <div className={style.emailSourceName}>{getIn18Text('SelectMailContent')}</div>
          </div>
        </Col>
      </Row>
    </div>
  </>
);
export default EmailSource;
