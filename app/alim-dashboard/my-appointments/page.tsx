"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, Clock3, Eye, Loader2, MessageSquare, Star, Sparkles, X } from "lucide-react";
import Link from "next/link";

interface PersonSummary {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  fiqh?: string | null;
}

interface ServiceSummary {
  id?: number;
  name?: string | null;
  durationMinutes?: number | null;
  price?: number | null;
}

interface AppointmentSummary {
  id: number;
  serviceRequestId: number;
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
  alimFeedbackSkipped: boolean;
  alimFeedback?: FeedbackSummary | null;
  customerFeedback?: FeedbackSummary | null;
}

interface FeedbackSummary {
  rating: number;
  comment?: string | null;
  createdAt: string;
}

interface RequestItem {
  id: number;
  customerId: number;
  alimId?: number | null;
  serviceId?: number | null;
  fiqh?: string | null;
  location?: string | null;
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

function toDateLabel(value?: string | null) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

function toTimeLabel(value?: string | null) {
  if (!value) return "N/A";
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getScheduledAt(item: RequestItem) {
  const appointment = item.appointment;
  if (appointment?.scheduledAt) {
    const parsed = new Date(appointment.scheduledAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (item.requestDate && item.requestTime) {
    const parsed = new Date(`${item.requestDate}T${item.requestTime.length === 5 ? `${item.requestTime}:00` : item.requestTime}`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (item.requestDate) {
    const parsed = new Date(item.requestDate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const fallback = new Date(item.createdAt);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function getDurationMinutes(item: RequestItem) {
  return item.appointment?.durationMinutes ?? item.service?.durationMinutes ?? 60;
}

function getEndsAt(item: RequestItem) {
  if (item.appointment?.endsAt) {
    const serverEnd = new Date(item.appointment.endsAt);
    if (!Number.isNaN(serverEnd.getTime())) return serverEnd;
  }

  const start = getScheduledAt(item);
  if (!start) return null;
  return new Date(start.getTime() + getDurationMinutes(item) * 60000);
}

function isCompleted(item: RequestItem) {
  return item.appointment?.status === "completed" || item.status === "completed";
}

function initialsFromName(name?: string | null) {
  return (name || "CU")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase() || "CU";
}

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReview, setActiveReview] = useState<RequestItem | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [viewFeedback, setViewFeedback] = useState<RequestItem | null>(null);
  const [viewFeedbackId, setViewFeedbackId] = useState<number | null>(null);
  const completedTriggeredRef = useRef(new Set<number>());

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const userRaw = localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;
      const alimId = user?.id ?? user?.userId;

      if (!alimId) {
        setAppointments([]);
        return;
      }

      const response = await fetch(`/api/service-requests?alimId=${alimId}`);
      const text = await response.text();
      const data = text ? JSON.parse(text) : [];

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load appointments");
      }

      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadAppointments();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadAppointments]);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const completeAppointment = useCallback(async (appointmentId: number) => {
    if (completedTriggeredRef.current.has(appointmentId)) return;
    completedTriggeredRef.current.add(appointmentId);

    try {
      await fetch(`/api/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      await loadAppointments();
    } catch {
      // Let the next tick try again if the backend is temporarily unavailable.
    }
  }, [loadAppointments]);

  useEffect(() => {
    for (const item of appointments) {
      const appointment = item.appointment;
      if (
        !appointment?.id ||
        appointment.isFinished ||
        !["accepted", "confirmed", "in_progress"].includes(item.status.toLowerCase())
      ) {
        continue;
      }

      const endsAt = getEndsAt(item);
      if (endsAt && endsAt.getTime() <= nowTick && !completedTriggeredRef.current.has(appointment.id)) {
        void completeAppointment(appointment.id);
      }
    }
  }, [appointments, nowTick, completeAppointment]);

  const submitReview = async () => {
    if (!activeReview?.appointment?.id) {
      return;
    }

    try {
      setBusy(true);
      setMessage("");

      const userRaw = localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;
      const alimId = user?.id ?? user?.userId;

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId: alimId,
          revieweeId: activeReview.customerId,
          appointmentId: activeReview.appointment.id,
          rating,
          comment,
        }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to submit feedback");
      }

      setActiveReview(null);
      setComment("");
      setRating(5);
      setMessage("Feedback submitted successfully.");
      await loadAppointments();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit feedback");
    } finally {
      setBusy(false);
    }
  };

  const activeAppointments = appointments.filter((item) =>
    !isCompleted(item) && ["accepted", "confirmed", "in_progress"].includes(item.status),
  );

  const completedAppointments = appointments.filter((item) =>
    isCompleted(item) && !item.appointment?.alimReviewed && !item.appointment?.alimFeedbackSkipped,
  );

  const skipFeedback = async (item: RequestItem) => {
    if (!item.appointment?.id) return;

    try {
      const response = await fetch(`/api/appointments/${item.appointment.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", skipFeedback: true }),
      });

      if (!response.ok) throw new Error("Unable to skip feedback");
      await loadAppointments();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to skip feedback");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-4">
          <Link href="/alim-dashboard" className="mr-4 rounded-full p-1 transition hover:bg-slate-100">
            <ChevronLeft className="h-6 w-6 text-slate-700" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">My Appointments</h1>
            <p className="text-xs text-slate-500">
              {activeAppointments.length} active
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {message && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading appointments...</div>
        ) : appointments.length > 0 ? (
          <div className="space-y-6">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Active Appointments</h2>
              </div>

              {activeAppointments.length > 0 ? (
                <div className="space-y-4">
                  {activeAppointments.map((item) => {
                    const appointment = item.appointment;
                    const scheduledAt = getScheduledAt(item);
                    const endsAt = getEndsAt(item);
                    const startsInMs = scheduledAt ? scheduledAt.getTime() - nowTick : null;
                    const endsInMs = endsAt ? endsAt.getTime() - nowTick : null;
                    const canReview = !!appointment?.alimCanReview && !appointment?.alimReviewed;

                    const countdownLabel =
                      startsInMs !== null && startsInMs > 0
                        ? "Starts in"
                        : endsInMs !== null && endsInMs > 0
                          ? "Time left"
                          : "Waiting";
                    const countdownValue =
                      startsInMs !== null && startsInMs > 0
                        ? startsInMs
                        : endsInMs !== null && endsInMs > 0
                          ? endsInMs
                          : null;

                    return (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                              {initialsFromName(item.customer?.fullName)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{item.customer?.fullName ?? "Customer"}</h3>
                              <p className="text-sm text-slate-500">{item.service?.name ?? `Service #${item.serviceId ?? "N/A"}`}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                              <Clock3 className="h-3.5 w-3.5" />
                              {countdownValue !== null ? formatCountdown(countdownValue) : "N/A"}
                            </div>
                            <div className="mt-1 text-[11px] font-medium text-slate-500">{countdownLabel}</div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                          <div>
                            <span className="font-semibold text-slate-900">Email:</span> {item.customer?.email ?? "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900">Phone:</span> {item.customer?.phone ?? "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900">Location:</span> {item.location ?? item.customer?.city ?? "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900">Fiqh:</span> {item.fiqh ?? item.customer?.fiqh ?? "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900">Date:</span> {toDateLabel(item.requestDate ?? item.createdAt)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900">Time:</span> {toTimeLabel(item.requestTime ?? appointment?.scheduledAt)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900">Starts:</span> {scheduledAt ? scheduledAt.toLocaleString() : "N/A"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900">Ends:</span> {endsAt ? endsAt.toLocaleString() : "N/A"}
                          </div>
                        </div>

                        {item.notes && (
                          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                            <span className="font-semibold text-slate-900">Notes:</span> {item.notes}
                          </div>
                        )}

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          {canReview ? (
                            <button
                              type="button"
                              onClick={() => setActiveReview(item)}
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-600"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Give Feedback
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="flex flex-1 items-center justify-center rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-500"
                            >
                              {appointment?.alimReviewed
                                ? "Feedback Submitted"
                                : startsInMs !== null && startsInMs > 0
                                  ? "Service not started yet"
                                  : "Feedback not available yet"}
                            </button>
                          )}

                          {appointment?.customerFeedback ? (
                            <button
                              type="button"
                              onClick={() => setViewFeedback(item)}
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                            >
                              <Eye className="h-4 w-4" />
                              View Feedback from Customer
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                  No active appointments right now.
                </div>
              )}
            </section>

            <section className="mt-6">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Completed Appointments</h2>
              {completedAppointments.length > 0 ? (
                <div className="space-y-4">
                  {completedAppointments.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                            {initialsFromName(item.customer?.fullName)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{item.customer?.fullName ?? "Customer"}</h3>
                            <p className="text-sm text-slate-500">{item.service?.name ?? `Service #${item.serviceId ?? "N/A"}`}</p>
                          </div>
                        </div>
                        <div className="text-right text-xs font-semibold text-emerald-700">Completed</div>
                      </div>
                      <div className="mt-4 grid gap-2 border-t border-emerald-200 pt-3 text-sm text-slate-700 sm:grid-cols-2">
                        <div><span className="font-semibold text-slate-900">Date:</span> {toDateLabel(item.requestDate ?? item.createdAt)}</div>
                        <div><span className="font-semibold text-slate-900">Time:</span> {toTimeLabel(item.requestTime ?? item.appointment?.scheduledAt)}</div>
                      </div>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button type="button" onClick={() => setActiveReview(item)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600">
                          <MessageSquare className="h-4 w-4" /> Give Feedback
                        </button>
                        <button type="button" onClick={() => void skipFeedback(item)} className="flex flex-1 items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-200">
                          Skip Feedback
                        </button>
                      </div>
                      {item.appointment?.customerFeedback && (
                        <button type="button" onClick={() => setViewFeedbackId(viewFeedbackId === item.id ? null : item.id)} className="mt-2 flex w-full items-center justify-center rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600">
                          {viewFeedbackId === item.id ? "Hide Customer Feedback" : "View Feedback from Customer"}
                        </button>
                      )}
                      {viewFeedbackId === item.id && item.appointment?.customerFeedback && (
                        <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                          <div className="font-semibold text-amber-500">{"★".repeat(item.appointment.customerFeedback.rating)}{"☆".repeat(5 - item.appointment.customerFeedback.rating)}</div>
                          {item.appointment.customerFeedback.comment && <p className="mt-1">{item.appointment.customerFeedback.comment}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">No completed appointments awaiting feedback.</div>
              )}
            </section>

          </div>
        ) : (
          <div className="py-16 text-center text-slate-500">No appointments yet</div>
        )}
      </div>

      {activeReview && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Sparkles className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">Rate Customer Experience</h2>
              <p className="mt-1 text-sm text-slate-500">
                Share your experience with {activeReview.customer.fullName}.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {activeReview.customer.fullName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0] || "")
                    .join("")
                    .toUpperCase() || "CU"}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{activeReview.customer.fullName}</h3>
                  <p className="text-sm text-slate-500">{activeReview.service?.name ?? "Service"}</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-slate-700">How was the customer&apos;s behavior and cooperation?</p>
              <div className="mt-3 flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`rounded-full p-1.5 transition ${rating >= value ? "text-amber-400" : "text-slate-300"}`}
                  >
                    <Star className="h-8 w-8 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-sm font-medium text-slate-700">
                Your feedback about the customer (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience about the customer's cooperation, punctuality, behavior, etc..."
                className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActiveReview(null)}
                className="rounded-2xl bg-slate-100 px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={submitReview}
                disabled={busy}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {viewFeedback?.appointment?.customerFeedback && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setViewFeedback(null)}
              aria-label="Close customer feedback"
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-xl font-bold text-slate-900">Customer Feedback</h2>
            <p className="mt-1 text-sm text-slate-500">
              {viewFeedback.customer?.fullName ?? "Customer"} on {viewFeedback.service?.name ?? "Service"}
            </p>
            <div className="mt-5 border-t border-slate-100 pt-5">
              <p className="text-sm font-medium text-slate-500">Rating</p>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-7 w-7 ${
                      star <= (viewFeedback.appointment?.customerFeedback?.rating ?? 0)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
              {viewFeedback.appointment.customerFeedback.comment && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                  {viewFeedback.appointment.customerFeedback.comment}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setViewFeedback(null)}
              className="mt-6 w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white transition hover:bg-emerald-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
