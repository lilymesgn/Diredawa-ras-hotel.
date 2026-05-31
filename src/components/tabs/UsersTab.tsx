import React, { useState, useEffect } from "react";
import { Users, UserPlus, Trash2, RefreshCw, X, Mail } from "lucide-react";
import { userService } from "../../services/supabaseService";
import { AdminProfile, Notification } from "../../types";

interface Props { showNotice: (text: string, type?: Notification["type"]) => void; }

function timeAgo(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const ROLE_BADGE: Record<string, string> = {
  admin:  "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30",
  staff:  "bg-sky-900/20 text-sky-300 border border-sky-800/30",
  viewer: "bg-stone-800/60 text-stone-400 border border-stone-700/40",
};

export default function UsersTab({ showNotice }: Props) {
  const [users, setUsers]           = useState<AdminProfile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setUsers(await userService.getAll());
    } catch (err: any) {
      showNotice(err.message ?? "Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return showNotice("Please enter a valid email.", "error");

    setInviting(true);
    try {
      await userService.invite(email);
      showNotice(`Invitation sent to ${email}. They will receive a confirmation email.`);
      setInviteEmail("");
      setInviteOpen(false);
      // Reload after a short delay (Supabase trigger may not have fired yet)
      setTimeout(load, 1500);
    } catch (err: any) {
      showNotice(err.message ?? "Invite failed.", "error");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await userService.remove(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showNotice("Profile removed. The auth account may still exist (requires service-role key to fully delete).", "info");
    } catch (err: any) {
      showNotice(err.message ?? "Remove failed.", "error");
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-black text-white">Staff Users</h1>
          <p className="text-stone-500 text-xs mt-0.5">{users.length} profile{users.length !== 1 ? "s" : ""} in admin_profiles</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-[#D4AF37] transition cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#9C2A2A] to-[#852424] text-[#D4AF37] border border-[#D4AF37]/20 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-90 transition"
          >
            <UserPlus className="w-4 h-4" /> Invite User
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-[#1C1613] border border-[#D4AF37]/20 rounded-2xl px-5 py-3.5 text-[11px] text-[#D4AF37]/80 leading-relaxed">
        <strong>Note:</strong> This table reads from <code className="bg-stone-900 px-1 rounded">admin_profiles</code>.
        A database trigger auto-creates a row whenever a new auth user signs up.
        Full user deletion (from <code className="bg-stone-900 px-1 rounded">auth.users</code>) requires the Supabase service-role key and must be done in the Supabase dashboard.
      </div>

      {/* User table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-[#131110] border border-stone-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-[#131110] border border-stone-800/60 rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-stone-700 mx-auto mb-4" />
          <p className="text-stone-400 font-medium">No profiles yet</p>
          <p className="text-stone-600 text-xs mt-1">Invite a staff member to get started.</p>
        </div>
      ) : (
        <div className="bg-[#131110] border border-stone-800/60 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-stone-800/60">
                  <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-widest text-stone-500 font-bold">User</th>
                  <th className="text-left px-4 py-3.5 text-[10px] uppercase tracking-widest text-stone-500 font-bold hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-3.5 text-[10px] uppercase tracking-widest text-stone-500 font-bold hidden lg:table-cell">Joined</th>
                  <th className="text-left px-4 py-3.5 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Last Seen</th>
                  <th className="text-right px-5 py-3.5 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/40">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-900/30 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9C2A2A] to-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold font-serif text-sm shrink-0">
                          {u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white font-mono">{u.email}</p>
                          <p className="text-stone-600 text-[10px] mt-0.5 font-mono">{u.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${ROLE_BADGE[u.role] ?? ROLE_BADGE.viewer}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-stone-400 hidden lg:table-cell font-mono">
                      {fmtDate(u.created_at)}
                    </td>
                    <td className="px-4 py-4 text-stone-400 font-mono">
                      {timeAgo(u.last_seen)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {deleteConfirm === u.id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => handleRemove(u.id)} className="px-2 py-1.5 rounded-lg bg-rose-900/60 border border-rose-800 text-rose-300 text-[10px] font-bold cursor-pointer">Confirm</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 text-[10px] font-bold cursor-pointer">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(u.id)}
                          className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-rose-400 hover:border-rose-800/40 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setInviteOpen(false)}>
          <div className="bg-[#131110] border border-stone-800/60 rounded-[28px] w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-800/60">
              <h2 className="font-serif text-lg font-black text-white">Invite Staff Member</h2>
              <button onClick={() => setInviteOpen(false)} className="p-1.5 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-stone-900 cursor-pointer transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-[11px] text-stone-400 leading-relaxed">
                A Supabase auth user will be created and a confirmation email dispatched. The invitee clicks the link to set their password and log in.
              </p>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] block mb-2">Staff Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    placeholder="staff@rashotel.com"
                    className="w-full bg-stone-900/70 border border-stone-800 focus:border-[#D4AF37]/60 focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xl pl-10 pr-4 py-3 text-xs text-stone-100 placeholder-stone-600 outline-none transition"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setInviteOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-stone-800 transition">
                  Cancel
                </button>
                <button onClick={handleInvite} disabled={inviting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#9C2A2A] to-[#852424] text-[#D4AF37] border border-[#D4AF37]/20 text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-90 transition disabled:opacity-50">
                  {inviting ? "Sending…" : "Send Invite"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
