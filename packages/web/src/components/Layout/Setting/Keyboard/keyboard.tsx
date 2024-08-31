import { getIn18Text } from 'api';
import React from 'react';

import { util, apiHolder } from 'api';
import classnames from 'classnames';
import { navigate } from 'gatsby';
import styles from './index.module.scss';
import { getBodyFixHeight } from '@web-common/utils/constant';
import { ReactComponent as DeleteIcon } from '../../../../images/icons/setting/keyboard_delete.svg';
import SiriusModel from '@web-common/components/UI/Modal/SiriusModal';

interface KeyboardProps {
  noBorder?: boolean;
  left?: number;
}

interface KeyboardModelProps {
  visible: boolean;
  onCancel: () => void;
}
interface KeyProp {
  title: string;
  content: Array<{
    name: string;
    key: string | any;
    show?: boolean;
  }>;
}
const isElectron = apiHolder.env.forElectron;
export const Keyboard: React.FC<KeyboardProps> = ({ noBorder, left = 16 }) => {
  const command = util.getCommonTxt();
  const shift = 'Shift';
  const enter = '↵';
  const up = '↑';
  const down = '↓';
  const mouseLeft = getIn18Text('ZUOJIAN');
  const del = <DeleteIcon />;
  const separator = ' ';

  const globalList = [
    {
      name: getIn18Text('CHAKANQUANBUKUAI'),
      key: command + separator + '/',
    },
    {
      name: getIn18Text('YINCANGZHUMIANBAN'),
      key: command + separator + 'W',
      show: isElectron,
    },
    {
      name: getIn18Text('ZUIXIAOHUA'),
      key: command + separator + 'M',
      show: isElectron,
    },
    {
      name: getIn18Text('QUANXUAN'),
      key: command + separator + 'A',
      show: false,
    },
    {
      name: getIn18Text('FANGDATUPIAN'),
      key: command + separator + '+',
      show: isElectron,
    },
    {
      name: getIn18Text('FANGXIAOTUPIAN'),
      key: command + separator + '-',
      show: isElectron,
    },
    {
      name: getIn18Text('BAOCUNTUPIAN'),
      key: command + separator + 'S',
      show: isElectron,
    },
    {
      name: getIn18Text('DAKAISHEZHI'),
      key: command + separator + '0',
      show: isElectron,
    },
    {
      name: getIn18Text('DAKAIYOUXIANG'),
      key: command + separator + '1',
      show: isElectron,
    },
    {
      name: getIn18Text('DAKAIXIAOXI'),
      key: command + separator + '2',
      show: isElectron,
    },
    {
      name: getIn18Text('DAKAIRILI'),
      key: command + separator + '3',
      show: isElectron,
    },
    {
      name: getIn18Text('DAKAI“YUNWEN'),
      key: command + separator + '4',
      show: isElectron,
    },
    {
      name: getIn18Text('DAKAI“TONGXUN'),
      key: command + separator + '5',
      show: isElectron,
    },
    {
      name: getIn18Text('DAKAIYINGXIAO'),
      key: command + separator + '6',
      show: isElectron,
    },
    {
      name: getIn18Text('DAKAIKEHU'),
      key: command + separator + '7',
      show: isElectron,
    },
  ];
  const mailList = [
    {
      name: getIn18Text('SHANGYIFENGYOUJIAN'),
      key: up,
    },
    {
      name: getIn18Text('XIAYIFENGYOUJIAN'),
      key: down,
    },
    {
      name: getIn18Text('SHANCHUYOUJIAN'),
      key: [del],
    },
    {
      name: getIn18Text('DUOXUANYOUJIAN'),
      key: command + separator + mouseLeft,
    },
    {
      name: getIn18Text('LIANXUDUOXUANYOU'),
      key: shift + separator + mouseLeft,
    },
    {
      name: getIn18Text('XUANZHONGYOUJIANXIN'),
      key: command + separator + 'R',
    },
    {
      name: getIn18Text('FASONGYOUJIAN'),
      key: command + separator + enter,
    },
  ];
  const imList = [
    {
      name: getIn18Text('FAXIAOXI'),
      key: enter,
    },
    {
      name: getIn18Text('SHANGYIFENGXIAOXI'),
      key: up,
      show: false,
    },
    {
      name: getIn18Text('XIAYIFENGXIAOXI'),
      key: down,
      show: false,
    },
    {
      name: getIn18Text('HUANXING'),
      key: shift + separator + enter + getIn18Text('，HUOZHE') + command + separator + enter,
    },
    {
      name: getIn18Text('KUAIJIESOUSUO'),
      key: command + separator + 'F',
    },
  ];
  const diskList = [
    {
      name: getIn18Text('KUAIJIESOUSUO'),
      key: command + separator + 'F',
    },
  ];

  const keyList: KeyProp[] = [
    {
      title: getIn18Text('QUANJU'),
      content: globalList,
    },
    {
      title: getIn18Text('YOUXIANG'),
      content: mailList,
    },
    {
      title: getIn18Text('XIAOXI'),
      content: imList,
    },
    {
      title: getIn18Text('YUNWENDANG'),
      content: diskList,
    },
  ];
  return (
    <div className={styles.keyboardWrap}>
      {keyList.map(obj => (
        <div
          className={classnames(styles.keyTable, {
            [styles.noBorder]: noBorder,
          })}
          key={obj.title}
        >
          <div style={{ paddingLeft: left }} className={styles.keyTitle}>
            {obj.title}
          </div>
          <div className={styles.keyContent}>
            {obj.content.map(item => (
              <div className={styles.keyRow} hidden={item.show === undefined ? false : !item.show} key={item.name}>
                <div style={{ marginLeft: left }} className={styles.label}>
                  {item.name}
                </div>
                <div className={styles.key}>
                  {typeof item.key === 'string'
                    ? item.key
                    : item.key.map((keyItem: any) => (
                        <>
                          {keyItem}
                          <span>&nbsp;</span>
                        </>
                      ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
export const KeyboardModel: React.FC<KeyboardModelProps> = ({ visible, onCancel }) => (
  <SiriusModel onCancel={onCancel} visible={visible} footer={null} title={getIn18Text('KUAIJIEJIAN')} width={476} height={480} className={styles.keyboardModelWrap}>
    <Keyboard noBorder left={24} />
  </SiriusModel>
);
const KeyboardConfig: React.FC<{
  isVisible?: boolean;
}> = ({ isVisible }) => (
  <>
    <div className={styles.settingMenu} style={{ top: getBodyFixHeight(true) }} hidden={!isVisible}>
      <div className={styles.configTitle}>
        <div className={styles.configTitleName}>{getIn18Text('KUAIJIEJIAN')}</div>
        <div onClick={() => navigate(-1)} className={`dark-invert ${styles.configTitleIcon}`} />
      </div>
      <div className={styles.configContent}>
        <div className={styles.configContentWrap}>
          <Keyboard />
        </div>
      </div>
    </div>
  </>
);
export default KeyboardConfig;
