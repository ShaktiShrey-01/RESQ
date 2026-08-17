import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <>
      <Navbar />
      <main className="relative z-10 flex-1 flex flex-col w-full pb-10">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}