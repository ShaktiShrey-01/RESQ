import React from 'react';
import EmergencyCard from './EmergencyCard';

export default function EmergencyRadar({ emergencies, isTracking, onAccept, onDecline }) {
  return (
    <div className="flex flex-col rounded-3xl border-[3px] border-[#1F3238] dark:border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-lg overflow-hidden min-h-[550px] max-h-[550px]">
      <div className="px-6 py-5 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 flex justify-between items-center shrink-0">
        <div><h2 className="text-xl font-black text-black dark:text-white">Nearby Emergencies</h2></div>
        {isTracking && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full uppercase tracking-wider">
            GPS Active
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {emergencies.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-sm font-medium text-slate-500">No active emergencies near you right now.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {emergencies.map((em) => (
              <EmergencyCard 
                key={em.emergencyId || em._id} 
                em={em} 
                onAccept={onAccept} 
                onDecline={onDecline} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}