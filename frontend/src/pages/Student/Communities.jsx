import React, { useState } from 'react';
import MessageLayout from '../../components/MessageLayout';
import { communityApi } from '../../api';
import { showAlert } from '../../utils/alert';
import ConfirmDialog from '../../components/ConfirmDialog';

import { useAuth } from '../../context/AuthContext';

const Communities = ({ initialChat, onChatSelected }) => {
  const { user } = useAuth();
  const userId = user?.id || user?.userId;

  // We maintain ConfirmDialog here because it's a UI overlay specific to this page's logic (leaving community)
  // Although MessageLayout handles onLeaveCommunity trigger, the UI for confirmation can live here.
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
      message: `Are you sure you want to leave "${chat.name}"? You will be unenrolled from the course.`,
      onConfirm: () => {
        communityApi.leaveCommunity(chat.id)
          .then(() => {
            showAlert('Successfully left the community', 'success');
            setConfirmDialog(prev => ({ ...prev, open: false }));
            // We might need to force refresh communities list here.
            // MessageLayout hooks will re-fetch if we invalidate, but here we don't have access to queryClient easily?
            // Actually, leaveCommunity logic can ideally be a Mutation in useChatMutations passed to MessageLayout.
            // But for now, since we handle it here, we will just reload or let user navigate.
            window.location.reload(); // Simple brute force for now to ensure consistency, or pass callback to invalidate
          })
          .catch(err => {
            console.error(err);
            showAlert(err.message || 'Failed to leave community', 'error');
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
        onChatSelected={onChatSelected}
        onLeaveCommunity={handleLeaveCommunity}
      />
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        confirmText="Leave"
        variant="danger"
      />
    </>
  );
};

export default Communities;
