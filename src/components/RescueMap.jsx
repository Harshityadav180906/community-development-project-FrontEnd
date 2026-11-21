import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Truck,
  Building,
  Navigation,
  ExternalLink,
  LocateFixed,
  Compass,
  Layers,
  Clock,
  Route,
  Maximize2,
  Edit3,
  Zap,
  AlertTriangle,
} from 'lucide-react';

const RescueMap = ({
  donorLocation,
  driverLocation,
  ngoLocation,
  title = 'Real-Time Mission Route',
  height = '440px',
  onRefreshLocation,
  onOpenLocationPicker,
  onSnapNearKitchen,
}) => {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const [mapEngine, setMapEngine] = useState('loading'); // 'leaflet' or 'vector'

  // Coordinate resolution
  const donor = {
    lat: Number(donorLocation?.latitude) || 12.9784,
    lng: Number(donorLocation?.longitude) || 77.6408,
    name: donorLocation?.name || 'Donor Kitchen (Pickup)',
    address: donorLocation?.address || 'Pickup Point',
  };

  const driver = driverLocation
    ? {
        lat: Number(driverLocation?.latitude) || 12.975,
        lng: Number(driverLocation?.longitude) || 77.635,
        name: driverLocation?.name || 'Delivery Partner',
        vehicle: driverLocation?.vehicleNumber
          ? `${driverLocation.vehicleType || 'Vehicle'} (${driverLocation.vehicleNumber})`
          : driverLocation.vehicleType || 'Delivery Partner',
        phone: driverLocation?.phone,
      }
    : null;

  const ngo = {
    lat: Number(ngoLocation?.latitude) || 12.9121,
    lng: Number(ngoLocation?.longitude) || 77.6446,
    name: ngoLocation?.name || 'NGO Shelter / Food Distribution Center',
    address: ngoLocation?.address || 'Destination',
  };

  // Haversine distance calculator
  const calcDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  const driverToDonorDist = driver
    ? calcDistance(driver.lat, driver.lng, donor.lat, donor.lng)
    : 0;
  const donorToNgoDist = calcDistance(donor.lat, donor.lng, ngo.lat, ngo.lng);
  const totalMissionKm = Number((driverToDonorDist + donorToNgoDist).toFixed(1));
  const estimatedTimeMins = Math.max(
    5,
    Math.round(totalMissionKm * 3.2 + 8)
  );

  const isInterCityDistance = driverToDonorDist > 50;

  // Initialize Leaflet OpenStreetMap if window.L is ready
  useEffect(() => {
    let mapInstance = null;

    const initMap = () => {
      if (typeof window !== 'undefined' && window.L && mapContainerRef.current) {
        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        }

        try {
          const L = window.L;

          mapInstance = L.map(mapContainerRef.current, {
            center: [donor.lat, donor.lng],
            zoom: 13,
            zoomControl: true,
            scrollWheelZoom: true,
          });

          // Standard OpenStreetMap tiles (100% Free, NO API Key required)
          L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 19,
            }
          ).addTo(mapInstance);

          const boundsPoints = [
            [donor.lat, donor.lng],
            [ngo.lat, ngo.lng],
          ];

          // 1. Donor Marker
          const donorIcon = L.divIcon({
            className: 'leaflet-bhojan-marker',
            html: `
              <div class="marker-pin donor">
                <span style="font-size: 13px;">🍽️</span>
              </div>
              <div class="marker-label"><strong>Pickup:</strong> ${donor.name.slice(0, 18)}</div>
            `,
            iconSize: [36, 46],
            iconAnchor: [18, 40],
            popupAnchor: [0, -36],
          });

          L.marker([donor.lat, donor.lng], { icon: donorIcon })
            .addTo(mapInstance)
            .bindPopup(`
              <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
                <div style="font-weight: 800; color: #1B4332; margin-bottom: 2px;">🍽️ Donor Kitchen</div>
                <div style="font-weight: 600; color: #1F2937;">${donor.name}</div>
                <div style="color: #6B7280; font-size: 11px; margin-top: 2px;">${donor.address}</div>
                <div style="color: #059669; font-size: 10px; margin-top: 4px;">GPS: ${donor.lat.toFixed(4)}, ${donor.lng.toFixed(4)}</div>
              </div>
            `);

          // 2. Driver Marker (if present)
          if (driver) {
            boundsPoints.push([driver.lat, driver.lng]);

            const driverIcon = L.divIcon({
              className: 'leaflet-bhojan-marker',
              html: `
                <div class="marker-radar-ring"></div>
                <div class="marker-pin driver">
                  <span style="font-size: 13px;">🚚</span>
                </div>
                <div class="marker-label driver"><strong>Rider:</strong> ${driver.name.slice(0, 16)}</div>
              `,
              iconSize: [36, 46],
              iconAnchor: [18, 40],
              popupAnchor: [0, -36],
            });

            L.marker([driver.lat, driver.lng], { icon: driverIcon })
              .addTo(mapInstance)
              .bindPopup(`
                <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
                  <div style="font-weight: 800; color: #E76F51; margin-bottom: 2px;">🚚 Delivery Partner</div>
                  <div style="font-weight: 600; color: #1F2937;">${driver.name}</div>
                  <div style="color: #6B7280; font-size: 11px; margin-top: 2px;">${driver.vehicle}</div>
                  ${driver.phone ? `<div style="margin-top: 4px;"><a href="tel:${driver.phone}" style="color: #2D6A4F; font-weight: 700; text-decoration: underline;">📞 ${driver.phone}</a></div>` : ''}
                  <div style="color: #92400E; font-size: 10px; margin-top: 4px;">Live GPS: ${driver.lat.toFixed(4)}, ${driver.lng.toFixed(4)}</div>
                </div>
              `);

            // Route: Driver -> Donor (Dashed Orange Line)
            L.polyline(
              [
                [driver.lat, driver.lng],
                [donor.lat, donor.lng],
              ],
              {
                color: '#E76F51',
                weight: 4,
                dashArray: '6, 8',
                opacity: 0.9,
              }
            ).addTo(mapInstance);
          }

          // 3. NGO Marker
          const ngoIcon = L.divIcon({
            className: 'leaflet-bhojan-marker',
            html: `
              <div class="marker-pin ngo">
                <span style="font-size: 13px;">🏢</span>
              </div>
              <div class="marker-label ngo"><strong>Dropoff:</strong> ${ngo.name.slice(0, 18)}</div>
            `,
            iconSize: [36, 46],
            iconAnchor: [18, 40],
            popupAnchor: [0, -36],
          });

          L.marker([ngo.lat, ngo.lng], { icon: ngoIcon })
            .addTo(mapInstance)
            .bindPopup(`
              <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
                <div style="font-weight: 800; color: #2563EB; margin-bottom: 2px;">🏢 Partner NGO</div>
                <div style="font-weight: 600; color: #1F2937;">${ngo.name}</div>
                <div style="color: #6B7280; font-size: 11px; margin-top: 2px;">${ngo.address}</div>
                <div style="color: #1E40AF; font-size: 10px; margin-top: 4px;">GPS: ${ngo.lat.toFixed(4)}, ${ngo.lng.toFixed(4)}</div>
              </div>
            `);

          // Route: Donor -> NGO (Solid Emerald Green Line)
          L.polyline(
            [
              [donor.lat, donor.lng],
              [ngo.lat, ngo.lng],
            ],
            {
              color: '#2D6A4F',
              weight: 5,
              opacity: 0.95,
            }
          ).addTo(mapInstance);

          // Fit bounds smoothly with padding
          if (boundsPoints.length > 1) {
            mapInstance.fitBounds(boundsPoints, {
              padding: [45, 45],
              maxZoom: 15,
            });
          }

          leafletMapRef.current = mapInstance;
          setMapEngine('leaflet');
        } catch (err) {
          console.warn('Leaflet initialization notice:', err);
          setMapEngine('vector');
        }
      } else {
        setMapEngine('vector');
      }
    };

    const timer = setTimeout(initMap, 150);

    return () => {
      clearTimeout(timer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [donor.lat, donor.lng, driver?.lat, driver?.lng, ngo.lat, ngo.lng]);

  // Turn-by-turn navigation URL for Google Maps
  const googleMapsUrl = driver
    ? `https://www.google.com/maps/dir/?api=1&origin=${driver.lat},${driver.lng}&destination=${ngo.lat},${ngo.lng}&waypoints=${donor.lat},${donor.lng}`
    : `https://www.google.com/maps/dir/?api=1&origin=${donor.lat},${donor.lng}&destination=${ngo.lat},${ngo.lng}`;

  return (
    <div className="rescue-map-container" style={{ position: 'relative', width: '100%' }}>
      {/* Map Control Header */}
      <div className="map-overlay-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="map-badge-live">
            <span className="live-dot-pulse"></span>
            <span>LIVE GPS RADAR</span>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-deep)' }}>
            {title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Snap Near Kitchen Fast Action */}
          {onSnapNearKitchen && isInterCityDistance && (
            <button
              type="button"
              onClick={onSnapNearKitchen}
              className="map-control-btn"
              style={{
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                borderColor: '#FDE68A',
                fontWeight: 700,
              }}
              title="Snap driver location near donor kitchen to simulate local 2 km route"
            >
              <Zap size={14} />
              <span>Snap Local (2.2 km)</span>
            </button>
          )}

          {/* Location Picker / Google Map Trigger Button */}
          {onOpenLocationPicker && (
            <button
              type="button"
              onClick={onOpenLocationPicker}
              className="map-control-btn"
              title="Set or adjust location manually or using Google Map"
            >
              <Edit3 size={14} />
              <span>Set Location / Google Map</span>
            </button>
          )}

          {onRefreshLocation && (
            <button
              type="button"
              onClick={onRefreshLocation}
              className="map-control-btn"
              title="Sync GPS coordinates"
            >
              <LocateFixed size={14} />
              <span>Sync GPS</span>
            </button>
          )}

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="map-control-btn primary"
            title="Open in Google Maps Directions"
          >
            <Navigation size={15} />
            <span>Google Maps</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Inter-City Distance Banner Alert inside map if > 50 km */}
      {isInterCityDistance && (
        <div
          style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderBottom: 'none',
            padding: '0.5rem 1rem',
            fontSize: '0.8rem',
            color: '#92400E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertTriangle size={15} style={{ color: '#D97706' }} />
            <span>
              Driver GPS is <strong>{driverToDonorDist.toLocaleString()} km</strong> away (laptop in a different city).
            </span>
          </div>
          {onSnapNearKitchen && (
            <button
              type="button"
              onClick={onSnapNearKitchen}
              className="btn btn-sm"
              style={{
                padding: '0.2rem 0.6rem',
                fontSize: '0.75rem',
                backgroundColor: '#D97706',
                color: '#FFFFFF',
                border: 'none',
              }}
            >
              ⚡ Snap Near Kitchen (2.2 km)
            </button>
          )}
        </div>
      )}

      {/* Main Map Canvas: Leaflet OpenStreetMap Container */}
      <div
        style={{
          position: 'relative',
          borderRadius: isInterCityDistance ? '0 0 var(--radius-lg) var(--radius-lg)' : 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          ref={mapContainerRef}
          style={{
            height,
            width: '100%',
            backgroundColor: '#F3F4F6',
            zIndex: 1,
          }}
        />

        {/* Map Legend & Metrics Strip */}
        <div className="map-metrics-pill">
          <div className="metric-chip">
            <Route size={14} style={{ color: 'var(--accent)' }} />
            <span>
              Total Distance: <strong>{totalMissionKm.toLocaleString()} km</strong>
            </span>
          </div>

          <div className="metric-chip">
            <Clock size={14} style={{ color: 'var(--primary)' }} />
            <span>
              Est. Transit: <strong>~{estimatedTimeMins.toLocaleString()} mins</strong>
            </span>
          </div>

          {driver && (
            <div className="metric-chip" style={{ color: '#92400E' }}>
              <span>
                Driver to Kitchen: <strong>{driverToDonorDist.toLocaleString()} km</strong>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RescueMap;
