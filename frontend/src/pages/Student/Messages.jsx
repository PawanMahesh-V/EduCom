import React from 'react';
import UnifiedMessages from '../../components/UnifiedMessages';

const Messages = ({ initialMessageUser }) => {
  return <UnifiedMessages defaultRole="Student" allowAnonymous={true} initialMessageUser={initialMessageUser} />;
};

export default Messages;
