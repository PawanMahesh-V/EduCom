import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/Layout.css';
import { 
  FaTachometerAlt, 
  FaUsers, 
  FaBook, 
  FaStore,
  FaBell, 
  FaSignOutAlt,
  FaUserCircle
} from 'react-icons/fa';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userToken');
    navigate('/login');
  };

  const getMenuItems = () => {
    switch (user?.role) {
      case 'Admin':
        return [
          { name: 'Overview', icon: <FaTachometerAlt />, path: '/admin' },
          { name: 'User Management', icon: <FaUsers />, path: '/admin/users' },
          { name: 'Course Management', icon: <FaBook />, path: '/admin/courses' },
          { name: 'Marketplace', icon: <FaStore />, path: '/admin/marketplace' },
          { name: 'Notifications', icon: <FaBell />, path: '/admin/notifications' },
        ];
      case 'Teacher':
        return [
          { name: 'Dashboard', icon: <FaTachometerAlt />, path: '/teacher' },
          { name: 'Courses', icon: <FaBook />, path: '/teacher/courses' },
          { name: 'Students', icon: <FaUsers />, path: '/teacher/students' },
          { name: 'Notifications', icon: <FaBell />, path: '/teacher/notifications' },
        ];
      case 'Student':
        return [
          { name: 'Dashboard', icon: <FaTachometerAlt />, path: '/student' },
          { name: 'My Courses', icon: <FaBook />, path: '/student/courses' },
          { name: 'Marketplace', icon: <FaStore />, path: '/student/marketplace' },
          { name: 'Notifications', icon: <FaBell />, path: '/student/notifications' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>EduCom</h1>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {getMenuItems().map((item) => (
              <li key={item.name}>
                <NavLink 
                  to={item.path}
                  end={item.path === `/${user?.role.toLowerCase()}`}
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-link logout">
            <FaSignOutAlt />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header">
          <div className="header-search">
            <input type="text" placeholder="Search..." />
          </div>
          <div className="header-profile">
            <span>{user?.full_name || 'User'}</span>
            <div className="profile-icon">
              <FaUserCircle />
            </div>
          </div>
        </header>

        <section className="content-area">
          {children}
        </section>
      </main>
    </div>
  );
};

export default Layout;