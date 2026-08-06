import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="font-heading text-3xl tracking-wide text-brand-heading">サロン予約</h1>
      <div className="flex flex-col gap-3">
        <Link
          href="/book"
          className="rounded bg-brand-strong px-6 py-3 text-white transition-colors hover:bg-brand-heading"
        >
          予約する
        </Link>
        <Link
          href="/my"
          className="rounded border border-brand-divider bg-brand-surface px-6 py-3 text-brand-text transition-colors hover:border-brand-heading"
        >
          マイ予約を見る
        </Link>
        <Link href="/admin" className="text-sm text-brand-heading underline">
          サロン管理画面
        </Link>
      </div>
    </main>
  );
}
