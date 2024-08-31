import React, { useEffect } from 'react';
import { ModalProps } from 'antd';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { recData as recDataType } from '../../customs/customs';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import style from './levelDrawer.module.scss';
import classNames from 'classnames';
import { getIn18Text, IsPageSwitchItem } from 'api';
interface Props {
  recData: recDataType;
  onClose: (param: number, closeAll?: boolean) => void;
  onOpen: (content: any, zIndex: number) => void;
  maxLevel?: number;
  onCollectIdChange?(params: { collectId?: string | number | null; country?: string; companyName?: string }): void;
  onChangeListItem?(params: { extraData: any; country?: string; companyName?: string }): void;
  getContainer?: ModalProps['getContainer'];
  zIndex?: number;
  type?: string;
  children?: React.ReactNode;
  switchOption?: IsPageSwitchItem;
}
const RepeatDrawer: React.FC<Props> = ({
  onClose,
  onOpen,
  onCollectIdChange,
  onChangeListItem,
  recData,
  maxLevel,
  children: childrenDom,
  getContainer,
  zIndex: drawerIndex,
  type,
  switchOption,
}) => {
  useEffect(() => {
    console.log('_recDataArr_children', recData, maxLevel, childrenDom);
  }, [recData]);
  const renderDrawer = (data: recDataType) => {
    const { visible, zIndex, children, to, content, origin } = data;
    return (
      <Drawer
        className={classNames({
          [style.levelDrawer]: zIndex > 1,
        })}
        visible={visible}
        maskStyle={{ background: 'transparent' }}
        onClose={() => onClose(zIndex)}
        getContainer={getContainer || document.body}
        zIndex={drawerIndex}
      >
        <>
          {React.Children.map(childrenDom, child => {
            if (!React.isValidElement(child)) {
              return null;
            }
            const childProps = {
              zIndex: zIndex,
              to,
              visible: visible,
              content,
              onCollectIdChange,
              onChangeListItem,
              type,
              origin,
              onOpen: (content: recDataType['content']) => {
                // console.log('xxxxz-index', zIndex);
                if (maxLevel && zIndex >= maxLevel) {
                  Toast.warning({ content: getIn18Text('CHAOGUOXIAZUANCENGSHU') });
                } else {
                  onOpen(content, zIndex + 1);
                }
              },
              onClose: (zIndex: number, all: boolean) => {
                onClose(zIndex, all);
              },
              switchOption: !zIndex ? switchOption : undefined,
            };
            return React.cloneElement(child, childProps);
          })}
          {to && children && renderDrawer(children)}
        </>
      </Drawer>
    );
  };
  return renderDrawer(recData);
};
RepeatDrawer.defaultProps = {
  maxLevel: 2, // 最多查看三层
};
export default RepeatDrawer;
