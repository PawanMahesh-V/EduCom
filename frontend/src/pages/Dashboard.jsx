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
import { useSocket } from '../context/SocketContext';
import { showAlert } from '../utils/alert';

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

import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();

  const [activeSection, setActiveSection] = useState(role === 'admin' ? 'overview' : 'courses');
  const [courseInitialTab, setCourseInitialTab] = useState('courses');
  const [initialChat, setInitialChat] = useState(null);

  // Use React Query hook for admin profile
  const { data: adminProfile } = useDashboardData(role);

  const { socketService, isConnected } = useSocket();

  // Global listeners
  useEffect(() => {
    if (isConnected && socketService) {
      const handleEnrollment = (data) => {
        showAlert(`You have been enrolled in ${data.courseName || 'a new course'}`, 'success');
      };
      
      socketService.onUserEnrolled(handleEnrollment);
      
      return () => {
        socketService.offUserEnrolled();
      };
    }
  }, [isConnected, socketService]);

  const handleNavigateToCommunity = (chat) => {
    setInitialChat(chat);
    setActiveSection('community');
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const handleMenuClick = (section, tab) => {
    if (section !== 'community') {
      setInitialChat(null);
    }
    setActiveSection(section);
    if (section === 'courses' && tab) {
      setCourseInitialTab(tab);
    }
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
        return <AdminOverview onNavigate={handleMenuClick} />;
      case 'users':
        return <UserManagement />;
      case 'courses':
        return <CourseManagement initialTab={courseInitialTab} />;
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
