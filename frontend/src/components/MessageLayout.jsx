import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPaperPlane, faComments, faEllipsisV, faUsers, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const MessageLayout = ({
  // Common props
  userId,
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
  isAnonymous,
  setIsAnonymous,
  
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

  const renderDirectMessages = () => (
    <>
      {/* Conversations List Sidebar */}
      <div className="chat-sidebar">
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
                key={`${conv.user_id}-${conv.is_anonymous ? 'anon' : 'regular'}`}
                className={`chat-item ${selectedConversation?.user_id === conv.user_id && selectedConversation?.is_anonymous === conv.is_anonymous ? 'active' : ''}`}
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
                          {new Date(conv.last_message_time).toLocaleString([], { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
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
      <div className="chat-main">
        {selectedConversation ? (
          <>
            <div className="chat-main-header">
              <div className="chat-user-info">
                <div className="chat-avatar">{selectedConversation.user_name.charAt(0)}</div>
                <div>
                  <h3 className="m-0 font-semibold">{selectedConversation.user_name}</h3>
                  <p className="m-0 text-sm text-secondary">{selectedConversation.user_email}</p>
                </div>
              </div>
              <button className="chat-options-button">
                <FontAwesomeIcon icon={faEllipsisV} />
              </button>
            </div>

            <div className="chat-messages">
              {dmMessages.map((msg, index) => (
                <div 
                  key={index}
                  className={`chat-message ${msg.sender_id === userId ? 'sent' : 'received'}`}
                >
                  <div className={`chat-message-bubble ${msg.sender_id === userId ? 'sent' : 'received'}`}>
                    {msg.sender_id !== userId && (
                      <div className="chat-message-sender">
                        {msg.is_anonymous ? 'Anonymous' : msg.sender_name}
                      </div>
                    )}
                    <div className="chat-message-text">{msg.content}</div>
                    <div className="chat-message-time">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
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
              <div className="chat-input-container">
                {selectedConversation && ['Teacher', 'PM', 'HOD'].includes(selectedConversation.user_role) && selectedConversation.user_role !== 'Anonymous' && !selectedConversation.is_anonymous && (
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className="anonymity-toggle-btn"
                    title={isAnonymous ? 'Anonymous mode active' : 'Click to send anonymously'}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '8px 12px',
                      cursor: isAnonymous ? 'default' : 'pointer',
                      color: isAnonymous ? '#4CAF50' : '#666',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.2s',
                      opacity: isAnonymous ? 0.7 : 1
                    }}
                  >
                    <FontAwesomeIcon icon={isAnonymous ? faEyeSlash : faEye} />
                  </button>
                )}
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Type a message..."
                  value={dmMessage}
                  onChange={(e) => {
                    setDmMessage(e.target.value);
                    if (onDMTyping) onDMTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSendDirectMessage();
                    }
                  }}
                />
                <button 
                  className="chat-send-button"
                  onClick={onSendDirectMessage}
                  disabled={!dmMessage.trim()}
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                  Send
                </button>
              </div>
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
      <div className="chat-sidebar">
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
      <div className="chat-main">
        {selectedChat ? (
          <>
            <div className="chat-main-header">
              <div className="chat-user-info">
                <div className="chat-avatar">{selectedChat.name.charAt(0)}</div>
                <div>
                  <h3 className="m-0 font-semibold">{selectedChat.name}</h3>
                  <p className="m-0 text-sm text-secondary">Course Community</p>
                </div>
              </div>
              <button className="chat-options-button">
                <FontAwesomeIcon icon={faEllipsisV} />
              </button>
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
