import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSearch, 
  faChevronUp, 
  faChevronDown, 
  faTimes, 
  faTrash, 
  faEllipsisVertical, 
  faCheckSquare, 
  faUserSecret, 
  faPaperPlane, 
  faComments,
  faEyeSlash,
  faBan,
  faUsers,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import MessageBubble from './MessageBubble';

// ── System join notification bubble ────────────────────────────────────────
const JoinNotification = ({ msg }) => (
  <div className="cw-system-notification-row">
    <span>~ {msg.content}</span>
  </div>
);

const ChatWindow = ({
  mode = 'direct',
  userId,
  selectedItem,
  onBack,
  
  // Messages
  messages,
  typingUsers,
  messagesEndRef,
  
  // Search
  isSearchMode,
  messageSearchQuery,
  setMessageSearchQuery,
  handleSearch,
  searchResults,
  currentSearchIndex,
  navigateSearchResult,
  closeSearch,
  
  // Selection / Delete
  isSelectMode,
  selectedMessages,
  setIsSelectMode,
  setSelectedMessages,
  handleDeleteSelected,
  toggleMessageSelection,
  setIsSearchMode,
  
  // Options
  showOptions,
  setShowOptions,
  handleOptionClick,

  // Direct specific
  canSendAnonymously,
  isAnonymous,
  setIsAnonymous,
  
  // Input
  inputValue,
  setInputValue,
  isChatBanned,
  onTyping,
  onSend,
  
  // Community specific
  onLeaveCommunity,
  onDisbandCommunity,

  // Reporting
  onReport,
}) => {

  if (!selectedItem) {
    return (
      <div className={`cw-viewport-wrapper ${selectedItem ? 'cw-viewport-wrapper--mobile-show' : 'cw-viewport-wrapper--mobile-hide'}`}>
        <div className="cw-empty-state-view">
           <FontAwesomeIcon icon={mode === 'direct' ? faComments : faUsers} className="cw-empty-state-icon" />
           <h3>Select a {mode === 'direct' ? 'conversation' : 'chat'} space</h3>
           <p>Choose from your active channels roster or initiate a new inquiry</p>
        </div>
      </div>
    );
  }

  const renderHeader = () => {
    // Search Mode Header
    if (isSearchMode) {
      return (
        <div className="cw-search-toolbar">
             <input
               type="text"
               className="cw-search-toolbar-input"
               placeholder="Search messages..."
               value={messageSearchQuery}
               onChange={(e) => setMessageSearchQuery(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
               autoFocus
             />
             <div className="cw-search-nav-group">
               <span className="cw-search-indexer-digits">
                 {searchResults.length > 0 
                   ? `${currentSearchIndex + 1}/${searchResults.length}` 
                   : '0/0'}
               </span>
               <button onClick={() => navigateSearchResult(-1)} className="cw-search-nav-btn" disabled={searchResults.length === 0}>
                 <FontAwesomeIcon icon={faChevronUp} />
               </button>
               <button onClick={() => navigateSearchResult(1)} className="cw-search-nav-btn" disabled={searchResults.length === 0}>
                 <FontAwesomeIcon icon={faChevronDown} />
               </button>
             </div>
             <button className="cw-search-close-btn" onClick={closeSearch}>
               <FontAwesomeIcon icon={faTimes} />
             </button>
        </div>
      );
    }
    
    // Select Mode Header
    if (isSelectMode) {
      return (
        <div className="cw-select-toolbar">
          <span className="cw-select-counter">{selectedMessages.length} selected</span>
          <div className="cw-select-action-buttons">
            <button 
              className="cw-select-delete-btn" 
              onClick={handleDeleteSelected}
              disabled={selectedMessages.length === 0}
            >
              <FontAwesomeIcon icon={faTrash} />
              <span>Delete</span>
            </button>
            <button className="cw-select-cancel-btn" onClick={() => { setIsSelectMode(false); setSelectedMessages([]); }}>
              <FontAwesomeIcon icon={faTimes} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      );
    }

    // Normal Header
    return (
      <div className="cw-standard-header-content">
        <div className="cw-header-user-block">
           <div className={`cw-header-avatar ${mode === 'community' ? 'cw-header-avatar--community' : ''}`}>
             {mode === 'direct' ? selectedItem.user_name.charAt(0) : selectedItem.name.charAt(0)}
           </div>
           <div className="cw-header-meta">
             <h3 className="cw-header-title">
                <span>{mode === 'direct' ? selectedItem.user_name : selectedItem.name}</span>
                {mode === 'community' && selectedItem.status === 'inactive' && (
                  <span className="cw-status-badge">Inactive</span>
                )}
             </h3>
             <p className="cw-header-subtitle">
               {mode === 'direct' ? selectedItem.user_email : 'Course Community'}
             </p>
           </div>
        </div>
        <div className="cw-options-menu-container">
          <button 
            className="cw-options-trigger-btn" 
            onClick={() => setShowOptions(!showOptions)}
          >
            <FontAwesomeIcon icon={faEllipsisVertical} />
          </button>
          {showOptions && (
            <div className="cw-options-dropdown-pane fade-in">
              <button className="cw-dropdown-option-row" onClick={() => handleOptionClick('search')}>
                <FontAwesomeIcon icon={faSearch} />
                <span>Search History</span>
              </button>
              <button className="cw-dropdown-option-row" onClick={() => handleOptionClick('select')}>
                <FontAwesomeIcon icon={faCheckSquare} />
                <span>Select Messages</span>
              </button>
              
              {/* Community Specific Options */}
              {mode === 'community' && onLeaveCommunity && (
                 <button className="cw-dropdown-option-row cw-dropdown-option-row--danger" onClick={() => { setShowOptions(false); onLeaveCommunity(selectedItem); }}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Leave Community</span>
                  </button>
              )}
              {mode === 'community' && onDisbandCommunity && (
                 <button className="cw-dropdown-option-row cw-dropdown-option-row--danger" onClick={() => { setShowOptions(false); onDisbandCommunity(selectedItem); }}>
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Disband Community</span>
                 </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Date separator helper ──────────────────────────────────────────────
  const getDateLabel = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    if (sameDay(d, today)) return 'Today';
    if (sameDay(d, yesterday)) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className={`cw-viewport-wrapper ${selectedItem ? 'cw-viewport-wrapper--mobile-show' : 'cw-viewport-wrapper--mobile-hide'}`}>
      <div className="cw-main-header-bar">
        <button className="cw-header-back-btn" onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <div className="cw-header-content-injector">
          {renderHeader()}
        </div>
      </div>

      {/* Messages Thread Timeline Scroll-Area */}
      <div className="cw-messages-scroll-frame">
        {(() => {
          let lastDateLabel = null;
          const items = [];

          messages.forEach((msg, index) => {
            const dateLabel = getDateLabel(msg.created_at);
            if (dateLabel && dateLabel !== lastDateLabel) {
              lastDateLabel = dateLabel;
              items.push(
                <div key={`date-sep-${index}`} className="cw-timeline-date-separator">
                  <span>{dateLabel}</span>
                </div>
              );
            }

            if (msg.message_type === 'system_join') {
              items.push(<JoinNotification key={msg.id} msg={msg} />);
              return;
            }

            items.push(
              <MessageBubble
                key={`${msg.id || index}-${index}`}
                msg={msg}
                userId={userId}
                isSelectionMode={isSelectMode}
                isSelected={selectedMessages.includes(msg.id)}
                onToggleSelection={toggleMessageSelection}
                onReport={onReport}
              />
            );
          });

          return items;
        })()}

        {typingUsers.length > 0 && (
          <div className="cw-typing-indicator-row fade-in">
            <div className="cw-typing-dots">
              <span></span><span></span><span></span>
            </div>
            <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer Controls Input Integration Blocks */}
      <div className="cw-footer-input-panel">
        {mode === 'community' && selectedItem.status === 'inactive' ? (
          <div className="cw-banner-notification cw-banner-notification--inactive">
             <p>This community space has been marked inactive. New message logs are disabled.</p>
          </div>
        ) : isChatBanned && !(mode === 'direct' && selectedItem.user_role === 'Admin') ? (
          <div className="cw-banner-notification cw-banner-notification--banned">
             <FontAwesomeIcon icon={faBan} />
             <p>Your real-time messaging privileges have been suspended. Contact administration for details.</p>
          </div>
        ) : mode === 'direct' && selectedItem.user_id === 'anonymous' ? (
           <div className="cw-banner-notification cw-banner-notification--anonymous">
              <p>
                <FontAwesomeIcon icon={faUserSecret} />
                <span>You cannot send text thread replies to anonymous originators.</span>
              </p>
           </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default ChatWindow;