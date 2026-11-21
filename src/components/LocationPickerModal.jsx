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
} from 'lucide-react';
import Modal from './Modal';

// Popular locality coordinate presets in Bengaluru
const QUICK_HUBS = [
  { name: 'Koramangala (Near Donor)', lat: 12.9352, lng: 77.6245 },
  { name: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  { name: 'HSR Layout', lat: 12.9121, lng: 77.6446 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7500 },
  { name: 'Jayanagar', lat: 12.9308, lng: 77.5838 },
  { name: 'MG Road / Central', lat: 12.9756, lng: 77.6066 },
];

/**
 * Extracts latitude and longitude from any Google Maps URL, query string, or raw "lat, lng" text
 */
export const parseGoogleMapsInput = (input) => {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim();

  // 1. Raw coordinates e.g. "12.9352, 77.6245" or "12.9352 77.6245"
  const rawMatch = str.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
  if (rawMatch) {
    const lat = parseFloat(rawMatch[1]);
    const lng = parseFloat(rawMatch[3]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: Number(lat.toFixed(4)), longitude: Number(lng.toFixed(4)) };
    }
  }

  // 2. Google Maps URL with @lat,lng e.g. "https://www.google.com/maps/@12.9352,77.6245,15z"
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

  // 4. Google Maps place URL e.g. "!3d12.9352!4d77.6245"
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
  initialCoords = { latitude: 12.9352, longitude: 77.6245 },
  referenceCoords = null, // e.g. Donor kitchen coordinates to offer a 1-click snap
  title = '📍 Set Location (Manual Coordinates & Google Maps)',
}) => {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);

  const [activeMode, setActiveMode] = useState('map'); // 'map' or 'manual'
  const [pickedLat, setPickedLat] = useState(initialCoords?.latitude || 12.9352);
  const [pickedLng, setPickedLng] = useState(initialCoords?.longitude || 77.6245);
  const [addressText, setAddressText] = useState(initialCoords?.address || 'Selected Pin Location');
  const [googleMapsInput, setGoogleMapsInput] = useState('');
  const [parseError, setParseError] = useState('');
  const [manualLatStr, setManualLatStr] = useState(String(initialCoords?.latitude || '12.9352'));
  const [manualLngStr, setManualLngStr] = useState(String(initialCoords?.longitude || '77.6245'));

  // Update initial coordinates when modal opens
  useEffect(() => {
    if (isOpen) {
      const lat = initialCoords?.latitude || 12.9352;
      const lng = initialCoords?.longitude || 77.6245;
      setPickedLat(lat);
      setPickedLng(lng);
      setManualLatStr(String(lat));
      setManualLngStr(String(lng));
      setAddressText(initialCoords?.address || 'Selected Location');
      setParseError('');
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
          zoom: 14,
          zoomControl: true,
        });

        // Standard OpenStreetMap tiles (100% Free, NO API Key required)
        L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }
        ).addTo(mapInstance);

        // Custom draggable marker pin
        const pinIcon = L.divIcon({
          className: 'leaflet-bhojan-marker',
          html: `
            <div class="marker-pin driver" style="background-color: #E76F51; width: 40px; height: 40px;">
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
        marker.on('dragend', (e) => {
          const latlng = e.target.getLatLng();
          const newLat = Number(latlng.lat.toFixed(4));
          const newLng = Number(latlng.lng.toFixed(4));
          setPickedLat(newLat);
          setPickedLng(newLng);
          setManualLatStr(String(newLat));
          setManualLngStr(String(newLng));
          setAddressText(`Custom Pin (${newLat}, ${newLng})`);
        });

        // When user clicks anywhere on the map, move the pin there!
        mapInstance.on('click', (e) => {
          const newLat = Number(e.latlng.lat.toFixed(4));
          const newLng = Number(e.latlng.lng.toFixed(4));
          setPickedLat(newLat);
          setPickedLng(newLng);
          setManualLatStr(String(newLat));
          setManualLngStr(String(newLng));
          marker.setLatLng([newLat, newLng]);
          setAddressText(`Clicked Location (${newLat}, ${newLng})`);
        });

        leafletMapRef.current = mapInstance;

        // Leaflet resize invalidate fix
        setTimeout(() => {
          if (mapInstance) {
            mapInstance.invalidateSize();
            mapInstance.setView([pickedLat, pickedLng], 14);
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
    setAddressText(label || `${numericLat}, ${numericLng}`);
    setParseError('');

    if (leafletMapRef.current && markerRef.current) {
      markerRef.current.setLatLng([numericLat, numericLng]);
      leafletMapRef.current.setView([numericLat, numericLng], 15);
    }
  };

  // Handle Google Maps Input Parse
  const handleParseGoogleMaps = (e) => {
    e.preventDefault();
    setParseError('');

    const parsed = parseGoogleMapsInput(googleMapsInput);
    if (parsed) {
      jumpToCoords(parsed.latitude, parsed.longitude, `Google Maps Pin (${parsed.latitude}, ${parsed.longitude})`);
      setGoogleMapsInput('');
    } else {
      setParseError(
        'Could not detect coordinates. Please paste a valid Google Maps link (e.g. https://www.google.com/maps/@12.9352,77.6245... or coordinates like "12.9352, 77.6245").'
      );
    }
  };

  // Device GPS auto-detect inside modal
  const handleDetectDeviceGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        jumpToCoords(lat, lng, 'My Device Current GPS');
      },
      (err) => {
        alert('Could not acquire device GPS. You can type manual coordinates.');
      },
      { enableHighAccuracy: true }
    );
  };

  // Quick 1-click snap near donor kitchen (for instant demonstration of local city turnaround)
  const handleSnapNearReference = () => {
    if (referenceCoords?.latitude && referenceCoords?.longitude) {
      const lat = Number((referenceCoords.latitude + 0.012).toFixed(4));
      const lng = Number((referenceCoords.longitude - 0.008).toFixed(4));
      jumpToCoords(lat, lng, 'Local City Neighborhood (~2.2 km from kitchen)');
    } else {
      // Default near Koramangala
      jumpToCoords(12.9450, 77.6320, 'Koramangala (~2.2 km from kitchen)');
    }
  };

  // Handle Manual Lat/Lng change
  const handleManualApply = () => {
    const lat = parseFloat(manualLatStr);
    const lng = parseFloat(manualLngStr);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setParseError('Please enter valid decimal coordinates (Lat between -90 and 90, Lng between -180 and 180).');
      return;
    }
    jumpToCoords(lat, lng, addressText || `Manual Coordinates (${lat}, ${lng})`);
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveMode('map')}
          >
            <Compass size={14} />
            Google Map & Interactive Pin
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveMode('manual')}
          >
            <Edit3 size={14} />
            Manual Coordinates Input
          </button>
        </div>

        {/* Option A: Google Maps Link / Coordinate Paste Bar */}
        <form onSubmit={handleParseGoogleMaps}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-deep)', margin: 0 }}>
              Paste Google Maps URL or Coordinates:
            </label>
            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.78rem',
                color: 'var(--primary)',
                fontWeight: 600,
                textDecoration: 'underline',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              Open Google Maps ↗
            </a>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. https://www.google.com/maps/@12.9352,77.6245,15z or 12.9352, 77.6245"
              value={googleMapsInput}
              onChange={(e) => setGoogleMapsInput(e.target.value)}
            />
            <button type="submit" className="btn btn-accent btn-sm" style={{ flexShrink: 0 }}>
              <Navigation size={14} />
              Set Pin
            </button>
          </div>
          {parseError && (
            <p style={{ color: '#B91C1C', fontSize: '0.8rem', marginTop: '0.35rem' }}>
              {parseError}
            </p>
          )}
        </form>

        {/* 1-Click Simulation / Preset Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
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

          <button
            type="button"
            onClick={handleDetectDeviceGps}
            className="btn btn-secondary btn-sm"
            title="Detect real device GPS"
          >
            <LocateFixed size={14} />
            Auto-Device GPS
          </button>
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

        {/* Mode 2: Manual Coordinates Input Form */}
        {activeMode === 'manual' && (
          <div
            style={{
              backgroundColor: 'var(--bg-cream)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  Latitude (decimal) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  className="form-input"
                  value={manualLatStr}
                  onChange={(e) => setManualLatStr(e.target.value)}
                  placeholder="e.g. 12.9352"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  Longitude (decimal) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  className="form-input"
                  value={manualLngStr}
                  onChange={(e) => setManualLngStr(e.target.value)}
                  placeholder="e.g. 77.6245"
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Custom Address / Locality</label>
              <input
                type="text"
                className="form-input"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                placeholder="e.g. Koramangala 4th Block, Bengaluru"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleManualApply} className="btn btn-primary btn-sm">
                Apply Coordinates to Map Pin
              </button>
            </div>
          </div>
        )}

        {/* Quick Local Hub Jump Chips */}
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
            Quick City Hub Presets:
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {QUICK_HUBS.map((h) => (
              <button
                key={h.name}
                type="button"
                onClick={() => jumpToCoords(h.lat, h.lng, `${h.name}, Bengaluru`)}
                className="filter-chip"
                style={{
                  fontSize: '0.78rem',
                  padding: '0.25rem 0.65rem',
                  backgroundColor: pickedLat === h.lat ? 'var(--primary-tint)' : '#FFFFFF',
                  borderColor: pickedLat === h.lat ? 'var(--primary)' : 'var(--border-light)',
                  color: pickedLat === h.lat ? 'var(--primary-deep)' : 'var(--text-main)',
                  fontWeight: pickedLat === h.lat ? 700 : 500,
                }}
              >
                📍 {h.name}
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
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            <strong style={{ color: '#166534' }}>Selected GPS:</strong>
            <span style={{ color: '#166534', marginLeft: '0.4rem' }}>
              Lat: <strong>{pickedLat}</strong> • Lng: <strong>{pickedLng}</strong>
            </span>
            <div style={{ fontSize: '0.78rem', color: '#15803D', marginTop: '2px' }}>
              {addressText}
            </div>
          </div>

          <a
            href={`https://www.google.com/maps?q=${pickedLat},${pickedLng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.78rem',
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
