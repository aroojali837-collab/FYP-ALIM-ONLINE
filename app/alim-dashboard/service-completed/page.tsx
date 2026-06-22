"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ServiceCompletedClient from "./ServiceCompletedClient";

export default function ServiceCompletedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ServiceCompletedClient />
    </Suspense>
  );
}
