import Link from "next/link";
import { logout } from "@/app/login/logout-action";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3.5">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm font-semibold text-stone-900"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-xs font-semibold text-white">
              サ
            </span>
            サロン管理
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/admin"
              className="rounded-lg px-3 py-1.5 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
            >
              投稿
            </Link>
            <Link
              href="/admin/reviews"
              className="rounded-lg px-3 py-1.5 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
            >
              口コミ
            </Link>
            <Link
              href="/admin/settings"
              className="rounded-lg px-3 py-1.5 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
            >
              設定
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              >
                ログアウト
              </button>
            </form>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">{children}</div>
    </div>
  );
}
