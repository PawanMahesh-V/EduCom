import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook,
  faClipboardList,
  faComments,
  faBell,
  faChalkboardTeacher,
  faCalendar,
  faUsers,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import { courseApi, communityApi, directMessageApi, notificationApi } from '../api';
import DashboardLayout from '../components/DashboardLayout';
import MessageLayout from '../components/MessageLayout';
import { useCommunityMessages, useTypingIndicator, useNotifications, useDirectMessages, useDMTypingIndicator } from '../hooks/useSocket';
import socketService from '../services/socket';
import { showAlert } from '../utils/alert';
const StudentDashboard = () => {
  const navigate = useNavigate();
  const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  // Try different possible ID field names
  const userId = user?.id || user?.userId;
  const [activeSection, setActiveSection] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  
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

  // Join community modal states
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joiningCommunity, setJoiningCommunity] = useState(false);

  // Real-time notifications
  useNotifications((notification) => {
    showAlert(notification.title, notification.message, notification.type || 'info');
    // Add new notification to the list
    setNotifications(prev => [notification, ...prev]);
  });

  // Join all communities on page load and listen for new messages
  useEffect(() => {
    if (!userId) return;
    
    const socket = socketService.connect(userId);
    
    // Fetch and join all communities immediately
    const joinAllCommunities = async () => {
      try {
        const communities = await communityApi.getStudentCommunities(userId);
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
        communityApi.getStudentCommunities(userId).then(communities => {
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
    
    // Update conversations list
    fetchConversations();
    
    // If this message is for the currently selected conversation, add it to the messages
    if (selectedConversation && 
        (newMessage.sender_id === selectedConversation.user_id || 
         newMessage.receiver_id === selectedConversation.user_id)) {
      setDmMessages(prev => [...prev, newMessage]);
      scrollToBottom();
    }
  });
  // DM typing indicator
  const dmTypingIndicator = useDMTypingIndicator(
    selectedConversation?.user_id,
    user?.name || 'Student'
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
    user?.name || 'Student'
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
    if (activeSection === 'courses' && userId) {
      fetchMyCourses();
    } else if (activeSection === 'community' && userId) {
      fetchCommunities();
    } else if (activeSection === 'messages' && userId) {
      fetchConversations();
      fetchAvailableUsers();
    } else if (activeSection === 'notifications' && userId) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [activeSection, userId]);

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
  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const communities = await communityApi.getStudentCommunities(userId);
      
      const formattedChats = communities.map(community => ({
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
  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const data = await courseApi.getStudentCourses(userId);
      setCourses(data.courses || []);
    } catch (err) {
      alert('Error loading courses: ' + err);
      setCourses([]);
    } finally {
      setLoading(false);
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
    // Switch to community view and load that course's community
    setActiveSection('community');
    setLoading(true);
    
    try {
      
      // Fetch the community for this course
      const communities = await communityApi.getStudentCommunities(userId);
      
      const courseCommunity = communities.find(c => c.course_id === course.id);
      
      if (courseCommunity) {
        const formattedChat = {
          id: courseCommunity.id,
          name: courseCommunity.name || `${course.name} Community`,
          courseId: courseCommunity.course_id,
          courseName: course.name,
          courseCode: course.code,
          lastMessage: 'Start chatting...',
          time: new Date(courseCommunity.created_at).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' }),
          unread: 0
        };
        
        setChats([formattedChat]);
        await handleChatSelect(formattedChat);
      } else {
        setChats([]);
        setSelectedChat(null);
        showAlert('No Community', `No community found for ${course.name}. Please contact your administrator.`, 'warning');
      }
    } catch (err) {
      setChats([]);
      setSelectedChat(null);
      showAlert('Error', 'Failed to load course community', 'error');
    } finally {
      setLoading(false);
    }
  };
  const handleSendMessage = () => {
    if (message.trim() && selectedChat) {
      sendSocketMessage(
        message,
        userId,
        user?.name || 'Student',
        false
      );
      setMessage('');
      stopTyping();
    }
  };
  const handleSendDirectMessage = (isAnonymous = false) => {
    console.log('[StudentDashboard] handleSendDirectMessage called with isAnonymous:', isAnonymous);
    if (message.trim() && selectedConversation) {
      console.log('[StudentDashboard] Calling sendDirectMessage with isAnonymous:', isAnonymous);
      sendDirectMessage(
        selectedConversation.user_id,
        message,
        user?.name || 'Student',
        isAnonymous
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
  const handleStartNewConversation = async (user) => {
    const newConversation = {
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
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
  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    setMessages([]);
    addedMessageIds.current.clear();
    
    // Reset unread count for this chat in the UI
    setChats(prev => prev.map(c => 
      c.id === chat.id ? { ...c, unread_count: 0 } : c
    ));
    
    // Fetch existing messages for this community
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
  const handleJoinCommunity = async () => {
    if (!joinCode.trim()) {
      showAlert('Error', 'Please enter a join code', 'error');
      return;
    }

    try {
      setJoiningCommunity(true);
      const response = await communityApi.joinCommunity(joinCode.trim(), userId);
      showAlert('Success', response.message, 'success');
      setShowJoinModal(false);
      setJoinCode('');
      
      // Refresh communities list
      if (activeSection === 'community') {
        await fetchCommunities();
      }
    } catch (err) {
      // err is already a string message from ApiClient
      const errorMessage = typeof err === 'string' ? err : (err.message || 'Failed to join community');
      // Show info alert if already a member, otherwise show error
      if (errorMessage.toLowerCase().includes('already')) {
        showAlert('Already Enrolled', errorMessage, 'info');
      } else {
        showAlert('Error', errorMessage, 'error');
      }
    } finally {
      setJoiningCommunity(false);
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
      role={user?.role || 'Student'}
      menuItems={menuItems}
      activeSection={activeSection}
      onMenuClick={setActiveSection}
      onLogout={handleLogout}
    >
      {activeSection === 'courses' && (
        <div className="container">
          {loading ? (
            <div className="text-center p-4 text-secondary">
              Loading your courses...
            </div>
          ) : courses.length === 0 ? (
            <div className="empty-state text-center p-4 text-secondary">
              <FontAwesomeIcon icon={faBook} className="icon-xl mb-3 opacity-30" />
              <p>You are not enrolled in any courses yet.</p>
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
                  
                  <div className="course-card-meta">
                    <div className="course-card-meta-item">
                      <FontAwesomeIcon icon={faChalkboardTeacher} />
                      <span>{course.teacher_name || 'No teacher assigned'}</span>
                    </div>
                    <div className="course-card-meta-item">
                      <FontAwesomeIcon icon={faBook} />
                      <span>{course.department} - Semester {course.semester}</span>
                    </div>
                    <div className="course-card-meta-item">
                      <FontAwesomeIcon icon={faCalendar} />
                      <span>Enrolled: {new Date(course.enrolled_on).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeSection === 'assignments' && (
        <div>
          <h3>Assignments</h3>
          <p>Your assignments will appear here.</p>
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

      {/* Floating Join Button - Only show on courses page */}
      {activeSection === 'courses' && (
        <button 
          className="floating-join-btn"
          onClick={() => setShowJoinModal(true)}
          title="Join Community"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      )}

      {/* Join Community Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Join Community</h3>
              <button className="modal-close" onClick={() => setShowJoinModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="text-muted mb-3">
                Enter the 8-character code provided by your instructor to join a community.
              </p>
              <div className="form-group">
                <label htmlFor="joinCode">Join Code</label>
                <input
                  type="text"
                  id="joinCode"
                  className="form-control"
                  placeholder="e.g., CS101ABC"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  disabled={joiningCommunity}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinCommunity()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowJoinModal(false)}
                disabled={joiningCommunity}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleJoinCommunity}
                disabled={joiningCommunity || !joinCode.trim()}
              >
                {joiningCommunity ? 'Joining...' : 'Join Community'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default StudentDashboard;
