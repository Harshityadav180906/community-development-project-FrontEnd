import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Building,
  Phone,
  Navigation,
  CheckCircle2,
  Clock,
  Award,
  LocateFixed,
  Radio,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Edit3,
  X,
  Compass,
  Check,
  Zap,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import RescueMap from '../components/RescueMap';
import StatusBadge from '../components/StatusBadge';
import LocationPickerModal from '../components/LocationPickerModal';

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [missions, setMissions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Driver GPS & Manual Location State
  const [liveLocation, setLiveLocation] = useState(
    user?.currentLocation || { latitude: 12.975, longitude: 77.635 }
  );
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [gpsStatusText, setGpsStatusText] = useState('Location active');
  const [watchId, setWatchId] = useState(null);

  // Location Picker Modal State
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Fetch active missions
  const fetchAssignedMissions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/delivery/me/assigned');
      if (res.data?.data) {
        setMissions(res.data.data);
      }
    } catch (err) {
      console.error('Fetch assigned missions error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch history
  const fetchHistory = async () => {
    try {
      const res = await api.get('/delivery/me/history');
      if (res.data?.data) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.error('Fetch delivery history error:', err);
    }
  };

  useEffect(() => {
    fetchAssignedMissions();
    fetchHistory();
  }, []);

  // Update Location on Backend
  const updateBackendLocation = async (lat, lng, address = '') => {
    try {
      await api.patch('/delivery/me/location', {
        latitude: lat,
        longitude: lng,
        address,
      });
    } catch (err) {
      console.warn('Backend location sync notice:', err.message);
    }
  };

  // Auto-Detect Real Device GPS
  const syncCurrentGps = () => {
    if (!navigator.geolocation) {
      setGpsStatusText('Geolocation unsupported in this browser.');
      return;
    }

    setIsManualOverride(false);
    setGpsStatusText('Acquiring high-accuracy device GPS fix...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        const updated = { latitude: lat, longitude: lng };
        setLiveLocation(updated);
        setGpsStatusText(`Device GPS: ${lat}, ${lng} (±${Math.round(pos.coords.accuracy)}m)`);
        updateBackendLocation(lat, lng, 'Device GPS Live Fix');
      },
      (err) => {
        setGpsStatusText('Could not access device GPS. You can enter location manually or via Google Map.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Apply Selected Location (from Google Map link, map pin, or manual inputs)
  const handleApplyLocation = (selectedCoords) => {
    const lat = Number(Number(selectedCoords.latitude).toFixed(4));
    const lng = Number(Number(selectedCoords.longitude).toFixed(4));
    const addr = selectedCoords.address || 'Custom Pin / Google Map Location';

    if (isNaN(lat) || isNaN(lng)) {
      alert('Please provide valid decimal coordinates.');
      return;
    }

    setIsManualOverride(true);
    setLiveLocation({
      latitude: lat,
      longitude: lng,
      address: addr,
    });
    setGpsStatusText(`Manual Location: ${lat}, ${lng} (${addr})`);
    updateBackendLocation(lat, lng, addr);
  };

  // Quick 1-click snap near donor kitchen (for instant demonstration of local city turnaround)
  const handleSnapNearDonor = (donorCoords) => {
    const lat = donorCoords?.latitude ? Number((donorCoords.latitude + 0.012).toFixed(4)) : 12.9450;
    const lng = donorCoords?.longitude ? Number((donorCoords.longitude - 0.008).toFixed(4)) : 77.6320;
    handleApplyLocation({
      latitude: lat,
      longitude: lng,
      address: 'Koramangala Hub (~2.2 km from kitchen)',
    });
  };

  // Watch position only if not manually overridden
  useEffect(() => {
    if (navigator.geolocation && !isManualOverride) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          if (!isManualOverride) {
            const lat = Number(pos.coords.latitude.toFixed(4));
            const lng = Number(pos.coords.longitude.toFixed(4));
            setLiveLocation({ latitude: lat, longitude: lng });
            updateBackendLocation(lat, lng);
          }
        },
        null,
        { enableHighAccuracy: true, maximumAge: 30000 }
      );
      setWatchId(id);
    }

    return () => {
      if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isManualOverride]);

  // Toggle Driver Online / Offline Availability
  const handleToggleAvailability = async () => {
    try {
      const nextState = !isAvailable;
      setIsAvailable(nextState);
      await api.patch('/delivery/me/availability', { isAvailable: nextState });
    } catch (err) {
      alert('Failed to update availability status.');
    }
  };

  // Update Mission Status Progression
  const handleUpdateMissionStatus = async (missionId, newStatus) => {
    try {
      setUpdatingId(missionId);
      const res = await api.patch(`/delivery/${missionId}/status`, { status: newStatus });
      if (res.data?.data) {
        await fetchAssignedMissions();
        await fetchHistory();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update mission status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const totalDeliveredMeals = history.reduce((acc, curr) => acc + curr.quantityServings, 0);

  // Check if first active mission is in another region (> 50 km away)
  const firstMission = missions[0];
  const donorLat = firstMission?.pickupCoordinates?.latitude;
  const donorLng = firstMission?.pickupCoordinates?.longitude;
  const isInterCityDistance =
    donorLat &&
    donorLng &&
    Math.abs(liveLocation.latitude - donorLat) > 0.5; // Roughly > 55 km difference

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header & Status Bar */}
        <div className="dashboard-header">
          <div className="dashboard-title-row">
            <div>
              <h1>Delivery Partner Command Center</h1>
              <p style={{ color: 'var(--text-muted)' }}>
                Rider: <strong>{user?.name}</strong> • {user?.vehicleType || 'Two-Wheeler'} ({user?.vehicleNumber || 'KA-Fleet'})
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleToggleAvailability}
                className={`btn btn-sm ${isAvailable ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  backgroundColor: isAvailable ? '#059669' : '#6B7280',
                  color: '#FFFFFF',
                  borderColor: isAvailable ? '#059669' : '#6B7280',
                }}
              >
                <Radio size={14} />
                {isAvailable ? 'Duty: ONLINE (Ready)' : 'Duty: OFFLINE (Paused)'}
              </button>

              {/* Set Location via Google Map & Pins Button */}
              <button
                onClick={() => setShowLocationModal(true)}
                className="btn btn-primary btn-sm"
                title="Paste Google Maps URL, drag pin, or type manual coordinates"
              >
                <Edit3 size={14} />
                Set Location (Google Map / Manual)
              </button>

              <button
                onClick={syncCurrentGps}
                className={`btn btn-sm ${!isManualOverride ? 'btn-primary' : 'btn-secondary'}`}
                title="Detect device GPS"
              >
                <LocateFixed size={14} />
                Auto-Device GPS
              </button>
            </div>
          </div>

          {/* GPS Status Banner */}
          <div
            style={{
              marginTop: '1rem',
              padding: '0.65rem 1rem',
              backgroundColor: isManualOverride ? '#FEF3C7' : '#ECFDF5',
              border: `1px solid ${isManualOverride ? '#FDE68A' : '#A7F3D0'}`,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              color: isManualOverride ? '#92400E' : '#065F46',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                className="live-dot-pulse"
                style={{ backgroundColor: isManualOverride ? '#F59E0B' : '#10B981' }}
              ></span>
              <strong>{isManualOverride ? '📍 Manual Location Mode:' : '🛰️ Live Device GPS:'}</strong>
              <span>{gpsStatusText}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => setShowLocationModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isManualOverride ? '#92400E' : '#065F46',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                Change Location / Google Map Pin
              </button>
            </div>
          </div>

          {/* Inter-City Distance Notice & 1-Click Fix */}
          {isInterCityDistance && (
            <div
              className="alert alert-info"
              style={{
                marginTop: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                backgroundColor: '#FFFBEB',
                borderColor: '#FDE68A',
                color: '#92400E',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} style={{ color: '#D97706' }} />
                <span>
                  Your device GPS is in another city (~1,700 km away). Click below to simulate a local delivery right next to the kitchen:
                </span>
              </div>
              <button
                onClick={() => handleSnapNearDonor(firstMission?.pickupCoordinates)}
                className="btn btn-sm"
                style={{
                  backgroundColor: '#D97706',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  border: 'none',
                }}
              >
                ⚡ Snap Near Donor Kitchen (~2.2 km away)
              </button>
            </div>
          )}
        </div>

        {/* Overview Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Dispatch Missions</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#E76F51' }}>
              {missions.length}
            </div>
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Completed Rescues</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-deep)' }}>
              {history.length}
            </div>
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Servings Transported</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>
              {totalDeliveredMeals.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <Truck size={18} />
            <span>Active Missions</span>
            <span className="tab-badge">{missions.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Award size={18} />
            <span>Delivery History</span>
            <span className="tab-badge">{history.length}</span>
          </button>
        </div>

        {/* TAB 1: ACTIVE MISSIONS */}
        {activeTab === 'active' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <span className="spinner"></span>
                <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>
                  Loading assigned dispatch routes...
                </p>
              </div>
            ) : missions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {missions.map((mission) => {
                  const driverStatus = mission.driverStatus || 'Assigned';
                  const isHeadingToPickup = driverStatus === 'Heading to Pickup';
                  const isPickedUp = driverStatus === 'Picked Up';

                  return (
                    <div
                      key={mission._id}
                      className="card"
                      style={{
                        padding: '1.75rem',
                        borderLeft: '5px solid var(--accent)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                      }}
                    >
                      {/* Mission Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span
                              style={{
                                backgroundColor: 'var(--accent-subtle)',
                                color: 'var(--accent-hover)',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.65rem',
                                borderRadius: 'var(--radius-full)',
                                textTransform: 'uppercase',
                              }}
                            >
                              Dispatch Order #{mission._id.slice(-6).toUpperCase()}
                            </span>
                            <StatusBadge status={mission.status} />
                          </div>
                          <h2 style={{ fontSize: '1.45rem', color: 'var(--primary-deep)', margin: '0.35rem 0' }}>
                            {mission.title}
                          </h2>
                          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            <span><strong>{mission.quantityServings}</strong> Servings ({mission.foodType})</span>
                            <span>•</span>
                            <span>Donor Locality: {mission.locality}</span>
                          </div>
                        </div>

                        {/* Status Progression Button */}
                        <div>
                          {driverStatus === 'Assigned' && (
                            <button
                              onClick={() => handleUpdateMissionStatus(mission._id, 'Heading to Pickup')}
                              disabled={updatingId === mission._id}
                              className="btn btn-accent btn-lg"
                            >
                              <Truck size={18} />
                              Start Pickup (Heading to Kitchen)
                            </button>
                          )}

                          {isHeadingToPickup && (
                            <button
                              onClick={() => handleUpdateMissionStatus(mission._id, 'Picked Up')}
                              disabled={updatingId === mission._id}
                              className="btn btn-primary btn-lg"
                            >
                              <CheckCircle2 size={18} />
                              Confirm Food Picked Up from Kitchen
                            </button>
                          )}

                          {isPickedUp && (
                            <button
                              onClick={() => handleUpdateMissionStatus(mission._id, 'Delivered')}
                              disabled={updatingId === mission._id}
                              className="btn btn-accent btn-lg"
                              style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                            >
                              <Award size={18} />
                              Confirm Safe Handover to NGO
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Interactive Rescue Map View (with real OpenStreetMap Street Tiles & Controls) */}
                      <RescueMap
                        donorLocation={{
                          latitude: mission.pickupCoordinates?.latitude,
                          longitude: mission.pickupCoordinates?.longitude,
                          name: mission.donor?.organizationName,
                          address: mission.pickupAddress,
                        }}
                        driverLocation={{
                          latitude: liveLocation.latitude,
                          longitude: liveLocation.longitude,
                          name: user?.name,
                          vehicleType: user?.vehicleType,
                          vehicleNumber: user?.vehicleNumber,
                          phone: user?.phone,
                        }}
                        ngoLocation={{
                          latitude: mission.deliveryCoordinates?.latitude,
                          longitude: mission.deliveryCoordinates?.longitude,
                          name: mission.claimedBy?.organizationName,
                          address: mission.deliveryCoordinates?.address,
                        }}
                        title={`Live Navigation: ${mission.title}`}
                        height="400px"
                        onRefreshLocation={syncCurrentGps}
                        onOpenLocationPicker={() => setShowLocationModal(true)}
                        onSnapNearKitchen={() => handleSnapNearDonor(mission.pickupCoordinates)}
                      />

                      {/* Route Details: 1. Pickup (Donor) and 2. Dropoff (NGO) */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '1.25rem',
                        }}
                      >
                        {/* Step 1: Donor Pickup Details */}
                        <div
                          style={{
                            backgroundColor: 'var(--bg-cream)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.25rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-deep)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.65rem' }}>
                            <span style={{ fontSize: '1rem' }}>🍽️</span>
                            STEP 1: PICKUP (Donor Kitchen)
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                            {mission.donor?.organizationName}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                            <MapPin size={13} style={{ display: 'inline', marginRight: '4px', color: 'var(--accent)' }} />
                            {mission.pickupAddress}
                          </div>
                          <div>
                            <a
                              href={`tel:${mission.contactPhone || mission.donor?.phone}`}
                              className="btn btn-outline btn-sm"
                            >
                              <Phone size={13} />
                              Call Donor ({mission.contactPhone || mission.donor?.phone})
                            </a>
                          </div>
                        </div>

                        {/* Step 2: NGO Drop-off Destination */}
                        <div
                          style={{
                            backgroundColor: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.25rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1E40AF', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.65rem' }}>
                            <span style={{ fontSize: '1rem' }}>🏢</span>
                            STEP 2: DROPOFF (Partner NGO)
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E3A8A', marginBottom: '0.35rem' }}>
                            {mission.claimedBy?.organizationName}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#4B5563', marginBottom: '0.65rem' }}>
                            <MapPin size={13} style={{ display: 'inline', marginRight: '4px', color: '#2563EB' }} />
                            {mission.deliveryCoordinates?.address || `${mission.claimedBy?.locality}, Bengaluru`}
                          </div>
                          <div>
                            <a
                              href={`tel:${mission.claimedBy?.phone}`}
                              className="btn btn-secondary btn-sm"
                            >
                              <Phone size={13} />
                              Call NGO ({mission.claimedBy?.phone})
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-feed">
                <Truck size={42} style={{ color: 'var(--accent)' }} />
                <h3>No Active Missions Assigned Right Now</h3>
                <p>
                  You are currently online and set to receive the nearest surplus food
                  dispatch orders as soon as NGOs claim them in your area.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button onClick={() => setShowLocationModal(true)} className="btn btn-primary">
                    <Edit3 size={16} />
                    Set Location (Google Map / Manual)
                  </button>
                  <button onClick={syncCurrentGps} className="btn btn-outline">
                    <LocateFixed size={16} />
                    Auto-Device GPS
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DELIVERY HISTORY */}
        {activeTab === 'history' && (
          <div>
            {history.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {history.map((item) => (
                  <div key={item._id} className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-deep)', margin: '0 0 0.35rem 0' }}>
                          {item.title}
                        </h3>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                          <span><strong>{item.quantityServings}</strong> Servings Delivered</span>
                          <span>•</span>
                          <span>From: {item.donor?.organizationName}</span>
                          <span>•</span>
                          <span>To: {item.claimedBy?.organizationName}</span>
                        </div>
                      </div>
                      <StatusBadge status="Completed" />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '1rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: '0.825rem',
                        color: 'var(--text-muted)',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={14} />
                        <span>
                          Delivered safely on{' '}
                          {item.deliveredAt
                            ? new Date(item.deliveredAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                            : new Date(item.updatedAt).toLocaleString()}
                        </span>
                      </div>

                      <div style={{ color: '#059669', fontWeight: 700 }}>
                        ✓ Food safely rescued & delivered
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-feed">
                <Award size={42} style={{ color: 'var(--primary-light)' }} />
                <h3>No Completed Rescues Recorded Yet</h3>
                <p>
                  As you complete your food pickup and handover missions, your delivered
                  stats and logs will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full-Featured Location Picker Modal (Google Maps + Interactive Pin + Manual Coordinates) */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        initialCoords={liveLocation}
        referenceCoords={firstMission?.pickupCoordinates}
        title="📍 Set Delivery Partner Location (Google Maps / Manual)"
        onSelectLocation={handleApplyLocation}
      />
    </div>
  );
};

export default DeliveryDashboard;
