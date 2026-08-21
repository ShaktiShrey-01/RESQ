import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { AlertTriangle, ArrowRight, ArrowLeft, MapPin, Crosshair } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Loader from '../components/ui/Loader';

export default function Home() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user); 
  const socketRef = useRef(null);

  const [boxView, setBoxView] = useState('prompt'); 
  const [activeEmergencyId, setActiveEmergencyId] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'Medical',
    priority: 'HIGH',
    description: '',
    address: '',
    location: null 
  });

  const [nearbyEmergencies, setNearbyEmergencies] = useState([]);

  useEffect(() => {
    if (!user) return;

    socketRef.current = io("http://localhost:8000", { withCredentials: true });
    const socket = socketRef.current;

    socket.emit("joinUserRoom", user.id || user._id);

    socket.on("NEW_EMERGENCY", (data) => {
      toast.error(`New ${data.priority} Emergency nearby!`);
      setNearbyEmergencies((prev) => [data, ...prev]);
    });

    socket.on("EMERGENCY_ACCEPTED", (data) => {
      toast.success("A responder is on the way!");
      navigate(`/tracking/${data.emergencyId}`); 
    });

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setIsTracking(true);
        socket.emit("LOCATION_UPDATE", {
          userId: user.id || user._id,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          emergencyId: null 
        });
      },
      (error) => {
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (socket) socket.disconnect();
    };
  }, [user, navigate]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGetLocation = () => {
    setGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          location: { lat: position.coords.latitude, lng: position.coords.longitude },
          address: formData.address || 'GPS Location Acquired' 
        });
        toast.success('Location secured');
        setGettingLocation(false);
      },
      (error) => {
        toast.error('Could not fetch location.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location || !formData.address) {
      toast.error("Location and address are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type: formData.type,
        priority: formData.priority,
        description: formData.description,
        address: formData.address,
        location: { lat: formData.location.lat, lng: formData.location.lng }
      };

      const response = await api.post('/emergencies', payload);
      setActiveEmergencyId(response.data.data._id);
      setBoxView('radar'); 
      
    } catch (error) {
      console.error("Submit failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEmergency = async () => {
    if (!activeEmergencyId) return;
    setCanceling(true);
    try {
      await api.patch(`/emergencies/${activeEmergencyId}/cancel`);
      toast.success("Request cancelled");
      setBoxView('prompt'); 
      setActiveEmergencyId(null);
    } catch (error) {
      toast.error("Failed to cancel.");
    } finally {
      setCanceling(false);
    }
  };

  const handleAccept = async (emergencyId) => {
    try {
      await api.post(`/emergencies/${emergencyId}/accept`);
      setNearbyEmergencies((prev) => prev.filter(e => e.emergencyId !== emergencyId));
      navigate(`/tracking/${emergencyId}`);
    } catch (error) {
      console.error("Accept failed", error);
    }
  };

  const handleDecline = (emergencyId) => {
    setNearbyEmergencies((prev) => prev.filter(e => e.emergencyId !== emergencyId));
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ========================================== */}
      {/* BOX 1: REPORT EMERGENCY FORM               */}
      {/* ========================================== */}
      <div className="relative rounded-3xl border-[3px] border-[#1F3238] dark:border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-lg overflow-hidden min-h-[550px]">
        <div 
          className="absolute inset-0 flex h-full transition-transform duration-500 ease-in-out w-[300%]"
          style={{ 
            transform: boxView === 'prompt' ? 'translateX(0%)' : 
                       boxView === 'form' ? 'translateX(-33.333%)' : 
                       'translateX(-66.666%)' 
          }}
        >
          
          {/* VIEW A: INITIAL PROMPT */}
          <div className="w-1/3 h-full flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
            <h2 className="text-3xl font-black text-black dark:text-white mb-2">Need Help?</h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium mb-8 max-w-[250px]">
              Report an emergency to alert nearby responders instantly.
            </p>
            <button onClick={() => setBoxView('form')} className="flex items-center gap-2 px-8 py-4 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 hover:scale-105 transition-all shadow-lg">
              Report Emergency <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          {/* VIEW B: THE FORM */}
          <div className="w-1/3 h-full p-6 sm:p-8 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <button onClick={() => setBoxView('prompt')} className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-2xl font-black text-black dark:text-white">Emergency Details</h2>
            </div>
            
            <form onSubmit={handleReportSubmit} className="flex flex-col gap-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className="h-12 rounded-xl bg-white/50 dark:bg-black/20 border-2 border-black/10 px-3 font-bold focus:outline-none focus:border-red-500">
                    <option value="Medical">Medical</option>
                    <option value="Accident">Accident</option>
                    <option value="Fire">Fire</option>
                    <option value="Crime/Safety">Crime/Safety</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
                  <select name="priority" value={formData.priority} onChange={handleInputChange} className="h-12 rounded-xl bg-white/50 dark:bg-black/20 border-2 border-black/10 px-3 font-bold text-red-600 focus:outline-none focus:border-red-500">
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <input type="text" name="address" placeholder="Location or Landmark" value={formData.address} onChange={handleInputChange} required className="flex-1 h-12 rounded-xl bg-white/50 dark:bg-black/20 border-2 border-black/10 px-4 font-medium focus:outline-none focus:border-red-500" />
                <button type="button" onClick={handleGetLocation} className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 hover:bg-blue-700 transition-colors">
                  {gettingLocation ? <Loader small /> : <Crosshair className="h-5 w-5" />}
                </button>
              </div>

              <textarea name="description" placeholder="Describe the situation..." value={formData.description} onChange={handleInputChange} required className="flex-1 min-h-[100px] mt-2 resize-none rounded-xl bg-white/50 dark:bg-black/20 border-2 border-black/10 p-4 font-medium focus:outline-none focus:border-red-500" />

              <button type="submit" disabled={submitting} className="mt-4 h-14 w-full rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors flex items-center justify-center">
                {submitting ? <Loader small /> : "Submit Request"}
              </button>
            </form>
          </div>

          {/* VIEW C: SIMPLE WAITING SCREEN */}
          <div className="w-1/3 h-full flex flex-col items-center justify-center p-8 text-center relative">
            <Loader />
            <h2 className="text-2xl font-black text-black dark:text-white mt-6 mb-2">Request Sent</h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium max-w-[250px] mb-8">
              Waiting for nearby responders to accept your alert.
            </p>
            <button 
              onClick={handleCancelEmergency}
              disabled={canceling}
              className="text-red-600 text-sm font-bold hover:underline"
            >
              {canceling ? "Canceling..." : "Cancel Request"}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* BOX 2: NEARBY EMERGENCIES                  */}
      {/* ========================================== */}
      <div className="flex flex-col rounded-3xl border-[3px] border-[#1F3238] dark:border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-lg overflow-hidden min-h-[550px] max-h-[550px]">
        
        <div className="px-6 py-5 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black text-black dark:text-white">Nearby Emergencies</h2>
          </div>
          {isTracking && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full uppercase tracking-wider">
              GPS Active
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {nearbyEmergencies.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <p className="text-sm font-medium text-slate-500">No active emergencies near you right now.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {nearbyEmergencies.map((em) => (
                <div key={em.emergencyId || em._id} className="p-5 rounded-2xl bg-white/60 dark:bg-black/30 border border-black/10 shadow-sm flex flex-col gap-3 transition-colors">
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-lg text-black dark:text-white">{em.type}</h4>
                      <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {em.address}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider ${
                      em.priority === 'CRITICAL' ? "bg-red-600 text-white" :
                      em.priority === 'HIGH' ? "bg-orange-500 text-white" :
                      "bg-yellow-400 text-black"
                    }`}>
                      {em.priority}
                    </span>
                  </div>

                  {em.description && (
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-white/40 dark:bg-black/20 p-3 rounded-xl">
                      "{em.description}"
                    </p>
                  )}

                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleAccept(em.emergencyId || em._id)} className="flex-1 h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-md hover:bg-emerald-500 transition-colors">
                      Help
                    </button>
                    <button onClick={() => handleDecline(em.emergencyId || em._id)} className="h-11 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-300 transition-colors">
                      Dismiss
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}