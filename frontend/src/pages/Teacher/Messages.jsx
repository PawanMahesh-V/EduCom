import React from 'react';
import UnifiedMessages from '../../components/UnifiedMessages';

const Messages = ({ initialMessageUser, onToggleChat }) => {
  return <UnifiedMessages defaultRole="Teacher" allowAnonymous={true} initialMessageUser={initialMessageUser} onToggleChat={onToggleChat} />;
};

export default Messages;
