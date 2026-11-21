import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  UserPlus,
  Building,
  Users,
  AlertCircle,
  Eye,
  EyeOff,
  Truck,
  LocateFixed,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LocationPickerModal from '../components/LocationPickerModal';

const RegisterPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showLocationModal, setShowLocationModal] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const initialRole =
    queryParams.get('role') === 'ngo'
      ? 'ngo'
      : queryParams.get('role') === 'delivery'
      ? 'delivery'
      : 'donor';

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [phone, setPhone] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('Bengaluru');

  // Delivery Partner Specific Fields
  const [vehicleType, setVehicleType] = useState('Two-Wheeler / Bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [gpsCoords, setGpsCoords] = useState(null);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [gpsMessage, setGpsMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const roleParam = queryParams.get('role');
    if (roleParam && ['donor', 'ngo', 'delivery'].includes(roleParam)) {
      setRole(roleParam);
    }
  }, [location.search]);

  // Automatic GPS Geolocation Fetch
  const handleFetchGps = () => {
    if (!navigator.geolocation) {
      setGpsMessage('Geolocation is not supported by your browser.');
      return;
    }

    setFetchingGps(true);
    setGpsMessage('Detecting your live coordinates...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
        });
        setFetchingGps(false);
        setGpsMessage(
          `GPS Acquired: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        );
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setFetchingGps(false);
        setGpsMessage('Using locality approximation.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !phone.trim() ||
      !locality.trim() ||
      !city.trim()
    ) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (role !== 'delivery' && !organizationName.trim()) {
      setErrorMsg('Please provide your organization name.');
      return;
    }

    if (role === 'delivery' && !vehicleNumber.trim()) {
      setErrorMsg('Please provide your vehicle registration number.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      organizationName:
        role === 'delivery'
          ? 'BhojanSetu Logistics Partner'
          : organizationName.trim(),
      role,
      phone: phone.trim(),
      locality: locality.trim(),
      city: city.trim(),
      vehicleType,
      vehicleNumber: vehicleNumber.trim(),
      latitude: gpsCoords?.latitude,
      longitude: gpsCoords?.longitude,
    });
    setSubmitting(false);

    if (result.success) {
      if (role === 'donor') {
        navigate('/dashboard/donor');
      } else if (role === 'ngo') {
        navigate('/dashboard/ngo');
      } else if (role === 'delivery') {
        navigate('/dashboard/delivery');
      } else {
        navigate('/');
      }
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '680px' }}>
        <div className="auth-header">
          <h1>Join BhojanSetu</h1>
          <p className="auth-subtitle">
            Sign up to donate food, rescue meals, or deliver batches
          </p>
        </div>

        {/* 3-Way Role Toggle Selector */}
        <div className="role-toggle-group" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <button
            type="button"
            className={`role-toggle-btn ${role === 'donor' ? 'active' : ''}`}
            onClick={() => setRole('donor')}
          >
            <Building size={16} />
            <span>Food Donor</span>
          </button>
          <button
            type="button"
            className={`role-toggle-btn ${role === 'ngo' ? 'active' : ''}`}
            onClick={() => setRole('ngo')}
          >
            <Users size={16} />
            <span>NGO Partner</span>
          </button>
          <button
            type="button"
            className={`role-toggle-btn ${role === 'delivery' ? 'active' : ''}`}
            onClick={() => setRole('delivery')}
          >
            <Truck size={16} />
            <span>Delivery Partner</span>
          </button>
        </div>

        {errorMsg && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="reg-name"
                type="text"
                className="form-input"
                placeholder={
                  role === 'delivery' ? 'e.g. Ramesh Kumar' : 'e.g. Chef Rajesh Verma'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {role !== 'delivery' ? (
              <div className="form-group">
                <label className="form-label" htmlFor="reg-org">
                  {role === 'donor'
                    ? 'Establishment / Kitchen Name'
                    : 'NGO / Foundation Name'}{' '}
                  <span className="required">*</span>
                </label>
                <input
                  id="reg-org"
                  type="text"
                  className="form-input"
                  placeholder={
                    role === 'donor'
                      ? 'e.g. The Grand Heritage Banquets'
                      : 'e.g. Robin Hood Army - Bangalore'
                  }
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label" htmlFor="vehicleType">
                  Vehicle Type <span className="required">*</span>
                </label>
                <select
                  id="vehicleType"
                  className="form-select"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  <option value="Two-Wheeler / Bike">Two-Wheeler / Bike</option>
                  <option value="Eco Delivery Van">Eco Delivery Van</option>
                  <option value="Electric Scooter">Electric Scooter</option>
                  <option value="Mini-Truck / Tempo">Mini-Truck / Tempo</option>
                </select>
              </div>
            )}
          </div>

          {role === 'delivery' && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="vehicleNumber">
                  Vehicle Registration Number <span className="required">*</span>
                </label>
                <input
                  id="vehicleNumber"
                  type="text"
                  className="form-input"
                  placeholder="e.g. KA-01-AB-1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Base Location Mode (Google Map / Manual)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', height: '42px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    className="btn btn-primary btn-sm"
                    style={{ flexShrink: 0 }}
                  >
                    <MapPin size={14} />
                    Pick on Google Map
                  </button>
                  <button
                    type="button"
                    onClick={handleFetchGps}
                    disabled={fetchingGps}
                    className="btn btn-secondary btn-sm"
                    style={{ flexShrink: 0 }}
                  >
                    <LocateFixed size={14} />
                    {fetchingGps ? 'Detecting...' : 'Auto-GPS'}
                  </button>
                  <span style={{ fontSize: '0.785rem', color: gpsCoords ? '#059669' : 'var(--text-muted)' }}>
                    {gpsMessage || 'Pick on map or enter manually'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Official Email Address <span className="required">*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                className="form-input"
                placeholder="contact@organization.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">
                Contact Phone Number <span className="required">*</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                className="form-input"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">
              Account Password (min 6 characters) <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-locality">
                Base Operating Locality <span className="required">*</span>
              </label>
              <input
                id="reg-locality"
                type="text"
                className="form-input"
                placeholder="e.g. Indiranagar, Koramangala, HSR"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-city">
                City <span className="required">*</span>
              </label>
              <input
                id="reg-city"
                type="text"
                className="form-input"
                placeholder="e.g. Bengaluru"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={submitting}
            style={{ marginTop: '0.75rem' }}
          >
            {submitting ? (
              <>
                <span className="spinner spinner-sm spinner-light"></span>
                Registering Account...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Register as{' '}
                {role === 'donor'
                  ? 'Food Donor'
                  : role === 'delivery'
                  ? 'Delivery Partner'
                  : 'Partner NGO'}
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>

      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        initialCoords={gpsCoords || { latitude: 12.9352, longitude: 77.6245 }}
        title="📍 Set Base Station Location (Google Map / Manual Coordinates)"
        onSelectLocation={(coords) => {
          setGpsCoords({ latitude: coords.latitude, longitude: coords.longitude });
          setGpsMessage(`Location Set: ${coords.latitude}, ${coords.longitude}`);
          if (coords.address && !locality) {
            setLocality(coords.address);
          }
        }}
      />
    </div>
  );
};

export default RegisterPage;
