import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook,
  faClipboardList,
  faComments,
  faSignOutAlt,
  faBars,
  faBell,
  faBookOpen,
  faChalkboardTeacher,
  faCalendar,
  faPaperPlane,
  faSearch,
  faEllipsisV
} from '@fortawesome/free-solid-svg-icons';
import { courseApi } from '../api';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  const name = user?.full_name || user?.name || 'User';
  const role = user?.role || 'Role';
  // Try different possible ID field names
  const userId = user?.user_id || user?.id || user?.userId;
  const [activeSection, setActiveSection] = useState('courses');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Chat states
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([
    { id: 1, name: 'Data Structures Community', lastMessage: 'Welcome to the group!', time: '10:30 AM', unread: 2 },
    { id: 2, name: 'Algorithms Study Group', lastMessage: 'Anyone solved problem 5?', time: '9:15 AM', unread: 0 },
    { id: 3, name: 'Web Development', lastMessage: 'Check out this resource', time: 'Yesterday', unread: 1 },
    { id: 4, name: 'Intro to Programming', lastMessage: 'Check out this resource', time: 'Yesterday', unread: 1 },
  ]);

  console.log('StudentDashboard - User object:', user);
  console.log('StudentDashboard - userId:', userId);
  console.log('StudentDashboard - activeSection:', activeSection);

  useEffect(() => {
    console.log('useEffect triggered - activeSection:', activeSection, 'userId:', userId);
    if (activeSection === 'courses' && userId) {
      console.log('Calling fetchMyCourses...');
      fetchMyCourses();
    } else {
      console.log('Not fetching - activeSection:', activeSection, 'userId:', userId);
      setLoading(false);
    }
  }, [activeSection, userId]);

  useEffect(() => {
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, []);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      console.log('Fetching courses for student:', userId);
      const data = await courseApi.getStudentCourses(userId);
      console.log('Received data:', data);
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      alert('Error loading courses: ' + err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && selectedChat) {
      const newMessage = {
        id: messages.length + 1,
        text: message,
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    // Mock messages for selected chat
    setMessages([
      { id: 1, text: 'Hey everyone!', sender: 'John Doe', time: '9:00 AM' },
      { id: 2, text: 'Welcome to the group!', sender: 'Jane Smith', time: '9:05 AM' },
      { id: 3, text: 'Thanks! Happy to be here.', sender: 'me', time: '9:10 AM' },
    ]);
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
    if (!fullName) return 'U';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const menuItems = [
    { id: 'courses', name: 'My Courses', icon: faBook },
    { id: 'community', name: 'Community/Chat', icon: faComments },
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
              <h1>My Courses</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                View all your enrolled courses
              </p>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  Loading your courses...
                </div>
              ) : courses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  <FontAwesomeIcon icon={faBook} style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
                  <p>You are not enrolled in any courses yet.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {courses.map((course) => (
                    <div 
                      key={course.course_id} 
                      style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        border: '1px solid var(--border-color)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ 
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        display: 'inline-block'
                      }}>
                        {course.course_code}
                      </div>
                      
                      <h3 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '600', 
                        marginBottom: '0.75rem',
                        color: 'var(--text-primary)'
                      }}>
                        {course.course_name}
                      </h3>
                      
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.5rem',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FontAwesomeIcon icon={faChalkboardTeacher} />
                          <span>{course.teacher_name || 'No teacher assigned'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FontAwesomeIcon icon={faBook} />
                          <span>{course.department} - Semester {course.semester}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FontAwesomeIcon icon={faCalendar} />
                          <span>Enrolled: {new Date(course.enrolled_on).toLocaleDateString()}</span>
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
          {activeSection === 'community' && (
            <div className="container" style={{ maxWidth: '100%', height: 'calc(100vh - 180px)' }}>
              <div style={{ display: 'flex', gap: '0', height: '100%', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                {/* Chat List Sidebar */}
                <div style={{ width: '320px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                  {/* Search Header */}
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600' }}>Chats</h2>
                    <div style={{ position: 'relative' }}>
                      <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input 
                        type="text" 
                        placeholder="Search conversations..."
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem 0.75rem 0.75rem 2.5rem', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '8px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Chat List */}
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {chats.map((chat) => (
                      <div 
                        key={chat.id}
                        onClick={() => handleChatSelect(chat)}
                        style={{
                          padding: '1rem',
                          borderBottom: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          background: selectedChat?.id === chat.id ? 'var(--bg-secondary)' : 'white',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          if (selectedChat?.id !== chat.id) e.currentTarget.style.background = '#f9fafb';
                        }}
                        onMouseOut={(e) => {
                          if (selectedChat?.id !== chat.id) e.currentTarget.style.background = 'white';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            fontSize: '1.1rem',
                            flexShrink: 0
                          }}>
                            {chat.name.charAt(0)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {chat.name}
                              </h4>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0, marginLeft: '0.5rem' }}>{chat.time}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {chat.lastMessage}
                              </p>
                              {chat.unread > 0 && (
                                <span style={{
                                  background: 'var(--color-primary)',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.7rem',
                                  fontWeight: '600',
                                  flexShrink: 0,
                                  marginLeft: '0.5rem'
                                }}>
                                  {chat.unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {selectedChat ? (
                    <>
                      {/* Chat Header */}
                      <div style={{ 
                        padding: '1rem 1.5rem', 
                        borderBottom: '1px solid var(--border-color)',
                        background: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600'
                          }}>
                            {selectedChat.name.charAt(0)}
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{selectedChat.name}</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active now</p>
                          </div>
                        </div>
                        <button style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer',
                          padding: '0.5rem',
                          color: 'var(--text-secondary)',
                          fontSize: '1.2rem'
                        }}>
                          <FontAwesomeIcon icon={faEllipsisV} />
                        </button>
                      </div>

                      {/* Messages Area */}
                      <div style={{ 
                        flex: 1, 
                        overflowY: 'auto', 
                        padding: '1.5rem',
                        background: 'var(--bg-secondary)'
                      }}>
                        {messages.map((msg) => (
                          <div 
                            key={msg.id}
                            style={{
                              display: 'flex',
                              justifyContent: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                              marginBottom: '1rem'
                            }}
                          >
                            <div style={{
                              maxWidth: '60%',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              background: msg.sender === 'me' 
                                ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
                                : 'white',
                              color: msg.sender === 'me' ? 'white' : 'var(--text-primary)',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                            }}>
                              {msg.sender !== 'me' && (
                                <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--color-primary)' }}>
                                  {msg.sender}
                                </div>
                              )}
                              <div style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{msg.text}</div>
                              <div style={{ 
                                fontSize: '0.75rem', 
                                opacity: 0.8,
                                textAlign: 'right'
                              }}>
                                {msg.time}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Message Input */}
                      <div style={{ 
                        padding: '1rem 1.5rem', 
                        borderTop: '1px solid var(--border-color)',
                        background: 'white'
                      }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <input 
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            style={{
                              flex: 1,
                              padding: '0.75rem 1rem',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              fontSize: '0.95rem',
                              outline: 'none'
                            }}
                          />
                          <button 
                            onClick={handleSendMessage}
                            style={{
                              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.75rem 1.5rem',
                              cursor: 'pointer',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(75, 85, 99, 0.3)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <FontAwesomeIcon icon={faPaperPlane} />
                            Send
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}>
                      <FontAwesomeIcon icon={faComments} style={{ fontSize: '4rem', opacity: 0.3 }} />
                      <p style={{ fontSize: '1.1rem' }}>Select a chat to start messaging</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeSection === 'notifications' && (
            <div>
              <h3>Notifications</h3>
              <p>Your notifications will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
