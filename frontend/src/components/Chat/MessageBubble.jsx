import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserSecret,
  faCheck,
  faCircleExclamation,
  faFlag,
  faTimes,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';

const MessageBubble = ({ 
  msg, 
  userId, 
  isSelectionMode, 
  isSelected, 
  onToggleSelection, 
  onContextMenu,
  onReport,        // (messageId, reason) => Promise<void>
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

  // ------- Report state -------
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportState, setReportState] = useState('idle'); // 'idle' | 'submitting' | 'done'

  const canReport = !isOwnMessage && !msg.moderation_blocked && !msg.message_type;

  const handleReportSubmit = async () => {
    if (reportState === 'submitting' || reportState === 'done') return;
    setReportState('submitting');
    try {
      await onReport(msg.id, reportReason.trim() || undefined);
      setReportState('done');
      setShowReportMenu(false);
      setReportReason('');
    } catch (err) {
      setReportState('idle');
    }
  };

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
      className={`chat-message ${isOwnMessage ? 'sent' : 'received'} ${isSelected ? 'selected' : ''} ${isSelectionMode && isOwnMessage ? 'selectable' : ''} ${canReport ? 'reportable' : ''}`}
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
      {messageStatus === 'blocked' && (
        <div className="blocked-message-warning-outside">
          (Message blocked: Abusive or sensitive content)
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
              `${senderName}`
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

      {/* ── Report button (hover-reveal, received messages only) ── */}
      {canReport && !isSelectionMode && (
        <div className="message-report-action">
          {reportState === 'done' ? (
            <span className="report-done-badge" title="You reported this message">
              <FontAwesomeIcon icon={faFlag} /> Reported
            </span>
          ) : (
            <button
              className="report-flag-btn"
              title="Report this message"
              onClick={(e) => { e.stopPropagation(); setShowReportMenu(v => !v); }}
            >
              <FontAwesomeIcon icon={faFlag} />
            </button>
          )}

          {/* Inline reason dialog */}
          {showReportMenu && reportState !== 'done' && (
            <div className="report-reason-popup" onClick={e => e.stopPropagation()}>
              <div className="report-reason-header">
                <span>Report Message</span>
                <button className="report-close-btn" onClick={() => { setShowReportMenu(false); setReportReason(''); }}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <textarea
                className="report-reason-input"
                placeholder="Reason (optional)..."
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                rows={2}
                maxLength={300}
              />
              <button
                className="report-submit-btn"
                disabled={reportState === 'submitting'}
                onClick={handleReportSubmit}
              >
                {reportState === 'submitting' ? 'Submitting…' : (
                  <><FontAwesomeIcon icon={faPaperPlane} /> Submit Report</>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
