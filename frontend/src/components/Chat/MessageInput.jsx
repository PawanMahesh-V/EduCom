import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBan,
  faUserSecret, 
  faPaperPlane, 
  faEyeSlash,
  faEye
} from '@fortawesome/free-solid-svg-icons';

const MessageInput = ({
  mode,
  selectedItem,
  isChatBanned,
  canSendAnonymously,
  isAnonymous,
  setIsAnonymous,
  inputValue,
  setInputValue,
  onTyping,
  onSend
}) => {
  if (mode === 'community' && selectedItem.status === 'inactive') {
    return (
      <div className="cw-banner-notification cw-banner-notification--inactive">
         <p>This community space has been marked inactive. New message logs are disabled.</p>
      </div>
    );
  }

  if (isChatBanned && !(mode === 'direct' && selectedItem.user_role === 'Admin')) {
    return (
      <div className="cw-banner-notification cw-banner-notification--banned">
         <FontAwesomeIcon icon={faBan} />
         <p>Your real-time messaging privileges have been suspended. Contact administration for details.</p>
      </div>
    );
  }

  if (mode === 'direct' && selectedItem.user_id === 'anonymous') {
    return (
       <div className="cw-banner-notification cw-banner-notification--anonymous">
          <p>
            <FontAwesomeIcon icon={faUserSecret} />
            <span>You cannot send text thread replies to anonymous originators.</span>
          </p>
       </div>
    );
  }

  return (
    <div className="cw-input-action-row">
      {mode === 'direct' && canSendAnonymously && (
        <button
          className={`cw-anonymous-toggle-trigger ${isAnonymous ? 'cw-anonymous-toggle-trigger--active' : ''}`}
          onClick={() => setIsAnonymous(!isAnonymous)}
          title={isAnonymous ? "Deactivate anonymous wrapper" : "Activate anonymous routing filter"}
        >
          <FontAwesomeIcon icon={isAnonymous ? faEyeSlash : faEye} />
        </button>
      )}
      <div className="cw-input-field-container">
        <input
          type="text"
          className="cw-text-input-field"
          placeholder={isAnonymous ? "Message anonymously..." : "Start chatting..."}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (onTyping) onTyping();
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend(isAnonymous);
              if (mode === 'direct') setIsAnonymous(false);
            }
          }}
        />
        <button 
          className="cw-send-action-btn"
          onClick={() => {
             onSend(isAnonymous);
             if (mode === 'direct') setIsAnonymous(false);
          }}
          disabled={!inputValue.trim()}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
