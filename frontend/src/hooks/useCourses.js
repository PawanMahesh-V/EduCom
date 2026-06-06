import { useState, useEffect } from 'react';
import { courseApi, communityApi, userApi } from '../api';
import { showSuccess, showError, showWarning } from '../utils/alert';

export const useCourses = (courseTab, socketService, isConnected) => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [courseDepartmentFilter, setCourseDepartmentFilter] = useState('All');
  const [courseSemesterFilter, setCourseSemesterFilter] = useState('All');
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);

  const [courseRequests, setCourseRequests] = useState([]);
  const [courseRequestsLoading, setCourseRequestsLoading] = useState(false);

  const [communities, setCommunities] = useState([]);
  const [filteredCommunities, setFilteredCommunities] = useState([]);
  const [communityStatusFilter, setCommunityStatusFilter] = useState('All');
  const [communitySearchTerm, setCommunitySearchTerm] = useState('');
  const [communitiesLoading, setCommunitiesLoading] = useState(true);

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

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
    if (courseTab === 'communities') fetchCommunities();
    else if (courseTab === 'requests') fetchCourseRequests();
  }, [courseTab]);

  useEffect(() => {
    if (isConnected && socketService && socketService.socket) {
        const handleCourseUpdate = () => {
          fetchCourses();
          if (courseTab === 'communities') fetchCommunities();
          if (courseTab === 'requests') fetchCourseRequests();
        };
        socketService.socket.on('admin-course-update', handleCourseUpdate);
        return () => {
          if (socketService?.socket) {
            socketService.socket.off('admin-course-update', handleCourseUpdate);
          }
        };
    }
  }, [isConnected, socketService, courseTab]);

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
  }, [communityStatusFilter, communitySearchTerm, communities]);

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

  const handleCourseSubmit = async (courseFormData, selectedCourse) => {
    try {
      if (selectedCourse) {
        await courseApi.update(selectedCourse.id, courseFormData);
        showSuccess('Course updated successfully!');
      } else {
        await courseApi.create(courseFormData);
        showSuccess('Course created successfully!');
      }
      await fetchCourses();
      return true;
    } catch (err) {
      showError(err.message);
      return false;
    }
  };

  const handleCourseDelete = async (courseId) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
    setFilteredCourses(prev => prev.filter(c => c.id !== courseId));
    try {
      await courseApi.delete(courseId);
      showSuccess('Course deleted successfully');
    } catch (err) {
      fetchCourses();
      showError(err.message || 'Failed to delete course');
    }
  };

  const handleCommunitySubmit = async (communityFormData, selectedCommunity) => {
    try {
      await communityApi.update(selectedCommunity.id, communityFormData);
      await fetchCommunities();
      showSuccess('Community updated successfully!');
      return true;
    } catch (err) {
      showError(err.message || 'Failed to update community');
      return false;
    }
  };

  return {
    courses,
    filteredCourses,
    courseSearchTerm, setCourseSearchTerm,
    courseDepartmentFilter, setCourseDepartmentFilter,
    courseSemesterFilter, setCourseSemesterFilter,
    coursesLoading,
    teachers,
    courseRequests,
    courseRequestsLoading,
    communities,
    filteredCommunities,
    communityStatusFilter, setCommunityStatusFilter,
    communitySearchTerm, setCommunitySearchTerm,
    communitiesLoading,
    handleApproveCourseRequest,
    handleRejectCourseRequest,
    handleCourseSubmit,
    handleCourseDelete,
    handleCommunitySubmit
  };
};
