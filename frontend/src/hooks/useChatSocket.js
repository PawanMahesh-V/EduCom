import { useEffect } from 'react';

export const useChatSocket = ({
  socketService,
  queryClient,
  userId,
  userName,
  selectedItem,
  mode,
  updateUser,
  setBlockedMessages,
  setTypingUsers,
  setIsChatBanned
}) => {
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

};
