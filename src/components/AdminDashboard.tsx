import React, { useState } from "react";
import {
  LayoutDashboard, BedDouble, CalendarCheck, Users,
  Settings, LogOut, Globe, ChevronRight, CheckCircle2, XCircle, Info, Images,
} from "lucide-react";
import { Notification } from "../types";
import OverviewTab  from "./tabs/OverviewTab";
import CabinsTab    from "./tabs/CabinsTab";
import BookingsTab  from "./tabs/BookingsTab";
import UsersTab     from "./tabs/UsersTab";
import SettingsTab  from "./tabs/SettingsTab";
import MediaTab     from "./tabs/MediaTab";

type Tab = "overview" | "cabins" | "bookings" | "users" | "settings" | "media";

interface AdminDashboardProps {
  adminEmail: string;
  onLogout: () => void;
  onBackToSite: () => void;
}

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",  label: "KPI Overview",    icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "cabins",    label: "Cabins",           icon: <BedDouble       className="w-4 h-4" /> },
  { id: "bookings",  label: "Reservations",     icon: <CalendarCheck   className="w-4 h-4" /> },
  { id: "users",     label: "Staff Users",      icon: <Users           className="w-4 h-4" /> },
  { id: "media",     label: "Media Manager",    icon: <Images          className="w-4 h-4" /> },
  { id: "settings",  label: "Settings",         icon: <Settings        className="w-4 h-4" /> },
];

export default function AdminDashboard({ adminEmail, onLogout, onBackToSite }: AdminDashboardProps) {
  const [activeTab, setActiveTab]   = useState<Tab>("overview");
  const [notification, setNotification] = useState<Notification | null>(null);
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  const showNotice = (text: string, type: Notification["type"] = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#0A0908] text-stone-200 font-sans flex flex-col">

      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <header className="bg-[#0E0C0B] border-b border-stone-800/60 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#9C2A2A] to-[#852424] rounded-lg flex items-center justify-center shrink-0">
            <span className="text-[#D4AF37] font-serif font-black text-sm">R</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-white tracking-wide">Ras Hotel Admin</p>
            <p className="text-[10px] text-stone-500 font-mono">{adminEmail}</p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center space-x-1.5 bg-emerald-950/50 border border-emerald-800/30 text-emerald-400 text-[10px] font-mono px-2.5 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Supabase Live</span>
          </div>
          <button
            onClick={onBackToSite}
            className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-[#D4AF37] transition cursor-pointer px-3 py-2 rounded-lg hover:bg-stone-900"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Main Site</span>
          </button>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-rose-400 transition cursor-pointer px-3 py-2 rounded-lg hover:bg-stone-900"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ── Body (Sidebar + Content) ───────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-52 shrink-0 bg-[#0E0C0B] border-r border-stone-800/60 flex flex-col py-4 hidden md:flex">
          <nav className="flex-1 px-2 space-y-0.5">
            {NAV.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer group ${
                    active
                      ? "bg-gradient-to-r from-[#9C2A2A]/80 to-[#852424]/60 text-[#D4AF37] border border-[#D4AF37]/20 shadow-lg"
                      : "text-stone-400 hover:text-stone-200 hover:bg-stone-900/60"
                  }`}
                >
                  <span className={active ? "text-[#D4AF37]" : "text-stone-500 group-hover:text-stone-300"}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {active && <ChevronRight className="w-3 h-3 text-[#D4AF37]/60" />}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer badge */}
          <div className="px-3 mt-4">
            <div className="bg-[#1C1613] border border-[#D4AF37]/20 rounded-xl p-2.5 text-[10px] font-mono">
              <p className="text-stone-500 mb-1">Database</p>
              <p className="text-[#D4AF37] font-bold truncate">znqmgaoccvbcqehex</p>
              <p className="text-stone-600 mt-0.5">supabase.co</p>
            </div>
          </div>
        </aside>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E0C0B] border-t border-stone-800/60 flex">
          {NAV.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[9px] font-bold uppercase tracking-wide cursor-pointer transition ${
                  active ? "text-[#D4AF37]" : "text-stone-500"
                }`}
              >
                {item.icon}
                <span>{item.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">

          {/* Global notification toast */}
          {notification && (
            <div className={`fixed top-16 right-4 z-50 max-w-sm flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-xs font-medium transition-all ${
              notification.type === "success"
                ? "bg-emerald-950/90 border-emerald-800/50 text-emerald-300"
                : notification.type === "error"
                  ? "bg-rose-950/90 border-rose-800/50 text-rose-300"
                  : "bg-stone-900/90 border-stone-700/50 text-stone-300"
            }`}>
              {notification.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
              {notification.type === "error"   && <XCircle      className="w-4 h-4 shrink-0 mt-0.5" />}
              {notification.type === "info"    && <Info         className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{notification.text}</span>
            </div>
          )}

          {/* Tab panels */}
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {activeTab === "overview"  && <OverviewTab  showNotice={showNotice} />}
            {activeTab === "cabins"    && <CabinsTab    showNotice={showNotice} />}
            {activeTab === "bookings"  && <BookingsTab  showNotice={showNotice} />}
            {activeTab === "users"     && <UsersTab     showNotice={showNotice} />}
            {activeTab === "media"     && <MediaTab     showNotice={showNotice} />}
            {activeTab === "settings"  && <SettingsTab  showNotice={showNotice} />}
          </div>
        </main>
      </div>
    </div>
  );
}
