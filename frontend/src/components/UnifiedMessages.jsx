import React, { useState, useEffect, useRef } from 'react';
import MessageLayout from './MessageLayout';
import { useDirectMessages, useDMTypingIndicator } from '../hooks/useSocket';
import { directMessageApi } from '../api';
import { useSocket } from '../context/SocketContext';

const UnifiedMessages = ({ defaultRole, allowAnonymous = false }) => {
  const raw = sessionStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  const userId = user?.id || user?.userId;

  // Socket connection from context (ensures we are using the global connection)
  const { socketService } = useSocket();

  // Direct message states
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [dmTypingUsers, setDmTypingUsers] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Real-time direct messages
  const { sendDirectMessage } = useDirectMessages(userId, (newMessage) => {
    // Update conversations list
    fetchConversations();
    
    // If this message is for the currently selected conversation, add it to the messages
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

  // DM typing indicator
  const dmTypingIndicator = useDMTypingIndicator(
    selectedConversation?.user_id,
    user?.name || defaultRole
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
      setLoading(true);
      const response = await directMessageApi.getConversations(userId);
      setConversations(response || []);
    } catch (err) {
      setConversations([]);
    } finally {
      setLoading(false);
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

  const loadDirectMessages = async (otherUserId, isAnon = false) => {
    try {
      const response = await directMessageApi.getMessages(userId, otherUserId, isAnon);
      setDmMessages(response || []);
      scrollToBottom();
    } catch (err) {
      setDmMessages([]);
    }
  };

  const handleSendDirectMessage = (isAnonymous = false) => {
    // If anonymity is not allowed, force it to false
    if (!allowAnonymous) isAnonymous = false;

    console.log('[Messages] handleSendDirectMessage called with isAnonymous:', isAnonymous);
    if (message.trim() && selectedConversation) {
      console.log('[Messages] Calling sendDirectMessage with isAnonymous:', isAnonymous);
      
      // Optimistic update - add message to UI immediately
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        sender_id: userId,
        receiver_id: selectedConversation.user_id,
        content: message,
        is_read: false,
        is_anonymous: isAnonymous,
        created_at: new Date().toISOString(),
        sender_name: isAnonymous ? 'Anonymous Student' : (user?.name || defaultRole)
      };
      setDmMessages(prev => [...prev, optimisticMessage]);
      scrollToBottom();
      
      // Also update conversations list immediately
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.user_id === selectedConversation.user_id);
        const updatedConversation = {
          ...selectedConversation,
          last_message: message,
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
        message,
        user?.name || defaultRole,
        isAnonymous
      );
      
      setMessage('');
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
    loadDirectMessages(conversation.user_id, false);
    // Refresh conversations to update unread count
    fetchConversations();
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
    setUserSearchQuery('');
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
      userRole={user?.role}
      messagesEndRef={messagesEndRef}
      conversations={conversations}
      selectedConversation={selectedConversation}
      dmMessages={dmMessages}
      dmTypingUsers={dmTypingUsers}
      dmMessage={message}
      setDmMessage={setMessage}
      userSearchQuery={userSearchQuery}
      setUserSearchQuery={setUserSearchQuery}
      showUserSearch={showUserSearch}
      setShowUserSearch={setShowUserSearch}
      availableUsers={availableUsers}
      onSelectConversation={handleSelectConversation}
      onStartNewConversation={handleStartNewConversation}
      onSendDirectMessage={handleSendDirectMessage}
      onDMTyping={handleDMTyping}
      onMessageDeleted={handleMessageDeleted}
      loading={loading}
    />
  );
};

export default UnifiedMessages;
