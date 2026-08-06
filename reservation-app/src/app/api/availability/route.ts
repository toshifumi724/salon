import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateAvailableSlots } from "@/lib/availability";
import { dayOfWeekOf, jstDayRange, jstMinutesOfDay } from "@/lib/jst";
import { getDefaultSalonId, getDefaultStaffId } from "@/lib/salon-context";
import type { BusinessHour, DailySlotOverride } from "@/lib/types";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const menuId = req.nextUrl.searchParams.get("menuId");
  let staffId = req.nextUrl.searchParams.get("staffId");

  if (!date || !menuId) {
    return NextResponse.json({ error: "date, menuId は必須です" }, { status: 400 });
  }

  const salonId = getDefaultSalonId();
  const admin = createAdminClient();

  if (!staffId) {
    staffId = await getDefaultStaffId(salonId);
  }

  const { data: menu, error: menuError } = await admin
    .from("menus")
    .select("id, duration_minutes")
    .eq("id", menuId)
    .eq("salon_id", salonId)
    .single();
  if (menuError || !menu) {
    return NextResponse.json({ error: "メニューが見つかりません" }, { status: 404 });
  }

  const { data: businessHour } = await admin
    .from("business_hours")
    .select("*")
    .eq("salon_id", salonId)
    .eq("day_of_week", dayOfWeekOf(date))
    .maybeSingle<BusinessHour>();

  const { data: override } = await admin
    .from("daily_slot_overrides")
    .select("*")
    .eq("salon_id", salonId)
    .eq("staff_id", staffId)
    .eq("date", date)
    .maybeSingle<DailySlotOverride>();

  const { start, end } = jstDayRange(date);
  const { data: existing } = await admin
    .from("reservations")
    .select("start_at, end_at")
    .eq("staff_id", staffId)
    .eq("status", "confirmed")
    .gte("start_at", start)
    .lt("start_at", end);

  const busyIntervals = (existing ?? []).map((r) => ({
    startMinutes: jstMinutesOfDay(r.start_at),
    endMinutes: jstMinutesOfDay(r.end_at),
  }));

  const slots = calculateAvailableSlots({
    date,
    durationMinutes: menu.duration_minutes,
    businessHour: businessHour ?? null,
    override: override ?? null,
    busyIntervals,
  });

  return NextResponse.json({ slots, staffId });
}
