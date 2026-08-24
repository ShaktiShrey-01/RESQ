import React from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';

export default function TrackingTopPanel({
  narrativeTitle,
  narrativeSub,
  unreadCount,
  onOpenChat,
  onBack
}) {
  return (
// Just change the main wrapper div on line 12:
<div className="w-full bg-white dark:bg-slate-900 md:rounded-none rounded-b-[2rem] shadow-md md:shadow-none z-20 flex flex-col pt-5 pb-5 px-6 relative border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>

        <button
          onClick={onOpenChat}
          className="relative p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Open chat"
        >
          <MessageCircle className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
             
      <div className="mt-3 text-center flex flex-col items-center">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {narrativeTitle}
        </h2>
                 
        <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-wide">
            {narrativeSub}
          </p>
        </div>
      </div>
    </div>
  );
}