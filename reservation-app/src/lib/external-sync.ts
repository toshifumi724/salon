import { createAdminClient } from "./supabase/admin";
import { timeToMinutes, type BusyInterval } from "./availability";

/** サロンボードなど外部連携で入った予約(external_blocked_slots)を、空き枠計算用のBusyIntervalに変換する */
export async function getExternalBusyIntervals(staffId: string, date: string): Promise<BusyInterval[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("external_blocked_slots")
    .select("start_time, end_time")
    .eq("staff_id", staffId)
    .eq("date", date);

  return (data ?? []).map((row) => ({
    startMinutes: timeToMinutes(row.start_time.slice(0, 5)),
    endMinutes: timeToMinutes(row.end_time.slice(0, 5)),
  }));
}
