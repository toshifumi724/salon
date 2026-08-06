"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelButton({ reservationId, token }: { reservationId: string; token?: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleCancel() {
    if (!confirm("この予約をキャンセルします。よろしいですか？")) return;
    setSubmitting(true);
    try {
      await fetch(`/api/reservations/${reservationId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={submitting}
      className="w-full rounded border border-red-700/70 bg-brand-surface p-2 text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      {submitting ? "処理中..." : "予約をキャンセルする"}
    </button>
  );
}
