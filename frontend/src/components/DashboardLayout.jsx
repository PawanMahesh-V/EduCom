import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faGraduationCap, faBars, faChevronDown, faShoppingCart } from '@fortawesome/free-solid-svg-icons';

const DashboardLayout = ({ 
  user, 
  role, 
  menuItems, 
  activeSection, 
  onMenuClick, 
  onLogout, 
  hideBottomNav,
  children 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isAdmin = role?.toLowerCase() === 'admin';
  const showMarketplaceBtn = isAdmin ? activeSection === 'overview' : activeSection === 'courses';
  
  const handleButtonClick = (e) => {
    e.preventDefault();
    onMenuClick('marketplace');
  };

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
    <div className={`dashboard-layout-topnav ${hideBottomNav ? 'chat-active-layout' : ''}`}>
      {/* Top Navigation Bar */}
      <nav className={`topnav ${hideBottomNav ? 'mobile-hidden' : ''}`}>
        <div className="topnav-container">
          {/* Logo */}
          <div className="topnav-brand" role="banner">
            <FontAwesomeIcon icon={faGraduationCap} className="brand-icon" aria-hidden="true" />
            <span className="brand-text">EduCom</span>
          </div>

          {/* Desktop Navigation Menu (Hidden on mobile via CSS) */}
          <div className="topnav-menu desktop-menu">
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
              >
                <div className="profile-avatar">
                  {getInitials(user?.full_name || user?.name)}
                </div>
                <div className="profile-info desktop-only">
                  <span className="profile-name">{user?.full_name || user?.name || 'User'}</span>
                  <span className="profile-role">{role || user?.role || 'User'}</span>
                </div>
                <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon desktop-only" />
              </button>
              
              <div className="profile-dropdown-menu">
                <button className="dropdown-item logout-item" onClick={onLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation Bar for Mobile */}
      {!hideBottomNav && (
        <nav className="bottom-nav-bar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`bottom-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.id)}
            >
              <div className="nav-icon-wrapper">
                <FontAwesomeIcon icon={item.icon} />
              </div>
              <span className="nav-label">{item.name}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Main Content */}
      <main className={`dashboard-content ${hideBottomNav ? 'no-bottom-nav' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
