import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  Check,
  X,
  Navigation,
  LocateFixed,
  ExternalLink,
  Layers,
  Compass,
  Edit3,
  Sparkles,
  Zap,
  Loader2,
} from 'lucide-react';
import Modal from './Modal';

// Popular nationwide city presets across India
const NATIONWIDE_HUBS = [
  { name: 'New Delhi / NCR', lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  { name: 'Patna', lat: 25.5941, lng: 85.1376, state: 'Bihar' },
];

/**
 * Extracts latitude and longitude from any Google Maps URL, query string, or raw "lat, lng" text
 */
export const parseGoogleMapsInput = (input) => {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim();

  // 1. Raw coordinates e.g. "28.6139, 77.2090" or "28.6139 77.2090"
  const rawMatch = str.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
  if (rawMatch) {
    const lat = parseFloat(rawMatch[1]);
    const lng = parseFloat(rawMatch[3]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: Number(lat.toFixed(4)), longitude: Number(lng.toFixed(4)) };
    }
  }

  // 2. Google Maps URL with @lat,lng e.g. "https://www.google.com/maps/@28.6139,77.2090,15z"
  const atMatch = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return {
      latitude: Number(parseFloat(atMatch[1]).toFixed(4)),
      longitude: Number(parseFloat(atMatch[2]).toFixed(4)),
    };
  }

  // 3. Google Maps URL with ?q=lat,lng or ll=lat,lng
  const queryMatch = str.match(/[?&](?:q|ll)=(-?\d+\.\d+)[,%20]+(-?\d+\.\d+)/i);
  if (queryMatch) {
    return {
      latitude: Number(parseFloat(queryMatch[1]).toFixed(4)),
      longitude: Number(parseFloat(queryMatch[2]).toFixed(4)),
    };
  }

  // 4. Google Maps place URL e.g. "!3d28.6139!4d77.2090"
  const embedMatch = str.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (embedMatch) {
    return {
      latitude: Number(parseFloat(embedMatch[1]).toFixed(4)),
      longitude: Number(parseFloat(embedMatch[2]).toFixed(4)),
    };
  }

  return null;
};

