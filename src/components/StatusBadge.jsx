import React from 'react';
import { CheckCircle2, Clock, Truck, Award, AlertCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'Available':
        return {
          className: 'status-available',
          icon: <CheckCircle2 size={13} />,
          label: 'Available',
        };
      case 'Claimed':
        return {
          className: 'status-claimed',
          icon: <Clock size={13} />,
          label: 'Claimed',
        };
      case 'Picked Up':
        return {
          className: 'status-picked-up',
          icon: <Truck size={13} />,
          label: 'Picked Up',
        };
      case 'Completed':
        return {
          className: 'status-completed',
          icon: <Award size={13} />,
          label: 'Completed',
        };
      case 'Expired':
        return {
          className: 'status-expired',
          icon: <AlertCircle size={13} />,
          label: 'Expired',
        };
      default:
        return {
          className: '',
          icon: null,
          label: status,
        };
    }
  };

  const { className, icon, label } = getStatusConfig();

  return (
    <span className={`status-badge ${className}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
