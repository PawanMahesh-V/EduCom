import React, { useEffect } from 'react';
import MessageLayout from './MessageLayout';
import { useAuth } from '../context/AuthContext';

const UnifiedMessages = ({ defaultRole, initialMessageUser, onToggleChat }) => {
  const { user } = useAuth();
  const userId = user?.id || user?.userId;

  // initialChatId for MessageLayout is the seller's user id (number or string)
  const initialChatId = initialMessageUser?.id ?? null;

  return (
    <MessageLayout
      mode="direct"
      userId={userId}
      userRole={user?.role || defaultRole}
      userName={user?.name}
      initialChatId={initialChatId}
      initialUserObject={initialMessageUser}
      onToggleChat={onToggleChat}
    />
  );
};

export default UnifiedMessages;
