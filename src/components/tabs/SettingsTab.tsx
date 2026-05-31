import React, { useState, useEffect } from "react";
import { Settings, Save, RefreshCw } from "lucide-react";
import { settingsService } from "../../services/supabaseService";
import type { Settings as SettingsType, Notification } from "../../types";

interface Props { showNotice: (text: string, type?: Notification["type"]) => void; }

export default function SettingsTab({ showNotice }: Props) {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [form, setForm] = useState({ min_booking_length: 1, max_booking_length: 60, breakfast_price: 450 });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [dirty, setDirty]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const s = await settingsService.get();
      setSettings(s);
      setForm({
        min_booking_length: s.min_booking_length,
        max_booking_length: s.max_booking_length,
        breakfast_price:    s.breakfast_price,
      });
      setDirty(false);
    } catch (err: any) {
      showNotice(err.message ?? "Failed to load settings.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const field = (key: keyof typeof form, val: number) => {
    setForm((f) => ({ ...f, [key]: val }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (form.min_booking_length < 1) return showNotice("Minimum booking length must be ≥ 1.", "error");
    if (form.max_booking_length < form.min_booking_length)
      return showNotice("Maximum must be greater than minimum.", "error");
    if (form.breakfast_price < 0) return showNotice("Breakfast price cannot be negative.", "error");

    setSaving(true);
    try {
      const updated = await settingsService.update(form);
      setSettings(updated);
      setDirty(false);
      showNotice("Settings saved successfully.");
    } catch (err: any) {
      showNotice(err.message ?? "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!settings) return;
    setForm({
      min_booking_length: settings.min_booking_length,
      max_booking_length: settings.max_booking_length,
      breakfast_price:    settings.breakfast_price,
    });
    setDirty(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-black text-white">Settings</h1>
          <p className="text-stone-500 text-xs mt-0.5">Loading…</p>
        </div>
        <div className="bg-[#131110] border border-stone-800/60 rounded-2xl p-8 animate-pulse h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-black text-white">Settings</h1>
          <p className="text-stone-500 text-xs mt-0.5">
            Global hotel configuration · row id=1 in <code className="bg-stone-900 px-1 rounded text-[10px]">settings</code>
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-[#D4AF37] transition cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Form card */}
      <div className="bg-[#131110] border border-stone-800/60 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-800/60 flex items-center gap-3">
          <div className="p-2 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/20">
            <Settings className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Booking Rules</h2>
            <p className="text-[10px] text-stone-500">Enforced on the booking form.</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Min booking length */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-stone-200 block mb-1">Minimum Booking Length</label>
              <p className="text-[11px] text-stone-500">The shortest stay a guest can book (in nights).</p>
            </div>
            <div>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  value={form.min_booking_length}
                  onChange={(e) => field("min_booking_length", Number(e.target.value))}
                  className="w-full bg-stone-900/80 border border-stone-800 focus:border-[#D4AF37]/60 focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-sm font-bold text-white text-right outline-none transition pr-16"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-500 text-xs pointer-events-none">nights</span>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-800/40" />

          {/* Max booking length */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-stone-200 block mb-1">Maximum Booking Length</label>
              <p className="text-[11px] text-stone-500">The longest stay a guest can book (in nights).</p>
            </div>
            <div>
              <div className="relative">
                <input
                  type="number"
                  min={form.min_booking_length}
                  value={form.max_booking_length}
                  onChange={(e) => field("max_booking_length", Number(e.target.value))}
                  className="w-full bg-stone-900/80 border border-stone-800 focus:border-[#D4AF37]/60 focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-sm font-bold text-white text-right outline-none transition pr-16"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-500 text-xs pointer-events-none">nights</span>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-800/40" />

          {/* Breakfast price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-stone-200 block mb-1">Breakfast Price</label>
              <p className="text-[11px] text-stone-500">Price per person per breakfast served on-site.</p>
            </div>
            <div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-stone-500 text-xs pointer-events-none">ETB</span>
                <input
                  type="number"
                  min={0}
                  value={form.breakfast_price}
                  onChange={(e) => field("breakfast_price", Number(e.target.value))}
                  className="w-full bg-stone-900/80 border border-stone-800 focus:border-[#D4AF37]/60 focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-sm font-bold text-white text-right outline-none transition pl-12"
                />
              </div>
            </div>
          </div>

          {/* Current values preview */}
          {settings && (
            <div className="bg-stone-900/50 rounded-xl p-4 text-[11px] font-mono space-y-1.5 border border-stone-800/40">
              <p className="text-stone-500 text-[10px] uppercase font-bold tracking-wider mb-2">Saved in Supabase</p>
              <div className="flex justify-between"><span className="text-stone-400">min_booking_length</span><span className="text-stone-200">{settings.min_booking_length} nights</span></div>
              <div className="flex justify-between"><span className="text-stone-400">max_booking_length</span><span className="text-stone-200">{settings.max_booking_length} nights</span></div>
              <div className="flex justify-between"><span className="text-stone-400">breakfast_price</span><span className="text-stone-200">ETB {settings.breakfast_price.toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-stone-800/40 pt-1.5 mt-1">
                <span className="text-stone-400">updated_at</span>
                <span className="text-stone-500">{new Date(settings.updated_at).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleReset}
              disabled={!dirty}
              className="flex-1 py-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-stone-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#9C2A2A] to-[#852424] text-[#D4AF37] border border-[#D4AF37]/20 text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* Environment info card */}
      <div className="bg-[#131110] border border-stone-800/60 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Environment</h3>
        {[
          ["VITE_SUPABASE_URL",      import.meta.env.VITE_SUPABASE_URL ?? "Not set"],
          ["VITE_SUPABASE_ANON_KEY", import.meta.env.VITE_SUPABASE_ANON_KEY
            ? `${(import.meta.env.VITE_SUPABASE_ANON_KEY as string).slice(0, 24)}…`
            : "Not set"],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-wrap justify-between gap-2 text-[11px] font-mono">
            <span className="text-stone-500">{k}</span>
            <span className="text-stone-300 break-all">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
