import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { showSuccess, showError } from '../../utils/alert';
import ConfirmDialog from '../../components/ConfirmDialog';
import CustomSelect from '../../components/Common/CustomSelect';
import { useSocket } from '../../context/SocketContext';
import { useUsers } from '../../hooks/useUsers';
import UserTable from '../../components/UserTable';
import RegistrationRequests from '../../components/RegistrationRequests';

const UserManagement = () => {
  const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
  const currentUser = raw ? JSON.parse(raw) : null;

  const { socketService, isConnected } = useSocket();
  const [userTab, setUserTab] = useState('users');

  const {
    filteredUsers,
    userSearchTerm, setUserSearchTerm,
    userRoleFilter, setUserRoleFilter,
    userDepartmentFilter, setUserDepartmentFilter,
    usersLoading,
    filteredRequests,
    requestSearchTerm, setRequestSearchTerm,
    requestsLoading,
    handleApproveRequest,
    handleRejectRequest,
    handleUserSubmit: apiUserSubmit,
    handleUserDelete: apiUserDelete
  } = useUsers(userTab, socketService, isConnected, currentUser);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({
    open: false, title: '', message: '', confirmText: 'Delete', onConfirm: null
  });
  const [userFormData, setUserFormData] = useState({
    reg_id: '', name: '', email: '', password: '', role: 'Student', department: 'CS', semester: '1', program_year: '1'
  });

  const [userPage, setUserPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => setUserPage(1), [filteredUsers]);
  useEffect(() => setRequestPage(1), [filteredRequests]);

  const handleUserInputChange = (e) => {
    setUserFormData({ ...userFormData, [e.target.name]: e.target.value });
  };

  const handleUserSubmitLocally = async (e) => {
    e.preventDefault();
    const success = await apiUserSubmit(userFormData, selectedUser);
    if (success) handleCloseUserModal();
  };

  const handleUserDelete = (userIdToDelete) => {
    setConfirmState({
      open: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user profile permanently?',
      confirmText: 'Delete User Account',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        await apiUserDelete(userIdToDelete);
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

            <UserTable 
              usersLoading={usersLoading}
              paginatedUsers={paginatedUsers}
              userSearchTerm={userSearchTerm}
              filteredUsersCount={filteredUsers.length}
              userPage={userPage}
              setUserPage={setUserPage}
              itemsPerPage={itemsPerPage}
              onEditUser={handleUserEdit}
              onDeleteUser={handleUserDelete}
            />

            {isUserModalOpen && (
              <div className="um-modal-overlay">
                <div className="um-modal-box um-modal-box--medium fade-in">
                  <h2>{selectedUser ? 'Edit User' : 'Add New User'}</h2>
                  <form onSubmit={handleUserSubmitLocally} className="um-modal-form">
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
            
            <RegistrationRequests 
              requestsLoading={requestsLoading}
              paginatedRequests={paginatedRequests}
              filteredRequestsCount={filteredRequests.length}
              requestPage={requestPage}
              setRequestPage={setRequestPage}
              itemsPerPage={itemsPerPage}
              onApproveRequest={handleApproveRequest}
              onRejectRequest={handleRejectRequest}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;