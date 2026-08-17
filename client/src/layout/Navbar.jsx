import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../store/themeSlice';
import { Sun, Moon, Home, FileWarning, User, Siren } from 'lucide-react';
import LogoutBtn from '../components/Logoutbtn'; // Adjust path if needed
import { cn } from '../lib/utils';
import resqLogo from '../assets/resq.png'; // Adjust relative path based on where your component file is
const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/report', label: 'Report', icon: FileWarning },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Navbar() {
 
  const [menuOpen, setMenuOpen] = useState(false);
  const theme = useSelector((state) => state.theme.theme); // Make sure this matches your slice
  const dispatch = useDispatch();


  
  // 🐞 THEME BUG FIX: This applies the 'dark' class to the actual HTML document!
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      <nav className="fixed inset-x-0 top-4 z-50 flex justify-center px-2 sm:px-4">
        <div className="w-[95%] max-w-[1600px]">
          
          {/* ✨ TRANSPARENCY FIX: bg-white/40 with backdrop-blur-md lets the grid shine through! Added dark mode colors. */}
          <div className="flex items-center justify-between gap-2 rounded-full border-[3px] border-[#1F3238] dark:border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md px-4 py-2.5 sm:py-3 shadow-lg shadow-black/5 sm:px-8 text-black dark:text-white transition-all">
            
  <NavLink to="/" className="flex shrink-0 items-center gap-3 transition-transform hover:scale-105">

  <span className="relative flex h-10 w-10 items-center justify-center overflow-visible">
    <img 
      src={resqLogo} 
      alt="RESQ Logo" 
      loading="lazy"
      /* 🟢 KEEP THE BIG LOGO SIZE: It will now float outside its box and hover over the navbar seamlessly! */
      className="absolute h-15 w-16 sm:h-20 sm:w-20 object-contain" 
    />
  </span>
  <span className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white">
    RESQ
  </span>
</NavLink>

            <div className="hidden items-center gap-2 rounded-full bg-black/5 dark:bg-white/5 p-1.5 md:flex">
              {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-full px-5 py-2 text-[0.95rem] font-bold transition-all duration-300',
                      isActive
                        ? 'bg-black/10 dark:bg-white/20 text-black dark:text-white shadow-sm scale-105'
                        : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white hover:scale-105'
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={() => dispatch(toggleTheme())}
                aria-label="Toggle theme"
                className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/10 hover:scale-105 text-black dark:text-white"
              >
                <Sun className={cn('absolute h-5 w-5 transition-all duration-500', theme === 'dark' ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100')} />
                <Moon className={cn('absolute h-5 w-5 transition-all duration-500', theme === 'dark' ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0')} />
              </button>

              <div className="hidden md:block">
                <LogoutBtn />
              </div>

              {/* Hamburger Menu Icon */}
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Toggle menu"
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 md:hidden"
              >
                <div className="flex h-5 w-5 flex-col items-center justify-center gap-[6px]">
                  <span className={cn('block h-[2.5px] w-5 origin-center rounded-full bg-black dark:bg-white transition-all duration-300', menuOpen && 'translate-y-[8.5px] rotate-45')} />
                  <span className={cn('block h-[2.5px] w-5 rounded-full bg-black dark:bg-white transition-all duration-300', menuOpen && 'opacity-0')} />
                  <span className={cn('block h-[2.5px] w-5 origin-center rounded-full bg-black dark:bg-white transition-all duration-300', menuOpen && '-translate-y-[8.5px] -rotate-45')} />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          <div className={cn('overflow-hidden transition-all duration-300 ease-in-out md:hidden', menuOpen ? 'mt-2 max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
            {/* ✨ TRANSPARENCY FIX: Dropdown uses glass effect too! */}
            <div className="flex flex-col gap-1 rounded-3xl border-[3px] border-[#1F3238] dark:border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 shadow-lg text-black dark:text-white">
              {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-[1rem] font-bold transition-all',
                      isActive 
                        ? 'bg-black/10 dark:bg-white/20 text-black dark:text-white' 
                        : 'text-black/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white'
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </NavLink>
              ))}
              <div className="mt-2 border-t border-black/10 dark:border-white/10 pt-3">
                <LogoutBtn full />
              </div>
            </div>
          </div>
        </div>
      </nav>
      {/* Spacer so the content isn't hidden under the fixed navbar */}
      <div className="h-24 md:h-[6.5rem]" />
    </>
  );
}