import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook,
  faComments,
  faClipboardList,
  faBell,
  faChalkboardTeacher,
  faPlus,
  faUsers,
  faUserGraduate,
  faCalendar,
  faPaperPlane,
  faSearch,
  faEllipsisV,
  faKey,
  faCopy
} from '@fortawesome/free-solid-svg-icons';
import { courseApi, communityApi, directMessageApi, notificationApi } from '../api';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import MessageLayout from '../components/MessageLayout';
import { useCommunityMessages, useTypingIndicator, useNotifications, useDirectMessages, useDMTypingIndicator } from '../hooks/useSocket';
import socketService from '../services/socket';
import { showAlert } from '../utils/alert';
const TeacherDashboard = () => {
  const navigate = useNavigate();
  const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  const userId = user?.id || user?.userId;
  
  const [activeSection, setActiveSection] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    activeAssignments: 0,
    pendingGrading: 0
  });
  // Chat states
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const [chats, setChats] = useState([]);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const addedMessageIds = useRef(new Set());
  // Direct message states
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [dmTypingUsers, setDmTypingUsers] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // Course request modal states
  const [isCourseRequestModalOpen, setIsCourseRequestModalOpen] = useState(false);
  const [courseRequestData, setCourseRequestData] = useState({
    code: '',
    name: '',
    department: 'CS',
    semester: ''
  });
  
  // Real-time notifications
  useNotifications((notification) => {
    showAlert(notification.title, notification.message, notification.type || 'info');
    // Add new notification to the list
    setNotifications(prev => [notification, ...prev]);
    // Refresh stats if needed
    if (notification.type === 'course_update') {
      fetchTeacherStats();
    }
  });

  // Join all communities on page load and listen for new messages
  useEffect(() => {
    if (!userId) return;
    
    const socket = socketService.connect(userId);
    
    // Fetch and join all communities immediately
    const joinAllCommunities = async () => {
      try {
        const communities = await communityApi.getTeacherCommunities(userId);
        communities.forEach(community => {
          socket.emit('join-community', community.id);
        });
      } catch (err) {
        console.error('Failed to join communities:', err);
      }
    };
    
    joinAllCommunities();
    
    // Listen for new messages and refresh community list
    const handleGlobalCommunityMessage = (newMessage) => {
      if (newMessage.community_id) {
        // Refresh communities to update unread counts
        communityApi.getTeacherCommunities(userId).then(communities => {
          const formattedChats = communities.map(community => ({
            id: community.id,
            name: community.course_name || community.name,
            courseId: community.course_id,
            courseName: community.course_name,
            courseCode: community.course_code,
            lastMessage: 'Start chatting...',
            time: new Date(community.created_at).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' }),
            unread: community.unread_count || 0
          }));
          setChats(formattedChats);
        }).catch(() => {});
      }
    };

    socket.on('new-message', handleGlobalCommunityMessage);

    return () => {
      socket.off('new-message', handleGlobalCommunityMessage);
    };
  }, [userId]);

  // Real-time direct messages
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
    user?.name || 'Teacher'
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
  // Real-time chat for selected community
  const { sendMessage: sendSocketMessage } = useCommunityMessages(
    selectedChat?.id,
    (newMessage) => {
      // Only add message if it belongs to the currently selected community
      if (newMessage.community_id === selectedChat?.id) {
        // Check if we've already processed this message
        if (addedMessageIds.current.has(newMessage.id)) {
          return;
        }
        
        addedMessageIds.current.add(newMessage.id);
        
        setMessages(prev => {
          // Double-check it's not already in state
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          
          return [...prev, {
            id: newMessage.id,
            text: newMessage.content,
            sender: newMessage.sender_name,
            senderId: newMessage.sender_id,
            time: new Date(newMessage.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
          }];
        });
        scrollToBottom();
      }
    },
    (data) => {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
    }
  );
  // Typing indicator
  const { onTyping, startTyping, stopTyping } = useTypingIndicator(
    selectedChat?.id,
    user?.name || 'Teacher'
  );
  useEffect(() => {
    if (selectedChat?.id) {
      const handleTyping = ({ userName, isTyping }) => {
        if (isTyping) {
          setTypingUsers(prev => [...new Set([...prev, userName])]);
        } else {
          setTypingUsers(prev => prev.filter(u => u !== userName));
        }
      };
      onTyping(handleTyping);
    }
  }, [selectedChat?.id]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  useEffect(() => {
    if (userId) {
      fetchTeacherStats();
      fetchNotifications();
    }
  }, [userId]);
  useEffect(() => {
    if (activeSection === 'courses' && userId) {
      fetchMyCourses();
      fetchTeacherStats();
    } else if (activeSection === 'community' && userId) {
      fetchCommunities();
    } else if (activeSection === 'messages' && userId) {
      fetchConversations();
      fetchAvailableUsers();
    } else if (activeSection === 'notifications' && userId) {
      fetchNotifications();
    }
  }, [activeSection, userId]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const teacherCommunities = await communityApi.getTeacherCommunities(userId);
      
      const formattedChats = teacherCommunities.map(community => ({
        id: community.id,
        name: community.course_name || community.name,
        courseId: community.course_id,
        courseName: community.course_name,
        courseCode: community.course_code,
        lastMessage: 'Start chatting...',
        time: new Date(community.created_at).toLocaleDateString(),
        unread: community.unread_count || 0
      }));
      
      setChats(formattedChats);
    } catch (err) {
      setChats([]);
    } finally {
      setLoading(false);
    }
  };
  const fetchTeacherStats = async () => {
    try {
      const data = await courseApi.getTeacherStats(userId);
      setStats(data);
    } catch (err) {
    }
  };
  
  const handleCourseRequestInputChange = (e) => {
    setCourseRequestData({
      ...courseRequestData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleCourseRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      // Automatically set teacher_id to current user
      const requestData = {
        ...courseRequestData,
        teacher_id: userId
      };
      await courseApi.submitCourseRequest(requestData);
      showAlert('Success', 'Course request submitted successfully! Waiting for admin approval.', 'success');
      setCourseRequestData({
        code: '',
        name: '',
        department: 'CS',
        semester: ''
      });
      setIsCourseRequestModalOpen(false);
    } catch (err) {
      showAlert('Error', err.message || 'Failed to submit course request', 'error');
    }
  };
  
  const handleCloseCourseRequestModal = () => {
    setIsCourseRequestModalOpen(false);
    setCourseRequestData({
      code: '',
      name: '',
      department: 'CS',
      semester: ''
    });
  };
  
  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const data = await courseApi.getTeacherCourses(userId);
      setCourses(data.courses || []);
    } catch (err) {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getAll({ userId });
      setNotifications(response.notifications || []);
    } catch (err) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      showAlert('Error', 'Failed to mark notification as read', 'error');
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await directMessageApi.getConversations(userId);
      setConversations(response || []);
    } catch (err) {
      setConversations([]);
    } finally {
      setLoading(false);
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
  const loadDirectMessages = async (otherUserId, isAnon = false) => {
    try {
      const response = await directMessageApi.getMessages(userId, otherUserId, isAnon);
      setDmMessages(response || []);
      scrollToBottom();
    } catch (err) {
      setDmMessages([]);
    }
  };
  const handleCourseClick = async (course) => {
    setActiveSection('community');
    setLoading(true);
    
    try {
      // Fetch communities and find the one for this course
      const allCommunities = await communityApi.getAll();
      const courseCommunity = allCommunities.communities?.find(c => c.course_id === course.id);
      
      if (courseCommunity) {
        const formattedChat = {
          id: courseCommunity.id,
          name: courseCommunity.name || `${course.name} Community`,
          courseId: course.id,
          courseName: course.name,
          courseCode: course.code,
          lastMessage: 'Start chatting...',
          time: 'Now',
          unread: 0
        };
        
        setChats([formattedChat]);
        await handleChatSelect(formattedChat);
      } else {
        setChats([]);
        setSelectedChat(null);
        showAlert('No Community', `No community found for ${course.name}`, 'warning');
      }
    } catch (err) {
      setChats([]);
      setSelectedChat(null);
    } finally {
      setLoading(false);
    }
  };
  const handleSendMessage = () => {
    if (message.trim() && selectedChat) {
      sendSocketMessage(
        message,
        userId,
        user?.name || 'Teacher',
        false
      );
      setMessage('');
      stopTyping();
    }
  };
  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    setMessages([]);
    addedMessageIds.current.clear();
    
    // Reset unread count for this chat in the UI
    setChats(prev => prev.map(c => 
      c.id === chat.id ? { ...c, unread_count: 0 } : c
    ));
    
    try {
      const messages = await communityApi.getMessages(chat.id, userId);
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.sender_name,
        senderId: msg.sender_id,
        time: new Date(msg.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
      }));
      setMessages(formattedMessages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    if (e.target.value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };
  const handleSendDirectMessage = () => {
    if (message.trim() && selectedConversation) {
      sendDirectMessage(
        selectedConversation.user_id,
        message,
        user?.name || 'Teacher'
      );
      
      setMessage('');
      dmTypingIndicator.stopTyping();
      
      // Refresh conversations to show new message
      setTimeout(() => {
        fetchConversations();
      }, 500);
    }
  };
  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    
    // If conversation is null (back button clicked), just clear messages and return
    if (!conversation) {
      setDmMessages([]);
      return;
    }
    
    setDmMessages([]);
    await loadDirectMessages(conversation.user_id, false);
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
    setUserSearchQuery('');
  };
  const handleDMTyping = () => {
    if (selectedConversation) {
      dmTypingIndicator.startTyping();
    }
  };

  const handleCopyJoinCode = async (joinCode, courseName, e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(joinCode);
      showAlert('Copied!', `Join code ${joinCode} copied to clipboard`, 'success');
    } catch (err) {
      showAlert('Error', 'Failed to copy join code', 'error');
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
  const menuItems = [
    { id: 'courses', name: 'My Courses', icon: faBook },
    { id: 'community', name: 'Community Chat', icon: faUsers },
    { id: 'messages', name: 'Messages', icon: faComments },
    { id: 'notifications', name: 'Notifications', icon: faBell },
  ];
  return (
    <DashboardLayout
      user={user}
      role={user?.role || 'Teacher'}
      menuItems={menuItems}
      activeSection={activeSection}
      onMenuClick={setActiveSection}
      onLogout={handleLogout}
    >
      {activeSection === 'courses' && (
        <div className="container">
          <div className="header-actions mb-3">
            <h2 className="section-title">My Courses</h2>
            <button 
              className="floating-join-btn"
              onClick={() => setIsCourseRequestModalOpen(true)}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
          
          {loading ? (
            <div className="text-center p-4 text-secondary">
              Loading your courses...
            </div>
          ) : courses.length === 0 ? (
            <div className="empty-state text-center p-4 text-secondary">
              <FontAwesomeIcon icon={faBook} className="icon-xl mb-3 opacity-30" />
              <p>No courses assigned yet.</p>
            </div>
          ) : (
            <div className="course-card-grid">
              {courses.map((course) => (
                <div 
                  key={course.id}
                  className="course-card clickable"
                  onClick={() => handleCourseClick(course)}
                >
                  <div className="course-card-header">
                    <span className="course-card-code">{course.code}</span>
                  </div>
                  
                  <h3 className="course-card-title">
                    {course.name}
                  </h3>
                  
                  {course.join_code && (
                    <div className="join-code-section">
                      <div className="join-code-label">
                        <FontAwesomeIcon icon={faKey} />
                        <span>Join Code</span>
                      </div>
                      <div className="join-code-value">
                        <span className="join-code-text">{course.join_code}</span>
                        <button 
                          className="copy-btn"
                          onClick={(e) => handleCopyJoinCode(course.join_code, course.name, e)}
                          title="Copy join code"
                        >
                          <FontAwesomeIcon icon={faCopy} />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="course-card-meta">
                    <div className="course-card-meta-item">
                      <FontAwesomeIcon icon={faUsers} />
                      <span>{course.enrolled_count || 0} students enrolled</span>
                    </div>
                    <div className="course-card-meta-item">
                      <FontAwesomeIcon icon={faBook} />
                      <span>{course.department} - {course.semester}</span>
                    </div>
                    <div className="course-card-meta-item">
                      <FontAwesomeIcon icon={faChalkboardTeacher} />
                      <span>Instructor</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {isCourseRequestModalOpen && (
            <div className="modal">
              <div className="modal-content modal-content-medium">
                <h2>Request New Course</h2>
                <p className="modal-description">Submit a request for a new course. Admin will review and approve.</p>
                <form onSubmit={handleCourseRequestSubmit}>
                  <div className="grid-2col">
                    <div className="form-group">
                      <label>Course Code:</label>
                      <input
                        type="text"
                        name="code"
                        value={courseRequestData.code}
                        onChange={handleCourseRequestInputChange}
                        placeholder="e.g., CS101"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Course Name:</label>
                      <input
                        type="text"
                        name="name"
                        value={courseRequestData.name}
                        onChange={handleCourseRequestInputChange}
                        placeholder="e.g., Introduction to Programming"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Department:</label>
                      <select
                        name="department"
                        value={courseRequestData.department}
                        onChange={handleCourseRequestInputChange}
                        required
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
                        value={courseRequestData.semester}
                        onChange={handleCourseRequestInputChange}
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
                    <div className="form-group form-group-full">
                      <label>Teacher:</label>
                      <input
                        type="text"
                        value={user?.name || 'Current User'}
                        disabled
                        className="input-disabled"
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                      <small style={{ color: '#666', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                        This course will be assigned to you
                      </small>
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button 
                      type="submit" 
                      className="button primary"
                    >
                      Submit Request
                    </button>
                    <button 
                      type="button" 
                      className="button secondary"
                      onClick={handleCloseCourseRequestModal}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
      {activeSection === 'community' && (
        <MessageLayout
          mode="community"
          userId={userId}
          messagesEndRef={messagesEndRef}
          chats={chats}
          selectedChat={selectedChat}
          communityMessages={messages}
          communityTypingUsers={typingUsers}
          communityMessage={message}
          setCommunityMessage={setMessage}
          onSelectChat={handleChatSelect}
          onSendCommunityMessage={handleSendMessage}
          onCommunityTyping={startTyping}
          loading={loading}
        />
      )}
      {activeSection === 'assignments' && (
        <div className="container">
          <div className="assignment-header">
            <div>
              <h1 className="mb-1">Assignments</h1>
              <p className="text-secondary m-0">
                Create and manage course assignments
              </p>
            </div>
            <button className="button primary">
              <FontAwesomeIcon icon={faPlus} />
              New Assignment
            </button>
          </div>
          <div className="empty-state">
            <FontAwesomeIcon icon={faClipboardList} className="icon-lg mb-2 opacity-30" />
            <p>Your assignments will appear here.</p>
          </div>
        </div>
      )}
      {activeSection === 'messages' && (
        <MessageLayout
          mode="direct"
          userId={userId}
          userRole={user?.role}
          messagesEndRef={messagesEndRef}
          conversations={conversations}
          selectedConversation={selectedConversation}
          dmMessages={dmMessages}
          dmTypingUsers={dmTypingUsers}
          dmMessage={message}
          setDmMessage={setMessage}
          userSearchQuery={userSearchQuery}
          setUserSearchQuery={setUserSearchQuery}
          showUserSearch={showUserSearch}
          setShowUserSearch={setShowUserSearch}
          availableUsers={availableUsers}
          onSelectConversation={handleSelectConversation}
          onStartNewConversation={handleStartNewConversation}
          onSendDirectMessage={handleSendDirectMessage}
          onDMTyping={handleDMTyping}
          loading={loading}
        />
      )}
      {activeSection === 'notifications' && (
        <div className="container">
          <div className="notifications-header">
            <h1 className="mb-1">Notifications</h1>
            <p className="text-secondary m-0">Stay updated with your course activities</p>
          </div>
          
          {loading ? (
            <div className="text-center p-4 text-secondary">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state text-center p-4 text-secondary">
              <FontAwesomeIcon icon={faBell} className="icon-xl mb-3 opacity-30" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    <FontAwesomeIcon icon={faBell} />
                  </div>
                  <div className="notification-content">
                    <h4 className="notification-title">{notification.title}</h4>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {new Date(notification.created_at).toLocaleString('en-PK', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'Asia/Karachi'
                      })}
                    </span>
                  </div>
                  {!notification.is_read && (
                    <div className="notification-badge">New</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};
export default TeacherDashboard;
