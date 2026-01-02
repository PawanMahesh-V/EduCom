import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faBook,
  faComments,
  faStore,
  faUserGraduate,
  faChalkboardTeacher,
  faExclamationTriangle,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';
import { dashboardApi } from '../../api';

// Inline StatCard component
const StatCard = ({ title, value, icon, colorClass, subtitle }) => (
  <div className="stat-card">
    <div className={`stat-icon ${colorClass || 'stat-icon-primary'}`}>
      <FontAwesomeIcon icon={icon} />
    </div>
    <div className="stat-content">
      <h3>{typeof value === 'number' ? value.toLocaleString() : value}</h3>
      <p className="stat-title">{title}</p>
      {subtitle && <p className="stat-subtitle">{subtitle}</p>}
    </div>
  </div>
);

const Overview = () => {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setStatsLoading(true);
      const statsData = await dashboardApi.getStats();
      setStats(statsData);
      setStatsError(null);
    } catch (err) {
      setStatsError(err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  if (statsLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="error-container">
        <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
        <h3>Failed to load dashboard</h3>
        <p>{statsError}</p>
        <button className="btn btn-primary" onClick={fetchDashboardData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-overview">
      <div className="overview-header">
        <div>
          {/* <h2>Dashboard Overview</h2>
          <p>Welcome back! Here's what's happening with your platform.</p> */}
        </div>
        <button className="btn btn-primary" onClick={fetchDashboardData}>
          <FontAwesomeIcon icon={faRefresh} /> 
        </button>
      </div>
      <div className="stats-grid">
        {[
          {
            title: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: faUsers,
            colorClass: 'stat-icon-primary',
            subtitle: `${stats?.usersByRole?.Student || 0} Students, ${stats?.usersByRole?.Teacher || 0} Teachers`
          },
          {
            title: 'Total Courses',
            value: stats?.totalCourses || 0,
            icon: faBook,
            colorClass: 'stat-icon-accent',
            subtitle: `${stats?.totalEnrollments || 0} Total Enrollments`
          },
          {
            title: 'Communities',
            value: stats?.totalCommunities || 0,
            icon: faComments,
            colorClass: 'stat-icon-secondary',
            subtitle: `${stats?.totalMessages || 0} Messages`
          },
          {
            title: 'Marketplace',
            value: stats?.totalMarketplaceItems || 0,
            icon: faStore,
            colorClass: 'stat-icon-info',
            subtitle: `${stats?.pendingMarketplaceItems || 0} Pending Approval`
          }
        ].map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>
      <div className="secondary-stats">
        <div className="stat-item">
          <FontAwesomeIcon icon={faUserGraduate} className="stat-icon-small" />
          <div>
            <h4>{stats?.usersByRole?.Student || 0}</h4>
            <p>Students</p>
          </div>
        </div>
        <div className="stat-item">
          <FontAwesomeIcon icon={faChalkboardTeacher} className="stat-icon-small" />
          <div>
            <h4>{stats?.usersByRole?.Teacher || 0}</h4>
            <p>Teachers</p>
          </div>
        </div>
        <div className="stat-item">
          <FontAwesomeIcon icon={faUsers} className="stat-icon-small" />
          <div>
            <h4>{stats?.usersByRole?.Admin || 0}</h4>
            <p>Admins</p>
          </div>
        </div>
        <div className="stat-item">
          <FontAwesomeIcon icon={faExclamationTriangle} className="stat-icon-small" />
          <div>
            <h4>{stats?.pendingReports || 0}</h4>
            <p>Pending Reports</p>
          </div>
        </div>
      </div>
      <div className="recent-activity-grid">
        <div className="activity-card">
          <div className="activity-header">
            <h3>Recent Users</h3>
            <span className="badge">{stats?.recentUsers?.length || 0}</span>
          </div>
          <div className="activity-list">
            {stats?.recentUsers && stats.recentUsers.length > 0 ? (
              stats.recentUsers.map((user) => (
                <div key={user.id} className="activity-item">
                  <div className="activity-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="activity-content">
                    <h4>{user.name}</h4>
                    <p>{user.role} • {user.department}</p>
                  </div>
                  <span className="activity-time">
                    {new Date(user.created_at).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="no-data">No recent users</p>
            )}
          </div>
        </div>
        <div className="activity-card">
          <div className="activity-header">
            <h3>Recent Courses</h3>
            <span className="badge">{stats?.recentCourses?.length || 0}</span>
          </div>
          <div className="activity-list">
            {stats?.recentCourses && stats.recentCourses.length > 0 ? (
              stats.recentCourses.map((course) => (
                <div key={course.id} className="activity-item">
                  <div className="activity-avatar course-avatar">
                    <FontAwesomeIcon icon={faBook} />
                  </div>
                  <div className="activity-content">
                    <h4>{course.name}</h4>
                    <p>{course.code} • {course.teacher_name || 'No teacher assigned'}</p>
                  </div>
                  <span className="activity-time">
                    {new Date(course.created_at).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="no-data">No recent courses</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
