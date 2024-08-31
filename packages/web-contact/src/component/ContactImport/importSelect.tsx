import React, { useState } from 'react';
import { Dropdown, Menu } from 'antd';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import classnames from 'classnames';
import styles from './modal.module.scss';
import IconCard from '@web-common/components/UI/IconCard';
import { getIn18Text } from 'api';

interface Props {
  // type 0：导出 1：导入
  onSelect?(type: 'import' | 'export'): void;
}

export default (props: Props) => {
  const { onSelect } = props;
  const [visible, setVisible] = useState<boolean>(false);
  const attr = visible ? { stroke: '#4C6AFF' } : {};
  return (
    <Dropdown
      overlayClassName={styles.titleIconDropMenu}
      placement="bottomRight"
      onVisibleChange={visible => {
        setVisible(visible);
      }}
      visible={visible}
      overlay={() => (
        <Menu>
          <Menu.Item
            key="export"
            onClick={({ domEvent }) => {
              domEvent.stopPropagation();
              onSelect && onSelect('export');
              setVisible(false);
            }}
          >
            {getIn18Text('exportContact')}
          </Menu.Item>
          <Menu.Item
            key="import"
            onClick={({ domEvent }) => {
              domEvent.stopPropagation();
              onSelect && onSelect('import');
              setVisible(false);
            }}
          >
            {getIn18Text('importContacts')}
          </Menu.Item>
        </Menu>
      )}
      trigger={['click']}
    >
      <div className={classnames('dark-svg-invert', styles.importSelectBtn, visible && styles.selected)}>
        <span>{getIn18Text('importOrExport')}</span>
        <IconCard type="tongyong_jiantou_xia" className="dark-invert" width={16} height={16} style={{ marginLeft: 4 }} {...attr} />
      </div>
    </Dropdown>
  );
};

//   <EnhanceSelect bordered={false} placeholder={"导入/导出"} onSelect={onSelect} >
//   <InSingleOption value="export" key={'export'}>{'导出联系人'}</InSingleOption>
//   <InSingleOption value="import" key={'import'}>{'导入联系人'}</InSingleOption>
// </EnhanceSelect>
