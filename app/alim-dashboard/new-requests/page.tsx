"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Check, Loader2, MapPin, Phone, Clock, FileText, User } from "lucide-react";
import Link from "next/link";

interface ServiceSummary {
  id?: number;
  name?: string | null;
  durationMinutes?: number | null;
}

interface PersonSummary {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  fiqh?: string | null;
}

interface AppointmentSummary {
  id: number;
  scheduledAt: string;
  startedAt?: string | null;
  endsAt?: string | null;
  completedAt?: string | null;
  durationMinutes?: number | null;
  status: string;
  isFinished: boolean;
  customerCanReview: boolean;
  alimCanReview: boolean;
  customerReviewed: boolean;
  alimReviewed: boolean;
}

interface RequestItem {
  id: number;
  customerId: number;
  alimId?: number | null;
  serviceId?: number | null;
  fiqh?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  requestDate?: string | null;
  requestTime?: string | null;
  status: string;
  notes?: string | null;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  customer: PersonSummary;
  alim?: PersonSummary | null;
  service?: ServiceSummary | null;
  appointment?: AppointmentSummary | null;
}

function safeDate(value?: string | null) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export default function NewRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadRequests() {
      try {
        setLoading(true);
        const userRaw = localStorage.getItem("user");
        const user = userRaw ? JSON.parse(userRaw) : null;
        const alimId = user?.id ?? user?.userId;

        if (!alimId) {
          setRequests([]);
          return;
        }

        const response = await fetch(`/api/service-requests?alimId=${alimId}&status=pending`);
        const text = await response.text();
        const data = text ? JSON.parse(text) : [];

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load requests");
        }

        setRequests(Array.isArray(data) ? data : []);
      } catch {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, []);

  const handleAccept = async (request: RequestItem) => {
    try {
      setBusyId(request.id);
      setMessage("");

      const userRaw = localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;
      const alimId = user?.id ?? user?.userId;

      const response = await fetch(`/api/service-requests/${request.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alimId,
          durationMinutes: request.service?.durationMinutes ?? 60,
        }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to accept request");
      }

      setRequests((current) => current.filter((item) => item.id !== request.id));
      setMessage(`Accepted request from ${request.customer?.fullName ?? "Customer"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to accept request");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setBusyId(id);
      setMessage("");

      const response = await fetch(`/api/service-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to reject request");
      }

      setRequests((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to reject request");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-4">
          <Link href="/alim-dashboard" className="mr-4">
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">New Requests</h1>
            <p className="text-xs text-gray-500">{requests.length} pending requests</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {message && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading requests...</div>
        ) : requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => {
              const custName = request.customer?.fullName ?? "Customer";
              const initials = (custName || "CU")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => (part && part[0]) || "")
                .join("")
                .toUpperCase() || "CU";

              return (
                <div key={request.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{custName}</h3>
                        <p className="text-sm text-gray-500">
                          {request.service?.name ?? `Service #${request.serviceId ?? "N/A"}`}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                      Pending
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{request.customer?.email ?? "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{request.customer?.phone ?? "No phone provided"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{request.location ?? request.customer?.city ?? "No location provided"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{request.requestDate ?? safeDate(request.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{request.requestTime ?? "No time provided"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span>{request.fiqh ?? request.customer?.fiqh ?? "Fiqh not specified"}</span>
                    </div>
                  </div>

                  {request.notes && (
                    <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">Notes:</span> {request.notes}
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => handleAccept(request)}
                      disabled={busyId === request.id}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {busyId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Accept and Start Timer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(request.id)}
                      disabled={busyId === request.id}
                      className="flex flex-1 items-center justify-center rounded-lg bg-red-50 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500">No new requests</div>
        )}
      </div>

    </div>
  );
}
