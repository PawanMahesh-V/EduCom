import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook,
  faChalkboardTeacher,
  faCalendar,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import { courseApi, communityApi } from '../../api';
import { showAlert } from '../../utils/alert';
import { useSocket } from '../../context/SocketContext';

const MyCourses = ({ onNavigateToCommunity }) => {
  const raw = sessionStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  const userId = user?.id || user?.userId;

  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Join community modal states
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joiningCommunity, setJoiningCommunity] = useState(false);

  // Socket connection
  const { socketService, isConnected } = useSocket();

  useEffect(() => {
    if (userId) {
      fetchMyCourses();
    }
  }, [userId]);

  // Listen for real-time enrollment updates
  useEffect(() => {
    if (isConnected && socketService && socketService.socket) {
        socketService.socket.on('user-enrolled', () => {
             fetchMyCourses();
        });
        return () => socketService.socket.off('user-enrolled');
    }
  }, [isConnected, socketService]);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const data = await courseApi.getStudentCourses(userId);
      setCourses(data.courses || []);
      setFilteredCourses(data.courses || []);
    } catch (err) {
      showAlert('Error', 'Error loading courses: ' + err, 'error');
      setCourses([]);
      setFilteredCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = async (course) => {
    // Switch to community view and load that course's community
    if (onNavigateToCommunity) {
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
          onNavigateToCommunity(formattedChat);
        } else {
          showAlert('No Community', `No community found for ${course.name}. Please contact your administrator.`, 'warning');
        }
      } catch (err) {
        showAlert('Error', 'Failed to load course community', 'error');
      }
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
      
      // Refresh courses list
      await fetchMyCourses();
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : (err.message || 'Failed to join community');
      if (errorMessage.toLowerCase().includes('already')) {
        showAlert('Already Enrolled', errorMessage, 'info');
      } else {
        showAlert('Error', errorMessage, 'error');
      }
    } finally {
      setJoiningCommunity(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCourses(courses);
    } else {
      const lower = searchTerm.toLowerCase();
      const filtered = courses.filter(course => 
        course.name.toLowerCase().includes(lower) ||
        course.code.toLowerCase().includes(lower) ||
        course.department.toLowerCase().includes(lower) ||
        (course.teacher_name && course.teacher_name.toLowerCase().includes(lower))
      );
      setFilteredCourses(filtered);
    }
  }, [searchTerm, courses]);

  return (
    <>
      <div className="container">
        <div className="search-container mb-4">
          <div className="chat-search-wrapper">
             <FontAwesomeIcon icon={faBook} className="chat-search-icon" />
             <input
              type="text"
              className="chat-search-input"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center p-4 text-secondary">
            Loading your courses...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="empty-state text-center p-4 text-secondary">
            <FontAwesomeIcon icon={faBook} className="icon-xl mb-3 opacity-30" />
            <p>{searchTerm ? 'No courses found matching your search.' : 'You are not enrolled in any courses yet.'}</p>
          </div>
        ) : (
          <div className="course-card-grid">
            {filteredCourses.map((course) => (
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

      {/* Floating Join Button */}
      <button 
        className="floating-join-btn"
        onClick={() => setShowJoinModal(true)}
        title="Join Community"
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>

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
    </>
  );
};

export default MyCourses;
