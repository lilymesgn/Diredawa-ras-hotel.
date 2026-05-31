import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import { TrendingUp, CalendarCheck, BedDouble, DollarSign, RefreshCw } from "lucide-react";
import { dashboardService } from "../../services/supabaseService";
import { DashboardData, Notification } from "../../types";

const PERIODS = [
  { label: "7 days",  value: 7  },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

interface Props { showNotice: (text: string, type?: Notification["type"]) => void; }

function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-[#131110] border border-stone-800/60 rounded-2xl p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-[10px] uppercase font-bold tracking-widest text-stone-500 mb-1">{label}</p>
        <p className="text-2xl font-serif font-black text-white">{value}</p>
        {sub && <p className="text-[11px] text-stone-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1714] border border-stone-700/60 rounded-xl px-4 py-3 text-xs shadow-2xl">
      <p className="text-stone-400 mb-2 font-mono">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {p.name}: {p.name.includes("ETB") ? `ETB ${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function OverviewTab({ showNotice }: Props) {
  const [period, setPeriod]   = useState(30);
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const d = await dashboardService.getData(period);
      setData(d);
    } catch (err: any) {
      showNotice(err.message ?? "Failed to load dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-black text-white">KPI Overview</h1>
          <p className="text-stone-500 text-xs mt-0.5">Live Supabase data · last {period} days</p>
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer transition ${
                period === p.value
                  ? "bg-[#9C2A2A] text-[#D4AF37] border border-[#D4AF37]/30"
                  : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-[#D4AF37] transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#131110] border border-stone-800/60 rounded-2xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-[#D4AF37]" />}
            label="Total Sales"
            value={`ETB ${data.totalSales.toLocaleString()}`}
            sub={`Last ${period} days`}
            color="bg-[#D4AF37]/10 border border-[#D4AF37]/20"
          />
          <StatCard
            icon={<CalendarCheck className="w-5 h-5 text-emerald-400" />}
            label="Bookings"
            value={String(data.totalBookings)}
            sub={`Last ${period} days`}
            color="bg-emerald-900/20 border border-emerald-800/30"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-sky-400" />}
            label="Check-ins Today"
            value={String(data.checkInsToday)}
            sub="Arriving today"
            color="bg-sky-900/20 border border-sky-800/30"
          />
          <StatCard
            icon={<BedDouble className="w-5 h-5 text-violet-400" />}
            label="Occupancy"
            value={`${data.occupancyRate}%`}
            sub="Currently checked-in"
            color="bg-violet-900/20 border border-violet-800/30"
          />
        </div>
      ) : null}

      {/* Sales area chart */}
      <div className="bg-[#131110] border border-stone-800/60 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-white">Daily Revenue</h2>
            <p className="text-[10px] text-stone-500 font-mono mt-0.5">ETB · Last {period} days</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#D4AF37]" />
            <span className="text-[10px] text-stone-400">Sales (ETB)</span>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data?.chartData ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#D4AF37" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#57534e"
                tick={{ fontSize: 9, fill: "#78716c" }}
                axisLine={false}
                tickLine={false}
                interval={period === 7 ? 0 : Math.floor(period / 7)}
              />
              <YAxis
                stroke="#57534e"
                tick={{ fontSize: 9, fill: "#78716c" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="sales"
                name="Sales ETB"
                stroke="#D4AF37"
                strokeWidth={2}
                fill="url(#salesGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#D4AF37", stroke: "#0A0908", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bookings bar chart */}
      <div className="bg-[#131110] border border-stone-800/60 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-white">Daily Bookings</h2>
            <p className="text-[10px] text-stone-500 font-mono mt-0.5">Count · Last {period} days</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-[#9C2A2A]" />
            <span className="text-[10px] text-stone-400">Bookings</span>
          </div>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#9C2A2A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data?.chartData ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#57534e"
                tick={{ fontSize: 9, fill: "#78716c" }}
                axisLine={false}
                tickLine={false}
                interval={period === 7 ? 0 : Math.floor(period / 7)}
              />
              <YAxis
                stroke="#57534e"
                tick={{ fontSize: 9, fill: "#78716c" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="bookings" name="Bookings" fill="#9C2A2A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Empty state hint when no data */}
      {!loading && data && data.totalBookings === 0 && (
        <div className="bg-[#131110] border border-stone-800/60 rounded-2xl p-8 text-center">
          <CalendarCheck className="w-10 h-10 text-stone-700 mx-auto mb-3" />
          <p className="text-stone-400 text-sm font-medium">No bookings in the last {period} days</p>
          <p className="text-stone-600 text-xs mt-1">Add cabins and bookings to see data here.</p>
        </div>
      )}
    </div>
  );
}
