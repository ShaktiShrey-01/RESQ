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

const sendSystemNotification = (title, body) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
};

export default function LiveTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const chatEndRef = useRef(null);
  const distanceMilestones = useRef([2.0, 1.0, 0.5, 0.1]);
  
  // 🟢 ANTI-DUPLICATE SET (Fixes the double message bug)
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
  const [unreadCount, setUnreadCount] = useState(0);

  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    if (isChatOpen && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    if (isChatOpen) setUnreadCount(0);
  }, [messages, isChatOpen]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }, []);

  useEffect(() => {
    const fetchEmergency = async () => {
      try {
        const response = await api.get(`/emergencies/${id}`);
        setEmergency(response.data.data);
        if (response.data.data.chat) setMessages(response.data.data.chat);
      } catch (error) { console.error("Fetch Error:", error); } 
      finally { setLoading(false); }
    };
    fetchEmergency();

    socketRef.current = io(import.meta.env.VITE_BACKEND_URL, { withCredentials: true });
    const socket = socketRef.current;
    
    if (currentUserId) {
      socket.emit("joinUserRoom", currentUserId);
      socket.emit("joinUserRoom", `user:${currentUserId}`);
    }

    socket.on("HELPER_LOCATION_UPDATED", (data) => {
      if (data.emergencyId === id) setHelperCoords({ lat: data.lat, lng: data.lng });
    });

    const handleReceiveMessage = (data) => {
      if (data.emergencyId === id) {
        // 🟢 FIX 1: Silently reject the message if we have already processed this exact timestamp!
        if (processedMessages.current.has(data.message.timestamp)) return;
        processedMessages.current.add(data.message.timestamp);

        setMessages((prev) => [...prev, data.message]);
        
        if (data.message.senderId !== currentUserId) {
          setIsChatOpen((currentOpenState) => {
            if (!currentOpenState) {
              setUnreadCount((prev) => prev + 1);
              toast.success('New Message', { icon: '💬', duration: 2500 });
            }
            return currentOpenState;
          });
        }
      }
    };
    socket.off("RECEIVE_MESSAGE").on("RECEIVE_MESSAGE", handleReceiveMessage);

    socket.on("EMERGENCY_STATUS_UPDATED", (data) => {
      if (data.emergencyId === id) {
        if (data.status === 'SEARCHING') {
          if (data.message) { toast.error(data.message, { duration: 5000, icon: '⚠️' }); sendSystemNotification("Responder Cancelled", data.message); }
          navigate('/'); return;
        }
        if (data.status === 'CANCELED') { toast.error("This emergency has been cancelled."); navigate('/'); return; }
        
        setEmergency((prev) => ({ ...prev, status: data.status }));
        if (data.status === 'ARRIVED') sendSystemNotification("📍 Responder Arrived!", "The helper has reached the destination.");
        if (data.status === 'RESOLVED') { toast.success("Emergency Resolved!"); navigate('/'); }
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
            setRouteLine(data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]));
            setLiveDistance(data.routes[0].distance); 
          }
        }).catch(err => console.error("Route fetch failed", err));
    }
  }, [helperCoords, emergency?.status]);

  const emergencyLat = emergency?.location?.coordinates?.[1];
  const emergencyLng = emergency?.location?.coordinates?.[0];
  const isRequester = emergency?.createdBy?._id === currentUserId;

  useEffect(() => {
    if (helperCoords && emergencyLat && isRequester && emergency.status === 'ON_THE_WAY') {
      const currentDistanceKm = calculateDistanceKm(helperCoords.lat, helperCoords.lng, emergencyLat, emergencyLng);
      const nextMilestone = distanceMilestones.current[0];
      if (nextMilestone && currentDistanceKm <= nextMilestone) {
        let message = `Responder is less than ${nextMilestone} km away.`;
        if (nextMilestone === 0.1) message = "Responder is arriving right now!";
        sendSystemNotification("📍 Approaching Location", message);
        distanceMilestones.current.shift();
      }
    }
  }, [helperCoords, emergencyLat, emergencyLng, isRequester, emergency?.status]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    socketRef.current.emit("SEND_MESSAGE", { emergencyId: emergency._id, senderId: currentUserId, text: newMessage.trim() });
    setNewMessage(""); 
  };

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

  const estimatedMins = liveDistance ? Math.ceil(liveDistance / 333) : 0;
  const formattedDistance = liveDistance ? (liveDistance < 1000 ? `${Math.round(liveDistance)} m` : `${(liveDistance/1000).toFixed(1)} km`) : 'Calculating...';
  const directDistanceKm = helperCoords && emergencyLat ? calculateDistanceKm(helperCoords.lat, helperCoords.lng, emergencyLat, emergencyLng) : null;
  const isWithin100m = directDistanceKm !== null && directDistanceKm <= 0.1;

  let narrativeTitle = ""; let narrativeSub = "";
  if (emergency.status === "SEARCHING") { 
    narrativeTitle = "Searching for Responder"; 
    narrativeSub = "Alerting nearby users..."; 
  } else if (emergency.status === "ON_THE_WAY") { 
    narrativeTitle = isRequester ? "Responder is on the way" : "Head to the location"; 
    narrativeSub = estimatedMins > 0 ? `${estimatedMins} mins • ${formattedDistance}` : formattedDistance; 
  } else if (emergency.status === "ARRIVED") { 
    narrativeTitle = isRequester ? "Responder Arrived" : "Arrived at Destination"; 
    narrativeSub = "Location reached safely."; 
  } else if (emergency.status === "RESOLVED") { 
    narrativeTitle = "Emergency Resolved"; 
    narrativeSub = "This request has been closed."; 
  }
  const displayAddress = emergency.location?.address !== 'GPS Location Acquired' ? emergency.location?.address : null;

  return (
    <div className="w-full h-[100dvh] bg-slate-100 dark:bg-slate-950 flex flex-col relative overflow-hidden">
      
      <ChatModal 
        isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} messages={messages} 
        currentUserId={currentUserId} otherPerson={otherPerson} newMessage={newMessage} 
        setNewMessage={setNewMessage} onSendMessage={handleSendMessage} chatEndRef={chatEndRef}
      />

      <TrackingTopPanel 
        narrativeTitle={narrativeTitle} narrativeSub={narrativeSub} 
        unreadCount={unreadCount} isChatOpen={isChatOpen} 
        onOpenChat={() => setIsChatOpen(true)} onBack={() => navigate('/')} 
        otherPerson={otherPerson}
      />

      <TrackingMap 
        emergencyLat={emergencyLat} emergencyLng={emergencyLng} 
        helperCoords={helperCoords} routeLine={routeLine} status={emergency.status} 
      />

      <TrackingBottomPanel 
        isRequester={isRequester} isHelper={isHelper} otherPerson={otherPerson} 
        emergency={emergency} isWithin100m={isWithin100m} isResolving={isResolving} 
        isDropping={isDropping} isCanceling={isCanceling} displayAddress={displayAddress} 
        onResolve={handleResolveEmergency} onDrop={handleDropMission} 
        onCancel={handleCancelEmergency} onOpenChat={() => setIsChatOpen(true)} 
      />
    </div>
  );
}