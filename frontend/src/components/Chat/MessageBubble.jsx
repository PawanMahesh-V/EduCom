import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserSecret, faCheck, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

const MessageBubble = ({ 
  msg, 
  userId, 
  isSelectionMode, 
  isSelected, 
  onToggleSelection, 
  onContextMenu 
}) => {
  const senderId = msg.sender_id ?? msg.senderId;
  const isOwnMessage = Number(senderId) === Number(userId);
  const isAnonymous = msg.is_anonymous;
  
  // Normalizing properties between DM and Community messages
  const senderName = msg.sender_name || msg.sender || 'Unknown';
  const content = msg.content || msg.text;
  const time = msg.created_at 
    ? new Date(msg.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' }) 
    : msg.time;

  // Message status for tick marks (only for own messages and direct messages)
  const getMessageStatus = () => {
    if (!isOwnMessage) return null;

    if (msg.moderation_blocked) {
      return 'blocked';
    }

    if (msg.community_id) return null; // No ticks for normal community messages
    
    if (msg.read_at || msg.is_read) {
      return 'read'; // Double blue ticks
    } else if (msg.delivered_at) {
      return 'delivered'; // Double grey ticks
    } else {
      return 'sent'; // Single grey tick
    }
  };

  const messageStatus = getMessageStatus();

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
          {messageStatus && (
            <span className={`message-status-ticks ${messageStatus}`} title={
              messageStatus === 'blocked' ? 'Blocked: not delivered' :
              messageStatus === 'read' ? 'Read' :
              messageStatus === 'delivered' ? 'Delivered' :
              'Sent'
            }>
              {messageStatus === 'blocked' && (
                <FontAwesomeIcon icon={faCircleExclamation} className="status-icon-blocked" />
              )}
              {messageStatus === 'sent' && (
                <FontAwesomeIcon icon={faCheck} className="tick-icon" />
              )}
              {(messageStatus === 'delivered' || messageStatus === 'read') && (
                <>
                  <FontAwesomeIcon icon={faCheck} className="tick-icon tick-1" />
                  <FontAwesomeIcon icon={faCheck} className="tick-icon tick-2" />
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
