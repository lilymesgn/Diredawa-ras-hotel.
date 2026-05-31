import React, { useState, useEffect } from "react";
import { CalendarCheck, Trash2, LogIn, LogOut, Eye, X, RefreshCw } from "lucide-react";
import { bookingService } from "../../services/supabaseService";
import { Booking, BookingStatus, Notification } from "../../types";

interface Props { showNotice: (text: string, type?: Notification["type"]) => void; }

const STATUS_FILTERS = [
  { value: "all",          label: "All Reservations" },
  { value: "unconfirmed",  label: "Unconfirmed"      },
  { value: "checked-in",   label: "Checked In"       },
  { value: "checked-out",  label: "Checked Out"      },
];

const STATUS_BADGE: Record<BookingStatus, string> = {
  "unconfirmed":  "bg-amber-950/50 text-amber-300 border border-amber-800/40",
  "checked-in":   "bg-emerald-950/50 text-emerald-300 border border-emerald-800/40",
  "checked-out":  "bg-stone-800/60 text-stone-400 border border-stone-700/40",
};

function nights(start: string, end: string) {
  return Math.max(1, Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000
  ));
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function BookingsTab({ showNotice }: Props) {
  const [bookings, setBookings]     = useState<Booking[]>([]);
  const [filter, setFilter]         = useState("all");
  const [loading, setLoading]       = useState(true);
  const [actionId, setActionId]     = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  const load = async (status = filter) => {
    setLoading(true);
    try {
      setBookings(await bookingService.getAll(status));
    } catch (err: any) {
      showNotice(err.message ?? "Failed to load bookings.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(filter); }, [filter]);

  const changeStatus = async (id: string, newStatus: BookingStatus) => {
    setActionId(id);
    try {
      await bookingService.updateStatus(id, newStatus);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
      showNotice(`Booking ${newStatus === "checked-in" ? "checked in" : "checked out"}.`);
    } catch (err: any) {
      showNotice(err.message ?? "Status update failed.", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await bookingService.delete(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      showNotice("Booking deleted.");
    } catch (err: any) {
      showNotice(err.message ?? "Delete failed.", "error");
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-black text-white">Reservations</h1>
          <p className="text-stone-500 text-xs mt-0.5">{bookings.length} booking{bookings.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => load(filter)} className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-[#D4AF37] transition cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition ${
              filter === f.value
                ? "bg-[#9C2A2A] text-[#D4AF37] border border-[#D4AF37]/30"
                : "bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-[#131110] border border-stone-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-[#131110] border border-stone-800/60 rounded-2xl p-12 text-center">
          <CalendarCheck className="w-12 h-12 text-stone-700 mx-auto mb-4" />
          <p className="text-stone-400 font-medium">No bookings found</p>
          <p className="text-stone-600 text-xs mt-1">
            {filter === "all" ? "Bookings will appear here once guests reserve." : `No ${filter} bookings.`}
          </p>
        </div>
      ) : (
        <div className="bg-[#131110] border border-stone-800/60 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-stone-800/60">
                  <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Guest</th>
                  <th className="text-left px-4 py-3.5 text-[10px] uppercase tracking-widest text-stone-500 font-bold hidden md:table-cell">Cabin</th>
                  <th className="text-left px-4 py-3.5 text-[10px] uppercase tracking-widest text-stone-500 font-bold hidden lg:table-cell">Dates</th>
                  <th className="text-left px-4 py-3.5 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Total</th>
                  <th className="text-left px-4 py-3.5 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Status</th>
                  <th className="text-right px-5 py-3.5 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/40">
                {bookings.map((b) => {
                  const n = nights(b.start_date, b.end_date);
                  return (
                    <tr key={b.id} className="hover:bg-stone-900/30 transition">
                      <td className="px-5 py-4">
                        <p className="font-bold text-white">{b.guest_name}</p>
                        <p className="text-stone-500 text-[10px] mt-0.5">{b.guest_email}</p>
                      </td>
                      <td className="px-4 py-4 text-stone-300 hidden md:table-cell">
                        {b.cabins?.name ?? <span className="text-stone-600 italic">—</span>}
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <p className="text-stone-300">{fmt(b.start_date)} → {fmt(b.end_date)}</p>
                        <p className="text-stone-500 text-[10px]">{n} night{n !== 1 ? "s" : ""}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[#D4AF37] font-bold font-mono">
                          ETB {b.total_price.toLocaleString()}
                        </span>
                        {b.has_breakfast && (
                          <p className="text-[10px] text-stone-500 mt-0.5">incl. breakfast</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[b.status]}`}>
                          {b.status}
                        </span>
                        {b.is_paid && (
                          <p className="text-[10px] text-emerald-500 mt-0.5">paid</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center gap-1.5 justify-end flex-wrap">
                          {/* Detail */}
                          <button
                            onClick={() => setDetailBooking(b)}
                            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Check-in */}
                          {b.status === "unconfirmed" && (
                            <button
                              onClick={() => changeStatus(b.id, "checked-in")}
                              disabled={actionId === b.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-900/40 border border-emerald-800/40 text-emerald-300 text-[10px] font-bold cursor-pointer hover:bg-emerald-900/60 transition disabled:opacity-50"
                              title="Check in"
                            >
                              <LogIn className="w-3 h-3" />
                              <span className="hidden sm:inline">Check In</span>
                            </button>
                          )}

                          {/* Check-out */}
                          {b.status === "checked-in" && (
                            <button
                              onClick={() => changeStatus(b.id, "checked-out")}
                              disabled={actionId === b.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-900/40 border border-sky-800/40 text-sky-300 text-[10px] font-bold cursor-pointer hover:bg-sky-900/60 transition disabled:opacity-50"
                              title="Check out"
                            >
                              <LogOut className="w-3 h-3" />
                              <span className="hidden sm:inline">Check Out</span>
                            </button>
                          )}

                          {/* Delete */}
                          {deleteConfirm === b.id ? (
                            <>
                              <button onClick={() => handleDelete(b.id)} className="px-2 py-1.5 rounded-lg bg-rose-900/60 border border-rose-800 text-rose-300 text-[10px] font-bold cursor-pointer">Confirm</button>
                              <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 text-[10px] font-bold cursor-pointer">Cancel</button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(b.id)}
                              className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-rose-400 hover:border-rose-800/40 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetailBooking(null)}>
          <div className="bg-[#131110] border border-stone-800/60 rounded-[28px] w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-800/60">
              <h2 className="font-serif text-lg font-black text-white">Booking Detail</h2>
              <button onClick={() => setDetailBooking(null)} className="p-1.5 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-stone-900 cursor-pointer transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              {[
                ["Guest Name",      detailBooking.guest_name],
                ["Guest Email",     detailBooking.guest_email],
                ["Cabin",           detailBooking.cabins?.name ?? "—"],
                ["Check-in",        fmt(detailBooking.start_date)],
                ["Check-out",       fmt(detailBooking.end_date)],
                ["Nights",          String(nights(detailBooking.start_date, detailBooking.end_date))],
                ["Total Price",     `ETB ${detailBooking.total_price.toLocaleString()}`],
                ["Breakfast",       detailBooking.has_breakfast ? "Yes" : "No"],
                ["Paid",            detailBooking.is_paid ? "Yes" : "No"],
                ["Status",          detailBooking.status],
                ["Booking ID",      detailBooking.id],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-start gap-4">
                  <span className="text-stone-500 uppercase font-bold tracking-widest text-[10px] shrink-0">{label}</span>
                  <span className={`text-right font-mono text-stone-200 ${label === "Status" ? `px-2 py-0.5 rounded ${STATUS_BADGE[detailBooking.status as BookingStatus]}` : ""}`}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
