import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DashboardLayout from '../components/DashboardLayout';
import { showAlert, showSuccess, showError, showWarning } from '../utils/alert';
import StatCard from '../components/StatCard';
import MessageLayout from '../components/MessageLayout';
import { useNotifications, useDirectMessages, useDMTypingIndicator } from '../hooks/useSocket';
import socketService from '../services/socket';
import {
  faTachometerAlt,
  faUsers,
  faBook,
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
  faPaperPlane,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { authApi, dashboardApi, userApi, courseApi, communityApi, directMessageApi } from '../api';
const AdminDashboard = () => {
  const navigate = useNavigate();
  const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
  const currentUser = raw ? JSON.parse(raw) : null;
  
  const [adminProfile, setAdminProfile] = useState({
    username: 'Loading...',
    name: 'Loading...',
    email: ''
  });
  const [activeSection, setActiveSection] = useState('overview');
  
  // Overview states
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  // Real-time notifications
  const { sendNotification, broadcastNotification } = useNotifications((notification) => {
    showAlert(notification.title, notification.message, notification.type || 'info');
  });
  
  // User Management states
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userDepartmentFilter, setUserDepartmentFilter] = useState('All');
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    reg_id: '',
    name: '',
    email: '',
    password: '',
    role: 'Student',
    department: 'CS',
    semester: '1',
    program_year: '1',
    section: ''
  });
  const [sections, setSections] = useState([]);
  
  // Course Management states
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [courseDepartmentFilter, setCourseDepartmentFilter] = useState('All');
  const [courseSemesterFilter, setCourseSemesterFilter] = useState('All');
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseFormData, setCourseFormData] = useState({
    code: '',
    name: '',
    department: 'CS',
    semester: '',
    teacher_id: ''
  });
  const [courseTab, setCourseTab] = useState('courses'); // 'courses' or 'communities'
  // Direct message states
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [dmTypingUsers, setDmTypingUsers] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [dmUserSearchQuery, setDmUserSearchQuery] = useState('');
  const [dmMessage, setDmMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  // Communities states
  const [communities, setCommunities] = useState([]);
  const [filteredCommunities, setFilteredCommunities] = useState([]);
  const [communityStatusFilter, setCommunityStatusFilter] = useState('All');
  const [communitySearchTerm, setCommunitySearchTerm] = useState('');
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
  const [assignDepartmentFilter, setAssignDepartmentFilter] = useState('All');
  const [assignYearFilter, setAssignYearFilter] = useState('All');
  const [assignSectionFilter, setAssignSectionFilter] = useState('All');
  
  // Real-time direct messages
  const userId = currentUser?.id || currentUser?.userId;
  const { sendDirectMessage } = useDirectMessages(userId, (newMessage) => {
    fetchConversations();
    
    if (selectedConversation && 
        (newMessage.sender_id === selectedConversation.user_id || 
         newMessage.receiver_id === selectedConversation.user_id)) {
      setDmMessages(prev => [...prev, newMessage]);
      scrollToBottom();
    }
  });
  const dmTypingIndicator = useDMTypingIndicator(
    selectedConversation?.user_id,
    currentUser?.name || 'Admin'
  );
  useEffect(() => {
    if (selectedConversation) {
      dmTypingIndicator.onTyping((data) => {
        if (data.isTyping) {
          setDmTypingUsers(prev => [...new Set([...prev, data.senderName])]);
          setTimeout(() => {
            setDmTypingUsers(prev => prev.filter(name => name !== data.senderName));
          }, 3000);
        } else {
          setDmTypingUsers(prev => prev.filter(name => name !== data.senderName));
        }
      });
    }
  }, [selectedConversation]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [dmMessages]);
  useEffect(() => {
    if (activeSection === 'messages' && userId) {
      fetchConversations();
      fetchAvailableUsers();
    }
  }, [activeSection, userId]);
  
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [selectedCourseForRemove, setSelectedCourseForRemove] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedEnrolledStudents, setSelectedEnrolledStudents] = useState([]);
  const [enrolledSearchTerm, setEnrolledSearchTerm] = useState('');
  const [removeDepartmentFilter, setRemoveDepartmentFilter] = useState('All');
  const [removeYearFilter, setRemoveYearFilter] = useState('All');
  const [removeSectionFilter, setRemoveSectionFilter] = useState('All');
  
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchAdminProfile();
    fetchSections();
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
  const fetchSections = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/sections', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken') || sessionStorage.getItem('userToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSections(data.sections || []);
      }
    } catch (err) {
    }
  };
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
  // Direct Message handlers
  const handleSendDirectMessage = () => {
    if (dmMessage.trim() && selectedConversation) {
      sendDirectMessage(
        selectedConversation.user_id,
        dmMessage,
        currentUser?.name || 'Admin'
      );
      setDmMessage('');
      dmTypingIndicator.stopTyping();
    }
  };
  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setDmMessages([]);
    await loadDirectMessages(conversation.user_id);
    // Refresh conversations to update unread count
    await fetchConversations();
  };
  const handleStartNewConversation = async (selectedUser) => {
    const newConversation = {
      user_id: selectedUser.id,
      user_name: selectedUser.name,
      user_email: selectedUser.email,
      last_message: null,
      last_message_time: null,
      unread_count: 0
    };
    
    setSelectedConversation(newConversation);
    setDmMessages([]);
    setShowUserSearch(false);
    setDmUserSearchQuery('');
  };
  const handleDMTyping = () => {
    if (selectedConversation) {
      dmTypingIndicator.startTyping();
    }
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
    let filtered = users;
    
    // Apply role filter
    if (userRoleFilter !== 'All') {
      filtered = filtered.filter(user => user.role === userRoleFilter);
    }
    
    // Apply department filter
    if (userDepartmentFilter !== 'All') {
      filtered = filtered.filter(user => user.department === userDepartmentFilter);
    }
    
    // Apply search filter
    if (userSearchTerm) {
      const searchTermLower = userSearchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.reg_id.toLowerCase().includes(searchTermLower) ||
        user.name.toLowerCase().includes(searchTermLower) ||
        user.email.toLowerCase().includes(searchTermLower) ||
        user.role.toLowerCase().includes(searchTermLower) ||
        user.department.toLowerCase().includes(searchTermLower)
      );
    }
    
    setFilteredUsers(filtered);
  }, [userSearchTerm, userRoleFilter, userDepartmentFilter, users]);
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
        await userApi.update(selectedUser.id, userFormData);
        showSuccess('User updated successfully!');
      } else {
        const newUser = await userApi.create(userFormData);
        showSuccess('User created successfully!');
        
        // Send welcome notification to new user
        if (newUser.id) {
          sendNotification(
            newUser.id,
            'Welcome to EduCom',
            `Your account has been created. Your role is ${userFormData.role}.`,
            'info',
            currentUser?.id
          );
        }
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
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department,
      semester: (user.semester && String(user.semester)) || '1',
      program_year: (user.program_year && String(user.program_year)) || '1',
      section: user.section || ''
    });
    setIsUserModalOpen(true);
  };
  const handleCloseUserModal = () => {
    setSelectedUser(null);
    setUserFormData({
      reg_id: '',
      name: '',
      email: '',
      password: '',
      role: 'Student',
      department: 'CS',
      semester: '1',
      program_year: '1',
      section: ''
    });
    setIsUserModalOpen(false);
  };
  // Course Management functions
  useEffect(() => {
    let filtered = courses;
    
    // Apply department filter
    if (courseDepartmentFilter !== 'All') {
      filtered = filtered.filter(course => course.department === courseDepartmentFilter);
    }
    
    // Apply semester filter
    if (courseSemesterFilter !== 'All') {
      filtered = filtered.filter(course => course.semester === courseSemesterFilter);
    }
    
    // Apply search filter
    if (courseSearchTerm) {
      const searchTermLower = courseSearchTerm.toLowerCase();
      filtered = filtered.filter(course => 
        (course.code || '').toLowerCase().includes(searchTermLower) ||
        (course.name || '').toLowerCase().includes(searchTermLower) ||
        (course.department || '').toLowerCase().includes(searchTermLower) ||
        (course.semester || '').toLowerCase().includes(searchTermLower)
      );
    }
    
    setFilteredCourses(filtered);
  }, [courseSearchTerm, courseDepartmentFilter, courseSemesterFilter, courses]);
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
      setFilteredCommunities(data.communities || data || []);
      setCommunitiesLoading(false);
    } catch (err) {
      setError(err.message);
      setCommunitiesLoading(false);
      setCommunities([]);
      setFilteredCommunities([]);
    }
  };
  const fetchConversations = async () => {
    try {
      const response = await directMessageApi.getConversations(userId);
      setConversations(response || []);
    } catch (err) {
      setConversations([]);
    }
  };
  const fetchAvailableUsers = async () => {
    try {
      const response = await directMessageApi.getUsers(userId);
      setAvailableUsers(response || []);
    } catch (err) {
      setAvailableUsers([]);
    }
  };
  const loadDirectMessages = async (otherUserId) => {
    try {
      const response = await directMessageApi.getMessages(userId, otherUserId);
      setDmMessages(response || []);
      scrollToBottom();
    } catch (err) {
      setDmMessages([]);
    }
  };
  // Community filtering
  useEffect(() => {
    let filtered = communities;
    
    // Apply status filter
    if (communityStatusFilter !== 'All') {
      filtered = filtered.filter(community => community.status === communityStatusFilter);
    }
    
    // Apply search filter
    if (communitySearchTerm) {
      const searchLower = communitySearchTerm.toLowerCase();
      filtered = filtered.filter(community =>
        (community.name || '').toLowerCase().includes(searchLower) ||
        (community.code || '').toLowerCase().includes(searchLower) ||
        (community.department || '').toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredCommunities(filtered);
  }, [communityStatusFilter, communitySearchTerm, communities]);
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
      await communityApi.update(selectedCommunity.id, communityFormData);
      await fetchCommunities();
      handleCloseCommunityModal();
      showSuccess('Community updated successfully!');
    } catch (err) {
      showError(err.message || 'Failed to update community');
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
      if (!messageFormData.message.trim()) {
        showWarning('Please enter a message');
        return;
      }
      
      // Send message via Socket.IO with notificationOnly flag
      socketService.sendMessage({
        communityId: selectedCommunityForMessage.id,
        message: messageFormData.message,
        senderId: currentUser.id,
        senderName: currentUser.name || 'Admin',
        isAnonymous: false,
        notificationOnly: true
      });
      
      
      showSuccess(`Message sent to ${selectedCommunityForMessage.name} successfully!`);
      handleCloseMessageModal();
    } catch (err) {
      showError(err.message || 'Failed to send message');
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
        await courseApi.update(selectedCourse.id, courseFormData);
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
      code: course.code || '',
      name: course.name || '',
      department: course.department || 'CS',
      semester: course.semester || '',
      teacher_id: course.teacher_id || ''
    });
    setIsCourseModalOpen(true);
  };
  const handleCloseCourseModal = () => {
    setSelectedCourse(null);
    setCourseFormData({
      code: '',
      name: '',
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
      const enrolledStudents = await courseApi.getEnrolledStudents(course.id);
      const enrolledIds = enrolledStudents.map(s => s.id);
      
      // Filter out already enrolled students
      const availableStudents = allStudents.filter(s => !enrolledIds.includes(s.id));
      
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
      selectedStudents.includes(student.id) && 
      student.department !== courseDepartment
    );
    if (invalidStudents.length > 0) {
      const invalidNames = invalidStudents.map(s => s.name).join(', ');
      showError(`Cannot assign ${courseDepartment} course to students from different departments:\n${invalidNames}\n\nPlease select only ${courseDepartment} students.`);
      return;
    }
    try {
      
      // Call API to assign course to students
      const response = await courseApi.assignToStudents(selectedCourseForAssign.id, selectedStudents);
      
      const { newEnrollments, totalAttempted } = response;
      
      if (newEnrollments > 0) {
        showSuccess(`Successfully assigned course to ${newEnrollments} student(s)!`);
        
        // Send notifications to enrolled students
        selectedStudents.forEach(studentId => {
          sendNotification(
            studentId,
            'New Course Enrollment',
            `You have been enrolled in ${selectedCourseForAssign.name} (${selectedCourseForAssign.code})`,
            'course_update',
            currentUser?.id
          );
        });
      } else if (totalAttempted > 0 && newEnrollments === 0) {
        showWarning('All selected students were already enrolled in this course.');
      }
      
      // Remove assigned students from the list
      setStudents(prev => prev.filter(student => !selectedStudents.includes(student.id)));
      setSelectedStudents([]);
      handleCloseAssignModal();
      
    } catch (err) {
      setError(err.message);
      showError('Failed to assign course: ' + err.message);
    }
  };
  const handleCloseAssignModal = () => {
    setSelectedCourseForAssign(null);
    setSelectedStudents([]);
    setStudentSearchTerm('');
    setAssignDepartmentFilter('All');
    setAssignYearFilter('All');
    setAssignSectionFilter('All');
    setIsAssignModalOpen(false);
  };
  const handleRemoveCourse = async (course) => {
    setSelectedCourseForRemove(course);
    
    try {
      // Fetch enrolled students for this course
      const enrolled = await courseApi.getEnrolledStudents(course.id);
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
      
      const response = await courseApi.removeStudents(selectedCourseForRemove.id, selectedEnrolledStudents);
      
      const { removedCount, totalAttempted } = response;
      
      if (removedCount > 0) {
        showSuccess(`Successfully removed ${removedCount} student(s) from the course!`);
        
        // Send notifications to removed students
        selectedEnrolledStudents.forEach(studentId => {
          sendNotification(
            studentId,
            'Course Removal',
            `You have been removed from ${selectedCourseForRemove.name} (${selectedCourseForRemove.code})`,
            'course_update',
            currentUser?.id
          );
        });
      } else {
        showWarning('No students were removed.');
      }
      
      // Remove students from the enrolled list
      setEnrolledStudents(prev => prev.filter(student => !selectedEnrolledStudents.includes(student.id)));
      setSelectedEnrolledStudents([]);
      handleCloseRemoveModal();
      
    } catch (err) {
      showError(err.message || 'Failed to remove students');
    }
  };
  const handleCloseRemoveModal = () => {
    setSelectedCourseForRemove(null);
    setSelectedEnrolledStudents([]);
    setEnrolledSearchTerm('');
    setRemoveDepartmentFilter('All');
    setRemoveYearFilter('All');
    setRemoveSectionFilter('All');
    setIsRemoveModalOpen(false);
  };
  const filteredStudents = students.filter(student => {
    // Filter by department
    if (assignDepartmentFilter !== 'All' && student.department !== assignDepartmentFilter) {
      return false;
    }
    // Filter by year/semester
    if (assignYearFilter !== 'All' && student.semester !== parseInt(assignYearFilter)) {
      return false;
    }
    // Filter by section
    if (assignSectionFilter !== 'All' && student.section !== assignSectionFilter) {
      return false;
    }
    // Filter by course department
    if (selectedCourseForAssign && student.department !== selectedCourseForAssign.department) {
      return false;
    }
    // Then apply search filter
    if (!studentSearchTerm) return true;
    const searchLower = studentSearchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.reg_id.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    );
  });
  const filteredEnrolledStudents = enrolledStudents.filter(student => {
    // Filter by department
    if (removeDepartmentFilter !== 'All' && student.department !== removeDepartmentFilter) {
      return false;
    }
    // Filter by year/semester
    if (removeYearFilter !== 'All' && student.semester !== parseInt(removeYearFilter)) {
      return false;
    }
    // Filter by section
    if (removeSectionFilter !== 'All' && student.section !== removeSectionFilter) {
      return false;
    }
    // Then apply search filter
    if (!enrolledSearchTerm) return true;
    const searchLower = enrolledSearchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.reg_id.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    );
  });
  const menuItems = [
    { id: 'overview', name: 'Overview', icon: faTachometerAlt },
    { id: 'users', name: 'User Management', icon: faUsers },
    { id: 'courses', name: 'Course Management', icon: faBook },
    { id: 'messages', name: 'Messages', icon: faComments },
  ];
  return (
    <DashboardLayout
      user={adminProfile}
      role="Administrator"
      menuItems={menuItems}
      activeSection={activeSection}
      onMenuClick={setActiveSection}
      onLogout={handleLogout}
    >
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
                    color: '#452829',
                    subtitle: `${stats?.usersByRole?.Student || 0} Students, ${stats?.usersByRole?.Teacher || 0} Teachers`
                  },
                  {
                    title: 'Total Courses',
                    value: stats?.totalCourses || 0,
                    icon: faBook,
                    color: '#57595B',
                    subtitle: `${stats?.totalEnrollments || 0} Total Enrollments`
                  },
                  {
                    title: 'Communities',
                    value: stats?.totalCommunities || 0,
                    icon: faComments,
                    color: '#452829',
                    subtitle: `${stats?.totalMessages || 0} Messages`
                  },
                  {
                    title: 'Marketplace',
                    value: stats?.totalMarketplaceItems || 0,
                    icon: faStore,
                    color: '#57595B',
                    subtitle: `${stats?.pendingMarketplaceItems || 0} Pending Approval`
                  }
                ].map((card, index) => (
                  <StatCard key={index} {...card} />
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
                        <div key={user.id} className="activity-item">
                          <div className="activity-avatar">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="activity-content">
                            <h4>{user.name}</h4>
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
                        <div key={course.id} className="activity-item">
                          <div className="activity-avatar course-avatar">
                            <FontAwesomeIcon icon={faBook} />
                          </div>
                          <div className="activity-content">
                            <h4>{course.name}</h4>
                            <p>{course.code} • {course.teacher_name || 'No teacher assigned'}</p>
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
          
          <div className="filters-container">
            <div className="filter-group">
              <label className="filter-label">Role</label>
              <select 
                className="input filter-select-min"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="All">All Roles</option>
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Admin">Admin</option>
                <option value="HOD">HOD</option>
                <option value="PM">PM</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Department</label>
              <select 
                className="input filter-select-min"
                value={userDepartmentFilter}
                onChange={(e) => setUserDepartmentFilter(e.target.value)}
              >
                <option value="All">All Departments</option>
                <option value="CS">CS</option>
                <option value="BBA">BBA</option>
                <option value="IT">IT</option>
              </select>
            </div>
            
            {(userRoleFilter !== 'All' || userDepartmentFilter !== 'All' || userSearchTerm) && (
              <div className="filter-actions">
                <button 
                  className="button secondary filter-button-nowrap"
                  onClick={() => {
                    setUserRoleFilter('All');
                    setUserDepartmentFilter('All');
                    setUserSearchTerm('');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
          {usersLoading ? (
            <div className="loading-error">Loading...</div>
          ) : (
            <div className="table-container">
              {/* Desktop Table View */}
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
                      <td colSpan="6" className="text-center p-4">
                        {userSearchTerm ? 'No users found matching your search' : 'No users available'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td data-label="Registration ID">{user.reg_id}</td>
                        <td data-label="Full Name">{user.name}</td>
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
                            onClick={() => handleUserDelete(user.id)}
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

              {/* Mobile Card View */}
              <div className="mobile-cards-view">
                {filteredUsers.length === 0 ? (
                  <div className="empty-state">
                    <p>{userSearchTerm ? 'No users found matching your search' : 'No users available'}</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="user-card">
                      <div className="user-card-header">
                        <div className="user-card-info">
                          <div className="user-card-label">Registration ID</div>
                          <div className="user-card-value large">{user.reg_id}</div>
                        </div>
                      </div>
                      <div className="user-card-body">
                        <div className="user-card-row">
                          <div className="user-card-label">Full Name</div>
                          <div className="user-card-value">{user.name}</div>
                        </div>
                        <div className="user-card-row">
                          <div className="user-card-label">Email</div>
                          <div className="user-card-value">{user.email}</div>
                        </div>
                        <div className="user-card-row">
                          <div className="user-card-label">Role</div>
                          <div className="user-card-value">{user.role}</div>
                        </div>
                        <div className="user-card-row">
                          <div className="user-card-label">Department</div>
                          <div className="user-card-value">{user.department}</div>
                        </div>
                      </div>
                      <div className="user-card-actions">
                        <button 
                          className="button edit"
                          onClick={() => handleUserEdit(user)}
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                          Edit
                        </button>
                        <button 
                          className="button delete"
                          onClick={() => handleUserDelete(user.id)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {isUserModalOpen && (
            <div className="modal">
              <div className="modal-content modal-content-large">
                <h2>{selectedUser ? 'Edit User' : 'Add New User'}</h2>
                <form onSubmit={handleUserSubmit}>
                  <div className="grid-2col">
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
                        name="name"
                        value={userFormData.name}
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
                    {userFormData.role === 'Student' && (
                      <div className="form-group">
                        <label>Semester:</label>
                        <select
                          name="semester"
                          value={userFormData.semester}
                          onChange={handleUserInputChange}
                          required
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                          <option value="6">6</option>
                          <option value="7">7</option>
                          <option value="8">8</option>
                        </select>
                      </div>
                    )}
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
                    {userFormData.role === 'Student' && (
                      <div className="form-group">
                        <label>Section:</label>
                        <input
                          type="text"
                          name="section"
                          value={userFormData.section}
                          onChange={handleUserInputChange}
                          placeholder="Enter section (e.g., A, B, C)"
                          maxLength="10"
                          required
                        />
                      </div>
                    )}
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
                
                <div className="filters-container">
                  <div className="filter-group">
                    <label className="filter-label">Department</label>
                    <select 
                      className="input filter-select-min"
                      value={courseDepartmentFilter}
                      onChange={(e) => setCourseDepartmentFilter(e.target.value)}
                    >
                      <option value="All">All Departments</option>
                      <option value="CS">CS</option>
                      <option value="BBA">BBA</option>
                      <option value="IT">IT</option>
                    </select>
                    </div>
                    
                    <div className="filter-group">
                      <label className="filter-label">Semester</label>
                      <select 
                        className="input filter-select-min"
                        value={courseSemesterFilter}
                        onChange={(e) => setCourseSemesterFilter(e.target.value)}
                      >
                        <option value="All">All Semesters</option>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                        <option value="3">Semester 3</option>
                        <option value="4">Semester 4</option>
                        <option value="5">Semester 5</option>
                        <option value="6">Semester 6</option>
                        <option value="7">Semester 7</option>
                        <option value="8">Semester 8</option>
                      </select>
                    </div>
                    
                    {(courseDepartmentFilter !== 'All' || courseSemesterFilter !== 'All' || courseSearchTerm) && (
                      <div className="filter-actions">
                        <button 
                          className="button secondary filter-button-nowrap"
                          onClick={() => {
                            setCourseDepartmentFilter('All');
                            setCourseSemesterFilter('All');
                            setCourseSearchTerm('');
                          }}
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>
                
                {coursesLoading ? (
                  <div className="loading-error">Loading...</div>
                ) : (
                  <div className="table-container">
                    {/* Desktop Table View */}
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
                            <td colSpan="6" className="text-center p-4">
                              {courseSearchTerm ? 'No courses found matching your search' : 'No courses available'}
                            </td>
                          </tr>
                        ) : (
                          filteredCourses.map((course) => (
                            <tr key={course.id}>
                              <td data-label="Course Code">{course.code}</td>
                              <td data-label="Course Name">{course.name}</td>
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
                                  onClick={() => handleCourseDelete(course.id)}
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

                    {/* Mobile Card View */}
                    <div className="mobile-cards-view">
                      {filteredCourses.length === 0 ? (
                        <div className="empty-state">
                          <p>{courseSearchTerm ? 'No courses found matching your search' : 'No courses available'}</p>
                        </div>
                      ) : (
                        filteredCourses.map((course) => (
                          <div key={course.id} className="user-card">
                            <div className="user-card-header">
                              <div className="user-card-info">
                                <div className="user-card-label">Course Code</div>
                                <div className="user-card-value large">{course.code}</div>
                              </div>
                            </div>
                            <div className="user-card-body">
                              <div className="user-card-row">
                                <div className="user-card-label">Course Name</div>
                                <div className="user-card-value">{course.name}</div>
                              </div>
                              <div className="user-card-row">
                                <div className="user-card-label">Department</div>
                                <div className="user-card-value">{course.department}</div>
                              </div>
                              <div className="user-card-row">
                                <div className="user-card-label">Semester</div>
                                <div className="user-card-value">{course.semester}</div>
                              </div>
                              <div className="user-card-row">
                                <div className="user-card-label">Teacher</div>
                                <div className="user-card-value">{course.teacher_name || 'No teacher assigned'}</div>
                              </div>
                            </div>
                            <div className="user-card-actions">
                              <button 
                                className="button edit"
                                onClick={() => handleCourseEdit(course)}
                              >
                                <FontAwesomeIcon icon={faPenToSquare} />
                                Edit
                              </button>
                              <button 
                                className="button delete"
                                onClick={() => handleCourseDelete(course.id)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                {isCourseModalOpen && (
                  <div className="modal">
                    <div className="modal-content modal-content-medium">
                      <h2>{selectedCourse ? 'Edit Course' : 'Add New Course'}</h2>
                      <form onSubmit={handleCourseSubmit}>
                        <div className="grid-2col">
                          <div className="form-group">
                            <label>Course Code:</label>
                            <input
                              type="text"
                              name="code"
                              value={courseFormData.code}
                              onChange={handleCourseInputChange}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Course Name:</label>
                            <input
                              type="text"
                              name="name"
                              value={courseFormData.name}
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
                              <option value="1">Semester 1</option>
                              <option value="2">Semester 2</option>
                              <option value="3">Semester 3</option>
                              <option value="4">Semester 4</option>
                              <option value="5">Semester 5</option>
                              <option value="6">Semester 6</option>
                              <option value="7">Semester 7</option>
                              <option value="8">Semester 8</option>
                            </select>
                          </div>
                          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Teacher:</label>
                            <select
                              name="teacher_id"
                              value={courseFormData.teacher_id}
                              onChange={handleCourseInputChange}
                              required
                            >
                              <option value="">Select Teacher</option>
                              {teachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>
                                  {teacher.name} {teacher.role ? `(${teacher.role})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
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
                <div className="filters-container">
                  <div className="filter-group">
                    <label className="filter-label">Search</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Search communities by name, code..."
                      value={communitySearchTerm}
                      onChange={(e) => setCommunitySearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="filter-group">
                    <label className="filter-label">Status</label>
                    <select 
                      className="input filter-select-min"
                    >
                      <option value="All">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  
                  {(communityStatusFilter !== 'All' || communitySearchTerm) && (
                    <div className="filter-actions">
                      <button 
                        className="button secondary filter-button-nowrap"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>
                <div className="table-container">
                  {/* Desktop Table View */}
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
                          <td colSpan="6" className="text-center p-4">Loading communities...</td>
                        </tr>
                      ) : filteredCommunities.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center p-4">
                            {communitySearchTerm || communityStatusFilter !== 'All' 
                              ? 'No communities found matching your filters' 
                              : 'No communities available'}
                          </td>
                        </tr>
                      ) : (
                        filteredCommunities.map((community) => (
                          <tr key={community.id}>
                            <td data-label="Community Name">{community.name || 'N/A'}</td>
                            <td data-label="Course Code">{community.course_code || 'N/A'}</td>
                            <td data-label="Course Name">{community.course_name || 'N/A'}</td>
                            <td data-label="Department">{community.department || 'N/A'}</td>
                            <td data-label="Status">
                              <span className={community.status === 'active' ? 'status-active' : 'status-inactive'}>
                                {community.status}
                              </span>
                            </td>
                            <td data-label="Actions">
                              <button 
                                className="button edit icon-button small"
                                onClick={() => handleCommunityEdit(community)}
                                data-tooltip="Edit Community"
                              >
                                <FontAwesomeIcon icon={faPenToSquare} />
                              </button>
                              <button 
                                className="button primary icon-button small ml-2"
                                onClick={() => {
                                  setSelectedCommunityForMessage(community);
                                  setIsMessageModalOpen(true);
                                  setMessageFormData({ subject: '', message: '' });
                                }}
                                data-tooltip="Send Message"
                              >
                                <FontAwesomeIcon icon={faPaperPlane} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Mobile Card View */}
                  <div className="mobile-cards-view">
                    {communitiesLoading ? (
                      <div className="empty-state">
                        <p>Loading communities...</p>
                      </div>
                    ) : filteredCommunities.length === 0 ? (
                      <div className="empty-state">
                        <p>{communitySearchTerm || communityStatusFilter !== 'All' 
                          ? 'No communities found matching your filters' 
                          : 'No communities available'}</p>
                      </div>
                    ) : (
                      filteredCommunities.map((community) => (
                        <div key={community.id} className="user-card">
                          <div className="user-card-header">
                            <div className="user-card-info">
                              <div className="user-card-label">Community Name</div>
                              <div className="user-card-value large">{community.name || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="user-card-body">
                            <div className="user-card-row">
                              <div className="user-card-label">Course Code</div>
                              <div className="user-card-value">{community.course_code || 'N/A'}</div>
                            </div>
                            <div className="user-card-row">
                              <div className="user-card-label">Course Name</div>
                              <div className="user-card-value">{community.course_name || 'N/A'}</div>
                            </div>
                            <div className="user-card-row">
                              <div className="user-card-label">Department</div>
                              <div className="user-card-value">{community.department || 'N/A'}</div>
                            </div>
                            <div className="user-card-row">
                              <div className="user-card-label">Status</div>
                              <div className="user-card-value">
                                <span className={community.status === 'active' ? 'status-active' : 'status-inactive'}>
                                  {community.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="user-card-actions">
                            <button 
                              className="button edit"
                              onClick={() => handleCommunityEdit(community)}
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                              Edit
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
                    <div className="modal-content modal-content-narrow">
                      <h2>Send Message to Community</h2>
                      <p className="modal-description">
                        <strong>{selectedCommunityForMessage?.name}</strong>
                        <br />
                        <span className="text-sm">
                          {selectedCommunityForMessage?.code} - {selectedCommunityForMessage?.name}
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
                          />
                        </div>
                        <div className="modal-actions">
                          <button 
                            type="submit" 
                            className="button primary"
                          >
                            <FontAwesomeIcon icon={faPaperPlane} className="mr-1" />
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
                          <td colSpan="6" className="text-center p-4">Loading courses...</td>
                        </tr>
                      ) : courses.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center p-4">No courses available</td>
                        </tr>
                      ) : (
                        courses.map((course) => (
                          <tr key={course.id}>
                            <td data-label="Course Code">{course.code}</td>
                            <td data-label="Course Name">{course.name}</td>
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
                    <div className="modal-content" style={{ maxWidth: '1000px' }}>
                      <h2>Assign Course to Students</h2>
                      <p className="modal-description">
                        <strong>{selectedCourseForAssign?.name}</strong> ({selectedCourseForAssign?.code})
                        <br />
                        <span className="text-sm text-primary-color font-semibold">
                          Department: {selectedCourseForAssign?.department}
                        </span>
                      </p>
                      
                      <div className="search-container mb-2">
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Search students by name, ID, email..."
                          value={studentSearchTerm}
                          onChange={(e) => setStudentSearchTerm(e.target.value)}
                        />
                      </div>
                      
                      <div className="grid-3col">
                        <div className="filter-group">
                          <label className="filter-label">Department</label>
                          <select 
                            className="input filter-select-full"
                          >
                            <option value="All">All</option>
                            <option value="CS">CS</option>
                            <option value="BBA">BBA</option>
                            <option value="IT">IT</option>
                          </select>
                        </div>
                        
                        <div className="filter-group">
                          <label className="filter-label">Semester</label>
                          <select 
                            className="input filter-select-full"
                          >
                            <option value="All">All</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                          </select>
                        </div>
                        
                        <div className="filter-group">
                          <label className="filter-label">Section</label>
                          <select 
                            className="input filter-select-full"
                          >
                            <option value="All">All</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                      </div>
                      
                      {(assignDepartmentFilter !== 'All' || assignYearFilter !== 'All' || assignSectionFilter !== 'All' || studentSearchTerm) && (
                        <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
                          <button 
                            className="button secondary"
                            onClick={() => {
                              setAssignDepartmentFilter('All');
                              setAssignYearFilter('All');
                              setAssignSectionFilter('All');
                              setStudentSearchTerm('');
                            }}
                            style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
                          >
                            Clear Filters
                          </button>
                        </div>
                      )}
                      <div className="max-h-400 overflow-y-auto border border-radius p-3">
                        {filteredStudents.length === 0 ? (
                          <p className="text-center text-secondary">
                            {studentSearchTerm 
                              ? `No ${selectedCourseForAssign?.department} students found matching your search` 
                              : `No ${selectedCourseForAssign?.department} students available`}
                          </p>
                        ) : (
                          filteredStudents.map((student) => (
                            <div 
                              key={student.id} 
                              className="student-list-item"
                              style={{ background: selectedStudents.includes(student.id) ? 'var(--bg-secondary)' : 'transparent' }}
                              onClick={() => handleStudentToggle(student.id)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => handleStudentToggle(student.id)}
                                className="student-checkbox"
                              />
                              <div className="student-details">
                                <div className="student-name">
                                  {student.name}
                                </div>
                                <div className="student-meta">
                                  {student.reg_id} • {student.department}{student.semester ? ` • Semester ${student.semester}` : ''} • {student.email}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="selection-summary mt-2">
                        Selected: <strong>{selectedStudents.length}</strong> student(s)
                      </div>
                      <div className="modal-actions mt-3">
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
                          <td colSpan="6" className="text-center p-4">Loading courses...</td>
                        </tr>
                      ) : courses.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center p-4">No courses available</td>
                        </tr>
                      ) : (
                        courses.map((course) => (
                          <tr key={course.id}>
                            <td data-label="Course Code">{course.code}</td>
                            <td data-label="Course Name">{course.name}</td>
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
                    <div className="modal-content" style={{ maxWidth: '1000px' }}>
                      <h2>Remove Students from Course</h2>
                      <p className="modal-description">
                        <strong>{selectedCourseForRemove?.name}</strong> ({selectedCourseForRemove?.code})
                        <br />
                        <span className="text-sm text-error font-semibold">
                          Select students to remove from this course
                        </span>
                      </p>
                      
                      <div className="search-container mb-2">
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Search enrolled students..."
                          value={enrolledSearchTerm}
                          onChange={(e) => setEnrolledSearchTerm(e.target.value)}
                        />
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div className="filter-group">
                          <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>Department</label>
                          <select 
                            className="input"
                            value={removeDepartmentFilter}
                            onChange={(e) => setRemoveDepartmentFilter(e.target.value)}
                            style={{ width: '100%' }}
                          >
                            <option value="All">All</option>
                            <option value="CS">CS</option>
                            <option value="BBA">BBA</option>
                            <option value="IT">IT</option>
                          </select>
                        </div>
                        
                        <div className="filter-group">
                          <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>Semester</label>
                          <select 
                            className="input"
                            value={removeYearFilter}
                            onChange={(e) => setRemoveYearFilter(e.target.value)}
                            style={{ width: '100%' }}
                          >
                            <option value="All">All</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                          </select>
                        </div>
                        
                        <div className="filter-group">
                          <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>Section</label>
                          <select 
                            className="input"
                            value={removeSectionFilter}
                            onChange={(e) => setRemoveSectionFilter(e.target.value)}
                            style={{ width: '100%' }}
                          >
                            <option value="All">All</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                      </div>
                      
                      {(removeDepartmentFilter !== 'All' || removeYearFilter !== 'All' || removeSectionFilter !== 'All' || enrolledSearchTerm) && (
                        <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
                          <button 
                            className="button secondary"
                            onClick={() => {
                              setRemoveDepartmentFilter('All');
                              setRemoveYearFilter('All');
                              setRemoveSectionFilter('All');
                              setEnrolledSearchTerm('');
                            }}
                            style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
                          >
                            Clear Filters
                          </button>
                        </div>
                      )}
                      <div className="max-h-400 overflow-y-auto border border-radius p-3">
                        {filteredEnrolledStudents.length === 0 ? (
                          <p className="text-center text-secondary">
                            {enrolledSearchTerm 
                              ? 'No enrolled students found matching your search' 
                              : 'No students are currently enrolled in this course'}
                          </p>
                        ) : (
                          filteredEnrolledStudents.map((student) => (
                            <div 
                              key={student.id} 
                              className="student-list-item"
                              style={{ background: selectedEnrolledStudents.includes(student.id) ? '#fee2e2' : 'transparent' }}
                              onClick={() => handleEnrolledStudentToggle(student.id)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedEnrolledStudents.includes(student.id)}
                                onChange={() => handleEnrolledStudentToggle(student.id)}
                                className="student-checkbox"
                              />
                              <div className="student-details">
                                <div className="student-name">
                                  {student.name}
                                </div>
                                <div className="student-meta">
                                  {student.reg_id} • {student.department}{student.semester ? ` • Semester ${student.semester}` : ''} • {student.email}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="selection-summary-remove mt-2">
                        Selected: <strong>{selectedEnrolledStudents.length}</strong> student(s) will be removed
                      </div>
                      <div className="modal-actions mt-3">
                        <button 
                          type="button" 
                          className="button delete"
                          onClick={handleRemoveSubmit}
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
      {activeSection === 'messages' && (
        <MessageLayout
          mode="direct"
          userId={userId}
          messagesEndRef={messagesEndRef}
          conversations={conversations}
          selectedConversation={selectedConversation}
          dmMessages={dmMessages}
          dmTypingUsers={dmTypingUsers}
          dmMessage={dmMessage}
          setDmMessage={setDmMessage}
          userSearchQuery={dmUserSearchQuery}
          setUserSearchQuery={setDmUserSearchQuery}
          showUserSearch={showUserSearch}
          setShowUserSearch={setShowUserSearch}
          availableUsers={availableUsers}
          onSelectConversation={handleSelectConversation}
          onStartNewConversation={handleStartNewConversation}
          onSendDirectMessage={handleSendDirectMessage}
          onDMTyping={handleDMTyping}
          loading={false}
        />
      )}
    </DashboardLayout>
  );
};
export default AdminDashboard;
