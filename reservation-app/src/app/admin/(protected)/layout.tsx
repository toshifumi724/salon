import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-full bg-brand-bg">
      <div className="mx-auto max-w-3xl p-4">
        <nav className="mb-6 flex flex-wrap gap-4 border-b border-brand-divider pb-2 text-sm text-brand-text">
          <Link href="/admin" className="hover:text-brand-heading">
            予約一覧
          </Link>
          <Link href="/admin/menus" className="hover:text-brand-heading">
            メニュー設定
          </Link>
          <Link href="/admin/schedule" className="hover:text-brand-heading">
            営業時間・枠設定
          </Link>
          <Link href="/admin/customers" className="hover:text-brand-heading">
            顧客管理
          </Link>
        </nav>
        {children}
      </div>
    </div>
  );
}
