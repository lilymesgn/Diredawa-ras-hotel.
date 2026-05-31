import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit3, Upload, BedDouble, X, ImageIcon } from "lucide-react";
import { cabinService } from "../../services/supabaseService";
import { Cabin, CabinInsert, Notification } from "../../types";

interface Props { showNotice: (text: string, type?: Notification["type"]) => void; }

const EMPTY_FORM: CabinInsert = {
  name: "", max_capacity: 2, regular_price: 3000,
  discount: 0, description: "", image: "",
};

export default function CabinsTab({ showNotice }: Props) {
  const [cabins, setCabins]     = useState<Cabin[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  const [modalOpen, setModalOpen]     = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState<CabinInsert>(EMPTY_FORM);
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      setCabins(await cabinService.getAll());
    } catch (err: any) {
      showNotice(err.message ?? "Failed to load cabins.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  };

  const openEdit = (c: Cabin) => {
    setEditingId(c.id);
    setForm({
      name: c.name, max_capacity: c.max_capacity,
      regular_price: c.regular_price, discount: c.discount,
      description: c.description, image: c.image,
    });
    setImageFile(null);
    setImagePreview(c.image);
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return showNotice("Cabin name is required.", "error");
    if (form.regular_price <= 0) return showNotice("Price must be greater than 0.", "error");

    setSaving(true);
    try {
      let imageUrl = form.image;

      // Upload new image to Supabase Storage if a file was selected
      if (imageFile) {
        imageUrl = await cabinService.uploadImage(imageFile);
      }

      const payload: CabinInsert = { ...form, image: imageUrl };

      if (editingId) {
        const updated = await cabinService.update(editingId, payload);
        setCabins((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
        showNotice(`Cabin "${updated.name}" updated.`);
      } else {
        const created = await cabinService.create(payload);
        setCabins((prev) => [created, ...prev]);
        showNotice(`Cabin "${created.name}" created.`);
      }
      setModalOpen(false);
    } catch (err: any) {
      showNotice(err.message ?? "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await cabinService.delete(id);
      setCabins((prev) => prev.filter((c) => c.id !== id));
      showNotice("Cabin deleted.");
    } catch (err: any) {
      showNotice(err.message ?? "Delete failed.", "error");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const field = (key: keyof CabinInsert, val: string | number) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-black text-white">Cabins</h1>
          <p className="text-stone-500 text-xs mt-0.5">{cabins.length} cabin{cabins.length !== 1 ? "s" : ""} · images stored in Supabase</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#9C2A2A] to-[#852424] text-[#D4AF37] border border-[#D4AF37]/20 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Add Cabin
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-[#131110] border border-stone-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : cabins.length === 0 ? (
        <div className="bg-[#131110] border border-stone-800/60 rounded-2xl p-12 text-center">
          <BedDouble className="w-12 h-12 text-stone-700 mx-auto mb-4" />
          <p className="text-stone-400 font-medium">No cabins yet</p>
          <p className="text-stone-600 text-xs mt-1">Add your first cabin to get started.</p>
          <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 text-[#D4AF37] text-xs font-bold uppercase tracking-widest hover:underline cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Add Cabin
          </button>
        </div>
      ) : (
        <div className="bg-[#131110] border border-stone-800/60 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-stone-800/60">
                  <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Cabin</th>
                  <th className="text-left px-4 py-3.5 text-[10px] uppercase tracking-widest text-stone-500 font-bold hidden md:table-cell">Capacity</th>
                  <th className="text-left px-4 py-3.5 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Price / Night</th>
                  <th className="text-left px-4 py-3.5 text-[10px] uppercase tracking-widest text-stone-500 font-bold hidden lg:table-cell">Discount</th>
                  <th className="text-right px-5 py-3.5 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/40">
                {cabins.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-900/30 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {c.image ? (
                          <img src={c.image} alt={c.name} className="w-12 h-10 object-cover rounded-lg shrink-0 border border-stone-800" />
                        ) : (
                          <div className="w-12 h-10 bg-stone-900 rounded-lg flex items-center justify-center shrink-0 border border-stone-800">
                            <ImageIcon className="w-4 h-4 text-stone-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-white">{c.name}</p>
                          <p className="text-stone-500 text-[10px] mt-0.5 line-clamp-1 hidden sm:block">{c.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-stone-300 hidden md:table-cell">
                      {c.max_capacity} guest{c.max_capacity !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[#D4AF37] font-bold font-mono">
                        ETB {c.regular_price.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      {c.discount > 0 ? (
                        <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-md font-mono font-bold">
                          -{c.discount.toLocaleString()} ETB
                        </span>
                      ) : (
                        <span className="text-stone-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirm === c.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(c.id)} className="px-2 py-1.5 rounded-lg bg-rose-900/60 border border-rose-800 text-rose-300 text-[10px] font-bold cursor-pointer hover:bg-rose-900">Confirm</button>
                            <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 text-[10px] font-bold cursor-pointer">Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(c.id)}
                            className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-rose-400 hover:border-rose-800/40 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-[#131110] border border-stone-800/60 rounded-[28px] w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-800/60">
              <h2 className="font-serif text-lg font-black text-white">
                {editingId ? "Edit Cabin" : "New Cabin"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-stone-900 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Image upload */}
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] block mb-2">Cabin Image</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative h-40 bg-stone-900 border-2 border-dashed border-stone-700 hover:border-[#D4AF37]/50 rounded-2xl cursor-pointer overflow-hidden transition group"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-stone-500 group-hover:text-stone-300 transition">
                      <Upload className="w-7 h-7" />
                      <p className="text-xs font-bold">Click to upload image</p>
                      <p className="text-[10px]">Uploads to cabin-images bucket</p>
                    </div>
                  )}
                  {imagePreview && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <p className="text-[10px] text-stone-500 mt-1.5 pl-1">Or paste a URL below:</p>
                <input
                  type="url"
                  value={imageFile ? "" : form.image}
                  onChange={(e) => { setImageFile(null); setImagePreview(e.target.value); field("image", e.target.value); }}
                  placeholder="https://…"
                  className="mt-1.5 w-full bg-stone-900/70 border border-stone-800 focus:border-[#D4AF37]/60 focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-600 outline-none transition"
                />
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-2">Cabin Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => field("name", e.target.value)}
                  placeholder="Deluxe Suite"
                  className="w-full bg-stone-900/70 border border-stone-800 focus:border-[#D4AF37]/60 focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-600 outline-none transition"
                />
              </div>

              {/* Capacity + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-2">Max Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={form.max_capacity}
                    onChange={(e) => field("max_capacity", Number(e.target.value))}
                    className="w-full bg-stone-900/70 border border-stone-800 focus:border-[#D4AF37]/60 rounded-xl px-4 py-2.5 text-xs text-stone-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-2">Price / Night (ETB)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.regular_price}
                    onChange={(e) => field("regular_price", Number(e.target.value))}
                    className="w-full bg-stone-900/70 border border-stone-800 focus:border-[#D4AF37]/60 rounded-xl px-4 py-2.5 text-xs text-stone-100 outline-none transition"
                  />
                </div>
              </div>

              {/* Discount */}
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-2">Discount (ETB)</label>
                <input
                  type="number"
                  min={0}
                  value={form.discount}
                  onChange={(e) => field("discount", Number(e.target.value))}
                  className="w-full bg-stone-900/70 border border-stone-800 focus:border-[#D4AF37]/60 rounded-xl px-4 py-2.5 text-xs text-stone-100 outline-none transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-2">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => field("description", e.target.value)}
                  placeholder="Spacious cabin with garden view…"
                  className="w-full bg-stone-900/70 border border-stone-800 focus:border-[#D4AF37]/60 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-600 outline-none transition resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-stone-800 transition">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#9C2A2A] to-[#852424] text-[#D4AF37] border border-[#D4AF37]/20 text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-90 transition disabled:opacity-50">
                  {saving ? "Saving…" : editingId ? "Update Cabin" : "Create Cabin"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
