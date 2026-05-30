import React from 'react';
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
       return items;
    } else {
       return items.filter(chat => 
        (chat.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (chat.courseName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (chat.courseCode || '').toLowerCase().includes((searchQuery || '').toLowerCase())
      );
    }
  };
  
  const renderDirectSidebar = () => (
    <>
      <div className="cs-header">
        <div className="cs-user-search-section">
          <div className="cs-search-wrapper">
            <FontAwesomeIcon icon={faSearch} className="cs-search-icon" />
            <input 
              type="text" 
              placeholder="Search users..."
              className="cs-search-input"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              onFocus={() => setShowUserSearch && setShowUserSearch(true)}
            />
          </div>
          {showUserSearch && userSearchQuery && userSearchQuery.trim() && (
            <div className="cs-user-search-dropdown fade-in">
              {availableUsers
                .filter(u => (u.name || '').toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                            (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                            (u.role || '').toLowerCase().includes(userSearchQuery.toLowerCase()))
                .map((user) => (
                  <div 
                    key={user.id}
                    className="cs-item cs-item--search-row"
                    onClick={() => onStartNewConversation(user)}
                  >
                    <div className="cs-item-content">
                      <div className="cs-user-search-header">
                        <h4 className="cs-item-name">{user.name}</h4>
                        <span className={`cs-role-badge cs-role-badge--${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="cs-item-subtext">{user.email}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="cs-list-container">
        {loading ? (
          <div className="cs-empty-state-message">
            <div className="cs-spinner"></div>
            <span>Loading conversations...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="cs-empty-state-message">
            <p className="cs-empty-title">No conversations yet</p>
            <p className="cs-empty-subtitle">
              Start a new conversation by clicking the search bar above
            </p>
          </div>
        ) : (
          items.map((conv) => (
            <div 
              key={conv.user_id}
              className={`cs-item ${selectedItem?.user_id === conv.user_id ? "cs-item--active" : ""}`}
              onClick={() => onSelect(conv)}
            >
              <div className="cs-flex-row">
                <div className="cs-avatar">
                  {conv.user_name.charAt(0)}
                </div>
                <div className="cs-info-block">
                  <div className="cs-info-header">
                    <div className="cs-item-header-wrapper">
                      <h4 className="cs-item-name">{conv.user_name}</h4>
                      {conv.user_role && (
                        <span className={`cs-role-badge cs-role-badge--${conv.user_role.toLowerCase()}`}>
                          {conv.user_role}
                        </span>
                      )}
                    </div>
                    {conv.last_message_time && (
                      <span className="cs-time-stamp">
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
                  <div className="cs-preview-row">
                    <p className="cs-message-preview">
                      {conv.last_message || 'Start chatting...'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="cs-unread-badge">{conv.unread_count}</span>
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
      <div className="cs-header">
        <div className="cs-search-wrapper">
          <FontAwesomeIcon icon={faSearch} className="cs-search-icon" />
          <input 
            type="text" 
            placeholder="Search conversations..."
            className="cs-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      <div className="cs-list-container">
        {loading ? (
          <div className="cs-empty-state-message">
            <div className="cs-spinner"></div>
            <span>Loading communities...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="cs-empty-state-message">
            <p className="cs-empty-title">No communities available</p>
            <p className="cs-empty-subtitle">
              Enroll in institutional courses to unlock group spaces
            </p>
          </div>
        ) : (
          getFilteredItems().map((chat) => (
            <div 
              key={chat.id}
              onClick={() => onSelect(chat)}
              className={`cs-item ${selectedItem?.id === chat.id ? 'cs-item--active' : ''}`}
            >
              <div className="cs-flex-row">
                <div className="cs-avatar cs-avatar--community">
                  {(chat.course_name || chat.name).charAt(0)}
                </div>
                <div className="cs-info-block">
                  <div className="cs-info-header">
                    <h4 className="cs-item-name">{chat.course_name || chat.name}</h4>
                    {(chat.last_message_time || chat.time) && (
                      <span className="cs-time-stamp">
                        {new Date(chat.last_message_time || chat.time).toLocaleString('en-PK', { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi'
                        })}
                      </span>
                    )}
                  </div>
                  <div className="cs-preview-row">
                    <p className="cs-message-preview">{chat.lastMessage || chat.last_message || 'Start chatting...'}</p>
                    {(chat.unread_count > 0 || chat.unread > 0) && (
                      <span className="cs-unread-badge">{chat.unread_count || chat.unread}</span>
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
    <div className={`cs-sidebar-frame ${selectedItem ? 'cs-sidebar-frame--mobile-hidden' : 'cs-sidebar-frame--mobile-visible'}`}>
      {mode === 'direct' ? renderDirectSidebar() : renderCommunitySidebar()}
    </div>
  );
};

export default ChatSidebar;