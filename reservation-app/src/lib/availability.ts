import type { BusinessHour, DailySlotOverride } from "./types";

const SALON_TZ_OFFSET = "+09:00"; // Asia/Tokyo固定(MVPでは単一タイムゾーンのみ対応)
const SLOT_GRANULARITY_MINUTES = 30;

export type BusyInterval = { startMinutes: number; endMinutes: number };

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** "YYYY-MM-DD" + "HH:mm" (JST wall clock) をDateに変換 */
export function combineDateTimeJST(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${SALON_TZ_OFFSET}`);
}

function overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

/**
 * 指定日・指定メニューで予約可能な開始時刻(HH:mm)の一覧を計算する。
 * - daily_slot_overrides に手動設定があれば、それを優先(定休上書き含む)
 * - なければ business_hours の営業時間から30分刻みで自動生成
 * - どちらの場合も既存予約(busyIntervals)と重なる時刻は除外する
 */
export function calculateAvailableSlots(params: {
  durationMinutes: number;
  businessHour: BusinessHour | null;
  override: DailySlotOverride | null;
  busyIntervals: BusyInterval[];
  now?: Date;
  date: string;
}): string[] {
  const { durationMinutes, businessHour, override, busyIntervals, date } = params;

  if (override?.is_closed) return [];

  const isFreeAt = (startMinutes: number) => {
    const endMinutes = startMinutes + durationMinutes;
    return !busyIntervals.some((b) => overlaps(startMinutes, endMinutes, b.startMinutes, b.endMinutes));
  };

  const now = params.now ?? new Date();
  const isFuture = (startMinutes: number) => {
    const slotDate = combineDateTimeJST(date, minutesToTime(startMinutes));
    return slotDate.getTime() > now.getTime();
  };

  if (override?.start_times && override.start_times.length > 0) {
    return override.start_times
      .map(timeToMinutes)
      .filter((start) => isFreeAt(start) && isFuture(start))
      .sort((a, b) => a - b)
      .map(minutesToTime);
  }

  if (!businessHour || businessHour.is_closed || !businessHour.open_time || !businessHour.close_time) {
    return [];
  }

  const open = timeToMinutes(businessHour.open_time.slice(0, 5));
  const close = timeToMinutes(businessHour.close_time.slice(0, 5));

  const slots: string[] = [];
  for (
    let start = open;
    start + durationMinutes <= close;
    start += SLOT_GRANULARITY_MINUTES
  ) {
    if (isFreeAt(start) && isFuture(start)) {
      slots.push(minutesToTime(start));
    }
  }
  return slots;
}
