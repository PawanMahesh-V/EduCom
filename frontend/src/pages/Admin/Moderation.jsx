import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faBan, faTimes, faShieldHalved, faUnlock, faUsersSlash, faFlag, faRobot } from '@fortawesome/free-solid-svg-icons';
import { moderationApi } from '../../api';
import { useSocket } from '../../context/SocketContext';
import { showSuccess, showError } from '../../utils/alert';
import ConfirmDialog from '../../components/ConfirmDialog';
import Pagination from '../../components/Common/Pagination';

const Moderation = () => {
  /* ==========================================================================
     1. STATE HOOK VARIABLES FIRST (Previces Dead-Zone Errors)
     ========================================================================== */
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'banned'
  const [messages, setMessages] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannedLoading, setBannedLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [messagePage, setMessagePage] = useState(1);
  const [bannedPage, setBannedPage] = useState(1);
  const itemsPerPage = 5;
  
  useEffect(() => {
    setMessagePage(1);
    setBannedPage(1);
  }, [searchTerm]);

  const { socketService, isConnected } = useSocket();
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: null,
  });

  /* ==========================================================================
     2. ASYNC CORE INTEGRATION LOGIC
     ========================================================================== */
  const fetchReportedMessages = async () => {
    try {
      setLoading(true);
      const response = await moderationApi.getReportedMessages();
      setMessages(response.reported_messages || []);
    } catch (error) {
      console.error('Failed to fetch reported messages:', error);
      showError('Failed to load reported messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchBannedUsers = async () => {
    try {
      setBannedLoading(true);
      const response = await moderationApi.getBannedUsers();
      setBannedUsers(response.banned_users || []);
    } catch (error) {
      console.error('Failed to fetch banned users:', error);
      showError('Failed to load banned users');
    } finally {
      setBannedLoading(false);
    }
  };

  /* ==========================================================================
     3. SYNC SIDE EFFECT LISTENERS
     ========================================================================== */
  useEffect(() => {
    if (activeTab === 'queue') {
      fetchReportedMessages();
    } else if (activeTab === 'banned') {
      fetchBannedUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isConnected || !socketService?.socket) return;

    const handleNewReport = () => {
      if (activeTab === 'queue') fetchReportedMessages();
    };

    const handleReportHandled = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      if (activeTab === 'banned') fetchBannedUsers(); 
    };
    
    const handleAdminUserUpdate = () => {
      if (activeTab === 'banned') fetchBannedUsers();
    };

    socketService.socket.on('new-reported-message', handleNewReport);
    socketService.socket.on('reported-message-handled', handleReportHandled);
    socketService.socket.on('admin-user-update', handleAdminUserUpdate);

    return () => {
      socketService.socket.off('new-reported-message', handleNewReport);
      socketService.socket.off('reported-message-handled', handleReportHandled);
      socketService.socket.off('admin-user-update', handleAdminUserUpdate);
    };
  }, [isConnected, socketService, activeTab]);

  /* ==========================================================================
     4. OPERATIONAL EVENT ACTION HANDLERS
     ========================================================================== */
  const handleApprove = async (id) => {
    try {
      await moderationApi.approveMessage(id);
      showSuccess('Message approved and sent to chat!');
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      showError(error.message || 'Failed to approve message');
    }
  };

  const handleReject = async (id) => {
    try {
      await moderationApi.rejectMessage(id);
      showSuccess('Message permanently deleted from system flow.');
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      showError(error.message || 'Failed to reject message');
    }
  };

  const handleBanUser = (userId, messageId, userName) => {
    setConfirmState({
      open: true,
      title: 'Chat Ban User',
      message: `Are you sure you want to chat ban ${userName}? This will reject their pending message and suspend their channel privileges.`,
      confirmText: 'Ban User Account',
      onConfirm: async () => {
        setConfirmState(s => ({ ...s, open: false }));
        try {
          await moderationApi.banUser(userId, messageId);
          showSuccess(`User ${userName} has been banned successfully.`);
          setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (error) {
          showError(error.message || 'Failed to ban user');
        }
      }
    });
  };

  const handleUnbanUser = (userId, userName) => {
    setConfirmState({
      open: true,
      title: 'Unban User Profile',
      message: `Are you sure you want to restore full real-time communication privileges for ${userName}?`,
      confirmText: 'Unban User Account',
      onConfirm: async () => {
        setConfirmState(s => ({ ...s, open: false }));
        try {
          await moderationApi.unbanUser(userId);
          showSuccess(`User ${userName} has been unbanned successfully.`);
          setBannedUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
          showError(error.message || 'Failed to unban user');
        }
      }
    });
  };

  /* ==========================================================================
     5. SEARCH FILTER COMPUTATIONS
     ========================================================================== */
  const filteredMessages = messages.filter(msg => 
    (msg.sender_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (msg.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (msg.sender_email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBannedUsers = bannedUsers.filter(user =>
    (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedMessages = filteredMessages.slice((messagePage - 1) * itemsPerPage, messagePage * itemsPerPage);
  const paginatedBannedUsers = filteredBannedUsers.slice((bannedPage - 1) * itemsPerPage, bannedPage * itemsPerPage);

  return (
    <div className="md-moderation-wrapper">
      {/* Sub Navigation Segment */}
      <div className="md-sub-nav">
        <div className="md-sub-nav-tabs">
          <button
            className={`md-sub-nav-item ${activeTab === 'queue' ? 'md-sub-nav-item--active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            Reported Messages
          </button>
          <button
            className={`md-sub-nav-item ${activeTab === 'banned' ? 'md-sub-nav-item--active' : ''}`}
            onClick={() => setActiveTab('banned')}
          >
            Banned User
          </button>
        </div>
      </div>

      <div className="md-tab-content-area">
        {/* ================= REPORTED QUEUE VIEW WORKSPACE ================= */}
        {activeTab === 'queue' ? (
          <div className="md-fade-in-view">
            <div className="md-toolbar">
              <input
                className="md-search-input"
                type="text"
                placeholder="Search by sender keyword or flagged text contents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="md-loading-state"><div className="md-spinner"></div><span>Loading reports...</span></div>
            ) : filteredMessages.length === 0 ? (
              <div className="md-empty-state-card">
                <FontAwesomeIcon icon={faShieldHalved} className="md-empty-icon" />
                <h3>No Pending Reports</h3>
                <p>There are no reported messages waiting for review.</p>
              </div>
            ) : (
              <div className="md-table-responsive-container">
                <table className="md-data-table">
                  <thead>
                    <tr>
                      <th>Date Flagged</th>
                      <th>Sender Profile</th>
                      <th>Origin Source Hub</th>
                      <th>Audit Source Method</th>
                      <th>Flagged Content Body</th>
                      <th className="md-text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMessages.map((msg) => (
                      <tr key={msg.id}>
                        <td className="md-text-muted-mono" data-label="Date Sent">
                          {new Date(msg.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td data-label="Sender">
                          <div className="md-user-cell-title">
                            <strong>{msg.sender_name}</strong>
                            {msg.is_anonymous && <span className="md-badge-anonymous">Anonymous</span>}
                          </div>
                          <p className="md-user-cell-subtitle">{msg.sender_email}</p>
                        </td>
                        <td data-label="Where" className="md-font-medium">
                          {msg.community_id ? `Community: ${msg.community_name}` : `Direct Message: ${msg.receiver_name || 'Unknown User'}`}
                        </td>
                        <td data-label="Source">
                          {msg.report_source === 'user' ? (
                            <div className="md-source-container">
                              <span className="md-badge-flag md-badge-flag--user">
                                <FontAwesomeIcon icon={faFlag} /> User Report
                              </span>
                              {msg.reporter_name && <p className="md-reporter-attribution">by {msg.reporter_name}</p>}
                              {msg.report_reason && <p className="md-reporter-quote">"{msg.report_reason}"</p>}
                            </div>
                          ) : (
                            <span className="md-badge-flag md-badge-flag--ml">
                              <FontAwesomeIcon icon={faRobot} /> ML Automated Block
                            </span>
                          )}
                        </td>
                        <td data-label="Message Content">
                          <div className="md-flagged-content-block">
                            "{msg.content}"
                          </div>
                        </td>
                        <td data-label="Actions" className="md-actions-cell">
                          <button
                            className="md-icon-btn md-icon-btn--ban"
                            title="Ban User"
                            onClick={() => handleBanUser(msg.sender_id, msg.id, msg.sender_name)}
                          >
                            <FontAwesomeIcon icon={faBan} />
                          </button>
                          <button
                            className="md-icon-btn md-icon-btn--approve"
                            title="Approve"
                            onClick={() => handleApprove(msg.id)}
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                          <button
                            className="md-icon-btn md-icon-btn--reject"
                            title="Delete"
                            onClick={() => handleReject(msg.id)}
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Responsive Grid Stack Fallback for Queue */}
                <div className="um-mobile-cards-viewport">
                  {paginatedMessages.map((msg) => (
                    <div key={msg.id} className="um-responsive-data-card">
                      {/* Top line: sender name + flag badge */}
                      <div className="um-card-topline">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="um-card-code">{msg.sender_name}</span>
                          {msg.is_anonymous && <span className="md-badge-anonymous">Anon</span>}
                        </div>
                        {msg.report_source === 'user' ? (
                          <span className="md-badge-flag md-badge-flag--user"><FontAwesomeIcon icon={faFlag} /> User</span>
                        ) : (
                          <span className="md-badge-flag md-badge-flag--ml"><FontAwesomeIcon icon={faRobot} /> ML Guard</span>
                        )}
                      </div>

                      {/* Email */}
                      <p className="um-card-email-sub">{msg.sender_email}</p>

                      {/* Flagged message */}
                      <div className="md-flagged-content-block">"{msg.content}"</div>

                      {/* Metadata */}
                      <div className="um-card-metadata-row">
                        <span><strong>Hub:</strong> {msg.community_id ? msg.community_name : 'Direct Inbox'}</span>
                        {msg.report_reason && <span><strong>Reason:</strong> "{msg.report_reason}"</span>}
                        <span><strong>Date:</strong> {new Date(msg.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>

                      {/* Actions */}
                      <div className="cm-card-action-bar">
                        <button className="cm-card-btn cm-card-btn--delete" onClick={() => handleBanUser(msg.sender_id, msg.id, msg.sender_name)}>
                          <FontAwesomeIcon icon={faBan} /> Ban
                        </button>
                        <button className="cm-card-btn cm-card-btn--approve" onClick={() => handleApprove(msg.id)}>
                          <FontAwesomeIcon icon={faCheck} /> Approve
                        </button>
                        <button className="cm-card-btn" onClick={() => handleReject(msg.id)}>
                          <FontAwesomeIcon icon={faTimes} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination 
                  currentPage={messagePage} 
                  totalItems={filteredMessages.length} 
                  itemsPerPage={itemsPerPage} 
                  onPageChange={setMessagePage} 
                />
              </div>
            )}
          </div>
        ) : (
          /* ================= BANNED SYSTEM USERS TAB ================= */
          <div className="md-fade-in-view">
            <div className="md-toolbar">
              <input
                className="md-search-input"
                type="text"
                placeholder="Search banned users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {bannedLoading ? (
              <div className="md-loading-state"><div className="md-spinner"></div><span>Loading banned users...</span></div>
            ) : filteredBannedUsers.length === 0 ? (
              <div className="md-empty-state-card">
                <FontAwesomeIcon icon={faUsersSlash} className="md-empty-icon" />
                <h3>No Banned Users</h3>
                <p>There are no users currently banned from chat.</p>
              </div>
            ) : (
              <div className="md-table-responsive-container">
                <table className="md-data-table">
                  <thead>
                    <tr>
                      <th>Isolated User Name</th>
                      <th>Account Email Identifier</th>
                      <th>Platform Access Role</th>
                      <th>Assigned Department</th>
                      <th className="md-text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBannedUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="md-font-bold" data-label="User Name">{user.name}</td>
                        <td data-label="Email">{user.email}</td>
                        <td data-label="Role"><span className="md-badge-tag">{user.role}</span></td>
                        <td data-label="Department" className="md-font-medium">{user.department || 'N/A'}</td>
                        <td data-label="Actions" className="md-actions-cell">
                          <button
                            className="md-icon-btn md-icon-btn--approve"
                            title="Unban User"
                            onClick={() => handleUnbanUser(user.id, user.name)}
                          >
                            <FontAwesomeIcon icon={faUnlock} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Responsive Grid Fallback for Banned Directory */}
                <div className="um-mobile-cards-viewport">
                  {paginatedBannedUsers.map((user) => (
                    <div key={user.id} className="um-responsive-data-card">
                      <div className="um-card-topline">
                        <span className="um-card-code">{user.name}</span>
                        <span className={`um-role-tag um-role-tag--${user.role?.toLowerCase()}`}>{user.role}</span>
                      </div>
                      <p className="um-card-email-sub">{user.email}</p>
                      <div className="um-card-metadata-row">
                        <span><strong>Department:</strong> {user.department || 'N/A'}</span>
                      </div>
                      <div className="cm-card-action-bar">
                        <button className="cm-card-btn cm-card-btn--approve" onClick={() => handleUnbanUser(user.id, user.name)}>
                          <FontAwesomeIcon icon={faUnlock} /> Unban User
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination 
                  currentPage={bannedPage} 
                  totalItems={filteredBannedUsers.length} 
                  itemsPerPage={itemsPerPage} 
                  onPageChange={setBannedPage} 
                />
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
        onConfirm={confirmState.onConfirm}
        variant="danger"
      />
    </div>
  );
};

export default Moderation;