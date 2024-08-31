import React from 'react';
import classnames from 'classnames';
import { Dropdown, Menu, Tooltip } from 'antd';
import { EdmEmailInfo, getIn18Text, ReplyTabEnum } from 'api';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { remarketingType } from '../RemarketingDrawer/remarketingDrawer';
import { ReactComponent as ArrowDown } from '@/images/icons/arrow-down.svg';
import { ReactComponent as TipsIcon } from '@/images/icons/edm/tips-icon.svg';
import styles from './remarketingDropdown.module.scss';

interface RemarketingDropdownProps {
  // 任务相关信息
  info?: EdmEmailInfo;
  // 点击回调
  handleClick: (type?: remarketingType, key?: string) => void;
  type?: remarketingType;
  needDropdown?: boolean;
}

const RemarketingDropdown = (props: RemarketingDropdownProps) => {
  const { info, handleClick, type, needDropdown = false } = props;
  return needDropdown ? (
    <Dropdown.Button
      className={classnames(styles.dropdownButton, type ? {} : styles.gray)}
      onClick={() => handleClick(type)}
      icon={<ArrowDown />}
      trigger={['click']}
      overlay={
        <Menu onClick={({ key }) => handleClick(type, key)}>
          <Menu.Item key="copyContent">
            <div className={styles.toolTipContent}>
              {getIn18Text('FUZHIYUANYOUJIANNEIRONG')}
              <Tooltip title={getIn18Text('XIEXINYOUJIANSHIZHIRUYUANYOUJIANZHENGWEN')}>
                <TipsIcon />
              </Tooltip>
            </div>
          </Menu.Item>
          <Menu.Item key="copyHeader" disabled={info?.replyTab !== ReplyTabEnum.AVAILABLE}>
            {info?.replyTab !== ReplyTabEnum.AVAILABLE ? (
              <Tooltip title={getIn18Text('RUXUSHIYONGGAIGONGNENG\uFF0CXUXIANZAICHUANGJIANRENWU-SHOUJIANRENJIEMIANGOUXUAN\u3010TONGBUDAOWANGLAIYOUJIAN\u3011')}>
                <div className={styles.toolTipContent}>
                  <span>{getIn18Text('YUANYOUJIANZUOWEIYINYONG')}</span>
                  <TipsIcon />
                </div>
              </Tooltip>
            ) : (
              <div className={styles.toolTipContent}>
                <span>{getIn18Text('YUANYOUJIANZUOWEIYINYONG')}</span>
                <Tooltip title={getIn18Text('XIEXINYOUJIANSHIJIANGYUAN')}>
                  <TipsIcon />
                </Tooltip>
              </div>
            )}
          </Menu.Item>
        </Menu>
      }
    >
      {type ? getIn18Text('DANCIFAXIN') : getIn18Text('ZAICIYINGXIAO')}
    </Dropdown.Button>
  ) : (
    <Button btnType="minorLine" onClick={() => handleClick(type)}>
      {getIn18Text('DANCIFAXIN')}
    </Button>
  );
};

export default RemarketingDropdown;
