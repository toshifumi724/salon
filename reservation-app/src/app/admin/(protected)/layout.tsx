import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl p-4">
      <nav className="mb-6 flex flex-wrap gap-4 border-b pb-2 text-sm">
        <Link href="/admin">予約一覧</Link>
        <Link href="/admin/menus">メニュー設定</Link>
        <Link href="/admin/schedule">営業時間・枠設定</Link>
        <Link href="/admin/customers">顧客管理</Link>
      </nav>
      {children}
    </div>
  );
}
