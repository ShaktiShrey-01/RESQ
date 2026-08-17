import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logOut } from '../store/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import { User, Mail, ShieldCheck, Trash2, Clock, CalendarDays } from 'lucide-react';
import Loader from '../components/ui/Loader'; // 👈 Import Loader

export default function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [isFetching, setIsFetching] = useState(true); // Tracks initial page load
  const [isDeleting, setIsDeleting] = useState(false); // Tracks button click
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/users/me');
        setProfileData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchUserProfile();
  }, []);

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you absolutely sure you want to delete your account?");
    if (!confirmDelete) return;

    try {
      setIsDeleting(true); // Start button loader
      await api.delete('/users/deleteaccount'); 
      toast.success('Account deleted permanently.');
      dispatch(logOut());
      navigate('/login');
    } catch (error) {
      setIsDeleting(false); // Stop button loader on error
    }
  };

  // 🟢 1. FULL PAGE LOADER
  // Shows while the API fetches the user data on mount
  if (isFetching) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader text="Fetching Profile" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-3xl border-[3px] border-[#1F3238] dark:border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-lg">
        {/* NATIVE IMAGE LAZY LOADING */}
        {profileData?.avatar ? (
          <img src={profileData.avatar} alt="Avatar" loading="lazy" className="h-24 w-24 rounded-full border-4 border-white object-cover" />
        ) : (
          <div className="h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border-4 border-white">
            <User className="h-12 w-12 text-slate-400" />
          </div>
        )}

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3 w-full">
          <h1 className="text-3xl font-black capitalize">{profileData?.name || "Rescue User"}</h1>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3">
            <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 px-4 py-1.5 rounded-full font-medium">
              <Mail className="h-4 w-4" /> <span>{profileData?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 2. BUTTON WITH INTEGRATED LOADER */}
      <div className="mt-4 flex justify-center pb-8">
        <button
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="group flex items-center justify-center h-14 w-full sm:w-64 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-500 font-bold border-2 border-red-200 dark:border-red-900/50 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {/* If deleting, show small loader. If not, show text & icon! */}
          {isDeleting ? (
            <Loader small />
          ) : (
            <span className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 group-hover:animate-pulse" /> Delete Account
            </span>
          )}
        </button>
      </div>

    </div>
  );
}