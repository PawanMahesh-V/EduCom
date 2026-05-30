import React, { useState } from 'react';
import MessageLayout from '../../components/MessageLayout';
import { communityApi } from '../../api';
import { showAlert } from '../../utils/alert';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';

const Communities = ({ initialChat, onChatSelected, onToggleChat }) => {
  const { user } = useAuth();
  const userId = user?.id || user?.userId;

  // ConfirmDialog State Management
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const handleLeaveCommunity = (chat) => {
    if (!chat) return;
    
    setConfirmDialog({
      open: true,
      title: 'Leave Community',
      message: `Are you sure you want to leave "${chat.name}"? You will be unenrolled from this course community.`,
      onConfirm: () => {
        communityApi.leaveCommunity(chat.id)
          .then(() => {
            showAlert('Successfully left the community', 'success');
            setConfirmDialog(prev => ({ ...prev, open: false }));
            // Reload to ensure state consistency across the community registry
            window.location.reload();
          })
          .catch(err => {
            console.error('Error leaving community:', err);
            showAlert(err.message || 'Failed to leave community. Please try again.', 'error');
            setConfirmDialog(prev => ({ ...prev, open: false }));
          });
      }
    });
  };

  return (
    <>
      {/* Community-mode layout injector */}
      <MessageLayout
        mode="community"
        userId={userId}
        userRole={user?.role}
        userName={user?.name}
        initialChatId={initialChat?.id}
        onChatSelected={onChatSelected}
        onLeaveCommunity={handleLeaveCommunity}
        onToggleChat={onToggleChat}
      />

      {/* Community leave confirmation overlay */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        confirmText="Leave Community"
        variant="danger"
      />
    </>
  );
};

export default Communities;