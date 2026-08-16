import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Provider, useSelector } from 'react-redux';
import { store } from './store/store';

import Layout from './layout/Layout';
import Home from './pages/Home';
// import Report from './pages/Report';
// import Profile from './pages/Profile';
// import Login from './pages/Login';

import { DotPattern } from './components/ui/dot-pattern';
import { cn } from './lib/utils';

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
    <div className="relative min-h-screen overflow-x-hidden">
      {/* 
        CHANGED: Added a linear-gradient mask! 
        This completely erases the dots behind the Navbar (top 110px) 
        and the Footer (bottom 80px). Now their background is strictly the solid page bg! 
      */}
      <DotPattern
        className={cn(
          "fixed inset-0 z-0",
          "[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,transparent_110px,white_160px,white_calc(100%-160px),transparent_calc(100%-80px),transparent_100%)]",
          "[mask-image:linear-gradient(to_bottom,transparent_0%,transparent_110px,white_160px,white_calc(100%-160px),transparent_calc(100%-80px),transparent_100%)]"
        )}
      />
      
      <div className="relative z-10 flex min-h-screen flex-col">
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
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              {/* <Route path="/report" element={<Report />} /> */}
              {/* <Route path="/profile" element={<Profile />} /> */}
            </Route>
            {/* <Route path="/login" element={<Login />} /> */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </ThemeWrapper>
    </Provider>
  );
}