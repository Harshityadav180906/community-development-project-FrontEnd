import React from 'react';

const StatCard = ({ number, label, description, icon, theme = 'primary' }) => {
  const formattedNumber =
    typeof number === 'number' ? number.toLocaleString() : number;

  return (
    <div className="stat-card">
      <div className={`stat-icon-wrapper ${theme}`}>{icon}</div>
      <div className="stat-info">
        <span className="stat-number">{formattedNumber}</span>
        <span className="stat-label">{label}</span>
        {description && <span className="stat-desc">{description}</span>}
      </div>
    </div>
  );
};

export default StatCard;
