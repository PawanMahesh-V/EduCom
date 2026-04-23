import React from 'react';
import UnifiedMessages from '../../components/UnifiedMessages';

const Messages = ({ initialMessageUser }) => {
  return <UnifiedMessages defaultRole="Teacher" allowAnonymous={false} initialMessageUser={initialMessageUser} />;
};

export default Messages;
