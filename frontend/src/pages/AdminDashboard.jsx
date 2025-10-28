// src/components/admin/AdminDashboard.js
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import '../styles/AdminDashboard.css'; // The modern CSS file
import { 
  FaTachometerAlt, 
  FaUsers, 
  FaBook, 
  FaStore, 
  FaBell, 
  FaGavel, 
  FaSignOutAlt 
} from 'react-icons/fa';

const AdminDashboard = () => {
  
  // Navigation links based on SRS 3.1.3
  const navItems = [
    { name: 'Overview', icon: <FaTachometerAlt />, path: '/admin' },
    { name: 'User Management', icon: <FaUsers />, path: '/admin/users' },
    { name: 'Course Management', icon: <FaBook />, path: '/admin/courses' },
    { name: 'Marketplace Moderation', icon: <FaStore />, path: '/admin/moderation' },
    { name: 'Send Notifications', icon: <FaBell />, path: '/admin/notifications' },
    // { name: 'Reports', icon: <FaGavel />, path: '/admin/reports' }, // Example for later
  ];

  return (
    <div className="admin-layout">
      
      {/* --- Sidebar (Navy Blue) --- */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>EduCom</h1>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink 
                  to={item.path}
                  // Use 'end' for the 'Overview' link to prevent it
                  // from being active for all other nested routes
                  end={item.path === '/admin'} 
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
          <NavLink to="/login" className="nav-link logout">
            <FaSignOutAlt />
            <span>Log Out</span>
          </NavLink>
        </div>
      </aside>

      {/* --- Main Content Area (White & Gray) --- */}
      <main className="main-content">
        
        {/* --- Header / Top Bar (White) --- */}
        <header className="header">
          <div className="header-search">
            {/* Search Bar (SRS 3.1.3) */}
            <input type="text" placeholder="Search users, courses..." />
          </div>
          <div className="header-profile">
            <span>Admin Name</span>
            <div className="profile-icon">A</div>
          </div>
        </header>

        {/* --- Page Content (Gray Background) --- */}
        <section className="content-area">
          {/* This Outlet renders the active page (Overview, UserManagement, etc.) */}
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;