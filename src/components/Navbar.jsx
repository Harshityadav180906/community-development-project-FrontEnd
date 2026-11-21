import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HeartHandshake, LogOut, Menu, X, PlusCircle, Truck, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isDonor, isNgo, isDelivery, logout } = useAuth();
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
        </ul>

        {/* Desktop Actions */}
        <div className="nav-actions nav-desktop">
          {isAuthenticated ? (
            <>
              <div className="user-badge">
                <div
                  className="user-avatar"
                  style={{
                    backgroundColor: isDelivery ? 'var(--accent)' : 'var(--primary)',
                  }}
                >
                  {isDelivery ? '🚚' : user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
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
          </ul>

          <div className="mobile-nav-actions">
            {isAuthenticated ? (
              <>
                <div className="user-badge" style={{ width: 'fit-content' }}>
                  <div
                    className="user-avatar"
                    style={{
                      backgroundColor: isDelivery ? 'var(--accent)' : 'var(--primary)',
                    }}
                  >
                    {isDelivery ? '🚚' : user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
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
