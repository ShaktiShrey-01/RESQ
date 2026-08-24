import React from 'react';
import { MapPin, Phone, MessageCircle, XCircle } from 'lucide-react';
import Loader from '../ui/Loader';

export default function TrackingBottomPanel({
  isRequester, isHelper, otherPerson, emergency, isWithin100m,
  isResolving, isDropping, isCanceling, displayAddress,
  onResolve, onDrop, onCancel, onOpenChat
}) {
  const defaultAvatar = 'https://res.cloudinary.com/dxjzq6f0g/image/upload/v1690912345/avatars/default-avatar.png';
  const personName = otherPerson?.name || (isRequester ? "Responder" : "Requester");
  const personAvatar = otherPerson?.avatar || defaultAvatar;

  return (
    // 🟢 Completely transparent wrapper
    <div className="w-full bg-transparent p-5 z-20">
      
      {/* Transparent Glass Card for Person Details */}
      <div className="flex items-center justify-between bg-neutral-200/40 dark:bg-neutral-800/40 backdrop-blur-md p-4 rounded-3xl border border-black/5 dark:border-white/5 mb-5">
        <div className="flex items-center gap-4">
          <img src={personAvatar} className="w-14 h-14 rounded-full border-2 border-white/50 dark:border-white/10 object-cover shadow-sm" alt="Avatar" />
          <div className="flex flex-col">
            <h3 className="text-lg font-black text-black dark:text-white capitalize leading-tight drop-shadow-sm">
              {personName}
            </h3>
            <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mt-0.5">
              {isRequester ? "Responder Details" : "Requester Details"}
            </p>
          </div>
        </div>
                   
        <div className="flex items-center gap-2">
          <button onClick={onOpenChat} className="h-12 w-12 rounded-full bg-white/60 dark:bg-black/50 backdrop-blur-md flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm hover:scale-105 transition-transform">
            <MessageCircle className="h-5 w-5" />
          </button>
          {otherPerson?.phone && (
            <a href={`tel:${otherPerson.phone}`} className="h-12 w-12 rounded-full bg-white/60 dark:bg-black/50 backdrop-blur-md flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm hover:scale-105 transition-transform">
              <Phone className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>

      {displayAddress && (
        <div className="flex items-start gap-3 text-sm text-black dark:text-white mb-6 px-2 drop-shadow-sm">
          <MapPin className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <span className="font-bold leading-snug">{displayAddress}</span>
        </div>
      )}
             
      <div className="flex flex-col gap-4">
        {isHelper && isWithin100m && ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED'].includes(emergency?.status) ? (
          <button onClick={onResolve} disabled={isResolving} className="w-full h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-extrabold text-[15px] shadow-lg flex items-center justify-center transition-transform active:scale-95">
            {isResolving ? <Loader small /> : "Mark as Resolved"}
          </button>
        ) : isHelper && !isWithin100m && ['ASSIGNED', 'ON_THE_WAY'].includes(emergency?.status) ? (
          <div className="w-full h-14 rounded-2xl bg-neutral-200/50 dark:bg-neutral-800/50 backdrop-blur-md text-black dark:text-white font-bold text-sm flex items-center justify-center border-2 border-dashed border-black/20 dark:border-white/20">
            Get within 100m to Resolve
          </div>
        ) : null}

        {isHelper && ['ASSIGNED', 'ON_THE_WAY'].includes(emergency?.status) && (
          <button onClick={onDrop} disabled={isDropping} className="w-full h-14 rounded-2xl text-red-600 dark:text-red-400 font-bold text-[15px] bg-red-100/50 dark:bg-red-900/30 backdrop-blur-md flex items-center justify-center gap-2 transition-colors hover:bg-red-200/50 dark:hover:bg-red-900/50">
            {isDropping ? <Loader small /> : <><XCircle className="h-5 w-5" /> Cancel Response</>}
          </button>
        )}

        {isRequester && ['SEARCHING', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED'].includes(emergency?.status) && (
          <button onClick={onCancel} disabled={isCanceling} className="w-full h-14 rounded-2xl text-red-600 dark:text-red-400 font-bold text-[15px] bg-red-100/50 dark:bg-red-900/30 backdrop-blur-md flex items-center justify-center gap-2 transition-colors hover:bg-red-200/50 dark:hover:bg-red-900/50">
            {isCanceling ? <Loader small /> : <><XCircle className="h-5 w-5" /> Cancel Emergency</>}
          </button>
        )}
      </div>
    </div>
  );
}