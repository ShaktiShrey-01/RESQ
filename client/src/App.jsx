import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Provider, useSelector } from 'react-redux';
import { store } from './store/store';
import ForgotPassword from './pages/ForgotPassword';
import Layout from './layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Import the Grid background instead of Voxel
import { GridVignetteBackground } from './components/ui/vignette-grid-background';

function ThemeWrapper({ children }) {
  const theme = useSelector((state) => state.theme.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden">
      {/* GLOBAL GRID BACKGROUND FOR ALL PAGES */}
      <GridVignetteBackground 
        horizontalVignetteSize={100} 
        verticalVignetteSize={100} 
        className="opacity-80 dark:opacity-60" 
      />
      
      {/* Page Content Container */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeWrapper>
        <BrowserRouter>
          <Toaster position="top-center" />
          <Routes>
            {/* Routes WITH Navbar and Footer */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
            </Route>
            
            {/* Routes WITHOUT Navbar and Footer (Authentication Pages) */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </ThemeWrapper>
    </Provider>
  );
}