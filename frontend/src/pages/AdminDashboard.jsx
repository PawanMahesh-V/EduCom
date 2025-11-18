import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CustomAlert from '../components/CustomAlert';
import {
  faTachometerAlt,
  faUsers,
  faBook,
  faSignOutAlt,
  faBars,
  faBookOpen,
  faUserPlus,
  faPenToSquare,
  faTrash,
  faChartLine,
  faExclamationTriangle,
  faUserGraduate,
  faChalkboardTeacher,
  faComments,
  faStore,
  faUserCheck,
  faUserMinus,
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import { authApi, dashboardApi, userApi, courseApi, communityApi } from '../api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminProfile, setAdminProfile] = useState({
    username: 'Loading...',
    full_name: 'Loading...',
    email: ''
  });
  const [activeSection, setActiveSection] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);
  
  // Overview states
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  
  // User Management states
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    reg_id: '',
    full_name: '',
    email: '',
    password: '',
    role: 'Student',
    department: 'CS',
    program_year: '1'
  });
  
  // Course Management states
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseFormData, setCourseFormData] = useState({
    course_code: '',
    course_name: '',
    department: 'CS',
    semester: '',
    teacher_id: ''
  });
  const [courseTab, setCourseTab] = useState('courses'); // 'courses' or 'communities'
  
  // Communities states
  const [communities, setCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [communityFormData, setCommunityFormData] = useState({
    name: '',
    status: 'active'
  });
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedCommunityForMessage, setSelectedCommunityForMessage] = useState(null);
  const [messageFormData, setMessageFormData] = useState({
    subject: '',
    message: ''
  });
  
  // Assign Course states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCourseForAssign, setSelectedCourseForAssign] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [selectedCourseForRemove, setSelectedCourseForRemove] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedEnrolledStudents, setSelectedEnrolledStudents] = useState([]);
  const [enrolledSearchTerm, setEnrolledSearchTerm] = useState('');
  
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminProfile();
    if (activeSection === 'overview') {
      fetchDashboardData();
    } else if (activeSection === 'users') {
      fetchUsers();
    } else if (activeSection === 'courses') {
      fetchCourses();
      fetchTeachers();
      if (courseTab === 'communities') {
        fetchCommunities();
      }
    }
  }, [activeSection, courseTab]);

  const fetchAdminProfile = async () => {
    try {
      const data = await authApi.getCurrentUser();
      setAdminProfile(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    sessionStorage.removeItem('userToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const getInitials = (fullName) => {
    if (!fullName) return 'A';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Dashboard Overview functions
  const fetchDashboardData = async () => {
    try {
      setStatsLoading(true);
      const statsData = await dashboardApi.getStats();
      setStats(statsData);
      setStatsError(null);
    } catch (err) {
      setStatsError(err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  // User Management functions
  useEffect(() => {
    if (!userSearchTerm) {
      setFilteredUsers(users);
      return;
    }
    const searchTermLower = userSearchTerm.toLowerCase();
    const filtered = users.filter(user => 
      user.reg_id.toLowerCase().includes(searchTermLower) ||
      user.full_name.toLowerCase().includes(searchTermLower) ||
      user.email.toLowerCase().includes(searchTermLower) ||
      user.role.toLowerCase().includes(searchTermLower) ||
      user.department.toLowerCase().includes(searchTermLower)
    );
    setFilteredUsers(filtered);
  }, [userSearchTerm, users]);

  const fetchUsers = async () => {
    try {
      const data = await userApi.getAll();
      const fetchedUsers = data.users || data || [];
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
      setUsersLoading(false);
    } catch (err) {
      setError(err.message);
      setUsersLoading(false);
    }
  };

  const handleUserInputChange = (e) => {
    setUserFormData({
      ...userFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        await userApi.update(selectedUser.user_id, userFormData);
      } else {
        await userApi.create(userFormData);
      }
      fetchUsers();
      handleCloseUserModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUserDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userApi.delete(userId);
        fetchUsers();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleUserEdit = (user) => {
    setSelectedUser(user);
    setUserFormData({
      reg_id: user.reg_id,
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department,
      program_year: (user.program_year && String(user.program_year)) || '1'
    });
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setSelectedUser(null);
    setUserFormData({
      reg_id: '',
      full_name: '',
      email: '',
      password: '',
      role: 'Student',
      department: 'CS',
      program_year: '1'
    });
    setIsUserModalOpen(false);
  };

  // Course Management functions
  useEffect(() => {
    if (!courseSearchTerm) {
      setFilteredCourses(courses);
      return;
    }
    const searchTermLower = courseSearchTerm.toLowerCase();
    const filtered = courses.filter(course => 
      (course.course_code || '').toLowerCase().includes(searchTermLower) ||
      (course.course_name || '').toLowerCase().includes(searchTermLower) ||
      (course.department || '').toLowerCase().includes(searchTermLower) ||
      (course.semester || '').toLowerCase().includes(searchTermLower)
    );
    setFilteredCourses(filtered);
  }, [courseSearchTerm, courses]);

  useEffect(() => {
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, []);

  const fetchTeachers = async () => {
    try {
      const data = await userApi.getTeachers();
      setTeachers((data.teachers || data || []).map(t => ({...t})));
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await courseApi.getAll();
      setCourses(data.courses || data || []);
      setCoursesLoading(false);
    } catch (err) {
      setError(err.message);
      setCoursesLoading(false);
      setCourses([]);
    }
  };

  const fetchCommunities = async () => {
    try {
      const data = await communityApi.getAll();
      setCommunities(data.communities || data || []);
      setCommunitiesLoading(false);
    } catch (err) {
      setError(err.message);
      setCommunitiesLoading(false);
      setCommunities([]);
    }
  };

  const handleCommunityEdit = (community) => {
    setSelectedCommunity(community);
    setCommunityFormData({
      name: community.name,
      status: community.status
    });
    setIsCommunityModalOpen(true);
  };

  const handleCommunityInputChange = (e) => {
    setCommunityFormData({
      ...communityFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleCommunitySubmit = async (e) => {
    e.preventDefault();
    try {
      await communityApi.update(selectedCommunity.community_id, communityFormData);
      await fetchCommunities();
      handleCloseCommunityModal();
      setAlertConfig({ message: 'Community updated successfully!', type: 'success' });
    } catch (err) {
      setAlertConfig({ message: err.message || 'Failed to update community', type: 'error' });
    }
  };

  const handleCloseCommunityModal = () => {
    setSelectedCommunity(null);
    setCommunityFormData({
      name: '',
      status: 'active'
    });
    setIsCommunityModalOpen(false);
  };

  const handleSendMessage = (community) => {
    setSelectedCommunityForMessage(community);
    setIsMessageModalOpen(true);
  };

  const handleMessageInputChange = (e) => {
    setMessageFormData({
      ...messageFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    try {
      // TODO: Implement broadcast message API
      console.log('Sending message to community:', selectedCommunityForMessage);
      console.log('Message data:', messageFormData);
      
      // Placeholder for actual API call
      // await communityApi.sendMessage(selectedCommunityForMessage.community_id, messageFormData);
      
      setAlertConfig({ 
        message: `Message sent to ${selectedCommunityForMessage.name} successfully!`, 
        type: 'success' 
      });
      handleCloseMessageModal();
    } catch (err) {
      setAlertConfig({ message: err.message || 'Failed to send message', type: 'error' });
    }
  };

  const handleCloseMessageModal = () => {
    setSelectedCommunityForMessage(null);
    setMessageFormData({
      subject: '',
      message: ''
    });
    setIsMessageModalOpen(false);
  };

  const handleCourseInputChange = (e) => {
    setCourseFormData({
      ...courseFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCourse) {
        await courseApi.update(selectedCourse.course_id, courseFormData);
      } else {
        await courseApi.create(courseFormData);
      }
      await fetchCourses();
      handleCloseCourseModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCourseDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await courseApi.delete(courseId);
        fetchCourses();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleCourseEdit = (course) => {
    setSelectedCourse(course);
    setCourseFormData({
      course_code: course.course_code || '',
      course_name: course.course_name || '',
      department: course.department || 'CS',
      semester: course.semester || '',
      teacher_id: course.teacher_id || ''
    });
    setIsCourseModalOpen(true);
  };

  const handleCloseCourseModal = () => {
    setSelectedCourse(null);
    setCourseFormData({
      course_code: '',
      course_name: '',
      department: 'CS',
      semester: '',
      teacher_id: ''
    });
    setIsCourseModalOpen(false);
  };

  // Assign Course functions
  const fetchStudents = async () => {
    try {
      const data = await userApi.getAll();
      const allUsers = data.users || data || [];
      const studentList = allUsers.filter(user => user.role === 'Student');
      setStudents(studentList);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssignCourse = async (course) => {
    setSelectedCourseForAssign(course);
    
    try {
      // Fetch all students
      const data = await userApi.getAll();
      const allUsers = data.users || data || [];
      const allStudents = allUsers.filter(user => user.role === 'Student');
      
      // Fetch already enrolled students for this course
      const enrolledStudents = await courseApi.getEnrolledStudents(course.course_id);
      const enrolledIds = enrolledStudents.map(s => s.user_id);
      
      // Filter out already enrolled students
      const availableStudents = allStudents.filter(s => !enrolledIds.includes(s.user_id));
      
      setStudents(availableStudents);
      setIsAssignModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleAssignSubmit = async () => {
    if (selectedStudents.length === 0) {
      setAlertConfig({ message: 'Please select at least one student', type: 'warning' });
      return;
    }

    // Validate department matching
    const courseDepartment = selectedCourseForAssign.department;
    const invalidStudents = students.filter(student => 
      selectedStudents.includes(student.user_id) && 
      student.department !== courseDepartment
    );

    if (invalidStudents.length > 0) {
      const invalidNames = invalidStudents.map(s => s.full_name).join(', ');
      setAlertConfig({ 
        message: `Cannot assign ${courseDepartment} course to students from different departments:\n${invalidNames}\n\nPlease select only ${courseDepartment} students.`,
        type: 'error'
      });
      return;
    }

    try {
      console.log('=== FRONTEND: Assigning course ===');
      console.log('Course:', selectedCourseForAssign);
      console.log('Selected student IDs:', selectedStudents);
      
      // Call API to assign course to students
      const response = await courseApi.assignToStudents(selectedCourseForAssign.course_id, selectedStudents);
      console.log('API Response:', response);
      
      const { newEnrollments, totalAttempted } = response;
      
      if (newEnrollments > 0) {
        setAlertConfig({ 
          message: `Successfully assigned course to ${newEnrollments} student(s)!`,
          type: 'success'
        });
      } else if (totalAttempted > 0 && newEnrollments === 0) {
        setAlertConfig({ 
          message: 'All selected students were already enrolled in this course.',
          type: 'info'
        });
      }
      
      // Remove assigned students from the list
      setStudents(prev => prev.filter(student => !selectedStudents.includes(student.user_id)));
      setSelectedStudents([]);
      handleCloseAssignModal();
      
    } catch (err) {
      console.error('Assignment error:', err);
      setError(err.message);
      alert('Failed to assign course: ' + err.message);
    }
  };

  const handleCloseAssignModal = () => {
    setSelectedCourseForAssign(null);
    setSelectedStudents([]);
    setStudentSearchTerm('');
    setIsAssignModalOpen(false);
  };

  const handleRemoveCourse = async (course) => {
    setSelectedCourseForRemove(course);
    
    try {
      // Fetch enrolled students for this course
      const enrolled = await courseApi.getEnrolledStudents(course.course_id);
      setEnrolledStudents(enrolled);
      setIsRemoveModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEnrolledStudentToggle = (studentId) => {
    setSelectedEnrolledStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleRemoveSubmit = async () => {
    if (selectedEnrolledStudents.length === 0) {
      setAlertConfig({ message: 'Please select at least one student to remove', type: 'warning' });
      return;
    }

    try {
      console.log('=== FRONTEND: Removing students from course ===');
      console.log('Course:', selectedCourseForRemove);
      console.log('Selected student IDs:', selectedEnrolledStudents);
      
      const response = await courseApi.removeStudents(selectedCourseForRemove.course_id, selectedEnrolledStudents);
      console.log('API Response:', response);
      
      const { removedCount, totalAttempted } = response;
      
      if (removedCount > 0) {
        setAlertConfig({ 
          message: `Successfully removed ${removedCount} student(s) from the course!`,
          type: 'success'
        });
      } else {
        setAlertConfig({ 
          message: 'No students were removed.',
          type: 'info'
        });
      }
      
      // Remove students from the enrolled list
      setEnrolledStudents(prev => prev.filter(student => !selectedEnrolledStudents.includes(student.user_id)));
      setSelectedEnrolledStudents([]);
      handleCloseRemoveModal();
      
    } catch (err) {
      console.error('Removal error:', err);
      setAlertConfig({ message: err.message || 'Failed to remove students', type: 'error' });
    }
  };

  const handleCloseRemoveModal = () => {
    setSelectedCourseForRemove(null);
    setSelectedEnrolledStudents([]);
    setEnrolledSearchTerm('');
    setIsRemoveModalOpen(false);
  };

  const filteredStudents = students.filter(student => {
    // Filter by department first
    if (selectedCourseForAssign && student.department !== selectedCourseForAssign.department) {
      return false;
    }
    // Then apply search filter
    if (!studentSearchTerm) return true;
    const searchLower = studentSearchTerm.toLowerCase();
    return (
      student.full_name.toLowerCase().includes(searchLower) ||
      student.reg_id.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    );
  });

  const filteredEnrolledStudents = enrolledStudents.filter(student => {
    if (!enrolledSearchTerm) return true;
    const searchLower = enrolledSearchTerm.toLowerCase();
    return (
      student.full_name.toLowerCase().includes(searchLower) ||
      student.reg_id.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    );
  });

  const menuItems = [
    { id: 'overview', name: 'Overview', icon: faTachometerAlt },
    { id: 'users', name: 'User Management', icon: faUsers },
    { id: 'courses', name: 'Course Management', icon: faBook },
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
            EduCom<span style={{ background: 'linear-gradient(135deg, #79797a 0%, #374151 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}></span>
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
            <h2>{menuItems.find(item => item.id === activeSection)?.name || 'Overview'}</h2>
          </div>
          <div className="header-actions">
            <div className="profile-icon">
              {getInitials(adminProfile.full_name)}
            </div>
            <div className="user-info">
              <span className="user-name">{adminProfile.full_name}</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
        </header>

        <div className="content-area">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="admin-overview">
              {statsLoading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Loading dashboard...</p>
                </div>
              ) : statsError ? (
                <div className="error-container">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
                  <h3>Failed to load dashboard</h3>
                  <p>{statsError}</p>
                  <button className="btn btn-primary" onClick={fetchDashboardData}>Retry</button>
                </div>
              ) : (
                <>
                  <div className="overview-header">
                    <div>
                      <h2>Dashboard Overview</h2>
                      <p>Welcome back! Here's what's happening with your platform.</p>
                    </div>
                    <button className="btn btn-primary" onClick={fetchDashboardData}>
                      <FontAwesomeIcon icon={faChartLine} /> Refresh Stats
                    </button>
                  </div>

                  <div className="stats-grid">
                    {[
                      {
                        title: 'Total Users',
                        value: stats?.totalUsers || 0,
                        icon: faUsers,
                        color: '#000464ff',
                        subtitle: `${stats?.usersByRole?.Student || 0} Students, ${stats?.usersByRole?.Teacher || 0} Teachers`
                      },
                      {
                        title: 'Total Courses',
                        value: stats?.totalCourses || 0,
                        icon: faBook,
                        color: '#000464ff',
                        subtitle: `${stats?.totalEnrollments || 0} Total Enrollments`
                      },
                      {
                        title: 'Communities',
                        value: stats?.totalCommunities || 0,
                        icon: faComments,
                        color: '#000464ff',
                        subtitle: `${stats?.totalMessages || 0} Messages`
                      },
                      {
                        title: 'Marketplace',
                        value: stats?.totalMarketplaceItems || 0,
                        icon: faStore,
                        color: '#000464ff',
                        subtitle: `${stats?.pendingMarketplaceItems || 0} Pending Approval`
                      }
                    ].map((card, index) => (
                      <div key={index} className="stat-card" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="stat-icon" style={{ background: card.color }}>
                          <FontAwesomeIcon icon={card.icon} />
                        </div>
                        <div className="stat-content">
                          <h3>{card.value.toLocaleString()}</h3>
                          <p className="stat-title">{card.title}</p>
                          <p className="stat-subtitle">{card.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="secondary-stats">
                    <div className="stat-item">
                      <FontAwesomeIcon icon={faUserGraduate} className="stat-icon-small" />
                      <div>
                        <h4>{stats?.usersByRole?.Student || 0}</h4>
                        <p>Students</p>
                      </div>
                    </div>
                    <div className="stat-item">
                      <FontAwesomeIcon icon={faChalkboardTeacher} className="stat-icon-small" />
                      <div>
                        <h4>{stats?.usersByRole?.Teacher || 0}</h4>
                        <p>Teachers</p>
                      </div>
                    </div>
                    <div className="stat-item">
                      <FontAwesomeIcon icon={faUsers} className="stat-icon-small" />
                      <div>
                        <h4>{stats?.usersByRole?.Admin || 0}</h4>
                        <p>Admins</p>
                      </div>
                    </div>
                    <div className="stat-item">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="stat-icon-small" />
                      <div>
                        <h4>{stats?.pendingReports || 0}</h4>
                        <p>Pending Reports</p>
                      </div>
                    </div>
                  </div>

                  <div className="recent-activity-grid">
                    <div className="activity-card">
                      <div className="activity-header">
                        <h3>Recent Users</h3>
                        <span className="badge">{stats?.recentUsers?.length || 0}</span>
                      </div>
                      <div className="activity-list">
                        {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                          stats.recentUsers.map((user) => (
                            <div key={user.user_id} className="activity-item">
                              <div className="activity-avatar">
                                {user.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="activity-content">
                                <h4>{user.full_name}</h4>
                                <p>{user.role} • {user.department}</p>
                              </div>
                              <span className="activity-time">
                                {new Date(user.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="no-data">No recent users</p>
                        )}
                      </div>
                    </div>

                    <div className="activity-card">
                      <div className="activity-header">
                        <h3>Recent Courses</h3>
                        <span className="badge">{stats?.recentCourses?.length || 0}</span>
                      </div>
                      <div className="activity-list">
                        {stats?.recentCourses && stats.recentCourses.length > 0 ? (
                          stats.recentCourses.map((course) => (
                            <div key={course.course_id} className="activity-item">
                              <div className="activity-avatar course-avatar">
                                <FontAwesomeIcon icon={faBook} />
                              </div>
                              <div className="activity-content">
                                <h4>{course.course_name}</h4>
                                <p>{course.course_code} • {course.teacher_name || 'No teacher assigned'}</p>
                              </div>
                              <span className="activity-time">
                                {new Date(course.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="no-data">No recent courses</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* User Management Section */}
          {activeSection === 'users' && (
            <div className="container">
              <div className="header-actions">
                <h1>User Management</h1>
                <div className="search-container">
                  <input
                    className="search-input"
                    type="text"
                    placeholder="Search users by name, email, role..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  className="button primary icon-button"
                  onClick={() => setIsUserModalOpen(true)}
                  data-tooltip="Add New User"
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                </button>
              </div>

              {usersLoading ? (
                <div className="loading-error">Loading...</div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Registration ID</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                            {userSearchTerm ? 'No users found matching your search' : 'No users available'}
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.user_id}>
                            <td data-label="Registration ID">{user.reg_id}</td>
                            <td data-label="Full Name">{user.full_name}</td>
                            <td data-label="Email">{user.email}</td>
                            <td data-label="Role">{user.role}</td>
                            <td data-label="Department">{user.department}</td>
                            <td data-label="Actions">
                              <button 
                                className="button edit icon-button small"
                                onClick={() => handleUserEdit(user)}
                                data-tooltip="Edit User"
                              >
                                <FontAwesomeIcon icon={faPenToSquare} />
                              </button>
                              <button 
                                className="button delete icon-button small"
                                onClick={() => handleUserDelete(user.user_id)}
                                data-tooltip="Delete User"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {isUserModalOpen && (
                <div className="modal">
                  <div className="modal-content">
                    <h2>{selectedUser ? 'Edit User' : 'Add New User'}</h2>
                    <form onSubmit={handleUserSubmit}>
                      <div className="form-group">
                        <label>Registration ID:</label>
                        <input
                          type="text"
                          name="reg_id"
                          value={userFormData.reg_id}
                          onChange={handleUserInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Full Name:</label>
                        <input
                          type="text"
                          name="full_name"
                          value={userFormData.full_name}
                          onChange={handleUserInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email:</label>
                        <input
                          type="email"
                          name="email"
                          value={userFormData.email}
                          onChange={handleUserInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Password:</label>
                        <input
                          type="password"
                          name="password"
                          value={userFormData.password}
                          onChange={handleUserInputChange}
                          required={!selectedUser}
                          placeholder={selectedUser ? "Leave blank to keep current password" : "Enter password"}
                        />
                      </div>
                      <div className="form-group">
                        <label>Role:</label>
                        <select
                          name="role"
                          value={userFormData.role}
                          onChange={handleUserInputChange}
                        >
                          <option value="Student">Student</option>
                          <option value="Teacher">Teacher</option>
                          <option value="Admin">Admin</option>
                          <option value="HOD">HOD</option>
                          <option value="PM">PM (Program Manager)</option>
                        </select>
                      </div>
                      {userFormData.role === 'PM' && (
                        <div className="form-group">
                          <label>Program Year:</label>
                          <select
                            name="program_year"
                            value={userFormData.program_year}
                            onChange={handleUserInputChange}
                            required
                          >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                          </select>
                        </div>
                      )}
                      <div className="form-group">
                        <label>Department:</label>
                        <select
                          name="department"
                          value={userFormData.department}
                          onChange={handleUserInputChange}
                        >
                          <option value="CS">CS</option>
                          <option value="BBA">BBA</option>
                          <option value="IT">IT</option>
                        </select>
                      </div>
                      <div className="modal-actions">
                        <button className="button primary" type="submit">
                          {selectedUser ? 'Update User' : 'Create User'}
                        </button>
                        <button className="button secondary" type="button" onClick={handleCloseUserModal}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Course Management Section */}
          {activeSection === 'courses' && (
            <div className="course-management-wrapper">
              <div className="tabs-container">
                <button 
                  className={`tab-button ${courseTab === 'courses' ? 'active' : ''}`}
                  onClick={() => setCourseTab('courses')}
                >
                  Courses
                </button>
                <button 
                  className={`tab-button ${courseTab === 'communities' ? 'active' : ''}`}
                  onClick={() => setCourseTab('communities')}
                >
                  Communities
                </button>
                <button 
                  className={`tab-button ${courseTab === 'assign' ? 'active' : ''}`}
                  onClick={() => setCourseTab('assign')}
                >
                  Assign Students
                </button>
                <button 
                  className={`tab-button ${courseTab === 'remove' ? 'active' : ''}`}
                  onClick={() => setCourseTab('remove')}
                >
                  Remove Students
                </button>
              </div>
              
              <div className="tab-content">
                {courseTab === 'courses' ? (
                  <div className="container">
                    <div className="header-actions">
                      <h1>Course Management</h1>
                      <div className="search-container">
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Search courses by code, name, department..."
                          value={courseSearchTerm}
                          onChange={(e) => setCourseSearchTerm(e.target.value)}
                        />
                      </div>
                      <button 
                        className="button primary icon-button"
                        onClick={() => setIsCourseModalOpen(true)}
                        data-tooltip="Add New Course"
                      >
                        <FontAwesomeIcon icon={faBook} />
                      </button>
                    </div>

                    {coursesLoading ? (
                      <div className="loading-error">Loading...</div>
                    ) : (
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Course Code</th>
                              <th>Course Name</th>
                              <th>Department</th>
                              <th>Semester</th>
                              <th>Teacher</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCourses.length === 0 ? (
                              <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                  {courseSearchTerm ? 'No courses found matching your search' : 'No courses available'}
                                </td>
                              </tr>
                            ) : (
                              filteredCourses.map((course) => (
                                <tr key={course.course_id}>
                                  <td data-label="Course Code">{course.course_code}</td>
                                  <td data-label="Course Name">{course.course_name}</td>
                                  <td data-label="Department">{course.department}</td>
                                  <td data-label="Semester">{course.semester}</td>
                                  <td data-label="Teacher">{course.teacher_name || 'No teacher assigned'}</td>
                                  <td data-label="Actions">
                                    <button 
                                      className="button edit icon-button small"
                                      onClick={() => handleCourseEdit(course)}
                                      data-tooltip="Edit Course"
                                    >
                                      <FontAwesomeIcon icon={faPenToSquare} />
                                    </button>
                                    <button 
                                      className="button delete icon-button small"
                                      onClick={() => handleCourseDelete(course.course_id)}
                                      data-tooltip="Delete Course"
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {isCourseModalOpen && (
                      <div className="modal">
                        <div className="modal-content">
                          <h2>{selectedCourse ? 'Edit Course' : 'Add New Course'}</h2>
                          <form onSubmit={handleCourseSubmit}>
                            <div className="form-group">
                              <label>Course Code:</label>
                              <input
                                type="text"
                                name="course_code"
                                value={courseFormData.course_code}
                                onChange={handleCourseInputChange}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Course Name:</label>
                              <input
                                type="text"
                                name="course_name"
                                value={courseFormData.course_name}
                                onChange={handleCourseInputChange}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Department:</label>
                              <select
                                name="department"
                                value={courseFormData.department}
                                onChange={handleCourseInputChange}
                              >
                                <option value="CS">CS</option>
                                <option value="BBA">BBA</option>
                                <option value="IT">IT</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Semester:</label>
                              <select
                                name="semester"
                                value={courseFormData.semester}
                                onChange={handleCourseInputChange}
                                required
                              >
                                <option value="">Select Semester</option>
                                <option value="Fall 2025">Fall 2025</option>
                                <option value="Spring 2026">Spring 2026</option>
                                <option value="Summer 2026">Summer 2026</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Teacher:</label>
                              <select
                                name="teacher_id"
                                value={courseFormData.teacher_id}
                                onChange={handleCourseInputChange}
                                required
                              >
                                <option value="">Select Teacher</option>
                                {teachers.map(teacher => (
                                  <option key={teacher.user_id} value={teacher.user_id}>
                                    {teacher.full_name} {teacher.role ? `(${teacher.role})` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="modal-actions">
                              <button 
                                type="submit" 
                                className="button primary"
                              >
                                {selectedCourse ? 'Update' : 'Create Course'}
                              </button>
                              <button 
                                type="button" 
                                className="button secondary"
                                onClick={handleCloseCourseModal}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                ) : courseTab === 'communities' ? (
                  <div className="container">
                    <h1>Community Management</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                      Manage course communities and their members
                    </p>

                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Community Name</th>
                            <th>Course Code</th>
                            <th>Course Name</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {communitiesLoading ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading communities...</td>
                            </tr>
                          ) : communities.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No communities available</td>
                            </tr>
                          ) : (
                            communities.map((community) => (
                              <tr key={community.community_id}>
                                <td data-label="Community Name">{community.name}</td>
                                <td data-label="Course Code">{community.course_code || 'N/A'}</td>
                                <td data-label="Course Name">{community.course_name || 'N/A'}</td>
                                <td data-label="Department">{community.department || 'N/A'}</td>
                                <td data-label="Status">
                                  <span style={{ 
                                    padding: '0.25rem 0.75rem', 
                                    borderRadius: '8px', 
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    background: community.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                                    color: community.status === 'active' ? '#059669' : '#6b7280'
                                  }}>
                                    {community.status}
                                  </span>
                                </td>
                                <td data-label="Actions">
                                  <button 
                                    className="button success icon-button small"
                                    onClick={() => handleSendMessage(community)}
                                    data-tooltip="Send Message"
                                  >
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                  </button>
                                  <button 
                                    className="button edit icon-button small"
                                    onClick={() => handleCommunityEdit(community)}
                                    data-tooltip="Edit Community"
                                  >
                                    <FontAwesomeIcon icon={faPenToSquare} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {isCommunityModalOpen && (
                      <div className="modal">
                        <div className="modal-content">
                          <h2>Edit Community</h2>
                          <form onSubmit={handleCommunitySubmit}>
                            <div className="form-group">
                              <label htmlFor="community-name">Community Name</label>
                              <input
                                type="text"
                                id="community-name"
                                name="name"
                                className="input"
                                value={communityFormData.name}
                                onChange={handleCommunityInputChange}
                                required
                              />
                            </div>
                            
                            <div className="form-group">
                              <label htmlFor="community-status">Status</label>
                              <select
                                id="community-status"
                                name="status"
                                className="input"
                                value={communityFormData.status}
                                onChange={handleCommunityInputChange}
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </div>

                            <div className="modal-actions">
                              <button 
                                type="submit" 
                                className="button primary"
                              >
                                Update Community
                              </button>
                              <button 
                                type="button" 
                                className="button secondary"
                                onClick={handleCloseCommunityModal}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {isMessageModalOpen && (
                      <div className="modal">
                        <div className="modal-content" style={{ maxWidth: '600px' }}>
                          <h2>Send Message to Community</h2>
                          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            <strong>{selectedCommunityForMessage?.name}</strong>
                            <br />
                            <span style={{ fontSize: '0.9rem' }}>
                              {selectedCommunityForMessage?.course_code} - {selectedCommunityForMessage?.course_name}
                            </span>
                          </p>
                          <form onSubmit={handleMessageSubmit}>
                            <div className="form-group">
                              <label htmlFor="message-subject">Subject</label>
                              <input
                                type="text"
                                id="message-subject"
                                name="subject"
                                className="input"
                                value={messageFormData.subject}
                                onChange={handleMessageInputChange}
                                placeholder="Enter message subject"
                                required
                              />
                            </div>
                            
                            <div className="form-group">
                              <label htmlFor="message-content">Message</label>
                              <textarea
                                id="message-content"
                                name="message"
                                className="input"
                                value={messageFormData.message}
                                onChange={handleMessageInputChange}
                                placeholder="Type your message here..."
                                rows="8"
                                required
                                style={{ resize: 'vertical', minHeight: '150px' }}
                              />
                            </div>

                            <div className="modal-actions">
                              <button 
                                type="submit" 
                                className="button primary"
                              >
                                <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: '0.5rem' }} />
                                Send Message
                              </button>
                              <button 
                                type="button" 
                                className="button secondary"
                                onClick={handleCloseMessageModal}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                ) : courseTab === 'assign' ? (
                  <div className="container">
                    <h1>Assign Students to Courses</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                      Select a course and assign students to it
                    </p>

                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Course Code</th>
                            <th>Course Name</th>
                            <th>Department</th>
                            <th>Semester</th>
                            <th>Teacher</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coursesLoading ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading courses...</td>
                            </tr>
                          ) : courses.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No courses available</td>
                            </tr>
                          ) : (
                            courses.map((course) => (
                              <tr key={course.course_id}>
                                <td data-label="Course Code">{course.course_code}</td>
                                <td data-label="Course Name">{course.course_name}</td>
                                <td data-label="Department">{course.department}</td>
                                <td data-label="Semester">{course.semester}</td>
                                <td data-label="Teacher">{course.teacher_name || 'No teacher assigned'}</td>
                                <td data-label="Action">
                                  <button 
                                    className="button success icon-button small"
                                    onClick={() => handleAssignCourse(course)}
                                    data-tooltip="Assign Students"
                                  >
                                    <FontAwesomeIcon icon={faUserCheck} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {isAssignModalOpen && (
                      <div className="modal">
                        <div className="modal-content" style={{ maxWidth: '600px' }}>
                          <h2>Assign Course to Students</h2>
                          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            <strong>{selectedCourseForAssign?.course_name}</strong> ({selectedCourseForAssign?.course_code})
                            <br />
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: '600' }}>
                              Department: {selectedCourseForAssign?.department}
                            </span>
                          </p>
                          
                          <div className="search-container" style={{ marginBottom: '1rem' }}>
                            <input
                              type="text"
                              className="search-input"
                              placeholder="Search students by name, ID, email..."
                              value={studentSearchTerm}
                              onChange={(e) => setStudentSearchTerm(e.target.value)}
                            />
                          </div>

                          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                            {filteredStudents.length === 0 ? (
                              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                {studentSearchTerm 
                                  ? `No ${selectedCourseForAssign?.department} students found matching your search` 
                                  : `No ${selectedCourseForAssign?.department} students available`}
                              </p>
                            ) : (
                              filteredStudents.map((student) => (
                                <div 
                                  key={student.user_id} 
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    padding: '0.75rem', 
                                    borderBottom: '1px solid var(--border-color)',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    background: selectedStudents.includes(student.user_id) ? 'var(--bg-secondary)' : 'transparent'
                                  }}
                                  onClick={() => handleStudentToggle(student.user_id)}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedStudents.includes(student.user_id)}
                                    onChange={() => handleStudentToggle(student.user_id)}
                                    style={{ marginRight: '1rem', cursor: 'pointer' }}
                                  />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                      {student.full_name}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                      {student.reg_id} • {student.department} • {student.email}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.9rem' }}>
                            Selected: <strong>{selectedStudents.length}</strong> student(s)
                          </div>

                          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                            <button 
                              type="button" 
                              className="button primary"
                              onClick={handleAssignSubmit}
                            >
                              Assign Course
                            </button>
                            <button 
                              type="button" 
                              className="button secondary"
                              onClick={handleCloseAssignModal}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : courseTab === 'remove' ? (
                  <div className="container">
                    <h1>Remove Students from Courses</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                      Select a course and remove enrolled students
                    </p>

                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Course Code</th>
                            <th>Course Name</th>
                            <th>Department</th>
                            <th>Semester</th>
                            <th>Teacher</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coursesLoading ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading courses...</td>
                            </tr>
                          ) : courses.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No courses available</td>
                            </tr>
                          ) : (
                            courses.map((course) => (
                              <tr key={course.course_id}>
                                <td data-label="Course Code">{course.course_code}</td>
                                <td data-label="Course Name">{course.course_name}</td>
                                <td data-label="Department">{course.department}</td>
                                <td data-label="Semester">{course.semester}</td>
                                <td data-label="Teacher">{course.teacher_name || 'No teacher assigned'}</td>
                                <td data-label="Action">
                                  <button 
                                    className="button delete icon-button small"
                                    onClick={() => handleRemoveCourse(course)}
                                    data-tooltip="Remove Students"
                                  >
                                    <FontAwesomeIcon icon={faUserMinus} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {isRemoveModalOpen && (
                      <div className="modal">
                        <div className="modal-content" style={{ maxWidth: '600px' }}>
                          <h2>Remove Students from Course</h2>
                          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            <strong>{selectedCourseForRemove?.course_name}</strong> ({selectedCourseForRemove?.course_code})
                            <br />
                            <span style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: '600' }}>
                              Select students to remove from this course
                            </span>
                          </p>
                          
                          <div className="search-container" style={{ marginBottom: '1rem' }}>
                            <input
                              type="text"
                              className="search-input"
                              placeholder="Search enrolled students..."
                              value={enrolledSearchTerm}
                              onChange={(e) => setEnrolledSearchTerm(e.target.value)}
                            />
                          </div>

                          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                            {filteredEnrolledStudents.length === 0 ? (
                              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                {enrolledSearchTerm 
                                  ? 'No enrolled students found matching your search' 
                                  : 'No students are currently enrolled in this course'}
                              </p>
                            ) : (
                              filteredEnrolledStudents.map((student) => (
                                <div 
                                  key={student.user_id} 
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    padding: '0.75rem', 
                                    borderBottom: '1px solid var(--border-color)',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    background: selectedEnrolledStudents.includes(student.user_id) ? '#fee2e2' : 'transparent'
                                  }}
                                  onClick={() => handleEnrolledStudentToggle(student.user_id)}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedEnrolledStudents.includes(student.user_id)}
                                    onChange={() => handleEnrolledStudentToggle(student.user_id)}
                                    style={{ marginRight: '1rem', cursor: 'pointer' }}
                                  />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                      {student.full_name}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                      {student.reg_id} • {student.department} • {student.email}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fee2e2', borderRadius: '8px', fontSize: '0.9rem', color: '#dc2626' }}>
                            Selected: <strong>{selectedEnrolledStudents.length}</strong> student(s) will be removed
                          </div>

                          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                            <button 
                              type="button" 
                              className="button"
                              onClick={handleRemoveSubmit}
                              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }}
                            >
                              Remove Students
                            </button>
                            <button 
                              type="button" 
                              className="button secondary"
                              onClick={handleCloseRemoveModal}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {alertConfig && (
        <CustomAlert
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => setAlertConfig(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;