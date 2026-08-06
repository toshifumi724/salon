"use client";

import { useTransition } from "react";
import { toggleMenuActive } from "./actions";

export default function ToggleMenuButton({ menuId, isActive }: { menuId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => toggleMenuActive(menuId, !isActive))}
      className="rounded border border-brand-divider px-2 py-1 text-xs text-brand-text hover:border-brand-heading disabled:opacity-50"
    >
      {isActive ? "非公開にする" : "公開する"}
    </button>
  );
}
