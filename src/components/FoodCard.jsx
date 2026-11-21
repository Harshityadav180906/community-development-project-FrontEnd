import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Building, Utensils, Info, Check, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import ExpiryTimer from './ExpiryTimer';
import { useAuth } from '../context/AuthContext';

const FoodCard = ({ listing, onClaim, claimingId }) => {
  const navigate = useNavigate();
  const { user, isNgo, isAuthenticated } = useAuth();

  const isVeg = listing.foodType === 'Veg';
  const isAvailable = listing.status === 'Available';
  const isClaimingThis = claimingId === listing._id;

  const handleClaimClick = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=feed');
      return;
    }
    if (onClaim) {
      onClaim(listing);
    }
  };

  return (
    <article className="food-card">
      <div className="food-card-header">
        <div className="food-card-header-left">
          <div
            className={`fssai-indicator ${isVeg ? 'veg' : 'non-veg'}`}
            title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
          >
            <span className="fssai-dot"></span>
          </div>
          <span className={`food-card-type-tag ${isVeg ? 'veg' : 'non-veg'}`}>
            {listing.foodType}
          </span>
        </div>
        <StatusBadge status={listing.status} />
      </div>

      <div className="food-card-body">
        <h3 className="food-card-title">{listing.title}</h3>

        <div className="food-card-meta">
          <div className="meta-row servings-highlight">
            <Utensils size={15} />
            <span>
              <strong>{listing.quantityServings}</strong> Servings Available
            </span>
          </div>

          <div className="meta-row">
            <Building size={15} />
            <span>{listing.donor?.organizationName || 'Verified Donor'}</span>
          </div>

          <div className="meta-row">
            <MapPin size={15} />
            <span>
              {listing.locality}
              {listing.donor?.city ? `, ${listing.donor.city}` : ''}
            </span>
          </div>

          {/* 15 km Delivery Service Radius Indicator */}
          <div className="meta-row" style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
            {listing.isOutOfRadius ? (
              <span style={{ color: '#2563EB', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                🚀 Outside 15 km • We are coming to your area soon!
              </span>
            ) : (
              <span style={{ color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                🛵 Within 15 km Rider Delivery Zone
              </span>
            )}
          </div>
        </div>

        {listing.notes && (
          <div className="food-card-notes">
            "{listing.notes}"
          </div>
        )}
      </div>

      <div className="food-card-footer">
        <div>
          {isAvailable ? (
            <ExpiryTimer expiresAt={listing.expiresAt} />
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {listing.status === 'Claimed' ? 'Assigned for pickup' : listing.status}
            </span>
          )}
        </div>

        <div>
          {isAvailable && isNgo && (
            <button
              onClick={handleClaimClick}
              disabled={isClaimingThis}
              className="btn btn-accent btn-sm"
            >
              {isClaimingThis ? (
                <>
                  <span className="spinner spinner-sm spinner-light"></span>
                  Claiming...
                </>
              ) : (
                <>
                  <Check size={14} />
                  Claim Food
                </>
              )}
            </button>
          )}

          {isAvailable && !isAuthenticated && (
            <button
              onClick={handleClaimClick}
              className="btn btn-outline btn-sm"
            >
              Claim (NGO)
              <ArrowRight size={13} />
            </button>
          )}

          {isAvailable && isAuthenticated && !isNgo && (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              NGO claim only
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default FoodCard;
