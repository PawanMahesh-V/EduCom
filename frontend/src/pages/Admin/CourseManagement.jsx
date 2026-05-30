import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook,
  faPenToSquare,
  faTrash,
  faUserCheck,
  faUserMinus,
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import { showSuccess, showError, showWarning } from '../../utils/alert';
import { courseApi, communityApi, userApi } from '../../api';
import ConfirmDialog from '../../components/ConfirmDialog';
import CustomSelect from '../../components/Common/CustomSelect';
import Pagination from '../../components/Common/Pagination';
import { useSocket } from '../../context/SocketContext';

const CourseManagement = ({ initialTab }) => {
  const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
  const currentUser = raw ? JSON.parse(raw) : null;

  // Socket connection
  const { socketService, isConnected } = useSocket();

  const [courseTab, setCourseTab] = useState(initialTab || 'courses'); 

  useEffect(() => {
    if (initialTab) {
      setCourseTab(initialTab);
    }
  }, [initialTab]);

  // Listen for real-time course updates
  useEffect(() => {
    if (isConnected && socketService && socketService.socket) {
        const handleCourseUpdate = () => {
          fetchCourses();
          if (courseTab === 'communities') fetchCommunities();
          if (courseTab === 'requests') fetchCourseRequests();
        };
        socketService.socket.on('admin-course-update', handleCourseUpdate);
        return () => socketService.socket.off('admin-course-update', handleCourseUpdate);
    }
  }, [isConnected, socketService, courseTab]);

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
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    onConfirm: null,
  });
  const [courseFormData, setCourseFormData] = useState({
    code: '',
    name: '',
    department: 'CS',
    semester: '',
    teacher_id: ''
  });

  // Course Requests states
  const [courseRequests, setCourseRequests] = useState([]);
  const [courseRequestsLoading, setCourseRequestsLoading] = useState(false);
  const [coursePage, setCoursePage] = useState(1);
  const [communityPage, setCommunityPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);

  // Pagination defaults
  const itemsPerPage = 2;

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

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
    if (courseTab === 'communities') {
      fetchCommunities();
    } else if (courseTab === 'requests') {
      fetchCourseRequests();
    }
  }, [courseTab]);

  // Course filtering
  useEffect(() => {
    let filtered = courses;
    if (courseDepartmentFilter !== 'All') {
      filtered = filtered.filter(course => course.department === courseDepartmentFilter);
    }
    if (courseSemesterFilter !== 'All') {
      filtered = filtered.filter(course => course.semester === courseSemesterFilter);
    }
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
    setCoursePage(1);
  }, [courseSearchTerm, courseDepartmentFilter, courseSemesterFilter, courses]);

  // Community filtering
  useEffect(() => {
    let filtered = communities;
    if (communityStatusFilter !== 'All') {
      filtered = filtered.filter(community => community.status === communityStatusFilter);
    }
    if (communitySearchTerm) {
      const searchLower = communitySearchTerm.toLowerCase();
      filtered = filtered.filter(community =>
        (community.name || '').toLowerCase().includes(searchLower) ||
        (community.code || '').toLowerCase().includes(searchLower) ||
        (community.department || '').toLowerCase().includes(searchLower)
      );
    }
    setFilteredCommunities(filtered);
    setCommunityPage(1);
  }, [communityStatusFilter, communitySearchTerm, communities]);

  const fetchTeachers = async () => {
    try {
      const data = await userApi.getTeachers();
      setTeachers((data.teachers || data || []).map(t => ({ ...t })));
    } catch (err) {
      showError(err.message);
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await courseApi.getAll();
      setCourses(data.courses || data || []);
      setCoursesLoading(false);
    } catch (err) {
      showError(err.message);
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
      showError(err.message);
      setCommunitiesLoading(false);
      setCommunities([]);
      setFilteredCommunities([]);
    }
  };

  const fetchCourseRequests = async () => {
    try {
      setCourseRequestsLoading(true);
      const response = await courseApi.getCourseRequests();
      setCourseRequests(response.requests || []);
      setCourseRequestsLoading(false);
    } catch (err) {
      showError('Failed to fetch course requests');
      setCourseRequestsLoading(false);
    }
  };

  const handleApproveCourseRequest = async (requestId) => {
    try {
      await courseApi.approveCourseRequest(requestId);
      showSuccess('Course request approved and course created successfully!');
      fetchCourseRequests();
      fetchCourses();
    } catch (err) {
      showError(err.message || 'Failed to approve course request');
    }
  };

  const handleRejectCourseRequest = async (requestId) => {
    try {
      await courseApi.rejectCourseRequest(requestId);
      showSuccess('Course request rejected');
      fetchCourseRequests();
    } catch (err) {
      showError(err.message || 'Failed to reject course request');
    }
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
        showSuccess('Course updated successfully!');
      } else {
        await courseApi.create(courseFormData);
        showSuccess('Course created successfully!');
      }
      await fetchCourses();
      handleCloseCourseModal();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleCourseDelete = (courseId) => {
    setConfirmState({
      open: true,
      title: 'Delete Course',
      message: 'Are you sure you want to delete this course?',
      confirmText: 'Delete Course',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        setCourses(prev => prev.filter(c => c.id !== courseId));
        setFilteredCourses(prev => prev.filter(c => c.id !== courseId));
        try {
          await courseApi.delete(courseId);
          showSuccess('Course deleted successfully');
        } catch (err) {
          fetchCourses();
          showError(err.message || 'Failed to delete course');
        }
      }
    });
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
      socketService.sendMessage({
        communityId: selectedCommunityForMessage.id,
        message: messageFormData.message,
        subject: messageFormData.subject,
        senderId: currentUser.id,
        senderName: currentUser.name || 'Admin',
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

  const paginatedCourses = filteredCourses.slice((coursePage - 1) * itemsPerPage, coursePage * itemsPerPage);
  const paginatedCommunities = filteredCommunities.slice((communityPage - 1) * itemsPerPage, communityPage * itemsPerPage);
  const paginatedRequests = courseRequests.slice((requestPage - 1) * itemsPerPage, requestPage * itemsPerPage);

  return (
    <div className="cm-management-wrapper">
      {/* Dynamic Sub-Navigation Bar */}
      <div className="cm-sub-nav">
        <div className="cm-sub-nav-tabs">
          <button
            className={`cm-sub-nav-item ${courseTab === 'courses' ? 'cm-sub-nav-item--active' : ''}`}
            onClick={() => setCourseTab('courses')}
          >
            Manage Courses
          </button>
          <button
            className={`cm-sub-nav-item ${courseTab === 'communities' ? 'cm-sub-nav-item--active' : ''}`}
            onClick={() => setCourseTab('communities')}
          >
            Communities
          </button>
          <button
            className={`cm-sub-nav-item ${courseTab === 'requests' ? 'cm-sub-nav-item--active' : ''}`}
            onClick={() => setCourseTab('requests')}
          >
            Course Requests
          </button>
        </div>
      </div>

      <div className="cm-tab-content-area">
        {/* ================= COURSES VIEW TAB ================= */}
        {courseTab === 'courses' ? (
          <div className="cm-fade-in-view">
            <div className="cm-toolbar">
              <input
                type="text"
                className="cm-search-input"
                placeholder="Search courses by code or title..."
                value={courseSearchTerm}
                onChange={(e) => setCourseSearchTerm(e.target.value)}
              />
              
              <div className="cm-filter-select-group">
                <CustomSelect
                  options={[
                    { value: 'All', label: 'All Departments' },
                    { value: 'CS', label: 'CS' },
                    { value: 'BBA', label: 'BBA' },
                    { value: 'IT', label: 'IT' }
                  ]}
                  value={courseDepartmentFilter}
                  onChange={(val) => setCourseDepartmentFilter(val)}
                />

                <CustomSelect
                  options={[
                    { value: 'All', label: 'All Semesters' },
                    { value: '1', label: 'Semester 1' },
                    { value: '2', label: 'Semester 2' },
                    { value: '3', label: 'Semester 3' },
                    { value: '4', label: 'Semester 4' },
                    { value: '5', label: 'Semester 5' },
                    { value: '6', label: 'Semester 6' },
                    { value: '7', label: 'Semester 7' },
                    { value: '8', label: 'Semester 8' }
                  ]}
                  value={courseSemesterFilter}
                  onChange={(val) => setCourseSemesterFilter(val)}
                />
              </div>

              <button
                className="cm-btn-primary"
                onClick={() => setIsCourseModalOpen(true)}
              >
                <FontAwesomeIcon icon={faBook} />
                <span>Add Course</span>
              </button>
            </div>

            {coursesLoading ? (
              <div className="cm-loading-state"><div className="cm-spinner"></div><span>Loading courses...</span></div>
            ) : (
              <div className="cm-table-responsive-container">
                <table className="cm-data-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Department</th>
                      <th>Semester</th>
                      <th>Assigned Faculty</th>
                      <th className="cm-text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCourses.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="cm-empty-table-cell">
                          {courseSearchTerm ? 'No courses match your search' : 'No courses found'}
                        </td>
                      </tr>
                    ) : (
                      paginatedCourses.map((course) => (
                        <tr key={course.id}>
                          <td className="cm-font-bold cm-text-emerald" data-label="Course Code">{course.code}</td>
                          <td className="cm-font-semibold" data-label="Course Name">{course.name}</td>
                          <td data-label="Department"><span className="cm-badge-tag">{course.department}</span></td>
                          <td data-label="Semester">Semester {course.semester}</td>
                          <td data-label="Teacher" className={!course.teacher_name ? 'cm-text-muted' : ''}>
                            {course.teacher_name || 'Unassigned'}
                          </td>
                          <td data-label="Actions" className="cm-actions-cell">
                            <button
                              className="cm-icon-btn cm-icon-btn--edit"
                              onClick={() => handleCourseEdit(course)}
                              title="Edit Course"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>
                            <button 
                              title="Delete Course"
                              className="cm-icon-btn cm-icon-btn--primary"
                              onClick={() => handleCourseDelete(course.id)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Mobile Responsive Grid Flow Rendering Layout */}
                <div className="cm-mobile-cards-viewport">
                  {paginatedCourses.length === 0 ? (
                    <div className="cm-empty-card-fallback">No matched courses found.</div>
                  ) : (
                    paginatedCourses.map((course) => (
                      <div key={course.id} className="cm-responsive-data-card">
                        <div className="cm-card-topline">
                          <span className="cm-card-code">{course.code}</span>
                          <span className="cm-badge-tag">{course.department}</span>
                        </div>
                        <h4 className="cm-card-heading">{course.name}</h4>
                        <div className="cm-card-metadata-row">
                          <span><strong>Semester:</strong> {course.semester}</span>
                          <span><strong>Faculty:</strong> {course.teacher_name || 'Unassigned'}</span>
                        </div>
                        <div className="cm-card-action-bar">
                          <button className="cm-card-btn cm-card-btn--edit" onClick={() => handleCourseEdit(course)}>
                            <FontAwesomeIcon icon={faPenToSquare} /> Edit
                          </button>
                          <button className="cm-card-btn cm-card-btn--delete" onClick={() => handleCourseDelete(course.id)}>
                            <FontAwesomeIcon icon={faTrash} /> Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Pagination 
                  currentPage={coursePage} 
                  totalItems={filteredCourses.length} 
                  itemsPerPage={itemsPerPage} 
                  onPageChange={setCoursePage} 
                />
              </div>
            )}

            {/* Course Modification Modal */}
            {isCourseModalOpen && (
              <div className="cm-modal-overlay">
                <div className="cm-modal-box cm-modal-box--medium fade-in">
                  <h2>{selectedCourse ? 'Edit Course' : 'Create New Course'}</h2>
                  <form onSubmit={handleCourseSubmit} className="cm-modal-form">
                    <div className="cm-modal-grid-2col">
                      <div className="cm-form-group">
                        <label>Course Code</label>
                        <input
                          type="text"
                          name="code"
                          value={courseFormData.code}
                          onChange={handleCourseInputChange}
                          placeholder="e.g., CSC-441"
                          required
                        />
                      </div>
                      <div className="cm-form-group">
                        <label>Course Name</label>
                        <input
                          type="text"
                          name="name"
                          value={courseFormData.name}
                          onChange={handleCourseInputChange}
                          placeholder="e.g., Data Mining"
                          required
                        />
                      </div>
                      <div className="cm-form-group">
                        <label>Department Target</label>
                        <CustomSelect
                          options={[
                            { value: 'CS', label: 'CS' },
                            { value: 'BBA', label: 'BBA' },
                            { value: 'IT', label: 'IT' }
                          ]}
                          value={courseFormData.department}
                          onChange={(val) => setCourseFormData({ ...courseFormData, department: val })}
                        />
                      </div>
                      <div className="cm-form-group">
                        <label>Academic Semester</label>
                        <CustomSelect
                          options={[
                            { value: '1', label: 'Semester 1' },
                            { value: '2', label: 'Semester 2' },
                            { value: '3', label: 'Semester 3' },
                            { value: '4', label: 'Semester 4' },
                            { value: '5', label: 'Semester 5' },
                            { value: '6', label: 'Semester 6' },
                            { value: '7', label: 'Semester 7' },
                            { value: '8', label: 'Semester 8' }
                          ]}
                          value={courseFormData.semester}
                          onChange={(val) => setCourseFormData({ ...courseFormData, semester: val })}
                          placeholder="Select Semester"
                        />
                      </div>
                      <div className="cm-form-group cm-form-group--full">
                        <label>Assigned Faculty Mentor</label>
                        <CustomSelect
                          options={teachers.map(t => ({ 
                            value: t.id, 
                            label: `${t.name} ${t.role ? `(${t.role})` : ''}` 
                          }))}
                          value={courseFormData.teacher_id}
                          onChange={(val) => setCourseFormData({ ...courseFormData, teacher_id: val })}
                          placeholder="Link Teacher Profile"
                        />
                      </div>
                    </div>
                    <div className="cm-modal-action-footer">
                      <button type="button" className="cm-btn-secondary" onClick={handleCloseCourseModal}>Cancel</button>
                      <button type="submit" className="cm-btn-primary">{selectedCourse ? 'Update Course' : 'Save Course'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <ConfirmDialog
              open={confirmState.open}
              title={confirmState.title}
              message={confirmState.message}
              confirmText={confirmState.confirmText}
              onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
              onConfirm={confirmState.onConfirm}
              variant="danger"
            />
          </div>
        ) : courseTab === 'communities' ? (
          /* ================= COMMUNITIES VIEW TAB ================= */
          <div className="cm-fade-in-view">
            <div className="cm-toolbar">
              <input
                type="text"
                className="cm-search-input"
                placeholder="Search global community spaces..."
                value={communitySearchTerm}
                onChange={(e) => setCommunitySearchTerm(e.target.value)}
              />
              
              <CustomSelect
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'active', label: 'Active Channels' },
                  { value: 'inactive', label: 'Deactivated Channels' }
                ]}
                value={communityStatusFilter}
                onChange={(val) => setCommunityStatusFilter(val)}
              />
            </div>

            <div className="cm-table-responsive-container">
              <table className="cm-data-table">
                <thead>
                  <tr>
                    <th>Community Title</th>
                    <th>Linked Code</th>
                    <th>Associated Course</th>
                    <th>Department</th>
                    <th>Ecosystem Status</th>
                    <th className="cm-text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {communitiesLoading ? (
                    <tr><td colSpan="6" className="cm-empty-table-cell"><div className="cm-spinner"></div></td></tr>
                  ) : paginatedCommunities.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="cm-empty-table-cell">
                        No communities match your search
                      </td>
                    </tr>
                  ) : (
                    paginatedCommunities.map((community) => (
                      <tr key={community.id}>
                        <td className="cm-font-bold" data-label="Community Name">{community.name || 'N/A'}</td>
                        <td className="cm-text-emerald cm-font-semibold" data-label="Course Code">{community.course_code || 'N/A'}</td>
                        <td data-label="Course Name">{community.course_name || 'N/A'}</td>
                        <td data-label="Department"><span className="cm-badge-tag">{community.department || 'N/A'}</span></td>
                        <td data-label="Status">
                          <span className={`cm-status-pill ${community.status === 'active' ? 'cm-status-pill--active' : 'cm-status-pill--inactive'}`}>
                            {community.status}
                          </span>
                        </td>
                        <td data-label="Actions" className="cm-actions-cell">
                          <button
                            className="cm-icon-btn cm-icon-btn--edit"
                            onClick={() => handleCommunityEdit(community)}
                            title="Edit Title Settings"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} />
                          </button>
                          <button
                            className="cm-icon-btn cm-icon-btn--message"
                            onClick={() => {
                              setSelectedCommunityForMessage(community);
                              setIsMessageModalOpen(true);
                              setMessageFormData({ subject: '', message: '' });
                            }}
                            title="Send Message"
                          >
                            <FontAwesomeIcon icon={faPaperPlane} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Mobile Responsive Layout Cards Grid for communities */}
              <div className="cm-mobile-cards-viewport">
                {paginatedCommunities.map((community) => (
                  <div key={community.id} className="cm-responsive-data-card">
                    <div className="cm-card-topline">
                      <h4 className="cm-card-heading cm-margin-none">{community.name}</h4>
                      <span className={`cm-status-pill ${community.status === 'active' ? 'cm-status-pill--active' : 'cm-status-pill--inactive'}`}>
                        {community.status}
                      </span>
                    </div>
                    <div className="cm-card-metadata-row cm-margin-v-sm">
                      <span><strong>Code:</strong> {community.course_code}</span>
                      <span><strong>Dept:</strong> {community.department}</span>
                    </div>
                    <div className="cm-card-action-bar">
                      <button className="cm-card-btn cm-card-btn--edit" onClick={() => handleCommunityEdit(community)}>
                        <FontAwesomeIcon icon={faPenToSquare} /> Edit
                      </button>
                      <button className="cm-card-btn cm-card-btn--message" onClick={() => {
                        setSelectedCommunityForMessage(community);
                        setIsMessageModalOpen(true);
                      }}>
                        <FontAwesomeIcon icon={faPaperPlane} /> Broadcast
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination 
                currentPage={communityPage} 
                totalItems={filteredCommunities.length} 
                itemsPerPage={itemsPerPage} 
                onPageChange={setCommunityPage} 
              />
            </div>

            {/* Community Modification Settings Modal */}
            {isCommunityModalOpen && (
              <div className="cm-modal-overlay">
                <div className="cm-modal-box fade-in">
                  <h2>Edit Community</h2>
                  <form onSubmit={handleCommunitySubmit} className="cm-modal-form">
                    <div className="cm-form-group">
                      <label htmlFor="community-name">Community Label Name</label>
                      <input
                        type="text"
                        id="community-name"
                        name="name"
                        value={communityFormData.name}
                        onChange={handleCommunityInputChange}
                        required
                      />
                    </div>
                    <div className="cm-form-group">
                      <label htmlFor="community-status">Ecosystem Routing Status</label>
                      <CustomSelect
                        id="community-status"
                        options={[
                          { value: 'active', label: 'Active Channel' },
                          { value: 'inactive', label: 'Inactive / Frozen Channel' }
                        ]}
                        value={communityFormData.status}
                        onChange={(val) => setCommunityFormData({ ...communityFormData, status: val })}
                      />
                    </div>
                    <div className="cm-modal-action-footer">
                      <button type="button" className="cm-btn-secondary" onClick={handleCloseCommunityModal}>Cancel</button>
                      <button type="submit" className="cm-btn-primary">Update Community</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Broadcast Mass System Notification Message Modal */}
            {isMessageModalOpen && (
              <div className="cm-modal-overlay">
                <div className="cm-modal-box cm-modal-box--narrow fade-in">
                  <h2>Send Notification</h2>
                  <p className="cm-modal-description-sub">
                    Target Community: <strong className="cm-text-emerald">{selectedCommunityForMessage?.name}</strong> Hub
                  </p>
                  <form onSubmit={handleMessageSubmit} className="cm-modal-form">
                    <div className="cm-form-group">
                      <label htmlFor="message-subject">Notification Header Subject</label>
                      <input
                        type="text"
                        id="message-subject"
                        name="subject"
                        value={messageFormData.subject}
                        onChange={handleMessageInputChange}
                        placeholder="e.g., Scheduled Midterm Operations Altered"
                        required
                      />
                    </div>
                    <div className="cm-form-group">
                      <label htmlFor="message-content">Dispatch Core Content Payload</label>
                      <textarea
                        id="message-content"
                        name="message"
                        value={messageFormData.message}
                        onChange={handleMessageInputChange}
                        placeholder="Type out your global system warning announcement rules details..."
                        rows="6"
                        required
                      />
                    </div>
                    <div className="cm-modal-action-footer">
                      <button type="button" className="cm-btn-secondary" onClick={handleCloseMessageModal}>Cancel</button>
                      <button type="submit" className="cm-btn-primary">
                        <FontAwesomeIcon icon={faPaperPlane} /> <span>Transmit Message</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : courseTab === 'requests' ? (
          /* ================= CURRICULUM REQUESTS VIEW TAB ================= */
          <div className="cm-fade-in-view">
            <div className="cm-table-responsive-container">
              <table className="cm-data-table">
                <thead>
                  <tr>
                    <th>Requested Code</th>
                    <th>Course Label Title</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Proposed Faculty</th>
                    <th>Originated Request From</th>
                    <th className="cm-text-center">Review Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courseRequestsLoading ? (
                    <tr><td colSpan="7" className="cm-empty-table-cell"><div className="cm-spinner"></div></td></tr>
                  ) : paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="cm-empty-table-cell">
                        No pending external curriculum deployment approval requests logged
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="cm-font-bold cm-text-emerald" data-label="Course Code">{request.code}</td>
                        <td className="cm-font-semibold" data-label="Course Name">{request.name}</td>
                        <td data-label="Department"><span className="cm-badge-tag">{request.department}</span></td>
                        <td data-label="Semester">Semester {request.semester}</td>
                        <td data-label="Teacher">{request.teacher_name || 'Unassigned'}</td>
                        <td data-label="Requested By" className="cm-font-medium">{request.requested_by_name || 'N/A'}</td>
                        <td data-label="Actions" className="cm-actions-cell">
                          <button
                            className="cm-icon-btn cm-icon-btn--approve"
                            onClick={() => handleApproveCourseRequest(request.id)}
                            title="Authorize & Launch Workspace"
                          >
                            <FontAwesomeIcon icon={faUserCheck} />
                          </button>
                          <button
                            className="cm-icon-btn cm-icon-btn--delete"
                            onClick={() => handleRejectCourseRequest(request.id)}
                            title="Deny Request"
                          >
                            <FontAwesomeIcon icon={faUserMinus} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Mobile Request Cards layout view */}
              <div className="cm-mobile-cards-viewport">
                {paginatedRequests.length === 0 ? (
                  <div className="cm-empty-card-fallback">Curriculum approval cache clear.</div>
                ) : (
                  paginatedRequests.map((request) => (
                    <div key={request.id} className="cm-responsive-data-card">
                      <div className="cm-card-topline">
                        <span className="cm-card-code">{request.code}</span>
                        <span className="cm-badge-tag">{request.department}</span>
                      </div>
                      <h4 className="cm-card-heading">{request.name}</h4>
                      <div className="cm-card-metadata-row text-xs">
                        <p><strong>Proposed Faculty:</strong> {request.teacher_name || 'N/A'}</p>
                        <p><strong>Originated Via:</strong> {request.requested_by_name || 'N/A'}</p>
                      </div>
                      <div className="cm-card-action-bar">
                        <button className="cm-card-btn cm-card-btn--approve" onClick={() => handleApproveCourseRequest(request.id)}>
                          <FontAwesomeIcon icon={faUserCheck} /> Approve
                        </button>
                        <button className="cm-card-btn cm-card-btn--delete" onClick={() => handleRejectCourseRequest(request.id)}>
                          <FontAwesomeIcon icon={faUserMinus} /> Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Pagination 
                currentPage={requestPage} 
                totalItems={courseRequests.length} 
                itemsPerPage={itemsPerPage} 
                onPageChange={setRequestPage} 
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CourseManagement;