import React from 'react';
import { MapPin, Phone, MessageCircle, XCircle } from 'lucide-react';
import Loader from '../ui/Loader';

export default function TrackingBottomPanel({
  isRequester, isHelper, otherPerson, emergency, isWithin100m,
  isResolving, isDropping, isCanceling, displayAddress,
  onResolve, onDrop, onCancel, onOpenChat
}) {
  const defaultAvatar = 'https://res.cloudinary.com/dxjzq6f0g/image/upload/v1690912345/avatars/default-avatar.png';
  
  // CRASH FIX: Safe fallback if user data is missing during transition
  const personName = otherPerson?.name || (isRequester ? "Responder" : "Requester");
  const personAvatar = otherPerson?.avatar || defaultAvatar;

  return (
// Remove bg-white dark:bg-neutral-900 and borders, keep it transparent
<div className="w-full p-5 z-20">
      {/* Swipe handle for mobile look */}
      <div className="w-10 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto mb-5 md:hidden"></div>
      
      {/* Person Details Card */}
      <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 mb-5">
        <div className="flex items-center gap-3">
          <img src={personAvatar} className="w-12 h-12 rounded-full border border-neutral-200 dark:border-neutral-700 object-cover" alt="Avatar" />
          <div className="flex flex-col">
            <h3 className="text-base font-black text-black dark:text-white capitalize leading-tight">
              {personName}
            </h3>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mt-0.5">
              {isRequester ? "Responder Details" : "Requester Details"}
            </p>
          </div>
        </div>
                   
        <div className="flex items-center gap-2">
          <button onClick={onOpenChat} className="h-10 w-10 rounded-full bg-white dark:bg-neutral-700 shadow-sm border border-neutral-200 dark:border-neutral-600 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <MessageCircle className="h-4 w-4" />
          </button>
          {otherPerson?.phone && (
            <a href={`tel:${otherPerson.phone}`} className="h-10 w-10 rounded-full bg-white dark:bg-neutral-700 shadow-sm border border-neutral-200 dark:border-neutral-600 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Phone className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {displayAddress && (
        <div className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300 mb-5 px-1">
          <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <span className="font-bold leading-snug">{displayAddress}</span>
        </div>
      )}
             
      <div className="flex flex-col gap-3">
        {isHelper && isWithin100m && ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED'].includes(emergency?.status) ? (
          <button onClick={onResolve} disabled={isResolving} className="w-full h-12 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-[15px] shadow-lg flex items-center justify-center">
            {isResolving ? <Loader small /> : "Mark as Resolved"}
          </button>
        ) : isHelper && !isWithin100m && ['ASSIGNED', 'ON_THE_WAY'].includes(emergency?.status) ? (
          <div className="w-full h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 font-bold text-sm flex items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-700">
            Get within 100m to Resolve
          </div>
        ) : null}

        {isHelper && ['ASSIGNED', 'ON_THE_WAY'].includes(emergency?.status) && (
          <button onClick={onDrop} disabled={isDropping} className="w-full h-12 rounded-xl text-red-600 font-bold text-sm bg-red-50 dark:bg-red-900/10 flex items-center justify-center gap-2">
            {isDropping ? <Loader small /> : <><XCircle className="h-4 w-4" /> Cancel Response</>}
          </button>
        )}

        {isRequester && ['SEARCHING', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED'].includes(emergency?.status) && (
          <button onClick={onCancel} disabled={isCanceling} className="w-full h-12 rounded-xl text-red-600 font-bold text-sm bg-red-50 dark:bg-red-900/10 flex items-center justify-center gap-2">
            {isCanceling ? <Loader small /> : <><XCircle className="h-4 w-4" /> Cancel Emergency</>}
          </button>
        )}
      </div>
    </div>
  );
}