import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function TrackingTopPanel({
  narrativeTitle,
  narrativeSub,
  onBack
}) {
  return (
    <div className="w-full bg-white dark:bg-neutral-900 md:border-b border-neutral-200 dark:border-neutral-800 flex flex-col pt-4 pb-4 px-4 relative shadow-sm z-20">
      <div className="flex items-center justify-center relative w-full">
        <button
          onClick={onBack}
          className="absolute left-0 p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
        </button>
             
        <div className="text-center flex flex-col items-center">
          <h2 className="text-lg md:text-xl font-extrabold text-black dark:text-white tracking-tight">
            {narrativeTitle}
          </h2>
          <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              {narrativeSub}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}