const LocationPickerModal = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialCoords = null,
  referenceCoords = null, // e.g. Donor kitchen coordinates to offer a 1-click snap
  title = '📍 Search Any City or Pick Location on Map',
}) => {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);

  const [activeMode, setActiveMode] = useState('map'); // 'map' or 'manual'

  // Default coordinate determination (avoids hardcoding Bengaluru)
  const defaultLat = initialCoords?.latitude || (referenceCoords?.latitude ? referenceCoords.latitude : 28.6139);
  const defaultLng = initialCoords?.longitude || (referenceCoords?.longitude ? referenceCoords.longitude : 77.2090);

  const [pickedLat, setPickedLat] = useState(defaultLat);
  const [pickedLng, setPickedLng] = useState(defaultLng);
  const [addressText, setAddressText] = useState(initialCoords?.address || 'Selected Location');

  // Interactive OpenStreetMap Nominatim Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');

  // Google Maps / Manual Parse State
  const [googleMapsInput, setGoogleMapsInput] = useState('');
  const [parseError, setParseError] = useState('');
  const [manualLatStr, setManualLatStr] = useState(String(defaultLat));
  const [manualLngStr, setManualLngStr] = useState(String(defaultLng));

  // Reverse geocoding helper via OpenStreetMap Nominatim
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const parts = [];
          if (data.address) {
            const a = data.address;
            const sub = a.suburb || a.neighbourhood || a.road || a.commercial || '';
            const city = a.city || a.town || a.county || a.state_district || '';
            const state = a.state || '';
            if (sub) parts.push(sub);
            if (city && city !== sub) parts.push(city);
            if (state) parts.push(state);
          }
          const formatted = parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 3).join(',');
          setAddressText(formatted);
          return formatted;
        }
      }
    } catch (e) {
      // Fallback silently if offline or rate limited
    }
    return `Pin (${lat}, ${lng})`;
  };

  // Update initial coordinates when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialCoords?.latitude && initialCoords?.longitude) {
        setPickedLat(initialCoords.latitude);
        setPickedLng(initialCoords.longitude);
        setManualLatStr(String(initialCoords.latitude));
        setManualLngStr(String(initialCoords.longitude));
        setAddressText(initialCoords.address || 'Selected Location');
      } else {
        // If no coords provided, try auto-acquiring device GPS once
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = Number(pos.coords.latitude.toFixed(4));
              const lng = Number(pos.coords.longitude.toFixed(4));
              jumpToCoords(lat, lng, 'My Device Current GPS');
              reverseGeocode(lat, lng);
            },
            () => {},
            { timeout: 5000, enableHighAccuracy: true }
          );
        }
      }
      setParseError('');
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [isOpen, initialCoords]);

  // Initialize or update Leaflet Map in Modal
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let mapInstance = null;

    const setupMap = () => {
      if (typeof window !== 'undefined' && window.L && mapContainerRef.current) {
        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        }

        const L = window.L;

        mapInstance = L.map(mapContainerRef.current, {
          center: [pickedLat, pickedLng],
          zoom: 13,
          zoomControl: true,
        });

        // Standard OpenStreetMap tiles (100% Free, NO API Key required)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstance);

        // Custom draggable marker pin
        const pinIcon = L.divIcon({
          className: 'leaflet-bhojan-marker',
          html: `
            <div class="marker-pin driver" style="background-color: #E76F51; width: 40px; height: 40px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
              <span style="font-size: 16px;">📍</span>
            </div>
          `,
          iconSize: [40, 50],
          iconAnchor: [20, 46],
        });

        const marker = L.marker([pickedLat, pickedLng], {
          icon: pinIcon,
          draggable: true,
        }).addTo(mapInstance);

        markerRef.current = marker;

        // When user drags marker
        marker.on('dragend', async (e) => {
          const latlng = e.target.getLatLng();
          const newLat = Number(latlng.lat.toFixed(4));
          const newLng = Number(latlng.lng.toFixed(4));
          setPickedLat(newLat);
          setPickedLng(newLng);
          setManualLatStr(String(newLat));
          setManualLngStr(String(newLng));
          setAddressText(`Resolving address...`);
          await reverseGeocode(newLat, newLng);
        });

        // When user clicks anywhere on the map, move the pin there!
        mapInstance.on('click', async (e) => {
          const newLat = Number(e.latlng.lat.toFixed(4));
          const newLng = Number(e.latlng.lng.toFixed(4));
          setPickedLat(newLat);
          setPickedLng(newLng);
          setManualLatStr(String(newLat));
          setManualLngStr(String(newLng));
          marker.setLatLng([newLat, newLng]);
          setAddressText(`Resolving address...`);
          await reverseGeocode(newLat, newLng);
        });

        leafletMapRef.current = mapInstance;

        // Leaflet resize invalidate fix
        setTimeout(() => {
          if (mapInstance) {
            mapInstance.invalidateSize();
            mapInstance.setView([pickedLat, pickedLng], 13);
          }
        }, 200);
      }
    };

    const timer = setTimeout(setupMap, 150);

    return () => {
      clearTimeout(timer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [isOpen, activeMode]);

  // Programmatically jump pin and center map
  const jumpToCoords = (lat, lng, label) => {
    const numericLat = Number(Number(lat).toFixed(4));
    const numericLng = Number(Number(lng).toFixed(4));
    setPickedLat(numericLat);
    setPickedLng(numericLng);
    setManualLatStr(String(numericLat));
    setManualLngStr(String(numericLng));
    if (label) setAddressText(label);
    setParseError('');

    if (leafletMapRef.current) {
      leafletMapRef.current.setView([numericLat, numericLng], 14, { animate: true });
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([numericLat, numericLng]);
    }
  };

  // Perform live Search on OpenStreetMap Nominatim
  const handlePerformSearch = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query || query.length < 2) return;

    try {
      setSearching(true);
      setSearchStatus('Searching places across India...');
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=6&countrycodes=in&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setSearchResults(data);
          setShowSearchDropdown(true);
          setSearchStatus('');
        } else {
          setSearchResults([]);
          setSearchStatus(`No matches found for "${query}". Try searching with city name.`);
        }
      }
    } catch (err) {
      setSearchStatus('Search failed. Please check network connection.');
    } finally {
      setSearching(false);
    }
  };

  // When user selects a place from search dropdown
  const handleSelectSearchResult = (item) => {
    const lat = Number(parseFloat(item.lat).toFixed(4));
    const lng = Number(parseFloat(item.lon).toFixed(4));
    const cleanLabel = item.display_name.split(',').slice(0, 3).join(', ');
    jumpToCoords(lat, lng, cleanLabel);
    setSearchQuery(cleanLabel);
    setShowSearchDropdown(false);
    setSearchResults([]);
  };

  // Handle Google Maps Input Parse
  const handleParseGoogleMaps = (e) => {
    e.preventDefault();
    setParseError('');

    const parsed = parseGoogleMapsInput(googleMapsInput);
    if (parsed) {
      jumpToCoords(parsed.latitude, parsed.longitude, `Google Maps Pin (${parsed.latitude}, ${parsed.longitude})`);
      reverseGeocode(parsed.latitude, parsed.longitude);
      setGoogleMapsInput('');
    } else {
      setParseError(
        'Could not detect coordinates. Please paste a valid Google Maps link (e.g. https://www.google.com/maps/@28.6139,77.2090... or coordinates like "28.6139, 77.2090").'
      );
    }
  };

  // Device GPS auto-detect inside modal
  const handleDetectDeviceGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setAddressText('Acquiring real device GPS...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        jumpToCoords(lat, lng, 'My Device Current GPS');
        await reverseGeocode(lat, lng);
      },
      (err) => {
        alert('Could not acquire device GPS. You can search your city above or type manual coordinates.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Quick 1-click snap near donor kitchen (for instant demonstration of local city turnaround)
  const handleSnapNearReference = () => {
    if (referenceCoords?.latitude && referenceCoords?.longitude) {
      const lat = Number((referenceCoords.latitude + 0.012).toFixed(4));
      const lng = Number((referenceCoords.longitude - 0.008).toFixed(4));
      jumpToCoords(lat, lng, 'Nearby Local Neighborhood (~2.2 km from kitchen)');
      reverseGeocode(lat, lng);
    } else {
      // Near default
      jumpToCoords(28.6250, 77.2180, 'Central City (~2.2 km away)');
      reverseGeocode(28.6250, 77.2180);
    }
  };

  // Handle Manual Lat/Lng change
  const handleManualApply = async () => {
    const lat = parseFloat(manualLatStr);
    const lng = parseFloat(manualLngStr);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setParseError('Please enter valid decimal coordinates (Lat between -90 and 90, Lng between -180 and 180).');
      return;
    }
    jumpToCoords(lat, lng, addressText || `Manual Coordinates (${lat}, ${lng})`);
    await reverseGeocode(lat, lng);
  };

  const handleConfirm = () => {
    onSelectLocation({
      latitude: pickedLat,
      longitude: pickedLng,
      address: addressText,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleConfirm} className="btn btn-primary">
            <Check size={16} />
            Confirm & Apply Location
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Search Through Map - OpenStreetMap Nominatim Bar */}
        <div style={{ position: 'relative' }}>
          <form onSubmit={handlePerformSearch} style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="🔍 Search any city, area, landmark, or pincode across India (e.g. Connaught Place Delhi, Andheri Mumbai, Hazratganj Lucknow...)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length >= 3) {
                    setShowSearchDropdown(true);
                  }
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchDropdown(false);
                  }}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9CA3AF',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={searching}
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0, minWidth: '95px' }}
            >
              {searching ? <Loader2 size={14} className="spin-animate" /> : <Search size={14} />}
              {searching ? 'Finding...' : 'Search Map'}
            </button>
          </form>

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                border: '1px solid var(--border-light)',
                marginTop: '4px',
                zIndex: 2000,
                maxHeight: '220px',
                overflowY: 'auto',
              }}
            >
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSearchResult(item)}
                  style={{
                    padding: '0.65rem 1rem',
                    cursor: 'pointer',
                    borderBottom: idx === searchResults.length - 1 ? 'none' : '1px solid #F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    fontSize: '0.85rem',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                >
                  <MapPin size={16} style={{ color: '#E76F51', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'var(--text-main)', display: 'block' }}>
                      {item.display_name.split(',')[0]}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.display_name.split(',').slice(1, 4).join(', ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchStatus && (
            <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '0.25rem', paddingLeft: '4px' }}>
              {searchStatus}
            </div>
          )}
        </div>

        {/* 1-Click Fast Actions: Device GPS & Snap Near Kitchen */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleDetectDeviceGps}
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 700 }}
            title="Detect real device GPS position"
          >
            <LocateFixed size={14} style={{ color: '#059669' }} />
            📍 Use My Current Device GPS
          </button>

          {referenceCoords && (
            <button
              type="button"
              onClick={handleSnapNearReference}
              className="btn btn-sm"
              style={{
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                borderColor: '#FDE68A',
                fontWeight: 700,
              }}
              title="Instantly sets location near the donor kitchen to test local delivery"
            >
              <Zap size={14} />
              ⚡ Snap Near Kitchen (~2.2 km away)
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.35rem' }}>
            <button
              type="button"
              className={`btn btn-xs ${activeMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveMode('map')}
            >
              <Compass size={12} />
              Map Pin
            </button>
            <button
              type="button"
              className={`btn btn-xs ${activeMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveMode('manual')}
            >
              <Edit3 size={12} />
              Coordinates
            </button>
          </div>
        </div>

        {/* Mode 1: Interactive Map Stage */}
        {activeMode === 'map' && (
          <div style={{ position: 'relative' }}>
            <div
              ref={mapContainerRef}
              style={{
                height: '320px',
                width: '100%',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                overflow: 'hidden',
                backgroundColor: '#E5E7EB',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                boxShadow: 'var(--shadow-sm)',
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            >
              💡 Click anywhere or drag the pin to set your exact location
            </div>
          </div>
        )}

        {/* Mode 2: Manual Coordinates Input Form & Google Maps Parser */}
        {activeMode === 'manual' && (
          <div
            style={{
              backgroundColor: 'var(--bg-cream)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <form onSubmit={handleParseGoogleMaps}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-deep)', display: 'block', marginBottom: '4px' }}>
                Paste Google Maps URL or "lat, lng" coordinates:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. https://www.google.com/maps/@28.6139,77.2090,15z"
                  value={googleMapsInput}
                  onChange={(e) => setGoogleMapsInput(e.target.value)}
                />
                <button type="submit" className="btn btn-accent btn-sm" style={{ flexShrink: 0 }}>
                  <Navigation size={14} />
                  Parse
                </button>
              </div>
              {parseError && <p style={{ color: '#B91C1C', fontSize: '0.8rem', marginTop: '0.25rem' }}>{parseError}</p>}
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>
                  Latitude <span className="required">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  className="form-input"
                  value={manualLatStr}
                  onChange={(e) => setManualLatStr(e.target.value)}
                  placeholder="e.g. 28.6139"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>
                  Longitude <span className="required">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  className="form-input"
                  value={manualLngStr}
                  onChange={(e) => setManualLngStr(e.target.value)}
                  placeholder="e.g. 77.2090"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleManualApply} className="btn btn-primary btn-sm">
                Apply Coordinates
              </button>
            </div>
          </div>
        )}

        {/* Quick Nationwide City Hub Chips */}
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
            Quick Nationwide City Hubs:
          </span>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {NATIONWIDE_HUBS.map((h) => (
              <button
                key={h.name}
                type="button"
                onClick={() => jumpToCoords(h.lat, h.lng, `${h.name}, ${h.state}`)}
                className="filter-chip"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.55rem',
                  backgroundColor: Math.abs(pickedLat - h.lat) < 0.05 && Math.abs(pickedLng - h.lng) < 0.05 ? 'var(--primary-tint)' : '#FFFFFF',
                  borderColor: Math.abs(pickedLat - h.lat) < 0.05 && Math.abs(pickedLng - h.lng) < 0.05 ? 'var(--primary)' : 'var(--border-light)',
                  color: Math.abs(pickedLat - h.lat) < 0.05 && Math.abs(pickedLng - h.lng) < 0.05 ? 'var(--primary-deep)' : 'var(--text-main)',
                  fontWeight: Math.abs(pickedLat - h.lat) < 0.05 && Math.abs(pickedLng - h.lng) < 0.05 ? 700 : 500,
                }}
              >
                🏙️ {h.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Coordinates Readout Banner */}
        <div
          style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.825rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            <strong style={{ color: '#166534' }}>📍 Target Location:</strong>
            <span style={{ color: '#166534', marginLeft: '0.4rem' }}>
              Lat: <strong>{pickedLat}</strong> • Lng: <strong>{pickedLng}</strong>
            </span>
            <div style={{ fontSize: '0.78rem', color: '#15803D', marginTop: '2px', fontWeight: 600 }}>
              {addressText}
            </div>
          </div>

          <a
            href={`https://www.google.com/maps?q=${pickedLat},${pickedLng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#166534',
              textDecoration: 'underline',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            Verify on Google Maps
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </Modal>
  );
};

export default LocationPickerModal;
