import React, { useState } from 'react';
import CloudWatchForm from '../components/ui/cloud-watch-form';
import toast from 'react-hot-toast';
import { Siren } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 
  const [signupData, setSignupData] = useState(null); 
  
  const navigate = useNavigate();

  const handleSendOtp = async (formData) => {
    setLoading(true);
    try {
      // CHANGED: /auth/ to /users/
      await api.post('/users/send-signup-otp', { email: formData.email });
      
      setSignupData(formData);
      setStep(2);
      toast.success("OTP sent to your email!");
      
    } catch (error) {
      console.error("Failed to send OTP:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpFormData) => {
    setLoading(true);
    try {
      const payload = {
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
        otp: otpFormData.otp 
      };

      // CHANGED: /auth/ to /users/
      const response = await api.post('/users/signup', payload);
      
      localStorage.setItem('token', response.data.accessToken);
      toast.success("Account verified and created successfully!");
      navigate('/'); 
      
    } catch (error) {
      console.error("Signup Failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-[4vh] md:pt-[3vh] min-h-[100dvh] pb-4">
      
      <div className="mb-3 flex flex-col items-center transition-transform duration-300 hover:scale-105 sm:mb-4">
        <div className="mb-1.5 flex items-center gap-2 sm:mb-2 sm:gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-lg shadow-red-600/30 sm:h-12 sm:w-12">
            <Siren className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <span className="text-3xl font-black tracking-tight text-[var(--global-text)] sm:text-4xl">
            RESQ
          </span>
        </div>
        <p className="max-w-[280px] text-center text-[0.75rem] font-bold leading-snug opacity-60 sm:max-w-xs sm:text-[0.9rem]">
          Connecting responders in seconds when it matters most.
        </p>
      </div>

      {step === 1 ? (
        <CloudWatchForm 
          mode="signup" 
          onSubmit={handleSendOtp} 
          loading={loading}
        />
      ) : (
        <CloudWatchForm 
          mode="otp" 
          onSubmit={handleVerifyOtp} 
          loading={loading}
        />
      )}
    </div>
  );
}