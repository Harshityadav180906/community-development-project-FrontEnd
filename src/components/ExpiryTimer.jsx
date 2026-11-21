import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react';

const ExpiryTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

  function calculateTimeLeft() {
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) {
      return { expired: true, totalMs: 0, text: 'Expired' };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const isUrgent = diff <= 2 * 60 * 60 * 1000; // Under 2 hours remaining

    let text = '';
    if (hours > 0) {
      text = `${hours}h ${minutes}m left`;
    } else if (minutes > 0) {
      text = `${minutes}m ${seconds}s left`;
    } else {
      text = `${seconds}s left`;
    }

    return {
      expired: false,
      isUrgent,
      totalMs: diff,
      text,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  if (timeLeft.expired) {
    return (
      <span className="expiry-timer timer-expired">
        <AlertCircle size={13} />
        <span>Expired</span>
      </span>
    );
  }

  return (
    <span className={`expiry-timer ${timeLeft.isUrgent ? 'timer-urgent' : ''}`}>
      {timeLeft.isUrgent ? <AlertTriangle size={13} /> : <Clock size={13} />}
      <span>{timeLeft.text}</span>
    </span>
  );
};

export default ExpiryTimer;
