import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-2xl font-bold">サロン予約</h1>
      <div className="flex flex-col gap-3">
        <Link href="/book" className="rounded bg-black px-6 py-3 text-white">
          予約する
        </Link>
        <Link href="/my" className="rounded border px-6 py-3">
          マイ予約を見る
        </Link>
        <Link href="/admin" className="text-sm text-gray-500 underline">
          サロン管理画面
        </Link>
      </div>
    </main>
  );
}
