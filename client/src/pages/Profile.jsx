import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logOut } from '../store/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import { User, Mail, Trash2, Clock, MapPin, ShieldAlert, HelpingHand, AlertCircle } from 'lucide-react';
import Loader from '../components/ui/Loader'; 

export default function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [historyData, setHistoryData] = useState([]); 
  const [isFetching, setIsFetching] = useState(true); 
  const [isDeleting, setIsDeleting] = useState(false); 
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [profileRes, historyRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/emergencies/history')
        ]);
        
        setProfileData(profileRes.data.data);
        
        const created = (historyRes.data.data.created || []).map(em => ({
          ...em,
          roleTag: 'CREATED'
        }));

        const helped = (historyRes.data.data.helped || []).map(em => ({
          ...em,
          roleTag: 'HELPED'
        }));

        const combinedHistory = [...created, ...helped].sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        setHistoryData(combinedHistory); 
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchAllData();
  }, []);

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      setIsDeleting(true); 
      await api.delete('/users/deleteaccount'); 
      toast.success('Account deleted permanently.');
      dispatch(logOut());
      navigate('/login');
    } catch (error) {
      setIsDeleting(false); 
    }
  };

  if (isFetching) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 min-h-screen">
        <Loader text="Loading Profile Data" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 sm:p-8 rounded-3xl border-[3px] border-[#1F3238] dark:border-white/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-lg">
        {profileData?.avatar ? (
          <img src={profileData.avatar} alt="Avatar" loading="lazy" className="h-28 w-28 rounded-full border-[4px] border-white dark:border-slate-800 object-cover shadow-xl" />
        ) : (
          <div className="h-28 w-28 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border-[4px] border-white dark:border-slate-700 shadow-xl">
            <User className="h-12 w-12 text-slate-400" />
          </div>
        )}

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3 w-full mt-2">
          <h1 className="text-3xl font-black capitalize text-slate-900 dark:text-white">{profileData?.name || "Rescue User"}</h1>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3">
            <div className="flex items-center gap-2 bg-white/60 dark:bg-black/30 px-4 py-2 rounded-full font-bold text-sm text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700">
              <Mail className="h-4 w-4" /> <span>{profileData?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-red-500" /> History
        </h2>
        
        {historyData.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white/20 dark:bg-black/10">
            <p className="text-slate-500 font-bold">No emergency history found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {historyData.map((emergency) => {
              
              // 🟢 OVERRIDE DISPLAY TEXT TO ONLY SHOW CLOSED, SEARCHING, OR CANCELED
              let displayStatus = 'SEARCHING';
              if (['ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'RESOLVED', 'CLOSED'].includes(emergency.status)) {
                displayStatus = 'CLOSED';
              } else if (emergency.status === 'CANCELED') {
                displayStatus = 'CANCELED';
              }

              return (
                <div key={emergency._id} className="p-5 sm:p-6 rounded-2xl border-[3px] border-black/5 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-md transition-all hover:scale-[1.01]">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">{emergency.type}</h3>
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border
                        ${emergency.roleTag === 'CREATED' 
                          ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' 
                          : 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800'}`}
                      >
                        {emergency.roleTag === 'CREATED' ? <AlertCircle className="h-3 w-3" /> : <HelpingHand className="h-3 w-3" />}
                        {emergency.roleTag}
                      </span>
                    </div>
                    
                    {/* Render simply */}
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider w-fit
                      ${displayStatus === 'CLOSED' ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400' : 
                        displayStatus === 'CANCELED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`} 
                    >
                      {displayStatus}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-500" /> {emergency.location?.address || 'GPS Coordinates'}
                    </p>
                    <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" /> {new Date(emergency.createdAt).toLocaleString()}
                    </p>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 mb-12 flex justify-center">
        <button
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="group flex items-center justify-center h-14 w-full sm:w-72 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-500 font-black border-[3px] border-red-200 dark:border-red-900/50 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
        >
          {isDeleting ? (
            <Loader small />
          ) : (
            <span className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform" /> DELETE ACCOUNT
            </span>
          )}
        </button>
      </div>

    </div>
  );
}