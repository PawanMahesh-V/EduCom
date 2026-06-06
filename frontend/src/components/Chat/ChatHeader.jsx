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
  faCheckSquare 
} from '@fortawesome/free-solid-svg-icons';

const ChatHeader = ({
  mode,
  selectedItem,
  isSearchMode,
  messageSearchQuery,
  setMessageSearchQuery,
  handleSearch,
  searchResults,
  currentSearchIndex,
  navigateSearchResult,
  closeSearch,
  isSelectMode,
  selectedMessages,
  handleDeleteSelected,
  setIsSelectMode,
  setSelectedMessages,
  showOptions,
  setShowOptions,
  handleOptionClick,
  onLeaveCommunity,
  onDisbandCommunity
}) => {

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
           {mode === 'direct' ? selectedItem.user_name?.charAt(0) : selectedItem.name?.charAt(0)}
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

export default ChatHeader;
