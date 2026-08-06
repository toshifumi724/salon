"use client";

import { useState, useTransition } from "react";
import { addCustomerNote } from "../actions";

export default function NoteForm({ customerId }: { customerId: string }) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="来店時のメモを追加"
        className="flex-1 rounded border border-brand-divider bg-brand-surface p-2 text-sm text-brand-text focus:border-brand-heading focus:outline-none"
      />
      <button
        disabled={pending || !note}
        onClick={() =>
          startTransition(async () => {
            await addCustomerNote(customerId, note);
            setNote("");
          })
        }
        className="rounded bg-brand-strong px-4 py-2 text-sm text-white transition-colors hover:bg-brand-heading disabled:opacity-50"
      >
        追加
      </button>
    </div>
  );
}
