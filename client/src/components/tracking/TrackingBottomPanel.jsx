import React from 'react';
import { MapPin, Phone, MessageCircle, XCircle } from 'lucide-react';
import Loader from '../ui/Loader';

export default function TrackingBottomPanel({ 
  isRequester, isHelper, otherPerson, emergency, isWithin100m, 
  isResolving, isDropping, isCanceling, displayAddress, 
  onResolve, onDrop, onCancel, onOpenChat 
}) {
  const defaultAvatar = 'https://res.cloudinary.com/dxjzq6f0g/image/upload/v1690912345/avatars/default-avatar.png';

  return (
// Just change the main wrapper div on line 9:
<div className="w-full bg-white dark:bg-slate-900 rounded-t-[2rem] md:rounded-none shadow-[0_-15px_40px_rgba(0,0,0,0.1)] md:shadow-none p-6 z-20 pb-8 relative mt-[-20px] md:mt-0">
      <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>

      {/* 🟢 SWIGGY STYLE PERSON DETAILS CARD */}
      {otherPerson && (
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 mb-6 shadow-sm">
          <div className="flex items-center gap-4">
            <img src={otherPerson.avatar || defaultAvatar} className="w-14 h-14 rounded-full border-2 border-white dark:border-slate-700 shadow-sm object-cover" alt="Avatar" />
            <div className="flex flex-col">
              <h3 className="text-lg font-black text-slate-900 dark:text-white capitalize leading-tight">{otherPerson.name}</h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{isRequester ? "Responder" : "Requester"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={onOpenChat} className="h-12 w-12 rounded-full bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center hover:scale-105 transition-transform text-blue-600 dark:text-blue-400">
              <MessageCircle className="h-5 w-5" />
            </button>
            {otherPerson.phone && (
              <a href={`tel:${otherPerson.phone}`} className="h-12 w-12 rounded-full bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center hover:scale-105 transition-transform text-emerald-600 dark:text-emerald-400">
                <Phone className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-6 px-2">
        {displayAddress && (
          <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
            <MapPin className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <span className="font-bold leading-snug">{displayAddress}</span>
          </div>
        )}
        {emergency.description && (
          <div className="pl-8">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 italic border-l-[3px] border-slate-200 dark:border-slate-700 pl-3">"{emergency.description}"</p>
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-3">
        {isHelper && isWithin100m && ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED'].includes(emergency?.status) ? (
          <button onClick={onResolve} disabled={isResolving} className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[15px] hover:scale-[1.02] transition-transform shadow-lg flex items-center justify-center">
            {isResolving ? <Loader small /> : "Mark as Resolved"}
          </button>
        ) : isHelper && !isWithin100m && ['ASSIGNED', 'ON_THE_WAY'].includes(emergency?.status) ? (
          <div className="w-full h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-[15px] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
            Get within 100m to Resolve
          </div>
        ) : null}

        {isHelper && ['ASSIGNED', 'ON_THE_WAY'].includes(emergency?.status) && (
          <button onClick={onDrop} disabled={isDropping} className="w-full h-12 rounded-2xl text-red-500 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2">
            {isDropping ? <Loader small /> : <><XCircle className="h-4 w-4" /> Cancel Response</>}
          </button>
        )}

        {isRequester && ['SEARCHING', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED'].includes(emergency?.status) && (
          <button onClick={onCancel} disabled={isCanceling} className="w-full h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-[15px] hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2">
            {isCanceling ? <Loader small /> : <><XCircle className="h-5 w-5" /> Cancel Emergency</>}
          </button>
        )}
      </div>
    </div>
  );
}