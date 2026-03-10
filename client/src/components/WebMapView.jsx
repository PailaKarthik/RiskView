let MapContainer, TileLayer, Marker, Popup, L;

// Only import Leaflet in browser environment
if (typeof window !== 'undefined') {
  MapContainer = require('react-leaflet').MapContainer;
  TileLayer = require('react-leaflet').TileLayer;
  Marker = require('react-leaflet').Marker;
  Popup = require('react-leaflet').Popup;
  L = require('leaflet');

  // Fix Leaflet icon issue
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });

  // Inject Leaflet CSS dynamically if not already present
  if (!document.querySelector('link[href*="leaflet.css"]')) {
    const leafletLink = document.createElement('link');
    leafletLink.rel = 'stylesheet';
    leafletLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
    document.head.appendChild(leafletLink);
  }
  
  // Add global styles for Leaflet map container
  if (!document.querySelector('style[data-leaflet-web]')) {
    const style = document.createElement('style');
    style.setAttribute('data-leaflet-web', 'true');
    style.textContent = `
      .leaflet-container {
        width: 100% !important;
        height: 100% !important;
      }
      .leaflet-pane,
      .leaflet-tile,
      .leaflet-marker-pane,
      .leaflet-popup-pane {
        z-index: auto;
      }
    `;
    document.head.appendChild(style);
  }
}

// Custom icon colors
const createIcon = (color, icon) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        color: white;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        font-size: 18px;
      ">
        ${icon}
      </div>
    `,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

export default function WebMapView({
  userLocation,
  nearbyReports = [],
  hospitals = [],
  policeStations = [],
  getMarkerColor,
}) {
  if (!userLocation) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📍</div>
          <p style={{ color: '#6b7280', fontWeight: 600 }}>Location unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[userLocation.latitude, userLocation.longitude]}
      zoom={15}
      style={{ width: '100%', height: '100%' }}
    >
      {/* OpenStreetMap Tile Layer */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      {/* User Location Marker */}
      <Marker
        position={[userLocation.latitude, userLocation.longitude]}
        icon={L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          shadowSize: [41, 41],
        })}
      >
        <Popup>Your Location</Popup>
      </Marker>

      {/* Report Markers */}
      {nearbyReports.map((report, index) => {
        const lat = report.latitude || userLocation.latitude + (Math.random() - 0.5) * 0.01;
        const lng = report.longitude || userLocation.longitude + (Math.random() - 0.5) * 0.01;
        const color = getMarkerColor(report.category);

        return (
          <Marker
            key={`report-${index}`}
            position={[lat, lng]}
            icon={createIcon(color, '⚠️')}
          >
            <Popup>
              <div style={{ fontFamily: 'Arial, sans-serif' }}>
                <strong>{report.title}</strong>
                <br />
                <small style={{ color: '#666' }}>{report.category}</small>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Hospital Markers */}
      {hospitals.map((hospital, index) => (
        <Marker
          key={`hospital-${index}`}
          position={[hospital.latitude, hospital.longitude]}
          icon={createIcon('#3B82F6', '🏥')}
        >
          <Popup>
            <div style={{ fontFamily: 'Arial, sans-serif' }}>
              <strong>{hospital.name}</strong>
              <br />
              <small style={{ color: '#666' }}>Hospital</small>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Police Station Markers */}
      {policeStations.map((police, index) => (
        <Marker
          key={`police-${index}`}
          position={[police.latitude, police.longitude]}
          icon={createIcon('#1E3A8A', '🛡️')}
        >
          <Popup>
            <div style={{ fontFamily: 'Arial, sans-serif' }}>
              <strong>{police.name}</strong>
              <br />
              <small style={{ color: '#666' }}>Police Station</small>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
