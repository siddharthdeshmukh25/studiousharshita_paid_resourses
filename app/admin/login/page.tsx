"use client";

import { useState } from "react";
import { Shield, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Background updated to dark slate/black to match the dashboard theme
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      
      {/* Top Header Section */}
      <div className="flex flex-col items-center mb-6 sm:mb-8 text-white">
        {/* Changed shield background to match the dark theme and icon color to neon green */}
        <div className="bg-[#1a1a1a] p-2.5 sm:p-3 rounded-full mb-3 sm:mb-4 shadow-[0_0_15px_rgba(163,230,53,0.15)] border border-slate-700/50">
          <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-[#a3e635]" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1.5 sm:mb-2 text-gray-100">Admin Portal</h1>
        <p className="text-slate-400 text-xs sm:text-sm">Secure access for administrators only</p>
      </div>

      {/* Main Login Card - Updated to dark theme colors */}
      <div className="bg-[#0d0d0d] w-full max-w-md rounded-[20px] shadow-2xl p-5 sm:p-8 border border-[#1a1a1a]">
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          {/* Changed lock icon color to neon green */}
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-[#a3e635]" strokeWidth={2} />
          <h2 className="text-base sm:text-lg font-semibold text-gray-100">Administrator Login</h2>
        </div>

        <form className="space-y-4 sm:space-y-6" onSubmit={handleLogin}>
          {/* Username Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Username
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              // Updated input styling for dark theme
              className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-[#151515] border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-[#a3e635]/50 focus:border-[#a3e635] transition-all text-xs sm:text-sm font-medium"
              style={{
                WebkitBoxShadow: '0 0 0 1000px #151515 inset',
                WebkitTextFillColor: '#ffffff',
                color: '#ffffff',
                caretColor: '#a3e635',
                transition: 'background-color 5000s ease-in-out 0s'
              }}
              required
              disabled={loading}
              autoComplete="off"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // Updated input styling for dark theme
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-[#151515] border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-[#a3e635]/50 focus:border-[#a3e635] transition-all text-xs sm:text-sm pr-10 sm:pr-12 font-medium"
                style={{
                  WebkitBoxShadow: '0 0 0 1000px #151515 inset',
                  WebkitTextFillColor: '#ffffff',
                  color: '#ffffff',
                  caretColor: '#a3e635',
                  transition: 'background-color 5000s ease-in-out 0s'
                }}
                required
                disabled={loading}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button - Updated to neon green accent */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#a3e635] hover:bg-[#84cc16] text-[#0f172a] font-semibold py-2 sm:py-3 rounded-lg transition-colors mt-2 text-xs sm:text-sm shadow-md shadow-[#a3e635]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Secure Login</span>
            )}
          </button>
        </form>

        {/* Card Footer Warning */}
        <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
          <p className="text-[11px] text-center text-slate-500 leading-relaxed px-4">
            This is a secure administrative portal. Unauthorized access is prohibited.
          </p>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="mt-10 text-center text-xs text-slate-600">
        &copy; 2026 studiousharshita. All rights reserved.
      </div>

    </div>
  );
}
