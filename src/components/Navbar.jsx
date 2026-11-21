import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HeartHandshake, LogOut, Menu, X, PlusCircle, Truck, MapPin, ShieldCheck, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isDonor, isNgo, isDelivery, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const closeMenu = () => setMobileMenuOpen(false);

  const getRoleLabel = () => {
    if (user?.role === 'donor') return 'Food Donor';
    if (user?.role === 'delivery') return 'Delivery Partner 🚚';
    if (user?.role === 'admin') return 'Super Admin 👑';
    return 'Verified NGO';
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo" onClick={closeMenu}>
          <div className="brand-icon-wrapper">
            <HeartHandshake size={22} />
          </div>
          <div className="brand-text">
            <div className="brand-name">
              Bhojan<span>Setu</span>
            </div>
            <span className="brand-tagline">Surplus Redistribution</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <ul className="nav-links nav-desktop">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/feed"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              Live Food Feed
            </NavLink>
          </li>

          {isAuthenticated && isDonor && (
            <li>
              <NavLink
                to="/dashboard/donor"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Donor Dashboard
              </NavLink>
            </li>
          )}

          {isAuthenticated && isNgo && (
            <li>
              <NavLink
                to="/dashboard/ngo"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                NGO Pickups & Map
              </NavLink>
            </li>
          )}

          {isAuthenticated && isDelivery && (
            <li>
              <NavLink
                to="/dashboard/delivery"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Delivery Portal
              </NavLink>
            </li>
          )}

          {isAuthenticated && isAdmin && (
            <li>
              <NavLink
                to="/dashboard/admin"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                style={{ color: '#1E3A8A', fontWeight: 700 }}
              >
                👑 Super Admin HQ
              </NavLink>
            </li>
          )}
        </ul>

        {/* Desktop Actions */}
        <div className="nav-actions nav-desktop">
          {isAuthenticated ? (
            <>
              {isDelivery && (
                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    color: '#065F46',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  title="Your live BhojanSetu delivery wallet (₹15 per delivered order)"
                >
                  <Wallet size={14} style={{ color: '#059669' }} />
                  <span>Wallet: ₹{user?.walletBalance ?? 0}.00</span>
                </div>
              )}

              <div className="user-badge">
                <div
                  className="user-avatar"
                  style={{
                    backgroundColor: isAdmin ? '#1E3A8A' : isDelivery ? 'var(--accent)' : 'var(--primary)',
                  }}
                >
                  {isAdmin ? '👑' : isDelivery ? '🚚' : user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-meta">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-role-tag">{getRoleLabel()}</span>
                </div>
              </div>

              {isDonor && (
                <Link to="/dashboard/donor" className="btn btn-accent btn-sm">
                  <PlusCircle size={15} />
                  Post Food
                </Link>
              )}

              {isNgo && (
                <Link to="/dashboard/ngo" className="btn btn-primary btn-sm">
                  <Truck size={15} />
                  My Rescues
                </Link>
              )}

              {isDelivery && (
                <Link to="/dashboard/delivery" className="btn btn-accent btn-sm">
                  <MapPin size={15} />
                  My Missions
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/dashboard/admin"
                  className="btn btn-sm"
                  style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF', borderColor: '#1E3A8A' }}
                >
                  <ShieldCheck size={15} />
                  Admin HQ
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Log out of BhojanSetu"
              >
                <LogOut size={15} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <ul className="mobile-nav-links">
            <li>
              <NavLink
                to="/"
                onClick={closeMenu}
                className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/feed"
                onClick={closeMenu}
                className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}
              >
                Live Food Feed
              </NavLink>
            </li>
            {isAuthenticated && isDonor && (
              <li>
                <NavLink
                  to="/dashboard/donor"
                  onClick={closeMenu}
                  className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}
                >
                  Donor Dashboard & Post Food
                </NavLink>
              </li>
            )}
            {isAuthenticated && isNgo && (
              <li>
                <NavLink
                  to="/dashboard/ngo"
                  onClick={closeMenu}
                  className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}
                >
                  NGO Pickups & Live Map
                </NavLink>
              </li>
            )}
            {isAuthenticated && isDelivery && (
              <li>
                <NavLink
                  to="/dashboard/delivery"
                  onClick={closeMenu}
                  className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}
                >
                  Delivery Partner Hub
                </NavLink>
              </li>
            )}
            {isAuthenticated && isAdmin && (
              <li>
                <NavLink
                  to="/dashboard/admin"
                  onClick={closeMenu}
                  className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}
                >
                  👑 Super Admin Operations HQ
                </NavLink>
              </li>
            )}
          </ul>

          <div className="mobile-nav-actions">
            {isAuthenticated ? (
              <>
                {isDelivery && (
                  <div
                    style={{
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      color: '#065F46',
                      padding: '0.5rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Wallet size={16} /> Rider Wallet:
                    </span>
                    <strong style={{ fontSize: '1rem', color: '#059669' }}>₹{user?.walletBalance ?? 0}.00</strong>
                  </div>
                )}
                <div className="user-badge" style={{ width: '100%', marginBottom: '0.5rem' }}>
                  <div
                    className="user-avatar"
                    style={{
                      backgroundColor: isAdmin ? '#1E3A8A' : isDelivery ? 'var(--accent)' : 'var(--primary)',
                    }}
                  >
                    {isAdmin ? '👑' : isDelivery ? '🚚' : user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="user-meta">
                    <span className="user-name">{user?.name}</span>
                    <span className="user-role-tag">{getRoleLabel()}</span>
                  </div>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm btn-full">
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu} className="btn btn-secondary btn-full">
                  Login
                </Link>
                <Link to="/register" onClick={closeMenu} className="btn btn-primary btn-full">
                  Register as Donor, NGO, or Delivery
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
