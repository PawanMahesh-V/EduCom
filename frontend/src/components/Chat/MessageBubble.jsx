import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserSecret } from '@fortawesome/free-solid-svg-icons';

const MessageBubble = ({ 
  msg, 
  userId, 
  isSelectionMode, 
  isSelected, 
  onToggleSelection, 
  onContextMenu 
}) => {
  const isOwnMessage = msg.sender_id === userId || msg.senderId === userId;
  const isAnonymous = msg.is_anonymous;
  
  // Normalizing properties between DM and Community messages
  const senderName = msg.sender_name || msg.sender || 'Unknown';
  const content = msg.content || msg.text;
  const time = msg.created_at 
    ? new Date(msg.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' }) 
    : msg.time;

  return (
    <div 
      id={`message-${msg.id}`}
      className={`chat-message ${isOwnMessage ? 'sent' : 'received'} ${isSelected ? 'selected' : ''} ${isSelectionMode && isOwnMessage ? 'selectable' : ''}`}
      onClick={isSelectionMode && isOwnMessage ? (e) => { e.stopPropagation(); onToggleSelection(msg.id); } : undefined}
      onContextMenu={(e) => onContextMenu && onContextMenu(e, msg)}
      style={isSelectionMode && isOwnMessage ? { cursor: 'pointer' } : {}}
    >
      {isSelectionMode && isOwnMessage && (
        <div className="message-checkbox" onClick={(e) => e.stopPropagation()}>
          <input 
            type="checkbox" 
            checked={Boolean(isSelected)}
            onChange={(e) => { e.stopPropagation(); onToggleSelection(msg.id); }}
          />
        </div>
      )}
      <div className={`chat-message-bubble ${isOwnMessage ? 'sent' : 'received'} ${isAnonymous ? 'anonymous-message' : ''}`}>
        {!isOwnMessage && (
          <div className="chat-message-sender">
            {isAnonymous ? (
              <>
                <FontAwesomeIcon icon={faUserSecret} className="anonymous-icon-left" />
                Anonymous Student
              </>
            ) : (
              senderName
            )}
          </div>
        )}
        <div className="chat-message-text">{content}</div>
        <div className="chat-message-time">
          {time}
          {isAnonymous && isOwnMessage && (
            <span className="anonymous-indicator" title="Sent anonymously">
              <FontAwesomeIcon icon={faUserSecret} className="anonymous-icon-right" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
