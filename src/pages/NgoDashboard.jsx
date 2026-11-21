import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Building,
  Award,
  ArrowRight,
  Utensils,
  Leaf,
  Calendar,
  Navigation,
  Map,
  RotateCw,
  LocateFixed,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  MessageSquare,
  Smartphone,
  Send,
  Loader2,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ExpiryTimer from '../components/ExpiryTimer';
import RescueMap from '../components/RescueMap';
import LocationPickerModal from '../components/LocationPickerModal';

const NgoDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'map', 'history'
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [autoAssigningId, setAutoAssigningId] = useState(null);
  const [selectedMapMissionId, setSelectedMapMissionId] = useState(null);
  const [customNgoCoords, setCustomNgoCoords] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [resendingSmsId, setResendingSmsId] = useState(null);
  const [smsToast, setSmsToast] = useState('');

  // Helper to cleanly format phone number without duplicate +91 +91
  const formatPhone = (rawPhone) => {
    if (!rawPhone || typeof rawPhone !== 'string') return '+91 99887 76655';
    const cleaned = rawPhone.replace(/^(\+?91\s*)+/g, '').replace(/[^\d]/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return `+91 ${cleaned}`;
  };

  // Auto-detect real device GPS coordinates for NGO shelter on mount
  const handleDetectNgoGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const sub = data.address?.suburb || data.address?.neighbourhood || data.address?.road || '';
            const city = data.address?.city || data.address?.town || data.address?.state_district || '';
            const addr = sub && city ? `${sub}, ${city}` : data.display_name?.split(',').slice(0, 3).join(', ') || 'Shelter Location';
            setCustomNgoCoords({ latitude: lat, longitude: lng, address: addr });
            api.patch('/auth/me/location', { latitude: lat, longitude: lng, address: addr, locality: sub || city, city }).catch(() => {});
            return;
          }
        } catch (e) {}
        setCustomNgoCoords({ latitude: lat, longitude: lng, address: `Device GPS (${lat}, ${lng})` });
      },
      () => {},
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleResendSmsOtp = async (listingId) => {
    try {
      setResendingSmsId(listingId);
      const res = await api.post(`/food/${listingId}/resend-sms-otp`);
      if (res.data?.success) {
        setSmsToast(`📲 SMS Handover OTP ${res.data.deliveryOtp} sent to ${formatPhone(res.data.smsDispatch?.phone)}!`);
        await fetchClaims();
        setTimeout(() => setSmsToast(''), 4500);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch SMS notification.');
    } finally {
      setResendingSmsId(null);
    }
  };

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await api.get('/food/my-claims');
      if (res.data?.data) {
        setClaims(res.data.data);
        if (res.data.data.length > 0 && !selectedMapMissionId) {
          const firstActive = res.data.data.find(
            (c) => c.status === 'Claimed' || c.status === 'Picked Up'
          );
          if (firstActive) setSelectedMapMissionId(firstActive._id);
        }
      }
    } catch (err) {
      console.error('Fetch claims error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
    // Auto detect NGO device location on load
    handleDetectNgoGps();
  }, []);

  const handleUpdateStatus = async (listingId, newStatus) => {
    try {
      setUpdatingId(listingId);
      const res = await api.patch(`/food/${listingId}/status`, { status: newStatus });
      if (res.data?.data) {
        setClaims((prev) =>
          prev.map((item) => (item._id === listingId ? res.data.data : item))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update pickup status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Trigger auto-assigning nearest delivery partner
  const handleAutoAssignDriver = async (listingId) => {
    try {
      setAutoAssigningId(listingId);
      const res = await api.post(`/delivery/auto-assign/${listingId}`);
      if (res.data?.success && res.data.data) {
        setClaims((prev) =>
          prev.map((item) => (item._id === listingId ? res.data.data : item))
        );
        alert(res.data.message);
      } else {
        alert(res.data?.message || 'No available delivery partners online nearby.');
      }
    } catch (err) {
      alert('Error assigning driver.');
    } finally {
      setAutoAssigningId(null);
    }
  };

  // Group active pickups (Claimed or Picked Up) vs Completed
  const activePickups = claims.filter(
    (c) => c.status === 'Claimed' || c.status === 'Picked Up'
  );
  const completedRescues = claims.filter((c) => c.status === 'Completed');

  const totalMealsRescuedByNgo = completedRescues.reduce(
    (acc, curr) => acc + curr.quantityServings,
    0
  );
  const totalCo2PreventedKg = Math.round(totalMealsRescuedByNgo * 2.5);

  const calcDistKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  const selectedMission =
    activePickups.find((m) => m._id === selectedMapMissionId) || activePickups[0];

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-title-row">
            <div>
              <h1>NGO Food Rescue Command Hub</h1>
              <p style={{ color: 'var(--text-muted)' }}>
                Welcome, <strong>{user?.name}</strong> • {user?.organizationName}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={fetchClaims} className="btn btn-secondary btn-sm" title="Refresh Live Orders">
                <RotateCw size={14} />
                Refresh
              </button>
              <Link to="/feed" className="btn btn-accent btn-sm">
                <Utensils size={16} />
                Browse & Claim Food
              </Link>
            </div>
          </div>
        </div>

        {/* Overview Metrics Bar */}
        <div className="ngo-overview-bar">
          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Active In-Progress Pickups
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F59E0B' }}>
              {activePickups.length}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Total Meals Delivered
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-deep)' }}>
              {totalMealsRescuedByNgo.toLocaleString()}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Estimated CO₂ Saved
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>
              {totalCo2PreventedKg.toLocaleString()} kg
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <Truck size={18} />
            <span>Active Pickups</span>
            <span className="tab-badge">{activePickups.length}</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            <Map size={18} />
            <span>Live Rescue Map & Fleet</span>
            <span className="tab-badge" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
              Live GPS
            </span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Award size={18} />
            <span>Completed Rescues History</span>
            <span className="tab-badge">{completedRescues.length}</span>
          </button>
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <span className="spinner"></span>
            <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>
              Retrieving live orders & delivery fleet...
            </p>
          </div>
        ) : (
          <>
            {/* TAB 1: ACTIVE PICKUPS LIST */}
            {activeTab === 'active' && (
              <div>
                {smsToast && (
                  <div
                    style={{
                      backgroundColor: '#DCFCE7',
                      color: '#166534',
                      border: '1.5px solid #86EFAC',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1.25rem',
                      marginBottom: '1.25rem',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <Smartphone size={20} color="#166534" />
                    <span>{smsToast}</span>
                  </div>
                )}
                {activePickups.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    {activePickups.map((item) => {
                      const isPickedUp = item.status === 'Picked Up';
                      const driver = item.assignedDriver;

                      return (
                        <div
                          key={item._id}
                          className={`pickup-card ${isPickedUp ? 'picked-up' : ''}`}
                        >
                          <div className="pickup-card-header">
                            <div className="pickup-title-group">
                              <h3>{item.title}</h3>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  fontSize: '0.875rem',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color:
                                      item.foodType === 'Veg'
                                        ? 'var(--food-veg-color)'
                                        : 'var(--food-nonveg-color)',
                                  }}
                                >
                                  {item.foodType}
                                </span>
                                <span>•</span>
                                <span>
                                  <strong>{item.quantityServings}</strong> Servings
                                </span>
                                <span>•</span>
                                <span>Locality: {item.locality}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <StatusBadge status={item.status} />
                              <ExpiryTimer expiresAt={item.expiresAt} />
                            </div>
                          </div>

                          {/* 2-Column Details: 1. Donor Info and 2. Delivery Partner Info */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '1.25rem',
                            }}
                          >
                            {/* Donor Details Box */}
                            <div className="donor-details-box">
                              <span className="donor-box-title">
                                <Building size={14} />
                                Donor Pickup Location
                              </span>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem' }}>
                                <div>
                                  <strong style={{ color: 'var(--primary-deep)' }}>
                                    {item.donor?.organizationName}
                                  </strong>{' '}
                                  ({item.donor?.name})
                                </div>
                                <div>
                                  Phone:{' '}
                                  <a
                                    href={`tel:${item.contactPhone || item.donor?.phone}`}
                                    className="info-phone"
                                  >
                                    <Phone size={13} style={{ display: 'inline', marginRight: '4px' }} />
                                    {item.contactPhone || item.donor?.phone}
                                  </a>
                                </div>
                                <div>
                                  <MapPin size={13} style={{ display: 'inline', marginRight: '4px', color: 'var(--accent)' }} />
                                  {item.pickupAddress}
                                </div>
                              </div>
                            </div>

                            {/* Assigned Delivery Partner Box */}
                            <div
                              style={{
                                backgroundColor: driver ? '#FFFBEB' : 'var(--bg-cream)',
                                border: `1px solid ${driver ? '#FDE68A' : 'var(--border-light)'}`,
                                borderRadius: 'var(--radius-md)',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    color: driver ? '#92400E' : 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    marginBottom: '0.5rem',
                                  }}
                                >
                                  <Truck size={14} />
                                  Assigned Delivery Partner
                                </span>

                                {driver ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.875rem' }}>
                                    <div>
                                      <strong style={{ color: '#92400E' }}>{driver.name}</strong> •{' '}
                                      <span style={{ fontSize: '0.8rem', color: '#78350F' }}>
                                        {driver.vehicleType} ({driver.vehicleNumber || 'KA-Fleet'})
                                      </span>
                                    </div>
                                    <div>
                                      Phone:{' '}
                                      <a
                                        href={`tel:${driver.phone}`}
                                        style={{ color: '#92400E', fontWeight: 700, textDecoration: 'underline' }}
                                      >
                                        📞 {driver.phone}
                                      </a>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#B45309' }}>
                                      Live GPS: {driver.currentLocation?.latitude?.toFixed(4)},{' '}
                                      {driver.currentLocation?.longitude?.toFixed(4)}
                                    </div>
                                    {/* 15 km Radius Notice */}
                                    {(() => {
                                      const dist = driver.currentLocation?.latitude
                                        ? calcDistKm(
                                            driver.currentLocation.latitude,
                                            driver.currentLocation.longitude,
                                            item.pickupCoordinates?.latitude,
                                            item.pickupCoordinates?.longitude
                                          )
                                        : 0;
                                      return dist > 15 ? (
                                        <div
                                          style={{
                                            backgroundColor: '#EFF6FF',
                                            border: '1px solid #BFDBFE',
                                            color: '#1E40AF',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: 'var(--radius-sm)',
                                            marginTop: '0.25rem',
                                          }}
                                        >
                                          🚀 Outside 15 km Radius ({dist} km) — We are coming to your area soon!
                                        </div>
                                      ) : (
                                        <div
                                          style={{
                                            backgroundColor: '#ECFDF5',
                                            border: '1px solid #A7F3D0',
                                            color: '#065F46',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: 'var(--radius-sm)',
                                            marginTop: '0.25rem',
                                          }}
                                        >
                                          ✓ Within 15 km Delivery Radius ({dist} km)
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    No delivery partner bound yet.
                                  </div>
                                )}
                              </div>

                              <div style={{ marginTop: '0.75rem' }}>
                                {!driver ? (
                                  <button
                                    onClick={() => handleAutoAssignDriver(item._id)}
                                    disabled={autoAssigningId === item._id}
                                    className="btn btn-accent btn-sm"
                                  >
                                    <LocateFixed size={14} />
                                    {autoAssigningId === item._id ? 'Assigning...' : 'Auto-Assign Nearest Partner'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedMapMissionId(item._id);
                                      setActiveTab('map');
                                    }}
                                    className="btn btn-secondary btn-sm"
                                  >
                                    <Map size={14} />
                                    Track on Live Map
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Handover Security OTP Box for Drop-off Verification */}
                          <div
                            style={{
                              backgroundColor: item.otpVerified ? '#ECFDF5' : '#EFF6FF',
                              border: `1.5px solid ${item.otpVerified ? '#A7F3D0' : '#BFDBFE'}`,
                              borderRadius: 'var(--radius-md)',
                              padding: '1rem 1.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '1rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '50%',
                                  backgroundColor: item.otpVerified ? '#059669' : '#2563EB',
                                  color: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <KeyRound size={20} />
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <strong style={{ fontSize: '0.95rem', color: item.otpVerified ? '#065F46' : '#1E3A8A' }}>
                                    Delivery Handover OTP for Rider
                                  </strong>
                                  <span
                                    style={{
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      padding: '0.15rem 0.5rem',
                                      borderRadius: 'var(--radius-full)',
                                      backgroundColor: item.otpVerified ? '#DCFCE7' : '#DBEAFE',
                                      color: item.otpVerified ? '#166534' : '#1E40AF',
                                    }}
                                  >
                                    {item.otpVerified ? '✓ Verified by Rider' : '🔑 Required at Dropoff'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  <Smartphone size={13} style={{ color: '#2563EB', display: 'inline' }} />
                                  <span>
                                    Dispatched via SMS to NGO phone: <strong>{formatPhone(item.smsDispatch?.phone || user?.phone)}</strong>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleResendSmsOtp(item._id)}
                                    disabled={resendingSmsId === item._id || item.otpVerified}
                                    style={{
                                      border: '1px solid #BFDBFE',
                                      backgroundColor: '#EFF6FF',
                                      color: '#1D4ED8',
                                      borderRadius: '4px',
                                      padding: '0.15rem 0.45rem',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: item.otpVerified ? 'not-allowed' : 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                    }}
                                  >
                                    {resendingSmsId === item._id ? <Loader2 size={11} className="spin-animate" /> : <Send size={11} />}
                                    {resendingSmsId === item._id ? 'Sending...' : 'Resend SMS'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>
                                  Share with Rider:
                                </span>
                                <span
                                  style={{
                                    fontSize: '1.4rem',
                                    fontWeight: 900,
                                    fontFamily: 'monospace',
                                    letterSpacing: '0.25em',
                                    backgroundColor: item.otpVerified ? '#D1FAE5' : '#FFFFFF',
                                    color: item.otpVerified ? '#047857' : '#1D4ED8',
                                    padding: '0.3rem 0.85rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: `1.5px dashed ${item.otpVerified ? '#10B981' : '#3B82F6'}`,
                                    display: 'inline-block',
                                  }}
                                >
                                  {item.deliveryOtp || '----'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Pickup Action Progress */}
                          <div className="pickup-actions-row">
                            <div className="status-timeline">
                              <span className="timeline-step active">
                                <CheckCircle2 size={14} color="#10B981" />
                                1. Claimed
                              </span>
                              <span className="timeline-arrow">→</span>
                              <span className={`timeline-step ${isPickedUp ? 'active' : ''}`}>
                                {isPickedUp ? (
                                  <CheckCircle2 size={14} color="#2563EB" />
                                ) : (
                                  <Clock size={14} />
                                )}
                                2. Picked Up (In Transit)
                              </span>
                              <span className="timeline-arrow">→</span>
                              <span className="timeline-step">
                                <Award size={14} />
                                3. Delivered
                              </span>
                            </div>

                            <div>
                              {!isPickedUp ? (
                                <button
                                  onClick={() => handleUpdateStatus(item._id, 'Picked Up')}
                                  disabled={updatingId === item._id}
                                  className="btn btn-primary btn-sm"
                                >
                                  {updatingId === item._id ? 'Updating...' : 'Mark as Picked Up'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateStatus(item._id, 'Completed')}
                                  disabled={updatingId === item._id}
                                  className="btn btn-accent btn-sm"
                                >
                                  {updatingId === item._id ? 'Completing...' : 'Mark as Delivered'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-feed">
                    <Truck size={36} style={{ color: 'var(--primary)' }} />
                    <h3>No Active Pickups</h3>
                    <p>
                      Your rescue team currently has no active food claims in transit.
                      Browse the live feed to claim available food batches.
                    </p>
                    <Link to="/feed" className="btn btn-primary">
                      <Utensils size={16} />
                      View Live Food Feed
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: LIVE RESCUE MAP & FLEET */}
            {activeTab === 'map' && (
              <div>
                {activePickups.length > 0 ? (
                  <div>
                    {/* Order Selector Pills */}
                    {activePickups.length > 1 && (
                      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {activePickups.map((m) => (
                          <button
                            key={m._id}
                            onClick={() => setSelectedMapMissionId(m._id)}
                            className={`btn btn-sm ${
                              (selectedMission?._id === m._id) ? 'btn-primary' : 'btn-secondary'
                            }`}
                          >
                            <Truck size={14} />
                            {m.title.slice(0, 24)}...
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedMission && (
                      <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div>
                            <h2 style={{ fontSize: '1.35rem', color: 'var(--primary-deep)', margin: 0 }}>
                              {selectedMission.title}
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              From <strong>{selectedMission.donor?.organizationName}</strong> to{' '}
                              <strong>{user?.organizationName}</strong>
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setShowLocationModal(true)}
                              className="btn btn-secondary btn-sm"
                            >
                              📍 Set Shelter Location (Google Map / Manual)
                            </button>
                            <StatusBadge status={selectedMission.status} />
                          </div>
                        </div>

                        {/* Interactive Map Component */}
                        <RescueMap
                          donorLocation={{
                            latitude: selectedMission.pickupCoordinates?.latitude,
                            longitude: selectedMission.pickupCoordinates?.longitude,
                            name: selectedMission.donor?.organizationName,
                            address: selectedMission.pickupAddress,
                          }}
                          driverLocation={
                            selectedMission.assignedDriver
                              ? {
                                  latitude: selectedMission.assignedDriver.currentLocation?.latitude,
                                  longitude: selectedMission.assignedDriver.currentLocation?.longitude,
                                  name: selectedMission.assignedDriver.name,
                                  vehicleType: selectedMission.assignedDriver.vehicleType,
                                  vehicleNumber: selectedMission.assignedDriver.vehicleNumber,
                                  phone: selectedMission.assignedDriver.phone,
                                }
                              : null
                          }
                          ngoLocation={{
                            latitude:
                              customNgoCoords?.latitude ||
                              selectedMission.deliveryCoordinates?.latitude ||
                              user?.currentLocation?.latitude ||
                              (selectedMission.pickupCoordinates?.latitude ? selectedMission.pickupCoordinates.latitude + 0.015 : 28.6139),
                            longitude:
                              customNgoCoords?.longitude ||
                              selectedMission.deliveryCoordinates?.longitude ||
                              user?.currentLocation?.longitude ||
                              (selectedMission.pickupCoordinates?.longitude ? selectedMission.pickupCoordinates.longitude + 0.012 : 77.2090),
                            name: user?.organizationName || 'Shelter',
                            address: customNgoCoords?.address || selectedMission.deliveryCoordinates?.address || `${user?.locality || 'Shelter'}, ${user?.city || ''}`,
                          }}
                          title={`Live Route Tracking: ${selectedMission.title}`}
                          height="440px"
                          onRefreshLocation={fetchClaims}
                          onOpenLocationPicker={() => setShowLocationModal(true)}
                        />

                        {/* Delivery Partner Live Card Under Map */}
                        {selectedMission.assignedDriver ? (
                          <div
                            style={{
                              marginTop: '1.25rem',
                              backgroundColor: '#FFFBEB',
                              border: '1px solid #FDE68A',
                              borderRadius: 'var(--radius-md)',
                              padding: '1rem 1.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '1rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--accent)',
                                  color: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Truck size={20} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#92400E' }}>
                                  {selectedMission.assignedDriver.name} ({selectedMission.assignedDriver.vehicleType})
                                </div>
                                <div style={{ fontSize: '0.825rem', color: '#78350F' }}>
                                  Reg: <strong>{selectedMission.assignedDriver.vehicleNumber || 'KA-Fleet'}</strong> •{' '}
                                  GPS: {selectedMission.assignedDriver.currentLocation?.latitude?.toFixed(4)},{' '}
                                  {selectedMission.assignedDriver.currentLocation?.longitude?.toFixed(4)}
                                </div>
                              </div>
                            </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <div
                                  style={{
                                    backgroundColor: selectedMission.otpVerified ? '#D1FAE5' : '#DBEAFE',
                                    border: `1px solid ${selectedMission.otpVerified ? '#10B981' : '#3B82F6'}`,
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  <KeyRound size={14} style={{ color: selectedMission.otpVerified ? '#047857' : '#1D4ED8' }} />
                                  <span>
                                    Handover OTP:{' '}
                                    <strong style={{ fontFamily: 'monospace', letterSpacing: '0.15em', fontSize: '0.95rem' }}>
                                      {selectedMission.deliveryOtp || '8291'}
                                    </strong>{' '}
                                    ({selectedMission.otpVerified ? 'Verified' : 'SMS sent to NGO'})
                                  </span>
                                </div>
                                <a
                                  href={`tel:${selectedMission.assignedDriver.phone}`}
                                  className="btn btn-accent btn-sm"
                                >
                                  <Phone size={14} />
                                  Call Driver ({selectedMission.assignedDriver.phone})
                                </a>
                              </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              marginTop: '1.25rem',
                              padding: '1rem',
                              backgroundColor: 'var(--bg-cream)',
                              border: '1px solid var(--border-light)',
                              borderRadius: 'var(--radius-md)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>No delivery partner assigned yet for this batch.</span>
                            <button
                              onClick={() => handleAutoAssignDriver(selectedMission._id)}
                              disabled={autoAssigningId === selectedMission._id}
                              className="btn btn-primary btn-sm"
                            >
                              <LocateFixed size={14} />
                              {autoAssigningId === selectedMission._id ? 'Assigning...' : 'Auto-Assign Nearest Partner'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-feed">
                    <Map size={42} style={{ color: 'var(--primary)' }} />
                    <h3>No Active Food Orders to Map</h3>
                    <p>
                      Claim a food listing from the live feed to see the donor, NGO, and
                      auto-assigned delivery partner on the live interactive map.
                    </p>
                    <Link to="/feed" className="btn btn-primary">
                      Browse Food Feed
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: COMPLETED RESCUES HISTORY */}
            {activeTab === 'history' && (
              <div>
                {completedRescues.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {completedRescues.map((item) => (
                      <div key={item._id} className="pickup-card completed">
                        <div className="pickup-card-header">
                          <div>
                            <h3>{item.title}</h3>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                fontSize: '0.875rem',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <span style={{ fontWeight: 700, color: 'var(--primary-deep)' }}>
                                {item.quantityServings} Servings Rescued
                              </span>
                              <span>•</span>
                              <span>Donor: {item.donor?.organizationName}</span>
                              <span>•</span>
                              <span>Locality: {item.locality}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <StatusBadge status="Completed" />
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid var(--border-subtle)',
                            fontSize: '0.85rem',
                            color: 'var(--text-muted)',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Calendar size={14} />
                            <span>
                              Delivered on{' '}
                              {new Date(item.updatedAt).toLocaleDateString([], {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              at{' '}
                              {new Date(item.updatedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 600 }}>
                            <Leaf size={14} />
                            <span>
                              ~{(item.quantityServings * 2.5).toFixed(0)} kg CO₂ prevented
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-feed">
                    <Award size={36} style={{ color: 'var(--primary-light)' }} />
                    <h3>No Completed Rescues Recorded Yet</h3>
                    <p>
                      Once your team picks up and delivers claimed food, your completed
                      missions and cumulative impact stats will show here!
                    </p>
                    <Link to="/feed" className="btn btn-outline">
                      Browse Feed
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        initialCoords={
          customNgoCoords ||
          (user?.currentLocation?.latitude ? user.currentLocation : null)
        }
        title="📍 Search Any City or Pick NGO Shelter Location on Map"
        onSelectLocation={(coords) => {
          setCustomNgoCoords({
            latitude: coords.latitude,
            longitude: coords.longitude,
            address: coords.address || 'Custom Shelter Pin',
          });
          api.patch('/auth/me/location', {
            latitude: coords.latitude,
            longitude: coords.longitude,
            address: coords.address || 'Custom Shelter Pin',
          }).catch(() => {});
        }}
      />
    </div>
  );
};

export default NgoDashboard;
