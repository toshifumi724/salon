"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function addMenu(formData: FormData) {
  const { salonId } = await requireAdmin();
  const admin = createAdminClient();
  await admin.from("menus").insert({
    salon_id: salonId,
    name: String(formData.get("name")),
    duration_minutes: Number(formData.get("duration_minutes")),
    price_yen: Number(formData.get("price_yen")),
  });
  revalidatePath("/admin/menus");
}

export async function toggleMenuActive(menuId: string, isActive: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("menus").update({ is_active: isActive }).eq("id", menuId);
  revalidatePath("/admin/menus");
}
