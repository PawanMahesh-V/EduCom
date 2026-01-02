import React, { useState, useEffect, useRef } from 'react';
import MessageLayout from '../../components/MessageLayout';
import { useDirectMessages, useDMTypingIndicator } from '../../hooks/useSocket';
import socketService from '../../services/socket';
import { directMessageApi } from '../../api';

const Messages = () => {
  const raw = sessionStorage.getItem('user');
  const currentUser = raw ? JSON.parse(raw) : null;
  const userId = currentUser?.id || currentUser?.userId;

  // Direct message states
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [dmTypingUsers, setDmTypingUsers] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [dmUserSearchQuery, setDmUserSearchQuery] = useState('');
  const [dmMessage, setDmMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Connect to socket FIRST - before any hooks that use it
  useEffect(() => {
    if (!userId) return;
    socketService.connect(userId);
  }, [userId]);

  // Real-time direct messages
  const { sendDirectMessage } = useDirectMessages(userId, (newMessage) => {
    fetchConversations();
    
    if (selectedConversation && 
        (newMessage.sender_id === selectedConversation.user_id || 
         newMessage.receiver_id === selectedConversation.user_id)) {
      setDmMessages(prev => {
        // Check if message already exists (avoid duplicates from optimistic updates)
        const exists = prev.some(msg => 
          msg.id === newMessage.id || 
          (String(msg.id).startsWith('temp-') && 
           msg.content === newMessage.content && 
           msg.sender_id === newMessage.sender_id)
        );
        if (exists) {
          // Replace temp message with real one
          return prev.map(msg => 
            String(msg.id).startsWith('temp-') && 
            msg.content === newMessage.content && 
            msg.sender_id === newMessage.sender_id
              ? newMessage
              : msg
          );
        }
        return [...prev, newMessage];
      });
      scrollToBottom();
    }
  }, (sentMessage) => {
    // Handle message sent confirmation - replace temp ID with real ID
    console.log('[Messages] Message sent confirmed:', sentMessage);
    setDmMessages(prev => prev.map(msg => 
      String(msg.id).startsWith('temp-') && 
      msg.content === sentMessage.content && 
      msg.sender_id === sentMessage.sender_id
        ? { ...msg, id: sentMessage.id }
        : msg
    ));
  });

  const dmTypingIndicator = useDMTypingIndicator(
    selectedConversation?.user_id,
    currentUser?.name || 'Admin'
  );

  useEffect(() => {
    if (selectedConversation) {
      dmTypingIndicator.onTyping((data) => {
        if (data.isTyping) {
          setDmTypingUsers(prev => [...new Set([...prev, data.senderName])]);
          setTimeout(() => {
            setDmTypingUsers(prev => prev.filter(name => name !== data.senderName));
          }, 3000);
        } else {
          setDmTypingUsers(prev => prev.filter(name => name !== data.senderName));
        }
      });
    }
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [dmMessages]);

  useEffect(() => {
    if (userId) {
      fetchConversations();
      fetchAvailableUsers();
    }
  }, [userId]);

  const fetchConversations = async () => {
    try {
      const response = await directMessageApi.getConversations(userId);
      setConversations(response || []);
    } catch (err) {
      setConversations([]);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await directMessageApi.getUsers(userId);
      setAvailableUsers(response || []);
    } catch (err) {
      setAvailableUsers([]);
    }
  };

  const loadDirectMessages = async (otherUserId) => {
    try {
      const response = await directMessageApi.getMessages(userId, otherUserId);
      setDmMessages(response || []);
      scrollToBottom();
    } catch (err) {
      setDmMessages([]);
    }
  };

  // Direct Message handlers
  const handleSendDirectMessage = () => {
    if (dmMessage.trim() && selectedConversation) {
      // Optimistic update - add message to UI immediately
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        sender_id: userId,
        receiver_id: selectedConversation.user_id,
        content: dmMessage,
        is_read: false,
        is_anonymous: false,
        created_at: new Date().toISOString(),
        sender_name: currentUser?.name || 'Admin'
      };
      setDmMessages(prev => [...prev, optimisticMessage]);
      scrollToBottom();
      
      // Also update conversations list immediately
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.user_id === selectedConversation.user_id);
        const updatedConversation = {
          ...selectedConversation,
          last_message: dmMessage,
          last_message_time: new Date().toISOString(),
          unread_count: 0
        };
        
        if (existingIndex >= 0) {
          // Update existing conversation and move to top
          const updated = [...prev];
          updated.splice(existingIndex, 1);
          return [updatedConversation, ...updated];
        } else {
          // Add new conversation at top
          return [updatedConversation, ...prev];
        }
      });
      
      sendDirectMessage(
        selectedConversation.user_id,
        dmMessage,
        currentUser?.name || 'Admin'
      );
      setDmMessage('');
      dmTypingIndicator.stopTyping();
    }
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    
    // If conversation is null (back button clicked), just clear messages and return
    if (!conversation) {
      setDmMessages([]);
      return;
    }
    
    setDmMessages([]);
    await loadDirectMessages(conversation.user_id);
    // Refresh conversations to update unread count
    await fetchConversations();
  };

  const handleStartNewConversation = async (selectedUser) => {
    const newConversation = {
      user_id: selectedUser.id,
      user_name: selectedUser.name,
      user_email: selectedUser.email,
      last_message: null,
      last_message_time: null,
      unread_count: 0
    };
    
    setSelectedConversation(newConversation);
    setDmMessages([]);
    setShowUserSearch(false);
    setDmUserSearchQuery('');
  };

  const handleDMTyping = () => {
    if (selectedConversation) {
      dmTypingIndicator.startTyping();
    }
  };

  // Handle message deletion - remove from local state and refresh conversations
  const handleMessageDeleted = (messageId) => {
    const idToRemove = Number(messageId);
    console.log('[Messages] handleMessageDeleted called with:', messageId, 'as number:', idToRemove);
    setDmMessages(prev => {
      const newMessages = prev.filter(msg => Number(msg.id) !== idToRemove);
      console.log('[Messages] Messages before:', prev.length, 'after:', newMessages.length);
      return newMessages;
    });
    // Refresh conversations to update last message preview
    fetchConversations();
  };

  return (
    <MessageLayout
      mode="direct"
      userId={userId}
      userRole={currentUser?.role}
      messagesEndRef={messagesEndRef}
      conversations={conversations}
      selectedConversation={selectedConversation}
      dmMessages={dmMessages}
      dmTypingUsers={dmTypingUsers}
      dmMessage={dmMessage}
      setDmMessage={setDmMessage}
      userSearchQuery={dmUserSearchQuery}
      setUserSearchQuery={setDmUserSearchQuery}
      showUserSearch={showUserSearch}
      setShowUserSearch={setShowUserSearch}
      availableUsers={availableUsers}
      onSelectConversation={handleSelectConversation}
      onStartNewConversation={handleStartNewConversation}
      onSendDirectMessage={handleSendDirectMessage}
      onDMTyping={handleDMTyping}
      onMessageDeleted={handleMessageDeleted}
      loading={false}
    />
  );
};

export default Messages;
