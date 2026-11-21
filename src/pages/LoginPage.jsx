import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle, Sparkles, Building, Users, CheckCircle2, Database, Truck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Query parameter redirect support
  const queryParams = new URLSearchParams(location.search);
  const redirectTarget = queryParams.get('redirect');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSeedSuccess('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      if (redirectTarget) {
        navigate(`/${redirectTarget}`);
      } else if (result.user.role === 'donor') {
        navigate('/dashboard/donor');
      } else if (result.user.role === 'ngo') {
        navigate('/dashboard/ngo');
      } else if (result.user.role === 'delivery') {
        navigate('/dashboard/delivery');
      } else if (result.user.role === 'admin') {
        navigate('/dashboard/admin');
      } else {
        navigate('/');
      }
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleDemoFill = (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setErrorMsg('');
    setSeedSuccess('');
  };

  const handleSeedDatabase = async () => {
    try {
      setSeeding(true);
      setErrorMsg('');
      setSeedSuccess('');
      const res = await api.get('/seed');
      if (res.data?.success) {
        setSeedSuccess('🎉 Demo database seeded successfully! Click Demo Donor or Demo NGO above to sign in.');
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          'Failed to seed database automatically. Ensure your backend server and MongoDB are running.'
      );
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Sign In to BhojanSetu</h1>
          <p className="auth-subtitle">
            Access your food redistribution portal
          </p>
        </div>

        {/* 1-Click Demo Login Box */}
        <div className="demo-accounts-box">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.65rem',
            }}
          >
            <div className="demo-title" style={{ margin: 0 }}>
              <Sparkles size={14} style={{ color: 'var(--accent)' }} />
              Instant Demo Accounts
            </div>
            <button
              type="button"
              onClick={handleSeedDatabase}
              disabled={seeding}
              style={{
                backgroundColor: 'rgba(45, 106, 79, 0.1)',
                border: '1px solid rgba(45, 106, 79, 0.25)',
                color: 'var(--primary-deep)',
                fontSize: '0.725rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
              title="Populates or resets the database with demo accounts & food listings"
            >
              <Database size={12} />
              {seeding ? 'Seeding...' : '🌱 Seed Database'}
            </button>
          </div>

          <div className="demo-buttons-grid">
            <button
              type="button"
              className="demo-btn"
              onClick={() => handleDemoFill('donor@tajkitchen.com', 'donor')}
              title="Sign in as Food Donor"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building size={13} style={{ color: 'var(--primary)' }} />
                <span className="demo-role-name">Demo Donor</span>
              </div>
              <span className="demo-email">donor@tajkitchen.com</span>
            </button>

            <button
              type="button"
              className="demo-btn"
              onClick={() => handleDemoFill('ngo@feedingindia.org', 'ngo')}
              title="Sign in as NGO Partner"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={13} style={{ color: 'var(--accent)' }} />
                <span className="demo-role-name">Demo NGO</span>
              </div>
              <span className="demo-email">ngo@feedingindia.org</span>
            </button>

            <button
              type="button"
              className="demo-btn"
              onClick={() => handleDemoFill('driver@bhojansetu.org', 'delivery')}
              title="Sign in as Delivery Partner"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Truck size={13} style={{ color: '#2563EB' }} />
                <span className="demo-role-name">Delivery Rider</span>
              </div>
              <span className="demo-email">driver@bhojansetu.org</span>
            </button>

            <button
              type="button"
              className="demo-btn"
              onClick={() => handleDemoFill('admin@bhojansetu.org', 'admin')}
              title="Sign in as Super Admin"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={13} style={{ color: '#1E3A8A' }} />
                <span className="demo-role-name">Super Admin 👑</span>
              </div>
              <span className="demo-email">admin@bhojansetu.org</span>
            </button>
          </div>
        </div>

        {seedSuccess && (
          <div className="alert alert-success">
            <CheckCircle2 size={18} />
            <span>{seedSuccess}</span>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-error" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>

            {errorMsg === 'Invalid email or password.' && (
              <div
                style={{
                  marginTop: '0.5rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid #FECACA',
                  fontSize: '0.8rem',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>Database has not been seeded yet.</span>
                <button
                  type="button"
                  onClick={handleSeedDatabase}
                  disabled={seeding}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                >
                  {seeding ? 'Seeding...' : 'Seed Demo Data Now'}
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="e.g. kitchen@banquets.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={submitting}
            style={{ marginTop: '0.75rem' }}
          >
            {submitting ? (
              <>
                <span className="spinner spinner-sm spinner-light"></span>
                Authenticating...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account yet?{' '}
          <Link to="/register">Register here free</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
