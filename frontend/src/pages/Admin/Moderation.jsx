import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faBan, faTimes, faShieldHalved, faUnlock, faUsersSlash, faFlag, faRobot } from '@fortawesome/free-solid-svg-icons';
import { moderationApi } from '../../api';
import { useSocket } from '../../context/SocketContext';
import { showSuccess, showError } from '../../utils/alert';
import ConfirmDialog from '../../components/ConfirmDialog';

const Moderation = () => {
    const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'banned'
    const [messages, setMessages] = useState([]);
    const [bannedUsers, setBannedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bannedLoading, setBannedLoading] = useState(false);
    
    const { socketService, isConnected } = useSocket();
    const [confirmState, setConfirmState] = useState({
        open: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        onConfirm: null,
    });

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
            if (activeTab === 'banned') fetchBannedUsers(); // Refresh banned users if someone was banned
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
            showSuccess('Message rejected and permanently deleted from flow');
            setMessages(prev => prev.filter(m => m.id !== id));
        } catch (error) {
            showError(error.message || 'Failed to reject message');
        }
    };

    const handleBanUser = (userId, messageId, userName) => {
        setConfirmState({
            open: true,
            title: 'Chat Ban User',
            message: `Are you sure you want to chat ban ${userName}? This will reject their pending message and suspend their ability to send messages.`,
            confirmText: 'Ban User',
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
            title: 'Unban User',
            message: `Are you sure you want to restore chat privileges for ${userName}?`,
            confirmText: 'Unban User',
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

    return (
        <div className="user-management-wrapper">
            <div className="tabs-container">
                <button
                    className={`tab-button ${activeTab === 'queue' ? 'active' : ''}`}
                    onClick={() => setActiveTab('queue')}
                >
                    Reported Messages
                </button>
                <button
                    className={`tab-button ${activeTab === 'banned' ? 'active' : ''}`}
                    onClick={() => setActiveTab('banned')}
                >
                     Banned Users
                </button>
            </div>

            <div className="tab-content container">
                {activeTab === 'queue' ? (
                    <>
                        <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                                Pending Reports
                            </h2>
                            </div>

                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Loading reported messages...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="empty-state">
                                <h3>No Pending Reports</h3>
                                <p>There are currently no messages waiting for admin review.</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="table desktop-only">
                                    <thead>
                                        <tr>
                                            <th>Date Sent</th>
                                            <th>Sender</th>
                                            <th>Where</th>
                                            <th>Source</th>
                                            <th>Message Content</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {messages.map((msg) => (
                                            <tr key={msg.id}>
                                                <td data-label="Date Sent">{new Date(msg.created_at).toLocaleString()}</td>
                                                <td data-label="Sender">
                                                    <div>
                                                        <strong>{msg.sender_name}</strong>
                                                        {msg.is_anonymous && <span style={{ fontSize: '0.8em', color: '#ef4444', marginLeft: '6px', fontWeight: 'bold' }}>(Anonymous)</span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.85em', color: '#666' }}>{msg.sender_email}</div>
                                                </td>
                                                <td data-label="Where">
                                                    {msg.community_id ? `Community: ${msg.community_name}` : `Direct Message: ${msg.receiver_name || 'Unknown User'}`}
                                                </td>
                                                <td data-label="Source">
                                                    {msg.report_source === 'user' ? (
                                                        <div>
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                                padding: '3px 8px', borderRadius: '12px',
                                                                backgroundColor: '#fef3c7', color: '#92400e',
                                                                fontSize: '0.8em', fontWeight: '600'
                                                            }}>
                                                                <FontAwesomeIcon icon={faFlag} /> User Reported
                                                            </span>
                                                            {msg.reporter_name && (
                                                                <div style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
                                                                    by {msg.reporter_name}
                                                                </div>
                                                            )}
                                                            {msg.report_reason && (
                                                                <div style={{
                                                                    marginTop: '4px', fontSize: '0.8em',
                                                                    color: '#374151', fontStyle: 'italic'
                                                                }}>
                                                                    "{msg.report_reason}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                            padding: '3px 8px', borderRadius: '12px',
                                                            backgroundColor: '#ede9fe', color: '#5b21b6',
                                                            fontSize: '0.8em', fontWeight: '600'
                                                        }}>
                                                            <FontAwesomeIcon icon={faRobot} /> ML Auto-Detected
                                                        </span>
                                                    )}
                                                </td>
                                                <td data-label="Message Content">
                                                    <div style={{ 
                                                        padding: '8px', 
                                                        backgroundColor: '#fee2e2', 
                                                        borderRadius: '4px',
                                                        color: '#b91c1c', 
                                                        fontWeight: '500' }}>
                                                        "{msg.content}"
                                                    </div>
                                                </td>
                                                <td data-label="Actions">
                                                    <button
                                                        className="btn-reject"
                                                        title="Chat Ban User"
                                                        onClick={() => handleBanUser(msg.sender_id, msg.id, msg.sender_name)}
                                                        style={{ marginRight: '8px', backgroundColor: '#dc2626' }}
                                                    >
                                                        <FontAwesomeIcon icon={faBan} />
                                                    </button>
                                                    <button
                                                        className="btn-approve"
                                                        title="Approve Message"
                                                        onClick={() => handleApprove(msg.id)}
                                                        style={{ marginRight: '8px' }}
                                                    >
                                                        <FontAwesomeIcon icon={faCheck} />
                                                    </button>
                                                    <button
                                                        className="btn-reject"
                                                        title="Reject Message Only"
                                                        onClick={() => handleReject(msg.id)}
                                                    >
                                                        <FontAwesomeIcon icon={faTimes} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Mobile Card View */}
                                <div className="mobile-cards-view">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className="user-card">
                                            <div className="user-card-header">
                                                <div className="user-card-info">
                                                    <div className="user-card-label">Sender</div>
                                                    <div className="user-card-value large">
                                                        {msg.sender_name} {msg.is_anonymous && <span style={{ fontSize: '0.8em', color: '#ef4444', fontWeight: 'bold' }}>(Anonymous)</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="user-card-body">
                                                <div className="user-card-row">
                                                    <div className="user-card-label">Date Sent</div>
                                                    <div className="user-card-value">{new Date(msg.created_at).toLocaleString()}</div>
                                                </div>
                                                <div className="user-card-row">
                                                    <div className="user-card-label">Email</div>
                                                    <div className="user-card-value">{msg.sender_email}</div>
                                                </div>
                                                <div className="user-card-row">
                                                    <div className="user-card-label">Where</div>
                                                    <div className="user-card-value">{msg.community_id ? `Community: ${msg.community_name}` : `Direct Message: ${msg.receiver_name || 'Unknown User'}`}</div>
                                                </div>
                                                <div className="user-card-row">
                                                    <div className="user-card-label">Source</div>
                                                    <div className="user-card-value">
                                                        {msg.report_source === 'user' ? (
                                                            <div>
                                                                <span style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                                    padding: '3px 8px', borderRadius: '12px',
                                                                    backgroundColor: '#fef3c7', color: '#92400e',
                                                                    fontSize: '0.8em', fontWeight: '600'
                                                                }}>
                                                                    <FontAwesomeIcon icon={faFlag} /> User Reported
                                                                </span>
                                                                {msg.reporter_name && <div style={{ fontSize: '0.8em', color: '#555', marginTop: '3px' }}>by {msg.reporter_name}</div>}
                                                                {msg.report_reason && <div style={{ fontSize: '0.8em', fontStyle: 'italic', marginTop: '3px' }}>Reason: "{msg.report_reason}"</div>}
                                                            </div>
                                                        ) : (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                                padding: '3px 8px', borderRadius: '12px',
                                                                backgroundColor: '#ede9fe', color: '#5b21b6',
                                                                fontSize: '0.8em', fontWeight: '600'
                                                            }}>
                                                                <FontAwesomeIcon icon={faRobot} /> ML Auto-Detected
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="user-card-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                                    <div className="user-card-label" style={{ marginBottom: '8px' }}>Message Content</div>
                                                    <div style={{ padding: '12px', backgroundColor: '#fee2e2', borderRadius: '4px', color: '#b91c1c', fontWeight: '500', width: '100%', boxSizing: 'border-box' }}>
                                                        "{msg.content}"
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="user-card-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <button className="button delete" onClick={() => handleBanUser(msg.sender_id, msg.id, msg.sender_name)} style={{ flex: '1' }}>
                                                    <FontAwesomeIcon icon={faBan} /> Ban User
                                                </button>
                                                <button className="button success" onClick={() => handleApprove(msg.id)} style={{ flex: '1' }}>
                                                    <FontAwesomeIcon icon={faCheck} /> Approve
                                                </button>
                                                <button className="button delete" onClick={() => handleReject(msg.id)} style={{ flex: '1' }}>
                                                    <FontAwesomeIcon icon={faTimes} /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                                Chat Banned Users
                            </h2>
                           </div>

                        {bannedLoading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Loading banned users...</p>
                            </div>
                        ) : bannedUsers.length === 0 ? (
                            <div className="empty-state">
                                <h3>No Banned Users</h3>
                                <p>There are no users currently blocked from chatting.</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="table desktop-only">
                                    <thead>
                                        <tr>
                                            <th>User Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Department</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bannedUsers.map((user) => (
                                            <tr key={user.id}>
                                                <td data-label="User Name"><strong>{user.name}</strong></td>
                                                <td data-label="Email">{user.email}</td>
                                                <td data-label="Role">{user.role}</td>
                                                <td data-label="Department">{user.department || '-'}</td>
                                                <td data-label="Actions">
                                                    <button
                                                        className="button primary icon-button"
                                                        title="Unban User"
                                                        onClick={() => handleUnbanUser(user.id, user.name)}
                                                    >
                                                        <FontAwesomeIcon icon={faUnlock} /> Unban
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Mobile Card View */}
                                <div className="mobile-cards-view">
                                    {bannedUsers.map((user) => (
                                        <div key={user.id} className="user-card">
                                            <div className="user-card-header">
                                                <div className="user-card-info">
                                                    <div className="user-card-label">User Name</div>
                                                    <div className="user-card-value large">{user.name}</div>
                                                </div>
                                            </div>
                                            <div className="user-card-body">
                                                <div className="user-card-row">
                                                    <div className="user-card-label">Email</div>
                                                    <div className="user-card-value">{user.email}</div>
                                                </div>
                                                <div className="user-card-row">
                                                    <div className="user-card-label">Role</div>
                                                    <div className="user-card-value">{user.role}</div>
                                                </div>
                                                <div className="user-card-row">
                                                    <div className="user-card-label">Department</div>
                                                    <div className="user-card-value">{user.department || '-'}</div>
                                                </div>
                                            </div>
                                            <div className="user-card-actions">
                                                <button
                                                    className="button primary"
                                                    onClick={() => handleUnbanUser(user.id, user.name)}
                                                    style={{ width: '100%' }}
                                                >
                                                    <FontAwesomeIcon icon={faUnlock} /> Unban User
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
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
