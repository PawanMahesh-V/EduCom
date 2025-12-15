import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPaperPlane, faComments, faUsers, faEye, faEyeSlash, faEllipsisVertical, faTrash, faCheckSquare, faUserSecret, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

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
  
  // Loading state
  loading,
  
  // Mode: 'direct' or 'community'
  mode = 'direct'
}) => {
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showDmOptions, setShowDmOptions] = useState(false);
  const [showCommunityOptions, setShowCommunityOptions] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Check if current user is a student messaging a teacher
  const canSendAnonymously = userRole === 'Student' && 
    selectedConversation && 
    ['Teacher', 'HOD', 'PM'].includes(selectedConversation.user_role);

  const handleOptionClick = (action, mode) => {
    if (mode === 'dm') {
      setShowDmOptions(false);
    } else {
      setShowCommunityOptions(false);
    }
    
    switch(action) {
      case 'delete':
        // Handle delete action
        console.log('Delete clicked');
        break;
      case 'search':
        // Handle search action
        console.log('Search clicked');
        break;
      case 'select':
        // Handle select action
        console.log('Select clicked');
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        <h4 className="chat-name">{conv.user_name}</h4>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          padding: '0.15rem 0.4rem', 
                          borderRadius: '10px', 
                          backgroundColor: conv.user_role === 'Teacher' ? '#4CAF50' : conv.user_role === 'Admin' ? '#f44336' : '#2196F3',
                          color: 'white',
                          fontWeight: '500',
                          flexShrink: 0
                        }}>
                          {conv.user_role}
                        </span>
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
                        {conv.last_message || 'No messages yet'}
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
              <button className="chat-back-btn" onClick={() => onSelectConversation(null)}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <div className="chat-user-info">
                <div className="chat-avatar">{selectedConversation.user_name.charAt(0)}</div>
                <div>
                  <h3 className="m-0 font-semibold">{selectedConversation.user_name}</h3>
                  <p className="m-0 text-sm text-secondary">{selectedConversation.user_email}</p>
                </div>
              </div>
              <div className="chat-options-wrapper">
                <button className="chat-options-btn" onClick={() => setShowDmOptions(!showDmOptions)}>
                  <FontAwesomeIcon icon={faEllipsisVertical} />
                </button>
                {showDmOptions && (
                  <div className="chat-options-dropdown">
                    <button className="chat-option-item" onClick={() => handleOptionClick('delete', 'dm')}>
                      <FontAwesomeIcon icon={faTrash} />
                      <span>Delete</span>
                    </button>
                    <button className="chat-option-item" onClick={() => handleOptionClick('search', 'dm')}>
                      <FontAwesomeIcon icon={faSearch} />
                      <span>Search</span>
                    </button>
                    <button className="chat-option-item" onClick={() => handleOptionClick('select', 'dm')}>
                      <FontAwesomeIcon icon={faCheckSquare} />
                      <span>Select</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="chat-messages">
              {dmMessages.map((msg, index) => (
                <div 
                  key={index}
                  className={`chat-message ${msg.sender_id === userId ? 'sent' : 'received'}`}
                >
                  <div className={`chat-message-bubble ${msg.sender_id === userId ? 'sent' : 'received'} ${msg.is_anonymous ? 'anonymous-message' : ''}`}>
                    {msg.sender_id !== userId && (
                      <div className="chat-message-sender">
                        {msg.is_anonymous ? (
                          <>
                            <FontAwesomeIcon icon={faUserSecret} style={{ marginRight: '6px' }} />
                            Anonymous Student
                          </>
                        ) : (
                          msg.sender_name
                        )}
                      </div>
                    )}
                    <div className="chat-message-text">{msg.content}</div>
                    <div className="chat-message-time">
                      {new Date(msg.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      {msg.is_anonymous && msg.sender_id === userId && (
                        <span className="anonymous-indicator" title="Sent anonymously">
                          <FontAwesomeIcon icon={faUserSecret} style={{ marginLeft: '6px', fontSize: '0.75rem' }} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
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
                  <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px', fontStyle: 'italic' }}>
                    <FontAwesomeIcon icon={faUserSecret} style={{ marginRight: '8px' }} />
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
                    <button className="chat-option-item" onClick={() => handleOptionClick('delete', 'community')}>
                      <FontAwesomeIcon icon={faTrash} />
                      <span>Delete</span>
                    </button>
                    <button className="chat-option-item" onClick={() => handleOptionClick('search', 'community')}>
                      <FontAwesomeIcon icon={faSearch} />
                      <span>Search</span>
                    </button>
                    <button className="chat-option-item" onClick={() => handleOptionClick('select', 'community')}>
                      <FontAwesomeIcon icon={faCheckSquare} />
                      <span>Select</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="chat-messages">
              {communityMessages.map((msg, index) => (
                <div 
                  key={`${msg.id}-${index}`}
                  className={`chat-message ${msg.senderId === userId ? 'sent' : 'received'}`}
                >
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
