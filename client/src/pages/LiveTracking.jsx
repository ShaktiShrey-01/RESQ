import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../services/api';
import Loader from '../components/ui/Loader';
import { 
  MapPin, Navigation, User, ArrowLeft, CheckCircle 
} from 'lucide-react';

// --- LEAFLET MAP IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// ==========================================
// CUSTOM MAP ICONS
// ==========================================
const redEmergencyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const blueHelperIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// ==========================================
// MAP AUTO-FIT COMPONENT
// ==========================================
function MapUpdater({ emergencyCoords, helperCoords }) {
  const map = useMap();
  useEffect(() => {
    if (helperCoords && emergencyCoords) {
      const bounds = L.latLngBounds([
        [emergencyCoords.lat, emergencyCoords.lng],
        [helperCoords.lat, helperCoords.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (emergencyCoords) {
      map.setView([emergencyCoords.lat, emergencyCoords.lng], 15);
    }
  }, [helperCoords, emergencyCoords, map]);
  return null;
}

export default function LiveTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [helperCoords, setHelperCoords] = useState(null);
  const [routeLine, setRouteLine] = useState([]);
  const [liveDistance, setLiveDistance] = useState(null);
  
  const currentUserId = user?.id || user?._id;

  // ==========================================
  // 1. FETCH INITIAL DATA & CONNECT SOCKET
  // ==========================================
  useEffect(() => {
    const fetchEmergency = async () => {
      try {
        const response = await api.get(`/emergencies/${id}`);
        setEmergency(response.data.data);
      } catch (error) {
        toast.error("Emergency not found");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchEmergency();

    socketRef.current = io("http://localhost:8000", { withCredentials: true });
    const socket = socketRef.current;
    
    if (currentUserId) {
      socket.emit("joinUserRoom", currentUserId);
    }

    socket.on("HELPER_LOCATION_UPDATED", (data) => {
      if (data.emergencyId === id) {
        setHelperCoords({ lat: data.lat, lng: data.lng });
      }
    });

    socket.on("EMERGENCY_STATUS_UPDATED", (data) => {
      if (data.emergencyId === id) {
        setEmergency((prev) => ({ ...prev, status: data.status }));
        if (data.message) toast.success(data.message, { duration: 4000 });
      }
    });

    return () => {
      if (socket) socket.disconnect();
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [id, currentUserId, navigate]);

  // ==========================================
  // 2. AUTOMATED HELPER GPS TRACKER (No Buttons!)
  // ==========================================
  useEffect(() => {
    if (!emergency || !currentUserId) return;

    const isHelper = emergency.helper && (emergency.helper._id === currentUserId);
    const isActive = ['ASSIGNED', 'ON_THE_WAY'].includes(emergency.status);
    
    if (isHelper && isActive) {
      // Auto-update status to ON_THE_WAY if it's currently ASSIGNED
      if (emergency.status === 'ASSIGNED') {
        api.patch(`/emergencies/${id}/status`, { status: 'ON_THE_WAY' }).catch(console.error);
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setHelperCoords({ lat: latitude, lng: longitude }); 

          socketRef.current.emit("LOCATION_UPDATE", {
            userId: currentUserId,
            emergencyId: emergency._id,
            lat: latitude,
            lng: longitude
          });
        },
        (error) => console.error("Tracking error", error),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
      );
    }
  }, [emergency?.status, currentUserId, id]);

  // ==========================================
  // 3. FETCH OSRM ROUTE ROAD PATH
  // ==========================================
  useEffect(() => {
    if (helperCoords && emergency) {
      const emLng = emergency.location.coordinates[0];
      const emLat = emergency.location.coordinates[1];
      const hlLng = helperCoords.lng;
      const hlLat = helperCoords.lat;

      fetch(`https://router.project-osrm.org/route/v1/driving/${hlLng},${hlLat};${emLng},${emLat}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes[0]) {
            const routeCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            setRouteLine(routeCoords);
            setLiveDistance(data.routes[0].distance); 
          }
        })
        .catch(err => console.error("Route fetch failed", err));
    }
  }, [helperCoords, emergency]);


  // ==========================================
  // RENDER LOGIC
  // ==========================================
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader fullScreen /></div>;
  if (!emergency) return null;

  const isRequester = emergency.createdBy._id === currentUserId;
  const isHelper = emergency.helper?._id === currentUserId;
  const otherPerson = isRequester ? emergency.helper : emergency.createdBy;

  const emergencyLat = emergency.location.coordinates[1];
  const emergencyLng = emergency.location.coordinates[0];
  const formattedDistance = liveDistance ? (liveDistance < 1000 ? `${Math.round(liveDistance)} m` : `${(liveDistance/1000).toFixed(1)} km`) : 'Calculating...';

  // Format the natural text based on who is looking at the screen
  let narrativeTitle = "";
  let narrativeSub = "";

  if (emergency.status === "SEARCHING") {
    narrativeTitle = "Finding a Responder";
    narrativeSub = "Broadcasting your emergency to nearby heroes...";
  } else if (emergency.status === "ARRIVED") {
    narrativeTitle = isHelper ? "You have arrived." : `${otherPerson?.name} is here.`;
    narrativeSub = isHelper ? "Please assist the requester immediately." : "Look for your responder nearby.";
  } else if (emergency.status === "RESOLVED") {
    narrativeTitle = "Emergency Resolved";
    narrativeSub = "This mission is complete. Stay safe.";
  } else {
    // ON_THE_WAY
    narrativeTitle = isRequester ? `Hold tight, ${otherPerson?.name} is on the way.` : `Head to ${otherPerson?.name}'s location.`;
    narrativeSub = isRequester ? `They are currently ${formattedDistance} away from you.` : `They are ${formattedDistance} away from your current location.`;
  }

  // Hide the default text if it's "GPS Location Acquired"
  const displayAddress = emergency.location.address !== 'GPS Location Acquired' ? emergency.location.address : null;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950">
      
      {/* HEADER BAR */}
      <div className="absolute top-4 left-4 z-10">
        <button onClick={() => navigate('/')} className="flex items-center justify-center h-12 w-12 rounded-full bg-white dark:bg-black shadow-lg text-slate-700 dark:text-slate-300 hover:scale-105 transition-transform">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      {/* ========================================== */}
      {/* 🗺️ HUGE UBER-STYLE MAP AREA               */}
      {/* ========================================== */}
      <div className="w-full flex-1 relative z-0">
        <MapContainer 
          center={[emergencyLat, emergencyLng]} 
          zoom={15} 
          className="w-full h-full"
          zoomControl={false} 
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          <MapUpdater 
            emergencyCoords={{ lat: emergencyLat, lng: emergencyLng }} 
            helperCoords={helperCoords} 
          />
          
          {/* OSRM Route Line */}
          {routeLine.length > 0 && (
            <Polyline positions={routeLine} color="#3b82f6" weight={5} opacity={0.7} dashArray="10, 10" />
          )}

          <Marker position={[emergencyLat, emergencyLng]} icon={redEmergencyIcon}>
            <Popup className="font-bold">Emergency Location</Popup>
          </Marker>

          {helperCoords && (
            <Marker position={[helperCoords.lat, helperCoords.lng]} icon={blueHelperIcon}>
              <Popup className="font-bold">Responder</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Live Distance Floating Badge */}
        {helperCoords && emergency.status === 'ON_THE_WAY' && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-black/80 backdrop-blur-md text-white px-6 py-2.5 rounded-full font-black text-lg shadow-xl flex items-center gap-2 border border-white/10">
            <Navigation className="h-5 w-5 text-blue-400" />
            {formattedDistance}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 📝 UNIFIED BOTTOM SHEET INFO CARD         */}
      {/* ========================================== */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 sm:p-8 z-10 relative mt-[-20px] pb-10">
        
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>

        <h2 className="text-2xl font-black text-black dark:text-white mb-1 leading-tight">
          {narrativeTitle}
        </h2>
        <p className="text-slate-500 font-medium mb-6">
          {narrativeSub}
        </p>

        {/* Contact Row (Call Button Removed) */}
        {otherPerson && (
          <div className="flex items-center justify-start bg-slate-50 dark:bg-black/30 p-4 rounded-2xl border border-slate-100 dark:border-white/5 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-black dark:text-white capitalize">{otherPerson.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isRequester ? "Responder" : "Requester"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Details Segment */}
        <div className="flex flex-col gap-5">
          {displayAddress && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{displayAddress}</p>
            </div>
          )}
          
          {emergency.description && (
            <div className="pl-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 italic border-l-2 border-slate-200 dark:border-slate-700 pl-4 py-1">
                "{emergency.description}"
              </p>
            </div>
          )}
        </div>

        {/* End Mission Button (Only for Helper when ARRIVED) */}
        {isHelper && emergency.status === 'ARRIVED' && (
          <button 
            onClick={() => api.patch(`/emergencies/${id}/status`, { status: 'RESOLVED' }).then(() => navigate('/'))}
            className="w-full mt-8 h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-lg"
          >
            <CheckCircle className="h-5 w-5" /> COMPLETE MISSION
          </button>
        )}

      </div>
    </div>
  );
}