import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { authService } from "./services/supabaseService";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import type { User } from "@supabase/supabase-js";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Rehydrate session on first mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Keep state in sync with Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Update last_seen whenever the user is authenticated
  useEffect(() => {
    if (user) authService.updateLastSeen().catch(() => {});
  }, [user?.id]);

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  const handleBackToSite = () => {
    window.location.href = "https://yourhotel.com";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0908] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-stone-400 text-xs font-mono uppercase tracking-widest">
            Verifying session…
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AdminLogin onBackToSite={handleBackToSite} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <AdminDashboard
                adminEmail={user.email ?? ""}
                onLogout={handleLogout}
                onBackToSite={handleBackToSite}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
