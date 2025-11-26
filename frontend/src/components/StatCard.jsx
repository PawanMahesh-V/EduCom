import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const StatCard = ({ title, value, icon, color, subtitle }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color || 'var(--color-primary)' }}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="stat-content">
        <h3>{typeof value === 'number' ? value.toLocaleString() : value}</h3>
        <p className="stat-title">{title}</p>
        {subtitle && <p className="stat-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
