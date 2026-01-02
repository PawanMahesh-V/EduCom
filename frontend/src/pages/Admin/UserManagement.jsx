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
import { useNotifications } from '../../hooks/useSocket';

const UserManagement = () => {
  const raw = sessionStorage.getItem('user');
  const currentUser = raw ? JSON.parse(raw) : null;

  // Real-time notifications
  const { sendNotification } = useNotifications();

  // User Management states
  const [userTab, setUserTab] = useState('users'); // 'users' or 'requests'
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userDepartmentFilter, setUserDepartmentFilter] = useState('All');
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
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

  useEffect(() => {
    fetchUsers();
    if (userTab === 'requests') {
      fetchRegistrationRequests();
    }
  }, []);

  useEffect(() => {
    if (userTab === 'requests') {
      fetchRegistrationRequests();
    }
  }, [userTab]);

  // User filtering
  useEffect(() => {
    let filtered = users;

    // Apply role filter
    if (userRoleFilter !== 'All') {
      filtered = filtered.filter(user => user.role === userRoleFilter);
    }

    // Apply department filter
    if (userDepartmentFilter !== 'All') {
      filtered = filtered.filter(user => user.department === userDepartmentFilter);
    }

    // Apply search filter
    if (userSearchTerm) {
      const searchTermLower = userSearchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.reg_id.toLowerCase().includes(searchTermLower) ||
        user.name.toLowerCase().includes(searchTermLower) ||
        user.email.toLowerCase().includes(searchTermLower) ||
        user.role.toLowerCase().includes(searchTermLower) ||
        user.department.toLowerCase().includes(searchTermLower)
      );
    }

    setFilteredUsers(filtered);
  }, [userSearchTerm, userRoleFilter, userDepartmentFilter, users]);

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
    // Optimistic update - remove from pending list immediately
    setRegistrationRequests(prev => prev.filter(r => r.id !== requestId));

    try {
      await authApi.approveRegistration(requestId);
      showSuccess('Registration request approved successfully!');
      fetchUsers(); // Refresh users list
    } catch (err) {
      // Revert on error
      fetchRegistrationRequests();
      showError(err.message || 'Failed to approve registration');
    }
  };

  const handleRejectRequest = async (requestId) => {
    // Optimistic update - remove from pending list immediately
    setRegistrationRequests(prev => prev.filter(r => r.id !== requestId));

    try {
      await authApi.rejectRegistration(requestId);
      showSuccess('Registration request rejected');
    } catch (err) {
      // Revert on error
      fetchRegistrationRequests();
      showError(err.message || 'Failed to reject registration');
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

    // Validate email domain
    if (!userFormData.email.toLowerCase().endsWith('@szabist.pk')) {
      showError('Email must end with @szabist.pk');
      return;
    }

    try {
      if (selectedUser) {
        await userApi.update(selectedUser.id, userFormData);
        showSuccess('User updated successfully!');
      } else {
        const newUser = await userApi.create(userFormData);
        showSuccess('User created successfully!');

        // Send welcome notification to new user
        if (newUser.id) {
          sendNotification(
            newUser.id,
            'Welcome to EduCom',
            `Your account has been created. Your role is ${userFormData.role}.`,
            'info',
            currentUser?.id
          );
        }
      }
      fetchUsers();
      handleCloseUserModal();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleUserDelete = async (userIdToDelete) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      // Optimistic update - remove from UI immediately
      setUsers(prev => prev.filter(u => u.id !== userIdToDelete));
      setFilteredUsers(prev => prev.filter(u => u.id !== userIdToDelete));

      try {
        await userApi.delete(userIdToDelete);
        showSuccess('User deleted successfully');
      } catch (err) {
        // Revert on error
        fetchUsers();
        showError(err.message || 'Failed to delete user');
      }
    }
  };

  const handleUserEdit = (user) => {
    setSelectedUser(user);
    setUserFormData({
      reg_id: user.reg_id,
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department,
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

  return (
    <div className="course-management-wrapper">
      <div className="tabs-container">
        <button
          className={`tab-button ${userTab === 'users' ? 'active' : ''}`}
          onClick={() => setUserTab('users')}
        >
          Add New User
        </button>
        <button
          className={`tab-button ${userTab === 'requests' ? 'active' : ''}`}
          onClick={() => setUserTab('requests')}
        >
          Approve Requests
        </button>
      </div>

      <div className="tab-content">
        {userTab === 'users' ? (
          <div className="container">
            <div className="header-actions">
              <div className="search-container">
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search users by name, email, role..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              <button
                className="button primary icon-button"
                onClick={() => setIsUserModalOpen(true)}
                data-tooltip="Add New User"
              >
                <FontAwesomeIcon icon={faUserPlus} />
              </button>
            </div>

            <div className="filters-container">
              <div className="filter-group">
                <label className="filter-label">Role</label>
                <select
                  className="input filter-select-min"
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                >
                  <option value="All">All Roles</option>
                  <option value="Student">Student</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Admin">Admin</option>
                  <option value="HOD">HOD</option>
                  <option value="PM">PM</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Department</label>
                <select
                  className="input filter-select-min"
                  value={userDepartmentFilter}
                  onChange={(e) => setUserDepartmentFilter(e.target.value)}
                >
                  <option value="All">All Departments</option>
                  <option value="CS">CS</option>
                  <option value="BBA">BBA</option>
                  {/* <option value="IT">IT</option> */}
                </select>
              </div>

              {(userRoleFilter !== 'All' || userDepartmentFilter !== 'All' || userSearchTerm) && (
                <div className="filter-actions">
                  <button
                    className="btn secondary filter-button-nowrap"
                    onClick={() => {
                      setUserRoleFilter('All');
                      setUserDepartmentFilter('All');
                      setUserSearchTerm('');
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>

            {usersLoading ? (
              <div className="loading-error">Loading...</div>
            ) : (
              <div className="table-container">
                {/* Desktop Table View */}
                <table className="table">
                  <thead>
                    <tr>
                      <th>Registration ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center p-4">
                          {userSearchTerm ? 'No users found matching your search' : 'No users available'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td data-label="Registration ID">{user.reg_id}</td>
                          <td data-label="Full Name">{user.name}</td>
                          <td data-label="Email">{user.email}</td>
                          <td data-label="Role">{user.role}</td>
                          <td data-label="Department">{user.department}</td>
                          <td data-label="Actions">
                            <button
                              className="button edit icon-button small"
                              onClick={() => handleUserEdit(user)}
                              data-tooltip="Edit User"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>
                            <button
                              className="button delete icon-button small"
                              onClick={() => handleUserDelete(user.id)}
                              data-tooltip="Delete User"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="mobile-cards-view">
                  {filteredUsers.length === 0 ? (
                    <div className="empty-state">
                      <p>{userSearchTerm ? 'No users found matching your search' : 'No users available'}</p>
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div key={user.id} className="user-card">
                        <div className="user-card-header">
                          <div className="user-card-info">
                            <div className="user-card-label">Registration ID</div>
                            <div className="user-card-value large">{user.reg_id}</div>
                          </div>
                        </div>
                        <div className="user-card-body">
                          <div className="user-card-row">
                            <div className="user-card-label">Full Name</div>
                            <div className="user-card-value">{user.name}</div>
                          </div>
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
                            <div className="user-card-value">{user.department}</div>
                          </div>
                        </div>
                        <div className="user-card-actions">
                          <button
                            className="button edit"
                            onClick={() => handleUserEdit(user)}
                          >
                            <FontAwesomeIcon icon={faPenToSquare} />
                            Edit
                          </button>
                          <button
                            className="button delete"
                            onClick={() => handleUserDelete(user.id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {isUserModalOpen && (
              <div className="modal">
                <div className="modal-content modal-content-large">
                  <h2>{selectedUser ? 'Edit User' : 'Add New User'}</h2>
                  <form onSubmit={handleUserSubmit}>
                    <div className="grid-2col">
                      <div className="form-group">
                        <label>Registration ID:</label>
                        <input
                          type="text"
                          name="reg_id"
                          value={userFormData.reg_id}
                          onChange={handleUserInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Full Name:</label>
                        <input
                          type="text"
                          name="name"
                          value={userFormData.name}
                          onChange={handleUserInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email:</label>
                        <input
                          type="email"
                          name="email"
                          value={userFormData.email}
                          onChange={handleUserInputChange}
                          pattern=".*@szabist\.pk$"
                          title="Email must end with @szabist.pk"
                          placeholder="example@szabist.pk"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Password:</label>
                        <input
                          type="password"
                          name="password"
                          value={userFormData.password}
                          onChange={handleUserInputChange}
                          required={!selectedUser}
                          placeholder={selectedUser ? "Leave blank to keep current password" : "Enter password"}
                        />
                      </div>
                      <div className="form-group">
                        <label>Role:</label>
                        <select
                          name="role"
                          value={userFormData.role}
                          onChange={handleUserInputChange}
                        >
                          <option value="Student">Student</option>
                          <option value="Teacher">Teacher</option>
                          <option value="Admin">Admin</option>
                          <option value="HOD">HOD</option>
                          <option value="PM">PM (Program Manager)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Department:</label>
                        <select
                          name="department"
                          value={userFormData.department}
                          onChange={handleUserInputChange}
                        >
                          <option value="CS">CS</option>
                          <option value="BBA">BBA</option>
                          <option value="IT">IT</option>
                        </select>
                      </div>
                      {userFormData.role === 'Student' && (
                        <div className="form-group">
                          <label>Semester:</label>
                          <select
                            name="semester"
                            value={userFormData.semester}
                            onChange={handleUserInputChange}
                            required
                          >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                          </select>
                        </div>
                      )}
                      {userFormData.role === 'PM' && (
                        <div className="form-group">
                          <label>Program Year:</label>
                          <select
                            name="program_year"
                            value={userFormData.program_year}
                            onChange={handleUserInputChange}
                            required
                          >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="modal-actions">
                      <button className="button primary" type="submit">
                        {selectedUser ? 'Update User' : 'Create User'}
                      </button>
                      <button className="button secondary" type="button" onClick={handleCloseUserModal}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="container">
            {requestsLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading registration requests...</p>
              </div>
            ) : (
              <div className="table-container">
                {/* Desktop Table View */}
                <table className="table">
                  <thead>
                    <tr>
                      <th>Registration ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Semester/Year</th>
                      <th>Request Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrationRequests.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center p-4">
                          No registration requests available
                        </td>
                      </tr>
                    ) : (
                      registrationRequests.map((request) => (
                        <tr key={request.id}>
                          <td data-label="Registration ID">{request.reg_id}</td>
                          <td data-label="Name">{request.name}</td>
                          <td data-label="Email">{request.email}</td>
                          <td data-label="Role">{request.role}</td>
                          <td data-label="Department">{request.department}</td>
                          <td data-label="Semester/Year">
                            {request.role === 'Student' ? `Semester ${request.semester}` :
                              request.role === 'PM' ? `Year ${request.program_year}` :
                                'N/A'}
                          </td>
                          <td data-label="Request Date">{new Date(request.created_at).toLocaleDateString()}</td>
                          <td data-label="Actions">
                            <button
                              className="btn-approve"
                              onClick={() => handleApproveRequest(request.id)}
                              title="Approve"
                            >
                              <FontAwesomeIcon icon={faUserCheck} />
                            </button>
                            <button
                              className="btn-reject ml-2"
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

                {/* Mobile Card View */}
                <div className="mobile-cards-view">
                  {registrationRequests.length === 0 ? (
                    <div className="empty-state">
                      <p>No registration requests available</p>
                    </div>
                  ) : (
                    registrationRequests.map((request) => (
                      <div key={request.id} className="user-card">
                        <div className="user-card-header">
                          <div className="user-card-info">
                            <div className="user-card-label">Registration ID</div>
                            <div className="user-card-value large">{request.reg_id}</div>
                          </div>
                        </div>
                        <div className="user-card-body">
                          <div className="user-card-row">
                            <div className="user-card-label">Name</div>
                            <div className="user-card-value">{request.name}</div>
                          </div>
                          <div className="user-card-row">
                            <div className="user-card-label">Email</div>
                            <div className="user-card-value">{request.email}</div>
                          </div>
                          <div className="user-card-row">
                            <div className="user-card-label">Role</div>
                            <div className="user-card-value">{request.role}</div>
                          </div>
                          <div className="user-card-row">
                            <div className="user-card-label">Department</div>
                            <div className="user-card-value">{request.department}</div>
                          </div>
                          <div className="user-card-row">
                            <div className="user-card-label">Semester/Year</div>
                            <div className="user-card-value">
                              {request.role === 'Student' ? `Semester ${request.semester}` :
                                request.role === 'PM' ? `Year ${request.program_year}` :
                                  'N/A'}
                            </div>
                          </div>
                          <div className="user-card-row">
                            <div className="user-card-label">Request Date</div>
                            <div className="user-card-value">{new Date(request.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="user-card-actions">
                          <button
                            className="button approve"
                            onClick={() => handleApproveRequest(request.id)}
                          >
                            <FontAwesomeIcon icon={faUserCheck} />
                            Approve
                          </button>
                          <button
                            className="button reject"
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            <FontAwesomeIcon icon={faUserMinus} />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
