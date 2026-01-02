import React, { useState, useEffect, useRef } from 'react';
import MessageLayout from '../../components/MessageLayout';
import { useDirectMessages, useDMTypingIndicator } from '../../hooks/useSocket';
import socketService from '../../services/socket';
import { directMessageApi } from '../../api';

const Messages = () => {
  const raw = sessionStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  const userId = user?.id || user?.userId;

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

  // Connect to socket
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
        const exists = prev.some(msg => 
          msg.id === newMessage.id || 
          (String(msg.id).startsWith('temp-') && 
           msg.content === newMessage.content && 
           msg.sender_id === newMessage.sender_id)
        );
        if (exists) {
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
    user?.name || 'Teacher'
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

  const handleSendDirectMessage = () => {
    if (message.trim() && selectedConversation) {
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        sender_id: userId,
        receiver_id: selectedConversation.user_id,
        content: message,
        is_read: false,
        is_anonymous: false,
        created_at: new Date().toISOString(),
        sender_name: user?.name || 'Teacher'
      };
      setDmMessages(prev => [...prev, optimisticMessage]);
      scrollToBottom();
      
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.user_id === selectedConversation.user_id);
        const updatedConversation = {
          ...selectedConversation,
          last_message: message,
          last_message_time: new Date().toISOString(),
          unread_count: 0
        };
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated.splice(existingIndex, 1);
          return [updatedConversation, ...updated];
        } else {
          return [updatedConversation, ...prev];
        }
      });
      
      sendDirectMessage(
        selectedConversation.user_id,
        message,
        user?.name || 'Teacher'
      );
      
      setMessage('');
      dmTypingIndicator.stopTyping();
    }
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    
    if (!conversation) {
      setDmMessages([]);
      return;
    }
    
    setDmMessages([]);
    await loadDirectMessages(conversation.user_id, false);
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
    setUserSearchQuery('');
  };

  const handleDMTyping = () => {
    if (selectedConversation) {
      dmTypingIndicator.startTyping();
    }
  };

  const handleMessageDeleted = (messageId) => {
    const idToRemove = Number(messageId);
    console.log('[Messages] handleMessageDeleted called with:', messageId, 'as number:', idToRemove);
    setDmMessages(prev => {
      const newMessages = prev.filter(msg => Number(msg.id) !== idToRemove);
      console.log('[Messages] Messages before:', prev.length, 'after:', newMessages.length);
      return newMessages;
    });
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

export default Messages;
