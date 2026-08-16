import { Siren, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 mt-auto px-1 pb-3 sm:px-4 w-full flex justify-center">
      
      {/* CHANGED: Forced flex-row on all screens, reduced mobile padding to py-2, kept rounded-full */}
      <div className="w-[98%] sm:w-[95%] max-w-[1600px] flex flex-row items-center justify-between gap-1 sm:gap-4 rounded-full border-[1.5px] border-white/30 bg-[#3a87e5] text-white px-3 sm:px-8 py-2 sm:py-4 shadow-lg shadow-[#3a87e5]/40">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-1.5 sm:gap-3 transition-transform hover:scale-105 cursor-pointer shrink-0">
          <span className="flex h-6 w-6 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-600/30">
            <Siren className="h-3 w-3 sm:h-4 sm:w-4" />
          </span>
          <span className="text-sm sm:text-2xl font-black tracking-tight text-white hidden min-[320px]:block">
            RESQ
          </span>
        </div>

        {/* Center: Copyright */}
        <p className="text-[9px] sm:text-[0.9rem] font-bold text-white/90 text-center truncate px-1 sm:px-0">
          © {new Date().getFullYear()} <span className="hidden sm:inline">RESQ. Connecting responders in seconds.</span>
        </p>

        {/* Right: Emergency Contacts */}
        <div className="flex items-center gap-2 sm:gap-5 text-[10px] sm:text-[0.9rem] font-bold text-white/90 shrink-0">
          <span className="flex items-center gap-1 hover:text-white hover:scale-105 transition-all cursor-pointer">
            <Phone className="h-3 w-3 sm:h-4 sm:w-4" /> 112 <span className="hidden sm:inline">(Emergency)</span>
          </span>
          <span className="flex items-center gap-1 hover:text-white hover:scale-105 transition-all cursor-pointer">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden min-[400px]:inline">Patna</span>
          </span>
        </div>

      </div>
    </footer>
  );
}