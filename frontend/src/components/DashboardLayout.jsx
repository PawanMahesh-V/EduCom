import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faGraduationCap, faBars, faChevronDown, faShoppingCart } from '@fortawesome/free-solid-svg-icons';

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
  
  // Draggable logic for the marketplace button
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, moved: false });
  const buttonRef = useRef(null);

  const handleMouseDown = (e) => {
    // Support both mouse and touch
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    dragRef.current = {
        startX: clientX,
        startY: clientY,
        initialX: position.x,
        initialY: position.y,
        moved: false
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragRef.current.startX;
      const deltaY = clientY - dragRef.current.startY;

      // Check if actually moved (to differentiate from click)
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          dragRef.current.moved = true;
      }

      setPosition({
        x: dragRef.current.initialX + deltaX,
        y: dragRef.current.initialY + deltaY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, position]);

  const handleButtonClick = (e) => {
    // If we moved while dragging, don't trigger the click
    if (dragRef.current.moved) {
        e.preventDefault();
        return;
    }
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

      {/* Floating Marketplace Button (Visible to all) */}
      <button 
        ref={buttonRef}
        className={`floating-marketplace-btn ${isDragging ? 'dragging' : ''}`}
        onClick={handleButtonClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            cursor: isDragging ? 'grabbing' : 'grab'
        }}
        title="Marketplace (Drag to move)"
        aria-label="Open Marketplace"
      >
        <FontAwesomeIcon icon={faShoppingCart} />
        <span className="cart-badge">!</span>
      </button>

      {/* Main Content */}
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
