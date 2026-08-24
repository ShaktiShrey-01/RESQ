import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../services/api';
import Loader from '../components/ui/Loader';

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
  const lastOsrmFetch = useRef(0); 

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

  const currentUserId = String(user?.id || user?._id);

  useEffect(() => {
    if (isChatOpen && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

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
          setHelperCoords({ lat: data.helperLocation.coordinates[1], lng: data.helperLocation.coordinates[0] });
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
    
    if (currentUserId) socket.emit("joinUserRoom", currentUserId);
    socket.emit("joinEmergencyRoom", id);

    socket.on("HELPER_LOCATION_UPDATED", (data) => {
      if (String(data.emergencyId) === String(id)) setHelperCoords({ lat: Number(data.lat), lng: Number(data.lng) });
    });

    socket.on("RECEIVE_MESSAGE", (data) => {
      if (String(data.emergencyId) === String(id)) {
        if (processedMessages.current.has(data.message.timestamp)) return;
        processedMessages.current.add(data.message.timestamp);
        setMessages((prev) => [...prev, data.message]);
        if (String(data.message.senderId) !== currentUserId && !isChatOpen) toast.success('New Message', { icon: '💬' });
      }
    });

    socket.on("EMERGENCY_CANCELLED", (data) => {
      if (String(data.emergencyId) === String(id)) {
        toast.error("This emergency has been closed."); navigate('/');
      }
    });

    socket.on("EMERGENCY_STATUS_UPDATED", (data) => {
      if (String(data.emergencyId) === String(id)) {
        if (['SEARCHING', 'CANCELED', 'RESOLVED'].includes(data.status)) { navigate('/'); return; }
        setEmergency((prev) => ({ ...prev, status: data.status }));
      }
    });

    return () => { isMounted = false; if (socket) socket.disconnect(); };
  }, [id, currentUserId, navigate, isChatOpen]);

  useEffect(() => {
    if (!emergency || !currentUserId) return;
    const isHelper = Boolean(emergency.helper && (String(emergency.helper._id) === currentUserId || String(emergency.helper) === currentUserId));
    
    if (isHelper && ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED'].includes(emergency.status)) {
      const broadcastLocation = (lat, lng) => {
        setHelperCoords({ lat, lng }); 
        if (socketRef.current) socketRef.current.emit("LOCATION_UPDATE", { userId: currentUserId, emergencyId: id, lat, lng });
      };

      navigator.geolocation.getCurrentPosition(
        (pos) => broadcastLocation(pos.coords.latitude, pos.coords.longitude),
        (err) => console.log("Initial fetch failed"),
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

  useEffect(() => {
    if (helperCoords && emergency) {
      const emLng = emergency.location?.coordinates?.[0];
      const emLat = emergency.location?.coordinates?.[1];
      if (!emLng || !emLat) return;
      const directKm = calculateDistanceKm(helperCoords.lat, helperCoords.lng, emLat, emLng);

      const now = Date.now();
      if (now - lastOsrmFetch.current > 10000) {
        lastOsrmFetch.current = now;
        fetch(`https://router.project-osrm.org/route/v1/driving/${helperCoords.lng},${helperCoords.lat};${emLng},${emLat}?overview=full&geometries=geojson`)
          .then(res => res.json())
          .then(data => {
            if (data.routes && data.routes[0]) {
              setRouteLine(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
              setLiveDistance(data.routes[0].distance); 
            } else setLiveDistance(directKm * 1000);
          }).catch(() => setLiveDistance(directKm * 1000));
      } else {
        if (!liveDistance) setLiveDistance(directKm * 1000);
      }
    }
  }, [helperCoords, emergency?.status, emergency?.location]);

  if (loading || !emergency) return <div className="min-h-screen flex items-center justify-center"><Loader fullScreen /></div>;

  const emergencyLat = emergency.location?.coordinates?.[1];
  const emergencyLng = emergency.location?.coordinates?.[0];
  const isRequester = Boolean(emergency.createdBy && (String(emergency.createdBy._id) === currentUserId || String(emergency.createdBy) === currentUserId));
  const isHelper = Boolean(emergency.helper && (String(emergency.helper._id) === currentUserId || String(emergency.helper) === currentUserId));
  
  let otherPerson = isRequester ? emergency.helper : emergency.createdBy;
  if (typeof otherPerson === 'string') otherPerson = { _id: otherPerson };

  const estimatedMins = liveDistance ? Math.ceil(liveDistance / 333) : 0;
  let formattedDistance = "Awaiting Location...";
  if (liveDistance) formattedDistance = liveDistance < 1000 ? `${Math.round(liveDistance)} m` : `${(liveDistance / 1000).toFixed(1)} km`;
  
  const directDistanceKm = helperCoords && emergencyLat ? calculateDistanceKm(helperCoords.lat, helperCoords.lng, emergencyLat, emergencyLng) : null;
  const isWithin100m = directDistanceKm !== null && directDistanceKm <= 0.1;

  let narrativeTitle = ""; let narrativeSub = "";
  if (emergency.status === "SEARCHING") { narrativeTitle = "Searching..."; narrativeSub = "Alerting users"; } 
  else if (['ASSIGNED', 'ON_THE_WAY'].includes(emergency.status)) { 
    narrativeTitle = isRequester ? "Responder En Route" : "Head to Location"; 
    narrativeSub = estimatedMins > 0 ? `${estimatedMins} mins • ${formattedDistance}` : formattedDistance; 
  } else if (emergency.status === "ARRIVED") {
    narrativeTitle = "Arrived at Destination"; narrativeSub = "Location reached safely.";
  }

  // 🟢 NEW LAYOUT: Scrollable Flex-Col, Transparent, Stacked for ALL devices
  return (
    <div className="w-full min-h-[100dvh] bg-transparent flex flex-col relative overflow-y-auto overflow-x-hidden">
      
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} messages={messages} currentUserId={currentUserId} otherPerson={otherPerson} newMessage={newMessage} setNewMessage={setNewMessage} onSendMessage={(e) => { e.preventDefault(); if (newMessage.trim()) { socketRef.current.emit("SEND_MESSAGE", { emergencyId: id, senderId: currentUserId, text: newMessage.trim() }); setNewMessage(""); } }} chatEndRef={chatEndRef} />

      {/* 1. TOP PANEL (Transparent) */}
      <div className="w-full z-20 max-w-4xl mx-auto">
        <TrackingTopPanel narrativeTitle={narrativeTitle} narrativeSub={narrativeSub} onBack={() => navigate('/')} />
      </div>

      {/* 2. MAP (Fixed height so user can scroll past it) */}
      <div className="w-full h-[50vh] min-h-[400px] z-10 max-w-4xl mx-auto rounded-none md:rounded-3xl overflow-hidden border-0 md:border border-neutral-200 dark:border-neutral-800 shadow-none md:shadow-lg">
        <TrackingMap emergencyLat={emergencyLat} emergencyLng={emergencyLng} helperCoords={helperCoords} routeLine={routeLine} status={emergency.status} />
      </div>

      {/* 3. BOTTOM PANEL (Transparent) */}
      <div className="w-full z-20 flex-1 pb-10 max-w-4xl mx-auto">
        <TrackingBottomPanel isRequester={isRequester} isHelper={isHelper} otherPerson={otherPerson} emergency={emergency} isWithin100m={isWithin100m} isResolving={isResolving} isDropping={isDropping} isCanceling={isCanceling} displayAddress={emergency.location?.address} onResolve={() => { setIsResolving(true); api.patch(`/emergencies/${id}/status`, { status: 'RESOLVED' }).then(() => navigate('/')).catch(() => { toast.error("Failed"); setIsResolving(false); }); }} onDrop={() => { if(window.confirm("Cancel response?")) { setIsDropping(true); api.post(`/emergencies/${id}/drop`).then(() => navigate('/')).catch(() => { toast.error("Failed"); setIsDropping(false); }); } }} onCancel={() => { if(window.confirm("Cancel emergency?")) { setIsCanceling(true); api.patch(`/emergencies/${id}/cancel`).then(() => navigate('/')).catch(() => { toast.error("Failed"); setIsCanceling(false); }); } }} onOpenChat={() => setIsChatOpen(true)} />
      </div>

    </div>
  );
}