import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faGraduationCap, faBars, faChevronDown } from '@fortawesome/free-solid-svg-icons';

const DashboardLayout = ({ 
  user, 
  role, 
  menuItems, 
  activeSection, 
  onMenuClick, 
  onLogout, 
  children 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClick = (itemId) => {
    onMenuClick(itemId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="dashboard-layout-topnav">
      {/* Top Navigation Bar */}
      <nav className="topnav">
        <div className="topnav-container">
          {/* Logo */}
          <div className="topnav-brand" role="banner">
            <FontAwesomeIcon icon={faGraduationCap} className="brand-icon" aria-hidden="true" />
            <span className="brand-text">EduCom</span>
          </div>

          {/* Desktop Navigation Menu */}
          <div className={`topnav-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`topnav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => handleMenuClick(item.id)}
              >
                <FontAwesomeIcon icon={item.icon} className="item-icon" />
                <span className="item-text">{item.name}</span>
              </button>
            ))}
          </div>

          {/* Right Side - User Profile & Actions */}
          <div className="topnav-actions">
            {/* User Profile Dropdown */}
            <div className="profile-dropdown">
              <button 
                className="profile-trigger"
                aria-label="User Profile Menu"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <div className="profile-avatar">
                  {getInitials(user?.full_name || user?.name)}
                </div>
                <div className="profile-info">
                  <span className="profile-name">{user?.full_name || user?.name || 'User'}</span>
                  <span className="profile-role">{role || user?.role || 'User'}</span>
                </div>
                <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
              </button>
              
              <div className="profile-dropdown-menu">
                <button className="dropdown-item logout-item" onClick={onLogout} aria-label="Sign Out">
                  <FontAwesomeIcon icon={faSignOutAlt} aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-toggle" 
              onClick={toggleMobileMenu}
              aria-label="Toggle Mobile Menu"
              aria-expanded={isMobileMenuOpen}
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
