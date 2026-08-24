import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../services/api';

import EmergencyCreator from '../components/home/EmergencyCreator';
import EmergencyRadar from '../components/home/EmergencyRadar';

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

// 🟢 NOTIFICATION HELPER: Safely triggers an OS-level push notification
const sendSystemNotification = (title, body) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
};

export default function Home() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user); 
  const socketRef = useRef(null);
  const currentLocRef = useRef(null); 
  const fetchedInitialRef = useRef(false);

  const [nearbyEmergencies, setNearbyEmergencies] = useState([]);
  const [isTracking, setIsTracking] = useState(false);

  // 🟢 NOTIFICATION SETUP: Ask the browser for permission when the app loads
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
   if (!user) return;

    socketRef.current = io("http://localhost:8000", { withCredentials: true });
    const socket = socketRef.current;
    const userId = user.id || user._id;

    // 🟢 ANTI-AMNESIA: Force it to re-join the room if the connection ever flickers
    socket.on("connect", () => {
      socket.emit("joinUserRoom", userId);
    });
    // Also emit right now on first load
    socket.emit("joinUserRoom", userId);

    // 🟢 GLOBAL FALLBACK: If the private room misses, this catches it!
    socket.on("EMERGENCY_ACCEPTED_GLOBAL", (data) => {
      if (data.creatorId === userId) {
        toast.success("A responder is on the way!");
        navigate(`/tracking/${data.emergencyId}`);
      }
    });

    // 🟢 FRONTEND GATEKEEPER
    socket.on("NEW_EMERGENCY", (data) => {
      if (data.creatorId === userId) return;

      if (currentLocRef.current) {
        const emLng = data.location.coordinates[0];
        const emLat = data.location.coordinates[1];
        const distance = calculateDistanceKm(currentLocRef.current.lat, currentLocRef.current.lng, emLat, emLng);
        
        if (!isNaN(distance) && distance <= 5.0) {
          // 1. Show in-app toast
          toast.error(`New ${data.priority} Emergency nearby!`);
          
          // 2. 🟢 Trigger OS-level notification (Even if they are in another tab!)
          sendSystemNotification(
            "🚨 Urgent: Emergency Nearby!", 
            `${data.type} emergency reported ${distance.toFixed(1)} km away. Tap to view.`
          );

          // 3. Add to UI list
          setNearbyEmergencies((prev) => [data, ...prev]);
        }
      }
    });

    socket.on("EMERGENCY_ACCEPTED", (data) => {
      toast.success("A responder is on the way!");
      const id = data.emergencyId || data._id;
      navigate(`/tracking/${id}`); 
    });

    socket.on("EMERGENCY_STATUS_UPDATED", (data) => {
      if (data.status === 'ASSIGNED' || data.status === 'ON_THE_WAY') {
        toast.success("A responder is on the way!");
        navigate(`/tracking/${data.emergencyId}`);
      }
    });

    socket.on("EMERGENCY_CANCELLED", (data) => {
      setNearbyEmergencies((prev) => prev.filter(e => (e.emergencyId || e._id) !== data.emergencyId));
    });

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        currentLocRef.current = { lat, lng };
        setIsTracking(true);
        
        socket.emit("LOCATION_UPDATE", { userId, lat, lng, emergencyId: null });

        if (!fetchedInitialRef.current) {
          fetchedInitialRef.current = true;
          api.get(`/emergencies/nearby?lat=${lat}&lng=${lng}`)
             .then(res => setNearbyEmergencies(res.data.data))
             .catch(console.error);
        }
      },
      (error) => {
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (socket) socket.disconnect();
    };
  }, [user, navigate]);

  const handleAccept = async (emergencyId) => {
    try {
      await api.post(`/emergencies/${emergencyId}/accept`);
      setNearbyEmergencies((prev) => prev.filter(e => (e.emergencyId || e._id) !== emergencyId));
      navigate(`/tracking/${emergencyId}`);
    } catch (error) {
      console.error("Accept failed", error);
    }
  };

  const handleDecline = (emergencyId) => {
    setNearbyEmergencies((prev) => prev.filter(e => (e.emergencyId || e._id) !== emergencyId));
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <EmergencyCreator />
      <EmergencyRadar emergencies={nearbyEmergencies} isTracking={isTracking} onAccept={handleAccept} onDecline={handleDecline} />
    </div>
  );
}