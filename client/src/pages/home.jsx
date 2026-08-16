import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AlertTriangle, Flame, Car, ShieldAlert, MapPin, Clock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.theme);

  const [nearbyEmergencies, setNearbyEmergencies] = useState([
    {
      _id: 'demo-1',
      type: 'Medical',
      description: 'Severe breathing difficulty, need first aid or oxygen kit.',
      address: 'Near Gandhi Maidan, Patna',
      priority: 'CRITICAL',
      distance: '1.2 km away',
      createdAt: '2 mins ago'
    }
  ]);

  const getEmergencyIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'medical': return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'fire': return <Flame className="w-6 h-6 text-orange-500" />;
      case 'accident': return <Car className="w-6 h-6 text-amber-500" />;
      default: return <ShieldAlert className="w-6 h-6 text-yellow-500" />;
    }
  };

  const handleAcceptEmergency = async (emergencyId) => {
    try {
      const response = await api.patch(`/emergencies/accept/${emergencyId}`);
      if (response.data.success) {
        toast.success("Emergency accepted! Redirecting to tracking screen...");
        navigate(`/emergency/${emergencyId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept emergency");
    }
  };

  return (
    // CHANGED: Removed the local DotPattern background entirely.
    // The wrapper is now fully transparent so the global background shows through.
    <div className="relative flex flex-col transition-colors duration-300">
      
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        <section>
          <button onClick={() => navigate('/report')} className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-8 text-left shadow-2xl shadow-red-900/30 hover:shadow-red-600/40 transition-all duration-300 transform active:scale-[0.99]">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 w-36 h-36 rounded-full bg-white/10 blur-xl group-hover:scale-150 transition-all duration-500" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="inline-block px-3 py-1 mb-3 text-xs font-bold uppercase tracking-wider bg-black/30 rounded-full text-red-100 border border-white/10">Instant SOS</span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">REPORT AN EMERGENCY</h1>
                <p className="mt-1 text-red-100/80 text-sm font-medium">Broadcast your GPS coordinates to all active nearby responders</p>
              </div>
              <div className="hidden sm:flex w-14 h-14 rounded-full bg-white text-red-600 items-center justify-center shadow-lg group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-6 h-6 stroke-[3]" />
              </div>
            </div>
          </button>
        </section>

        <section className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-[#1f3238] dark:text-[#babcad]">
              <span>🆘 Nearby Help Requests</span>
              <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-[#1f3238] dark:text-[#babcad] rounded-full">{nearbyEmergencies.length}</span>
            </h2>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {nearbyEmergencies.map((item) => (
              <article key={item._id} className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-black/80 backdrop-blur-sm p-5 shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                      {getEmergencyIcon(item.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#1f3238] dark:text-[#babcad]">{item.type}</h3>
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">{item.priority || 'HIGH'}</span>
                      </div>
                      <p className="text-xs text-[#1f3238]/70 dark:text-[#babcad]/70 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" /> {item.address}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[#1f3238]/90 dark:text-[#babcad]/90 border border-slate-200 dark:border-white/10">📍 {item.distance}</span>
                </div>
                <p className="text-sm text-[#1f3238]/80 dark:text-[#babcad]/80 bg-slate-50 dark:bg-white/5 p-3 rounded-lg border border-slate-100 dark:border-white/10">"{item.description}"</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/10">
                  <span className="text-xs text-[#1f3238]/70 dark:text-[#babcad]/70 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {item.createdAt}</span>
                  <button onClick={() => handleAcceptEmergency(item._id)} className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/30 transition transform active:scale-95 flex items-center gap-1.5">
                    <span>I CAN HELP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}