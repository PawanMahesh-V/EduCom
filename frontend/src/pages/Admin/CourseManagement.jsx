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
import { useSocket } from '../../context/SocketContext';

const CourseManagement = () => {
  const raw = sessionStorage.getItem('user');
  const currentUser = raw ? JSON.parse(raw) : null;

  // Socket connection
  const { socketService, isConnected } = useSocket();

  const [courseTab, setCourseTab] = useState('courses'); // 'courses', 'communities', or 'requests'

  // Listen for real-time course updates
  useEffect(() => {
    if (isConnected && socketService && socketService.socket) {
        socketService.socket.on('admin-course-update', () => {
             fetchCourses();
             if (courseTab === 'communities') fetchCommunities();
             if (courseTab === 'requests') fetchCourseRequests();
        });
        return () => socketService.socket.off('admin-course-update');
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
      console.error('Error fetching course requests:', err);
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
        // Optimistic update - remove from UI immediately
        setCourses(prev => prev.filter(c => c.id !== courseId));
        setFilteredCourses(prev => prev.filter(c => c.id !== courseId));

        try {
          await courseApi.delete(courseId);
          showSuccess('Course deleted successfully');
        } catch (err) {
          // Revert on error
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

  // Community handlers
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

      // Send message via Socket.IO with notificationOnly flag
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

  return (
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
          className={`tab-button ${courseTab === 'requests' ? 'active' : ''}`}
          onClick={() => setCourseTab('requests')}
        >
          Approve Courses
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
                    className="btn secondary filter-button-nowrap"
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
                      <div className="form-group form-group-full">
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
                  value={communityStatusFilter}
                  onChange={(e) => setCommunityStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {(communityStatusFilter !== 'All' || communitySearchTerm) && (
                <div className="filter-actions">
                  <button
                    className="btn secondary filter-button-nowrap"
                    onClick={() => {
                      setCommunityStatusFilter('All');
                      setCommunitySearchTerm('');
                    }}
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
                        <button
                          className="button primary"
                          onClick={() => {
                            setSelectedCommunityForMessage(community);
                            setIsMessageModalOpen(true);
                            setMessageFormData({ subject: '', message: '' });
                          }}
                        >
                          <FontAwesomeIcon icon={faPaperPlane} />
                          Send
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
        ) : courseTab === 'requests' ? (
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
                    <th>Requested By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courseRequestsLoading ? (
                    <tr>
                      <td colSpan="7" className="text-center p-4">Loading course requests...</td>
                    </tr>
                  ) : courseRequests.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center p-4">No pending course requests</td>
                    </tr>
                  ) : (
                    courseRequests.map((request) => (
                      <tr key={request.id}>
                        <td data-label="Course Code">{request.code}</td>
                        <td data-label="Course Name">{request.name}</td>
                        <td data-label="Department">{request.department}</td>
                        <td data-label="Semester">{request.semester}</td>
                        <td data-label="Teacher">{request.teacher_name || 'N/A'}</td>
                        <td data-label="Requested By">{request.requested_by_name || 'N/A'}</td>
                        <td data-label="Actions">
                          <button
                            className="btn-approve"
                            onClick={() => handleApproveCourseRequest(request.id)}
                            title="Approve"
                          >
                            <FontAwesomeIcon icon={faUserCheck} />
                          </button>
                          <button
                            className="btn-reject ml-2"
                            onClick={() => handleRejectCourseRequest(request.id)}
                            title="Reject"
                          >
                            <FontAwesomeIcon icon={faUserMinus} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="mobile-cards-view">
                {courseRequestsLoading ? (
                  <div className="empty-state">
                    <p>Loading course requests...</p>
                  </div>
                ) : courseRequests.length === 0 ? (
                  <div className="empty-state">
                    <p>No pending course requests</p>
                  </div>
                ) : (
                  courseRequests.map((request) => (
                    <div key={request.id} className="user-card">
                      <div className="user-card-header">
                        <div className="user-card-info">
                          <div className="user-card-label">Course Code</div>
                          <div className="user-card-value large">{request.code}</div>
                        </div>
                      </div>
                      <div className="user-card-body">
                        <div className="user-card-row">
                          <div className="user-card-label">Course Name</div>
                          <div className="user-card-value">{request.name}</div>
                        </div>
                        <div className="user-card-row">
                          <div className="user-card-label">Department</div>
                          <div className="user-card-value">{request.department}</div>
                        </div>
                        <div className="user-card-row">
                          <div className="user-card-label">Semester</div>
                          <div className="user-card-value">{request.semester}</div>
                        </div>
                        <div className="user-card-row">
                          <div className="user-card-label">Teacher</div>
                          <div className="user-card-value">{request.teacher_name || 'N/A'}</div>
                        </div>
                        <div className="user-card-row">
                          <div className="user-card-label">Requested By</div>
                          <div className="user-card-value">{request.requested_by_name || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="user-card-actions">
                        <button
                          className="button approve"
                          onClick={() => handleApproveCourseRequest(request.id)}
                        >
                          <FontAwesomeIcon icon={faUserCheck} />
                          Approve
                        </button>
                        <button
                          className="button reject"
                          onClick={() => handleRejectCourseRequest(request.id)}
                        >
                          <FontAwesomeIcon icon={faUserMinus} />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CourseManagement;
