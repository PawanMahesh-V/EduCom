import React from 'react';
import UnifiedMessages from '../../components/UnifiedMessages';

const Messages = ({ initialMessageUser, onToggleChat }) => {
  return <UnifiedMessages defaultRole="Admin" allowAnonymous={false} initialMessageUser={initialMessageUser} onToggleChat={onToggleChat} />;
};

export default Messages;