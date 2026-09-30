"use client";

import { useState } from "react";
import { ChevronLeft, Sparkles, Star, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ServiceCompletedClient() {
  const searchParams = useSearchParams();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const customerName = searchParams.get("name") || "Ahmed Hassan";
  const serviceType = searchParams.get("service") || "Nikah";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    console.log("Feedback submitted:", { rating, feedback });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white px-4 py-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
          <div className="w-full rounded-[28px] bg-white p-6 text-center shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Thank You!</h1>
            <p className="mt-2 text-sm text-slate-500">Your feedback has been submitted successfully.</p>
            <Link
              href="/alim-dashboard"
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-[28px] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          <Link href="/alim-dashboard" className="inline-flex rounded-full p-2 text-slate-600 transition hover:bg-slate-100">
            <ChevronLeft className="h-6 w-6" />
          </Link>

          <div className="mt-3 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-500">
              <Sparkles className="h-8 w-8" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Rate Customer Experience</h1>
            <p className="mt-1 text-sm text-slate-500">
              Share your experience with {customerName} after the {serviceType} service.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {customerName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0] || "")
                  .join("")
                  .toUpperCase() || "CU"}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{customerName}</h3>
                <p className="text-sm text-slate-500">{serviceType}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5">
            <div>
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
              <label htmlFor="feedback" className="block text-sm font-medium text-slate-700">
                Your feedback about the customer (optional)
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience about the customer&apos;s cooperation, punctuality, behavior, etc..."
                className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500"
                rows={4}
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/alim-dashboard"
                className="rounded-2xl bg-slate-100 px-4 py-3 text-center font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Skip
              </Link>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
              >
                <Send className="h-4 w-4" />
                Submit Feedback
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
