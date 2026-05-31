// ─── Cabin ────────────────────────────────────────────────────────────────────
export interface Cabin {
  id: string;
  name: string;
  max_capacity: number;
  regular_price: number;
  discount: number;
  description: string;
  image: string;
  created_at: string;
}

export type CabinInsert = Omit<Cabin, "id" | "created_at">;

// ─── Booking ──────────────────────────────────────────────────────────────────
export type BookingStatus = "unconfirmed" | "checked-in" | "checked-out";

export interface Booking {
  id: string;
  cabin_id: string | null;
  guest_name: string;
  guest_email: string;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  total_price: number;
  has_breakfast: boolean;
  is_paid: boolean;
  created_at: string;
  // joined
  cabins?: { name: string; image: string } | null;
}

export type BookingInsert = Omit<Booking, "id" | "created_at" | "cabins">;

// ─── Admin Profile ────────────────────────────────────────────────────────────
export interface AdminProfile {
  id: string;
  email: string;
  role: string;
  last_seen: string | null;
  created_at: string;
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export interface Settings {
  id: number;
  min_booking_length: number;
  max_booking_length: number;
  breakfast_price: number;
  hero_image_url: string;
  hero_mobile_image_url: string;
  updated_at: string;
}

export type SettingsUpdate = Partial<Omit<Settings, "id" | "updated_at">>;

// ─── Gallery ──────────────────────────────────────────────────────────────────
export type GalleryCategory = "exterior" | "rooms" | "dining";

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  category: GalleryCategory;
  sort_order: number;
  created_at: string;
}

export type GalleryImageInsert = Omit<GalleryImage, "id" | "created_at">;

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface ChartPoint {
  date: string;
  sales: number;
  bookings: number;
}

export interface DashboardData {
  totalSales: number;
  totalBookings: number;
  checkInsToday: number;
  occupancyRate: number;
  chartData: ChartPoint[];
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  text: string;
  type: "success" | "error" | "info";
}
