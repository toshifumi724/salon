import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { salonId } = await requireAdmin();
  const admin = createAdminClient();
  const { data: customers } = await admin
    .from("customers")
    .select("id, name, email, phone")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl tracking-wide text-brand-heading">顧客管理</h1>
      <div className="space-y-2">
        {(customers ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/admin/customers/${c.id}`}
            className="block rounded-lg border border-brand-divider bg-brand-surface p-2 text-sm shadow-sm hover:border-brand-heading"
          >
            <p className="font-bold text-brand-strong">{c.name}</p>
            <p className="text-brand-text/70">
              {c.email} {c.phone}
            </p>
          </Link>
        ))}
        {(customers ?? []).length === 0 && <p className="text-sm text-brand-text/60">顧客データがありません。</p>}
      </div>
    </div>
  );
}
