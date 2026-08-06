import { createAdminClient } from "@/lib/supabase/admin";
import { getDefaultSalonId } from "@/lib/salon-context";
import type { Menu } from "@/lib/types";
import BookingForm from "./BookingForm";

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const salonId = getDefaultSalonId();
  const admin = createAdminClient();
  const { data: menus } = await admin
    .from("menus")
    .select("*")
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-xl font-bold">ご予約</h1>
      <BookingForm menus={(menus ?? []) as Menu[]} />
    </main>
  );
}
