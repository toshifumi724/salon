import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { reservationCancelledEmail, sendEmail } from "@/lib/email";
import { jstDateOf, jstMinutesOfDay } from "@/lib/jst";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const token = typeof body?.token === "string" ? body.token : null;

  const admin = createAdminClient();
  const { data: reservation } = await admin
    .from("reservations")
    .select("id, cancel_token, customer_id, status, start_at, end_at, guest_name, guest_email, menu_id, menus(name)")
    .eq("id", id)
    .single();

  if (!reservation) {
    return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
  }

  let authorized = token !== null && token === reservation.cancel_token;

  if (!authorized) {
    const serverClient = await createServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();
    if (user && reservation.customer_id) {
      const { data: customer } = await admin
        .from("customers")
        .select("id")
        .eq("id", reservation.customer_id)
        .eq("user_id", user.id)
        .maybeSingle();
      authorized = !!customer;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "この予約をキャンセルする権限がありません" }, { status: 403 });
  }

  if (reservation.status === "cancelled") {
    return NextResponse.json({ ok: true });
  }

  await admin.from("reservations").update({ status: "cancelled" }).eq("id", id);

  const menuName = (reservation.menus as unknown as { name: string } | null)?.name ?? "";
  const emailContent = reservationCancelledEmail({
    guestName: reservation.guest_name,
    menuName,
    dateLabel: jstDateOf(reservation.start_at),
    timeLabel: `${String(Math.floor(jstMinutesOfDay(reservation.start_at) / 60)).padStart(2, "0")}:${String(
      jstMinutesOfDay(reservation.start_at) % 60
    ).padStart(2, "0")}`,
  });
  await sendEmail({ to: reservation.guest_email, ...emailContent });

  return NextResponse.json({ ok: true });
}
