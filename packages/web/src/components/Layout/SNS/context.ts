import React from 'react';

export const defaultChatContext = {
  chatBodyColor: '#FFFFFF',
  chatEditorColor: '#FFFFFF',
  receiveMessageColor: '#F6F7FA',
  sendMessageColor: '#F2F5FF',
  onlySendImage: false,
  sendTextMaxLength: 2000,
};

interface ChatContextType {
  chatBodyColor: string;
  chatEditorColor: string;
  receiveMessageColor: string;
  sendMessageColor: string;
  onlySendImage: boolean;
  sendTextMaxLength: number;
}

export const ChatContext = React.createContext<ChatContextType>(defaultChatContext);
