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
  Wallet,
  Camera,
  KeyRound,
  CreditCard,
  DollarSign,
  QrCode,
  Sparkles,
  UploadCloud,
  Lock,
  RotateCw,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import RescueMap from '../components/RescueMap';
import StatusBadge from '../components/StatusBadge';
import LocationPickerModal from '../components/LocationPickerModal';
import Modal from '../components/Modal';

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [missions, setMissions] = useState([]);
  const [history, setHistory] = useState([]);
  const [wallet, setWallet] = useState({
    walletBalance: 0,
    totalEarnings: 0,
    completedDeliveriesCount: 0,
    payoutPerDelivery: 15,
  });
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

  // Handover Multi-Step Barrier States (per mission)
  const [otpInputs, setOtpInputs] = useState({});
  const [otpErrors, setOtpErrors] = useState({});
  const [verifyingOtpId, setVerifyingOtpId] = useState(null);

  const [paymentMethods, setPaymentMethods] = useState({}); // 'UPI' or 'Cash'
  const [confirmingPaymentId, setConfirmingPaymentId] = useState(null);

  const [photoFiles, setPhotoFiles] = useState({}); // base64
  const [photoPreviews, setPhotoPreviews] = useState({});
  const [uploadingProofId, setUploadingProofId] = useState(null);

  // Success Celebration Modal
  const [celebrationOrder, setCelebrationOrder] = useState(null);

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

  // Fetch Rider Wallet
  const fetchWallet = async () => {
    try {
      const res = await api.get('/delivery/me/wallet');
      if (res.data?.data) {
        setWallet(res.data.data);
      }
    } catch (err) {
      console.warn('Wallet fetch error:', err.message);
    }
  };

  useEffect(() => {
    fetchAssignedMissions();
    fetchHistory();
    fetchWallet();
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

  // Quick 1-click snap near donor kitchen (for instant demonstration of local turnaround)
  const handleSnapNearDonor = (donorCoords) => {
    const lat = donorCoords?.latitude ? Number((donorCoords.latitude + 0.012).toFixed(4)) : 12.945;
    const lng = donorCoords?.longitude ? Number((donorCoords.longitude - 0.008).toFixed(4)) : 77.632;
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

  // Step 1: Verify Dropoff Handover OTP
  const handleVerifyOtp = async (missionId) => {
    const enteredOtp = (otpInputs[missionId] || '').trim();
    if (!enteredOtp || enteredOtp.length !== 4) {
      setOtpErrors((prev) => ({
        ...prev,
        [missionId]: 'Please enter the 4-digit OTP provided by the recipient NGO.',
      }));
      return;
    }

    try {
      setVerifyingOtpId(missionId);
      setOtpErrors((prev) => ({ ...prev, [missionId]: '' }));
      const res = await api.post(`/delivery/${missionId}/verify-otp`, { otp: enteredOtp });
      if (res.data?.success) {
        await fetchAssignedMissions();
      }
    } catch (err) {
      setOtpErrors((prev) => ({
        ...prev,
        [missionId]: err.response?.data?.message || 'Invalid Handover OTP. Please verify with the recipient.',
      }));
    } finally {
      setVerifyingOtpId(null);
    }
  };

  // Step 2: Confirm ₹15 Handover Payment (UPI or Cash)
  const handleConfirmPayment = async (missionId) => {
    const method = paymentMethods[missionId] || 'UPI';
    try {
      setConfirmingPaymentId(missionId);
      const res = await api.post(`/delivery/${missionId}/confirm-payment`, {
        paymentMethod: method,
      });
      if (res.data?.success) {
        await fetchAssignedMissions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment confirmation failed.');
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  // Step 3: Handle Photo Selection / Camera Capture
  const handlePhotoCapture = (missionId, e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 12 * 1024 * 1024) {
        alert('Photo size is too large. Please select a photo under 12MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews((prev) => ({ ...prev, [missionId]: reader.result }));
        setPhotoFiles((prev) => ({ ...prev, [missionId]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 3: Upload Food Photo Proof and Finalize Order (+₹15 Rider Credit)
  const handleUploadProof = async (missionId) => {
    const photo = photoFiles[missionId];
    if (!photo) {
      alert('Please take or select a photo of the food handover first.');
      return;
    }

    try {
      setUploadingProofId(missionId);
      const res = await api.post(`/delivery/${missionId}/upload-proof`, { photo });
      if (res.data?.success) {
        setCelebrationOrder(res.data.data);
        await fetchAssignedMissions();
        await fetchHistory();
        await fetchWallet();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload handover photo proof.');
    } finally {
      setUploadingProofId(null);
    }
  };

  const totalDeliveredMeals = history.reduce((acc, curr) => acc + curr.quantityServings, 0);

  // Inter-city check for first mission
  const firstMission = missions[0];
  const donorLat = firstMission?.pickupCoordinates?.latitude;
  const donorLng = firstMission?.pickupCoordinates?.longitude;
  const isInterCityDistance =
    donorLat && donorLng && Math.abs(liveLocation.latitude - donorLat) > 0.5;

  return (
    <div className="dashboard-page delivery-dashboard">
      <div className="container">
        {/* Header & Status Bar */}
        <div className="dashboard-header">
          <div className="dashboard-title-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: '#FFFFFF',
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Delivery Fleet
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Active Partner Dispatch Portal
                </span>
              </div>
              <h1 style={{ margin: 0 }}>Delivery Partner Command Center</h1>
              <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
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

        {/* 4-KPI Overview Bar: Rider Wallet + Missions + Deliveries */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {/* Rider Live Wallet Card */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              backgroundColor: '#ECFDF5',
              borderColor: '#A7F3D0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#065F46', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Wallet size={15} />
                Rider Wallet Balance
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                ₹15 / ORDER
              </span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#047857' }}>
              ₹{wallet.walletBalance}.00
            </div>
            <div style={{ fontSize: '0.75rem', color: '#065F46', marginTop: '0.25rem' }}>
              Lifetime Earned: <strong>₹{wallet.totalEarnings}.00</strong>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Active Dispatch Missions
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#E76F51' }}>
              {missions.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Routes currently in progress
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Completed Rescues
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-deep)' }}>
              {wallet.completedDeliveriesCount || history.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem' }}>
              ✓ Handed over safely
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Total Servings Transported
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>
              {totalDeliveredMeals.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Feeding hungry communities
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
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

        {/* TAB 1: ACTIVE MISSIONS & GATED HANDOVER BARRIER */}
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
                  const isReachedDropoff = driverStatus === 'Reached Dropoff';

                  // Multi-Step Barrier Statuses
                  const otpVerified = !!mission.otpVerified;
                  const paymentDone = mission.paymentStatus && mission.paymentStatus !== 'Pending';
                  const selectedMethod = paymentMethods[mission._id] || 'UPI';
                  const currentPhotoPreview = photoPreviews[mission._id];

                  return (
                    <div
                      key={mission._id}
                      className="card mission-card"
                      style={{
                        padding: '1.75rem',
                        borderLeft: '5px solid var(--accent)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                      }}
                    >
                      {/* Mission Top Header */}
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
                              Order #{mission._id.slice(-6).toUpperCase()}
                            </span>
                            <StatusBadge status={mission.status} />
                            <span
                              style={{
                                backgroundColor: '#FEF3C7',
                                color: '#92400E',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.5rem',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              💰 ₹15.00 Payout Upon Handover
                            </span>
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

                        {/* Progression Action Buttons */}
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
                              onClick={() => handleUpdateMissionStatus(mission._id, 'Reached Dropoff')}
                              disabled={updatingId === mission._id}
                              className="btn btn-accent btn-lg"
                              style={{ backgroundColor: '#D97706', borderColor: '#D97706' }}
                            >
                              <MapPin size={18} />
                              Arrived at Dropoff (Reached Recipient)
                            </button>
                          )}

                          {isReachedDropoff && (
                            <span
                              style={{
                                backgroundColor: '#ECFDF5',
                                border: '1px solid #A7F3D0',
                                color: '#065F46',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                              }}
                            >
                              <CheckCircle2 size={16} />
                              At Recipient Dropoff • Complete Handover Below
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Interactive Live Moving Rescue Map */}
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
                        onRiderPositionUpdate={(pos) => {
                          setLiveLocation({ latitude: pos.latitude, longitude: pos.longitude });
                        }}
                      />

                      {/* 2-Column Route Details */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
                            STEP 2: DROPOFF (Partner NGO / Shelter)
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

                      {/* ============================================================== */}
                      {/* STRICT GATED HANDOVER FLOW: OTP -> PAYMENT -> PHOTO PROOF     */}
                      {/* ============================================================== */}
                      <div
                        style={{
                          backgroundColor: '#F8FAFC',
                          border: '2px solid #E2E8F0',
                          borderRadius: 'var(--radius-lg)',
                          padding: '1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1.25rem',
                        }}
                      >
                        <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span
                              style={{
                                backgroundColor: '#1E3A8A',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                fontSize: '0.725rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: 'var(--radius-full)',
                              }}
                            >
                              MANDATORY SECURITY BARRIER
                            </span>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0F172A' }}>
                              Handover Verification & Rider Payout Workflow
                            </h3>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Follow each stage sequentially upon arriving at the drop-off location. Each section unlocks strictly after the previous step is verified.
                          </p>
                        </div>

                        {/* ------------------------------------------------------------ */}
                        {/* GATE 1: RECIPIENT HANDOVER OTP VERIFICATION                  */}
                        {/* ------------------------------------------------------------ */}
                        <div
                          style={{
                            backgroundColor: otpVerified ? '#ECFDF5' : '#FFFFFF',
                            border: `1.5px solid ${otpVerified ? '#10B981' : '#3B82F6'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '1.25rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  backgroundColor: otpVerified ? '#059669' : '#2563EB',
                                  color: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {otpVerified ? <Check size={18} /> : <KeyRound size={16} />}
                              </div>
                              <div>
                                <strong style={{ fontSize: '0.95rem', color: otpVerified ? '#065F46' : '#1E3A8A' }}>
                                  STAGE 1: Handover OTP Verification
                                </strong>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                                  Ask recipient NGO for the 4-digit OTP shown on their screen or sent to their SMS.
                                </span>
                              </div>
                            </div>

                            {otpVerified && (
                              <span
                                style={{
                                  backgroundColor: '#DCFCE7',
                                  color: '#166534',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: 'var(--radius-full)',
                                }}
                              >
                                ✓ OTP Verified Successfully
                              </span>
                            )}
                          </div>

                          {!otpVerified ? (
                            <div>
                              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="Enter 4-Digit OTP (e.g. 8291)"
                                  maxLength={4}
                                  value={otpInputs[mission._id] || ''}
                                  onChange={(e) =>
                                    setOtpInputs((prev) => ({
                                      ...prev,
                                      [mission._id]: e.target.value.replace(/\D/g, ''),
                                    }))
                                  }
                                  style={{
                                    maxWidth: '260px',
                                    fontSize: '1.25rem',
                                    fontWeight: 800,
                                    letterSpacing: '0.25em',
                                    textAlign: 'center',
                                    fontFamily: 'monospace',
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleVerifyOtp(mission._id)}
                                  disabled={verifyingOtpId === mission._id}
                                  className="btn btn-primary"
                                >
                                  <KeyRound size={16} />
                                  {verifyingOtpId === mission._id ? 'Verifying...' : 'Verify OTP & Unlock Payment'}
                                </button>
                              </div>

                              {otpErrors[mission._id] && (
                                <div style={{ color: '#DC2626', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem' }}>
                                  ⚠️ {otpErrors[mission._id]}
                                </div>
                              )}

                              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                🔒 <strong>Barrier Active:</strong> Without recipient OTP verification, the payment section below will not open.
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.85rem', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>Authenticated with OTP:</span>
                              <strong style={{ fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.15em' }}>
                                {mission.deliveryOtp || '8291'}
                              </strong>
                              <span>• Payment stage is now unlocked!</span>
                            </div>
                          )}
                        </div>

                        {/* ------------------------------------------------------------ */}
                        {/* GATE 2: PAYMENT SECTION (₹15.00 via UPI or Cash)             */}
                        {/* ------------------------------------------------------------ */}
                        <div
                          style={{
                            backgroundColor: !otpVerified ? '#F3F4F6' : paymentDone ? '#ECFDF5' : '#FFFFFF',
                            border: `1.5px solid ${
                              !otpVerified ? '#E5E7EB' : paymentDone ? '#10B981' : '#F59E0B'
                            }`,
                            borderRadius: 'var(--radius-md)',
                            padding: '1.25rem',
                            opacity: !otpVerified ? 0.65 : 1,
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  backgroundColor: !otpVerified ? '#9CA3AF' : paymentDone ? '#059669' : '#D97706',
                                  color: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {!otpVerified ? <Lock size={16} /> : paymentDone ? <Check size={18} /> : <CreditCard size={16} />}
                              </div>
                              <div>
                                <strong style={{ fontSize: '0.95rem', color: !otpVerified ? '#6B7280' : paymentDone ? '#065F46' : '#92400E' }}>
                                  STAGE 2: Delivery Handover Fee Payment (₹15.00)
                                </strong>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                                  Collect ₹15.00 platform delivery compensation via UPI or Cash.
                                </span>
                              </div>
                            </div>

                            {paymentDone ? (
                              <span
                                style={{
                                  backgroundColor: '#DCFCE7',
                                  color: '#166534',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: 'var(--radius-full)',
                                }}
                              >
                                ✓ Paid ₹15.00 ({mission.paymentMethod || 'UPI'})
                              </span>
                            ) : !otpVerified ? (
                              <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 700 }}>
                                🔒 Locked (Verify OTP first)
                              </span>
                            ) : null}
                          </div>

                          {!otpVerified ? (
                            <div style={{ fontSize: '0.8rem', color: '#6B7280', padding: '0.5rem 0' }}>
                              🔒 The payment section does not open until the recipient enters and verifies their Handover OTP in Stage 1 above.
                            </div>
                          ) : !paymentDone ? (
                            <div>
                              {/* Payment Method Selector */}
                              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => setPaymentMethods((prev) => ({ ...prev, [mission._id]: 'UPI' }))}
                                  className={`btn btn-sm ${selectedMethod === 'UPI' ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                  <QrCode size={14} />
                                  UPI Transfer (QR Code)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPaymentMethods((prev) => ({ ...prev, [mission._id]: 'Cash' }))}
                                  className={`btn btn-sm ${selectedMethod === 'Cash' ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                  <DollarSign size={14} />
                                  Cash on Delivery
                                </button>
                              </div>

                              {/* Method 1: UPI Details & QR */}
                              {selectedMethod === 'UPI' && (
                                <div
                                  style={{
                                    backgroundColor: '#EFF6FF',
                                    border: '1px solid #BFDBFE',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '1rem',
                                    marginBottom: '1rem',
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 700, color: '#1E40AF', fontSize: '0.9rem' }}>
                                      Scan BharatQR / Pay to UPI ID
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#1E3A8A', marginTop: '0.2rem' }}>
                                      VPA: <strong>bhojansetu.delivery@okaxis</strong>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                      Amount: <strong style={{ color: '#059669', fontSize: '1rem' }}>₹15.00</strong>
                                    </div>
                                  </div>

                                  <div
                                    style={{
                                      backgroundColor: '#FFFFFF',
                                      padding: '0.5rem',
                                      border: '1px solid #93C5FD',
                                      borderRadius: 'var(--radius-sm)',
                                      textAlign: 'center',
                                    }}
                                  >
                                    <div style={{ fontSize: '1.75rem' }}>📱💳</div>
                                    <span style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: 700 }}>
                                      BharatQR Verified
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Method 2: Cash Details */}
                              {selectedMethod === 'Cash' && (
                                <div
                                  style={{
                                    backgroundColor: '#FEF3C7',
                                    border: '1px solid #FDE68A',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '1rem',
                                    marginBottom: '1rem',
                                    fontSize: '0.875rem',
                                    color: '#92400E',
                                  }}
                                >
                                  💵 Collect exactly <strong>₹15.00 in Cash</strong> from the recipient NGO / Person at handover.
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => handleConfirmPayment(mission._id)}
                                disabled={confirmingPaymentId === mission._id}
                                className="btn btn-accent"
                              >
                                <CheckCircle2 size={16} />
                                {confirmingPaymentId === mission._id
                                  ? 'Confirming Payment...'
                                  : `Confirm ₹15.00 Payment (${selectedMethod})`}
                              </button>

                              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                🔒 <strong>Barrier Active:</strong> Food photo upload section unlocks immediately after confirming payment.
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.85rem', color: '#065F46' }}>
                              Payment of ₹15.00 recorded successfully. Photo proof section is now ready!
                            </div>
                          )}
                        </div>

                        {/* ------------------------------------------------------------ */}
                        {/* GATE 3: FOOD PHOTO CAPTURE & DATABASE UPLOAD                 */}
                        {/* ------------------------------------------------------------ */}
                        <div
                          style={{
                            backgroundColor: !paymentDone ? '#F3F4F6' : '#FFFFFF',
                            border: `1.5px solid ${!paymentDone ? '#E5E7EB' : '#10B981'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '1.25rem',
                            opacity: !paymentDone ? 0.65 : 1,
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  backgroundColor: !paymentDone ? '#9CA3AF' : '#059669',
                                  color: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {!paymentDone ? <Lock size={16} /> : <Camera size={16} />}
                              </div>
                              <div>
                                <strong style={{ fontSize: '0.95rem', color: !paymentDone ? '#6B7280' : '#047857' }}>
                                  STAGE 3: Food Handover Photo Capture & Upload
                                </strong>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                                  Take a clear photo of the food package. This will be stored in the database and visible in Super Admin HQ.
                                </span>
                              </div>
                            </div>

                            {!paymentDone && (
                              <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 700 }}>
                                🔒 Locked (Complete payment first)
                              </span>
                            )}
                          </div>

                          {!paymentDone ? (
                            <div style={{ fontSize: '0.8rem', color: '#6B7280', padding: '0.5rem 0' }}>
                              🔒 The photo section does not open until the ₹15 payment (UPI or Cash) is confirmed in Stage 2 above.
                            </div>
                          ) : (
                            <div>
                              {/* Photo Capture Control */}
                              <div style={{ marginBottom: '1rem' }}>
                                <label
                                  className="btn btn-secondary btn-sm"
                                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                  <Camera size={16} />
                                  <span>Take Photo / Choose Image</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handlePhotoCapture(mission._id, e)}
                                  />
                                </label>
                                <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginLeft: '0.75rem' }}>
                                  Back camera enabled for mobile phones
                                </span>
                              </div>

                              {/* Live Image Preview */}
                              {currentPhotoPreview && (
                                <div
                                  style={{
                                    marginBottom: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    overflow: 'hidden',
                                    border: '1px solid var(--border-light)',
                                    maxHeight: '260px',
                                    maxWidth: '380px',
                                    backgroundColor: '#111827',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <img
                                    src={currentPhotoPreview}
                                    alt="Food delivery handover preview"
                                    style={{ maxWidth: '100%', maxHeight: '250px', objectFit: 'contain' }}
                                  />
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => handleUploadProof(mission._id)}
                                disabled={!currentPhotoPreview || uploadingProofId === mission._id}
                                className="btn btn-primary btn-lg"
                                style={{
                                  backgroundColor: '#059669',
                                  borderColor: '#059669',
                                }}
                              >
                                <UploadCloud size={18} />
                                {uploadingProofId === mission._id
                                  ? 'Uploading to Database & Crediting ₹15...'
                                  : 'Complete Order & Credit ₹15 to Wallet 🎉'}
                              </button>
                            </div>
                          )}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span
                            style={{
                              backgroundColor: '#DCFCE7',
                              color: '#166534',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            +₹15.00 Payout Credited
                          </span>
                          <StatusBadge status="Completed" />
                        </div>
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

                      {/* Photo Thumbnail if present */}
                      {item.deliveryProofPhoto && (
                        <div
                          style={{
                            width: '70px',
                            height: '70px',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            border: '1px solid var(--border-light)',
                            backgroundColor: '#000',
                          }}
                        >
                          <img
                            src={item.deliveryProofPhoto}
                            alt="Handover proof"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}
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
                        ✓ Handover Verified (OTP: {item.deliveryOtp || '8291'})
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
                  stats, ₹15 payouts, and photo proofs will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: ORDER COMPLETION CELEBRATION */}
      <Modal
        isOpen={!!celebrationOrder}
        onClose={() => setCelebrationOrder(null)}
        title="🎉 Delivery Completed & Payout Credited!"
        size="md"
        footer={
          <button onClick={() => setCelebrationOrder(null)} className="btn btn-primary btn-full">
            Great, Continue Delivery Duty
          </button>
        }
      >
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💰✨</div>
          <h2 style={{ color: '#047857', margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>
            ₹15.00 Credited to Your Wallet!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            The food handover proof has been stored in the database and is now live for Company Super Admins to audit.
          </p>

          <div
            style={{
              backgroundColor: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: '#065F46', display: 'block' }}>New Wallet Balance</span>
              <strong style={{ fontSize: '1.5rem', color: '#047857' }}>₹{wallet.walletBalance}.00</strong>
            </div>
            <div style={{ height: '30px', width: '1px', backgroundColor: '#A7F3D0' }}></div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#065F46', display: 'block' }}>Missions Delivered</span>
              <strong style={{ fontSize: '1.5rem', color: '#047857' }}>{wallet.completedDeliveriesCount}</strong>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: LOCATION PICKER */}
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
