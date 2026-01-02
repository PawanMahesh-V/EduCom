import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  faBook,
  faComments,
  faBell,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../components/DashboardLayout';
import Messages from './Student/Messages';
import MyCourses from './Student/MyCourses';
import Communities from './Student/Communities';
import Notifications from './Student/Notifications';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const raw = sessionStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;

  const [activeSection, setActiveSection] = useState('courses');
  const [initialCommunityChat, setInitialCommunityChat] = useState(null);

  const handleLogout = () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('userToken');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('userToken');
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const menuItems = [
    { id: 'courses', name: 'My Courses', icon: faBook },
    { id: 'community', name: 'Community Chat', icon: faUsers },
    { id: 'messages', name: 'Messages', icon: faComments },
    { id: 'notifications', name: 'Notifications', icon: faBell },
  ];

  // Handler for navigating from MyCourses to Community
  const handleNavigateToCommunity = (chat) => {
    setInitialCommunityChat(chat);
    setActiveSection('community');
  };

  // Clear initial chat when user manually switches sections
  const handleMenuClick = (section) => {
    if (section !== 'community') {
      setInitialCommunityChat(null);
    }
    setActiveSection(section);
  };

  return (
    <DashboardLayout
      user={user}
      role={user?.role || 'Student'}
      menuItems={menuItems}
      activeSection={activeSection}
      onMenuClick={handleMenuClick}
      onLogout={handleLogout}
    >
      {activeSection === 'courses' && (
        <MyCourses onNavigateToCommunity={handleNavigateToCommunity} />
      )}
      {activeSection === 'community' && (
        <Communities initialChat={initialCommunityChat} />
      )}
      {activeSection === 'messages' && <Messages />}
      {activeSection === 'notifications' && <Notifications />}
    </DashboardLayout>
  );
};

export default StudentDashboard;
