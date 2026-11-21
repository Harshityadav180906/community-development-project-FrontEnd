import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  ListOrdered,
  Utensils,
  Building,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Truck,
  Heart,
  LocateFixed,
  Map,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ExpiryTimer from '../components/ExpiryTimer';
import RescueMap from '../components/RescueMap';
import LocationPickerModal from '../components/LocationPickerModal';

const DonorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('post'); // 'post' or 'my-donations'
  const [donations, setDonations] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [expandedMapId, setExpandedMapId] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Form State
  const now = new Date();
  const defaultCooked = new Date(now.getTime() - 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultExpires = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const [title, setTitle] = useState('');
  const [foodType, setFoodType] = useState('Veg');
  const [quantityServings, setQuantityServings] = useState('');
  const [cookedAt, setCookedAt] = useState(defaultCooked);
  const [expiresAt, setExpiresAt] = useState(defaultExpires);
  const [pickupAddress, setPickupAddress] = useState('');
  const [locality, setLocality] = useState(user?.locality || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');

  // Auto GPS detection & manual input for donor kitchen
  const [donorGps, setDonorGps] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('');
  const [showManualGps, setShowManualGps] = useState(false);
  const [manualLat, setManualLat] = useState('12.9784');
  const [manualLng, setManualLng] = useState('77.6408');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch donor's donations
  const fetchMyDonations = async () => {
    try {
      setLoadingDonations(true);
      const res = await api.get('/food/my-donations');
      if (res.data?.data) {
        setDonations(res.data.data);
      }
    } catch (err) {
      console.error('Fetch donations error:', err);
    } finally {
      setLoadingDonations(false);
    }
  };

  useEffect(() => {
    fetchMyDonations();
  }, []);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported in this browser.');
      return;
    }
    setGpsStatus('Acquiring kitchen coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDonorGps({
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
        });
        setGpsStatus(
          `GPS Acquired: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        );
      },
      (err) => {
        setGpsStatus('Using locality approximation.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Quick Expiry Calculation Helpers
  const addHoursToExpiry = (hrs) => {
    const target = new Date(Date.now() + hrs * 60 * 60 * 1000);
    setExpiresAt(target.toISOString().slice(0, 16));
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!title.trim() || !quantityServings || !cookedAt || !expiresAt || !pickupAddress.trim()) {
      setFormError('Please fill in all required food listing fields.');
      return;
    }

    if (new Date(expiresAt) <= new Date(cookedAt)) {
      setFormError('Expiration deadline must be later than the cooked time.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/food', {
        title: title.trim(),
        foodType,
        quantityServings: Number(quantityServings),
        cookedAt,
        expiresAt,
        pickupAddress: pickupAddress.trim(),
        locality: (locality || user?.locality || '').trim(),
        contactPhone: (contactPhone || user?.phone || '').trim(),
        notes: notes.trim(),
        latitude: donorGps?.latitude,
        longitude: donorGps?.longitude,
      });

      if (res.data?.success) {
        setFormSuccess('🎉 Surplus food listing posted live on the feed!');
        setTitle('');
        setQuantityServings('');
        setNotes('');
        fetchMyDonations();
        setTimeout(() => {
          setActiveTab('my-donations');
          setFormSuccess('');
        }, 1200);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to post surplus food.');
    } finally {
      setSubmitting(false);
    }
  };

  // Status transition handler: Mark Handover / Picked Up
  const handleUpdateStatus = async (listingId, newStatus) => {
    try {
      setActionLoadingId(listingId);
      const res = await api.patch(`/food/${listingId}/status`, { status: newStatus });
      if (res.data?.data) {
        setDonations((prev) =>
          prev.map((item) => (item._id === listingId ? res.data.data : item))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSelectKitchenLocation = (loc) => {
    setDonorGps({ latitude: loc.latitude, longitude: loc.longitude });
    setManualLat(String(loc.latitude));
    setManualLng(String(loc.longitude));
    setGpsStatus(`Google Map Pin: ${loc.latitude}, ${loc.longitude}`);
    if (loc.address && !pickupAddress) {
      setPickupAddress(loc.address);
    }
  };

  const totalMealsContributed = donations.reduce((acc, curr) => acc + curr.quantityServings, 0);
  const activeListingsCount = donations.filter((d) => d.status === 'Available').length;
  const claimedListingsCount = donations.filter((d) => d.status === 'Claimed').length;

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-title-row">
            <div>
              <h1>Donor Kitchen Dashboard</h1>
              <p style={{ color: 'var(--text-muted)' }}>
                Welcome back, <strong>{user?.name}</strong> • {user?.organizationName}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setActiveTab('post')}
                className="btn btn-accent btn-sm"
              >
                <PlusCircle size={16} />
                Post New Surplus Food
              </button>
            </div>
          </div>
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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Meals Listed</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-deep)' }}>
              {totalMealsContributed.toLocaleString()}
            </div>
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Live in Feed</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981' }}>
              {activeListingsCount}
            </div>
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Awaiting Pickup</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F59E0B' }}>
              {claimedListingsCount}
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'post' ? 'active' : ''}`}
            onClick={() => setActiveTab('post')}
          >
            <PlusCircle size={18} />
            <span>Post Surplus Food</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'my-donations' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-donations')}
          >
            <ListOrdered size={18} />
            <span>My Donations</span>
            <span className="tab-badge">{donations.length}</span>
          </button>
        </div>

        {/* TAB 1: POST SURPLUS FOOD FORM */}
        {activeTab === 'post' && (
          <div className="post-food-card">
            <h2 className="form-section-title">
              List Surplus Food for Immediate Rescue
            </h2>

            {formSuccess && (
              <div className="alert alert-success">
                <CheckCircle2 size={18} />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handlePostSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="title">
                  Food Item Description <span className="required">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 80 Servings: Dal Makhani, Paneer Butter Masala & Butter Naan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Dietary Classification <span className="required">*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        backgroundColor: foodType === 'Veg' ? 'var(--food-veg-bg)' : '#FFFFFF',
                      }}
                    >
                      <input
                        type="radio"
                        name="foodType"
                        value="Veg"
                        checked={foodType === 'Veg'}
                        onChange={(e) => setFoodType(e.target.value)}
                      />
                      <span style={{ fontWeight: 600, color: 'var(--food-veg-color)' }}>
                        🌱 Pure Vegetarian
                      </span>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        backgroundColor: foodType === 'Non-Veg' ? 'var(--food-nonveg-bg)' : '#FFFFFF',
                      }}
                    >
                      <input
                        type="radio"
                        name="foodType"
                        value="Non-Veg"
                        checked={foodType === 'Non-Veg'}
                        onChange={(e) => setFoodType(e.target.value)}
                      />
                      <span style={{ fontWeight: 600, color: 'var(--food-nonveg-color)' }}>
                        🍗 Non-Vegetarian
                      </span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="servings">
                    Approx. Servings (Plates) <span className="required">*</span>
                  </label>
                  <input
                    id="servings"
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="e.g. 50"
                    value={quantityServings}
                    onChange={(e) => setQuantityServings(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="cookedAt">
                    Preparation / Cooked Time <span className="required">*</span>
                  </label>
                  <input
                    id="cookedAt"
                    type="datetime-local"
                    className="form-input"
                    value={cookedAt}
                    onChange={(e) => setCookedAt(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="expiresAt">
                    Safe Expiration Deadline <span className="required">*</span>
                  </label>
                  <input
                    id="expiresAt"
                    type="datetime-local"
                    className="form-input"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    required
                  />
                  <div className="quick-expiry-row">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick add:</span>
                    <button
                      type="button"
                      className="quick-expiry-btn"
                      onClick={() => addHoursToExpiry(2)}
                    >
                      +2 Hours
                    </button>
                    <button
                      type="button"
                      className="quick-expiry-btn"
                      onClick={() => addHoursToExpiry(4)}
                    >
                      +4 Hours
                    </button>
                    <button
                      type="button"
                      className="quick-expiry-btn"
                      onClick={() => addHoursToExpiry(6)}
                    >
                      +6 Hours
                    </button>
                    <button
                      type="button"
                      className="quick-expiry-btn"
                      onClick={() => addHoursToExpiry(12)}
                    >
                      +12 Hours
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="address">
                    Full Pickup Address <span className="required">*</span>
                  </label>
                  <input
                    id="address"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Kitchen Gate #2, The Grand Banquet, 100ft Road"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="locality">
                    Locality / Area <span className="required">*</span>
                  </label>
                  <input
                    id="locality"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Indiranagar"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Kitchen Location GPS & Manual Input Option */}
              <div
                style={{
                  backgroundColor: 'var(--bg-cream)',
                  border: '1px dashed var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary-deep)' }}>
                      📍 Kitchen Location Pin:
                    </span>{' '}
                    <span style={{ color: donorGps ? '#059669' : 'var(--text-muted)' }}>
                      {donorGps
                        ? `GPS Set: ${donorGps.latitude}, ${donorGps.longitude}`
                        : gpsStatus || 'Bounds nearest delivery partner to your kitchen.'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      className="btn btn-primary btn-sm"
                    >
                      <MapPin size={14} />
                      Set via Google Map
                    </button>
                    <button
                      type="button"
                      onClick={handleDetectGps}
                      className="btn btn-secondary btn-sm"
                    >
                      <LocateFixed size={14} />
                      Auto-Detect GPS
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowManualGps(!showManualGps);
                        if (!donorGps) {
                          setDonorGps({ latitude: Number(manualLat), longitude: Number(manualLng) });
                        }
                      }}
                      className="btn btn-outline btn-sm"
                    >
                      {showManualGps ? 'Hide Manual Input' : '✏️ Manual Coordinates'}
                    </button>
                  </div>
                </div>

                {showManualGps && (
                  <div
                    style={{
                      marginTop: '0.85rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Kitchen Latitude:
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        className="form-input"
                        value={manualLat}
                        onChange={(e) => {
                          setManualLat(e.target.value);
                          setDonorGps({ latitude: Number(e.target.value), longitude: Number(manualLng) });
                        }}
                        placeholder="12.9784"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Kitchen Longitude:
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        className="form-input"
                        value={manualLng}
                        onChange={(e) => {
                          setManualLng(e.target.value);
                          setDonorGps({ latitude: Number(manualLat), longitude: Number(e.target.value) });
                        }}
                        placeholder="77.6408"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">
                  Direct Coordination Phone <span className="required">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="notes">
                  Packaging / Storage & Vehicle Instructions
                </label>
                <textarea
                  id="notes"
                  className="form-textarea"
                  placeholder="e.g. Packed in stainless steel containers. Please bring clean crates. Warm food maintained at 65°C."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn btn-accent btn-lg"
                disabled={submitting}
                style={{ marginTop: '0.5rem' }}
              >
                {submitting ? (
                  <>
                    <span className="spinner spinner-sm spinner-light"></span>
                    Publishing Food Listing...
                  </>
                ) : (
                  <>
                    <PlusCircle size={18} />
                    Publish Surplus Food Listing
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: MY DONATIONS LIST */}
        {activeTab === 'my-donations' && (
          <div>
            {loadingDonations ? (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <span className="spinner"></span>
                <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>
                  Loading your donation batches...
                </p>
              </div>
            ) : donations.length > 0 ? (
              <div className="donations-grid">
                {donations.map((item) => {
                  const isMapOpen = expandedMapId === item._id;

                  return (
                    <div key={item._id} className="donation-item-card">
                      <div className="donation-header-row">
                        <div className="donation-main-info">
                          <h3>{item.title}</h3>
                          <div className="donation-meta-tags">
                            <span
                              style={{
                                fontWeight: 700,
                                color: item.foodType === 'Veg' ? 'var(--food-veg-color)' : 'var(--food-nonveg-color)',
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
                        </div>
                      </div>

                      {/* NGO Claimed Box with Assigned Driver */}
                      {item.claimedBy && (
                        <div className="ngo-claimed-callout">
                          <div className="ngo-claimed-info">
                            <div className="ngo-icon-wrapper">
                              <Truck size={20} />
                            </div>
                            <div className="ngo-contact-details">
                              <div>
                                Claimed by <strong>{item.claimedBy.organizationName}</strong> ({item.claimedBy.name})
                              </div>
                              <div style={{ marginTop: '3px' }}>
                                Phone:{' '}
                                <a
                                  href={`tel:${item.claimedBy.phone}`}
                                  style={{ fontWeight: 700, color: '#92400E', textDecoration: 'underline' }}
                                >
                                  {item.claimedBy.phone}
                                </a>{' '}
                                • Email: {item.claimedBy.email}
                              </div>

                              {item.assignedDriver && (
                                <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#B45309' }}>
                                  🚚 Assigned Delivery Partner: <strong>{item.assignedDriver.name}</strong> ({item.assignedDriver.vehicleType}) • Tel: {item.assignedDriver.phone}
                                </div>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              onClick={() => setExpandedMapId(isMapOpen ? null : item._id)}
                              className="btn btn-secondary btn-sm"
                            >
                              <Map size={14} />
                              {isMapOpen ? 'Hide Map' : 'View Rescue Route'}
                              {isMapOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            {item.status === 'Claimed' && (
                              <button
                                onClick={() => handleUpdateStatus(item._id, 'Picked Up')}
                                disabled={actionLoadingId === item._id}
                                className="btn btn-primary btn-sm"
                              >
                                {actionLoadingId === item._id ? (
                                  'Updating...'
                                ) : (
                                  <>
                                    <CheckCircle2 size={14} />
                                    Confirm Handover (Mark Picked Up)
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Expandable Live Rescue Map */}
                      {isMapOpen && item.claimedBy && (
                        <RescueMap
                          donorLocation={{
                            latitude: item.pickupCoordinates?.latitude,
                            longitude: item.pickupCoordinates?.longitude,
                            name: user?.organizationName || 'My Kitchen',
                            address: item.pickupAddress,
                          }}
                          driverLocation={
                            item.assignedDriver
                              ? {
                                  latitude: item.assignedDriver.currentLocation?.latitude,
                                  longitude: item.assignedDriver.currentLocation?.longitude,
                                  name: item.assignedDriver.name,
                                  vehicleType: item.assignedDriver.vehicleType,
                                  vehicleNumber: item.assignedDriver.vehicleNumber,
                                  phone: item.assignedDriver.phone,
                                }
                              : null
                          }
                          ngoLocation={{
                            latitude: item.deliveryCoordinates?.latitude || 12.9121,
                            longitude: item.deliveryCoordinates?.longitude || 77.6446,
                            name: item.claimedBy?.organizationName,
                            address: item.deliveryCoordinates?.address,
                          }}
                          title={`Rescue Tracking Route: ${item.title}`}
                          height="340px"
                        />
                      )}

                      <div className="donation-item-footer">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.825rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                            <Clock size={14} />
                            <span>Expires: {new Date(item.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {item.status === 'Available' && <ExpiryTimer expiresAt={item.expiresAt} />}
                        </div>

                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Address: <strong>{item.pickupAddress}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-feed">
                <Utensils size={36} style={{ color: 'var(--primary)' }} />
                <h3>No Donations Yet</h3>
                <p>
                  You haven't listed any surplus food batches yet. Create your first
                  food post to start feeding communities!
                </p>
                <button onClick={() => setActiveTab('post')} className="btn btn-accent">
                  <PlusCircle size={16} />
                  Post Your First Surplus Food
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        initialCoords={donorGps || { latitude: 12.9784, longitude: 77.6408 }}
        title="📍 Set Kitchen Location (Google Map / Manual Coordinates)"
        onSelectLocation={handleSelectKitchenLocation}
      />
    </div>
  );
};

export default DonorDashboard;
