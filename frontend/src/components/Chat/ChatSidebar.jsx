import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const ChatSidebar = ({
  mode = 'direct', // 'direct' or 'community'
  items, // conversations or chats
  selectedItem,
  onSelect,
  loading,
  searchQuery,
  onSearchChange,
  // Direct specific
  showUserSearch,
  setShowUserSearch,
  userSearchQuery,
  setUserSearchQuery,
  availableUsers,
  onStartNewConversation
}) => {
  
  const getFilteredItems = () => {
    if (!items) return [];
    if (mode === 'direct') {
       // Assuming items are conversations. Filtering is usually done via parent logic or we assume they are already filtered if passed
       // But based on original code, standard list is conversations.
       return items;
    } else {
        // Community filter
       return items.filter(chat => 
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.courseCode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  };
  
  const renderDirectSidebar = () => (
    <>
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
              onFocus={() => setShowUserSearch && setShowUserSearch(true)}
            />
          </div>
          {showUserSearch && userSearchQuery && userSearchQuery.trim() && (
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
        ) : items.length === 0 ? (
          <div className="chat-empty-state-message">
            <p>No conversations yet</p>
            <p className="chat-empty-subtitle">
              Start a new conversation by clicking the search bar
            </p>
          </div>
        ) : (
          items.map((conv) => (
            <div 
              key={conv.user_id}
              className={`chat-item ${selectedItem?.user_id === conv.user_id ? "active" : ""}`}
              onClick={() => onSelect(conv)}
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
    </>
  );

  const renderCommunitySidebar = () => (
    <>
      <div className="chat-header">
        <h2 className="chat-title">Community Chats</h2>
        <div className="chat-search-wrapper">
          <FontAwesomeIcon icon={faSearch} className="chat-search-icon" />
          <input 
            type="text" 
            placeholder="Search conversations..."
            className="chat-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      <div className="chat-list">
        {loading ? (
          <div className="chat-empty-state-message">
            Loading communities...
          </div>
        ) : items.length === 0 ? (
          <div className="chat-empty-state-message">
            <p>No communities available</p>
            <p className="chat-empty-subtitle">
              Enroll in courses to join their communities
            </p>
          </div>
        ) : (
          getFilteredItems().map((chat) => (
            <div 
              key={chat.id}
              onClick={() => onSelect(chat)}
              className={`chat-item ${selectedItem?.id === chat.id ? 'active' : ''}`}
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
    </>
  );

  return (
    <div className={`chat-sidebar ${selectedItem ? 'mobile-hidden' : 'mobile-visible'}`}>
      {mode === 'direct' ? renderDirectSidebar() : renderCommunitySidebar()}
    </div>
  );
};

export default ChatSidebar;
