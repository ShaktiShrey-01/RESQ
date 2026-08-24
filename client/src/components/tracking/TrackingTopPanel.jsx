import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function TrackingTopPanel({
  narrativeTitle,
  narrativeSub,
  onBack
}) {
  return (
    // 🟢 Completely transparent wrapper
    <div className="w-full bg-transparent flex flex-col pt-4 pb-4 px-4 relative z-20">
      <div className="flex items-center justify-center relative w-full">
        <button
          onClick={onBack}
          className="absolute left-0 p-2 rounded-full bg-neutral-200/50 dark:bg-neutral-800/50 backdrop-blur-md hover:bg-neutral-300/50 dark:hover:bg-neutral-700/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
        </button>
             
        <div className="text-center flex flex-col items-center mt-2 mb-2">
          <h2 className="text-xl md:text-2xl font-extrabold text-black dark:text-white tracking-tight drop-shadow-sm">
            {narrativeTitle}
          </h2>
          <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 bg-neutral-200/50 dark:bg-neutral-800/50 backdrop-blur-md rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-xs font-bold text-black dark:text-white">
              {narrativeSub}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}