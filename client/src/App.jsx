import 'leaflet/dist/leaflet.css';
import React, { Suspense, lazy } from 'react'; // 👈 IMPORT LAZY AND SUSPENSE
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
// Static Layouts & Guards
import { GridVignetteBackground } from './components/ui/GridVignetteBackground';


import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Layout from './layout/Layout'; 
import Loader from './components/ui/Loader'; // 👈 IMPORT YOUR LOADER
// Add this with your other lazy imports at the top
const LiveTracking = lazy(() => import('./pages/LiveTracking'));


// 🟢 LAZY LOADED ROUTES: These only download when the user visits them!
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Home = lazy(() => import('./pages/Home'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  const currentTheme = useSelector((state) => state.theme.theme);

  // Apply it to the physical HTML tag so Tailwind reacts
  useEffect(() => {
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme]);
  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col">
      <GridVignetteBackground />

      <div className="relative z-10 flex-1 flex flex-col">
        <Toaster position="top-center" reverseOrder={false} />

        {/* 🟢 SUSPENSE: Shows the Heartbeat Loader while fetching the lazy route */}
        <Suspense fallback={<Loader fullScreen text="Loading Page" />}>
          <Routes>
            
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            <Route element={<Layout />}>
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
<Route path="/tracking/:id" element={<LiveTracking />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>

          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default App;