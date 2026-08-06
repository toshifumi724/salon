"use client";

import { useState, useTransition } from "react";
import { updateCustomerMemo } from "../actions";

export default function MemoForm({ customerId, initialMemo }: { customerId: string; initialMemo: string }) {
  const [memo, setMemo] = useState(initialMemo);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        rows={4}
        className="w-full rounded border p-2 text-sm"
        placeholder="髪質、アレルギー、好みの施術内容などを記録できます"
      />
      <button
        disabled={pending}
        onClick={() => startTransition(() => updateCustomerMemo(customerId, memo))}
        className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        保存
      </button>
    </div>
  );
}
