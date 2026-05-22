import React, { useState } from 'react';
import MessageLayout from '../../components/MessageLayout';
import { communityApi } from '../../api';
import { showAlert } from '../../utils/alert';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';

const Communities = ({ initialChat, onToggleChat }) => {
  const { user } = useAuth();
  const userId = user?.id || user?.userId;

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
            setConfirmDialog(prev => ({ ...prev, open: false }));
            window.location.reload();
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
        userRole={user?.role}
        userName={user?.name}
        initialChatId={initialChat?.id}
        onDisbandCommunity={handleDisbandCommunity}
        onToggleChat={onToggleChat}
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
