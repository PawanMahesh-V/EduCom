import React from 'react';
import UnifiedMessages from '../../components/UnifiedMessages';

const Messages = () => {
  return <UnifiedMessages defaultRole="Admin" allowAnonymous={false} />;
};

export default Messages;