import { createAdminClient } from "@/lib/supabase/admin";
import { jstDateOf, jstMinutesOfDay } from "@/lib/jst";
import CancelButton from "@/components/CancelButton";

export const dynamic = "force-dynamic";

export default async function ReservationManagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data: reservation } = await admin
    .from("reservations")
    .select("id, status, start_at, guest_name, menus(name, duration_minutes, price_yen)")
    .eq("cancel_token", token)
    .maybeSingle();

  if (!reservation) {
    return <main className="mx-auto max-w-md p-4">予約が見つかりませんでした。</main>;
  }

  const menu = reservation.menus as unknown as { name: string; duration_minutes: number; price_yen: number } | null;
  const minutes = jstMinutesOfDay(reservation.start_at);
  const timeLabel = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-xl font-bold">ご予約内容</h1>
      <div className="rounded border p-4">
        <p>お名前: {reservation.guest_name} 様</p>
        <p>メニュー: {menu?.name}</p>
        <p>
          日時: {jstDateOf(reservation.start_at)} {timeLabel}
        </p>
        <p>ステータス: {reservation.status === "confirmed" ? "確定" : "キャンセル済み"}</p>
      </div>

      {reservation.status === "confirmed" && (
        <div className="space-y-2">
          <CancelButton reservationId={reservation.id} token={token} />
          <a href="/book" className="block text-center text-blue-600 underline">
            日時を変更する場合はこちら(現在の予約はキャンセルされます)
          </a>
        </div>
      )}
    </main>
  );
}
