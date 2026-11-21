import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  Utensils,
  Truck,
  Users,
  ShieldCheck,
  Leaf,
  Globe2,
  ArrowRight,
  Clock,
  CheckCircle,
  Building,
  Sparkles,
} from 'lucide-react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import FoodCard from '../components/FoodCard';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { isDonor, isNgo, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    totalMealsSaved: 14850,
    activeDonors: 38,
    partnerNgos: 24,
    co2SavedKg: 37125,
    activeListingsCount: 0,
  });
  const [recentListings, setRecentListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    // Fetch live statistics
    const fetchStats = async () => {
      try {
        const res = await api.get('/food/stats');
        if (res.data?.data) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load live stats:', err);
      }
    };

    // Fetch recent available listings
    const fetchRecentListings = async () => {
      try {
        const res = await api.get('/food?status=Available');
        if (res.data?.data) {
          setRecentListings(res.data.data.slice(0, 3));
        }
      } catch (err) {
        console.warn('Failed to load recent listings:', err);
      } finally {
        setLoadingListings(false);
      }
    };

    fetchStats();
    fetchRecentListings();
  }, []);

  return (
    <div className="landing-page">
      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={15} style={{ color: 'var(--accent)' }} />
              Zero Hunger Mission • Hyper-local Redistribution
            </div>

            <h1 className="hero-title">
              Bridging <span>Surplus Food</span> to Empty Plates.
            </h1>

            <p className="hero-subtitle">
              Every day, tonnes of freshly prepared banquet and restaurant meals go to
              waste while thousands sleep hungry. BhojanSetu connects compassionate
              food donors directly with verified NGOs to rescue meals in minutes.
            </p>

            <div className="hero-actions">
              <Link
                to={isAuthenticated && isDonor ? '/dashboard/donor' : '/register?role=donor'}
                className="btn btn-accent btn-lg"
              >
                <HeartHandshake size={20} />
                Donate Surplus Food
              </Link>
              <Link to="/feed" className="btn btn-outline btn-lg">
                <Utensils size={18} />
                Find Surplus Food
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="hero-trust-row">
              <div className="trust-item">
                <ShieldCheck size={18} />
                <span>Verified Non-Profits</span>
              </div>
              <div className="trust-item">
                <Clock size={18} />
                <span>Real-Time Expiry Tracking</span>
              </div>
              <div className="trust-item">
                <CheckCircle size={18} />
                <span>Zero Cost Platform</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Preview Card */}
          <div className="hero-visual">
            <div className="hero-card-preview">
              <div className="hero-floating-badge">
                <Clock size={14} />
                <span>Live Rescue Active</span>
              </div>

              <div className="hero-preview-badge-row">
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--food-veg-color)',
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--food-veg-color)',
                    }}
                  ></span>
                  Pure Vegetarian
                </span>
                <span className="status-badge status-available">Available Now</span>
              </div>

              <h3 className="hero-preview-title">
                120 Servings: Dal Makhani, Paneer & Fresh Tawa Rotis
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <Building size={16} />
                  <span>The Grand Heritage Banquets (Indiranagar)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <Utensils size={16} />
                  <span>Fresh dinner surplus packed in clean containers</span>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-cream)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                    Estimated Safe Window
                  </span>
                  <strong style={{ color: 'var(--accent)', fontSize: '0.95rem' }}>
                    Expires in 3h 45m
                  </strong>
                </div>
                <Link to="/feed" className="btn btn-primary btn-sm">
                  View in Feed
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE IMPACT COUNTER */}
      <section className="impact-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Measurable Real-Time Impact</span>
            <h2 className="section-title">Together Eliminating Food Waste</h2>
            <p className="section-subtitle">
              Every listing claimed on BhojanSetu directly feeds vulnerable families and
              prevents greenhouse gas emissions from decomposing landfills.
            </p>
          </div>

          <div className="stats-grid">
            <StatCard
              number={stats.totalMealsSaved}
              label="Meals Saved"
              description="Nourishing servings rescued"
              theme="primary"
              icon={<Utensils size={28} />}
            />
            <StatCard
              number={stats.activeDonors}
              label="Registered Donors"
              description="Hotels, caterers & mess kitchens"
              theme="accent"
              icon={<Building size={28} />}
            />
            <StatCard
              number={stats.partnerNgos}
              label="Partner NGOs"
              description="Verified ground rescue teams"
              theme="emerald"
              icon={<Users size={28} />}
            />
            <StatCard
              number={`${stats.co2SavedKg.toLocaleString()} kg`}
              label="CO₂ Prevented"
              description="Greenhouse gases diverted"
              theme="gold"
              icon={<Leaf size={28} />}
            />
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Simple & Rapid</span>
            <h2 className="section-title">How BhojanSetu Works</h2>
            <p className="section-subtitle">
              Designed for high-speed logistics to rescue perishable cooked food within
              its safety window.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>
              <div className="step-icon-box">
                <Utensils size={26} />
              </div>
              <h3 className="step-title">List Surplus Food in 60s</h3>
              <p className="step-text">
                Donors (restaurants, marriage halls, hostels, caterers) post excess food
                with quantity, preparation time, and expiry deadline.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">02</span>
              <div className="step-icon-box" style={{ backgroundColor: 'var(--accent)' }}>
                <Truck size={26} />
              </div>
              <h3 className="step-title">NGO Claims & Dispatches</h3>
              <p className="step-text">
                Nearby verified NGO volunteers receive the alert, claim the food batch
                instantly, and dispatch their vehicle for pickup.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">03</span>
              <div className="step-icon-box" style={{ backgroundColor: 'var(--primary-light)' }}>
                <CheckCircle size={26} />
              </div>
              <h3 className="step-title">Verified Safe Delivery</h3>
              <p className="step-text">
                Food is verified for safety, transported in hygienic containers, and
                served directly to night shelters, orphanages, and slums.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SDG ALIGNMENT BANNER */}
      <section id="sdg-alignment" className="sdg-section">
        <div className="container">
          <div className="sdg-header">
            <span className="section-tag">Global Sustainable Goals</span>
            <h2 className="section-title">Aligned with United Nations 2030 Agenda</h2>
            <p className="section-subtitle">
              BhojanSetu actively powers tangible progress towards the United Nations
              Sustainable Development Goals.
            </p>
          </div>

          <div className="sdg-grid">
            <div className="sdg-card">
              <div className="sdg-icon-badge sdg2">
                <span className="sdg-num">2</span>
                <span className="sdg-txt">SDG</span>
              </div>
              <div className="sdg-content">
                <h3>UN SDG 2: Zero Hunger</h3>
                <p>
                  Target 2.1: End hunger and ensure access by all people, in particular
                  the poor and people in vulnerable situations, to safe, nutritious, and
                  sufficient food all year round.
                </p>
              </div>
            </div>

            <div className="sdg-card">
              <div className="sdg-icon-badge sdg12">
                <span className="sdg-num">12</span>
                <span className="sdg-txt">SDG</span>
              </div>
              <div className="sdg-content">
                <h3>UN SDG 12: Responsible Consumption</h3>
                <p>
                  Target 12.3: By 2030, halve per capita global food waste at the retail
                  and consumer levels and reduce food losses along production and supply
                  chains.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. RECENT SURPLUS CALLOUTS PREVIEW */}
      <section className="recent-callouts-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Urgent Listings</span>
            <h2 className="section-title">Active Food Calls Right Now</h2>
            <p className="section-subtitle">
              Real-time meals awaiting pickup by registered charity organizations.
            </p>
          </div>

          {loadingListings ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <span className="spinner"></span>
            </div>
          ) : recentListings.length > 0 ? (
            <>
              <div className="feed-grid">
                {recentListings.map((listing) => (
                  <FoodCard key={listing._id} listing={listing} />
                ))}
              </div>
              <div className="view-more-container">
                <Link to="/feed" className="btn btn-primary btn-lg">
                  Explore All Available Surplus Food
                  <ArrowRight size={18} />
                </Link>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p>No active listings at this exact moment.</p>
              <Link to="/feed" className="btn btn-outline" style={{ marginTop: '1rem' }}>
                Go to Live Feed
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="cta-banner-section">
        <div className="container">
          <div className="cta-box">
            <div className="cta-text">
              <h2>Join the Fight Against Hunger</h2>
              <p>
                Whether you manage a commercial kitchen or lead an energetic volunteer
                network, your partnership saves precious meals and protects our planet.
              </p>
            </div>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-accent btn-lg">
                Create Free Account
              </Link>
              <Link to="/feed" className="btn btn-secondary btn-lg">
                View Food Feed
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
