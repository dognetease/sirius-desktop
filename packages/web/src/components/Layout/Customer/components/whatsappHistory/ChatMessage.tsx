import React, { useEffect, useRef } from 'react';
import './ChatMessage.css';

interface ChatMessageProps {
  isUser: boolean;
  avatarUrl?: string;
  message: string | React.ReactElement;
  timestamp: string;
  isHighlight: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ isUser, avatarUrl, message, timestamp, isHighlight }) => {
  const messageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isHighlight) {
      if (messageRef.current) {
        messageRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [isHighlight]);
  return (
    <div className={`chat-message ${isUser ? 'user' : 'other'} ${isHighlight ? 'highlighted' : ''}`} ref={messageRef}>
      {!isUser && avatarUrl && <img src={avatarUrl} alt="Avatar" className="avatar" />}
      <div className={`message-container ${isUser ? 'user' : 'other'}`}>
        <div className="message">
          <pre>{message}</pre>
          <div className="timestamp">{timestamp}</div>
        </div>
      </div>
      {isUser && avatarUrl && <img src={avatarUrl} alt="Avatar" className="avatar" />}
    </div>
  );
};

export default ChatMessage;
