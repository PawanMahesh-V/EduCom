import React, { useState, useEffect, useRef } from 'react';
import MessageLayout from '../../components/MessageLayout';
import { useCommunityMessages, useTypingIndicator } from '../../hooks/useSocket';
import { useSocket } from '../../context/SocketContext';
import { communityApi } from '../../api';
import { showAlert } from '../../utils/alert';

const Communities = ({ initialChat, onChatSelected }) => {
  const raw = sessionStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  const userId = user?.id || user?.userId;

  // Chat states
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const addedMessageIds = useRef(new Set());

  const { socketService, isConnected } = useSocket();

  // Join all communities on page load and listen for new messages
  useEffect(() => {
    if (!userId || !isConnected) return;
    
    // Fetch and join all communities immediately
    const joinAllCommunities = async () => {
      try {
        const communities = await communityApi.getStudentCommunities(userId);
        communities.forEach(community => {
          socketService.joinCommunity(community.id);
        });
      } catch (err) {
        console.error('Failed to join communities:', err);
      }
    };
    
    joinAllCommunities();
    
    // Listen for new messages and refresh community list
    const handleGlobalCommunityMessage = (newMessage) => {
      if (newMessage.community_id) {
        // Refresh communities to update unread counts
        fetchCommunities(true);
      }
    };

    // Listen for new enrollments
    const handleEnrollment = () => {
      console.log('User enrolled in new course, refreshing communities...');
      fetchCommunities(true);
    };

    socketService.onNewMessage(handleGlobalCommunityMessage);
    socketService.onUserEnrolled(handleEnrollment);

    return () => {
      socketService.offNewMessage();
      socketService.offUserEnrolled();
    };
  }, [userId, isConnected, socketService]);

  // Handle initial chat from MyCourses navigation
  useEffect(() => {
    if (initialChat) {
      // Immediately show the selected chat and stop loading state
      setChats([initialChat]);
      setLoading(false);
      handleChatSelect(initialChat);
      // Load the full communities list in the background without toggling loader
      fetchCommunities(true);
    } else {
      fetchCommunities();
    }
  }, [initialChat, userId]);

  // Real-time chat for selected community
  const { sendMessage: sendSocketMessage } = useCommunityMessages(
    selectedChat?.id,
    (newMessage) => {
      // Only add message if it belongs to the currently selected community
      if (newMessage.community_id === selectedChat?.id) {
        // Check if we've already processed this message
        if (addedMessageIds.current.has(newMessage.id)) {
          return;
        }
        
        addedMessageIds.current.add(newMessage.id);
        
        setMessages(prev => {
          // Check if this is a confirmation of our optimistic message
          const tempExists = prev.some(msg => 
            String(msg.id).startsWith('temp-') && 
            msg.text === newMessage.content && 
            msg.senderId === newMessage.sender_id
          );
          
          if (tempExists) {
            // Replace temp message with real one
            return prev.map(msg => 
              String(msg.id).startsWith('temp-') && 
              msg.text === newMessage.content && 
              msg.senderId === newMessage.sender_id
                ? {
                    id: newMessage.id,
                    text: newMessage.content,
                    sender: newMessage.sender_name,
                    senderId: newMessage.sender_id,
                    time: new Date(newMessage.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })
                  }
                : msg
            );
          }
          
          // Check if message already exists with real ID
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          
          return [...prev, {
            id: newMessage.id,
            text: newMessage.content,
            sender: newMessage.sender_name,
            senderId: newMessage.sender_id,
            time: new Date(newMessage.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })
          }];
        });
        scrollToBottom();
      }
    },
    (data) => {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
    }
  );

  // Typing indicator
  const { onTyping, startTyping, stopTyping } = useTypingIndicator(
    selectedChat?.id,
    user?.name || 'Student'
  );

  useEffect(() => {
    if (selectedChat?.id) {
      const handleTyping = ({ userName, isTyping }) => {
        if (isTyping) {
          setTypingUsers(prev => [...new Set([...prev, userName])]);
        } else {
          setTypingUsers(prev => prev.filter(u => u !== userName));
        }
      };
      onTyping(handleTyping);
    }
  }, [selectedChat?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchCommunities = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const communities = await communityApi.getStudentCommunities(userId);
      
      const formattedChats = communities.map(community => ({
        id: community.id,
        name: community.course_name || community.name,
        courseId: community.course_id,
        courseName: community.course_name,
        courseCode: community.course_code,
        lastMessage: 'Start chatting...',
        time: new Date(community.created_at).toLocaleDateString(),
        unread: community.unread_count || 0
      }));
      
      setChats(formattedChats);
    } catch (err) {
      setChats([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && selectedChat) {
      // Optimistic update - add message to UI immediately
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        text: message,
        sender: user?.name || 'Student',
        senderId: userId,
        time: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })
      };
      setMessages(prev => [...prev, optimisticMessage]);
      scrollToBottom();
      
      sendSocketMessage(
        message,
        userId,
        user?.name || 'Student',
        false
      );
      setMessage('');
      stopTyping();
    }
  };

  // Handle community message deletion
  const handleCommunityMessageDeleted = async (messageId) => {
    if (!selectedChat) return;
    
    try {
      await communityApi.deleteMessage(selectedChat.id, messageId);
      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      console.error('[Communities] Community message delete error:', err);
      showAlert('Failed to delete message', 'error');
    }
  };

  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    
    // Notify parent if callback provided
    if (onChatSelected) {
      onChatSelected(chat);
    }
    
    // If chat is null (back button clicked), just clear messages and return
    if (!chat) {
      setMessages([]);
      return;
    }
    
    setMessages([]);
    addedMessageIds.current.clear();
    
    // Reset unread count for this chat in the UI
    setChats(prev => prev.map(c => 
      c.id === chat.id ? { ...c, unread_count: 0 } : c
    ));
    
    // Fetch existing messages for this community
    try {
      const msgs = await communityApi.getMessages(chat.id, userId);
      const formattedMessages = msgs.map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.sender_name,
        senderId: msg.sender_id,
        time: new Date(msg.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })
      }));
      setMessages(formattedMessages);
    } catch (err) {
      console.error('[Communities] Failed to fetch messages:', err);
    }
  };

  return (
    <MessageLayout
      mode="community"
      userId={userId}
      messagesEndRef={messagesEndRef}
      chats={chats}
      selectedChat={selectedChat}
      communityMessages={messages}
      communityTypingUsers={typingUsers}
      communityMessage={message}
      setCommunityMessage={setMessage}
      onSelectChat={handleChatSelect}
      onSendCommunityMessage={handleSendMessage}
      onCommunityTyping={startTyping}
      onCommunityMessageDeleted={handleCommunityMessageDeleted}
      loading={loading}
    />
  );
};

export default Communities;
