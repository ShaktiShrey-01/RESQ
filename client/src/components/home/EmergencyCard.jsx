import React from 'react';
import { User, Crosshair, MapPin } from 'lucide-react';

export default function EmergencyCard({ em, onAccept, onDecline }) {
  return (
    <div className="p-5 rounded-2xl bg-white/60 dark:bg-black/30 border border-black/10 shadow-sm flex flex-col gap-3 transition-colors">
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          <h4 className="font-bold text-lg text-black dark:text-white capitalize">
            Name: {em.createdBy?.name || em.creatorName || "User in need"}
          </h4>
        </div>
        <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider ${
          em.priority === 'CRITICAL' ? "bg-red-600 text-white" : 
          em.priority === 'HIGH' ? "bg-orange-500 text-white" : "bg-yellow-400 text-black"
        }`}>
          {em.priority}
        </span>
      </div>

      <div className="flex flex-col gap-1 pl-7">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Type: <span className="font-bold text-black dark:text-white">{em.type}</span>
        </p>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Description: <span className="font-medium text-slate-600 dark:text-slate-400">{em.description || "N/A"}</span>
        </p>
        
        <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1">
          <Crosshair className="h-3.5 w-3.5 text-blue-500" />
          Location: {em.location?.coordinates[1]?.toFixed(5)}, {em.location?.coordinates[0]?.toFixed(5)}
        </p>
        
        <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-red-500" /> 
          Address: <span className="text-black dark:text-white font-bold">{em.address || em.location?.address}</span>
        </p>
      </div>

      <div className="flex gap-2 mt-2">
        <button onClick={() => onAccept(em.emergencyId || em._id)} className="flex-1 h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-md hover:bg-emerald-500 transition-colors">
          Help
        </button>
        <button onClick={() => onDecline(em.emergencyId || em._id)} className="h-11 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-300 transition-colors">
          Dismiss
        </button>
      </div>
    </div>
  );
}