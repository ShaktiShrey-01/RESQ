import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

const redEmergencyIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const blueHelperIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });

function MapUpdater({ emergencyCoords, helperCoords }) {
  const map = useMap();
  useEffect(() => {
    if (helperCoords && emergencyCoords && helperCoords.lat && emergencyCoords.lat) {
      const bounds = L.latLngBounds([ [emergencyCoords.lat, emergencyCoords.lng], [helperCoords.lat, helperCoords.lng] ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (emergencyCoords && emergencyCoords.lat) {
      map.setView([emergencyCoords.lat, emergencyCoords.lng], 15);
    }
  }, [helperCoords, emergencyCoords, map]);
  return null;
}

export default function TrackingMap({ emergencyLat, emergencyLng, helperCoords, routeLine, status }) {
  if (!emergencyLat || !emergencyLng) return null;
  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={[emergencyLat, emergencyLng]} zoom={15} className="w-full h-full" zoomControl={false}>
        <TileLayer attribution='&copy; CartoDB' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <MapUpdater emergencyCoords={{ lat: emergencyLat, lng: emergencyLng }} helperCoords={helperCoords} />
        {routeLine.length > 0 && ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED'].includes(status) && (
          <Polyline positions={routeLine} color="#3b82f6" weight={5} opacity={0.8} />
        )}
        <Marker position={[emergencyLat, emergencyLng]} icon={redEmergencyIcon} />
        {helperCoords && status !== 'RESOLVED' && (
          <Marker position={[helperCoords.lat, helperCoords.lng]} icon={blueHelperIcon} />
        )}
      </MapContainer>
    </div>
  );
}