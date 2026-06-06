import React from 'react';

const ConversationList = ({
  mode,
  loading,
  items,
  selectedItem,
  onSelect,
  searchQuery,
  getFilteredItems
}) => {
  if (loading) {
    return (
      <div className="cs-empty-state-message">
        <div className="cs-spinner"></div>
        <span>Loading {mode === 'direct' ? 'conversations' : 'communities'}...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cs-empty-state-message">
        <p className="cs-empty-title">No {mode === 'direct' ? 'conversations yet' : 'communities available'}</p>
        <p className="cs-empty-subtitle">
          {mode === 'direct' ? 'Start a new conversation by clicking the search bar above' : 'Enroll in institutional courses to unlock group spaces'}
        </p>
      </div>
    );
  }

  if (mode === 'direct') {
    return items.map((conv) => (
      <div 
        key={conv.user_id}
        className={`cs-item ${selectedItem?.user_id === conv.user_id ? "cs-item--active" : ""}`}
        onClick={() => onSelect(conv)}
      >
        <div className="cs-flex-row">
          <div className="cs-avatar">
            {conv.user_name?.charAt(0)}
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
    ));
  }

  return getFilteredItems().map((chat) => (
    <div 
      key={chat.id}
      onClick={() => onSelect(chat)}
      className={`cs-item ${selectedItem?.id === chat.id ? 'cs-item--active' : ''}`}
    >
      <div className="cs-flex-row">
        <div className="cs-avatar cs-avatar--community">
          {(chat.course_name || chat.name)?.charAt(0)}
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
  ));
};

export default ConversationList;
