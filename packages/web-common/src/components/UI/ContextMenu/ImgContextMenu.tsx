import { Dropdown, Image, ImageProps, Menu, Button } from 'antd';
import React from 'react';
import { apiHolder as api, SystemApi } from 'api';
import { downloadImg, handleCopyImg } from '@web-mail/components/ReadMail/util';
import styles from './contextmenu.module.scss';
import { getIn18Text } from 'api';
const systemApi = api.api.getSystemApi() as SystemApi;
interface TitleRightContextMenuProps {
  src?: string;
  children: React.ReactNode;
  name?: string;
  ext?: string;
}
const ImgContextMenu: React.FC<TitleRightContextMenuProps> = ({ src, name, children, ext }) => {
  if (!systemApi.isElectron()) {
    return <>{children}</>;
  }
  return (
    <Dropdown
      overlay={
        <Menu className={styles.dropdownMenu}>
          <Menu.Item
            key="1"
            onClick={async () => {
              handleCopyImg(undefined, src, ext);
            }}
          >
            <Button>{getIn18Text('FUZHITUPIAN')}</Button>
          </Menu.Item>
          <Menu.Item
            key="2"
            onClick={() => {
              downloadImg(src, name);
            }}
          >
            {getIn18Text('XIAZAITUPIAN')}
          </Menu.Item>
        </Menu>
      }
      trigger={['contextMenu']}
    >
      {children}
    </Dropdown>
  );
};
ImgContextMenu.defaultProps = {
  src: '',
  name: '',
  ext: '',
};
interface proImageProps extends ImageProps {
  ext?: string;
  originSrc?: string;
}
export const withImageContext = (ImageComponent: typeof Image) =>
  class extends React.PureComponent<proImageProps, {}> {
    render() {
      const { src, alt, ext } = this.props;
      // @ts-ignore
      const { originSrc, ...myProps } = this.props;
      return (
        <ImgContextMenu src={originSrc || src} name={alt} ext={ext}>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <ImageComponent {...myProps} />
        </ImgContextMenu>
      );
    }
  };
export default ImgContextMenu;
