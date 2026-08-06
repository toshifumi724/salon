"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function updateCustomerMemo(customerId: string, memo: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("customers").update({ memo, updated_at: new Date().toISOString() }).eq("id", customerId);
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function addCustomerNote(customerId: string, note: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("customer_notes").insert({ customer_id: customerId, note });
  revalidatePath(`/admin/customers/${customerId}`);
}
