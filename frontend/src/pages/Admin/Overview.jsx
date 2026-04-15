import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faBook, faComments, faStore, faUserGraduate, faChalkboardTeacher,
  faExclamationTriangle, faShieldHalved, faBan, faArrowRight, faClock
} from '@fortawesome/free-solid-svg-icons';
import { dashboardApi } from '../../api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = ['#0A1128', '#034078', '#1282A2', '#3b82f6', '#93c5fd'];

// Inline StatCard component
const StatCard = ({ title, value, icon, colorClass, subtitle, onClick }) => (
  <div className={`ov-bento-card ov-stat-card ${onClick ? 'clickable' : ''}`} onClick={onClick}>
    <div className={`ov-stat-icon ${colorClass || 'ov-stat-icon-primary'}`}>
      <FontAwesomeIcon icon={icon} />
    </div>
    <div className="ov-stat-content">
      <h3>{typeof value === 'number' ? value.toLocaleString() : value}</h3>
      <p className="ov-stat-title">{title}</p>
      {subtitle && <p className="ov-stat-subtitle">{subtitle}</p>}
    </div>
  </div>
);

const Overview = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, activityData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getActivity ? dashboardApi.getActivity(7) : Promise.resolve({ userActivity: [] })
      ]);
      setStats(statsData);
      
      // format activity data for chart
      if (activityData && activityData.userActivity && activityData.userActivity.length > 0) {
          const formatted = activityData.userActivity.map(item => ({
              ...item,
              dateStr: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
              count: parseInt(item.count)
          }));
          setActivity(formatted);
      } else {
        // More realistic fallback if no messages in last 7 days
        const last7Days = Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                dateStr: d.toLocaleDateString('en-US', { weekday: 'short' }),
                count: 0
            };
        });
        setActivity(last7Days);
      }
      
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading command center...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
        <h3>Failed to load dashboard</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchDashboardData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-overview ov-bento-layout">
      {/* Quick Actions Panel */}
      <div className="ov-quick-actions-panel">
        <h3 className="ov-section-title">Quick Actions</h3>
        <div className="ov-quick-actions-grid">
          <button className="ov-action-btn warning" onClick={() => onNavigate && onNavigate('moderation')}>
             <div className="ov-action-icon"><FontAwesomeIcon icon={faShieldHalved} /></div>
             <div className="ov-action-text">
               <span className="ov-action-title">Review Reports</span>
               <span className="ov-action-desc">{stats?.pendingReports || 0} Pending</span>
             </div>
             <FontAwesomeIcon icon={faArrowRight} className="ov-action-arrow" />
          </button>

          <button className="ov-action-btn success" onClick={() => onNavigate && onNavigate('courses')}>
             <div className="ov-action-icon"><FontAwesomeIcon icon={faBook} /></div>
             <div className="ov-action-text">
               <span className="ov-action-title">Manage Courses</span>
               <span className="ov-action-desc">{stats?.totalCourses || 0} Active</span>
             </div>
             <FontAwesomeIcon icon={faArrowRight} className="ov-action-arrow" />
          </button>

          <button className="ov-action-btn primary" onClick={() => onNavigate && onNavigate('users')}>
             <div className="ov-action-icon"><FontAwesomeIcon icon={faUsers} /></div>
             <div className="ov-action-text">
               <span className="ov-action-title">User Management</span>
               <span className="ov-action-desc">{stats?.totalUsers || 0} Total</span>
             </div>
             <FontAwesomeIcon icon={faArrowRight} className="ov-action-arrow" />
          </button>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="ov-bento-grid">
        {/* User Demographics Donut Chart */}
        <div className="ov-bento-card ov-span-1">
            <div className="ov-bento-header">
                <h3>User Roles</h3>
            </div>
            <div className="chart-container ov-chart-container-centered">
                 <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={stats?.usersByRole ? Object.keys(stats.usersByRole).map(k => ({ name: k, value: stats.usersByRole[k] })) : []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {stats?.usersByRole && Object.keys(stats.usersByRole).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Security & Moderation */}
        <div className="ov-bento-card ov-security-card ov-span-1">
            <div className="ov-bento-header">
                <h3>Content Moderation</h3>
                <FontAwesomeIcon icon={faShieldHalved} className="ov-text-success" />
            </div>
            <div className="ov-security-stats">
                 <div className="ov-sec-stat">
                     <span className="ov-sec-val ov-text-warning">{stats?.pendingReports || 0}</span>
                     <span className="ov-sec-label">Pending</span>
                 </div>
                 <div className="ov-sec-stat">
                     <span className="ov-sec-val ov-text-danger">{stats?.totalBlockedUsers || 0}</span>
                     <span className="ov-sec-label">Blocked Users</span>
                 </div>
            </div>
            <p className="ov-security-note">ML Moderation is active and monitoring communities in real-time.</p>
        </div>

        {/* Analytics Chart */}
        <div className="ov-bento-card ov-chart-card ov-span-2">
            <div className="ov-bento-header">
                <h3>7-Day Message Volume</h3>
                <span className="ov-bento-badge">Live</span>
            </div>
            <div className="chart-container ov-chart-container-fixed">
                {activity.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={activity} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1282A2" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#1282A2" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="dateStr" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#1282A2" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="ov-empty-chart">Not enough data to display graph</div>
                )}
            </div>
        </div>
      </div>

      {/* Leaderboards & Ecosystem Grid */}
      <div className="ov-bento-grid ov-bento-grid-3">
          {/* Trending Communities */}
          <div className="ov-bento-card ov-timeline-card">
              <div className="ov-bento-header">
                  <h3>Trending Communities</h3>
                  <span className="ov-bento-badge">Hot</span>
              </div>
              <div className="ov-timeline-feed">
                  {stats?.trendingCommunities && stats.trendingCommunities.length > 0 ? (
                      stats.trendingCommunities.map((comm, i) => (
                          <div key={comm.id} className="ov-timeline-item ov-timeline-item-centered">
                              <div className="ov-timeline-icon">#{i+1}</div>
                              <div className="ov-timeline-content ov-flex-grow-1">
                                  <p><strong>{comm.name}</strong></p>
                              </div>
                              <div className="ov-timeline-msgs-count">
                                  {comm.activity_count} msgs
                              </div>
                          </div>
                      ))
                  ) : <div className="ov-empty-state"><p>No activity yet</p></div>}
              </div>
          </div>

          {/* Marketplace Insights */}
          <div className="ov-bento-card ov-timeline-card">
              <div className="ov-bento-header">
                  <h3>Marketplace Review</h3>
                  <button className="ov-text-btn" onClick={() => onNavigate && onNavigate('marketplace')}>View All</button>
              </div>
              <div className="ov-security-stats ov-mb-1">
                  <div className="ov-sec-stat">
                      <span className="ov-sec-val">{stats?.pendingMarketplaceItems || 0}</span>
                      <span className="ov-sec-label">Pending Approval</span>
                  </div>
              </div>
              <div className="ov-timeline-feed">
                  {stats?.pendingMarketplacePreview && stats.pendingMarketplacePreview.length > 0 ? (
                      stats.pendingMarketplacePreview.map((item, i) => (
                          <div key={item.id} className="ov-timeline-item ov-marketplace-preview-item">
                              <div className="ov-timeline-icon"><FontAwesomeIcon icon={faStore} /></div>
                              <div className="ov-timeline-content">
                                  <p className="ov-marketplace-item-title"><strong>{item.title}</strong></p>
                                  <span className="ov-time">Rs. {item.price} • Pending</span>
                              </div>
                          </div>
                      ))
                  ) : <div className="ov-empty-state"><p>All caught up!</p></div>}
              </div>
          </div>

          {/* Timeline - Recent Users */}
          <div className="ov-bento-card ov-timeline-card">
              <div className="ov-bento-header">
                  <h3>Recent Joins</h3>
                  <button className="ov-text-btn" onClick={() => onNavigate && onNavigate('users')}>View All</button>
              </div>
              <div className="ov-timeline-feed">
                  {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                    stats.recentUsers.slice(0, 3).map((user, i) => (
                        <div key={user.id} className="ov-timeline-item">
                            <div className="ov-timeline-icon"><FontAwesomeIcon icon={faUsers} /></div>
                            <div className="ov-timeline-content">
                                <p><strong>{user.name}</strong></p>
                                <span className="ov-time">{user.role}</span>
                            </div>
                        </div>
                    ))
                  ) : <div className="ov-empty-state"><p>No recent users</p></div>}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Overview;
