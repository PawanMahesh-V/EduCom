import React from 'react';
import MessageLayout from './MessageLayout';

import { useAuth } from '../context/AuthContext';

const UnifiedMessages = ({ defaultRole }) => {
  const { user } = useAuth();
  const userId = user?.id || user?.userId;

  return (
    <MessageLayout
      mode="direct"
      userId={userId}
      userRole={user?.role || defaultRole}
      userName={user?.name}
    />
  );
};

export default UnifiedMessages;
