"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Loader2,
  Star,
  Send,
  MessageSquare,
  Clock3,
  CheckCircle2,
  Calendar,
  MapPin,
  User,
  Hourglass,
  Eye,
  X,
} from "lucide-react";
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

interface FeedbackSummary {
  rating: number;
  comment?: string | null;
  createdAt: string;
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
  alimFeedback?: FeedbackSummary | null;
  customerFeedback?: FeedbackSummary | null;
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

type FilterType = "all" | "pending" | "accepted" | "completed";

function toDateLabel(value?: string | null) {
  if (!value) return "N/A";

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-CA");
}

function toTimeLabel(value?: string | null) {
  if (!value) return "N/A";

  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

function getInitials(name?: string | null) {
  if (!name) return "AL";

  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AL"
  );
}

function isAcceptedStatus(status: string) {
  return ["accepted", "confirmed", "in_progress"].includes(
    status.toLowerCase()
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeReview, setActiveReview] = useState<RequestItem | null>(null);
  const [viewFeedback, setViewFeedback] = useState<RequestItem | null>(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [nowTick, setNowTick] = useState(() => Date.now());

  const [activeFilter, setActiveFilter] =
    useState<FilterType>("all");

  const completedTriggeredRef = useRef(new Set<number>());

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);

      const userRaw = localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;

      const customerId = user?.id ?? user?.userId;

      if (!customerId) {
        setAppointments([]);
        return;
      }

      const response = await fetch(
        `/api/service-requests?customerId=${customerId}`
      );

      const text = await response.text();
      const data = text ? JSON.parse(text) : [];

      if (!response.ok) {
        throw new Error(
          data?.error ?? "Unable to load appointments"
        );
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
    const interval = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const completeAppointment = useCallback(
    async (appointmentId: number) => {
      if (completedTriggeredRef.current.has(appointmentId)) {
        return;
      }

      completedTriggeredRef.current.add(appointmentId);

      try {
        await fetch(`/api/appointments/${appointmentId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "completed",
          }),
        });

        await loadAppointments();
      } catch {
        // refresh will retry later
      }
    },
    [loadAppointments]
  );

  useEffect(() => {
    for (const item of appointments) {
      const appointment = item.appointment;

      if (!appointment?.id || appointment.isFinished) {
        continue;
      }

      let remainingMs: number | null = null;

      try {
        if (appointment.endsAt) {
          remainingMs =
            new Date(appointment.endsAt).getTime() - nowTick;
        } else if (
          appointment.scheduledAt &&
          appointment.durationMinutes
        ) {
          const start = new Date(
            appointment.scheduledAt
          ).getTime();

          remainingMs =
            start +
            appointment.durationMinutes * 60000 -
            nowTick;
        }
      } catch {
        remainingMs = null;
      }

      if (
        remainingMs !== null &&
        remainingMs <= 0 &&
        !completedTriggeredRef.current.has(appointment.id)
      ) {
        void completeAppointment(appointment.id);
      }
    }
  }, [appointments, nowTick, completeAppointment]);

  const getFilteredAppointments = () => {
    return appointments.filter((item) => {
      if (activeFilter === "completed") {
        return (
          item.appointment?.isFinished ||
          item.status.toLowerCase() === "completed"
        );
      }

      if (activeFilter === "accepted") {
        return (
          isAcceptedStatus(item.status) &&
          item.appointment?.status?.toLowerCase() !== "completed"
        );
      }

      if (activeFilter === "pending") {
        return item.status.toLowerCase() === "pending";
      }

      return true;
    });
  };

  const filteredAppointments = getFilteredAppointments();

  const pendingCount = appointments.filter(
    (item) => item.status.toLowerCase() === "pending"
  ).length;

  const acceptedCount = appointments.filter(
    (item) =>
      isAcceptedStatus(item.status) &&
      item.appointment?.status?.toLowerCase() !== "completed"
  ).length;

  const completedCount = appointments.filter(
    (item) =>
      item.appointment?.isFinished ||
      item.status.toLowerCase() === "completed"
  ).length;

  const submitReview = async () => {
    if (!activeReview?.alimId || !activeReview?.appointment?.id) {
      return;
    }

    try {
      setBusy(true);
      setMessage("");

      const userRaw = localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;

      const customerId = user?.id ?? user?.userId;

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewerId: customerId,
          customerId,
          revieweeId: activeReview.alimId,
          alimId: activeReview.alimId,
          appointmentId: activeReview.appointment.id,
          rating,
          comment,
        }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(
          data?.error ?? "Unable to submit review"
        );
      }

      setActiveReview(null);
      setComment("");
      setRating(5);

      setMessage("Feedback submitted successfully.");

      await loadAppointments();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit review"
      );
    } finally {
      setBusy(false);
    }
  };

  const getRemainingTime = (
    item: RequestItem
  ): string | null => {
    const appointment = item.appointment;

    if (!appointment || !isAcceptedStatus(item.status)) {
      return null;
    }

    let remainingMs: number | null = null;

    try {
      if (appointment.endsAt) {
        remainingMs =
          new Date(appointment.endsAt).getTime() -
          nowTick;
      } else if (
        appointment.scheduledAt &&
        appointment.durationMinutes
      ) {
        const start = new Date(
          appointment.scheduledAt
        ).getTime();

        remainingMs =
          start +
          appointment.durationMinutes * 60000 -
          nowTick;
      }
    } catch {
      remainingMs = null;
    }

    if (remainingMs !== null && remainingMs > 0) {
      return formatCountdown(remainingMs);
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] pb-20 text-slate-800">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-3">
          <Link
            href="/customer-dashboard"
            className="mr-3 flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-slate-100"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </Link>

          <div>
            <h1 className="text-[17px] font-bold leading-tight text-slate-900">
              My Appointments
            </h1>

            <p className="mt-0.5 text-[10px] text-slate-500">
              {pendingCount} pending • {acceptedCount} accepted •{" "}
              {completedCount} completed
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl">
        {/* FILTER TABS */}
        <div className="border-b border-slate-200 bg-white">
          <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-thin">
            {(
              [
                ["all", "All", appointments.length],
                ["pending", "Pending", pendingCount],
                ["accepted", "Accepted", acceptedCount],
                ["completed", "Completed", completedCount],
              ] as const
            ).map(([value, label, count]) => {
              const active = activeFilter === value;

              let activeClass = "bg-emerald-500 text-white";

              if (value === "pending") {
                activeClass = "bg-amber-500 text-white";
              }

              if (value === "accepted") {
                activeClass = "bg-blue-500 text-white";
              }

              if (value === "completed") {
                activeClass = "bg-emerald-500 text-white";
              }

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setActiveFilter(value)
                  }
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${
                    active
                      ? `${activeClass} shadow-sm`
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          {/* SMALL SCROLL INDICATOR LIKE SCREENSHOT */}
          <div className="mx-4 mb-1 h-[5px] overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full bg-slate-500 transition-all ${
                activeFilter === "all"
                  ? "w-1/4"
                  : activeFilter === "pending"
                  ? "w-2/4"
                  : activeFilter === "accepted"
                  ? "w-3/4"
                  : "w-full"
              }`}
            />
          </div>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className="mx-4 mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
            {message}
          </div>
        )}

        {/* APPOINTMENTS */}
        <div className="space-y-3 px-3 py-4">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" />
              <p className="mt-2 text-xs text-slate-400">
                Loading appointments...
              </p>
            </div>
          ) : filteredAppointments.length > 0 ? (
            filteredAppointments.map((item) => {
              const appointment = item.appointment;

              const isFinished =
                appointment?.isFinished ||
                item.status.toLowerCase() ===
                  "completed";

              const isPending =
                item.status.toLowerCase() ===
                "pending";

              const isAccepted =
                isAcceptedStatus(item.status);

              const countdown =
                getRemainingTime(item);

              const canReview =
                isFinished &&
                !appointment?.customerReviewed;

              const alimName =
                item.alim?.fullName ??
                `Alim #${item.alimId ?? "N/A"}`;

              const serviceName =
                item.service?.name ??
                `Service #${item.serviceId ?? "N/A"}`;

              return (
                <div
                  key={item.id}
                  className={`overflow-hidden rounded-xl border shadow-sm ${
                    isFinished
                      ? "border-emerald-200 bg-[#effcf5]"
                      : isPending
                      ? "border-amber-200 bg-[#fff9e9]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {/* CARD HEADER */}
                  <div className="flex items-start justify-between px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                          isFinished
                            ? "bg-emerald-500"
                            : isPending
                            ? "bg-amber-500"
                            : "bg-blue-500"
                        }`}
                      >
                        {getInitials(
                          item.alim?.fullName
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-bold text-slate-900">
                          {alimName}
                        </h3>

                        <span
                          className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[8px] font-semibold ${
                            isFinished
                              ? "bg-emerald-100 text-emerald-700"
                              : isPending
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {serviceName}
                        </span>
                      </div>
                    </div>

                    {/* STATUS */}
                    <div className="ml-2 shrink-0 text-right">
                      {isFinished ? (
                        <>
                          <div className="flex items-center justify-end gap-1 text-[10px] font-semibold text-emerald-500">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Completed
                          </div>

                          <p className="mt-1 text-[8px] text-slate-400">
                            Service completed
                          </p>
                        </>
                      ) : countdown ? (
                        <>
                          <div className="rounded-md bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-600">
                            {countdown}
                          </div>

                          <p className="mt-1 text-[8px] text-slate-400">
                            Time left
                          </p>
                        </>
                      ) : (
                        <>
                          <div
                            className={`flex items-center justify-end gap-1 text-[10px] font-semibold ${
                              isPending
                                ? "text-amber-500"
                                : "text-blue-500"
                            }`}
                          >
                            <Clock3 className="h-3 w-3" />
                            {isPending
                              ? "Pending"
                              : "Accepted"}
                          </div>

                          <p className="mt-1 text-[8px] text-slate-400">
                            {isPending
                              ? "Waiting for acceptance"
                              : "Upcoming service"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* DIVIDER */}
                  <div className="mx-4 border-t border-slate-200/70" />

                  {/* INFO */}
                  <div className="grid grid-cols-1 gap-2 px-4 py-3 text-[9px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-slate-400" />

                      <span>
                        {toDateLabel(
                          item.requestDate ??
                            item.createdAt
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock3 className="h-3 w-3 text-slate-400" />

                      <span>
                        {toTimeLabel(
                          item.requestTime ??
                            appointment?.scheduledAt
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-slate-400" />

                      <span>
                        {item.location ??
                          item.customer?.city ??
                          "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* PENDING */}
                  {isPending && (
                    <div className="mx-3 mb-3 flex items-center justify-center gap-1.5 rounded-lg bg-amber-100 px-3 py-2 text-[9px] font-semibold text-amber-700">
                      <Hourglass className="h-3 w-3" />
                      Waiting for Alim to accept
                    </div>
                  )}

                  {/* COMPLETED ACTIONS */}
                  {isFinished && (
                    <div className="space-y-2 px-3 pb-3">
                      {canReview ? (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveReview(item)
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Give Feedback
                        </button>
                      ) : appointment?.customerReviewed ? (
                        <button
                          type="button"
                          onClick={() =>
                            setViewFeedback(item)
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 py-2.5 text-[10px] font-semibold text-slate-500"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Your Feedback
                        </button>
                      ) : (
                        <div className="flex w-full items-center justify-center rounded-lg bg-slate-100 py-2.5 text-[10px] font-semibold text-slate-400">
                          Feedback not available yet
                        </div>
                      )}
                      
                      {appointment?.alimFeedback ? (
                        <button
                          type="button"
                          onClick={() =>
                            setViewFeedback(item)
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 py-2.5 text-[10px] font-semibold text-yellow-50 shadow-sm transition hover:bg-blue-600"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Feedback from Alim
                        </button>
                        
                      ) : (
                        <div className="flex w-full items-center justify-center rounded-lg bg-slate-100 py-2.5 text-[10px] font-semibold text-slate-400">
                          Waiting for Alim feedback
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
              <Calendar className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-600">
                No appointments yet
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                Your appointments will appear here.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* REVIEW MODAL */}
      {activeReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* SUCCESS ICON */}
            <div className="pt-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <h2 className="mt-3 text-[16px] font-bold text-slate-900">
                Service Completed!
              </h2>

              <p className="mx-auto mt-1 max-w-[260px] text-[10px] leading-4 text-slate-500">
                Your {activeReview.service?.name ?? "service"}{" "}
                service with{" "}
                {activeReview.alim?.fullName ?? "the Alim"}{" "}
                has been completed.
              </p>
            </div>

            {/* RATING */}
            <div className="px-5 pt-5">
              <p className="text-center text-[10px] font-medium text-slate-600">
                How was your experience?
              </p>

              <div className="mt-3 flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setRating(value)
                    }
                    className="p-1"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        rating >= value
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* COMMENT */}
            <div className="px-5 pt-4">
              <label className="text-[10px] font-medium text-slate-600">
                Share your feedback (optional)
              </label>

              <textarea
                value={comment}
                onChange={(e) =>
                  setComment(e.target.value)
                }
                placeholder="Tell us about your experience with the Alim..."
                className="mt-2 h-20 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[10px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-400"
              />
            </div>

            {/* BUTTONS */}
            <div className="grid grid-cols-2 gap-2.5 px-5 pb-5 pt-4">
              <button
                type="button"
                onClick={() =>
                  setActiveReview(null)
                }
                className="rounded-lg bg-slate-100 py-2.5 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-200"
              >
                Skip
              </button>

              <button
                type="button"
                onClick={submitReview}
                disabled={busy}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2.5 text-[10px] font-semibold text-white transition hover:bg-emerald-600 disabled:bg-slate-300"
              >
                {busy ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}

                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK VIEW MODAL */}
      {viewFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() =>
                setViewFeedback(null)
              }
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="pt-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <h2 className="mt-3 text-[16px] font-bold text-slate-900">
                Service Feedback
              </h2>

              <p className="mt-1 text-[10px] text-slate-500">
                Your feedback for{" "}
                {viewFeedback.alim?.fullName ??
                  "the Alim"}
              </p>
            </div>

            <div className="px-5 pb-6 pt-5">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                    {getInitials(
                      viewFeedback.alim?.fullName
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-slate-800">
                      {viewFeedback.alim?.fullName ??
                        "Alim"}
                    </p>

                    <p className="text-[9px] text-slate-400">
                      {viewFeedback.service?.name ??
                        "Service"}
                    </p>
                  </div>
                </div>
              </div>

              {viewFeedback.appointment
                ?.customerFeedback && (
                <div className="mt-4">
                  <p className="text-[10px] text-slate-500">
                    Your Rating
                  </p>

                  <div className="mt-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map(
                      (star) => (
                        <Star
                          key={star}
                          className={`h-6 w-6 ${
                            star <=
                            (viewFeedback.appointment?.customerFeedback
                              ?.rating ?? 0)
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      )
                    )}
                  </div>

                  {viewFeedback.appointment
                    .customerFeedback.comment && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-[10px] leading-4 text-slate-600">
                        {
                          viewFeedback.appointment
                            .customerFeedback.comment
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {viewFeedback.appointment
                ?.alimFeedback && (
                <div className="mt-4">
                  <p className="text-[10px] text-slate-500">
                    Alim&apos;s Rating
                  </p>

                  <div className="mt-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map(
                      (star) => (
                        <Star
                          key={star}
                          className={`h-6 w-6 ${
                            star <=
                            (viewFeedback.appointment?.alimFeedback
                              ?.rating ?? 0)
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      )
                    )}
                  </div>

                  {viewFeedback.appointment
                    .alimFeedback.comment && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-[10px] leading-4 text-slate-600">
                        {
                          viewFeedback.appointment
                            .alimFeedback.comment
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  setViewFeedback(null)
                }
                className="mt-5 w-full rounded-lg bg-slate-100 py-2.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}