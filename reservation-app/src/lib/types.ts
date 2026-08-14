export type Menu = {
  id: string;
  salon_id: string;
  name: string;
  duration_minutes: number;
  price_yen: number;
  is_active: boolean;
  sort_order: number;
};

export type Staff = {
  id: string;
  salon_id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
};

export type BusinessHour = {
  id: string;
  salon_id: string;
  day_of_week: number; // 0=日曜
  is_closed: boolean;
  open_time: string | null; // "09:00:00"
  close_time: string | null;
};

export type DailySlotOverride = {
  id: string;
  salon_id: string;
  staff_id: string;
  date: string; // "2026-08-10"
  is_closed: boolean;
  start_times: string[] | null; // ["09:00","11:30",...]
};

export type ReservationStatus = "confirmed" | "cancelled";

export type Reservation = {
  id: string;
  salon_id: string;
  staff_id: string;
  menu_id: string;
  customer_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  start_at: string;
  end_at: string;
  status: ReservationStatus;
  cancel_token: string;
  created_at: string;
};

export type ExternalBlockedSlot = {
  id: string;
  salon_id: string;
  staff_id: string;
  date: string; // "2026-08-10"
  start_time: string; // "09:00:00"
  end_time: string;
  source: string; // "salonboard" など
  external_ref: string | null;
};

export type Customer = {
  id: string;
  salon_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  memo: string | null;
  created_at: string;
};
