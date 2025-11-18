import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook,
  faComments,
  faClipboardList,
  faSignOutAlt,
  faBars,
  faBell,
  faBookOpen,
  faChalkboardTeacher,
  faPlus,
  faUsers,
  faUserGraduate,
  faFileAlt,
  faTasks
} from '@fortawesome/free-solid-svg-icons';
import { courseApi } from '../api';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  const name = user?.full_name || user?.name || 'User';
  const role = user?.role || 'Teacher';
  const userId = user?.user_id || user?.id || user?.userId;
  
  const [activeSection, setActiveSection] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    activeAssignments: 0,
    pendingGrading: 0
  });

  useEffect(() => {
    if (userId) {
      fetchTeacherStats();
    }
  }, [userId]);

  useEffect(() => {
    if (activeSection === 'courses' && userId) {
      fetchMyCourses();
    }
  }, [activeSection, userId]);

  useEffect(() => {
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, []);

  const fetchTeacherStats = async () => {
    try {
      const data = await courseApi.getTeacherStats(userId);
      setStats(data);
    } catch (err) {
      console.error('Error fetching teacher stats:', err);
    }
  };

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const data = await courseApi.getTeacherCourses(userId);
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

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

  const getInitials = (fullName) => {
    if (!fullName) return 'T';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const menuItems = [
    { id: 'courses', name: 'My Courses', icon: faBook },
    { id: 'community', name: 'Community', icon: faComments },
    { id: 'assignments', name: 'Assignments', icon: faClipboardList },
    { id: 'notifications', name: 'Notifications', icon: faBell },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    if (!isSidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    document.body.classList.remove('sidebar-open');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>
            <FontAwesomeIcon icon={faBookOpen} style={{ marginRight: '8px' }} />
            EduCom
          </h1>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSection(item.id);
                    closeSidebar();
                  }}
                >
                  <FontAwesomeIcon icon={item.icon} />
                  <span>{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button className="nav-link logout" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <FontAwesomeIcon icon={faBars} />
          </button>
          <div className="header-title">
            <h2>{menuItems.find(item => item.id === activeSection)?.name || 'My Courses'}</h2>
          </div>
          <div className="header-actions">
            <div className="profile-icon">
              {getInitials(name)}
            </div>
            <div className="user-info">
              <span className="user-name">{name}</span>
              <span className="user-role">{role}</span>
            </div>
          </div>
        </header>

        <div className="content-area">
          {activeSection === 'courses' && (
            <div className="container">
              {/* Stats Grid */}
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '2rem' }}>
                <div className="stat-card">
                  <div className="stat-icon">
                    <FontAwesomeIcon icon={faBook} />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.totalCourses}</h3>
                    <div className="stat-title">Total Courses</div>
                    <p className="stat-subtitle">Active courses</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <FontAwesomeIcon icon={faUserGraduate} />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.totalStudents}</h3>
                    <div className="stat-title">Total Students</div>
                    <p className="stat-subtitle">Enrolled students</p>
                  </div>
                </div>
              </div>

              {/* Courses Section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0 }}>My Courses</h1>
                <button className="button primary" onClick={() => setActiveSection('assignments')}>
                  <FontAwesomeIcon icon={faPlus} />
                  Create Assignment
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  Loading courses...
                </div>
              ) : courses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  <FontAwesomeIcon icon={faBook} style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
                  <p>No courses assigned yet.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Department</th>
                        <th>Semester</th>
                        <th>Students</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr key={course.course_id}>
                          <td data-label="Course Code">
                            <strong>{course.course_code}</strong>
                          </td>
                          <td data-label="Course Name">{course.course_name}</td>
                          <td data-label="Department">{course.department}</td>
                          <td data-label="Semester">{course.semester}</td>
                          <td data-label="Students">
                            <span style={{ 
                              background: 'var(--bg-secondary)', 
                              padding: '0.25rem 0.75rem', 
                              borderRadius: '8px',
                              fontWeight: '600'
                            }}>
                              {course.enrolled_count} students
                            </span>
                          </td>
                          <td data-label="Status">
                            <span className={`status-badge ${course.status}`}>
                              {course.status}
                            </span>
                          </td>
                          <td data-label="Actions">
                            <button 
                              className="button edit small"
                              data-tooltip="View Details"
                            >
                              <FontAwesomeIcon icon={faChalkboardTeacher} />
                            </button>
                            <button 
                              className="button primary small"
                              data-tooltip="Manage Students"
                            >
                              <FontAwesomeIcon icon={faUsers} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSection === 'community' && (
            <div className="container">
              <h1>Community</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Manage course communities and communications
              </p>
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <FontAwesomeIcon icon={faComments} style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
                <p>Community management will appear here.</p>
              </div>
            </div>
          )}

          {activeSection === 'assignments' && (
            <div className="container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ margin: '0 0 0.5rem 0' }}>Assignments</h1>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    Create and manage course assignments
                  </p>
                </div>
                <button className="button primary">
                  <FontAwesomeIcon icon={faPlus} />
                  New Assignment
                </button>
              </div>
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <FontAwesomeIcon icon={faClipboardList} style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
                <p>Your assignments will appear here.</p>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="container">
              <h1>Notifications</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Stay updated with important notifications
              </p>
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <FontAwesomeIcon icon={faBell} style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
                <p>Your notifications will appear here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
