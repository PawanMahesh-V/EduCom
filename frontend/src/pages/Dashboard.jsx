import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  faBook,
  faComments,
  faBell,
  faUsers,
  faTachometerAlt
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../components/DashboardLayout';
import { authApi } from '../api';

// Admin components
import AdminOverview from './Admin/Overview';
import UserManagement from './Admin/UserManagement';
import CourseManagement from './Admin/CourseManagement';
import AdminMessages from './Admin/Messages';

// Student components
import StudentMessages from './Student/Messages';
import StudentMyCourses from './Student/MyCourses';
import StudentCommunities from './Student/Communities';
import StudentNotifications from './Student/Notifications';

// Teacher components
import TeacherMyCourses from './Teacher/MyCourses';
import TeacherCommunities from './Teacher/Communities';
import TeacherMessages from './Teacher/Messages';
import TeacherNotifications from './Teacher/Notifications';

const Dashboard = () => {
  const navigate = useNavigate();
  const raw = sessionStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  const role = user?.role?.toLowerCase();

  const [activeSection, setActiveSection] = useState(role === 'admin' ? 'overview' : 'courses');
  const [initialChat, setInitialChat] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);

  // Fetch admin profile for admin users
  useEffect(() => {
    if (role === 'admin') {
      fetchAdminProfile();
    }
  }, [role]);

  const fetchAdminProfile = async () => {
    try {
      const data = await authApi.getCurrentUser();
      setAdminProfile(data.user || data);
    } catch (err) {
      console.error('Failed to fetch admin profile:', err);
    }
  };

  const handleNavigateToCommunity = (chat) => {
    setInitialChat(chat);
    setActiveSection('community');
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    sessionStorage.removeItem('userToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const handleMenuClick = (section) => {
    if (section !== 'community') {
      setInitialChat(null);
    }
    setActiveSection(section);
  };

  // Menu items based on role
  const getMenuItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'overview', name: 'Overview', icon: faTachometerAlt },
          { id: 'users', name: 'User Management', icon: faUsers },
          { id: 'courses', name: 'Course Management', icon: faBook },
          { id: 'messages', name: 'Messages', icon: faComments },
        ];
      case 'student':
        return [
          { id: 'courses', name: 'My Courses', icon: faBook },
          { id: 'community', name: 'Community Chat', icon: faUsers },
          { id: 'messages', name: 'Messages', icon: faComments },
          { id: 'notifications', name: 'Notifications', icon: faBell },
        ];
      case 'teacher':
      case 'hod':
      case 'pm':
        return [
          { id: 'courses', name: 'My Courses', icon: faBook },
          { id: 'community', name: 'Community Chat', icon: faUsers },
          { id: 'messages', name: 'Messages', icon: faComments },
          { id: 'notifications', name: 'Notifications', icon: faBell },
        ];
      default:
        return [];
    }
  };

  // Render content based on role and active section
  const renderContent = () => {
    switch (role) {
      case 'admin':
        return renderAdminContent();
      case 'student':
        return renderStudentContent();
      case 'teacher':
      case 'hod':
      case 'pm':
        return renderTeacherContent();
      default:
        return <div>Unknown role</div>;
    }
  };

  const renderAdminContent = () => {
    switch (activeSection) {
      case 'overview':
        return <AdminOverview />;
      case 'users':
        return <UserManagement />;
      case 'courses':
        return <CourseManagement />;
      case 'messages':
        return <AdminMessages />;
      default:
        return <AdminOverview />;
    }
  };

  const renderStudentContent = () => {
    switch (activeSection) {
      case 'courses':
        return <StudentMyCourses onNavigateToCommunity={handleNavigateToCommunity} />;
      case 'community':
        return <StudentCommunities initialChat={initialChat} />;
      case 'messages':
        return <StudentMessages />;
      case 'notifications':
        return <StudentNotifications />;
      default:
        return <StudentMyCourses onNavigateToCommunity={handleNavigateToCommunity} />;
    }
  };

  const renderTeacherContent = () => {
    switch (activeSection) {
      case 'courses':
        return <TeacherMyCourses onNavigateToCommunity={handleNavigateToCommunity} />;
      case 'community':
        return <TeacherCommunities initialChat={initialChat} />;
      case 'messages':
        return <TeacherMessages />;
      case 'notifications':
        return <TeacherNotifications />;
      default:
        return <TeacherMyCourses onNavigateToCommunity={handleNavigateToCommunity} />;
    }
  };

  const displayUser = role === 'admin' ? (adminProfile || user) : user;
  const displayRole = role === 'admin' ? 'Admin' : (user?.role || role);

  return (
    <DashboardLayout
      user={displayUser}
      role={displayRole}
      menuItems={getMenuItems()}
      activeSection={activeSection}
      onMenuClick={handleMenuClick}
      onLogout={handleLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default Dashboard;
