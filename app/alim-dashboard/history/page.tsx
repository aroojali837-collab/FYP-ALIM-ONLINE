"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Eye, Star } from "lucide-react";
import Link from "next/link";

type Feedback = { rating: number; comment?: string | null };
type HistoryItem = {
  id: number;
  customer?: { fullName?: string | null } | null;
  service?: { name?: string | null } | null;
  requestDate?: string | null;
  requestTime?: string | null;
  updatedAt?: string | null;
  status: string;
  appointment?: { status: string; alimFeedback?: Feedback | null } | null;
};

function initials(name?: string | null) {
  return (name || "Customer").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const userRaw = localStorage.getItem("user");
        const user = userRaw ? JSON.parse(userRaw) : null;
        const alimId = user?.id ?? user?.userId;
        if (!alimId) return;
        const response = await fetch(`/api/service-requests?alimId=${alimId}`);
        const data = response.ok ? await response.json() : [];
        setItems((Array.isArray(data) ? data : []).filter((item) => item.status === "completed" || item.appointment?.status === "completed"));
      } finally {
        setLoading(false);
      }
    }
    void loadHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center px-4 py-4">
          <Link href="/alim-dashboard" className="mr-4" aria-label="Back to dashboard"><ChevronLeft className="h-6 w-6 text-gray-600" /></Link>
          <div><h1 className="text-lg font-bold text-gray-900">History</h1><p className="text-xs text-gray-500">Completed appointments</p></div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {loading ? <div className="py-16 text-center text-gray-500">Loading history...</div> : items.length === 0 ? <div className="py-16 text-center text-gray-500">No completed appointments yet.</div> : items.map((item) => {
          const feedback = item.appointment?.alimFeedback;
          const customerName = item.customer?.fullName ?? "Customer";
          return (
            <article key={item.id} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-sm font-semibold text-white">{initials(customerName)}</div><div><h2 className="font-semibold text-gray-900">{customerName}</h2><p className="text-xs text-gray-500">{item.service?.name ?? "Service"}</p></div></div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Completed</span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-600"><div>📅 {item.requestDate ?? item.updatedAt ?? "N/A"}</div><div>🕐 {item.requestTime ?? "N/A"}</div></div>
              {feedback ? <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-100 py-2 text-sm font-semibold text-yellow-700"><Eye className="h-4 w-4" /> View Feedback</button> : <p className="mt-4 rounded-lg bg-gray-50 p-3 text-center text-sm text-gray-500">No feedback submitted yet.</p>}
              {expandedId === item.id && feedback && <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4"><div className="flex items-center gap-1 text-yellow-600">{Array.from({ length: feedback.rating }, (_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}</div>{feedback.comment && <p className="mt-2 text-sm text-gray-700">{feedback.comment}</p>}</div>}
            </article>
          );
        })}
      </main>
    </div>
  );
}
