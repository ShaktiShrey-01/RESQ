import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // 👈 IMPORT THIS
import { logOut } from '../store/authSlice'; // 👈 IMPORT THIS
import { LogOut, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import api from '../services/api';

export default function LogoutBtn({ full = false }) {
  const [status, setStatus] = useState('idle');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      // 1. Trigger the loading animation
      setStatus('loading');

      // 2. Call backend (Notice we removed the extra '/api' because Axios base URL has it)
      await api.post('/users/logoutall');

      // 3. Trigger the success animation
      setStatus('done');
      toast.success('Logged out successfully');

      // 4. Wait just a tiny moment so the user can see the cool checkmark animation!
      setTimeout(() => {
        dispatch(logOut()); // 👈 VERY IMPORTANT: Clears Redux so you don't get kicked back to Home!
        navigate('/login'); // Redirect to login
      }, 800);

    } catch (error) {
      setStatus('idle'); // Reset button if it fails
      console.error('Error during logout:', error);
      // We don't need a toast.error here because your api.js interceptor handles it automatically!
    }
  };

  const label = status === 'loading' ? 'Logging out...' : status === 'done' ? 'See you soon!' : 'Logout';

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={status !== 'idle'}
      aria-label="Logout"
      className={cn(
        'group relative flex items-center overflow-hidden rounded-full text-[0.95rem] font-bold shadow-md',
        'transition-all duration-300 ease-out active:scale-95 disabled:cursor-not-allowed',
        'bg-red-600 text-white hover:bg-red-500 hover:shadow-lg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400',
        full
          ? 'w-full justify-center gap-2 px-4 py-2.5'
          : 'h-10 w-10 justify-center gap-1.5 px-0 hover:w-[120px] hover:px-4'
      )}
    >
      {status === 'done' ? (
        <Check className="h-4 w-4 shrink-0 animate-[logout-pop_0.3s_ease-out]" />
      ) : (
        <LogOut
          className={cn(
            'h-4 w-4 shrink-0 transition-transform duration-300',
            status === 'loading'
              ? 'animate-[logout-slide_0.7s_ease-in-out_infinite]'
              : 'group-hover:translate-x-0.5'
          )}
        />
      )}
      <span
        className={cn(
          'whitespace-nowrap transition-all duration-300',
          full
            ? 'opacity-100'
            : 'max-w-0 opacity-0 group-hover:max-w-[90px] group-hover:opacity-100'
        )}
      >
        {label}
      </span>
    </button>
  );
}