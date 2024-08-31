import React, { useEffect, useContext } from 'react';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import Chat from './chat';
import MessageContext from '../../context/messageContext';
import style from './chatDrawer.module.scss';

interface ChatDrawerProps {
  contactWhatsApp: string | null;
  visible: boolean;
  onClose: () => void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = props => {
  const { contactWhatsApp, visible, onClose } = props;

  const { pullMessageByWhatsApp } = useContext(MessageContext);

  useEffect(() => {
    if (visible && contactWhatsApp) {
      pullMessageByWhatsApp(contactWhatsApp);

      let pullTimer = setInterval(() => {
        pullMessageByWhatsApp(contactWhatsApp);
      }, 3000);

      return () => pullTimer && clearInterval(pullTimer);
    }

    return () => {};
  }, [visible, contactWhatsApp]);

  return (
    <Drawer className={style.chatDrawer} visible={visible} onClose={onClose}>
      {contactWhatsApp && <Chat contactWhatsApp={contactWhatsApp} />}
    </Drawer>
  );
};

export default ChatDrawer;
