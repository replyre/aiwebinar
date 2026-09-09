"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="btn btn--ghost btn--sm"
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/account/logout", { method: "POST" }).catch(() => {});
        router.push("/account");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
