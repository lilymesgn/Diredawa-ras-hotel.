import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload, Trash2, ChevronUp, ChevronDown, Plus, X,
  ImageIcon, Monitor, Smartphone, Check, Pencil, RefreshCw, GripVertical,
} from "lucide-react";
import { mediaService } from "../../services/supabaseService";
import { GalleryImage, GalleryCategory, GalleryImageInsert, Notification } from "../../types";

// ─── Shared props ─────────────────────────────────────────────────────────────
interface NoticeProps {
  showNotice: (text: string, type?: Notification["type"]) => void;
}

// ─── Section pill tabs ────────────────────────────────────────────────────────
type Section = "hero" | "gallery" | "dining";
const SECTIONS: { id: Section; label: string; description: string }[] = [
  { id: "hero",    label: "Hero Images",     description: "Desktop & mobile banner" },
  { id: "gallery", label: "Gallery & Rooms", description: "Exterior · Rooms"        },
  { id: "dining",  label: "Dining Images",   description: "Restaurant & food"       },
];

// ─── Reusable upload drop-zone ────────────────────────────────────────────────
interface DropZoneProps {
  preview: string;
  label: string;
  hint?: string;
  onFile: (f: File) => void;
  onUrlChange?: (url: string) => void;
  aspectClass?: string;
}
function DropZone({ preview, label, hint, onFile, onUrlChange, aspectClass = "aspect-video" }: DropZoneProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] block">
        {label}
      </label>

      {/* Drop area */}
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative ${aspectClass} bg-stone-900 border-2 rounded-2xl cursor-pointer overflow-hidden transition-all group ${
          dragging
            ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/20"
            : "border-dashed border-stone-700 hover:border-[#D4AF37]/50"
        }`}
      >
        {preview ? (
          <>
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
              <Upload className="w-6 h-6 text-white" />
              <span className="text-white text-xs font-bold">Replace image</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-500 group-hover:text-stone-300 transition">
            <Upload className="w-7 h-7" />
            <p className="text-xs font-bold">Click or drag to upload</p>
            {hint && <p className="text-[10px] text-stone-600">{hint}</p>}
          </div>
        )}
      </div>
      <input
        ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
      />

      {/* URL fallback */}
      {onUrlChange && (
        <input
          type="url"
          placeholder="…or paste image URL"
          defaultValue={preview.startsWith("http") ? preview : ""}
          onChange={(e) => onUrlChange(e.target.value)}
          className="w-full bg-stone-900/70 border border-stone-800 focus:border-[#D4AF37]/60 focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-600 outline-none transition"
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 1 · HERO IMAGES
// ─────────────────────────────────────────────────────────────────────────────
function HeroSection({ showNotice }: NoticeProps) {
  const [desktopUrl, setDesktopUrl]   = useState("");
  const [mobileUrl,  setMobileUrl]    = useState("");
  const [desktopPrev, setDesktopPrev] = useState("");
  const [mobilePrev,  setMobilePrev]  = useState("");
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile,  setMobileFile]  = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [dirty,   setDirty]   = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const s = await mediaService.getHeroUrls();
      setDesktopUrl(s.hero_image_url        ?? "");
      setMobileUrl( s.hero_mobile_image_url ?? "");
      setDesktopPrev(s.hero_image_url        ?? "");
      setMobilePrev( s.hero_mobile_image_url ?? "");
      setDirty(false);
    } catch (err: any) {
      showNotice(err.message ?? "Failed to load hero images.", "error");
    } finally {
      setLoading(false);
    }
  };

  const previewFile = (file: File, side: "desktop" | "mobile") => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const src = reader.result as string;
      if (side === "desktop") { setDesktopFile(file); setDesktopPrev(src); }
      else                    { setMobileFile(file);  setMobilePrev(src);  }
    };
    reader.readAsDataURL(file);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let newDesktop = desktopUrl;
      let newMobile  = mobileUrl;

      if (desktopFile) newDesktop = await mediaService.uploadMedia(desktopFile, "hero-images");
      if (mobileFile)  newMobile  = await mediaService.uploadMedia(mobileFile,  "hero-images");

      await mediaService.updateHeroUrls({
        hero_image_url:        newDesktop,
        hero_mobile_image_url: newMobile,
      });

      setDesktopUrl(newDesktop); setDesktopPrev(newDesktop); setDesktopFile(null);
      setMobileUrl(newMobile);   setMobilePrev(newMobile);   setMobileFile(null);
      setDirty(false);
      showNotice("Hero images saved.");
    } catch (err: any) {
      showNotice(err.message ?? "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="bg-[#131110] border border-stone-800/60 rounded-2xl p-5 h-72 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        {/* Desktop hero */}
        <div className="bg-[#131110] border border-stone-800/60 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-stone-900 border border-stone-800 rounded-lg">
              <Monitor className="w-4 h-4 text-stone-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Desktop Hero</p>
              <p className="text-[10px] text-stone-500 font-mono">settings.hero_image_url</p>
            </div>
          </div>
          <DropZone
            label="Desktop image (16 : 9 recommended)"
            hint="1920×1080 px · JPG / PNG / WebP"
            preview={desktopPrev}
            aspectClass="aspect-video"
            onFile={(f) => previewFile(f, "desktop")}
            onUrlChange={(url) => { setDesktopUrl(url); setDesktopPrev(url); setDirty(true); }}
          />
          {desktopPrev && (
            <p className="text-[10px] text-stone-500 font-mono truncate">{desktopUrl || "(local file)"}</p>
          )}
        </div>

        {/* Mobile hero */}
        <div className="bg-[#131110] border border-stone-800/60 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-stone-900 border border-stone-800 rounded-lg">
              <Smartphone className="w-4 h-4 text-stone-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Mobile Hero</p>
              <p className="text-[10px] text-stone-500 font-mono">settings.hero_mobile_image_url</p>
            </div>
          </div>
          <DropZone
            label="Mobile image (9 : 16 recommended)"
            hint="640×1136 px · JPG / PNG / WebP"
            preview={mobilePrev}
            aspectClass="aspect-[9/16] max-h-72"
            onFile={(f) => previewFile(f, "mobile")}
            onUrlChange={(url) => { setMobileUrl(url); setMobilePrev(url); setDirty(true); }}
          />
          {mobilePrev && (
            <p className="text-[10px] text-stone-500 font-mono truncate">{mobileUrl || "(local file)"}</p>
          )}
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between bg-[#131110] border border-stone-800/60 rounded-2xl px-5 py-4">
        <div>
          <p className="text-xs font-bold text-white">
            {dirty ? "Unsaved changes" : "Images saved"}
          </p>
          <p className="text-[10px] text-stone-500 mt-0.5">
            Uploads go to the <code className="bg-stone-900 px-1 rounded">hero-images</code> bucket.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
            title="Reload from Supabase"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9C2A2A] to-[#852424] text-[#D4AF37] border border-[#D4AF37]/20 text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
            ) : (
              <><Check className="w-3.5 h-3.5" /> Save Hero Images</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ADD IMAGE MODAL
// ─────────────────────────────────────────────────────────────────────────────
interface AddModalProps extends NoticeProps {
  allowedCategories: GalleryCategory[];
  nextOrder: number;
  onAdd: (img: GalleryImage) => void;
  onClose: () => void;
}

function AddImageModal({ allowedCategories, nextOrder, onAdd, onClose, showNotice }: AddModalProps) {
  const [file,     setFile]     = useState<File | null>(null);
  const [preview,  setPreview]  = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [alt,      setAlt]      = useState("");
  const [category, setCategory] = useState<GalleryCategory>(allowedCategories[0]);
  const [saving,   setSaving]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSave = async () => {
    const finalUrl = file ? null : imageUrl.trim();
    if (!file && !finalUrl) return showNotice("Upload a file or paste an image URL.", "error");
    if (!alt.trim()) return showNotice("Alt text is required for accessibility.", "error");

    setSaving(true);
    try {
      let url = finalUrl ?? "";
      if (file) url = await mediaService.uploadMedia(file, "gallery-images");

      const payload: GalleryImageInsert = {
        url, alt: alt.trim(), category, sort_order: nextOrder,
      };
      const created = await mediaService.addGalleryImage(payload);
      onAdd(created);
      showNotice("Image added.");
      onClose();
    } catch (err: any) {
      showNotice(err.message ?? "Failed to add image.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#131110] border border-stone-800/60 rounded-[28px] w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-800/60">
          <h2 className="font-serif text-lg font-black text-white">Add Image</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-stone-900 cursor-pointer transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Image source */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className="relative aspect-video bg-stone-900 border-2 border-dashed border-stone-700 hover:border-[#D4AF37]/50 rounded-2xl cursor-pointer overflow-hidden group transition"
          >
            {preview ? (
              <>
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5 text-white" />
                  <span className="text-white text-xs font-bold">Replace</span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-500 group-hover:text-stone-300 transition">
                <Upload className="w-7 h-7" />
                <p className="text-xs font-bold">Click or drag to upload</p>
                <p className="text-[10px] text-stone-600">gallery-images bucket</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

          {/* URL fallback — only if no file */}
          {!file && (
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-1.5">
                …or paste image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => { setImageUrl(e.target.value); setPreview(e.target.value); }}
                placeholder="https://…"
                className="w-full bg-stone-900/70 border border-stone-800 focus:border-[#D4AF37]/60 focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-600 outline-none transition"
              />
            </div>
          )}

          {/* Alt text */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] block mb-1.5">
              Alt Text <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Exterior view of the hotel terrace"
              className="w-full bg-stone-900/70 border border-stone-800 focus:border-[#D4AF37]/60 focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-600 outline-none transition"
            />
          </div>

          {/* Category */}
          {allowedCategories.length > 1 && (
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-1.5">
                Category
              </label>
              <div className="flex gap-2">
                {allowedCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer transition ${
                      category === cat
                        ? "bg-[#9C2A2A] text-[#D4AF37] border border-[#D4AF37]/30"
                        : "bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-stone-800 transition">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#9C2A2A] to-[#852424] text-[#D4AF37] border border-[#D4AF37]/20 text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-90 transition disabled:opacity-50">
              {saving ? "Uploading…" : "Add Image"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  IMAGE CARD
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_BADGE: Record<GalleryCategory, string> = {
  exterior: "bg-sky-950/60 text-sky-300 border border-sky-800/40",
  rooms:    "bg-violet-950/60 text-violet-300 border border-violet-800/40",
  dining:   "bg-amber-950/60 text-amber-300 border border-amber-800/40",
};

interface ImageCardProps extends NoticeProps {
  image: GalleryImage;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onAltSave: (alt: string) => void;
}

function ImageCard({ image, index, total, onMoveUp, onMoveDown, onDelete, onAltSave, showNotice }: ImageCardProps) {
  const [editingAlt,  setEditingAlt]  = useState(false);
  const [altDraft,    setAltDraft]    = useState(image.alt);
  const [deleteConf,  setDeleteConf]  = useState(false);
  const altRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editingAlt) altRef.current?.focus(); }, [editingAlt]);

  const commitAlt = () => {
    setEditingAlt(false);
    if (altDraft.trim() !== image.alt) onAltSave(altDraft.trim() || image.alt);
  };

  return (
    <div className="group bg-[#131110] border border-stone-800/60 rounded-2xl overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-stone-900 overflow-hidden">
        {image.url ? (
          <img src={image.url} alt={image.alt} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="w-8 h-8 text-stone-700" />
          </div>
        )}

        {/* Category badge */}
        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${CATEGORY_BADGE[image.category]}`}>
          {image.category}
        </span>

        {/* Order indicator */}
        <span className="absolute top-2 right-2 w-5 h-5 rounded-md bg-black/60 text-stone-300 text-[10px] font-mono font-bold flex items-center justify-center">
          {index + 1}
        </span>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
        {/* Alt text */}
        <div className="flex items-center gap-1.5">
          {editingAlt ? (
            <input
              ref={altRef}
              value={altDraft}
              onChange={(e) => setAltDraft(e.target.value)}
              onBlur={commitAlt}
              onKeyDown={(e) => { if (e.key === "Enter") commitAlt(); if (e.key === "Escape") { setAltDraft(image.alt); setEditingAlt(false); }}}
              className="flex-1 bg-stone-900 border border-[#D4AF37]/60 rounded-lg px-2.5 py-1.5 text-[11px] text-stone-100 outline-none"
            />
          ) : (
            <p
              className="flex-1 text-[11px] text-stone-400 truncate cursor-pointer hover:text-stone-200 transition"
              title={image.alt || "Click to add alt text"}
              onClick={() => setEditingAlt(true)}
            >
              {image.alt || <span className="text-stone-600 italic">No alt text</span>}
            </p>
          )}
          <button
            onClick={() => { setAltDraft(image.alt); setEditingAlt((v) => !v); }}
            className="shrink-0 p-1 rounded text-stone-600 hover:text-[#D4AF37] transition cursor-pointer"
            title="Edit alt text"
          >
            {editingAlt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Pencil className="w-3 h-3" />}
          </button>
        </div>

        {/* Reorder + delete */}
        <div className="flex items-center gap-1">
          {/* Up */}
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="flex-1 flex items-center justify-center py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="Move up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          {/* Down */}
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="flex-1 flex items-center justify-center py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="Move down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Delete */}
          {deleteConf ? (
            <div className="flex gap-1">
              <button onClick={onDelete} className="px-2 py-1.5 rounded-lg bg-rose-900/60 border border-rose-800 text-rose-300 text-[10px] font-bold cursor-pointer">Del</button>
              <button onClick={() => setDeleteConf(false)} className="px-2 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 text-[10px] font-bold cursor-pointer">No</button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConf(true)}
              className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-500 hover:text-rose-400 hover:border-rose-800/40 transition cursor-pointer"
              title="Delete image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 2 & 3 · GALLERY SECTION (reused for both gallery and dining)
// ─────────────────────────────────────────────────────────────────────────────
interface GallerySectionProps extends NoticeProps {
  categories: GalleryCategory[];
  sectionLabel: string;
}

function GallerySection({ categories, sectionLabel, showNotice }: GallerySectionProps) {
  const [images,   setImages]   = useState<GalleryImage[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [addOpen,  setAddOpen]  = useState(false);
  const [reordering, setReordering] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mediaService.getGallery(categories);
      setImages(data); // already sorted by sort_order asc from the service
    } catch (err: any) {
      showNotice(err.message ?? "Failed to load images.", "error");
    } finally {
      setLoading(false);
    }
  }, [categories.join(",")]);

  useEffect(() => { load(); }, [load]);

  // ── Move item up or down, persist new sort_order ────────────────────────
  const moveItem = async (index: number, dir: "up" | "down") => {
    const swapIdx = dir === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= images.length) return;

    // Optimistic UI
    const next = [...images];
    [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
    const withOrder = next.map((img, i) => ({ ...img, sort_order: i }));
    setImages(withOrder);

    setReordering(true);
    try {
      await mediaService.reorderGallery(
        withOrder.map(({ id, sort_order }) => ({ id, sort_order }))
      );
    } catch (err: any) {
      showNotice(err.message ?? "Reorder failed.", "error");
      load(); // revert
    } finally {
      setReordering(false);
    }
  };

  const handleAltSave = async (id: string, alt: string) => {
    try {
      await mediaService.updateGalleryImage(id, { alt });
      setImages((prev) => prev.map((img) => (img.id === id ? { ...img, alt } : img)));
    } catch (err: any) {
      showNotice(err.message ?? "Failed to save alt text.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await mediaService.deleteGalleryImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      showNotice("Image deleted.");
    } catch (err: any) {
      showNotice(err.message ?? "Delete failed.", "error");
    }
  };

  const handleAdd = (img: GalleryImage) => {
    setImages((prev) => [...prev, img]);
  };

  // ── Category breakdown ──────────────────────────────────────────────────
  const categoryCount = categories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = images.filter((img) => img.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {categories.map((cat) => (
            <span key={cat} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide ${CATEGORY_BADGE[cat]}`}>
              {cat} · {categoryCount[cat] ?? 0}
            </span>
          ))}
          {reordering && (
            <span className="inline-flex items-center gap-1.5 text-[10px] text-stone-500 font-mono">
              <RefreshCw className="w-3 h-3 animate-spin" /> saving order…
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-[#D4AF37] transition cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#9C2A2A] to-[#852424] text-[#D4AF37] border border-[#D4AF37]/20 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> Add Image
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-[#131110] border border-stone-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="bg-[#131110] border border-stone-800/60 rounded-2xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-stone-700 mx-auto mb-4" />
          <p className="text-stone-400 font-medium">No {sectionLabel.toLowerCase()} yet</p>
          <p className="text-stone-600 text-xs mt-1">Add your first image to get started.</p>
          <button onClick={() => setAddOpen(true)} className="mt-4 inline-flex items-center gap-2 text-[#D4AF37] text-xs font-bold uppercase tracking-widest hover:underline cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Add Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img, i) => (
            <ImageCard
              key={img.id}
              image={img}
              index={i}
              total={images.length}
              showNotice={showNotice}
              onMoveUp={() => moveItem(i, "up")}
              onMoveDown={() => moveItem(i, "down")}
              onDelete={() => handleDelete(img.id)}
              onAltSave={(alt) => handleAltSave(img.id, alt)}
            />
          ))}
        </div>
      )}

      {/* Add modal */}
      {addOpen && (
        <AddImageModal
          allowedCategories={categories}
          nextOrder={images.length}
          onAdd={handleAdd}
          onClose={() => setAddOpen(false)}
          showNotice={showNotice}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ROOT: MediaTab
// ─────────────────────────────────────────────────────────────────────────────
export default function MediaTab({ showNotice }: NoticeProps) {
  const [section, setSection] = useState<Section>("hero");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-2xl font-black text-white">Media Manager</h1>
        <p className="text-stone-500 text-xs mt-0.5">
          Hero images in <code className="bg-stone-900 px-1 rounded">settings</code> · gallery &amp; dining in the{" "}
          <code className="bg-stone-900 px-1 rounded">gallery</code> table
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 bg-[#131110] border border-stone-800/60 rounded-2xl p-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex-1 min-w-[120px] flex flex-col items-center gap-0.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition ${
              section === s.id
                ? "bg-gradient-to-r from-[#9C2A2A]/80 to-[#852424]/60 text-[#D4AF37] border border-[#D4AF37]/20 shadow-lg"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-900/60"
            }`}
          >
            <span>{s.label}</span>
            <span className={`text-[9px] font-normal normal-case tracking-normal ${section === s.id ? "text-[#D4AF37]/60" : "text-stone-600"}`}>
              {s.description}
            </span>
          </button>
        ))}
      </div>

      {/* Active section */}
      {section === "hero" && (
        <HeroSection showNotice={showNotice} />
      )}
      {section === "gallery" && (
        <GallerySection
          categories={["exterior", "rooms"]}
          sectionLabel="Gallery images"
          showNotice={showNotice}
        />
      )}
      {section === "dining" && (
        <GallerySection
          categories={["dining"]}
          sectionLabel="Dining images"
          showNotice={showNotice}
        />
      )}
    </div>
  );
}
