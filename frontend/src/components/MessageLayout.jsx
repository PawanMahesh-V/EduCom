import React, { useState, useEffect, useCallback } from 'react';
import { TEACHING_ROLES } from '../constants';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPaperPlane, faComments, faUsers, faEllipsisVertical, faTrash, faCheckSquare, faUserSecret, faArrowLeft, faTimes, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import directMessageApi from '../api/directMessages';

const MessageLayout = ({
  // Common props
  userId,
  userRole,
  messagesEndRef,
  
  // Direct Messages props
  conversations,
  selectedConversation,
  dmMessages,
  dmTypingUsers,
  dmMessage,
  setDmMessage,
  userSearchQuery,
  setUserSearchQuery,
  showUserSearch,
  setShowUserSearch,
  availableUsers,
  onSelectConversation,
  onStartNewConversation,
  onSendDirectMessage,
  onDMTyping,
  onMessageDeleted,
  
  // Community Chat props
  chats,
  selectedChat,
  communityMessages,
  communityTypingUsers,
  communityMessage,
  setCommunityMessage,
  onSelectChat,
  onSendCommunityMessage,
  onCommunityTyping,
  onCommunityMessageDeleted,
  onLeaveCommunity,
  onDisbandCommunity,
  
  // Loading state
  loading,
  
  // Mode: 'direct' or 'community'
  mode = 'direct'
}) => {
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showDmOptions, setShowDmOptions] = useState(false);
  const [showCommunityOptions, setShowCommunityOptions] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Search feature state
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  
  // Delete feature state
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [contextMenuMessage, setContextMenuMessage] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  // Check if current user is a student messaging a teacher
  const canSendAnonymously = userRole === 'Student' && 
    selectedConversation && 
    TEACHING_ROLES.includes(selectedConversation.user_role);

  // Search messages in conversation
  const handleSearch = useCallback(async () => {
    if (!messageSearchQuery.trim() || !selectedConversation) return;
    
    try {
      const results = await directMessageApi.searchMessages(
        userId,
        selectedConversation.user_id,
        messageSearchQuery
      );
      setSearchResults(results);
      setCurrentSearchIndex(0);
      
      // Scroll to first result
      if (results.length > 0) {
        const element = document.getElementById(`message-${results[0].id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('search-highlight');
          setTimeout(() => element.classList.remove('search-highlight'), 2000);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  }, [messageSearchQuery, selectedConversation, userId]);

  // Navigate search results
  const navigateSearchResult = (direction) => {
    if (searchResults.length === 0) return;
    
    let newIndex = currentSearchIndex + direction;
    if (newIndex < 0) newIndex = searchResults.length - 1;
    if (newIndex >= searchResults.length) newIndex = 0;
    
    setCurrentSearchIndex(newIndex);
    
    const element = document.getElementById(`message-${searchResults[newIndex].id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('search-highlight');
      setTimeout(() => element.classList.remove('search-highlight'), 2000);
    }
  };

  // Close search
  const closeSearch = () => {
    setIsSearchMode(false);
    setMessageSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
  };

  // Search messages in community (local search in already loaded messages)
  const handleCommunitySearch = useCallback(() => {
    if (!messageSearchQuery.trim() || !selectedChat) return;
    
    const query = messageSearchQuery.toLowerCase();
    const results = communityMessages.filter(msg => 
      msg.text?.toLowerCase().includes(query) || 
      msg.sender?.toLowerCase().includes(query)
    );
    
    setSearchResults(results);
    setCurrentSearchIndex(0);
    
    // Scroll to first result
    if (results.length > 0) {
      const element = document.getElementById(`community-message-${results[0].id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('search-highlight');
        setTimeout(() => element.classList.remove('search-highlight'), 2000);
      }
    }
  }, [messageSearchQuery, selectedChat, communityMessages]);

  // Navigate community search results
  const navigateCommunitySearchResult = (direction) => {
    if (searchResults.length === 0) return;
    
    let newIndex = currentSearchIndex + direction;
    if (newIndex < 0) newIndex = searchResults.length - 1;
    if (newIndex >= searchResults.length) newIndex = 0;
    
    setCurrentSearchIndex(newIndex);
    
    const element = document.getElementById(`community-message-${searchResults[newIndex].id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('search-highlight');
      setTimeout(() => element.classList.remove('search-highlight'), 2000);
    }
  };

  // Delete selected community messages
  const handleDeleteSelectedCommunity = async () => {
    if (selectedMessages.length === 0) return;
    
    // Filter out temporary message IDs
    const realMessageIds = selectedMessages.filter(id => !String(id).startsWith('temp-'));
    
    if (realMessageIds.length === 0) {
      alert('Please wait for messages to be sent before deleting');
      setSelectedMessages([]);
      setIsSelectMode(false);
      return;
    }
    
    console.log('[MessageLayout] Deleting community messages:', realMessageIds);
    
    if (onCommunityMessageDeleted) {
      for (const id of realMessageIds) {
        await onCommunityMessageDeleted(id);
      }
    }
    
    setSelectedMessages([]);
    setIsSelectMode(false);
  };

  // Delete single message
  const handleDeleteMessage = async (messageId) => {
    // Don't allow deletion of optimistic/temporary messages
    if (String(messageId).startsWith('temp-')) {
      console.log('[MessageLayout] Cannot delete temporary message:', messageId);
      alert('Please wait for the message to be sent before deleting');
      return;
    }
    
    console.log('[MessageLayout] Deleting message:', messageId);
    try {
      const result = await directMessageApi.deleteMessage(messageId);
      console.log('[MessageLayout] Delete result:', result);
      
      // Call callback immediately to update UI
      if (onMessageDeleted) {
        console.log('[MessageLayout] Calling onMessageDeleted with:', messageId);
        onMessageDeleted(messageId);
      }
      setContextMenuMessage(null);
    } catch (err) {
      console.error('[MessageLayout] Delete error:', err);
      alert(err.message || err || 'Failed to delete message');
    }
  };

  // Delete selected messages
  const handleDeleteSelected = async () => {
    if (selectedMessages.length === 0) return;
    
    // Filter out temporary message IDs
    const realMessageIds = selectedMessages.filter(id => !String(id).startsWith('temp-'));
    
    if (realMessageIds.length === 0) {
      alert('Please wait for messages to be sent before deleting');
      setSelectedMessages([]);
      setIsSelectMode(false);
      return;
    }
    
    console.log('[MessageLayout] Deleting multiple messages:', realMessageIds);
    try {
      const result = await directMessageApi.deleteMultipleMessages(realMessageIds);
      console.log('[MessageLayout] Delete multiple result:', result);
      
      // Call callback for each deleted message to update UI
      if (onMessageDeleted) {
        // Use deletedIds from response if available, otherwise use all selected
        const idsToRemove = result.deletedIds?.length > 0 ? result.deletedIds : realMessageIds;
        console.log('[MessageLayout] Calling onMessageDeleted for IDs:', idsToRemove);
        idsToRemove.forEach(id => onMessageDeleted(id));
      }
      setSelectedMessages([]);
      setIsSelectMode(false);
    } catch (err) {
      console.error('[MessageLayout] Delete multiple error:', err);
      alert(err.message || err || 'Failed to delete messages');
    }
  };

  // Toggle message selection
  const toggleMessageSelection = (messageId) => {
    setSelectedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  // Right-click context menu
  const handleMessageContextMenu = (e, msg) => {
    if (msg.sender_id !== userId) return; // Only own messages
    e.preventDefault();
    setContextMenuMessage(msg);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenuMessage(null);
    if (contextMenuMessage) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenuMessage]);

  // Reset states when conversation changes
  useEffect(() => {
    closeSearch();
    setSelectedMessages([]);
    setIsSelectMode(false);
    setContextMenuMessage(null);
  }, [selectedConversation?.user_id]);

  // Reset states when community chat changes
  useEffect(() => {
    closeSearch();
    setSelectedMessages([]);
    setIsSelectMode(false);
    setShowCommunityOptions(false);
  }, [selectedChat?.id]);

  const handleOptionClick = (action, mode) => {
    if (mode === 'dm') {
      setShowDmOptions(false);
    } else {
      setShowCommunityOptions(false);
    }
    
    switch(action) {
      case 'delete':
        setIsSelectMode(true);
        setSelectedMessages([]);
        break;
      case 'search':
        setIsSearchMode(true);
        setMessageSearchQuery('');
        break;
      case 'select':
        setIsSelectMode(true);
        setSelectedMessages([]);
        break;
      default:
        break;
    }
  };

  const renderDirectMessages = () => (
    <>
      {/* Conversations List Sidebar */}
      <div className={`chat-sidebar ${selectedConversation ? 'mobile-hidden' : 'mobile-visible'}`}>
        <div className="chat-header">
          <h2 className="chat-title">Messages</h2>
          <div className="user-search-section">
            <div className="chat-search-wrapper">
              <FontAwesomeIcon icon={faSearch} className="chat-search-icon" />
              <input 
                type="text" 
                placeholder="Search users..."
                className="chat-search-input"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                onFocus={() => setShowUserSearch(true)}
              />
            </div>
            {showUserSearch && userSearchQuery.trim() && (
              <div className="user-search-dropdown">
                {availableUsers
                  .filter(u => u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                              u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                              u.role.toLowerCase().includes(userSearchQuery.toLowerCase()))
                  .map((user) => (
                    <div 
                      key={user.id}
                      className="chat-item user-search-item"
                      onClick={() => onStartNewConversation(user)}
                    >
                      <div className="chat-item-content">
                        <div className="user-search-header">
                          <h4 className="chat-item-name user-search-name">{user.name}</h4>
                          <span className={`user-role-badge ${user.role.toLowerCase()}`}>
                            {user.role}
                          </span>
                        </div>
                        <p className="chat-item-message user-search-email">{user.email}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="chat-list">
          {loading ? (
            <div className="chat-empty-state-message">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="chat-empty-state-message">
              <p>No conversations yet</p>
              <p className="chat-empty-subtitle">
                Start a new conversation by clicking the search bar
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div 
                key={conv.user_id}
                className={`chat-item ${selectedConversation?.user_id === conv.user_id ? 'active' : ''}`}
                onClick={() => onSelectConversation(conv)}
              >
                <div className="flex gap-md">
                  <div className="chat-avatar">
                    {conv.user_name.charAt(0)}
                  </div>
                  <div className="chat-info">
                    <div className="chat-info-header">
                      <div className="chat-item-header-wrapper">
                        <h4 className="chat-name">{conv.user_name}</h4>
                        {conv.user_role && (
                          <span className={`role-badge role-badge-${conv.user_role.toLowerCase()}`}>
                            {conv.user_role}
                          </span>
                        )}
                      </div>
                      {conv.last_message_time && (
                        <span className="chat-time">
                          {new Date(conv.last_message_time).toLocaleString('en-PK', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'Asia/Karachi'
                          })}
                        </span>
                      )}
                    </div>
                    <div className="chat-preview">
                      <p className="chat-message-preview">
                        Start chatting...
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="chat-unread-badge">{conv.unread_count}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Main Area */}
      <div className={`chat-main ${selectedConversation ? 'mobile-visible' : 'mobile-hidden'}`}>
        {selectedConversation ? (
          <>
            <div className="chat-main-header">
              <button 
                className="chat-back-btn" 
                onClick={() => onSelectConversation(null)}
                aria-label="Back to conversations list"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              
              {isSearchMode ? (
                // Search Mode Header
                <div className="chat-search-mode">
                  <input
                    type="text"
                    className="chat-message-search-input"
                    placeholder="Search in conversation..."
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    autoFocus
                  />
                  {searchResults.length > 0 && (
                    <div className="search-navigation">
                      <span className="search-count">{currentSearchIndex + 1}/{searchResults.length}</span>
                      <button onClick={() => navigateSearchResult(-1)} className="search-nav-btn">
                        <FontAwesomeIcon icon={faChevronUp} />
                      </button>
                      <button onClick={() => navigateSearchResult(1)} className="search-nav-btn">
                        <FontAwesomeIcon icon={faChevronDown} />
                      </button>
                    </div>
                  )}
                  <button className="search-close-btn" onClick={closeSearch}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              ) : isSelectMode ? (
                // Select Mode Header
                <div className="chat-select-mode">
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
              ) : (
                // Normal Header
                <>
                  <div className="chat-user-info">
                    <div className="chat-avatar">{selectedConversation.user_name.charAt(0)}</div>
                    <div>
                      <h3 className="m-0 font-semibold">{selectedConversation.user_name}</h3>
                      <p className="m-0 text-sm text-secondary">{selectedConversation.user_email}</p>
                    </div>
                  </div>
                  <div className="chat-options-wrapper">
                    <button 
                      className="chat-options-btn" 
                      onClick={() => setShowDmOptions(!showDmOptions)}
                      aria-label="Conversation options"
                      aria-haspopup="true"
                    >
                      <FontAwesomeIcon icon={faEllipsisVertical} />
                    </button>
                    {showDmOptions && (
                      <div className="chat-options-dropdown">
                        <button className="chat-option-item" onClick={() => handleOptionClick('search', 'dm')}>
                          <FontAwesomeIcon icon={faSearch} />
                          <span>Search</span>
                        </button>
                        <button className="chat-option-item" onClick={() => handleOptionClick('select', 'dm')}>
                          <FontAwesomeIcon icon={faCheckSquare} />
                          <span>Select Messages</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="chat-messages">
              {dmMessages.map((msg, index) => (
                <div 
                  key={index}
                  id={`message-${msg.id}`}
                  className={`chat-message ${msg.sender_id === userId ? 'sent' : 'received'} ${selectedMessages.includes(msg.id) ? 'selected' : ''} ${isSelectMode && msg.sender_id === userId ? 'selectable' : ''}`}
                  onClick={isSelectMode && msg.sender_id === userId ? (e) => { e.stopPropagation(); toggleMessageSelection(msg.id); } : undefined}
                  onContextMenu={(e) => handleMessageContextMenu(e, msg)}
                  style={isSelectMode && msg.sender_id === userId ? { cursor: 'pointer' } : {}}
                >
                  {isSelectMode && msg.sender_id === userId && (
                    <div className="message-checkbox" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedMessages.includes(msg.id)}
                        onChange={(e) => { e.stopPropagation(); toggleMessageSelection(msg.id); }}
                      />
                    </div>
                  )}
                  <div className={`chat-message-bubble ${msg.sender_id === userId ? 'sent' : 'received'} ${msg.is_anonymous ? 'anonymous-message' : ''}`}>
                    {msg.sender_id !== userId && (
                      <div className="chat-message-sender">
                        {msg.is_anonymous ? (
                          <>
                            <FontAwesomeIcon icon={faUserSecret} className="anonymous-icon-left" />
                            Anonymous Student
                          </>
                        ) : (
                          msg.sender_name
                        )}
                      </div>
                    )}
                    <div className="chat-message-text">{msg.content}</div>
                    <div className="chat-message-time">
                      {new Date(msg.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}
                      {msg.is_anonymous && msg.sender_id === userId && (
                        <span className="anonymous-indicator" title="Sent anonymously">
                          <FontAwesomeIcon icon={faUserSecret} className="anonymous-icon-right" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Context Menu for message deletion */}
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
              
              {dmTypingUsers.length > 0 && (
                <div className="chat-typing-indicator">
                  <span>{dmTypingUsers.join(', ')} {dmTypingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-wrapper">
              {canSendAnonymously && (
                <div className="anonymous-toggle-container">
                  <button 
                    className={`anonymous-toggle-btn ${isAnonymous ? 'active' : ''}`}
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    title={isAnonymous ? 'Sending anonymously' : 'Send anonymously'}
                  >
                    <FontAwesomeIcon icon={faUserSecret} />
                    <span>{isAnonymous ? 'Anonymous Mode ON' : 'Send Anonymously'}</span>
                  </button>
                  {isAnonymous && (
                    <span className="anonymous-note">Your identity will be hidden from the teacher</span>
                  )}
                </div>
              )}
              {/* Disable input for teachers in anonymous conversation */}
              {selectedConversation.user_id === 'anonymous' ? (
                <div className="anonymous-reply-disabled">
                  <p className="anonymous-reply-disabled-text">
                    <FontAwesomeIcon icon={faUserSecret} />
                    You cannot reply to anonymous messages. Students will remain anonymous.
                  </p>
                </div>
              ) : (
                <div className="chat-input-container">
                  <input
                    type="text"
                    className="chat-input"
                    placeholder={isAnonymous ? "Type an anonymous message..." : "Type a message..."}
                    value={dmMessage}
                    onChange={(e) => {
                      setDmMessage(e.target.value);
                      if (onDMTyping) onDMTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        console.log('[MessageLayout] Sending message with isAnonymous:', isAnonymous);
                        onSendDirectMessage(isAnonymous);
                        setIsAnonymous(false);
                      }
                    }}
                  />
                  <button 
                    className="chat-send-button"
                    onClick={() => {
                      console.log('[MessageLayout] Send button clicked with isAnonymous:', isAnonymous);
                      onSendDirectMessage(isAnonymous);
                      setIsAnonymous(false);
                    }}
                    disabled={!dmMessage.trim()}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                    Send
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="chat-empty-state">
            <FontAwesomeIcon icon={faComments} className="icon-xl mb-3 opacity-30" />
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the list or start a new one</p>
          </div>
        )}
      </div>
    </>
  );

  const renderCommunityChat = () => (
    <>
      {/* Chat List Sidebar */}
      <div className={`chat-sidebar ${selectedChat ? 'mobile-hidden' : 'mobile-visible'}`}>
        <div className="chat-header">
          <h2 className="chat-title">Community Chats</h2>
          <div className="chat-search-wrapper">
            <FontAwesomeIcon icon={faSearch} className="chat-search-icon" />
            <input 
              type="text" 
              placeholder="Search conversations..."
              className="chat-search-input"
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="chat-list">
          {loading ? (
            <div className="chat-empty-state-message">
              Loading communities...
            </div>
          ) : chats.length === 0 ? (
            <div className="chat-empty-state-message">
              <p>No communities available</p>
              <p className="chat-empty-subtitle">
                Enroll in courses to join their communities
              </p>
            </div>
          ) : (
            chats
              .filter(chat => 
                chat.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                chat.courseName?.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                chat.courseCode?.toLowerCase().includes(chatSearchQuery.toLowerCase())
              )
              .map((chat) => (
                <div 
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
                  className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                >
                  <div className="flex gap-md">
                    <div className="chat-avatar">
                      {chat.name.charAt(0)}
                    </div>
                    <div className="chat-info">
                      <div className="chat-info-header">
                        <h4 className="chat-name">{chat.name}</h4>
                        <span className="chat-time">{chat.time}</span>
                      </div>
                      <div className="chat-preview">
                        <p className="chat-message-preview">{chat.lastMessage}</p>
                        {chat.unread > 0 && (
                          <span className="chat-unread-badge">{chat.unread}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className={`chat-main ${selectedChat ? 'mobile-visible' : 'mobile-hidden'}`}>
        {selectedChat ? (
          <>
            <div className="chat-main-header">
              {isSearchMode ? (
                // Search Mode Header
                <div className="search-header">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search messages..."
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCommunitySearch()}
                    autoFocus
                  />
                  <div className="search-controls">
                    <span className="search-count">
                      {searchResults.length > 0 
                        ? `${currentSearchIndex + 1}/${searchResults.length}` 
                        : '0/0'}
                    </span>
                    <button 
                      className="search-nav-btn" 
                      onClick={() => navigateCommunitySearchResult(-1)}
                      disabled={searchResults.length === 0}
                    >
                      <FontAwesomeIcon icon={faChevronUp} />
                    </button>
                    <button 
                      className="search-nav-btn" 
                      onClick={() => navigateCommunitySearchResult(1)}
                      disabled={searchResults.length === 0}
                    >
                      <FontAwesomeIcon icon={faChevronDown} />
                    </button>
                    <button className="search-close-btn" onClick={closeSearch}>
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                </div>
              ) : isSelectMode ? (
                // Select Mode Header
                <div className="select-mode-header">
                  <span className="selected-count">{selectedMessages.length} selected</span>
                  <button 
                    className="select-delete-btn" 
                    onClick={handleDeleteSelectedCommunity}
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
              ) : (
                // Normal Header
                <>
                  <button className="chat-back-btn" onClick={() => onSelectChat(null)}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                  </button>
                  <div className="chat-user-info">
                    <div className="chat-avatar">{selectedChat.name.charAt(0)}</div>
                    <div>
                      <h3 className="m-0 font-semibold">{selectedChat.name}</h3>
                      <p className="m-0 text-sm text-secondary">Course Community</p>
                    </div>
                  </div>
                  <div className="chat-options-wrapper">
                    <button className="chat-options-btn" onClick={() => setShowCommunityOptions(!showCommunityOptions)}>
                      <FontAwesomeIcon icon={faEllipsisVertical} />
                    </button>
                    {showCommunityOptions && (
                      <div className="chat-options-dropdown">
                        <button className="chat-option-item" onClick={() => handleOptionClick('search', 'community')}>
                          <FontAwesomeIcon icon={faSearch} />
                          <span>Search</span>
                        </button>
                        <button className="chat-option-item" onClick={() => handleOptionClick('select', 'community')}>
                          <FontAwesomeIcon icon={faCheckSquare} />
                          <span>Select Messages</span>
                        </button>
                        {onLeaveCommunity && (
                          <button className="chat-option-item text-danger" onClick={() => { setShowCommunityOptions(false); onLeaveCommunity(selectedChat); }}>
                            <FontAwesomeIcon icon={faArrowLeft} />
                            <span>Leave Community</span>
                          </button>
                        )}
                        {onDisbandCommunity && (
                          <button className="chat-option-item text-danger" onClick={() => { setShowCommunityOptions(false); onDisbandCommunity(selectedChat); }}>
                            <FontAwesomeIcon icon={faTrash} />
                            <span>Disband Community</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <div className="chat-messages">
              {communityMessages.map((msg, index) => (
                <div 
                  key={`${msg.id}-${index}`}
                  id={`community-message-${msg.id}`}
                  className={`chat-message ${msg.senderId === userId ? 'sent' : 'received'} ${selectedMessages.includes(msg.id) ? 'selected' : ''} ${isSelectMode && msg.senderId === userId ? 'selectable' : ''}`}
                  onClick={isSelectMode && msg.senderId === userId ? (e) => { e.stopPropagation(); toggleMessageSelection(msg.id); } : undefined}
                  style={isSelectMode && msg.senderId === userId ? { cursor: 'pointer' } : {}}
                >
                  {isSelectMode && msg.senderId === userId && (
                    <div className="message-checkbox" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedMessages.includes(msg.id)}
                        onChange={(e) => { e.stopPropagation(); toggleMessageSelection(msg.id); }}
                      />
                    </div>
                  )}
                  <div className={`chat-message-bubble ${msg.senderId === userId ? 'sent' : 'received'}`}>
                    {msg.senderId !== userId && (
                      <div className="chat-message-sender">{msg.sender}</div>
                    )}
                    <div className="chat-message-text">{msg.text}</div>
                    <div className="chat-message-time">{msg.time}</div>
                  </div>
                </div>
              ))}
              
              {communityTypingUsers.length > 0 && (
                <div className="chat-typing-indicator">
                  <span>{communityTypingUsers.join(', ')} {communityTypingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input-wrapper">
              <div className="chat-input-container">
                <input 
                  type="text"
                  value={communityMessage}
                  onChange={(e) => {
                    setCommunityMessage(e.target.value);
                    if (onCommunityTyping) onCommunityTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSendCommunityMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="chat-input"
                />
                <button 
                  onClick={onSendCommunityMessage}
                  className="chat-send-button"
                  disabled={!communityMessage.trim()}
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="chat-empty-state flex-center flex-column gap-lg text-secondary">
            <FontAwesomeIcon icon={faUsers} className="icon-xl opacity-30" />
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="chat-container">
      <div className="chat-layout">
        {mode === 'direct' ? renderDirectMessages() : renderCommunityChat()}
      </div>
    </div>
  );
};

export default MessageLayout;
