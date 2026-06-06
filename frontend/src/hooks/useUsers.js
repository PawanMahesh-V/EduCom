import { useState, useEffect } from 'react';
import { userApi, authApi } from '../api';
import { showSuccess, showError } from '../utils/alert';

export const useUsers = (userTab, socketService, isConnected, currentUser) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userDepartmentFilter, setUserDepartmentFilter] = useState('All');
  const [usersLoading, setUsersLoading] = useState(true);

  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [filteredRequests, setFilteredRequests] = useState([]);

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
      showError('Failed to fetch registration requests');
      setRequestsLoading(false);
    }
  };

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
  }, [userSearchTerm, userRoleFilter, userDepartmentFilter, users]);

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
  }, [requestSearchTerm, registrationRequests]);

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

  const handleUserSubmit = async (userFormData, selectedUser) => {
    const lower = userFormData.email.toLowerCase();
    if (!(lower.endsWith('@szabist.pk') || lower.endsWith('@szabist.edu.pk'))) {
      showError('Email must end with @szabist.pk or @szabist.edu.pk');
      return false;
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
      return true;
    } catch (err) {
      showError(err.message);
      return false;
    }
  };

  const handleUserDelete = async (userIdToDelete) => {
    setUsers(prev => prev.filter(u => u.id !== userIdToDelete));
    setFilteredUsers(prev => prev.filter(u => u.id !== userIdToDelete));
    try {
      await userApi.delete(userIdToDelete);
      showSuccess('User deleted successfully');
    } catch (err) {
      fetchUsers();
      showError(err.message || 'Failed to delete user');
    }
  };

  return {
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
    handleUserSubmit,
    handleUserDelete
  };
};
