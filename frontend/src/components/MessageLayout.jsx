import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';
import { TEACHING_ROLES } from '../constants';
import ChatSidebar from './Chat/ChatSidebar';
import ChatWindow from './Chat/ChatWindow';

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
  // Optional initial selection overrides or callbacks
  initialChatId = null, 
  onChatSelected,
  onLeaveCommunity, // kept as prop or move to hook? Kept as specific logic often resides in parent
  onDisbandCommunity
}) => {
  const queryClient = useQueryClient();
  const { socketService } = useSocket();
  const messagesEndRef = React.useRef(null);

  // --- State ---
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
  const [contextMenuMessage, setContextMenuMessage] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showOptions, setShowOptions] = useState(false);

  const [typingUsers, setTypingUsers] = useState([]);

  // --- Data Fetching ---
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

  // --- Mutations ---
  const { 
    sendDM, 
    deleteDM, 
    deleteMultipleDMs, 
    sendCommunityMessage, 
    deleteCommunityMessage,
    deleteMultipleCommunityMessages
  } = useChatMutations();

  // --- Socket Listeners (Invalidation) ---
  useEffect(() => {
    if (!socketService || !socketService.socket) {
      console.log('[MessageLayout] Socket service not available');
      return;
    }

    console.log('[MessageLayout] Setting up socket listeners, mode:', mode);

    const handleNewDirectMessage = (data) => {
       console.log('[MessageLayout] ✅ Received new-direct-message:', data);
       // Always refetch conversations to update unread counts
       queryClient.refetchQueries(['conversations', userId]);
       // Refetch messages for all DM queries to ensure UI updates
       queryClient.refetchQueries(['dm-messages']);
    };

    const handleDirectMessageSent = (data) => {
       console.log('[MessageLayout] ✅ Received direct-message-sent:', data);
       // Refetch conversations and messages
       queryClient.refetchQueries(['conversations', userId]);
       queryClient.refetchQueries(['dm-messages']);
    };

    const handleNewCommunityMessage = (data) => {
       console.log('[MessageLayout] ✅ Received new-message:', data);
       // Community message - refetch all community data
       queryClient.refetchQueries(['communities']);
       queryClient.refetchQueries(['community-messages']);
    };

    const handleMessageDeleted = (data) => {
       console.log('[MessageLayout] ✅ Received message-deleted:', data);
       // Refetch all relevant queries
       queryClient.refetchQueries(['dm-messages']);
       queryClient.refetchQueries(['community-messages']);
       queryClient.refetchQueries(['conversations']);
    };

    const handleTyping = (data) => {
        console.log('[MessageLayout] Typing indicator:', data);
        // Community typing indicator
        if (data.isTyping) {
             setTypingUsers(prev => [...new Set([...prev, data.userName])]);
        } else {
             setTypingUsers(prev => prev.filter(u => u !== data.userName));
        }
    };

    const handleDMTyping = (data) => {
        console.log('[MessageLayout] DM Typing indicator:', data);
        // Direct message typing indicator
        if (data.isTyping) {
             setTypingUsers(prev => [...new Set([...prev, data.senderName])]);
        } else {
             setTypingUsers(prev => prev.filter(u => u !== data.senderName));
        }
    };

    // Attach ALL listeners regardless of mode - messages can come in at any time
    socketService.socket.on('new-direct-message', handleNewDirectMessage);
    socketService.socket.on('direct-message-sent', handleDirectMessageSent);
    socketService.socket.on('dm-user-typing', handleDMTyping);
    socketService.socket.on('new-message', handleNewCommunityMessage);
    socketService.socket.on('message-deleted', handleMessageDeleted);
    socketService.socket.on('user-typing', handleTyping);

    console.log('[MessageLayout] Socket listeners attached successfully');

    return () => {
      console.log('[MessageLayout] Cleaning up socket listeners');
      // Clean up all listeners
      socketService.socket.off('new-direct-message', handleNewDirectMessage);
      socketService.socket.off('direct-message-sent', handleDirectMessageSent);
      socketService.socket.off('new-message', handleNewCommunityMessage);
      socketService.socket.off('message-deleted', handleMessageDeleted);
      socketService.socket.off('user-typing', handleTyping);
      socketService.socket.off('dm-user-typing', handleDMTyping);
    };
  }, [socketService, queryClient, userId, mode]); // Removed selectedItem from dependencies

  // Join/Leave community rooms when selection changes
  useEffect(() => {
      if (mode === 'community' && socketService && selectedItem?.id) {
          console.log('[MessageLayout] Joining community room:', selectedItem.id);
          socketService.joinCommunity(selectedItem.id);
          
          return () => {
              console.log('[MessageLayout] Leaving community room:', selectedItem.id);
              socketService.leaveCommunity(selectedItem.id);
          };
      }
  }, [mode, socketService, selectedItem?.id]);

  // Initial Selection
  useEffect(() => {
      // If initialChatId provided (e.g. from nav), select it
      if (initialChatId && activeList.length > 0 && !selectedItem) {
          const found = activeList.find(i => (i.id === initialChatId || i.user_id === initialChatId));
          if (found) setSelectedItem(found);
      }
  }, [initialChatId, activeList]);


  // --- Handlers ---

  const handleSelect = (item) => {
      console.log('[MessageLayout] Selecting item:', item, 'mode:', mode);
      setSelectedItem(item);
      setInputValue('');
      setTypingUsers([]);
      // Reset search/select modes
      setIsSearchMode(false);
      setIsSelectMode(false);
      setSelectedMessages([]);
      
      // Join community room if in community mode
      if (mode === 'community' && item?.id && socketService) {
          console.log('[MessageLayout] Joining community room:', item.id);
          socketService.joinCommunity(item.id);
      }
      
      if (onChatSelected) onChatSelected(item);
      
      // Mark read? usually handled by fetching messages which updates 'unread' on backend or explicit call
      // For now we assume fetch does it or we ignore unread clearing logic for simplicity in this step
  };

  const handleSend = async (anon) => {
      if (!inputValue.trim() || !selectedItem) return;

      try {
          if (mode === 'direct') {
              await sendDM.mutateAsync({
                  senderId: userId,
                  receiverId: selectedItem.user_id,
                  message: inputValue,
                  senderName: userName || 'User',
                  isAnonymous: anon
              });
// ...
              // Optimistic UI handled by mutation invalidation, but can clear input immediately
          } else {
              if (selectedItem.status === 'inactive') return;
              await sendCommunityMessage.mutateAsync({
                  communityId: selectedItem.id,
                  senderId: userId,
                  senderName: userName || 'User',
                  text: inputValue
              });
          }
          setInputValue('');
          // Stop typing?
      } catch (err) {
          console.error('Send failed', err);
      }
  };

  const handleDeleteSelected = async () => {
      if (selectedMessages.length === 0) return;
      
      try {
          if (mode === 'direct') {
              await deleteMultipleDMs.mutateAsync(selectedMessages);
          } else {
              // Now implemented!
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

  const handleMessageContextMenu = (e, msg) => {
      const msgSenderId = msg.sender_id || msg.senderId;
      if (msgSenderId !== userId) return;
      e.preventDefault();
      setContextMenuMessage(msg);
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };
  
  const handleDeleteSingle = async (msgId) => {
      try {
          if (mode === 'direct') await deleteDM.mutateAsync(msgId);
          else await deleteCommunityMessage.mutateAsync({ communityId: selectedItem.id, messageId: msgId });
          setContextMenuMessage(null);
      } catch (err) { console.error(err); }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [activeMessages]);

  const onStartNewConversation = (user) => {
    // Check if conversation exists
    const existing = conversations.find(c => c.user_id === user.id);
    if (existing) {
      handleSelect(existing);
    } else {
      // Create temp conversation object
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


  return (
    <div className="chat-container">
      <div className="chat-layout">
        <ChatSidebar 
            mode={mode}
            loading={loading}
            items={activeList}
            selectedItem={selectedItem}
            onSelect={handleSelect}
            searchQuery={sidebarSearchQuery}
            onSearchChange={setSidebarSearchQuery}
            // Direct specific
            showUserSearch={showUserSearch}
            setShowUserSearch={setShowUserSearch}
            userSearchQuery={userSearchQuery}
            setUserSearchQuery={setUserSearchQuery}
            availableUsers={usersData || []}
            onStartNewConversation={onStartNewConversation}
        />
        
        <ChatWindow 
            mode={mode}
            userId={userId}
            selectedItem={selectedItem}
            // Simplify onBack to just clear selection
            onBack={() => setSelectedItem(null)}
            
            // Messages
            messages={activeMessages}
            typingUsers={typingUsers}
            messagesEndRef={messagesEndRef}
            
            // Search (simplified, keeping UI props)
            isSearchMode={isSearchMode}
            messageSearchQuery={messageSearchQuery}
            setMessageSearchQuery={setMessageSearchQuery}
            // handleSearch implementation omitted for brevity in this step, can add later
            handleSearch={() => {}} 
            searchResults={searchResults}
            currentSearchIndex={currentSearchIndex}
            navigateSearchResult={() => {}}
            closeSearch={() => { setIsSearchMode(false); }}
            setIsSearchMode={setIsSearchMode}
            
            // Selection / Delete
            isSelectMode={isSelectMode}
            setIsSelectMode={setIsSelectMode}
            selectedMessages={selectedMessages}
            setSelectedMessages={setSelectedMessages}
            handleDeleteSelected={handleDeleteSelected}
            toggleMessageSelection={(id) => {
                setSelectedMessages(prev => prev.includes(id) ? prev.filter(x => x!==id) : [...prev, id]);
            }}
            
            // Context Menu
            handleMessageContextMenu={handleMessageContextMenu}
            contextMenuMessage={contextMenuMessage}
            contextMenuPosition={contextMenuPosition}
            handleDeleteMessage={handleDeleteSingle}
            
            // Options
            showOptions={showOptions}
            setShowOptions={setShowOptions}
            handleOptionClick={(action) => {
               setShowOptions(false);
               if (action === 'delete' || action === 'select') setIsSelectMode(true);
            }}

            // Direct specific
            canSendAnonymously={canSendAnonymously}
            isAnonymous={isAnonymous}
            setIsAnonymous={setIsAnonymous}
            
            // Input
            inputValue={inputValue}
            setInputValue={setInputValue}
            // Typing omitted for brevity
            onTyping={() => {}}
            onSend={(anon) => handleSend(anon || isAnonymous)}
            
            // Community specific
            onLeaveCommunity={onLeaveCommunity}
            onDisbandCommunity={onDisbandCommunity}
        />
      </div>
    </div>
  );
};

export default MessageLayout;
