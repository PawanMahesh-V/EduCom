import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserPlus,
  faPenToSquare,
  faTrash,
  faUserCheck,
  faUserMinus
} from '@fortawesome/free-solid-svg-icons';
import { showSuccess, showError } from '../../utils/alert';
import { authApi, userApi } from '../../api';
import ConfirmDialog from '../../components/ConfirmDialog';
import CustomSelect from '../../components/Common/CustomSelect';
import Pagination from '../../components/Common/Pagination';
import { useSocket } from '../../context/SocketContext';

const UserManagement = () => {
  const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
  const currentUser = raw ? JSON.parse(raw) : null;

  // Socket connection
  const { socketService, isConnected } = useSocket();

  /* ==========================================================================
     1. STATE HOOK DECLARATIONS FIRST (Fixes initialization ReferenceError)
     ========================================================================== */
  const [userTab, setUserTab] = useState('users'); // 'users' or 'requests'
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userDepartmentFilter, setUserDepartmentFilter] = useState('All');
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    onConfirm: null,
  });
  const [userFormData, setUserFormData] = useState({
    reg_id: '',
    name: '',
    email: '',
    password: '',
    role: 'Student',
    department: 'CS',
    semester: '1',
    program_year: '1'
  });

  // Registration Requests states
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [filteredRequests, setFilteredRequests] = useState([]);

  const [userPage, setUserPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const itemsPerPage = 5;

  /* ==========================================================================
     2. SIDE EFFECTS LAYER (Placed safely below state initializations)
     ========================================================================== */
  
  // Listen for real-time user updates via Socket Context
  useEffect(() => {
    if (isConnected && socketService && socketService.socket) {
        const handleUserUpdate = () => {
          fetchUsers();
          if (userTab === 'requests') fetchRegistrationRequests();
        };
        socketService.socket.on('admin-user-update', handleUserUpdate);
        return () => {
          if (socketService?.socket) {
            socketService.socket.off('admin-user-update', handleUserUpdate);
          }
        };
    }
  }, [isConnected, socketService, userTab]);

  // Initial component data load mount
  useEffect(() => {
    fetchUsers();
    if (userTab === 'requests') {
      fetchRegistrationRequests();
    }
  }, []);

  // Sync tab transitions with database cache
  useEffect(() => {
    if (userTab === 'requests') {
      fetchRegistrationRequests();
    }
  }, [userTab]);

  // User list row filters
  useEffect(() => {
    let filtered = users;

    if (userRoleFilter !== 'All') {
      filtered = filtered.filter(user => user.role === userRoleFilter);
    }

    if (userDepartmentFilter !== 'All') {
      filtered = filtered.filter(user => user.department === userDepartmentFilter);
    }

    if (userSearchTerm) {
      const searchTermLower = userSearchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        (user.reg_id || '').toLowerCase().includes(searchTermLower) ||
        (user.name || '').toLowerCase().includes(searchTermLower) ||
        (user.email || '').toLowerCase().includes(searchTermLower) ||
        (user.role || '').toLowerCase().includes(searchTermLower) ||
        (user.department || '').toLowerCase().includes(searchTermLower)
      );
    }

    setFilteredUsers(filtered);
    setUserPage(1);
  }, [userSearchTerm, userRoleFilter, userDepartmentFilter, users]);

  // Request list row filters
  useEffect(() => {
    let filtered = registrationRequests;

    if (requestSearchTerm) {
      const lower = requestSearchTerm.toLowerCase();
      filtered = filtered.filter(req => 
        (req.name || '').toLowerCase().includes(lower) ||
        (req.email || '').toLowerCase().includes(lower) ||
        (req.reg_id || '').toLowerCase().includes(lower) ||
        (req.role || '').toLowerCase().includes(lower) ||
        (req.department || '').toLowerCase().includes(lower)
      );
    }

    setFilteredRequests(filtered);
    setRequestPage(1);
  }, [requestSearchTerm, registrationRequests]);

  /* ==========================================================================
     3. SYSTEM ACTION HANDLERS
     ========================================================================== */
  const fetchUsers = async () => {
    try {
      const data = await userApi.getAll();
      const fetchedUsers = data.users || data || [];
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
      setUsersLoading(false);
    } catch (err) {
      showError(err.message);
      setUsersLoading(false);
    }
  };

  const fetchRegistrationRequests = async () => {
    try {
      setRequestsLoading(true);
      const response = await authApi.getRegistrationRequests();
      setRegistrationRequests(response.requests || []);
      setRequestsLoading(false);
    } catch (err) {
      console.error('Error fetching registration requests:', err);
      showError('Failed to fetch registration requests');
      setRequestsLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    setRegistrationRequests(prev => prev.filter(r => r.id !== requestId));
    try {
      await authApi.approveRegistration(requestId);
      showSuccess('Registration request approved successfully!');
      fetchUsers();
    } catch (err) {
      fetchRegistrationRequests();
      showError(err.message || 'Failed to approve registration');
    }
  };

  const handleRejectRequest = async (requestId) => {
    setRegistrationRequests(prev => prev.filter(r => r.id !== requestId));
    try {
      await authApi.rejectRegistration(requestId);
      showSuccess('Registration request rejected');
    } catch (err) {
      fetchRegistrationRequests();
      showError(err.message || 'Failed to reject registration request');
    }
  };

  const handleUserInputChange = (e) => {
    setUserFormData({
      ...userFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();

    const lower = userFormData.email.toLowerCase();
    if (!(lower.endsWith('@szabist.pk') || lower.endsWith('@szabist.edu.pk'))) {
      showError('Email must end with @szabist.pk or @szabist.edu.pk');
      return;
    }

    try {
      if (selectedUser) {
        await userApi.update(selectedUser.id, userFormData);
        showSuccess('User updated successfully!');
      } else {
        const newUser = await userApi.create(userFormData);
        showSuccess('User created successfully!');

        if (newUser.id && socketService) {
          socketService.sendNotification({
            userId: newUser.id,
            title: 'Welcome to EduCom',
            message: `Your account has been created. Your role is ${userFormData.role}.`,
            type: 'info',
            senderId: currentUser?.id
          });
        }
      }
      fetchUsers();
      handleCloseUserModal();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleUserDelete = (userIdToDelete) => {
    setConfirmState({
      open: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user profile permanently?',
      confirmText: 'Delete User Account',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        setUsers(prev => prev.filter(u => u.id !== userIdToDelete));
        setFilteredUsers(prev => prev.filter(u => u.id !== userIdToDelete));

        try {
          await userApi.delete(userIdToDelete);
          showSuccess('User deleted successfully');
        } catch (err) {
          fetchUsers();
          showError(err.message || 'Failed to delete user');
        }
      }
    });
  };

  const handleUserEdit = (user) => {
    setSelectedUser(user);
    setUserFormData({
      reg_id: user.reg_id || '',
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'Student',
      department: user.department || 'CS',
      semester: (user.semester && String(user.semester)) || '1',
      program_year: (user.program_year && String(user.program_year)) || '1'
    });
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setSelectedUser(null);
    setUserFormData({
      reg_id: '',
      name: '',
      email: '',
      password: '',
      role: 'Student',
      department: 'CS',
      semester: '1',
      program_year: '1'
    });
    setIsUserModalOpen(false);
  };

  const paginatedUsers = filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage);
  const paginatedRequests = filteredRequests.slice((requestPage - 1) * itemsPerPage, requestPage * itemsPerPage);

  return (
    <div className="um-management-wrapper">
      <div className="um-sub-nav">
        <div className="um-sub-nav-tabs">
          <button
            className={`um-sub-nav-item ${userTab === 'users' ? 'um-sub-nav-item--active' : ''}`}
            onClick={() => setUserTab('users')}
          >
            Manage Users
          </button>
          <button
            className={`um-sub-nav-item ${userTab === 'requests' ? 'um-sub-nav-item--active' : ''}`}
            onClick={() => setUserTab('requests')}
          >
            Registration Requests
          </button>
        </div>
      </div>

      <div className="um-tab-content-area">
        {userTab === 'users' ? (
          <div className="um-fade-in-view">
            <div className="um-toolbar">
              <input
                className="um-search-input"
                type="text"
                placeholder="Search by ID, name, email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
              
              <div className="um-filter-select-group">
                <CustomSelect
                  options={[
                    { value: 'All', label: 'All Roles' },
                    { value: 'Student', label: 'Student' },
                    { value: 'Teacher', label: 'Teacher' },
                    { value: 'Admin', label: 'Admin' },
                    { value: 'HOD', label: 'HOD' },
                    { value: 'PM', label: 'PM' }
                  ]}
                  value={userRoleFilter}
                  onChange={(val) => setUserRoleFilter(val)}
                />

                <CustomSelect
                  options={[
                    { value: 'All', label: 'All Departments' },
                    { value: 'CS', label: 'CS' },
                    { value: 'BBA', label: 'BBA' },
                    { value: 'IT', label: 'IT' }
                  ]}
                  value={userDepartmentFilter}
                  onChange={(val) => setUserDepartmentFilter(val)}
                />
              </div>

              <button
                className="um-btn-primary"
                onClick={() => setIsUserModalOpen(true)}
              >
                <FontAwesomeIcon icon={faUserPlus} />
                <span>Add User</span>
              </button>
            </div>

            {usersLoading ? (
              <div className="um-loading-state"><div className="um-spinner"></div><span>Loading users...</span></div>
            ) : (
              <div className="um-table-responsive-container">
                <table className="um-data-table">
                  <thead>
                    <tr>
                      <th>Registration ID</th>
                      <th>Full Name</th>
                      <th>Institutional Email</th>
                      <th>Account Role</th>
                      <th>Department</th>
                      <th className="um-text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="um-empty-table-cell">
                          {userSearchTerm ? 'No users match your search' : 'No users found'}
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="um-font-bold um-text-emerald" data-label="Registration ID">{user.reg_id || 'Staff Link'}</td>
                          <td className="um-font-semibold" data-label="Full Name">{user.name}</td>
                          <td data-label="Email">{user.email}</td>
                          <td data-label="Role"><span className={`um-role-tag um-role-tag--${user.role?.toLowerCase()}`}>{user.role}</span></td>
                          <td data-label="Department">{user.department}</td>
                          <td data-label="Actions" className="um-actions-cell">
                            <button
                              className="um-icon-btn um-icon-btn--edit"
                              onClick={() => handleUserEdit(user)}
                              title="Edit Profile"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>
                            <button
                              className="um-icon-btn um-icon-btn--delete"
                              onClick={() => handleUserDelete(user.id)}
                              title="Delete User"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div className="um-mobile-cards-viewport">
                  {paginatedUsers.length === 0 ? (
                    <div className="um-empty-card-fallback">No users found.</div>
                  ) : (
                    paginatedUsers.map((user) => (
                      <div key={user.id} className="um-responsive-data-card">
                        <div className="um-card-topline">
                          <span className="um-card-code">{user.reg_id || 'Staff Link'}</span>
                          <span className={`um-role-tag um-role-tag--${user.role?.toLowerCase()}`}>{user.role}</span>
                        </div>
                        <h4 className="um-card-heading">{user.name}</h4>
                        <p className="um-card-email-sub">{user.email}</p>
                        <div className="um-card-metadata-row">
                          <span><strong>Department:</strong> {user.department}</span>
                        </div>
                        <div className="cm-card-action-bar">
                          <button className="cm-card-btn cm-card-btn--edit" onClick={() => handleUserEdit(user)}>
                            <FontAwesomeIcon icon={faPenToSquare} /> Edit
                          </button>
                          <button className="cm-card-btn cm-card-btn--delete" onClick={() => handleUserDelete(user.id)}>
                            <FontAwesomeIcon icon={faTrash} /> Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Pagination 
                  currentPage={userPage} 
                  totalItems={filteredUsers.length} 
                  itemsPerPage={itemsPerPage} 
                  onPageChange={setUserPage} 
                />
              </div>
            )}

            {isUserModalOpen && (
              <div className="um-modal-overlay">
                <div className="um-modal-box um-modal-box--medium fade-in">
                  <h2>{selectedUser ? 'Edit User' : 'Add New User'}</h2>
                  <form onSubmit={handleUserSubmit} className="um-modal-form">
                    <div className="um-modal-grid-2col">
                      {!['Teacher', 'HOD', 'PM'].includes(userFormData.role) && (
                        <div className="um-form-group">
                          <label>Registration ID</label>
                          <input
                            type="text"
                            name="reg_id"
                            placeholder="e.g., 2212263"
                            value={userFormData.reg_id}
                            onChange={handleUserInputChange}
                            required
                          />
                        </div>
                      )}
                      <div className="um-form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          name="name"
                          placeholder="Enter complete name"
                          value={userFormData.name}
                          onChange={handleUserInputChange}
                          required
                        />
                      </div>
                      <div className="um-form-group">
                        <label>Institutional Email</label>
                        <input
                          type="email"
                          name="email"
                          value={userFormData.email}
                          onChange={handleUserInputChange}
                          placeholder="name@szabist.pk"
                          required
                        />
                      </div>
                      <div className="um-form-group">
                        <label>Security Password</label>
                        <input
                          type="password"
                          name="password"
                          value={userFormData.password}
                          onChange={handleUserInputChange}
                          required={!selectedUser}
                          placeholder={selectedUser ? "Leave empty to preserve baseline" : "Create password"}
                        />
                      </div>
                      <div className="um-form-group">
                        <label>Platform Access Role</label>
                        <CustomSelect
                          options={[
                            { value: 'Student', label: 'Student' },
                            { value: 'Teacher', label: 'Teacher' },
                            { value: 'Admin', label: 'Admin' },
                            { value: 'HOD', label: 'HOD' },
                            { value: 'PM', label: 'Program Manager' }
                          ]}
                          value={userFormData.role}
                          onChange={(val) => setUserFormData({ ...userFormData, role: val })}
                        />
                      </div>
                      <div className="um-form-group">
                        <label>Department Target</label>
                        <CustomSelect
                          options={[
                            { value: 'CS', label: 'CS' },
                            { value: 'BBA', label: 'BBA' },
                            { value: 'IT', label: 'IT' }
                          ]}
                          value={userFormData.department}
                          onChange={(val) => setUserFormData({ ...userFormData, department: val })}
                        />
                      </div>
                      {userFormData.role === 'Student' && (
                        <div className="um-form-group">
                          <label>Current Semester</label>
                          <CustomSelect
                            options={[
                              { value: '1', label: '1' }, { value: '2', label: '2' },
                              { value: '3', label: '3' }, { value: '4', label: '4' },
                              { value: '5', label: '5' }, { value: '6', label: '6' },
                              { value: '7', label: '7' }, { value: '8', label: '8' }
                            ]}
                            value={userFormData.semester}
                            onChange={(val) => setUserFormData({ ...userFormData, semester: val })}
                          />
                        </div>
                      )}
                      {userFormData.role === 'PM' && (
                        <div className="um-form-group">
                          <label>Program Year Focus</label>
                          <CustomSelect
                            options={[
                              { value: '1', label: 'Year 1' },
                              { value: '2', label: 'Year 2' },
                              { value: '3', label: 'Year 3' },
                              { value: '4', label: 'Year 4' }
                            ]}
                            value={userFormData.program_year}
                            onChange={(val) => setUserFormData({ ...userFormData, program_year: val })}
                          />
                        </div>
                      )}
                    </div>
                    <div className="um-modal-action-footer">
                      <button className="um-btn-secondary" type="button" onClick={handleCloseUserModal}>Cancel</button>
                      <button className="um-btn-primary" type="submit">
                        {selectedUser ? 'Save Updates' : 'Save User'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            <ConfirmDialog
              open={confirmState.open}
              title={confirmState.title}
              message={confirmState.message}
              confirmText={confirmState.confirmText}
              onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
              onConfirm={confirmState.onConfirm}
              variant="danger"
            />
          </div>
        ) : (
          <div className="um-fade-in-view">
            <div className="um-toolbar">
              <input
                className="um-search-input"
                type="text"
                placeholder="Search pending requests catalog..."
                value={requestSearchTerm}
                onChange={(e) => setRequestSearchTerm(e.target.value)}
              />
            </div>

            {requestsLoading ? (
              <div className="um-loading-state"><div className="um-spinner"></div><span>Loading requests...</span></div>
            ) : (
              <div className="um-table-responsive-container">
                <table className="um-data-table">
                  <thead>
                    <tr>
                      <th>Registration ID</th>
                      <th>Name</th>
                      <th>Email Profile</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Semester/Year</th>
                      <th>Request Date</th>
                      {/* <th className="um-text-center">Review Decisions</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRequests.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="um-empty-table-cell">
                          No pending registration requests found
                        </td>
                      </tr>
                    ) : (
                      paginatedRequests.map((request) => (
                        <tr key={request.id}>
                          <td className="um-font-bold um-text-emerald" data-label="Registration ID">{request.reg_id || 'Staff Link'}</td>
                          <td className="um-font-semibold" data-label="Name">{request.name}</td>
                          <td data-label="Email">{request.email}</td>
                          <td data-label="Role"><span className={`um-role-tag um-role-tag--${request.role?.toLowerCase()}`}>{request.role}</span></td>
                          <td data-label="Department">{request.department}</td>
                          <td data-label="Semester/Year" className="um-font-medium">
                            {request.role === 'Student' ? `Semester ${request.semester}` :
                             request.role === 'PM' ? `Year ${request.program_year}` : 'N/A'}
                          </td>
                          <td data-label="Request Date" className="um-text-muted-dark">{new Date(request.created_at).toLocaleDateString()}</td>
                          <td data-label="Actions" className="um-actions-cell">
                            <button
                              className="um-icon-btn um-icon-btn--approve"
                              onClick={() => handleApproveRequest(request.id)}
                              title="Approve"
                            >
                              <FontAwesomeIcon icon={faUserCheck} />
                            </button>
                            <button
                              className="um-icon-btn um-icon-btn--delete"
                              onClick={() => handleRejectRequest(request.id)}
                              title="Reject"
                            >
                              <FontAwesomeIcon icon={faUserMinus} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div className="um-mobile-cards-viewport">
                  {paginatedRequests.length === 0 ? (
                    <div className="um-empty-card-fallback">No pending requests.</div>
                  ) : (
                    paginatedRequests.map((request) => (
                      <div key={request.id} className="um-responsive-data-card">
                        <div className="um-card-topline">
                          <span className="um-card-code">{request.reg_id || 'Staff Dispatch'}</span>
                          <span className={`um-role-tag um-role-tag--${request.role?.toLowerCase()}`}>{request.role}</span>
                        </div>
                        <h4 className="um-card-heading">{request.name}</h4>
                        <p className="um-card-email-sub">{request.email}</p>
                        <div className="um-card-metadata-row text-xs">
                          <p><strong>Dept:</strong> {request.department} • <strong>Placement:</strong> {request.role === 'Student' ? `Sem ${request.semester}` : request.role === 'PM' ? `Yr ${request.program_year}` : 'N/A'}</p>
                          <p className="um-text-muted-dark font-mono">Dispatched: {new Date(request.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="cm-card-action-bar">
                          <button className="cm-card-btn cm-card-btn--approve" onClick={() => handleApproveRequest(request.id)}>
                            <FontAwesomeIcon icon={faUserCheck} /> Approve
                          </button>
                          <button className="cm-card-btn cm-card-btn--delete" onClick={() => handleRejectRequest(request.id)}>
                            <FontAwesomeIcon icon={faUserMinus} /> Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Pagination 
                  currentPage={requestPage} 
                  totalItems={filteredRequests.length} 
                  itemsPerPage={itemsPerPage} 
                  onPageChange={setRequestPage} 
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;