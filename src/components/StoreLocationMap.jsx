// Store Location Map Component - OpenStreetMap Version
// Shows your store location on Contact page (100% FREE - No API Key Required!)
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom animated marker icon
const customIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="
      background-color: #dc2626;
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      animation: bounce 1s infinite;
    ">
      📍 Store Location
    </div>
  `,
  iconSize: [120, 40],
  iconAnchor: [60, 40],
});

const StoreLocationMap = () => {
  const [mounted, setMounted] = useState(false);

  const storeLocation = {
    lat: parseFloat(import.meta.env.VITE_STORE_LATITUDE) || 26.4323,
    lng: parseFloat(import.meta.env.VITE_STORE_LONGITUDE) || 84.4350,
  };
  const storeName = import.meta.env.VITE_STORE_NAME || 'Alok General Store';
  const storeAddress = import.meta.env.VITE_STORE_ADDRESS || 'Main Road, Barauli, Gopalganj, Bihar 841405';

  useEffect(() => {
    setMounted(true);
  }, []);

  const openInGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${storeLocation.lat},${storeLocation.lng}`,
      '_blank'
    );
  };

  if (!mounted) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative z-10">
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .leaflet-container {
          border-radius: 0.5rem;
          z-index: 1;
        }
        .leaflet-pane,
        .leaflet-top,
        .leaflet-bottom {
          z-index: 10;
        }
      `}</style>
      
      <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
        <MapContainer
          center={[storeLocation.lat, storeLocation.lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker 
            position={[storeLocation.lat, storeLocation.lng]}
            icon={customIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-gray-900 mb-1">{storeName}</h3>
                <p className="text-sm text-gray-600 mb-2">{storeAddress}</p>
                <button
                  onClick={openInGoogleMaps}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Get Directions →
                </button>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Get Directions Button */}
      <button
        onClick={openInGoogleMaps}
        className="absolute bottom-4 right-4 bg-white hover:bg-gray-50 text-gray-900 px-4 py-2 rounded-lg shadow-lg font-medium transition-colors flex items-center gap-2 z-20"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 013.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        Get Directions
      </button>
    </div>
  );
};

export default StoreLocationMap;
