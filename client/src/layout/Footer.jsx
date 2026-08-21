import { Siren, Phone, MapPin } from 'lucide-react';
import resqLogo from '../assets/resq.png'; 
export default function Footer() {
  return (
    <footer className="relative z-10 w-full flex justify-center px-1 pb-3 sm:px-4 mt-auto">
      
      {/* ✨ TRANSPARENCY FIX: bg-white/40 with backdrop-blur-md lets the grid shine through! */}
      <div className="w-[98%] sm:w-[95%] max-w-[1600px] flex flex-row items-center justify-between gap-1 sm:gap-4 rounded-full border-[3px] border-[#1F3238] dark:border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md text-black dark:text-white px-3 sm:px-8 py-2 sm:py-4 shadow-lg shadow-black/5">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-1.5 sm:gap-3 transition-transform hover:scale-105 cursor-pointer shrink-0">
         <span className="relative flex h-10 w-10 items-center justify-center overflow-visible">
             <img 
               src={resqLogo} 
               alt="RESQ Logo" 
               loading="lazy"
               /* 🟢 KEEP THE BIG LOGO SIZE: It will now float outside its box and hover over the navbar seamlessly! */
               className="absolute h-15 w-16 sm:h-20 sm:w-20 object-contain" 
             />
           </span>
          <span className="text-sm sm:text-2xl font-black tracking-tight text-black dark:text-white hidden min-[320px]:block">
            RESQ
          </span>
        </div>

        {/* Center: Copyright */}
        <p className="text-[9px] sm:text-[0.9rem] font-bold text-black/80 dark:text-white/80 text-center truncate px-1 sm:px-0">
          © {new Date().getFullYear()} <span className="hidden sm:inline">RESQ. Connecting responders in seconds.</span>
        </p>

        {/* Right: Emergency Contacts */}
        <div className="flex items-center gap-2 sm:gap-5 text-[10px] sm:text-[0.9rem] font-bold text-black/80 dark:text-white/80 shrink-0">
          <span className="flex items-center gap-1 hover:text-black dark:hover:text-white hover:scale-105 transition-all cursor-pointer">
            <Phone className="h-3 w-3 sm:h-4 sm:w-4" /> 112 <span className="hidden sm:inline">(Emergency)</span>
          </span>
          <span className="flex items-center gap-1 hover:text-black dark:hover:text-white hover:scale-105 transition-all cursor-pointer">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden min-[400px]:inline">Patna</span>
          </span>
        </div>

      </div>
    </footer>
  );
}