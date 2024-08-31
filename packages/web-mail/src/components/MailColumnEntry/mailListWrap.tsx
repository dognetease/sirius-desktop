import React, { useMemo, useCallback } from 'react';
import { Dropdown } from 'antd';
import MailMenu from './menu';
import MailMenuMult from './multMenu';
import { MailEntryModel, CommonMailMenuConfig } from 'api';

const MailListWrap: React.FC<any> = props => {
  const { activeMailId, visible, setVisible } = props;
  const isMult = useMemo(() => {
    return Array.isArray(activeMailId) && activeMailId.length > 1;
  }, [activeMailId]);

  const domPropsRender = useCallback((mails: MailEntryModel, menuConfig: CommonMailMenuConfig) => {
    return {
      'data-test-id': 'mail-menu-list-' + menuConfig?.key,
    };
  }, []);

  return (
    <Dropdown
      overlayClassName="u-tree-dropmenu"
      visible={visible}
      onVisibleChange={visible => {
        visible ? '' : setVisible(visible);
      }}
      placement="bottomLeft"
      overlay={
        isMult ? (
          <MailMenuMult {...props} visible={visible} setVisible={setVisible} domProps={domPropsRender} />
        ) : (
          <MailMenu {...props} visible={visible} setVisible={setVisible} domProps={domPropsRender} />
        )
      }
      trigger={['contextMenu']}
    >
      <div>{props.children}</div>
    </Dropdown>
  );
};

export default MailListWrap;
