import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../services/api';
import Loader from '../components/ui/Loader';

// Components
import TrackingTopPanel from '../components/tracking/TrackingTopPanel';
import TrackingBottomPanel from '../components/tracking/TrackingBottomPanel';
import TrackingMap from '../components/tracking/TrackingMap';
import ChatModal from '../components/tracking/ChatModal';

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export default function LiveTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const chatEndRef = useRef(null);
  const processedMessages = useRef(new Set()); 

  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [helperCoords, setHelperCoords] = useState(null);
  const [routeLine, setRouteLine] = useState([]);
  const [liveDistance, setLiveDistance] = useState(null);
  
  const [isResolving, setIsResolving] = useState(false); 
  const [isDropping, setIsDropping] = useState(false); 
  const [isCanceling, setIsCanceling] = useState(false); 
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // 🟢 CRITICAL FIX: Force the ID to be a String instantly so all comparisons work
  const currentUserId = String(user?.id || user?._id);

  useEffect(() => {
    if (isChatOpen && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  // Fetch initial emergency details
  useEffect(() => {
    let isMounted = true;
    const fetchEmergency = async () => {
      try {
        const response = await api.get(`/emergencies/${id}`);
        const data = response.data.data;
        if (!isMounted) return;

        setEmergency(data);
        if (data.chat) setMessages(data.chat);

        if (data.helperLocation?.coordinates) {
          setHelperCoords({
            lat: data.helperLocation.coordinates[1],
            lng: data.helperLocation.coordinates[0]
          });
        }
      } catch (error) {
        toast.error("Unable to load emergency details.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEmergency();

    socketRef.current = io(import.meta.env.VITE_BACKEND_URL, { withCredentials: true });
    const socket = socketRef.current;
    
    // 🟢 CRITICAL FIX: Remove 'user:' so it matches the room joined in Home.jsx exactly
    if (currentUserId) socket.emit("joinUserRoom", currentUserId);
    socket.emit("joinEmergencyRoom", id);

    socket.on("HELPER_LOCATION_UPDATED", (data) => {
      if (String(data.emergencyId) === String(id)) {
        setHelperCoords({ lat: Number(data.lat), lng: Number(data.lng) });
      }
    });

    socket.on("RECEIVE_MESSAGE", (data) => {
      if (String(data.emergencyId) === String(id)) {
        if (processedMessages.current.has(data.message.timestamp)) return;
        processedMessages.current.add(data.message.timestamp);
        setMessages((prev) => [...prev, data.message]);
        if (String(data.message.senderId) !== currentUserId && !isChatOpen) {
          toast.success('New Message', { icon: '💬', duration: 2500 });
        }
      }
    });

    // 🟢 CRITICAL FIX: Global listener to force redirect when dropped/cancelled by anyone
    socket.on("EMERGENCY_CANCELLED", (data) => {
      if (String(data.emergencyId) === String(id)) {
        toast.error("This emergency has been closed.");
        navigate('/');
      }
    });

    socket.on("EMERGENCY_STATUS_UPDATED", (data) => {
      if (String(data.emergencyId) === String(id)) {
        if (data.status === 'SEARCHING' || data.status === 'CANCELED' || data.status === 'RESOLVED') {
          navigate('/'); return;
        }
        setEmergency((prev) => ({ ...prev, status: data.status }));
      }
    });

    return () => {
      isMounted = false;
      if (socket) socket.disconnect();
    };
  }, [id, currentUserId, navigate, isChatOpen]);

  // GPS tracking for helper
  useEffect(() => {
    if (!emergency || !currentUserId) return;
    
    // 🟢 CRITICAL FIX: Force string conversion to ensure PC knows it is the helper
    const isHelper = Boolean(emergency.helper && (String(emergency.helper._id) === currentUserId || String(emergency.helper) === currentUserId));
    
    if (isHelper && ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED'].includes(emergency.status)) {
      
      const broadcastLocation = (lat, lng) => {
        setHelperCoords({ lat, lng }); 
        if (socketRef.current) {
          socketRef.current.emit("LOCATION_UPDATE", { userId: currentUserId, emergencyId: id, lat, lng });
        }
      };

      // 🟢 CRITICAL FIX: PC Geolocation Fallback
      // PC's fail high-accuracy checks. We set enableHighAccuracy to FALSE for the initial blast to guarantee a pin drop.
      navigator.geolocation.getCurrentPosition(
        (pos) => broadcastLocation(pos.coords.latitude, pos.coords.longitude),
        (err) => console.log("Initial quick-fetch failed, waiting for watcher..."),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: Infinity }
      );

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => broadcastLocation(position.coords.latitude, position.coords.longitude),
        (error) => console.error("Tracking error:", error),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    }
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [emergency?.status, emergency?.helper, currentUserId, id]);

  // Route calculation
  useEffect(() => {
    if (helperCoords && emergency) {
      const emLng = emergency.location?.coordinates?.[0];
      const emLat = emergency.location?.coordinates?.[1];
      if (!emLng || !emLat) return;
      const directKm = calculateDistanceKm(helperCoords.lat, helperCoords.lng, emLat, emLng);

      fetch(`https://router.project-osrm.org/route/v1/driving/${helperCoords.lng},${helperCoords.lat};${emLng},${emLat}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes[0]) {
            setRouteLine(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
            setLiveDistance(data.routes[0].distance); 
          } else {
            setLiveDistance(directKm * 1000);
          }
        }).catch(() => setLiveDistance(directKm * 1000));
    }
  }, [helperCoords, emergency?.status, emergency?.location]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    socketRef.current.emit("SEND_MESSAGE", { emergencyId: id, senderId: currentUserId, text: newMessage.trim() });
    setNewMessage(""); 
  };

  const handleResolveEmergency = async () => {
    setIsResolving(true);
    try { await api.patch(`/emergencies/${id}/status`, { status: 'RESOLVED' }); navigate('/'); } 
    catch (error) { toast.error("Failed to resolve."); setIsResolving(false); }
  };

  const handleDropMission = async () => {
    if (!window.confirm("Cancel response?")) return;
    setIsDropping(true);
    try { await api.post(`/emergencies/${id}/drop`); navigate('/'); } 
    catch (error) { toast.error("Failed to cancel."); setIsDropping(false); }
  };

  const handleCancelEmergency = async () => {
    if (!window.confirm("Cancel emergency?")) return;
    setIsCanceling(true);
    try { await api.patch(`/emergencies/${id}/cancel`); navigate('/'); } 
    catch (error) { toast.error("Failed to cancel."); setIsCanceling(false); }
  };

  if (loading || !emergency) return <div className="min-h-screen flex items-center justify-center"><Loader fullScreen /></div>;

  const emergencyLat = emergency.location?.coordinates?.[1];
  const emergencyLng = emergency.location?.coordinates?.[0];
  
  // 🟢 CRITICAL FIX: Safe string comparison for UI Roles
  const isRequester = Boolean(emergency.createdBy && (String(emergency.createdBy._id) === currentUserId || String(emergency.createdBy) === currentUserId));
  const isHelper = Boolean(emergency.helper && (String(emergency.helper._id) === currentUserId || String(emergency.helper) === currentUserId));
  
  let otherPerson = isRequester ? emergency.helper : emergency.createdBy;
  if (typeof otherPerson === 'string') otherPerson = { _id: otherPerson };

  const estimatedMins = liveDistance ? Math.ceil(liveDistance / 333) : 0;
  
  let formattedDistance = "Awaiting Location...";
  if (liveDistance) {
    formattedDistance = liveDistance < 1000 ? `${Math.round(liveDistance)} m` : `${(liveDistance / 1000).toFixed(1)} km`;
  }
  
  const directDistanceKm = helperCoords && emergencyLat ? calculateDistanceKm(helperCoords.lat, helperCoords.lng, emergencyLat, emergencyLng) : null;
  const isWithin100m = directDistanceKm !== null && directDistanceKm <= 0.1;

  let narrativeTitle = ""; let narrativeSub = "";
  if (emergency.status === "SEARCHING") { narrativeTitle = "Searching..."; narrativeSub = "Alerting users"; } 
  else if (emergency.status === "ON_THE_WAY") { 
    narrativeTitle = isRequester ? "Responder En Route" : "Head to Location"; 
    narrativeSub = estimatedMins > 0 ? `${estimatedMins} mins • ${formattedDistance}` : formattedDistance; 
  }

  return (
    <div className="w-full h-[100dvh] bg-white dark:bg-black grid grid-cols-1 grid-rows-[auto_1fr_auto] md:grid-cols-[400px_1fr] md:grid-rows-[auto_1fr] relative overflow-hidden scroll-smooth">
      
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} messages={messages} currentUserId={currentUserId} otherPerson={otherPerson} newMessage={newMessage} setNewMessage={setNewMessage} onSendMessage={handleSendMessage} chatEndRef={chatEndRef} />

      <div className="hidden md:block col-start-1 row-start-1 row-span-2 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 z-10 shadow-xl"></div>

      <div className="col-start-1 row-start-1 z-20">
        <TrackingTopPanel narrativeTitle={narrativeTitle} narrativeSub={narrativeSub} onBack={() => navigate('/')} />
      </div>

      <div className="col-start-1 row-start-2 md:col-start-2 md:row-start-1 md:row-span-2 relative z-0 w-full h-full bg-neutral-100 dark:bg-neutral-900">
        <TrackingMap emergencyLat={emergencyLat} emergencyLng={emergencyLng} helperCoords={helperCoords} routeLine={routeLine} status={emergency.status} />
      </div>

      <div className="col-start-1 row-start-3 md:col-start-1 md:row-start-2 md:self-end z-20 w-full">
        <TrackingBottomPanel isRequester={isRequester} isHelper={isHelper} otherPerson={otherPerson} emergency={emergency} isWithin100m={isWithin100m} isResolving={isResolving} isDropping={isDropping} isCanceling={isCanceling} displayAddress={emergency.location?.address} onResolve={handleResolveEmergency} onDrop={handleDropMission} onCancel={handleCancelEmergency} onOpenChat={() => setIsChatOpen(true)} />
      </div>
    </div>
  );
}