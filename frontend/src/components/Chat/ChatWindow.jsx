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
  faUsers,
  faToggleOn,
  faToggleOff,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import MessageBubble from './MessageBubble';

const ChatWindow = ({
  mode = 'direct', // 'direct' or 'community'
  userId,
  selectedItem, // conversation or chat
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
  
  // Context Menu
  handleMessageContextMenu,
  contextMenuMessage,
  contextMenuPosition,
  handleDeleteMessage,
  
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
  onTyping,
  onSend,
  
  // Community specific
  onLeaveCommunity,
  onDisbandCommunity,
}) => {

  if (!selectedItem) {
    return (
      <div className={`chat-main ${selectedItem ? 'mobile-visible' : 'mobile-hidden'}`}>
        <div className="chat-empty-state">
           <FontAwesomeIcon icon={mode === 'direct' ? faComments : faUsers} className="icon-xl mb-3 opacity-30" />
           <h3>Select a {mode === 'direct' ? 'conversation' : 'chat'}</h3>
           <p>Choose from the list or start a new one</p>
        </div>
      </div>
    );
  }

  const renderHeader = () => {
    // Search Mode Header
    if (isSearchMode) {
      return (
        <div className="chat-search-mode" style={mode === 'community' ? { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee' } : {}}>
             <input
               type="text"
               className={mode === 'direct' ? "chat-message-search-input" : "search-input"}
               placeholder="Search messages..."
               value={messageSearchQuery}
               onChange={(e) => setMessageSearchQuery(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
               autoFocus
             />
             <div className="search-navigation">
               <span className="search-count">
                 {searchResults.length > 0 
                   ? `${currentSearchIndex + 1}/${searchResults.length}` 
                   : '0/0'}
               </span>
               <button onClick={() => navigateSearchResult(-1)} className="search-nav-btn" disabled={searchResults.length===0}><FontAwesomeIcon icon={faChevronUp} /></button>
               <button onClick={() => navigateSearchResult(1)} className="search-nav-btn" disabled={searchResults.length===0}><FontAwesomeIcon icon={faChevronDown} /></button>
             </div>
             <button className="search-close-btn" onClick={closeSearch}><FontAwesomeIcon icon={faTimes} /></button>
        </div>
      );
    }
    
    // Select Mode Header
    if (isSelectMode) {
      return (
        <div className={mode === 'direct' ? "chat-select-mode" : "select-mode-header"}>
          <span className="select-count">{selectedMessages.length} selected</span>
          <button 
            className="select-delete-btn" 
            onClick={handleDeleteSelected}
            disabled={selectedMessages.length === 0}
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete
          </button>
          <button className="select-cancel-btn" onClick={() => { setIsSelectMode(false); setSelectedMessages([]); }}>
            <FontAwesomeIcon icon={faTimes} />
            Cancel
          </button>
        </div>
      );
    }

    // Normal Header
    return (
      <>
        <div className="chat-user-info">
           <div className="chat-avatar">{mode === 'direct' ? selectedItem.user_name.charAt(0) : selectedItem.name.charAt(0)}</div>
           <div>
             <h3 className="m-0 font-semibold flex items-center gap-2">
                {mode === 'direct' ? selectedItem.user_name : selectedItem.name}
                {mode === 'community' && selectedItem.status === 'inactive' && (
                  <span className="status-badge inactive">Inactive</span>
                )}
             </h3>
             <p className="m-0 text-sm text-secondary">
               {mode === 'direct' ? selectedItem.user_email : 'Course Community'}
             </p>
           </div>
        </div>
        <div className="chat-options-wrapper">
          <button 
            className="chat-options-btn" 
            onClick={() => setShowOptions(!showOptions)}
          >
            <FontAwesomeIcon icon={faEllipsisVertical} />
          </button>
          {showOptions && (
            <div className="chat-options-dropdown">
              <button className="chat-option-item" onClick={() => handleOptionClick('search')}>
                <FontAwesomeIcon icon={faSearch} />
                <span>Search</span>
              </button>
              <button className="chat-option-item" onClick={() => handleOptionClick('select')}>
                <FontAwesomeIcon icon={faCheckSquare} />
                <span>Select Messages</span>
              </button>
              
              {/* Community Specific Options */}
              {mode === 'community' && onLeaveCommunity && (
                 <button className="chat-option-item text-danger" onClick={() => { setShowOptions(false); onLeaveCommunity(selectedItem); }}>
                   <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Leave Community</span>
                  </button>
              )}
              {mode === 'community' && onDisbandCommunity && (
                 <button className="chat-option-item text-danger" onClick={() => { setShowOptions(false); onDisbandCommunity(selectedItem); }}>
                   <FontAwesomeIcon icon={faTrash} />
                   <span>Disband Community</span>
                 </button>
              )}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className={`chat-main ${selectedItem ? 'mobile-visible' : 'mobile-hidden'}`}>
      <div className="chat-main-header">
        <button className="chat-back-btn" onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        {renderHeader()}
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <MessageBubble 
            key={`${msg.id || index}-${index}`}
            msg={msg}
            userId={userId}
            isSelectionMode={isSelectMode}
            isSelected={selectedMessages.includes(msg.id)}
            onToggleSelection={toggleMessageSelection}
            onContextMenu={handleMessageContextMenu}
          />
        ))}

        {/* Message Context Menu */}
        {contextMenuMessage && (
           <div 
             className="message-context-menu"
             style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
           >
             <button onClick={() => handleDeleteMessage(contextMenuMessage.id)}>
               <FontAwesomeIcon icon={faTrash} />
               Delete Message
             </button>
           </div>
        )}

        {typingUsers.length > 0 && (
          <div className="chat-typing-indicator">
            <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {mode === 'community' && selectedItem.status === 'inactive' ? (
        <div className="chat-input-wrapper">
          <div className="inactive-message-banner p-3 text-center bg-gray-100 text-gray-500 rounded-md">
             <p>This community is currently inactive. You cannot send messages.</p>
          </div>
        </div>
      ) : (
        <div className="chat-input-wrapper">
            {/* Anonymous Toggle moved to input container */}

          {mode === 'direct' && selectedItem.user_id === 'anonymous' ? (
             <div className="anonymous-reply-disabled">
                <p className="anonymous-reply-disabled-text">
                  <FontAwesomeIcon icon={faUserSecret} />
                  You cannot reply to anonymous messages.
                </p>
             </div>
          ) : (
            <div className="chat-input-container">
              {mode === 'direct' && canSendAnonymously && (
                <button
                  className={`anonymous-toggle-btn-icon ${isAnonymous ? 'active' : ''}`}
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  title={isAnonymous ? "Switch to public" : "Switch to anonymous"}
                >
                  <FontAwesomeIcon icon={isAnonymous ? faEyeSlash : faEye} />
                </button>
              )}
              <input
                type="text"
                className="chat-input"
                placeholder={isAnonymous ? "Type an anonymous message..." : "Type a message..."}
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
                className="chat-send-button"
                onClick={() => {
                   onSend(isAnonymous);
                   if (mode === 'direct') setIsAnonymous(false);
                }}
                disabled={!inputValue.trim()}
              >
                <FontAwesomeIcon icon={faPaperPlane} />
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
