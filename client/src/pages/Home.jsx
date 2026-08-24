import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../services/api';

import EmergencyCreator from '../components/home/EmergencyCreator';
import EmergencyRadar from '../components/home/EmergencyRadar';
import { ShieldAlert, Radio, HeartHandshake } from 'lucide-react';

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

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    socketRef.current = io(import.meta.env.VITE_BACKEND_URL, { withCredentials: true });
    const socket = socketRef.current;
    
    const userId = String(user.id || user._id);

    const fetchNearby = (lat, lng) => {
      api.get(`/emergencies/nearby?lat=${lat}&lng=${lng}`)
         .then(res => setNearbyEmergencies(res.data.data))
         .catch(console.error);
    };

    socket.on("connect", () => {
      socket.emit("joinUserRoom", userId);
      if (currentLocRef.current) fetchNearby(currentLocRef.current.lat, currentLocRef.current.lng);
    });
    
    socket.emit("joinUserRoom", userId);

    const handleAcceptedNavigation = (emergencyId) => {
      toast.success("A responder is on the way!", { id: `otw-toast-${emergencyId}` });
      navigate(`/tracking/${emergencyId}`);
    };

    socket.on("EMERGENCY_ACCEPTED_GLOBAL", (data) => {
      if (String(data.creatorId) === userId) handleAcceptedNavigation(data.emergencyId);
    });

    socket.on("EMERGENCY_ACCEPTED", (data) => {
      handleAcceptedNavigation(data.emergencyId || data._id);
    });

    socket.on("EMERGENCY_STATUS_UPDATED", (data) => {
      if (data.status === 'ASSIGNED' || data.status === 'ON_THE_WAY') {
        handleAcceptedNavigation(data.emergencyId);
      }
    });

    socket.on("NEW_EMERGENCY", (data) => {
      if (String(data.creatorId) === userId) return;

      if (currentLocRef.current) {
        const emLng = data.location.coordinates[0];
        const emLat = data.location.coordinates[1];
        const distance = calculateDistanceKm(currentLocRef.current.lat, currentLocRef.current.lng, emLat, emLng);
        
        if (!isNaN(distance) && distance <= 5.0) {
          // 1. Show the pop-up instantly
          toast.error(`New ${data.priority} Emergency nearby!`, { id: `new-em-${data.emergencyId}` });
          sendSystemNotification(
            "🚨 Urgent: Emergency Nearby!", 
            `${data.type} emergency reported ${distance.toFixed(1)} km away. Tap to view.`
          );
          
          // 🟢 CRASH FIX: Do NOT manually inject fake data into React state.
          // Wait exactly 500ms for MongoDB to fully index the new emergency, then fetch the perfect data.
          setTimeout(() => {
            if (currentLocRef.current) {
              fetchNearby(currentLocRef.current.lat, currentLocRef.current.lng);
            }
          }, 500);
        }
      } else {
        setTimeout(() => {
          if (currentLocRef.current) fetchNearby(currentLocRef.current.lat, currentLocRef.current.lng);
        }, 3000);
      }
    });

    socket.on("EMERGENCY_CANCELLED", (data) => {
      setNearbyEmergencies((prev) => prev.filter(e => String(e.emergencyId || e._id) !== String(data.emergencyId)));
    });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        currentLocRef.current = { lat, lng };
        setIsTracking(true);
        if (!fetchedInitialRef.current) {
          fetchedInitialRef.current = true;
          fetchNearby(lat, lng);
        }
      },
      (err) => console.log("Waiting for continuous watcher..."),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: Infinity }
    );

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        currentLocRef.current = { lat, lng };
        setIsTracking(true);
        socket.emit("LOCATION_UPDATE", { userId, lat, lng, emergencyId: null });

        if (!fetchedInitialRef.current) {
          fetchedInitialRef.current = true;
          fetchNearby(lat, lng); 
        }
      },
      (error) => setIsTracking(false),
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
      setNearbyEmergencies((prev) => prev.filter(e => String(e.emergencyId || e._id) !== String(emergencyId)));
      navigate(`/tracking/${emergencyId}`);
    } catch (error) {
      console.error("Accept failed", error);
    }
  };

  const handleDecline = (emergencyId) => {
    setNearbyEmergencies((prev) => prev.filter(e => String(e.emergencyId || e._id) !== String(emergencyId)));
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-20">
        <EmergencyCreator />
        <EmergencyRadar emergencies={nearbyEmergencies} isTracking={isTracking} onAccept={handleAccept} onDecline={handleDecline} />
      </div>

      <div className="w-full flex flex-col items-center text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4">
          RESQ: Help is closer than you think.
        </h2>
        <p className="text-slate-600 dark:text-slate-400 font-medium mb-12 max-w-xl">
          A seamless emergency response system designed to connect those in need with nearby helpers instantly.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-[3px] border-black/5 dark:border-white/10 p-8 rounded-3xl flex flex-col items-center text-center shadow-lg transition-transform hover:-translate-y-2">
            <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6">
              <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-black dark:text-white mb-2">1. Request Help</h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Report an emergency with your exact GPS location. The system immediately processes your request.
            </p>
          </div>
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-[3px] border-black/5 dark:border-white/10 p-8 rounded-3xl flex flex-col items-center text-center shadow-lg transition-transform hover:-translate-y-2">
            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
              <Radio className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-black dark:text-white mb-2">2. Global Radar</h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Your alert is broadcasted to all active RESQ users within a 5km radius via real-time WebSockets.
            </p>
          </div>
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-[3px] border-black/5 dark:border-white/10 p-8 rounded-3xl flex flex-col items-center text-center shadow-lg transition-transform hover:-translate-y-2">
            <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6">
              <HeartHandshake className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-black dark:text-white mb-2">3. Rapid Response</h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              A nearby responder accepts the mission. You both get connected on a live tracking map instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}