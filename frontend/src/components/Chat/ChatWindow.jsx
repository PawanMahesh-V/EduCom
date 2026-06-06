import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faUsers,
  faComments
} from '@fortawesome/free-solid-svg-icons';
import MessageBubble from './MessageBubble';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';

// ── System join notification bubble ────────────────────────────────────────
const JoinNotification = ({ msg }) => (
  <div className="cw-system-notification-row">
    <span>~ {msg.content}</span>
  </div>
);

const ChatWindow = ({
  mode = 'direct',
  userId,
  userRole,
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

  return (
    <div className={`cw-viewport-wrapper ${selectedItem ? 'cw-viewport-wrapper--mobile-show' : 'cw-viewport-wrapper--mobile-hide'}`}>
      <div className="cw-main-header-bar">
        <button className="cw-header-back-btn" onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <div className="cw-header-content-injector">
          <ChatHeader
            mode={mode}
            selectedItem={selectedItem}
            isSearchMode={isSearchMode}
            messageSearchQuery={messageSearchQuery}
            setMessageSearchQuery={setMessageSearchQuery}
            handleSearch={handleSearch}
            searchResults={searchResults}
            currentSearchIndex={currentSearchIndex}
            navigateSearchResult={navigateSearchResult}
            closeSearch={closeSearch}
            isSelectMode={isSelectMode}
            selectedMessages={selectedMessages}
            handleDeleteSelected={handleDeleteSelected}
            setIsSelectMode={setIsSelectMode}
            setSelectedMessages={setSelectedMessages}
            showOptions={showOptions}
            setShowOptions={setShowOptions}
            handleOptionClick={handleOptionClick}
            onLeaveCommunity={onLeaveCommunity}
            onDisbandCommunity={onDisbandCommunity}
          />
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
                userRole={userRole}
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
        <MessageInput
          mode={mode}
          selectedItem={selectedItem}
          isChatBanned={isChatBanned}
          canSendAnonymously={canSendAnonymously}
          isAnonymous={isAnonymous}
          setIsAnonymous={setIsAnonymous}
          inputValue={inputValue}
          setInputValue={setInputValue}
          onTyping={onTyping}
          onSend={onSend}
        />
      </div>
    </div>
  );
};

export default ChatWindow;