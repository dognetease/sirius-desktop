import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { apiHolder, ContactApi, ContactModel } from 'api';
import classnames from 'classnames/bind';
import { Popover } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import style from '@web-im/common/usercard/userCard.module.scss';
import ContactDetail from '@web-contact/component/Detail/detail';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
const contactApi = apiHolder.api.requireLogicalApi('contactApi') as ContactApi;
interface UserCardProps {
  userId?: string;
  contactInfo?: ContactModel;
}
interface Coordinate {
  x: number;
  y: number;
}
/**
 * 计算popup 定位
 * @param sourceRect hover 目标
 * @param cardRect 浮层卡片
 * @returns fixed 的坐标
 */
function popupPostionCooperate(sourceRect: Pick<DOMRect, 'width' | 'height' | 'x' | 'y'>, cardRect: Pick<DOMRect, 'width' | 'height'>): Coordinate {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  let positionX;
  let positionY;
  if (sourceRect.x + sourceRect.width + cardRect.width < windowWidth) {
    positionX = sourceRect.x + sourceRect.width;
  } else if (sourceRect.x - cardRect.width > 0) {
    positionX = sourceRect.x - cardRect.width;
  } else {
    positionX = windowWidth / 2 - cardRect.width / 2;
  }
  if (sourceRect.y + sourceRect.height + cardRect.height < windowHeight) {
    positionY = sourceRect.y + sourceRect.height;
  } else if (sourceRect.y - cardRect.height > 0) {
    positionY = sourceRect.y - cardRect.height;
  } else {
    positionY = windowHeight / 2 - cardRect.height / 2;
  }
  return {
    x: positionX,
    y: positionY,
  };
}
export const UserCard = React.forwardRef<HTMLDivElement, UserCardProps>(({ userId, contactInfo }, ref) => {
  const [contact, setContact] = useState<ContactModel>();
  // 查询contact信息
  useEffect(() => {
    if (contactInfo) {
      setContact(contactInfo);
      return;
    }
    if (userId) {
      contactApi.doGetContactById(userId).then(infos => {
        if (!infos.length) {
          message.error(getIn18Text('HUOQUBUDAOYONG'));
          return;
        }
        setContact(infos[0]);
      });
    }
  }, [userId]);
  return (
    <div className={`extheme ${realStyle('userCardWrapper')}`} ref={ref}>
      {contact && <ContactDetail contactId={contact.contact.id} contact={contact} branch />}
    </div>
  );
});
interface IConcatListPosition {
  top?: number;
  left?: number;
  height?: number;
}
interface UserCardMentionClassState {
  isSourceHover: boolean;
  isCardHover: boolean;
  userId: string;
  senceType?: 'canvas' | 'div';
  position?: IConcatListPosition;
}
let hideDelayTimer: any = null;
/**
 * 单例模式，同时只能实例化一个
 */
export class UserCardMention extends React.PureComponent<{}, UserCardMentionClassState> {
  wrapEl: HTMLDivElement = document.createElement('div');
  constructor(props: {}) {
    super(props);
    this.state = {
      isSourceHover: false,
      isCardHover: false,
      userId: '',
      position: undefined,
    };
  }
  componentDidMount() {
    document.body.appendChild(this.wrapEl);
    window.addEventListener('message', this.messageHandle);
  }
  componentWillUnmount() {
    document.body.removeChild(this.wrapEl);
    window.removeEventListener('message', this.messageHandle);
  }
  messageHandle = (e: MessageEvent) => {
    const info = e.data;
    if (!info.type) {
      return;
    }
    const { data } = info;
    switch (info.type) {
      case 'showUserAvatarCardByAvatar':
        clearTimeout(hideDelayTimer);
        this.setState({
          userId: data.userId,
          position: data.position,
          isSourceHover: true,
        });
        if (data.position) {
          const { position, eventFrom } = data;
          const coordinate =
            eventFrom === 'canvas'
              ? popupPostionCooperate(
                  {
                    x: position.x,
                    y: position.y + 93,
                    width: position.width,
                    height: position.height,
                  },
                  {
                    width: 320,
                    height: 441,
                  }
                )
              : popupPostionCooperate(position as DOMRect, {
                  width: 320,
                  height: 441,
                });
          this.wrapEl.setAttribute('style', `position:fixed;top:${coordinate.y + 55}px;left:${coordinate.x}px;z-index:10;background:white;`);
        }
        break;
      case 'hideUserAvatarCardByAvatar':
        // 在bulb代码里，hideUserAvatarCardByAvatar 事件触发来自useEffect 的返回函数里。
        // 因此在一次操作中，会触发多次事件。因此这里需要清理一下
        clearTimeout(hideDelayTimer);
        hideDelayTimer = setTimeout(() => {
          this.setState({
            isSourceHover: false,
          });
        }, 60);
        break;
      default:
        break;
    }
  };
  render(): React.ReactNode {
    const { state } = this;
    if ((state.isCardHover || state.isSourceHover) && state.userId && state.position) {
      return ReactDOM.createPortal(
        <div
          className="ant-popover-inner"
          onMouseEnter={() => {
            this.setState({
              isCardHover: true,
            });
          }}
          onMouseLeave={() => {
            this.setState({
              isCardHover: false,
            });
          }}
        >
          <UserCard userId={state.userId} />
        </div>,
        this.wrapEl
      );
    }
    return null;
  }
}
export interface UserCardPopoverProps extends UserCardProps {
  placement?: 'bottom' | 'left' | 'right';
  trigger?: 'click';
  zIndex?: number;
  minWidth?: string;
}
export const UserCardPopover: React.FC<UserCardPopoverProps> = ({
  userId,
  contactInfo,
  placement = 'bottom',
  trigger = 'click',
  minWidth = '320px',
  zIndex = 999,
  children,
}) => {
  const [visible, setVisible] = useState(false);
  function onVisibleChange(newVisible: boolean) {
    setVisible(newVisible);
  }
  function windowBlur() {
    setVisible(false);
  }
  useEffect(() => {
    window.addEventListener('blur', windowBlur);
    return () => {
      window.removeEventListener('blur', windowBlur);
    };
  }, []);
  return (
    <Popover
      content={<UserCard userId={userId} contactInfo={contactInfo} />}
      placement={placement}
      trigger={trigger}
      overlayStyle={{ minWidth }}
      zIndex={zIndex}
      visible={visible}
      onVisibleChange={onVisibleChange}
    >
      {children}
    </Popover>
  );
};
