import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  faBook,
  faComments,
  faBell,
  faUsers,
  faTachometerAlt,
  faShieldHalved,
  faStore
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../components/DashboardLayout';
import { useSocket } from '../context/SocketContext';
import { showAlert } from '../utils/alert';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '../context/NotificationContext';
import { useConversations, useCommunities } from '../hooks/useChatData';

// Admin components
import AdminOverview from './Admin/Overview';
import UserManagement from './Admin/UserManagement';
import CourseManagement from './Admin/CourseManagement';
import AdminMessages from './Admin/Messages';
import AdminModeration from './Admin/Moderation';
import AdminMarketplace from './Marketplace';


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
  const location = useLocation();
  const { user, logout } = useAuth();
  const role = user?.role?.toLowerCase();

  const [activeSection, setActiveSection] = useState(() => {
    if (location.state?.activeSection) {
      return location.state.activeSection;
    }
    return role === 'admin' ? 'overview' : 'courses';
  });

  useEffect(() => {
    if (location.state?.activeSection) {
      setActiveSection(location.state.activeSection);
    }
  }, [location.state]);

  const [courseInitialTab, setCourseInitialTab] = useState('courses');
  const [initialChat, setInitialChat] = useState(null);
  const [initialMessageUser, setInitialMessageUser] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Use React Query hook for admin profile
  const { data: adminProfile } = useDashboardData(role);
  const { socketService, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const currentUserId = user?.id || user?.userId;
  
  // Fetch unread data dynamically for badges
  const { data: conversations } = useConversations(currentUserId);
  const { data: communities } = useCommunities(user?.role, currentUserId);
  const { unreadCount: unreadNotificationsCount } = useNotifications();

  // Count chats with unread messages, not total unread message count
  const unreadMessagesCount = Array.isArray(conversations)
    ? conversations.filter(conv => (conv.unread_count || 0) > 0).length
    : 0;
  const unreadCommunityCount = Array.isArray(communities)
    ? communities.reduce((acc, chat) => acc + (chat.unread_count || chat.unread || 0), 0)
    : 0;

  // Global listeners — use raw socket.on/off with named callbacks to avoid wiping
  // listeners registered by child components like MessageLayout.
  useEffect(() => {
    if (!isConnected || !socketService?.socket || !currentUserId) return;
    const sock = socketService.socket;

    const handleEnrollment = (data) => {
      showAlert(`You have been enrolled in ${data.courseName || 'a new course'}`, 'success');
    };

    const handleDashboardDM = () => {
      queryClient.invalidateQueries(['conversations', currentUserId]);
    };

    const handleDashboardMsg = () => {
      queryClient.invalidateQueries(['communities', user?.role, currentUserId]);
    };

    socketService.onUserEnrolled(handleEnrollment);
    sock.on('new-direct-message', handleDashboardDM);
    sock.on('direct-message-sent', handleDashboardDM);
    sock.on('new-message', handleDashboardMsg);

    return () => {
      socketService.offUserEnrolled();
      sock.off('new-direct-message', handleDashboardDM);
      sock.off('direct-message-sent', handleDashboardDM);
      sock.off('new-message', handleDashboardMsg);
    };
  }, [isConnected, socketService, currentUserId, queryClient, user?.role]);

  const handleNavigateToCommunity = (chat) => {
    setInitialChat(chat);
    setActiveSection('community');
  };

  const handleMessageSeller = (seller) => {
    setInitialMessageUser(seller);
    setActiveSection('messages');
  };

  const handleLogout = async () => {
    await logout();
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
    // Immediately refetch badge data when navigating to a section
    // so counts clear as soon as the user opens the relevant page.
    if (section === 'messages') {
      queryClient.invalidateQueries(['conversations', currentUserId]);
    }
    if (section === 'community') {
      queryClient.invalidateQueries(['communities', user?.role, currentUserId]);
    }
  };

  // Menu items based on role
  const getMenuItems = () => {
    const items = (() => {
      switch (role) {
        case 'admin':
          return [
            { id: 'overview', name: 'Overview', icon: faTachometerAlt },
            { id: 'users', name: 'Users', icon: faUsers },
            { id: 'courses', name: 'Courses', icon: faBook },
            { id: 'messages', name: 'Messages', icon: faComments },
            { id: 'marketplace', name: 'Marketplace', icon: faStore },
            { id: 'moderation', name: 'Moderation', icon: faShieldHalved },
          ];
        case 'student':
        case 'teacher':
        case 'hod':
        case 'pm':
          return [
            { id: 'courses', name: 'My Courses', icon: faBook },
            { id: 'community', name: 'Community', icon: faUsers },
            { id: 'messages', name: 'Messages', icon: faComments },
            { id: 'marketplace', name: 'Marketplace', icon: faStore },
            { id: 'notifications', name: 'Notifications', icon: faBell },
          ];
        default:
          return [];
      }
    })();

    // Attach badge counts dynamically
    return items.map(item => {
      if (item.id === 'messages') {
        return { ...item, badgeCount: unreadMessagesCount };
      }
      if (item.id === 'community') {
        return { ...item, badgeCount: unreadCommunityCount };
      }
      if (item.id === 'notifications') {
        return { ...item, badgeCount: unreadNotificationsCount };
      }
      return item;
    });
  };

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
        return <AdminMessages initialMessageUser={initialMessageUser} onToggleChat={setIsChatOpen} />;
      case 'moderation':
        return <AdminModeration />;
      case 'marketplace':
        return <AdminMarketplace onMessageSeller={handleMessageSeller} />;
      default:
        return <AdminOverview />;
    }
  };

  const renderStudentContent = () => {
    switch (activeSection) {
      case 'courses':
        return <StudentMyCourses onNavigateToCommunity={handleNavigateToCommunity} />;
      case 'community':
        return <StudentCommunities initialChat={initialChat} onToggleChat={setIsChatOpen} />;
      case 'messages':
        return <StudentMessages initialMessageUser={initialMessageUser} onToggleChat={setIsChatOpen} />;
      case 'notifications':
        return <StudentNotifications />;
      case 'marketplace':
        return <AdminMarketplace onMessageSeller={handleMessageSeller} />;
      default:
        return <StudentMyCourses onNavigateToCommunity={handleNavigateToCommunity} />;
    }
  };

  const renderTeacherContent = () => {
    switch (activeSection) {
      case 'courses':
        return <TeacherMyCourses onNavigateToCommunity={handleNavigateToCommunity} />;
      case 'community':
        return <TeacherCommunities initialChat={initialChat} onToggleChat={setIsChatOpen} />;
      case 'messages':
        return <TeacherMessages initialMessageUser={initialMessageUser} onToggleChat={setIsChatOpen} />;
      case 'notifications':
        return <TeacherNotifications />;
      case 'marketplace':
        return <AdminMarketplace onMessageSeller={handleMessageSeller} />;
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
      hideBottomNav={isChatOpen}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default Dashboard;