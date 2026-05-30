import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faGraduationCap, faChevronDown } from '@fortawesome/free-solid-svg-icons';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const handleMenuClick = (itemId) => {
    onMenuClick(itemId);
  };

  return (
    <div className="db-layout-container">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="db-sidebar">
        <div className="db-sidebar-top-section">
          {/* Logo Branding */}
          <div className="db-sidebar-brand">
            <FontAwesomeIcon icon={faGraduationCap} className="db-sidebar-brand-icon" />
            <span className="db-sidebar-brand-text">EduCom</span>
          </div>

          {/* Navigation Links Stack */}
          <nav className="db-sidebar-menu">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`db-sidebar-item ${activeSection === item.id ? 'db-sidebar-item--active' : ''}`}
                onClick={() => handleMenuClick(item.id)}
              >
                <div className="db-sidebar-icon-wrapper" style={{ position: 'relative', display: 'inline-flex' }}>
                  <FontAwesomeIcon icon={item.icon} className="db-sidebar-item-icon" />
                  {item.badgeCount > 0 && (
                    <span className="db-sidebar-badge">{item.badgeCount}</span>
                  )}
                </div>
                <span className="db-sidebar-item-text">{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer User Card Profile */}
        <div className="db-sidebar-footer">
          <div className="db-sidebar-user-profile">
            <div className="db-user-avatar-initial">
              {getInitials(user?.full_name || user?.name)}
            </div>
            <div className="db-user-meta-stack">
              <span className="db-user-meta-name">{user?.full_name || user?.name || 'User'}</span>
              <span className="db-user-meta-role">{role || 'User'}</span>
            </div>
          </div>
          
          <button className="db-sidebar-item db-sidebar-logout-btn" onClick={onLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} className="db-sidebar-item-icon" />
            <span className="db-sidebar-item-text">Logout</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN VIEWPORT CONTAINER ================= */}
      <div className="db-main-viewport">
        {/* Mobile Title Header Fallback */}
        <div className="db-mobile-title-bar" style={{ justifyContent: 'space-between' }}>
          <span>EduCom</span>
          <div className="db-top-header-actions">
            <div className="db-profile-dropdown">
              <button 
                className="db-profile-trigger"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="User Profile Options"
              >
                <div className="db-user-avatar-initial">
                  {getInitials(user?.full_name || user?.name)}
                </div>
                <div className="db-profile-meta-desktop">
                  <span className="db-profile-name">{user?.full_name || user?.name || 'User'}</span>
                  <FontAwesomeIcon icon={faChevronDown} className="db-dropdown-arrow-icon" />
                </div>
              </button>

              {isDropdownOpen && (
                <div className="db-profile-menu-dropdown fade-in">
                  <div className="db-dropdown-user-details">
                    <p className="db-dropdown-user-name">{user?.full_name || user?.name}</p>
                    <p className="db-dropdown-user-role">{role || 'Authorized Access'}</p>
                  </div>
                  <button className="db-dropdown-action-item" onClick={onLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    <span>Logout Session</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Header Top-Bar */}
        <header className="db-top-header">
          <div className="db-top-header-title">
            <h2>
              {menuItems.find(item => item.id === activeSection)?.name || 'Dashboard'}
            </h2>
          </div>

          {/* Right Side Header User Block Dropdown */}
          <div className="db-top-header-actions">
            <div className="db-profile-dropdown">
              <button 
                className="db-profile-trigger"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="User Profile Options"
              >
                <div className="db-user-avatar-initial">
                  {getInitials(user?.full_name || user?.name)}
                </div>
                <div className="db-profile-meta-desktop">
                  <span className="db-profile-name">{user?.full_name || user?.name || 'User'}</span>
                  <FontAwesomeIcon icon={faChevronDown} className="db-dropdown-arrow-icon" />
                </div>
              </button>

              {isDropdownOpen && (
                <div className="db-profile-menu-dropdown fade-in">
                  <div className="db-dropdown-user-details">
                    <p className="db-dropdown-user-name">{user?.full_name || user?.name}</p>
                    <p className="db-dropdown-user-role">{role || 'Authorized Access'}</p>
                  </div>
                  <button className="db-dropdown-action-item" onClick={onLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    <span>Logout Session</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Workspace Frame */}
        <main className={`db-content-inner-view ${hideBottomNav ? 'db-content-inner-view--chat-mode' : ''} ${activeSection === 'messages' || activeSection === 'community' ? 'db-content-inner-view--chat-page' : ''}`}>
          {children}
        </main>
      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      {!hideBottomNav && (
        <nav className="db-mobile-bottom-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`db-mobile-bottom-item ${activeSection === item.id ? 'db-mobile-bottom-item--active' : ''}`}
              onClick={() => handleMenuClick(item.id)}
            >
              <div className="db-mobile-icon-wrapper" style={{ position: 'relative', display: 'inline-flex' }}>
                <FontAwesomeIcon icon={item.icon} className="db-mobile-bottom-icon" />
                {item.badgeCount > 0 && (
                  <span className="db-mobile-badge">{item.badgeCount}</span>
                )}
              </div>
              <span className="db-mobile-bottom-text">{item.name}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default DashboardLayout;