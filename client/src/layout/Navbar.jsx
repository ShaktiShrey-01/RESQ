import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../store/themeSlice';
import { Sun, Moon, Home, FileWarning, User, Siren } from 'lucide-react';
import LogoutBtn from '../components/Logoutbtn';
import { cn } from '../lib/utils';

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/report', label: 'Report', icon: FileWarning },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const theme = useSelector((state) => state.theme.theme);
  const dispatch = useDispatch();

  return (
    <>
      <nav className="fixed inset-x-0 top-4 z-50 flex justify-center px-2 sm:px-4">
        <div className="w-[95%] max-w-[1600px]">
          
          <div className="flex items-center justify-between gap-2 rounded-full border-[1.5px] border-white/30 bg-[#3a87e5] px-5 py-3.5 sm:py-4 shadow-lg shadow-[#3a87e5]/40 sm:px-8 text-white">
            
            <NavLink to="/" className="flex shrink-0 items-center gap-3 transition-transform hover:scale-105">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-600/30">
                <Siren className="h-5 w-5" />
              </span>
              {/* CHANGED: Removed "hidden" class and increased text size to 2xl/3xl */}
              <span className="text-2xl sm:text-3xl font-black tracking-tight">
                RESQ
              </span>
            </NavLink>

            <div className="hidden items-center gap-2 rounded-full bg-black/10 p-1.5 md:flex">
              {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-full px-5 py-2 text-[0.95rem] font-bold transition-all duration-300',
                      isActive
                        ? 'bg-white text-[#3a87e5] shadow-md scale-105'
                        : 'text-white/90 hover:bg-white/20 hover:text-white hover:scale-105'
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => dispatch(toggleTheme())}
                aria-label="Toggle theme"
                className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:bg-white/20 hover:scale-105"
              >
                <Sun className={cn('absolute h-5 w-5 transition-all duration-500', theme === 'dark' ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100')} />
                <Moon className={cn('absolute h-5 w-5 transition-all duration-500', theme === 'dark' ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0')} />
              </button>

              <div className="hidden md:block">
                <LogoutBtn />
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Toggle menu"
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/20 md:hidden"
              >
                <div className="flex h-5 w-5 flex-col items-center justify-center gap-[6px]">
                  <span className={cn('block h-[2.5px] w-5 origin-center rounded-full bg-white transition-all duration-300', menuOpen && 'translate-y-[8.5px] rotate-45')} />
                  <span className={cn('block h-[2.5px] w-5 rounded-full bg-white transition-all duration-300', menuOpen && 'opacity-0')} />
                  <span className={cn('block h-[2.5px] w-5 origin-center rounded-full bg-white transition-all duration-300', menuOpen && '-translate-y-[8.5px] -rotate-45')} />
                </div>
              </button>
            </div>
          </div>

          <div className={cn('overflow-hidden transition-all duration-300 ease-in-out md:hidden', menuOpen ? 'mt-2 max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
            <div className="flex flex-col gap-1 rounded-3xl border-[1.5px] border-white/30 bg-[#3a87e5] p-4 shadow-lg text-white">
              {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-[1rem] font-bold transition-all',
                      isActive ? 'bg-white text-[#3a87e5]' : 'text-white hover:bg-white/20'
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </NavLink>
              ))}
              <div className="mt-2 border-t border-white/20 pt-3">
                <LogoutBtn full />
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className="h-24 md:h-[6rem]" />
    </>
  );
}