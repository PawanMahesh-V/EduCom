import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, faChalkboardTeacher, faCalendar, faPlus, faSignOutAlt, faTimes, faSpinner 
} from '@fortawesome/free-solid-svg-icons';
import { courseApi, communityApi } from '../../api';
import { showAlert } from '../../utils/alert';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const MyCourses = ({ onNavigateToCommunity }) => {
  const { user } = useAuth();
  const userId = user?.id || user?.userId;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joiningCommunity, setJoiningCommunity] = useState(false);

  const { socketService, isConnected } = useSocket();

  useEffect(() => {
    if (userId) fetchMyCourses();
  }, [userId]);

  useEffect(() => {
    if (isConnected && socketService?.socket) {
        socketService.socket.on('user-enrolled', fetchMyCourses);
        return () => socketService.socket.off('user-enrolled', fetchMyCourses);
    }
  }, [isConnected, socketService]);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const data = await courseApi.getStudentCourses(userId);
      setCourses(data.courses || []);
    } catch (err) {
      showAlert('Error', 'Error loading courses: ' + err, 'error');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = async (course) => {
    if (!onNavigateToCommunity) return;
    try {
      const communities = await communityApi.getStudentCommunities(userId);
      const courseCommunity = communities.find(c => c.course_id === course.id);
      
      if (courseCommunity) {
        onNavigateToCommunity({
          id: courseCommunity.id,
          name: courseCommunity.name || `${course.name} Community`,
          courseId: courseCommunity.course_id,
          courseName: course.name,
          courseCode: course.code,
          lastMessage: 'Start chatting...',
          time: new Date(courseCommunity.created_at).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' }),
          unread: 0
        });
      } else {
        showAlert('No Community', `No community found for ${course.name}.`, 'warning');
      }
    } catch (err) {
      showAlert('Error', 'Failed to load course community', 'error');
    }
  };

  const handleJoinCommunity = async () => {
    if (!joinCode.trim()) return showAlert('Error', 'Enter a join code', 'error');
    try {
      setJoiningCommunity(true);
      const response = await communityApi.joinCommunity(joinCode.trim(), userId);
      showAlert('Success', response.message, 'success');
      setShowJoinModal(false);
      setJoinCode('');
      await fetchMyCourses();
    } catch (err) {
      const msg = typeof err === 'string' ? err : (err.message || 'Failed to join');
      showAlert(msg.toLowerCase().includes('already') ? 'Already Enrolled' : 'Error', msg, 'error');
    } finally {
      setJoiningCommunity(false);
    }
  };

  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  const handleLeaveCourse = async (e, course) => {
    e.stopPropagation();
    setConfirmDialog({
      open: true,
      title: 'Leave Community',
      message: `Leave "${course.name}" community? You will be unenrolled from this course.`,
      onConfirm: async () => {
        try {
          setLoading(true);
          const communities = await communityApi.getStudentCommunities(userId);
          const courseCommunity = communities.find(c => c.course_id === course.id);
          if (courseCommunity) {
            await communityApi.leaveCommunity(courseCommunity.id);
            showAlert('Success', 'Successfully left the community', 'success');
            fetchMyCourses();
          }
        } catch (err) {
          showAlert('Error', 'Failed to leave community', 'error');
        } finally {
          setLoading(false);
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  return (
    <>
      <div className="mc-viewport">
        {loading ? (
          <div className="mc-state-message">
            <FontAwesomeIcon icon={faSpinner} spin className="mc-empty-icon" />
            <p>Loading your courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="mc-state-message">
            <FontAwesomeIcon icon={faBook} className="mc-empty-icon" />
            <p>You are not enrolled in any courses yet.</p>
          </div>
        ) : (
          <div className="mc-course-grid">
            {courses.map((course) => (
              <div key={course.id} className="mc-course-card" onClick={() => handleCourseClick(course)}>
                <div className="mc-card-header">
                  <span className="mc-course-code">{course.code}</span>
                  <button className="mc-leave-btn" onClick={(e) => handleLeaveCourse(e, course)} title="Leave Community">
                    <FontAwesomeIcon icon={faSignOutAlt} />
                  </button>
                </div>
                <h3 className="mc-card-title">{course.name}</h3>
                <div className="mc-card-meta">
                  <span><FontAwesomeIcon icon={faChalkboardTeacher} /> {course.teacher_name || 'No teacher'}</span>
                  <span><FontAwesomeIcon icon={faBook} /> {course.department} - Sem {course.semester}</span>
                  <span><FontAwesomeIcon icon={faCalendar} /> Enrolled: {new Date(course.enrolled_on).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="mc-float-add-btn" onClick={() => setShowJoinModal(true)} title="Join Community">
        <FontAwesomeIcon icon={faPlus} />
      </button>

      {showJoinModal && (
        <div className="mc-modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="mc-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="mc-modal-header">
              <h3>Join Community</h3>
              <button className="mc-modal-close" onClick={() => setShowJoinModal(false)}><FontAwesomeIcon icon={faTimes}/></button>
            </div>
            <div className="mc-modal-body">
              <input
                className="mc-join-input"
                placeholder="Enter 8-character join code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
            </div>
            <div className="mc-modal-footer">
              <button className="mc-btn-secondary" onClick={() => setShowJoinModal(false)}>Cancel</button>
              <button className="mc-btn-primary" onClick={handleJoinCommunity} disabled={joiningCommunity || !joinCode.trim()}>
                {joiningCommunity ? 'Joining...' : 'Join Community'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))} confirmText="Leave" variant="danger" />
    </>
  );
};

export default MyCourses;