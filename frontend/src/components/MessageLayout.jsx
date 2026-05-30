import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { TEACHING_ROLES } from '../constants';
import ChatSidebar from './Chat/ChatSidebar';
import ChatWindow from './Chat/ChatWindow';
import { useNotifications } from '../context/NotificationContext';
import { moderationApi, authApi } from '../api';
import { showSuccess, showError, showWarning } from '../utils/alert';

// Hooks
import { 
  useConversations, 
  useDMMessages, 
  useAvailableUsers,
  useCommunities,
  useCommunityMessages
} from '../hooks/useChatData';
import { useChatMutations } from '../hooks/useChatMutations';

const MessageLayout = ({
  userId,
  userRole,
  userName,
  mode = 'direct', // 'direct' or 'community'
  initialChatId = null,
  initialUserObject = null, 
  onChatSelected,
  onLeaveCommunity,
  onDisbandCommunity,
  onToggleChat
}) => {
  const queryClient = useQueryClient();
  const { socketService } = useSocket();
  const { updateUser } = useAuth();
  const { clearContextNotifications } = useNotifications();
  const messagesEndRef = React.useRef(null);
  
  const blockedStorageKey = useMemo(() => {
    if (!userId) return null;
    return `blocked-messages-${userId}`;
  }, [userId]);

  /* ==========================================================================
     1. STATE HOOK DECLARATIONS FIRST (Prevents Dead-Zone Initialization Errors)
     ========================================================================== */
  const [selectedItem, setSelectedItem] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Search Users (Direct Mode)
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // Sidebar Search (Community Mode or Conversation Filter)
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');

  // Message Search & Select
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showOptions, setShowOptions] = useState(false);

  const [typingUsers, setTypingUsers] = useState([]);
  const [blockedMessages, setBlockedMessages] = useState([]);

  // Sidebar Resize State
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = React.useRef(null);

  const startResizing = React.useCallback((e) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const resize = React.useCallback((e) => {
    if (isResizing && sidebarRef.current) {
      const sidebarLeft = sidebarRef.current.getBoundingClientRect().left;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= 250 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // Banned state initialization: read from localStorage as a fast initial value,
  // then sync with the real DB value on mount to fix the offline-unban stuck state.
  const [isChatBanned, setIsChatBanned] = useState(() => {
     try {
         const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
         if (userStr) {
             const userObj = JSON.parse(userStr);
             return userObj.is_active === false;
         }
     } catch (e) {}
     return false;
  });

  // On mount: fetch the live is_active value from the server so a user unbanned
  // while offline is not stuck in the banned state forever.
  useEffect(() => {
    const syncBanStatus = async () => {
      try {
        const data = await authApi.getCurrentUser();
        const freshUser = data?.user || data;
        if (freshUser) {
          const banned = freshUser.is_active === false;
          setIsChatBanned(banned);
          // Keep AuthContext and localStorage in sync
          updateUser({ is_active: freshUser.is_active });
        }
      } catch (e) {
        // Non-critical — silently ignore if the request fails
      }
    };
    syncBanStatus();
  }, []);

  /* ==========================================================================
     2. DATA FETCHING LAYER
     ========================================================================== */
  const { data: conversations, isLoading: loadingConversations } = useConversations(mode === 'direct' ? userId : null);
  const { data: communities, isLoading: loadingCommunities } = useCommunities(mode === 'community' ? userRole : null, userId);
  const { data: usersData } = useAvailableUsers(mode === 'direct' ? userId : null);
  
  // Messages Data
  const { data: dmMessages } = useDMMessages(
    mode === 'direct' ? userId : null, 
    mode === 'direct' ? selectedItem?.user_id : null
  );
  
  const { data: commMessages } = useCommunityMessages(
    mode === 'community' ? selectedItem?.id : null,
    userId
  );

  const activeMessages = mode === 'direct' ? (dmMessages || []) : (commMessages || []);
  const activeList = mode === 'direct' ? (conversations || []) : (communities || []);
  const loading = mode === 'direct' ? loadingConversations : loadingCommunities;

  const selectedChatKey = useMemo(() => {
    if (!selectedItem) return null;
    if (mode === 'direct') return `direct-${selectedItem.user_id}`;
    return `community-${selectedItem.id}`;
  }, [mode, selectedItem]);

  /* ==========================================================================
     3. SYNC SIDE EFFECT LISTENERS
     ========================================================================== */
  useEffect(() => {
    if (onToggleChat) {
      onToggleChat(!!selectedItem);
    }
  }, [selectedItem, onToggleChat]);

  useEffect(() => {
    if (!blockedStorageKey) return;
    try {
      const raw = localStorage.getItem(blockedStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      setBlockedMessages(parsed);
    } catch (error) {
      console.error('Failed to restore blocked messages from storage', error);
    }
  }, [blockedStorageKey]);

  useEffect(() => {
    if (!blockedStorageKey) return;
    try {
      localStorage.setItem(blockedStorageKey, JSON.stringify(blockedMessages));
    } catch (error) {
      console.error('Failed to persist blocked messages to storage', error);
    }
  }, [blockedMessages, blockedStorageKey]);

  const visibleBlockedMessages = useMemo(() => {
    if (!selectedChatKey) return [];
    const activeIds = new Set((activeMessages || []).map(m => String(m.id)));
    return blockedMessages.filter((msg) => 
      msg.chat_key === selectedChatKey && !activeIds.has(String(msg.id))
    );
  }, [blockedMessages, selectedChatKey, activeMessages]);

  const renderedMessages = useMemo(() => {
    const all = [...activeMessages, ...visibleBlockedMessages];
    all.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    return all;
  }, [activeMessages, visibleBlockedMessages]);

  // Mutations
  const { 
    sendDM, 
    deleteMultipleDMs, 
    sendCommunityMessage, 
    deleteMultipleCommunityMessages
  } = useChatMutations();

  // Socket Listeners
  useEffect(() => {
    if (!socketService || !socketService.socket) return;

    const handleNewNotification = (data) => {
      if (mode === 'direct') {
          queryClient.invalidateQueries(['conversations', userId]);
      } else {
          queryClient.invalidateQueries(['communities']);
      }
    };

    const handleNewMessage = (data) => {
       setBlockedMessages(prev => prev.filter(msg => String(msg.id) !== String(data.id)));
       if (mode === 'direct') {
          queryClient.invalidateQueries(['conversations', userId]);
          if (selectedItem && (data.sender_id === selectedItem.user_id || data.receiver_id === selectedItem.user_id)) {
             queryClient.invalidateQueries(['dm-messages', userId, selectedItem.user_id]);
          }
       } else {
          if (data.community_id) {
             queryClient.invalidateQueries(['communities']); 
             if (selectedItem?.id === data.community_id) {
                queryClient.invalidateQueries(['community-messages', selectedItem.id]);
             }
          }
       }
    };

    const handleNewDirectMessage = (data) => {
       setBlockedMessages(prev => prev.filter(msg => String(msg.id) !== String(data.id)));
       if (mode === 'direct') {
          queryClient.invalidateQueries(['conversations', userId]);
          
          const isCurrentChat = selectedItem && (
             (selectedItem.user_id === 'anonymous' && data.is_anonymous) ||
             (!data.is_anonymous && (data.sender_id === selectedItem.user_id || data.receiver_id === selectedItem.user_id))
          );
          
          if (isCurrentChat) {
             queryClient.invalidateQueries(['dm-messages', userId, selectedItem.user_id]);
          }
       }
    };

    const handleTyping = (data) => {
        if (data.isTyping) {
             setTypingUsers(prev => [...new Set([...prev, data.senderName || data.userName])]);
        } else {
             setTypingUsers(prev => prev.filter(u => u !== (data.senderName || data.userName)));
        }
    };

    const handleDMTyping = (data) => {
        if (data.isTyping) {
             setTypingUsers(prev => [...new Set([...prev, data.senderName])]);
        } else {
             setTypingUsers(prev => prev.filter(u => u !== data.senderName));
        }
    };

    const handleMessageDelivered = (data) => {
        if (mode === 'direct') {
            queryClient.setQueryData(['dm-messages', userId, selectedItem?.user_id], (oldData) => {
                if (!oldData) return oldData;
                return oldData.map(msg => 
                    msg.id === data.messageId ? { ...msg, delivered_at: data.delivered_at } : msg
                );
            });
        }
    };

    const handleMessageRead = (data) => {
        if (mode === 'direct') {
            queryClient.setQueryData(['dm-messages', userId, selectedItem?.user_id], (oldData) => {
                if (!oldData) return oldData;
                return oldData.map(msg => 
                    msg.id === data.messageId ? { ...msg, is_read: true, read_at: data.read_at } : msg
                );
            });
            queryClient.invalidateQueries(['conversations', userId]);
         }
    };

    const handleChatBanned = () => {
        setIsChatBanned(true);
        updateUser({ is_active: false });
        try {
             const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
             if (userStr) {
                 const userObj = JSON.parse(userStr);
                 userObj.is_active = false;
                 if (localStorage.getItem('user')) localStorage.setItem('user', JSON.stringify(userObj));
                 if (sessionStorage.getItem('user')) sessionStorage.setItem('user', JSON.stringify(userObj));
             }
         } catch (e) {}
    };

    const handleChatUnbanned = () => {
        setIsChatBanned(false);
        updateUser({ is_active: true });
        try {
             const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
             if (userStr) {
                 const userObj = JSON.parse(userStr);
                 userObj.is_active = true;
                 if (localStorage.getItem('user')) localStorage.setItem('user', JSON.stringify(userObj));
                 if (sessionStorage.getItem('user')) sessionStorage.setItem('user', JSON.stringify(userObj));
             }
         } catch (e) {}
    };

    const handleMessageBlocked = (data) => {
      const chatKey = mode === 'direct' ? `direct-${data.receiver_id}` : `community-${data.community_id}`;
      const baseBlockedMessage = {
        id: data.id || `blocked-${Date.now()}`,
        chat_key: chatKey,
        client_message_id: data.client_message_id,
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        community_id: data.community_id,
        sender_name: data.sender_name || userName || 'You',
        content: data.content,
        created_at: data.created_at || new Date().toISOString(),
        is_anonymous: Boolean(data.is_anonymous),
        moderation_blocked: true,
        blocked_reason: data.blocked_reason || 'content_moderation',
        confidence: data.confidence || 0,
        local_only: true
      };

      setBlockedMessages((prev) => {
        const exists = prev.some((msg) => {
          if (data.client_message_id && msg.client_message_id) {
            return msg.client_message_id === data.client_message_id;
          }
          return msg.id === baseBlockedMessage.id;
        });
        if (exists) return prev;
        return [...prev, baseBlockedMessage];
      });
    };

    socketService.socket.on('new-message', handleNewMessage); 
    socketService.socket.on('new-direct-message', handleNewDirectMessage); 
    socketService.socket.on('direct-message-sent', handleNewDirectMessage); 
    socketService.socket.on('user-typing', handleTyping); 
    socketService.socket.on('dm-user-typing', handleDMTyping); 
    socketService.socket.on('message-delivered', handleMessageDelivered); 
    socketService.socket.on('message-read', handleMessageRead); 
    socketService.socket.on('message-blocked', handleMessageBlocked); 
    socketService.socket.on('chat-banned', handleChatBanned);
    socketService.socket.on('chat-unbanned', handleChatUnbanned);
    socketService.socket.on('new-notification', handleNewNotification);

    return () => {
        socketService.socket.off('new-message', handleNewMessage);
        socketService.socket.off('new-direct-message', handleNewDirectMessage);
        socketService.socket.off('direct-message-sent', handleNewDirectMessage);
        socketService.socket.off('user-typing', handleTyping);
        socketService.socket.off('dm-user-typing', handleDMTyping);
        socketService.socket.off('message-delivered', handleMessageDelivered);
        socketService.socket.off('message-read', handleMessageRead);
        socketService.socket.off('message-blocked', handleMessageBlocked);
        socketService.socket.off('chat-banned', handleChatBanned);
        socketService.socket.off('chat-unbanned', handleChatUnbanned);
        socketService.socket.off('new-notification', handleNewNotification);
    };
  }, [socketService, queryClient, userId, selectedItem, mode, userName]);

  useEffect(() => {
    if (mode === 'community' && selectedItem?.id && socketService?.socket) {
      socketService.socket.emit('join-community', {
        communityId: selectedItem.id,
        userId,
        userName
      });
      return () => {
        socketService.socket.emit('leave-community', selectedItem.id);
      };
    }
  }, [mode, selectedItem?.id, socketService, userId, userName]);

  useEffect(() => {
    if (mode === 'direct' && selectedItem && userId) {
      const timer = setTimeout(() => {
        queryClient.invalidateQueries(['conversations', userId]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mode, selectedItem, userId, queryClient]);

  useEffect(() => {
      if (initialChatId && activeList.length > 0 && !selectedItem) {
          const found = activeList.find(i => (i.id === initialChatId || i.user_id === initialChatId));
          if (found) setSelectedItem(found);
      }
  }, [initialChatId, activeList]);

  useEffect(() => {
    if (!initialUserObject) return;
    if (mode !== 'direct') return;
    if (conversations === undefined) return;

    const existing = (conversations || []).find(c => c.user_id === initialUserObject.id);
    if (existing) {
      handleSelect(existing);
    } else {
      const newConv = {
        user_id: initialUserObject.id,
        user_name: initialUserObject.name,
        user_email: initialUserObject.email || '',
        user_role: initialUserObject.role || '',
        last_message: null,
      };
      handleSelect(newConv);
    }
  }, [initialUserObject, conversations]);

  /* ==========================================================================
     4. COMPONENT INTERACTION HANDLERS
     ========================================================================== */
  const handleSelect = (item) => {
      setSelectedItem(item);
      setInputValue('');
      setTypingUsers([]);
      setIsSearchMode(false);
      setIsSelectMode(false);
      setSelectedMessages([]);
      if (onChatSelected) onChatSelected(item);
      
      if (mode === 'direct') {
          queryClient.invalidateQueries(['conversations', userId]);
          // Skip sender-based notification clear for anonymous conversations —
          // user_id is the string "anonymous", not a real integer sender ID.
          if (item.user_id !== 'anonymous') {
              clearContextNotifications(null, item.user_id);
          }
      } else {
          queryClient.invalidateQueries(['communities', userRole, userId]);
          clearContextNotifications(item.course_id, null);
      }
  };

  const handleSend = async (anon) => {
      if (!inputValue.trim() || !selectedItem) return;
      const messageText = inputValue;
      const clientMessageId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      try {
          if (mode === 'direct') {
              await sendDM.mutateAsync({
                  senderId: userId,
                  receiverId: selectedItem.user_id,
                  message: messageText,
                  senderName: userName || 'User',
                  isAnonymous: anon,
                  clientMessageId
              });
          } else {
              if (selectedItem.status === 'inactive') return;
              await sendCommunityMessage.mutateAsync({
                  communityId: selectedItem.id,
                  userId: userId,
                  text: messageText,
                  senderName: userName || 'User',
                  clientMessageId
              });
          }
          setInputValue('');
      } catch (err) {
          console.error('Send failed', err);
      }
  };

  const handleReport = async (messageId, reason) => {
      try {
          await moderationApi.reportMessage(messageId, userId, reason);
          showSuccess('Message reported to Admin for review.');
      } catch (err) {
          const msg = err?.response?.data?.message || err?.message || 'Failed to report message';
          showError(msg);
          throw err; 
      }
  };

  const handleDeleteSelected = async () => {
      if (selectedMessages.length === 0) return;
      try {
          if (mode === 'direct') {
              await deleteMultipleDMs.mutateAsync(selectedMessages);
          } else {
              await deleteMultipleCommunityMessages.mutateAsync({
                  communityId: selectedItem.id, 
                  messageIds: selectedMessages 
              });
          }
          setSelectedMessages([]);
          setIsSelectMode(false);
      } catch (err) {
          console.error(err);
      }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [renderedMessages]);

  useEffect(() => {
    if (mode !== 'direct' || !activeMessages || activeMessages.length === 0 || !socketService?.socket || !selectedItem) {
      return;
    }
    const undeliveredMessages = activeMessages.filter(msg => msg.receiver_id === userId && !msg.delivered_at);
    undeliveredMessages.forEach(msg => { socketService.markMessageDelivered(msg.id); });

    const unreadMessages = activeMessages.filter(msg => msg.receiver_id === userId && !msg.is_read);
    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map(msg => msg.id);
      socketService.markMessagesRead(unreadIds, userId);
      setTimeout(() => { queryClient.invalidateQueries(['conversations', userId]); }, 300);
    }
  }, [activeMessages, mode, userId, socketService, selectedItem, queryClient]);

  const onStartNewConversation = (user) => {
    const existing = conversations.find(c => c.user_id === user.id);
    if (existing) {
      handleSelect(existing);
    } else {
      const newConv = {
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        user_role: user.role,
        last_message: null
      };
      handleSelect(newConv);
    }
    setShowUserSearch(false);
    setUserSearchQuery('');
  };

  const canSendAnonymously = mode === 'direct' && userRole === 'Student' && 
                            TEACHING_ROLES.includes(selectedItem?.user_role);

  const scrollToMessage = (msgId) => {
    if (!msgId) return;
    setTimeout(() => {
      const el = document.getElementById(`message-${msgId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.backgroundColor = 'rgba(6, 78, 59, 0.15)';
        el.style.transition = 'background-color 0.5s';
        setTimeout(() => { if (el) el.style.backgroundColor = ''; }, 2000);
      }
    }, 100);
  };

  const handleSearch = () => {
    if (!messageSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const query = messageSearchQuery.toLowerCase();
    const results = renderedMessages
      .map((msg, index) => ((msg.content || msg.text || '').toLowerCase().includes(query) ? index : -1))
      .filter((index) => index !== -1);
    
    setSearchResults(results);
    if (results.length > 0) {
      setCurrentSearchIndex(0);
      scrollToMessage(renderedMessages[results[0]]?.id);
    }
  };

  const navigateSearchResult = (direction) => {
    if (searchResults.length === 0) return;
    let newIndex = currentSearchIndex + direction;
    if (newIndex < 0) newIndex = searchResults.length - 1;
    if (newIndex >= searchResults.length) newIndex = 0;
    setCurrentSearchIndex(newIndex);
    scrollToMessage(renderedMessages[searchResults[newIndex]]?.id);
  };

  return (
    <div className="ch-layout-outer-frame">
      <div className={`ch-layout-split-view ${selectedItem ? 'ch-layout-split-view--active-window' : ''}`}>
        
        {/* Real-time Channels/DM Sidebar Component Wrapper */}
        <div 
          className="ch-sidebar-panel-wrapper"
          ref={sidebarRef}
          style={{ '--dynamic-sidebar-width': `${sidebarWidth}px` }}
        >
          <ChatSidebar 
            mode={mode}
            loading={loading}
            items={activeList}
            selectedItem={selectedItem}
            onSelect={handleSelect}
            searchQuery={sidebarSearchQuery}
            onSearchChange={setSidebarSearchQuery}
            showUserSearch={showUserSearch}
            setShowUserSearch={setShowUserSearch}
            userSearchQuery={userSearchQuery}
            setUserSearchQuery={setUserSearchQuery}
            availableUsers={usersData || []}
            onStartNewConversation={onStartNewConversation}
          />
        </div>

        {/* Resizer Handle */}
        <div 
          className={`ch-sidebar-resizer ${isResizing ? 'is-resizing' : ''}`}
          onMouseDown={startResizing}
        >
          <div className="ch-sidebar-resizer-line"></div>
        </div>
        
        {/* Focus Communications Thread Window Wrapper */}
        <div className="ch-window-panel-wrapper">
          <ChatWindow 
            mode={mode}
            userId={userId}
            selectedItem={selectedItem}
            onBack={() => setSelectedItem(null)}
            messages={renderedMessages}
            typingUsers={typingUsers}
            messagesEndRef={messagesEndRef}
            isSearchMode={isSearchMode}
            messageSearchQuery={messageSearchQuery}
            setMessageSearchQuery={setMessageSearchQuery}
            handleSearch={handleSearch} 
            searchResults={searchResults}
            currentSearchIndex={currentSearchIndex}
            navigateSearchResult={navigateSearchResult}
            closeSearch={() => { 
                setIsSearchMode(false); 
                setMessageSearchQuery('');
                setSearchResults([]);
            }}
            setIsSearchMode={setIsSearchMode}
            isSelectMode={isSelectMode}
            setIsSelectMode={setIsSelectMode}
            selectedMessages={selectedMessages}
            setSelectedMessages={setSelectedMessages}
            handleDeleteSelected={handleDeleteSelected}
            toggleMessageSelection={(id) => {
                setSelectedMessages(prev => prev.includes(id) ? prev.filter(x => x!==id) : [...prev, id]);
            }}
            showOptions={showOptions}
            setShowOptions={setShowOptions}
            handleOptionClick={(action) => {
               setShowOptions(false);
               if (action === 'delete' || action === 'select') setIsSelectMode(true);
               if (action === 'search') setIsSearchMode(true);
            }}
            canSendAnonymously={canSendAnonymously}
            isAnonymous={isAnonymous}
            setIsAnonymous={setIsAnonymous}
            inputValue={inputValue}
            setInputValue={setInputValue}
            isChatBanned={isChatBanned}
            onTyping={() => {}}
            onSend={(anon) => handleSend(anon || isAnonymous)}
            onLeaveCommunity={onLeaveCommunity}
            onDisbandCommunity={onDisbandCommunity}
            onReport={handleReport}
          />
        </div>

      </div>
    </div>
  );
};

export default MessageLayout;