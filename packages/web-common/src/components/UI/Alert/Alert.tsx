import React from 'react';
import { Button, ButtonProps, Modal, ModalFuncProps } from 'antd';
import { ModalFunc } from 'antd/lib/modal/confirm';
import { EventLevel } from 'api';
import classnames from 'classnames';
import Checkbox from 'antd/lib/checkbox/Checkbox';
import styles from './alert.module.scss';
import { AlertCloseIcon, AlertErrorIcon, InfoIcon, WarnIcon } from '../Icons/icons';
import { getBodyFixHeight } from '@web-common/utils/constant';
// import { ReactComponent as WarnIcon } from "../../../images/icons/alert/warn.svg";
import { getIn18Text } from 'api';
type AlertFunc = {
  [key in EventLevel]: ModalFunc;
};
interface AlertApi extends AlertFunc {
  destroyAll: () => void;
}
interface FuncBtn {
  /**
   * 按钮文字
   */
  text: string;
  /**
   * 按钮属性属性
   */
  btnProps?: Omit<ButtonProps, 'type' | 'onClick' | 'danger'>;
  /**
   * 靠左排列（默认靠右）
   */
  pullLeft?: boolean;
  /**
   * 点击事件,如果是nmr按钮 则会提供nmr参数
   */
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>, nmr?: boolean) => void;
  /**
   * 类型
   */
  type?: ButtonProps['type'];
  /**
   * 危险操作按钮
   */
  danger?: boolean;
  /**
   * 是否获取不再提醒，只要btns里面有一个此参数，则显示不再提醒按钮
   */
  nmr?: boolean;
}
/**
 * 调用方法时的入参，继承至ModalFuncProps
 */
export interface AlertFuncProps extends ModalFuncProps {
  /**
   * 弹窗底部功能按钮
   * 当此属性不会空时，只渲染数组里的按钮，默认渲染的按钮会被隐藏
   */
  funcBtns?: Array<FuncBtn>;
  /**
   * 是否显示底部上边框
   */
  footerTopBorder?: boolean;
  /**
   * 不再提醒按钮文字
   */
  nmrText?: string;
}
type BaseFuncProps = Partial<ModalFuncProps>;
/**
 * 消息弹窗，引用Modal的静态方法实例
 */
class Alert implements AlertApi {
  constructor() {
    this.modal = Modal;
  }
  private modal: typeof Modal;
  destroyAll() {
    this.modal.destroyAll();
  }
  info(e: AlertFuncProps) {
    return this.modal.info(
      Alert.mergeProps(e, {
        icon: <InfoIcon style={{ marginRight: '6px' }} />,
      })
    );
  }
  error(e: AlertFuncProps) {
    return this.modal.error(
      Alert.mergeProps(e, {
        icon: <AlertErrorIcon />,
      })
    );
  }
  confirm(e: AlertFuncProps) {
    return this.modal.confirm(
      Alert.mergeProps(e, {
        icon: <AlertErrorIcon />,
      })
    );
  }
  // todo
  debug(e: AlertFuncProps) {
    return this.warn(e);
  }
  warn(e: AlertFuncProps) {
    return this.modal.warning(
      Alert.mergeProps(e, {
        icon: <WarnIcon />,
      })
    );
  }
  private static mergeProps(userProps: AlertFuncProps, innerProps?: ModalFuncProps) {
    const baseProps = Alert.getCustomProps();
    const mergedProps: ModalFuncProps = {
      ...baseProps,
      ...innerProps,
      ...userProps,
    };
    if (userProps.funcBtns) {
      mergedProps.content = (
        <>
          {userProps.content}
          {Alert.renderFooter(userProps.funcBtns, userProps.nmrText)}
        </>
      );
    }
    mergedProps.className = classnames(mergedProps.className, {
      [styles.alertCustomBtns]: userProps.funcBtns,
      [styles.alertFooterBorder]: userProps.footerTopBorder,
      [styles.alertCustomContent]: mergedProps.icon === null,
      [styles.alertNoContent]: mergedProps.content === undefined,
    });
    return mergedProps;
  }
  private static renderFooter(funcBtns: Array<FuncBtn>, nmrText: string = getIn18Text('BUZAITIXING')) {
    let nrmValue: boolean = false;
    const isNmrAlert = funcBtns.find(b => b.nmr !== undefined) !== undefined;
    return (
      <div className={styles.btns}>
        {isNmrAlert && (
          <Checkbox
            className={styles.btnLeft}
            onChange={e => {
              nrmValue = e.target.checked;
            }}
          >
            {nmrText}
          </Checkbox>
        )}
        {funcBtns.map(b => {
          const { text, btnProps, pullLeft, nmr, onClick, ...rest } = b;
          let handleClick = onClick;
          if (nmr && isNmrAlert && onClick) {
            handleClick = e => {
              onClick(e, nrmValue);
            };
          }
          const appendProps: ButtonProps = {
            ...rest,
            ...btnProps,
            className: classnames(btnProps?.className, {
              [styles.btnLeft]: pullLeft,
            }),
          };
          return (
            // eslint-disable-next-line react/jsx-props-no-spreading
            <Button key={b.text} type={b.type} onClick={handleClick} {...appendProps}>
              {text}
            </Button>
          );
        })}
      </div>
    );
  }
  private static getCustomProps() {
    const props: BaseFuncProps = {
      className: styles.alert,
      width: 448,
      okText: getIn18Text('QUEDING'),
      cancelText: getIn18Text('QUXIAO'),
      zIndex: 1100,
      // okCancel: true,
      maskStyle: {
        top: getBodyFixHeight(),
      },
      transitionName: '',
      maskTransitionName: '',
      closable: false,
      closeIcon: <AlertCloseIcon />,
    };
    return props;
  }
}
export default new Alert();
