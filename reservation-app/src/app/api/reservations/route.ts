import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { calculateAvailableSlots } from "@/lib/availability";
import { combineDateTimeJST } from "@/lib/availability";
import { dayOfWeekOf, jstDayRange, jstMinutesOfDay } from "@/lib/jst";
import { getDefaultSalonId, getDefaultStaffId } from "@/lib/salon-context";
import { reservationConfirmedEmail, sendEmail } from "@/lib/email";
import type { BusinessHour, DailySlotOverride } from "@/lib/types";

const bodySchema = z.object({
  menuId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(1).max(30).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が不正です", details: parsed.error.flatten() }, { status: 400 });
  }
  const { menuId, date, time, name, email, phone } = parsed.data;

  const salonId = getDefaultSalonId();
  const staffId = parsed.data.staffId ?? (await getDefaultStaffId(salonId));
  const admin = createAdminClient();

  const { data: menu } = await admin
    .from("menus")
    .select("id, name, duration_minutes")
    .eq("id", menuId)
    .eq("salon_id", salonId)
    .single();
  if (!menu) {
    return NextResponse.json({ error: "メニューが見つかりません" }, { status: 404 });
  }

  // 二重予約防止のため、確定直前にもう一度空き状況を確認する
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
  const availableSlots = calculateAvailableSlots({
    date,
    durationMinutes: menu.duration_minutes,
    businessHour: businessHour ?? null,
    override: override ?? null,
    busyIntervals,
  });
  if (!availableSlots.includes(time)) {
    return NextResponse.json({ error: "この時間はすでに埋まっています。別の時間を選択してください。" }, { status: 409 });
  }

  const startAt = combineDateTimeJST(date, time);
  const endAt = new Date(startAt.getTime() + menu.duration_minutes * 60 * 1000);

  // ログイン中の会員であれば customer_id を紐付ける。ゲストの場合はメールアドレスで既存顧客を照合。
  const serverClient = await createServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  let customerId: string | null = null;
  const { data: existingCustomer } = await admin
    .from("customers")
    .select("id")
    .eq("salon_id", salonId)
    .eq("email", email)
    .maybeSingle();

  if (existingCustomer) {
    customerId = existingCustomer.id;
    if (user) {
      await admin.from("customers").update({ user_id: user.id, name, phone }).eq("id", existingCustomer.id);
    }
  } else {
    const { data: newCustomer } = await admin
      .from("customers")
      .insert({ salon_id: salonId, user_id: user?.id ?? null, name, email, phone })
      .select("id")
      .single();
    customerId = newCustomer?.id ?? null;
  }

  const { data: reservation, error } = await admin
    .from("reservations")
    .insert({
      salon_id: salonId,
      staff_id: staffId,
      menu_id: menuId,
      customer_id: customerId,
      guest_name: name,
      guest_email: email,
      guest_phone: phone,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
    })
    .select("id, cancel_token")
    .single();

  if (error || !reservation) {
    return NextResponse.json({ error: "予約の作成に失敗しました" }, { status: 500 });
  }

  const manageUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/r/${reservation.cancel_token}`;
  const emailContent = reservationConfirmedEmail({
    guestName: name,
    menuName: menu.name,
    dateLabel: date,
    timeLabel: time,
    manageUrl,
  });
  await sendEmail({ to: email, ...emailContent });

  return NextResponse.json({ id: reservation.id, cancelToken: reservation.cancel_token });
}
