"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@/lib/auth";

const publicPaths = ["/", "/create-account"];

function readUser(): User | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

function requiresRole(pathname: string, role: "customer" | "alim") {
  return pathname === `/${role}-dashboard` || pathname.startsWith(`/${role}-dashboard/`);
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const user = readUser();

    if (publicPaths.includes(pathname)) {
      setChecking(false);
      return;
    }

    if (!user || !["customer", "alim"].includes(user.role)) {
      router.replace("/");
      return;
    }

    if (requiresRole(pathname, "customer") && user.role !== "customer") {
      router.replace("/alim-dashboard");
      return;
    }

    if (requiresRole(pathname, "alim") && user.role !== "alim") {
      router.replace("/customer-dashboard");
      return;
    }

    setChecking(false);
  }, [pathname, router]);

  if (checking && !publicPaths.includes(pathname)) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Checking session...</main>;
  }

  return children;
}
