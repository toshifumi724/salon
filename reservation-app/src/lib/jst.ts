const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** ISO日時文字列を、JST換算での「その日の何分目か(0-1439)」に変換 */
export function jstMinutesOfDay(iso: string): number {
  const shifted = new Date(new Date(iso).getTime() + JST_OFFSET_MS);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

/** ISO日時文字列を、JST換算での日付("YYYY-MM-DD")に変換 */
export function jstDateOf(iso: string): string {
  const shifted = new Date(new Date(iso).getTime() + JST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD"の曜日(0=日曜)を、タイムゾーンに依存せず取得 */
export function dayOfWeekOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** その日のJST 00:00 / 翌日JST 00:00 のUTC ISO範囲を返す(DBクエリの範囲指定用) */
export function jstDayRange(date: string): { start: string; end: string } {
  const start = new Date(`${date}T00:00:00+09:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}
