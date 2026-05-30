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

/* Customized Premium Palette representing the new brand identity lines */
const PIE_COLORS = ['#1282A2', '#0b5c73', '#38bdf8', '#f59e0b', '#6b7280'];

// Inline StatCard component matching our Bento Grid properties
const StatCard = ({ title, value, icon, colorClass, subtitle, onClick }) => (
  <div className={`ov-bento-card ov-stat-card ${onClick ? 'ov-stat-card--clickable' : ''}`} onClick={onClick}>
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
      
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        
        let count = 0;
        if (activityData && Array.isArray(activityData.userActivity)) {
          const match = activityData.userActivity.find(item => {
            const itemDate = new Date(item.date);
            return itemDate.getFullYear() === d.getFullYear() &&
                   itemDate.getMonth() === d.getMonth() &&
                   itemDate.getDate() === d.getDate();
          });
          if (match) {
            count = parseInt(match.count) || 0;
          }
        }

        return {
          dateStr: d.toLocaleDateString('en-US', { weekday: 'short' }),
          count
        };
      });
      setActivity(last7Days);
      
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
      <div className="ov-loading-container">
        <div className="ov-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ov-error-container">
        <FontAwesomeIcon icon={faExclamationTriangle} className="ov-error-icon" />
        <h3>Failed to load dashboard</h3>
        <p>{error}</p>
        <button className="ov-btn-retry" onClick={fetchDashboardData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="ov-dashboard-wrapper">
      
      {/* Topline Aggregate StatCards Matrix */}
      <div className="ov-stats-top-row">
        <StatCard 
          title="Total Registered Users" 
          value={stats?.totalUsers || 0} 
          icon={faUsers} 
          colorClass="ov-icon-primary"
          onClick={() => onNavigate && onNavigate('users')}
        />
        <StatCard 
          title="Total Courses" 
          value={stats?.totalCourses || 0} 
          icon={faBook} 
          colorClass="ov-icon-success"
          onClick={() => onNavigate && onNavigate('courses')}
        />
        <StatCard 
          title="Community Spaces" 
          value={stats?.totalCommunities || 0} 
          icon={faComments} 
          colorClass="ov-icon-info"
        />
      </div>

      {/* Quick Action Interactive Cards Block */}
      <div className="ov-quick-actions-panel">
        <h3 className="ov-section-title">Quick Actions</h3>
        <div className="ov-quick-actions-grid">
          <button className="ov-action-btn ov-action-btn--warning" onClick={() => onNavigate && onNavigate('moderation')}>
             <div className="ov-action-icon"><FontAwesomeIcon icon={faShieldHalved} /></div>
             <div className="ov-action-text">
               <span className="ov-action-title">Review Flagged Reports</span>
               <span className="ov-action-desc">{stats?.pendingReports || 0} Awaiting Action</span>
             </div>
             <FontAwesomeIcon icon={faArrowRight} className="ov-action-arrow" />
          </button>

          <button className="ov-action-btn ov-action-btn--success" onClick={() => onNavigate && onNavigate('courses')}>
             <div className="ov-action-icon"><FontAwesomeIcon icon={faBook} /></div>
             <div className="ov-action-text">
               <span className="ov-action-title">Course Management</span>
               <span className="ov-action-desc">Manage Courses</span>
             </div>
             <FontAwesomeIcon icon={faArrowRight} className="ov-action-arrow" />
          </button>

          <button className="ov-action-btn ov-action-btn--primary" onClick={() => onNavigate && onNavigate('users')}>
             <div className="ov-action-icon"><FontAwesomeIcon icon={faUsers} /></div>
             <div className="ov-action-text">
               <span className="ov-action-title">Manage Users</span>
               <span className="ov-action-desc">Edit user profiles</span>
             </div>
             <FontAwesomeIcon icon={faArrowRight} className="ov-action-arrow" />
          </button>
        </div>
      </div>

      {/* Primary Analytics Section Layout Grid */}
      <div className="ov-bento-grid-split">
        
        {/* Realtime Graph Metrics Module */}
        <div className="ov-bento-card ov-chart-card">
            <div className="ov-bento-header">
                <div>
                  <h3>7-Day Messages</h3>
                </div>
            </div>
            <div className="ov-chart-container">
                {activity.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={activity} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1282A2" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#1282A2" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="dateStr" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)', backgroundColor: '#ffffff' }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#1282A2" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="ov-empty-chart">Not enough data to display</div>
                )}
            </div>
        </div>

        {/* User Demographics Donut Module */}
        <div className="ov-bento-card ov-pie-card">
            <div className="ov-bento-header">
                <h3>Roles</h3>
            </div>
            <div className="ov-chart-container ov-chart-container--centered">
                 <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie
                            data={stats?.usersByRole ? Object.keys(stats.usersByRole).map(k => ({ name: k, value: stats.usersByRole[k] })) : []}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                        >
                            {stats?.usersByRole && Object.keys(stats.usersByRole).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Secondary Feed Segments */}
      <div className="ov-bento-grid-three-column">
          
          {/* Trending Communities Feed Card */}
          <div className="ov-bento-card ov-timeline-card">
              <div className="ov-bento-header">
                  <h3>Trending Communities</h3>
                  <span className="ov-bento-badge ov-badge-hot">Hot</span>
              </div>
              <div className="ov-timeline-feed">
                  {stats?.trendingCommunities && stats.trendingCommunities.length > 0 ? (
                      stats.trendingCommunities.map((comm, i) => (
                          <div key={comm.id} className="ov-timeline-item">
                              <div className="ov-timeline-rank-badge">0{i+1}</div>
                              <div className="ov-timeline-content">
                                  <p className="ov-feed-item-title">{comm.name}</p>
                                  <span className="ov-feed-item-subtitle">{comm.activity_count} messages</span>
                              </div>
                          </div>
                      ))
                  ) : <div className="ov-empty-state"><p>No trending communities yet</p></div>}
              </div>
          </div>

          {/* Marketplace Activity */}
          <div className="ov-bento-card ov-timeline-card">
              <div className="ov-bento-header">
                  <h3>Marketplace Activity</h3>
                  <button className="ov-text-btn" onClick={() => onNavigate && onNavigate('marketplace')}>View System</button>
              </div>
              <div className="ov-timeline-feed">
                  {stats?.pendingMarketplacePreview && stats.pendingMarketplacePreview.length > 0 ? (
                      stats.pendingMarketplacePreview.map((item) => (
                          <div key={item.id} className="ov-timeline-item">
                              <div className="ov-feed-icon-wrapper"><FontAwesomeIcon icon={faStore} /></div>
                              <div className="ov-timeline-content">
                                  <p className="ov-feed-item-title">{item.title}</p>
                                  <span className="ov-feed-item-subtitle">Rs. {item.price.toLocaleString()} • Recently added</span>
                              </div>
                          </div>
                      ))
                  ) : <div className="ov-empty-state"><p>No recent marketplace activity</p></div>}
              </div>
          </div>

          {/* Security Logs Block */}
          <div className="ov-bento-card ov-timeline-card">
              <div className="ov-bento-header">
                  <h3>Security Logs</h3>
                  <span className="ov-bento-badge ov-badge-secure">Active</span>
              </div>
              <div className="ov-timeline-feed">
                  <div className="ov-timeline-item">
                      <div className="ov-feed-icon-wrapper ov-feed-icon-wrapper--danger"><FontAwesomeIcon icon={faBan} /></div>
                      <div className="ov-timeline-content">
                          <p className="ov-feed-item-title">Banned Users</p>
                          <span className="ov-feed-item-subtitle">{stats?.totalBlockedUsers || 0} users banned</span>
                      </div>
                  </div>
                  {stats?.recentUsers && stats.recentUsers.length > 0 && (
                    <div className="ov-timeline-item">
                      <div className="ov-feed-icon-wrapper"><FontAwesomeIcon icon={faClock} /></div>
                      <div className="ov-timeline-content">
                          <p className="ov-feed-item-title">Recent Join</p>
                          <span className="ov-feed-item-subtitle">{stats.recentUsers[0].name} ({stats.recentUsers[0].role}) joined</span>
                      </div>
                    </div>
                  )}
              </div>
          </div>

      </div>
    </div>
  );
};

export default Overview;