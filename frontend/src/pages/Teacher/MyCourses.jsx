import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, faChalkboardTeacher, faUsers, faPlus, faKey, faCopy, faTrash, faTimes, faSpinner 
} from '@fortawesome/free-solid-svg-icons';
import { courseApi, communityApi } from '../../api';
import { showAlert } from '../../utils/alert';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import CustomSelect from '../../components/Common/CustomSelect';

const MyCourses = ({ onNavigateToCommunity }) => {
  const { user } = useAuth();
  const userId = user?.id || user?.userId;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCourseRequestModalOpen, setIsCourseRequestModalOpen] = useState(false);
  const [courseRequestData, setCourseRequestData] = useState({ code: '', name: '', department: 'CS', semester: '' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  const { socketService, isConnected } = useSocket();

  useEffect(() => {
    if (userId) {
      fetchMyCourses();
    }
  }, [userId]);

  useEffect(() => {
    if (isConnected && socketService?.socket) {
      socketService.socket.on('course-approved', fetchMyCourses);
      return () => socketService.socket.off('course-approved', fetchMyCourses);
    }
  }, [isConnected, socketService]);

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

  const handleCourseClick = async (course) => {
    if (!onNavigateToCommunity) return;
    try {
      const allCommunities = await communityApi.getAll();
      const courseCommunity = allCommunities.communities?.find(c => c.course_id === course.id);
      
      if (courseCommunity) {
        onNavigateToCommunity({
          id: courseCommunity.id,
          name: courseCommunity.name || `${course.name} Community`,
          courseId: course.id,
          courseName: course.name,
          courseCode: course.code,
          lastMessage: 'Start chatting...',
          time: 'Now',
          unread: 0
        });
      } else {
        showAlert('No Community', `No community found for ${course.name}`, 'warning');
      }
    } catch (err) {
      showAlert('Error', 'Failed to load community', 'error');
    }
  };

  const handleCourseRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      await courseApi.submitCourseRequest({ ...courseRequestData, teacher_id: userId });
      showAlert('Success', 'Request submitted for admin approval.', 'success');
      setIsCourseRequestModalOpen(false);
      setCourseRequestData({ code: '', name: '', department: 'CS', semester: '' });
    } catch (err) {
      showAlert('Error', err.message || 'Failed to submit request', 'error');
    }
  };

  const handleCopyJoinCode = async (joinCode, e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(joinCode);
      showAlert('Copied', 'Join code copied', 'success');
    } catch {
      showAlert('Error', 'Failed to copy', 'error');
    }
  };

  const handleDisbandCourse = async (e, course) => {
    e.stopPropagation();
    setConfirmDialog({
      open: true,
      title: 'Disband Community',
      message: `Disband "${course.name}"? This deletes the community and all messages.`,
      onConfirm: async () => {
        try {
          const all = await communityApi.getAll();
          const target = all.communities?.find(c => c.course_id === course.id);
          if (target) {
            await communityApi.delete(target.id);
            showAlert('Success', 'Community disbanded', 'success');
            fetchMyCourses();
          }
        } catch (err) {
          showAlert('Error', 'Failed to disband', 'error');
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  return (
    <div className="mc-viewport">
      <div className="mc-header-row">
        <button className="mc-float-add-btn" onClick={() => setIsCourseRequestModalOpen(true)}>
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
      
      {loading ? (
        <div className="mc-state-message">
          <FontAwesomeIcon icon={faSpinner} spin className="mc-empty-icon" />
          <p>Loading courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="mc-state-message">
          <FontAwesomeIcon icon={faBook} className="mc-empty-icon" />
          <p>No courses assigned.</p>
        </div>
      ) : (
        <div className="mc-course-grid">
          {courses.map((course) => (
            <div key={course.id} className="mc-course-card" onClick={() => handleCourseClick(course)}>
              <div className="mc-card-header">
                <span className="mc-course-code">{course.code}</span>
                <button className="mc-leave-btn" onClick={(e) => handleDisbandCourse(e, course)}><FontAwesomeIcon icon={faTrash} /></button>
              </div>
              <h3 className="mc-card-title">{course.name}</h3>
              {course.join_code && (
                <div className="mc-join-code-box">
                  <span>Code: {course.join_code}</span>
                  <button className="mc-copy-btn" onClick={(e) => handleCopyJoinCode(course.join_code, e)}><FontAwesomeIcon icon={faCopy}/></button>
                </div>
              )}
              <div className="mc-card-meta">
                <span><FontAwesomeIcon icon={faUsers} /> {course.enrolled_count || 0} Students</span>
                <span><FontAwesomeIcon icon={faBook} /> {course.department} - Sem {course.semester}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Modal */}
      {isCourseRequestModalOpen && (
        <div className="mc-modal-overlay" onClick={() => setIsCourseRequestModalOpen(false)}>
          <div className="mc-modal-box" onClick={e => e.stopPropagation()}>
            <h3>Request New Course</h3>
            <form onSubmit={handleCourseRequestSubmit}>
              <input className="mc-join-input" placeholder="Course Code (e.g., CS101-A)" required onChange={e => setCourseRequestData({...courseRequestData, code: e.target.value})} />
              <input className="mc-join-input" placeholder="Course Name" required onChange={e => setCourseRequestData({...courseRequestData, name: e.target.value})} />
              <CustomSelect options={[{value:'CS', label:'CS'}, {value:'BBA', label:'BBA'}]} onChange={v => setCourseRequestData({...courseRequestData, department: v})} value={courseRequestData.department} />
              <CustomSelect options={Array.from({length:8}, (_, i) => ({value: `${i+1}`, label: `Semester ${i+1}`}))} onChange={v => setCourseRequestData({...courseRequestData, semester: v})} value={courseRequestData.semester} />
              <div className="mc-modal-footer">
                <button type="button" className="mc-btn-secondary" onClick={() => setIsCourseRequestModalOpen(false)}>Cancel</button>
                <button type="submit" className="mc-btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))} confirmText="Disband" variant="danger" />
    </div>
  );
};

export default MyCourses;