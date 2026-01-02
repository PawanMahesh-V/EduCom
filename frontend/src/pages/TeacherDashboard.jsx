import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook,
  faComments,
  faUsers,
  faBell
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../components/DashboardLayout';

// Import modular components
import MyCourses from './Teacher/MyCourses';
import Communities from './Teacher/Communities';
import Messages from './Teacher/Messages';
import Notifications from './Teacher/Notifications';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const raw = sessionStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  
  const [activeSection, setActiveSection] = useState('courses');
  const [initialChat, setInitialChat] = useState(null);

  const handleNavigateToCommunity = (chat) => {
    setInitialChat(chat);
    setActiveSection('community');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { id: 'courses', name: 'My Courses', icon: faBook },
    { id: 'community', name: 'Community Chat', icon: faUsers },
    { id: 'messages', name: 'Messages', icon: faComments },
    { id: 'notifications', name: 'Notifications', icon: faBell }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'courses':
        return <MyCourses onNavigateToCommunity={handleNavigateToCommunity} />;
      case 'community':
        return <Communities initialChat={initialChat} />;
      case 'messages':
        return <Messages />;
      case 'notifications':
        return <Notifications />;
      default:
        return <MyCourses onNavigateToCommunity={handleNavigateToCommunity} />;
    }
  };

  return (
    <DashboardLayout
      user={user}
      role={user?.role || 'Teacher'}
      menuItems={menuItems}
      activeSection={activeSection}
      onMenuClick={(section) => {
        if (section !== 'community') {
          setInitialChat(null);
        }
        setActiveSection(section);
      }}
      onLogout={handleLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default TeacherDashboard;
