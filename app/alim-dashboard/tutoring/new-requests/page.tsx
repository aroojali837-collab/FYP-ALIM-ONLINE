"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, MapPin, X } from "lucide-react";

type RequestItem = { enrollmentId: number; studentName: string; email: string; phone?: string | null; age?: number | null; location?: string | null; notes?: string | null; requestedAt: string };

export default function TutoringRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [message, setMessage] = useState("");
  const getId = () => { const raw = localStorage.getItem("user"); const user = raw ? JSON.parse(raw) : null; return user?.id ?? user?.userId; };
  const load = () => { const id = getId(); if (!id) return; void fetch(`/api/quran/requests?teacherId=${id}`).then((r) => r.json()).then((data: RequestItem[]) => setRequests(Array.isArray(data) ? data : [])).catch(() => setRequests([])); };
  useEffect(() => { load(); }, []);
  const respond = async (id: number, status: "accepted" | "rejected") => { const response = await fetch(`/api/quran/requests/${id}?teacherId=${getId()}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); setMessage(response.ok ? `Request ${status}.` : "Unable to update request."); if (response.ok) load(); };
  return <main className="min-h-screen bg-green-50 px-4 py-8"><div className="mx-auto max-w-2xl"><Link href="/alim-dashboard/tutoring" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-600"><ArrowLeft className="h-4 w-4" />Tutoring</Link><h1 className="text-2xl font-bold text-gray-900">New Student Requests</h1>{message && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}<div className="mt-6 space-y-4">{requests.length === 0 ? <div className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm">No pending requests.</div> : requests.map((item) => <article key={item.enrollmentId} className="rounded-xl bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">{item.studentName}</h2><div className="mt-2 space-y-1 text-sm text-gray-600"><p>{item.email} · {item.phone || "Phone not provided"}</p><p>{item.age ? `Age: ${item.age}` : "Age not provided"}</p><p className="flex items-center gap-1"><MapPin className="h-4 w-4" />{item.location || "Location not provided"}</p>{item.notes && <p>Notes: {item.notes}</p>}<p className="text-xs text-gray-400">Requested: {new Date(item.requestedAt).toLocaleString()}</p></div><div className="mt-4 flex gap-3"><button onClick={() => void respond(item.enrollmentId, "accepted")} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"><Check className="h-4 w-4" />Accept</button><button onClick={() => void respond(item.enrollmentId, "rejected")} className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-700"><X className="h-4 w-4" />Reject</button></div></article>)}</div></div></main>;
}
