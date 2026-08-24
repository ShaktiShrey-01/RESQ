"use client";

import React, { useEffect, useRef, useState } from "react";
import { Cloud, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react"; 
import { useForm } from "react-hook-form"; 
import { Button } from "./button"; 
import { Input } from "./input";
import { Label } from "./label";
import { useNavigate } from "react-router-dom"; 
// 🟢 1. IMPORT YOUR LOADER (Since they are in the same 'ui' folder)
import Loader from "./Loader"; 

export default function CloudWatchForm({
  mode = "login", // Can be "login", "signup", "otp", "forgot-password", or "reset-password"
  onSubmit,
  loading = false,
}) {
  const faceRef = useRef(null);
  const navigate = useNavigate(); 
  
  const isSignup = mode === "signup";
  const isOtp = mode === "otp";
  const isForgot = mode === "forgot-password";
  const isReset = mode === "reset-password";
  const isLogin = mode === "login";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onBlur", 
  });

  const currentValues = watch();
  const [focusedField, setFocusedField] = useState("");
  const [eyePosition, setEyePosition] = useState({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } });
  const [blink, setBlink] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!faceRef.current) return;
      const rect = faceRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const maxX = 8; 
      const maxY = 5;
      const normalizedX = Math.max(-1, Math.min(1, dx / (rect.width / 2)));
      const normalizedY = Math.max(-1, Math.min(1, dy / (rect.height / 2)));

      setEyePosition({
        left: { x: normalizedX * maxX, y: normalizedY * maxY },
        right: { x: normalizedX * maxX, y: normalizedY * maxY },
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    let timeout;
    const blinkLoop = () => {
      const randomTime = 2500 + Math.random() * 2500;
      timeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          blinkLoop();
        }, 180);
      }, randomTime);
    };
    blinkLoop();
    return () => clearTimeout(timeout);
  }, []);

  // Dynamically generate fields based on the current step/mode
  let fields = [];
  if (isOtp) {
    fields = [
      {
        name: "otp", label: "6-Digit OTP", placeholder: "Enter the code", type: "text",
        validation: { required: "OTP is required", pattern: { value: /^[0-9]{6}$/, message: "Must be exactly 6 digits" } },
      }
    ];
  } else if (isForgot) {
    fields = [
      {
        name: "email", label: "Email", placeholder: "you@example.com", type: "email",
        validation: { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } },
      }
    ];
  } else if (isReset) {
    fields = [
      {
        name: "otp", label: "6-Digit OTP", placeholder: "Enter reset code", type: "text",
        validation: { required: "OTP is required", pattern: { value: /^[0-9]{6}$/, message: "Must be exactly 6 digits" } },
      },
      {
        name: "password", label: "New Password", placeholder: "Enter new password", type: "password",
        validation: { required: "Password is required", minLength: { value: 6, message: "Must be at least 6 chars" } },
      }
    ];
  } else {
    // Normal Login/Signup
    // 🟢 UPDATED: Added the image file input for Signup
    fields = [
      ...(isSignup ? [
        { name: "name", label: "Full Name", placeholder: "Enter your name", type: "text", validation: { required: "Name is required", minLength: { value: 2, message: "Must be at least 2 chars" } } },
        { name: "image", label: "Profile Picture (Optional)", type: "file", accept: "image/*" } // <-- ADDED
      ] : []),
      { name: "email", label: "Email", placeholder: "you@example.com", type: "email", validation: { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } } },
      { name: "password", label: "Password", placeholder: "Enter your password", type: "password", validation: { required: "Password is required", minLength: { value: 6, message: "Must be at least 6 chars" } } },
    ];
  }
  

  const isEyesCovered = (passwordFocused && !showPassword) || blink;

  return (
    <div className="flex w-full items-center justify-center px-4 py-1">
      <div className="w-full max-w-md rounded-3xl border-[3px] border-white/50 bg-white/70 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(0,0,0,0.12)] sm:p-6">
        
        {/* Animated Cloud */}
        <div ref={faceRef} className="relative mx-auto mb-2 flex h-16 w-40 items-center justify-center animate-[float_4s_ease-in-out_infinite] sm:h-20 sm:w-48">
          <Cloud strokeWidth={1.5} className="absolute h-24 w-24 fill-white text-slate-200 drop-shadow-[0_12px_20px_rgba(0,0,0,0.15)] transition-all duration-500 ease-out hover:scale-110 hover:rotate-3 sm:h-28 sm:w-28" />
          <div className="absolute -bottom-1 left-1/2 h-2 w-16 -translate-x-1/2 rounded-full bg-black/10 blur-md transition-all duration-500" />

          {/* LEFT EYE */}
          <div
            className={`absolute left-[33%] top-[42%] z-10 overflow-hidden transition-all duration-300 ease-out ${isEyesCovered ? "h-[3px] rounded-full" : "h-5 w-5 sm:h-6 sm:w-6 rounded-full"}`}
            style={{
              transform: isEyesCovered ? "translate(0, 3px)" : `translate(${eyePosition.left.x}px, ${eyePosition.left.y}px)`,
              background: isEyesCovered ? "#0f172a" : "#ffffff",
            }}
          >
            {!isEyesCovered && <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.25)] sm:h-2.5 sm:w-2.5" />}
          </div>

          {/* RIGHT EYE */}
          <div
            className={`absolute right-[33%] top-[42%] z-10 overflow-hidden transition-all duration-300 ease-out ${isEyesCovered ? "h-[3px] rounded-full" : "h-5 w-5 sm:h-6 sm:w-6 rounded-full"}`}
            style={{
              transform: isEyesCovered ? "translate(0, 3px)" : `translate(${eyePosition.right.x}px, ${eyePosition.right.y}px)`,
              background: isEyesCovered ? "#0f172a" : "#ffffff",
            }}
          >
            {!isEyesCovered && <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.25)] sm:h-2.5 sm:w-2.5" />}
          </div>
        </div>

        <div className="mb-4 text-center">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 transition-all duration-500 hover:tracking-wide sm:text-xl">
            {isOtp || isReset ? "Verify & Reset" : isForgot ? "Reset Password" : isSignup ? "Create your account" : "Welcome back"}
          </h2>
          {isOtp && (
            <p className="mt-1 text-xs font-semibold text-slate-500">
              We sent a 6-digit code to your email.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 md:space-y-7">
          {fields.map((field) => {
            const hasValue = Boolean(currentValues[field.name]);
            const isFocused = focusedField === field.name;
            const isPasswordField = field.type === "password";
            const fieldError = errors[field.name];

            const { ref, onChange, onBlur, name } = register(field.name, field.validation);
            const inputType = isPasswordField ? (showPassword ? "text" : "password") : field.type;

            return (
              <div key={field.name} className="group relative transition-transform duration-300 focus-within:-translate-y-1">
                <Label
                  htmlFor={field.name}
                  className={`absolute left-3 z-10 origin-left px-1 pointer-events-none transition-all duration-300 ease-out ${isFocused || hasValue ? "-top-2 scale-90 bg-white text-slate-900 font-bold" : "top-1/2 -translate-y-1/2 text-slate-500"} ${fieldError ? "text-red-500" : ""}`}
                >
                  {field.label}
                </Label>
                
                <Input
                  id={field.name}
                  name={name}
                  type={inputType}
                  placeholder={isFocused ? field.placeholder : ""}
                  maxLength={field.name === "otp" ? 6 : undefined} 
                  ref={ref}
                  onChange={onChange}
                  onFocus={() => {
                    setFocusedField(field.name);
                    if (isPasswordField) setPasswordFocused(true);
                  }}
                  onBlur={(e) => {
                    onBlur(e);
                    setFocusedField("");
                    if (isPasswordField) setPasswordFocused(false);
                  }}
                  className={`h-10 rounded-xl bg-white/80 px-4 text-sm caret-slate-900 transition-all duration-300 focus:bg-white group-hover:shadow-sm text-slate-900 font-medium ${isPasswordField ? "pr-10" : ""} ${field.name === "otp" ? "text-center tracking-[0.5em] text-lg font-bold" : ""} ${
                    fieldError 
                      ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10" 
                      : "border-slate-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 group-hover:border-slate-300"
                  }`}
                />

                {isPasswordField && (
                  <button
                    type="button"
                    tabIndex="-1" 
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors z-10"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}

                <div className={`absolute bottom-0 left-1/2 h-[2.5px] -translate-x-1/2 rounded-full transition-all duration-300 ${fieldError ? "bg-red-500" : "bg-slate-900"} ${isFocused ? "w-[92%] opacity-100" : "w-0 opacity-0"}`} />
                
                {fieldError && (
                  <span className="absolute -bottom-[20px] md:-bottom-[24px] right-2 md:right-3 text-[10px] md:text-[11px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1">
                    {fieldError.message}
                  </span>
                )}
              </div>
            );
          })}

          {isLogin && (
            <div className="flex justify-end pt-1">
              <button 
                type="button" 
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-bold text-slate-500 transition-all duration-300 hover:-translate-y-0.5 hover:text-slate-900 hover:underline">
                Forgot password?
              </button>
            </div>
          )}

          {/* 🟢 2. THE BUTTON: Injects Loader when loading = true */}
          <Button
            type="submit"
            disabled={loading}
            className="group flex items-center justify-center mt-2 h-10 w-full rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 active:translate-y-0 disabled:opacity-70"
          >
            {loading ? (
              <Loader small /> // 👈 Show mini green heartbeat if loading
            ) : (
              <>
                {/* Otherwise, show normal text and the arrow/shield icon */}
                <span className="font-bold text-[0.95rem]">
                  {isOtp ? "Verify & Create Account" : isSignup ? "Send OTP" : isForgot ? "Send Reset Link" : isReset ? "Update Password" : "Sign in"}
                </span>
                {(isOtp || isReset) 
                  ? <ShieldCheck size={17} className="ml-2 transition-transform duration-300 group-hover:scale-110" /> 
                  : <ArrowRight size={17} className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                }
              </>
            )}
          </Button>
        </form>

        <div className="mt-3 text-center text-[0.8rem] font-medium text-slate-500 sm:text-sm">
          {isOtp || isForgot || isReset ? (
            <button type="button" onClick={() => navigate('/login')} className="font-extrabold text-slate-900 transition-all duration-300 hover:underline hover:underline-offset-4">
              Back to Login
            </button>
          ) : isSignup ? (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => navigate('/login')} className="font-extrabold text-slate-900 transition-all duration-300 hover:underline hover:underline-offset-4">
                Login
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button type="button" onClick={() => navigate('/signup')} className="font-extrabold text-slate-900 transition-all duration-300 hover:underline hover:underline-offset-4">
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}