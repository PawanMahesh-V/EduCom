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
  onReport,
  userRole,
}) => {
  const senderId = msg.sender_id ?? msg.senderId;
  const isOwnMessage = Number(senderId) === Number(userId);
  const isAnonymous = msg.is_anonymous;
  
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

  const getMessageStatus = () => {
    if (msg.moderation_blocked) {
      return 'blocked';
    }

    if (!isOwnMessage) return null;

    if (msg.community_id) return null; 
    
    if (msg.read_at || msg.is_read) {
      return 'read'; 
    } else if (msg.delivered_at) {
      return 'delivered'; 
    } else {
      return 'sent'; 
    }
  };

  const messageStatus = getMessageStatus();

  return (
    <div 
      id={`message-${msg.id}`}
      className={`mb-message-row ${isOwnMessage ? 'mb-message-row--sent' : 'mb-message-row--received'} ${isSelected ? 'mb-message-row--selected' : ''} ${isSelectionMode && (isOwnMessage || userRole === 'Admin') ? 'mb-message-row--selectable' : ''} ${canReport ? 'mb-message-row--reportable' : ''}`}
      onClick={isSelectionMode && (isOwnMessage || userRole === 'Admin') ? (e) => { e.stopPropagation(); onToggleSelection(msg.id); } : undefined}
      onContextMenu={(e) => onContextMenu && onContextMenu(e, msg)}
    >
      {/* Moderation Block Banner Notice */}
      {messageStatus === 'blocked' && (
        <div className="mb-blocked-alert-text">
          (Message blocked: Abusive or sensitive language auto-detected)
        </div>
      )}

      {/* Bubble Wrapper for positioning elements beside the message */}
      <div className="mb-bubble-wrapper">
        {/* Checkbox Overlay for Selection Mode */}
        {isSelectionMode && (isOwnMessage || userRole === 'Admin') && (
          <div className="mb-action-checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
            <input 
              type="checkbox" 
              checked={Boolean(isSelected)}
              onChange={(e) => { e.stopPropagation(); onToggleSelection(msg.id); }}
            />
          </div>
        )}

        {/* Bubble Shell Container */}
        <div className={`mb-bubble ${isOwnMessage ? 'mb-bubble--sent' : 'mb-bubble--received'} ${isAnonymous ? 'mb-bubble--anonymous' : ''}`}>
          {!isOwnMessage && (
            <div className="mb-sender-label">
              {isAnonymous ? (
                <>
                  <FontAwesomeIcon icon={faUserSecret} className="mb-anonymous-icon" />
                  <span>Anonymous Student</span>
                </>
              ) : (
                `${senderName}`
              )}
            </div>
          )}
          
          <div className={`mb-text-payload ${msg.moderation_blocked ? 'mb-text-payload--blocked' : ''}`}>
            {msg.moderation_blocked ? <i>Message blocked by moderation rules</i> : content}
          </div>
          
          <div className="mb-timestamp-metadata">
            <span>{time}</span>
            
            {isAnonymous && isOwnMessage && (
              <span className="mb-self-anon-badge" title="Dispatched anonymously to target">
                <FontAwesomeIcon icon={faUserSecret} />
              </span>
            )}
            
            {/* Real-time Status Ticks */}
            {messageStatus && (
              <span className={`mb-receipt-ticks mb-receipt-ticks--${messageStatus}`} title={
                messageStatus === 'blocked' ? 'Blocked by safety rules' :
                messageStatus === 'read' ? 'Read' :
                messageStatus === 'delivered' ? 'Delivered' : 'Sent'
              }>
                {messageStatus === 'blocked' && (
                  <FontAwesomeIcon icon={faCircleExclamation} className="mb-tick-blocked" />
                )}
                {messageStatus === 'sent' && (
                  <FontAwesomeIcon icon={faCheck} className="mb-tick-single" />
                )}
                {(messageStatus === 'delivered' || messageStatus === 'read') && (
                  <span className="mb-double-ticks-container">
                    <FontAwesomeIcon icon={faCheck} className="mb-tick-stacked-1" />
                    <FontAwesomeIcon icon={faCheck} className="mb-tick-stacked-2" />
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* ── Hover Report Flag (Received Normal Text Logs Only) ── */}
        {canReport && !isSelectionMode && (
          <div className="mb-report-action-portal">
            {reportState === 'done' ? (
              <span className="mb-report-logged-tag" title="Report successfully sent to system admins">
                <FontAwesomeIcon icon={faFlag} /> Reported
              </span>
            ) : (
              <button
                className="mb-flag-trigger-btn"
                title="Flag this message for admin audit"
                onClick={(e) => { e.stopPropagation(); setShowReportMenu(v => !v); }}
              >
                <FontAwesomeIcon icon={faFlag} />
              </button>
            )}

            {/* Contextual Popup Overlays */}
            {showReportMenu && reportState !== 'done' && (
              <div className="mb-report-popup-card fade-in" onClick={e => e.stopPropagation()}>
                <div className="mb-report-popup-header">
                  <span>Flag Message Content</span>
                  <button className="mb-report-close-btn" onClick={() => { setShowReportMenu(false); setReportReason(''); }}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <textarea
                  className="mb-report-textarea"
                  placeholder="Reason details (optional)..."
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  rows={2}
                  maxLength={300}
                />
                <button
                  className="mb-report-submit-btn"
                  disabled={reportState === 'submitting'}
                  onClick={handleReportSubmit}
                >
                  {reportState === 'submitting' ? 'Submitting...' : (
                    <>
                      <FontAwesomeIcon icon={faPaperPlane} /> 
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;