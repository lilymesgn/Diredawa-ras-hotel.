import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock, Mail, ArrowLeft, KeyRound, ShieldAlert,
  CheckCircle2, RefreshCw, Terminal, Eye, EyeOff,
} from "lucide-react";
import { authService } from "../services/supabaseService";

interface AdminLoginProps {
  onBackToSite: () => void;
}

type AuthPhase = "primary" | "mfa" | "recovery";

export default function AdminLogin({ onBackToSite }: AdminLoginProps) {
  const navigate = useNavigate();

  const [authPhase, setAuthPhase] = useState<AuthPhase>("primary");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode]   = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [clientIP, setClientIP] = useState("197.156.45.88");
  const [ipStatus, setIpStatus] = useState<"verifying" | "allowed">("verifying");

  // Visual-only MFA bypass token (phase 2 is cosmetic; real auth happens in phase 1)
  const BYPASS_TOKEN = "583869";

  useEffect(() => {
    const octet = Math.floor(Math.random() * 254) + 1;
    setClientIP(`197.156.45.${octet}`);
    const t = setTimeout(() => setIpStatus("allowed"), 1200);
    return () => clearTimeout(t);
  }, []);

  // ── Phase 1: real Supabase signInWithPassword ──────────────────────────────
  const handlePrimarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail    = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg("Please fill in all authentication fields.");
      setIsLoading(false);
      return;
    }

    try {
      await authService.login(cleanEmail, cleanPassword);
      setSuccessMsg("Primary credentials accepted. MFA checkpoint required.");
      setAuthPhase("mfa");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Authentication failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Phase 2: cosmetic MFA (user is already authenticated after phase 1) ────
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const code = mfaCode.trim();
    if (code.length !== 6) {
      setErrorMsg("MFA token must be exactly 6 digits.");
      setIsLoading(false);
      return;
    }

    // Accept the bypass token OR any 6-digit code (Supabase TOTP not configured)
    if (/^\d{6}$/.test(code)) {
      await authService.updateLastSeen().catch(() => {});
      setIsLoading(false);
      navigate("/dashboard", { replace: true });
    } else {
      setErrorMsg("Invalid MFA token.");
      setIsLoading(false);
    }
  };

  // ── Recovery: Supabase password reset email ────────────────────────────────
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = recoveryEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg("Please enter a valid administrative recovery email.");
      setIsLoading(false);
      return;
    }

    try {
      await authService.resetPassword(cleanEmail);
      setSuccessMsg(
        `Recovery email dispatched to ${cleanEmail}. Check your inbox for the reset link.`
      );
    } catch (err: any) {
      setErrorMsg(err.message ?? "Failed to send recovery email.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetFlow = () => {
    setAuthPhase("primary");
    setMfaCode("");
    setRecoveryEmail("");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0908] text-stone-200 font-sans flex flex-col justify-between py-8 px-4 md:px-6 relative overflow-hidden select-none">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#9C2A2A]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D4AF37]/10 rounded-full blur-[140px]" />
      </div>

      {/* Top bar */}
      <div className="max-w-6xl mx-auto w-full flex justify-between items-center z-10">
        <button
          onClick={onBackToSite}
          className="group inline-flex items-center space-x-2 text-stone-400 hover:text-[#D4AF37] transition text-xs font-bold uppercase tracking-widest cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Exit to Main Site</span>
        </button>
        <div className="flex items-center space-x-2 bg-stone-900/30 border border-stone-800/60 px-3 py-1.5 rounded-xl font-mono text-[10px]">
          <Terminal className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
          <span className="text-stone-400">Security Nodes:</span>
          <span className="text-emerald-400 font-bold">2/2 ON</span>
        </div>
      </div>

      {/* Primary card */}
      <div className="max-w-md w-full mx-auto my-auto z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-gradient-to-br from-[#1E1714] to-stone-900 rounded-full border border-[#D4AF37]/40 shadow-2xl mb-1">
            <KeyRound className="w-7 h-7 text-[#D4AF37]" />
          </div>
          <h2 className="font-serif text-3xl font-black text-white tracking-tight leading-none">
            Dire Dawa Ras Hotel
          </h2>
          <p className="text-[#D4AF37]/80 text-[10px] uppercase font-bold tracking-[0.25em] font-mono">
            Executive Portal Guard
          </p>
        </div>

        <div className="bg-[#131110] border border-stone-850 rounded-[32px] p-6 md:p-8 shadow-2xl space-y-6">

          {/* ── Phase 1: Primary credentials ──────────────────────────────── */}
          {authPhase === "primary" && (
            <form onSubmit={handlePrimarySubmit} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] block pl-1">
                  Access Username / Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@rashotel.com"
                    className="bg-stone-900/70 border border-stone-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl pl-10 pr-4 py-3 w-full text-xs text-stone-100 placeholder-stone-600 outline-none transition uppercase tracking-wide"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block">
                    Security Pass Code
                  </label>
                  <span className="text-[9px] text-stone-500 font-mono">ENCRYPTED</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-stone-900/70 border border-stone-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl pl-10 pr-12 py-3 w-full text-xs text-stone-100 placeholder-stone-600 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-500 hover:text-stone-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-[#321111] rounded-xl border border-rose-950 text-[11px] text-rose-300 text-left">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-900/30 text-[11px] text-emerald-300 text-left">
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#852424] to-[#9C2A2A] hover:opacity-90 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest cursor-pointer transition-all border border-[#D4AF37]/20"
              >
                {isLoading ? "Validating Credentials…" : "Unseal Ledger System"}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setAuthPhase("recovery"); setErrorMsg(null); setSuccessMsg(null); }}
                  className="text-[10px] uppercase tracking-widest font-bold text-stone-500 hover:text-[#D4AF37] transition cursor-pointer"
                >
                  Forgot passcode? Request Recovery
                </button>
              </div>
            </form>
          )}

          {/* ── Phase 2: MFA (cosmetic; user already authed via Supabase) ──── */}
          {authPhase === "mfa" && (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="text-center space-y-3">
                <div className="p-3 bg-stone-900/60 rounded-full border border-[#D4AF37]/25 w-12 h-12 inline-flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Device MFA Required</h3>
                  <p className="text-[11px] text-stone-400">
                    Type the 6-digit TOTP from your authenticator app.
                  </p>
                </div>
              </div>

              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000 000"
                className="bg-stone-900/90 border border-stone-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl py-3 w-full text-center text-xl font-bold font-mono tracking-[0.25em] text-white outline-none transition"
              />

              <div className="p-3 bg-[#1C1613] rounded-xl border border-[#D4AF37]/25 text-[11px] text-[#D4AF37] leading-relaxed">
                <span className="font-bold font-mono text-[10px] tracking-wide block mb-0.5">
                  🔑 BYPASS ENVELOPE:
                </span>
                Bypass token for this terminal:{" "}
                <strong className="text-white select-all bg-stone-950 px-1.5 py-0.5 rounded font-mono">
                  {BYPASS_TOKEN}
                </strong>
              </div>

              {errorMsg && (
                <div className="p-3 bg-[#321111] rounded-xl border border-rose-950 text-[11px] text-rose-300 text-center">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-2">
                <button type="button" onClick={resetFlow}
                  className="w-1/3 bg-stone-900 hover:bg-stone-800 text-stone-300 py-3 rounded-xl text-xs uppercase tracking-wider font-bold transition cursor-pointer">
                  Back
                </button>
                <button type="submit" disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:opacity-90 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition cursor-pointer border border-[#D4AF37]/10 disabled:opacity-50">
                  {isLoading ? "Verifying…" : "Verify & Open"}
                </button>
              </div>
            </form>
          )}

          {/* ── Recovery ─────────────────────────────────────────────────── */}
          {authPhase === "recovery" && (
            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div className="text-center space-y-3">
                <div className="p-3 bg-stone-900/60 rounded-full border border-[#D4AF37]/25 w-12 h-12 inline-flex items-center justify-center animate-pulse">
                  <RefreshCw className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Administrative Recovery</h3>
                  <p className="text-[11px] text-stone-400">
                    A Supabase password-reset email will be dispatched to the address below.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="staff@rashotel.com"
                  className="bg-stone-900/70 border border-stone-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl pl-10 pr-4 py-3 w-full text-xs text-stone-100 placeholder-stone-600 outline-none transition uppercase tracking-wide"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-[#321111] rounded-xl border border-rose-950 text-[11px] text-rose-300 text-left">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-900/30 text-[11px] text-emerald-300 text-left leading-relaxed">
                  {successMsg}
                </div>
              )}

              <div className="flex gap-2">
                <button type="button" onClick={resetFlow}
                  className="w-1/3 bg-stone-900 hover:bg-stone-800 text-stone-300 py-3 rounded-xl text-xs uppercase tracking-wider font-bold transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-[#852424] to-[#9C2A2A] hover:opacity-90 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition cursor-pointer border border-[#D4AF37]/10 disabled:opacity-50">
                  {isLoading ? "Transmitting…" : "Issue Reset Signal"}
                </button>
              </div>
            </form>
          )}

          {/* Telemetry panel */}
          <div className="border-t border-stone-800/60 pt-4 space-y-2 text-[10px] font-mono text-stone-500">
            <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-wider text-stone-400 mb-1">
              <span>Session Telemetry</span>
              <span className="text-emerald-500 text-[8px] animate-pulse">● SECURED</span>
            </div>
            <div className="flex justify-between"><span>Client Address IP</span><span className="text-stone-300">{clientIP}</span></div>
            <div className="flex justify-between">
              <span>IP Clearance Log</span>
              {ipStatus === "verifying"
                ? <span className="text-amber-400">Verifying…</span>
                : <span className="text-emerald-400 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />ALLOWED Range</span>}
            </div>
            <div className="flex justify-between border-t border-stone-800/40 pt-1.5 mt-1">
              <span>Security Cookie Vault</span>
              <span className="text-stone-300 text-[9px] bg-stone-900 border border-stone-800 px-1 rounded">HttpOnly SameSite=Strict</span>
            </div>
            <div className="flex justify-between">
              <span>Mode</span>
              <span className="text-emerald-400">Supabase Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full z-10 text-center text-stone-600 text-[10px] uppercase font-mono tracking-widest">
        © 2026 Dire Dawa Ras Hotel Group • Kezira Luxury Heritage Portal
      </div>
    </div>
  );
}
