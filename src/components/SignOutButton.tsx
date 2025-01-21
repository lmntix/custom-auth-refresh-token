"use client";

import { handleSignOut } from "@/app/actions/auth";
import { useTransition } from "react";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => handleSignOut())}
      disabled={isPending}
      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
    >
      {isPending ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
