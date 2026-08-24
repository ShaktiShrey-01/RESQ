import React from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';

export default function TrackingTopPanel({ narrativeTitle, narrativeSub, unreadCount, isChatOpen, onOpenChat, onBack, otherPerson }) {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-b-[2rem] shadow-md z-20 flex flex-col pt-6 pb-6 px-6 relative">
      <button onClick={onBack} className="absolute top-6 left-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
        <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
      </button>
      
      <div className="mt-2 text-center flex flex-col items-center">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{narrativeTitle}</h2>
        
        <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-wide">{narrativeSub}</p>
        </div>
      </div>

      {/* 🟢 SWIGGY STYLE FLOATING CHAT BANNER */}
      {unreadCount > 0 && !isChatOpen && (
        <div className="mt-5 flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-lg animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="relative p-2 bg-slate-100 dark:bg-slate-700 rounded-full">
              <MessageCircle className="w-5 h-5 text-slate-700 dark:text-white" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-800">
                {unreadCount}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              You have <span className="font-bold text-black dark:text-white">{unreadCount} new message{unreadCount > 1 ? 's' : ''}</span> <br/>
              from {otherPerson?.name?.split(" ")[0]}
            </p>
          </div>
          <button onClick={onOpenChat} className="text-xs font-black text-red-500 tracking-wider uppercase hover:scale-105 transition-transform">
            CHAT NOW
          </button>
        </div>
      )}
    </div>
  );
}