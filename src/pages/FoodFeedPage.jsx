import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw, Utensils, CheckCircle2, AlertCircle, Phone, MapPin, Building } from 'lucide-react';
import api from '../api/axios';
import FoodCard from '../components/FoodCard';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const FoodFeedPage = () => {
  const { isNgo, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [foodType, setFoodType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Available');

  // Claim Modal
  const [selectedListing, setSelectedListing] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccessData, setClaimSuccessData] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const handleSeedDatabase = async () => {
    try {
      setSeeding(true);
      await api.get('/seed');
      await fetchListings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to seed sample food batches. Please check backend.');
    } finally {
      setSeeding(false);
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const params = {};
      if (foodType && foodType !== 'All') {
        params.foodType = foodType;
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      } else {
        params.status = 'all';
      }

      const res = await api.get('/food', { params });
      if (res.data?.data) {
        setListings(res.data.data);
      }
    } catch (err) {
      console.error('Fetch feed error:', err);
      setErrorMsg('Failed to load surplus food feed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [foodType, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchListings();
  };

  const handleResetFilters = () => {
    setSearch('');
    setFoodType('All');
    setStatusFilter('Available');
  };

  const handleInitiateClaim = (listing) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=feed');
      return;
    }
    setSelectedListing(listing);
    setClaimSuccessData(null);
  };

  const handleConfirmClaim = async () => {
    if (!selectedListing) return;

    try {
      setClaiming(true);
      const res = await api.patch(`/food/${selectedListing._id}/claim`);
      if (res.data?.data) {
        setClaimSuccessData(res.data.data);
        // Update local listing list
        setListings((prev) =>
          prev.map((item) =>
            item._id === selectedListing._id ? res.data.data : item
          )
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to claim listing. It may have expired.');
      setSelectedListing(null);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="feed-page">
      <div className="container">
        {/* Header */}
        <div className="feed-header">
          <div className="feed-header-left">
            <h1>Live Surplus Food Feed</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Real-time available donations ready for rescue across your city
            </p>
          </div>

          <div className="feed-header-badge">
            <Utensils size={16} />
            <span>
              {listings.filter((l) => l.status === 'Available').length} Active Batches Available
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <form onSubmit={handleSearchSubmit} className="filter-row-top">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search food title, locality, notes (e.g. Biryani, Indiranagar)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              <Search size={16} />
              Search Feed
            </button>
          </form>

          <div className="filter-row-bottom">
            <div className="type-filter-group">
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px' }}>
                Diet:
              </span>
              <button
                type="button"
                className={`filter-chip ${foodType === 'All' ? 'active' : ''}`}
                onClick={() => setFoodType('All')}
              >
                All Diets
              </button>
              <button
                type="button"
                className={`filter-chip ${foodType === 'Veg' ? 'active veg' : ''}`}
                onClick={() => setFoodType('Veg')}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--food-veg-color)',
                  }}
                ></span>
                Pure Veg
              </button>
              <button
                type="button"
                className={`filter-chip ${foodType === 'Non-Veg' ? 'active non-veg' : ''}`}
                onClick={() => setFoodType('Non-Veg')}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--food-nonveg-color)',
                  }}
                ></span>
                Non-Veg
              </button>
            </div>

            <div className="filter-actions">
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Status:
              </span>
              <button
                type="button"
                className={`filter-chip ${statusFilter === 'Available' ? 'active' : ''}`}
                onClick={() => setStatusFilter('Available')}
              >
                Available Only
              </button>
              <button
                type="button"
                className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All Batches
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetFilters}
                title="Reset filters"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Loading / Grid / Empty State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <span className="spinner"></span>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
              Checking surplus food feeds...
            </p>
          </div>
        ) : listings.length > 0 ? (
          <div className="feed-grid">
            {listings.map((listing) => (
              <FoodCard
                key={listing._id}
                listing={listing}
                onClaim={handleInitiateClaim}
              />
            ))}
          </div>
        ) : (
          <div className="empty-feed">
            <div className="empty-icon-box">
              <Utensils size={32} />
            </div>
            <h3>No Food Batches Found</h3>
            <p>
              We couldn't find any listings matching your current filter criteria, or the database is currently empty.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={handleResetFilters} className="btn btn-outline">
                Clear All Filters
              </button>
              <button
                onClick={handleSeedDatabase}
                disabled={seeding}
                className="btn btn-primary"
              >
                {seeding ? 'Seeding...' : '🌱 Seed Sample Surplus Food Batches'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Claim Confirmation / Detail Modal */}
      <Modal
        isOpen={!!selectedListing}
        onClose={() => {
          setSelectedListing(null);
          setClaimSuccessData(null);
        }}
        title={claimSuccessData ? '🎉 Food Batch Successfully Claimed!' : 'Confirm Food Rescue Pickup'}
        footer={
          claimSuccessData ? (
            <button
              onClick={() => {
                setSelectedListing(null);
                navigate('/dashboard/ngo');
              }}
              className="btn btn-primary"
            >
              Go to NGO Active Pickups
            </button>
          ) : (
            <>
              <button
                onClick={() => setSelectedListing(null)}
                className="btn btn-secondary"
                disabled={claiming}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClaim}
                className="btn btn-accent"
                disabled={claiming}
              >
                {claiming ? (
                  <>
                    <span className="spinner spinner-sm spinner-light"></span>
                    Confirming Claim...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Confirm Claim & Coordinate Pickup
                  </>
                )}
              </button>
            </>
          )
        }
      >
        {selectedListing && !claimSuccessData && (
          <div>
            <p style={{ marginBottom: '1.25rem', color: 'var(--text-main)', fontSize: '0.95rem' }}>
              Are you sure your volunteer team can pick up this surplus food batch
              before the safety expiration deadline?
            </p>

            <div
              style={{
                backgroundColor: 'var(--bg-cream)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                fontSize: '0.9rem',
              }}
            >
              <div>
                <strong>Item:</strong> {selectedListing.title}
              </div>
              <div>
                <strong>Quantity:</strong> {selectedListing.quantityServings} servings ({selectedListing.foodType})
              </div>
              <div>
                <strong>Donor Kitchen:</strong> {selectedListing.donor?.organizationName || 'Verified Donor'}
              </div>
              <div>
                <strong>Pickup Locality:</strong> {selectedListing.locality}
              </div>
              <div>
                <strong>Address:</strong> {selectedListing.pickupAddress}
              </div>
            </div>
          </div>
        )}

        {claimSuccessData && (
          <div>
            <div className="alert alert-success">
              <CheckCircle2 size={18} />
              <span>
                You have reserved this food! Please immediately contact the donor to coordinate volunteer arrival.
              </span>
            </div>

            <div
              style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 700 }}>
                <Building size={16} />
                <span>{claimSuccessData.donor?.organizationName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534' }}>
                <Phone size={16} />
                <span>
                  Donor Contact:{' '}
                  <a
                    href={`tel:${claimSuccessData.contactPhone || claimSuccessData.donor?.phone}`}
                    style={{ fontWeight: 700, color: '#166534', textDecoration: 'underline' }}
                  >
                    {claimSuccessData.contactPhone || claimSuccessData.donor?.phone}
                  </a>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534' }}>
                <MapPin size={16} />
                <span>Full Address: {claimSuccessData.pickupAddress}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FoodFeedPage;
