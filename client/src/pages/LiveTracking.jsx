import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../services/api';
import Loader from '../components/ui/Loader';
import { MapPin, Navigation, User, ArrowLeft, Phone, XCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// 🟢 NOTIFICATION HELPER
const sendSystemNotification = (title, body) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
};

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

export default function LiveTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  // 🟢 ANTI-SPAM MILESTONES: Alerts trigger at 2km, 1km, 500m, and 100m.
  const distanceMilestones = useRef([2.0, 1.0, 0.5, 0.1]);

  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [helperCoords, setHelperCoords] = useState(null);
  
  const [routeLine, setRouteLine] = useState([]);
  const [liveDistance, setLiveDistance] = useState(null);
  
  const [isResolving, setIsResolving] = useState(false); 
  const [isDropping, setIsDropping] = useState(false); 
  const [isCanceling, setIsCanceling] = useState(false); 
  
  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const fetchEmergency = async () => {
      try {
        const response = await api.get(`/emergencies/${id}`);
        setEmergency(response.data.data);
      } catch (error) {
        console.error("Fetch Emergency Error:", error);
      } finally { setLoading(false); }
    };
    fetchEmergency();

    socketRef.current = io("http://localhost:8000", { withCredentials: true });
    const socket = socketRef.current;
    
    if (currentUserId) {
      socket.emit("joinUserRoom", currentUserId);
      socket.emit("joinUserRoom", `user:${currentUserId}`);
    }

    socket.on("HELPER_LOCATION_UPDATED", (data) => {
      if (data.emergencyId === id) setHelperCoords({ lat: data.lat, lng: data.lng });
    });

    socket.on("EMERGENCY_STATUS_UPDATED", (data) => {
      if (data.emergencyId === id) {
        if (data.status === 'SEARCHING') {
          setHelperCoords(null); setRouteLine([]); setLiveDistance(null);
          setEmergency((prev) => ({ ...prev, status: 'SEARCHING', helper: null }));
          if (data.message) {
            toast.error(data.message, { duration: 5000, icon: '⚠️' });
            sendSystemNotification("Responder Cancelled", data.message);
          }
          return;
        }
        if (data.status === 'CANCELED') {
          toast.error("This emergency has been cancelled."); navigate('/'); return;
        }
        
        setEmergency((prev) => ({ ...prev, status: data.status }));

        // 🟢 NOTIFICATION: Send an OS alert when they arrive!
        if (data.status === 'ARRIVED') {
          sendSystemNotification("📍 Responder Arrived!", "The helper has reached the destination.");
        }

        if (data.status === 'RESOLVED') {
          toast.success("Emergency Resolved!"); navigate('/'); 
        }
      }
    });

    return () => { if (socket) socket.disconnect(); };
  }, [id, currentUserId, navigate]);

  useEffect(() => {
    if (!emergency || !currentUserId) return;
    const isHelper = emergency.helper && (emergency.helper._id === currentUserId);
    const isActive = ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED'].includes(emergency.status);
    
    if (isHelper && isActive) {
      if (emergency.status === 'ASSIGNED') api.patch(`/emergencies/${id}/status`, { status: 'ON_THE_WAY' }).catch(console.error);
      
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setHelperCoords({ lat: latitude, lng: longitude }); 
          socketRef.current.emit("LOCATION_UPDATE", { userId: currentUserId, emergencyId: emergency._id, lat: latitude, lng: longitude });
        },
        (error) => console.error("Tracking error", error),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    }
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [emergency?.status, currentUserId, id]);

  useEffect(() => {
    if (helperCoords && emergency && ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED'].includes(emergency.status)) {
      const emLng = emergency.location?.coordinates?.[0];
      const emLat = emergency.location?.coordinates?.[1];
      if (!emLng || !emLat) return;

      fetch(`https://router.project-osrm.org/route/v1/driving/${helperCoords.lng},${helperCoords.lat};${emLng},${emLat}?overview=full&geometries=geojson`)
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
  }, [helperCoords, emergency?.status]);

  const emergencyLat = emergency?.location?.coordinates?.[1];
  const emergencyLng = emergency?.location?.coordinates?.[0];
  const isRequester = emergency?.createdBy?._id === currentUserId;

  // 🟢 NOTIFICATION LOGIC: The Milestone Tracker
  useEffect(() => {
    if (helperCoords && emergencyLat && isRequester && emergency.status === 'ON_THE_WAY') {
      const currentDistanceKm = calculateDistanceKm(helperCoords.lat, helperCoords.lng, emergencyLat, emergencyLng);
      
      // Look at the NEXT upcoming milestone in our array
      const nextMilestone = distanceMilestones.current[0];
      
      // If our actual distance is LESS than the milestone (e.g., we dropped below 2.0km)
      if (nextMilestone && currentDistanceKm <= nextMilestone) {
        
        let message = `Responder is less than ${nextMilestone} km away.`;
        if (nextMilestone === 0.1) message = "Responder is arriving right now!";
        
        // 1. Send the OS Push Notification
        sendSystemNotification("📍 Approaching Location", message);
        
        // 2. Remove that milestone from the array so it doesn't trigger again!
        distanceMilestones.current.shift();
      }
    }
  }, [helperCoords, emergencyLat, emergencyLng, isRequester, emergency?.status]);

  const handleResolveEmergency = async () => {
    setIsResolving(true);
    try {
      await api.patch(`/emergencies/${id}/status`, { status: 'RESOLVED' });
      toast.success("Mission accomplished!"); navigate('/');
    } catch (error) { toast.error("Failed to resolve."); setIsResolving(false); }
  };

  const handleDropMission = async () => {
    if (!window.confirm("Are you sure you want to cancel your response?")) return;
    setIsDropping(true);
    try {
      await api.post(`/emergencies/${id}/drop`);
      toast.success("Response cancelled."); navigate('/'); 
    } catch (error) { toast.error("Failed to cancel."); setIsDropping(false); }
  };

  const handleCancelEmergency = async () => {
    if (!window.confirm("Are you sure you want to completely cancel this emergency request?")) return;
    setIsCanceling(true);
    try {
      await api.patch(`/emergencies/${id}/cancel`);
      toast.success("Emergency cancelled."); navigate('/');
    } catch (error) { toast.error("Failed to cancel."); setIsCanceling(false); }
  };

  if (loading && !emergency) return <div className="min-h-screen flex items-center justify-center"><Loader fullScreen /></div>;
  if (!emergency) return null;

  const isHelper = emergency.helper?._id === currentUserId;
  const otherPerson = isRequester ? emergency.helper : emergency.createdBy;

  const formattedDistance = liveDistance ? (liveDistance < 1000 ? `${Math.round(liveDistance)} m` : `${(liveDistance/1000).toFixed(1)} km`) : 'Calculating...';
  
  const directDistanceKm = helperCoords && emergencyLat ? calculateDistanceKm(helperCoords.lat, helperCoords.lng, emergencyLat, emergencyLng) : null;
  const isWithin100m = directDistanceKm !== null && directDistanceKm <= 0.1;

  let narrativeTitle = ""; let narrativeSub = "";
  if (emergency.status === "SEARCHING") { narrativeTitle = "Searching for Responder"; narrativeSub = "Alerting nearby users of your location..."; } 
  else if (emergency.status === "ON_THE_WAY") { narrativeTitle = "Responder En Route"; narrativeSub = `Estimated distance: ${formattedDistance}`; } 
  else if (emergency.status === "ARRIVED") { narrativeTitle = isRequester ? "Responder Arrived" : "Arrived at Destination"; narrativeSub = isRequester ? "Your responder has reached your location." : "You have reached the emergency location."; } 
  else if (emergency.status === "RESOLVED") { narrativeTitle = "Emergency Resolved"; narrativeSub = "This request has been closed."; }

  const displayAddress = emergency.location?.address !== 'GPS Location Acquired' ? emergency.location?.address : null;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950">
      
      <div className="absolute top-4 left-4 z-10">
        <button onClick={() => navigate('/')} className="flex items-center justify-center h-12 w-12 rounded-full bg-white dark:bg-black shadow-md text-slate-700 dark:text-slate-300 hover:scale-105 transition-transform">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="w-full flex-1 relative z-0">
        {emergencyLat && emergencyLng && (
          <MapContainer center={[emergencyLat, emergencyLng]} zoom={15} className="w-full h-full" zoomControl={false}>
            <TileLayer attribution='&copy; <a href="https://carto.com/">CartoDB</a>' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <MapUpdater emergencyCoords={{ lat: emergencyLat, lng: emergencyLng }} helperCoords={helperCoords} />
            
            {routeLine.length > 0 && ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED'].includes(emergency.status) && (
              <Polyline positions={routeLine} color="#3b82f6" weight={5} opacity={0.7} dashArray="10, 10" />
            )}

            <Marker position={[emergencyLat, emergencyLng]} icon={redEmergencyIcon}>
              <Popup className="font-bold">Emergency Location</Popup>
            </Marker>

            {helperCoords && emergency.status !== 'RESOLVED' && (
              <Marker position={[helperCoords.lat, helperCoords.lng]} icon={blueHelperIcon}>
                <Popup className="font-bold">Responder</Popup>
              </Marker>
            )}
          </MapContainer>
        )}

        {helperCoords && ['ASSIGNED', 'ON_THE_WAY'].includes(emergency.status) && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-black/80 backdrop-blur-md text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 border border-white/10 animate-in slide-in-from-top-4">
            <Navigation className="h-4 w-4 text-blue-400" />
            {formattedDistance} Away
          </div>
        )}
      </div>

      <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 sm:p-8 z-10 relative mt-[-20px] pb-10">
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>

        <h2 className="text-2xl font-bold text-black dark:text-white mb-1 leading-tight">{narrativeTitle}</h2>
        <p className="text-slate-500 font-medium mb-6 text-sm">{narrativeSub}</p>

        {otherPerson && (
          <div className="flex items-center justify-start bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-100 dark:border-white/5 mb-6">
            <div className="flex items-center gap-4 w-full">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-black dark:text-white capitalize">{otherPerson.name || "Unknown"}</h3>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{isRequester ? "Responder" : "Requester"}</p>
              </div>
              {otherPerson.phone && (
                <a href={`tel:${otherPerson.phone}`} className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 hover:scale-105 transition-transform" title="Call User">
                  <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </a>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 mb-6">
          {displayAddress && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{displayAddress}</p>
            </div>
          )}
          {emergency.description && (
            <div className="pl-7">
              <p className="text-sm text-slate-500 dark:text-slate-400 italic border-l-2 border-slate-200 dark:border-slate-700 pl-3">"{emergency.description}"</p>
            </div>
          )}
        </div>
        
        {isHelper && isWithin100m && ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED'].includes(emergency?.status) ? (
          <button onClick={handleResolveEmergency} disabled={isResolving} className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-70">
            {isResolving ? <Loader small /> : "Reached Location (Resolve)"}
          </button>
        ) : isHelper && !isWithin100m && ['ASSIGNED', 'ON_THE_WAY'].includes(emergency?.status) ? (
          <div className="w-full h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-sm flex items-center justify-center border border-slate-200 dark:border-slate-700">
            Get within 100m to Resolve
          </div>
        ) : null}

        {isHelper && ['ASSIGNED', 'ON_THE_WAY'].includes(emergency?.status) && (
          <button onClick={handleDropMission} disabled={isDropping} className="w-full mt-2 h-10 rounded-xl text-red-600 dark:text-red-400 font-medium text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2">
            {isDropping ? <Loader small /> : <><XCircle className="h-4 w-4" /> Cancel Response</>}
          </button>
        )}

        {isRequester && ['SEARCHING', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED'].includes(emergency?.status) && (
          <button onClick={handleCancelEmergency} disabled={isCanceling} className="w-full mt-2 h-10 rounded-xl text-red-600 dark:text-red-400 font-medium text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2">
            {isCanceling ? <Loader small /> : <><XCircle className="h-4 w-4" /> Cancel Emergency</>}
          </button>
        )}
        
      </div>
    </div>
  );
}