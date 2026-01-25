import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook,
  faChalkboardTeacher,
  faUsers,
  faPlus,
  faKey,
  faCopy
} from '@fortawesome/free-solid-svg-icons';
import { courseApi, communityApi } from '../../api';
import socketService from '../../services/socket';
import { showAlert } from '../../utils/alert';

const MyCourses = ({ onNavigateToCommunity }) => {
  const raw = sessionStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  const userId = user?.id || user?.userId;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    activeAssignments: 0,
    pendingGrading: 0
  });

  // Course request modal states
  const [isCourseRequestModalOpen, setIsCourseRequestModalOpen] = useState(false);
  const [courseRequestData, setCourseRequestData] = useState({
    code: '',
    name: '',
    department: 'CS',
    semester: ''
  });

  useEffect(() => {
    if (userId) {
      fetchMyCourses();
      fetchTeacherStats();
    }
  }, [userId]);

  // Listen for course approval events
  useEffect(() => {
    if (!userId) return;
    
    const socket = socketService.connect(userId);
    
    const handleCourseApproved = (data) => {
      console.log('[MyCourses] Course approved event received:', data);
      if (data.teacherId === userId) {
        setCourses(prev => {
          if (prev.some(c => c.id === data.course.id)) return prev;
          return [...prev, data.course];
        });
      }
    };
    
    socket.on('course-approved', handleCourseApproved);
    
    return () => {
      socket.off('course-approved', handleCourseApproved);
    };
  }, [userId]);

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

  const fetchTeacherStats = async () => {
    try {
      const data = await courseApi.getTeacherStats(userId);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleCourseClick = async (course) => {
    if (onNavigateToCommunity) {
      try {
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
          onNavigateToCommunity(formattedChat);
        } else {
          showAlert('No Community', `No community found for ${course.name}`, 'warning');
        }
      } catch (err) {
        showAlert('Error', 'Failed to load course community', 'error');
      }
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

  const handleCopyJoinCode = async (joinCode, courseName, e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(joinCode);
      showAlert('Copied!', `Join code ${joinCode} copied to clipboard`, 'success');
    } catch (err) {
      showAlert('Error', 'Failed to copy join code', 'error');
    }
  };

  return (
    <div className="container">
      <div className="header-actions mb-3">
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
                  <label>Course Code+Sec Name:</label>
                  <input
                    type="text"
                    name="code"
                    value={courseRequestData.code}
                    onChange={handleCourseRequestInputChange}
                    placeholder="CS101-A(Section Name)"
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
                  />
                  <small className="helper-text">
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
  );
};

export default MyCourses;
