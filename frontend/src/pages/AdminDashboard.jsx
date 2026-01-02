import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Overview from './Admin/Overview';
import UserManagement from './Admin/UserManagement';
import CourseManagement from './Admin/CourseManagement';
import Messages from './Admin/Messages';
import {
  faTachometerAlt,
  faUsers,
  faBook,
  faComments,
} from '@fortawesome/free-solid-svg-icons';
import { authApi } from '../api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const [adminProfile, setAdminProfile] = useState({
    username: 'Loading...',
    name: 'Loading...',
    email: ''
  });
  const [activeSection, setActiveSection] = useState('overview');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const data = await authApi.getCurrentUser();
      setAdminProfile(data.user || data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    sessionStorage.removeItem('userToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { id: 'overview', name: 'Overview', icon: faTachometerAlt },
    { id: 'users', name: 'User Management', icon: faUsers },
    { id: 'courses', name: 'Course Management', icon: faBook },
    { id: 'messages', name: 'Messages', icon: faComments },
  ];

  return (
    <DashboardLayout
      user={adminProfile}
      role="Administrator"
      menuItems={menuItems}
      activeSection={activeSection}
      onMenuClick={setActiveSection}
      onLogout={handleLogout}
    >
      {/* Overview Section */}
      {activeSection === 'overview' && <Overview />}
      
      {/* User Management Section */}
      {activeSection === 'users' && <UserManagement />}

      {/* Course Management Section */}
      {activeSection === 'courses' && <CourseManagement />}

      {/* Direct Messages Section */}
      {activeSection === 'messages' && <Messages />}
    </DashboardLayout>
  );
};

export default AdminDashboard;
