import React from 'react';
import resqLogo from '/resq.png'; 

// 🟢 CUSTOM SVG ICONS (Replaces the removed Lucide brand icons)
const GithubIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.15-.38 6.5-1.4 6.5-7.17a5.2 5.2 0 0 0-1.3-3.72 5 5 0 0 0-.1-3.6s-1.1-.3-3.5 1.4a11.5 11.5 0 0 0-6 0c-2.4-1.7-3.5-1.4-3.5-1.4a5 5 0 0 0-.1 3.6 5.2 5.2 0 0 0-1.3 3.72c0 5.77 3.34 6.79 6.5 7.17A4.8 4.8 0 0 0 8 18v4"></path>
  </svg>
);

const LinkedinIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect width="4" height="12" x="2" y="9"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

export default function Footer() {
  return (
    <footer className="relative z-10 w-full flex justify-center px-1 pb-3 sm:px-4 mt-auto">
      
      <div className="w-[98%] sm:w-[95%] max-w-[1600px] flex flex-row items-center justify-between gap-1 sm:gap-4 rounded-full border-[3px] border-[#1F3238] dark:border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md text-black dark:text-white px-3 sm:px-8 py-2 sm:py-4 shadow-lg shadow-black/5">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-1.5 sm:gap-3 transition-transform hover:scale-105 cursor-pointer shrink-0">
         <span className="relative flex h-10 w-10 items-center justify-center overflow-visible">
             <img 
               src={resqLogo} 
               alt="RESQ Logo" 
               loading="lazy"
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

        {/* Right: Developer Social Links */}
        <div className="flex items-center gap-3 sm:gap-6 text-[10px] sm:text-[0.9rem] font-bold text-black/80 dark:text-white/80 shrink-0 pr-2">
          
          <a href="https://github.com/ShaktiShrey-01" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-black dark:hover:text-white hover:scale-110 transition-all cursor-pointer">
            <GithubIcon className="h-4 w-4 sm:h-5 sm:w-5" /> 
            <span className="hidden sm:inline">GitHub</span>
          </a>

          <a href="https://linkedin.com/in/shakti33" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#0077b5] dark:hover:text-[#0a66c2] hover:scale-110 transition-all cursor-pointer">
            <LinkedinIcon className="h-4 w-4 sm:h-5 sm:w-5" /> 
            <span className="hidden sm:inline">LinkedIn</span>
          </a>

        </div>
      </div>
    </footer>
  );
}