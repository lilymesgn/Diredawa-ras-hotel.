import { supabase } from "../lib/supabase";
import {
  Cabin,
  CabinInsert,
  Booking,
  BookingInsert,
  AdminProfile,
  Settings,
  SettingsUpdate,
  DashboardData,
  GalleryImage,
  GalleryImageInsert,
} from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function throwIfError(error: any) {
  if (error) throw new Error(error.message || "Supabase error");
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    throwIfError(error);
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    throwIfError(error);
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    throwIfError(error);
  },

  async updateLastSeen() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("admin_profiles")
      .update({ last_seen: new Date().toISOString() })
      .eq("id", user.id);
  },
};

// ─── Cabins ───────────────────────────────────────────────────────────────────
export const cabinService = {
  async getAll(): Promise<Cabin[]> {
    const { data, error } = await supabase
      .from("cabins")
      .select("*")
      .order("name");
    throwIfError(error);
    return data ?? [];
  },

  async create(cabin: CabinInsert): Promise<Cabin> {
    const { data, error } = await supabase
      .from("cabins")
      .insert(cabin)
      .select()
      .single();
    throwIfError(error);
    return data;
  },

  async update(id: string, updates: Partial<CabinInsert>): Promise<Cabin> {
    const { data, error } = await supabase
      .from("cabins")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    throwIfError(error);
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("cabins").delete().eq("id", id);
    throwIfError(error);
  },

  async uploadImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `cabin-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("cabin-images")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });
    throwIfError(error);
    const { data: { publicUrl } } = supabase.storage
      .from("cabin-images")
      .getPublicUrl(fileName);
    return publicUrl;
  },

  async deleteImage(imageUrl: string): Promise<void> {
    // Only attempt deletion if the URL is from our own bucket
    const bucketSegment = "/cabin-images/";
    if (!imageUrl.includes(bucketSegment)) return;
    const path = imageUrl.split(bucketSegment).pop();
    if (!path) return;
    await supabase.storage.from("cabin-images").remove([path]);
  },
};

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookingService = {
  async getAll(status?: string): Promise<Booking[]> {
    let query = supabase
      .from("bookings")
      .select("*, cabins(name, image)")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    throwIfError(error);
    return data ?? [];
  },

  async getOne(id: string): Promise<Booking> {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, cabins(name, image)")
      .eq("id", id)
      .single();
    throwIfError(error);
    return data;
  },

  async create(booking: BookingInsert): Promise<Booking> {
    const { data, error } = await supabase
      .from("bookings")
      .insert(booking)
      .select("*, cabins(name, image)")
      .single();
    throwIfError(error);
    return data;
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);
    throwIfError(error);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    throwIfError(error);
  },
};

// ─── Admin Profiles (Users) ───────────────────────────────────────────────────
export const userService = {
  async getAll(): Promise<AdminProfile[]> {
    const { data, error } = await supabase
      .from("admin_profiles")
      .select("*")
      .order("created_at", { ascending: false });
    throwIfError(error);
    return data ?? [];
  },

  /** Creates the auth user + sends confirmation email to the invitee. */
  async invite(email: string): Promise<void> {
    // Generate a random temporary password; the user resets it via email link
    const tempPw =
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).toUpperCase().slice(2) +
      "!9";
    const { error } = await supabase.auth.signUp({
      email,
      password: tempPw,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    throwIfError(error);
  },

  /**
   * Removes only the admin_profile row. Deleting the underlying auth.users
   * record requires the service-role key (not available client-side).
   */
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from("admin_profiles")
      .delete()
      .eq("id", id);
    throwIfError(error);
  },
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsService = {
  async get(): Promise<Settings> {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();
    throwIfError(error);
    return data;
  },

  async update(updates: SettingsUpdate): Promise<Settings> {
    const { data, error } = await supabase
      .from("settings")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", 1)
      .select()
      .single();
    throwIfError(error);
    return data;
  },
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardService = {
  async getData(days: number): Promise<DashboardData> {
    const startDate = new Date(Date.now() - days * 86_400_000).toISOString();
    const today = new Date().toISOString().split("T")[0];

    const [bookingsRes, cabinsRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("total_price, status, start_date, created_at")
        .gte("created_at", startDate),
      supabase.from("cabins").select("id"),
    ]);

    throwIfError(bookingsRes.error);
    throwIfError(cabinsRes.error);

    const bookings = bookingsRes.data ?? [];
    const totalCabins = cabinsRes.data?.length ?? 0;

    const totalSales = bookings.reduce((s, b) => s + (b.total_price ?? 0), 0);
    const totalBookings = bookings.length;
    const checkInsToday = bookings.filter((b) => b.start_date === today).length;

    const checkedIn = bookings.filter((b) => b.status === "checked-in").length;
    const occupancyRate =
      totalCabins > 0
        ? Math.min(100, Math.round((checkedIn / totalCabins) * 100))
        : 0;

    // Build a date-keyed map for every day in the range
    const dateMap: Record<string, { sales: number; bookings: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000)
        .toISOString()
        .split("T")[0];
      dateMap[d] = { sales: 0, bookings: 0 };
    }
    bookings.forEach((b) => {
      const d = b.created_at?.split("T")[0];
      if (d && dateMap[d]) {
        dateMap[d].sales += b.total_price ?? 0;
        dateMap[d].bookings += 1;
      }
    });

    const chartData = Object.entries(dateMap).map(([date, vals]) => ({
      date: new Date(date + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      ...vals,
    }));

    return { totalSales, totalBookings, checkInsToday, occupancyRate, chartData };
  },
};

// ─── Media ────────────────────────────────────────────────────────────────────
export const mediaService = {
  // ── Hero images (stored in settings row id=1) ──────────────────────────────
  async getHeroUrls(): Promise<{ hero_image_url: string; hero_mobile_image_url: string }> {
    const { data, error } = await supabase
      .from("settings")
      .select("hero_image_url, hero_mobile_image_url")
      .eq("id", 1)
      .single();
    throwIfError(error);
    return data;
  },

  async updateHeroUrls(urls: {
    hero_image_url?: string;
    hero_mobile_image_url?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from("settings")
      .update({ ...urls, updated_at: new Date().toISOString() })
      .eq("id", 1);
    throwIfError(error);
  },

  // ── Gallery table ──────────────────────────────────────────────────────────
  async getGallery(categories: string[]): Promise<GalleryImage[]> {
    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .in("category", categories)
      .order("sort_order", { ascending: true });
    throwIfError(error);
    return data ?? [];
  },

  async addGalleryImage(img: GalleryImageInsert): Promise<GalleryImage> {
    const { data, error } = await supabase
      .from("gallery")
      .insert(img)
      .select()
      .single();
    throwIfError(error);
    return data;
  },

  async updateGalleryImage(
    id: string,
    updates: Partial<Omit<GalleryImage, "id" | "created_at">>
  ): Promise<void> {
    const { error } = await supabase
      .from("gallery")
      .update(updates)
      .eq("id", id);
    throwIfError(error);
  },

  async deleteGalleryImage(id: string): Promise<void> {
    const { error } = await supabase.from("gallery").delete().eq("id", id);
    throwIfError(error);
  },

  /** Batch-update sort_order for every item in the list. */
  async reorderGallery(updates: { id: string; sort_order: number }[]): Promise<void> {
    await Promise.all(
      updates.map(({ id, sort_order }) =>
        supabase.from("gallery").update({ sort_order }).eq("id", id)
      )
    );
  },

  // ── Storage upload (works for both buckets) ────────────────────────────────
  async uploadMedia(
    file: File,
    bucket: "hero-images" | "gallery-images"
  ): Promise<string> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const prefix = bucket === "hero-images" ? "hero" : "gallery";
    const fileName = `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { cacheControl: "3600", upsert: false });
    throwIfError(error);

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
  },
};
