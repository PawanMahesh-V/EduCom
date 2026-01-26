import React, { useState, useEffect, useRef } from 'react';
import MessageLayout from '../../components/MessageLayout';
import { useCommunityMessages, useTypingIndicator } from '../../hooks/useSocket';
import socketService from '../../services/socket';
import { communityApi } from '../../api';
import { showAlert } from '../../utils/alert';
import ConfirmDialog from '../../components/ConfirmDialog';

const Communities = ({ initialChat }) => {
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

  const isHod = (user?.role === 'HOD');

  // Connect to socket
  useEffect(() => {
    if (!userId) return;
    socketService.connect(userId);
  }, [userId]);

  // Join all communities on page load and listen for new messages
  useEffect(() => {
    if (!userId) return;
    
    const socket = socketService.connect(userId);
    
    const joinAllCommunities = async () => {
      try {
        const communities = isHod 
          ? await communityApi.getHodCommunities(userId)
          : await communityApi.getTeacherCommunities(userId);
        communities.forEach(community => {
          socket.emit('join-community', community.id);
        });
      } catch (err) {
        console.error('Failed to join communities:', err);
      }
    };
    
    joinAllCommunities();
    
    const handleGlobalCommunityMessage = (newMessage) => {
      if (newMessage.community_id) {
        const fetcher = isHod ? communityApi.getHodCommunities : communityApi.getTeacherCommunities;
        fetcher(userId).then(communities => {
          const formattedChats = communities.map(community => ({
            id: community.id,
            name: community.course_name || community.name,
            courseId: community.course_id,
            courseName: community.course_name,
            courseCode: community.course_code,
            lastMessage: 'Start chatting...',
            time: new Date(community.created_at).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' }),
            unread: community.unread_count || 0
          }));
          setChats(formattedChats);
        }).catch(() => {});
      }
    };

    socket.on('new-message', handleGlobalCommunityMessage);

    return () => {
      socket.off('new-message', handleGlobalCommunityMessage);
    };
  }, [userId]);

  // Handle initial chat from MyCourses navigation
  useEffect(() => {
    if (initialChat) {
      setChats([initialChat]);
      setLoading(false);
      handleChatSelect(initialChat);
      // Populate full list silently in background
      fetchCommunities(true);
    } else {
      fetchCommunities();
    }
  }, [initialChat, userId]);

  // Real-time chat for selected community
  const { sendMessage: sendSocketMessage } = useCommunityMessages(
    selectedChat?.id,
    (newMessage) => {
      if (newMessage.community_id === selectedChat?.id) {
        if (addedMessageIds.current.has(newMessage.id)) {
          return;
        }
        
        addedMessageIds.current.add(newMessage.id);
        
        setMessages(prev => {
          const tempExists = prev.some(msg => 
            String(msg.id).startsWith('temp-') && 
            msg.text === newMessage.content && 
            msg.senderId === newMessage.sender_id
          );
          
          if (tempExists) {
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
    user?.name || 'Teacher'
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
      const teacherCommunities = isHod 
        ? await communityApi.getHodCommunities(userId)
        : await communityApi.getTeacherCommunities(userId);
      
      const formattedChats = teacherCommunities.map(community => ({
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
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        text: message,
        sender: user?.name || 'Teacher',
        senderId: userId,
        time: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })
      };
      setMessages(prev => [...prev, optimisticMessage]);
      scrollToBottom();
      
      sendSocketMessage(
        message,
        userId,
        user?.name || 'Teacher',
        false
      );
      setMessage('');
      stopTyping();
    }
  };

  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    
    if (!chat) {
      setMessages([]);
      return;
    }
    
    setMessages([]);
    addedMessageIds.current.clear();
    
    setChats(prev => prev.filter(c => c !== null).map(c => 
      c.id === chat.id ? { ...c, unread_count: 0 } : c
    ));
    
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
      console.error('Failed to load messages:', err);
    }
  };

  const handleCommunityMessageDeleted = async (messageId) => {
    if (!selectedChat) return;
    
    try {
      await communityApi.deleteMessage(selectedChat.id, messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      console.error('[Communities] Community message delete error:', err);
      showAlert('Failed to delete message', 'error');
    }
  };

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const handleDisbandCommunity = (chat) => {
    if (!chat) return;
    
    setConfirmDialog({
      open: true,
      title: 'Disband Community',
      message: `Are you sure you want to disband "${chat.name}"? This will delete the community and all messages permanently.`,
      onConfirm: () => {
        communityApi.delete(chat.id)
          .then(() => {
            showAlert('Community disbanded successfully', 'success');
            setSelectedChat(null);
            setChats(prev => prev.filter(c => c.id !== chat.id));
            setConfirmDialog(prev => ({ ...prev, open: false }));
          })
          .catch(err => {
            console.error(err);
            showAlert(err.message || 'Failed to disband community', 'error');
            setConfirmDialog(prev => ({ ...prev, open: false }));
          });
      }
    });
  };

  return (
    <>
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
        onDisbandCommunity={handleDisbandCommunity}
        loading={loading}
      />
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        confirmText="Disband"
        variant="danger"
      />
    </>
  );
};

export default Communities;
