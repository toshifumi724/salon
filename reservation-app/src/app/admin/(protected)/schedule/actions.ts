"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function updateBusinessHours(formData: FormData) {
  const { salonId } = await requireAdmin();
  const admin = createAdminClient();

  for (let day = 0; day <= 6; day++) {
    const isClosed = formData.get(`closed_${day}`) === "on";
    const open = String(formData.get(`open_${day}`) ?? "");
    const close = String(formData.get(`close_${day}`) ?? "");
    await admin.from("business_hours").upsert(
      {
        salon_id: salonId,
        day_of_week: day,
        is_closed: isClosed,
        open_time: isClosed ? null : open || null,
        close_time: isClosed ? null : close || null,
      },
      { onConflict: "salon_id,day_of_week" }
    );
  }
  revalidatePath("/admin/schedule");
}

export async function upsertDailyOverride(params: {
  staffId: string;
  date: string;
  isClosed: boolean;
  startTimes: string[];
}) {
  const { salonId } = await requireAdmin();
  const admin = createAdminClient();
  await admin.from("daily_slot_overrides").upsert(
    {
      salon_id: salonId,
      staff_id: params.staffId,
      date: params.date,
      is_closed: params.isClosed,
      start_times: params.isClosed ? null : params.startTimes,
    },
    { onConflict: "salon_id,staff_id,date" }
  );
  revalidatePath("/admin/schedule");
}

export async function clearDailyOverride(params: { staffId: string; date: string }) {
  const { salonId } = await requireAdmin();
  const admin = createAdminClient();
  await admin
    .from("daily_slot_overrides")
    .delete()
    .eq("salon_id", salonId)
    .eq("staff_id", params.staffId)
    .eq("date", params.date);
  revalidatePath("/admin/schedule");
}

export async function addExternalBlock(params: {
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  note: string;
}) {
  const { salonId } = await requireAdmin();
  if (params.endTime <= params.startTime) {
    throw new Error("終了時刻は開始時刻より後にしてください");
  }
  const admin = createAdminClient();
  await admin.from("external_blocked_slots").insert({
    salon_id: salonId,
    staff_id: params.staffId,
    date: params.date,
    start_time: params.startTime,
    end_time: params.endTime,
    source: "salonboard",
    external_ref: params.note || null,
  });
  revalidatePath("/admin/schedule");
}

export async function deleteExternalBlock(id: string) {
  const { salonId } = await requireAdmin();
  const admin = createAdminClient();
  await admin.from("external_blocked_slots").delete().eq("salon_id", salonId).eq("id", id);
  revalidatePath("/admin/schedule");
}
