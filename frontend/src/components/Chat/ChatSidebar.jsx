import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import ConversationList from './ConversationList';

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
        <ConversationList
          mode={mode}
          loading={loading}
          items={items}
          selectedItem={selectedItem}
          onSelect={onSelect}
        />
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
        <ConversationList
          mode={mode}
          loading={loading}
          items={items}
          selectedItem={selectedItem}
          onSelect={onSelect}
          searchQuery={searchQuery}
          getFilteredItems={getFilteredItems}
        />
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