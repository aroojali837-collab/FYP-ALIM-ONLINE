"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Eye,
  MapPin,
  LocateFixed,
  Send,
  SlidersHorizontal,
  Search,
  Star,
  X,
  Heart,
  CalendarDays,
} from "lucide-react";


type Alim = {
  id: number;
  name: string;
  initials: string;
  avatarUrl?: string | null;
  distance: string;
  distanceKm?: number | null;
  searchRadiusKm?: number;
  isWithinSearchRadius?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  rating: number;
  reviews: number;
  time: string;
  area: string;
  fiqh: string;
  experience: string;
  languages: string;
  bio: string;
  qualification?: string | null;
  availability?: { id: number; day: string; startTime: string; endTime: string; isRecurring: boolean }[];
  reviewsList?: { rating: number; comment?: string | null; createdAt: string }[];
};

type SearchMode = "range" | "rating" | "out-of-range";
const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function NearbyAlimsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serviceId = Number(params.id);
  const fiqh = searchParams.get("fiqh") ?? "";
  const location = searchParams.get("location") ?? "";
  const requestDate = searchParams.get("requestDate") ?? "";
  const requestTime = searchParams.get("requestTime") ?? "";
  const recurrenceType = searchParams.get("recurrenceType") ?? "one-time";
  const recurrenceDay = searchParams.get("recurrenceDay") ?? "";
  const recurrenceDate = searchParams.get("recurrenceDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const latitude = searchParams.get("latitude") ?? "";
  const longitude = searchParams.get("longitude") ?? "";
  const [nameQuery, setNameQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("range");
  const [alims, setAlims] = useState<Alim[]>([]);
  const [selectedAlimId, setSelectedAlimId] = useState<number | null>(null);
  const [detailsAlim, setDetailsAlim] = useState<Alim | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;
    const customerId = user?.id ?? user?.userId;
    if (!customerId) return;
    void fetch(`/api/favorites?customerId=${customerId}`)
      .then((response) => response.ok ? response.json() : [])
      .then((items: { alimId: number }[]) => setFavoriteIds(items.map((item) => item.alimId)))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!detailsAlim) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailsAlim(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [detailsAlim]);

  useEffect(() => {
    let ignore = false;

    async function loadAlims() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const query = new URLSearchParams({
          sort: searchMode === "rating" ? "rating" : "distance",
          latitude,
          longitude,
          serviceId: String(serviceId),
          fiqh,
          location,
          requestDate: searchMode === "out-of-range" ? "" : requestDate,
          requestTime: searchMode === "out-of-range" ? "" : requestTime,
          outOfRange: String(searchMode === "out-of-range"),
          // Rating mode mein range restriction nahi lagti; results rating ke order mein aate hain.
          includeOutOfRange: String(searchMode !== "range"),
          name: nameQuery,
        });
        const response = await fetch(`/api/alims?${query.toString()}`);
        const text = await response.text();
        let data: { alims?: Alim[]; error?: string } = {};

        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Backend returned non-JSON response while loading alims.");
        }

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load nearby Alims");
        }

        if (!ignore) {
          const realAlims = data.alims ?? [];
          setAlims(realAlims);
          setSelectedAlimId((currentId) =>
            realAlims.some((alim) => alim.id === currentId)
              ? currentId
              : realAlims[0]?.id ?? null,
          );
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load nearby Alims",
          );
          setAlims([]);
          setSelectedAlimId(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadAlims();

    return () => {
      ignore = true;
    };
  }, [fiqh, location, requestDate, requestTime, serviceId, nameQuery, latitude, longitude, searchMode]);

  const toggleFavorite = async (alimId: number) => {
    const raw = localStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;
    const customerId = user?.id ?? user?.userId;
    if (!customerId) return;
    const isFavorite = favoriteIds.includes(alimId);
    const response = await fetch(`/api/favorites/${alimId}${isFavorite ? `?customerId=${customerId}` : ""}`, {
      method: isFavorite ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: isFavorite ? undefined : JSON.stringify({ customerId }),
    });
    if (response.ok) setFavoriteIds((current) => isFavorite ? current.filter((id) => id !== alimId) : [...current, alimId]);
  };

  const selectedAlim = alims.find((alim) => alim.id === selectedAlimId);

  const handleSendRequest = async () => {
    if (!selectedAlim) {
      setErrorMessage("Please select an Alim first.");
      return;
    }

      try {
        setIsSending(true);
        setErrorMessage("");

        const userRaw = localStorage.getItem("user");
        const user = userRaw ? JSON.parse(userRaw) : null;

        const customerId = user?.id ?? user?.userId;

        if (!customerId) {
          throw new Error("Please login as a customer before sending a request.");
        }

        const response = await fetch("/api/service-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
          customerId,
          alimId: selectedAlim.id,
          serviceId,
          fiqh: selectedAlim.fiqh,
          locationAddress: location,
          latitude: Number(latitude),
          longitude: Number(longitude),
          requestDate,
          requestTime,
          isRecurring: recurrenceType !== "one-time",
          recurrenceType,
          recurrenceDay: recurrenceDay ? Number(recurrenceDay) : undefined,
          recurrenceDate: recurrenceDate ? Number(recurrenceDate) : undefined,
          startDate: requestDate,
          endDate: endDate || undefined,
        }),
        });

      const responseText = await response.text();
      let data: { error?: string } = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        data = {};
      }

      if (!response.ok) {
        const backendMessage = data.error ?? responseText.trim().slice(0, 180);
        throw new Error(backendMessage || `Failed to send request (HTTP ${response.status})`);
      }

      setRequestSent(true);
      window.setTimeout(() => setRequestSent(false), 3200);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to send request",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
            <Link href={`/customer-dashboard/service/${serviceId}`} aria-label="Back to service request">
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-950">Nearby Alims</h1>
              <p className="text-xs text-gray-500">Nearby and other available Aalims</p>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-6 pb-36">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                Available Alims
              </div>
              <span className="text-sm text-gray-500">
                {isLoading ? "Loading Alims..." : `${alims.length} Alims Found`}
              </span>
            </div>
            {errorMessage && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={() => setSearchMode("range")} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold ${searchMode === "range" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                <MapPin className="h-4 w-4" /> Alim Range
              </button>
              <button type="button" onClick={() => setSearchMode("rating")} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold ${searchMode === "rating" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                <Star className="h-4 w-4" /> Rating Based
              </button>
              <button type="button" onClick={() => setSearchMode("out-of-range")} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold ${searchMode === "out-of-range" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                Out of Range Search
              </button>
            </div>
            <label className="relative mt-4 block max-w-md">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} placeholder="Search Aalim by name" className="w-full rounded-lg border border-gray-200 py-3 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
            </label>
          </div>

          <div className="mt-5 space-y-3">
            {!isLoading && alims.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm font-medium text-gray-600 shadow-sm">
                {searchMode === "out-of-range"
                  ? "Is Fiqh aur service ke liye koi Aalim assigned nahi mila. Service ya Fiqh check karein."
                  : searchMode === "rating"
                    ? "Is selected service, Fiqh aur time par koi Aalim available nahi. Date/time change karein ya Out of Range Search try karein."
                    : "Is selected time par Aalim ki range mein koi available nahi. Date/time change karein ya Out of Range Search try karein."}
              </div>
            )}
            {alims.length > 0 && (
              <section className="space-y-3">
                {alims.map((alim, index) => {
              const isSelected = selectedAlimId === alim.id;

              return (
                <article
                  key={alim.id}
                  className={`rounded-xl border bg-white p-5 shadow-sm transition ${
                    isSelected ? "border-emerald-400 ring-2 ring-emerald-100" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedAlimId(alim.id)}
                      className="flex min-w-0 flex-1 items-start gap-4 text-left"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
                        {index + 1}
                      </span>
                      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-bold text-slate-600 shadow">
                        {alim.avatarUrl ? (
                          <Image src={alim.avatarUrl} alt={`${alim.name} profile`} width={48} height={48} unoptimized className="h-full w-full object-cover" />
                        ) : alim.initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-bold leading-snug text-gray-950">{alim.name}</span>
                        <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                            <LocateFixed className="h-4 w-4" /> {alim.distance}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            {alim.rating} ({alim.reviews})
                          </span>
                        </span>
                        <span className="mt-1 block text-sm text-gray-500">{alim.area}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailsAlim(alim)}
                      aria-label={`View ${alim.name} details`}
                      className="rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button type="button" onClick={() => void toggleFavorite(alim.id)} aria-label={`${favoriteIds.includes(alim.id) ? "Remove" : "Add"} ${alim.name} favorite`} className="rounded-full p-2 text-rose-500 hover:bg-rose-50">
                      <Heart className={`h-5 w-5 ${favoriteIds.includes(alim.id) ? "fill-current" : ""}`} />
                    </button>
                  </div>
                </article>
                );
                })}
              </section>
            )}
          </div>
        </main>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 px-4 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
          {requestSent && (
            <div className="mx-auto mb-3 max-w-2xl rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                Request sent to {selectedAlim?.name}.
            </div>
          )}
          <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-gray-500">Selected Alim</p>
              <p className="text-lg font-bold text-gray-950">{selectedAlim?.name ?? "No Alim selected"}</p>
            </div>
            <button
              type="button"
              onClick={handleSendRequest}
              disabled={isSending || !selectedAlim}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-10 py-4 text-sm font-bold transition sm:w-auto ${
                requestSent || isSending || !selectedAlim
                  ? "bg-gray-200 text-gray-500"
                  : "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
              }`}
            >
              <Send className="h-5 w-5" />
              {isSending ? "Sending..." : requestSent ? "Request Sent" : "Send Request"}
            </button>
          </div>
        </div>

        {detailsAlim && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 px-2 py-3 backdrop-blur-sm sm:items-center sm:px-4 sm:py-5">
            <section role="dialog" aria-modal="true" aria-labelledby="alim-profile-title" className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-3xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-200 text-base font-bold text-slate-700">
                    {detailsAlim.avatarUrl ? (
                      <Image src={detailsAlim.avatarUrl} alt={`${detailsAlim.name} profile`} width={64} height={64} unoptimized className="h-full w-full object-cover" />
                    ) : detailsAlim.initials}
                  </div>
                  <div className="min-w-0">
                    <h2 id="alim-profile-title" className="text-lg font-bold leading-tight text-gray-950 sm:text-xl">{detailsAlim.name}</h2>
                    <p className="mt-1 text-sm text-gray-500">{detailsAlim.qualification || "Islamic Scholar / Aalim"}</p>
                    <p className="mt-1 text-sm text-gray-500">{detailsAlim.area}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsAlim(null)}
                  aria-label="Close Alim details"
                  className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 sm:gap-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Distance</p>
                  <p className="mt-1 font-bold text-gray-950">{detailsAlim.distance}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Rating</p>
                  <p className="mt-1 font-bold text-gray-950">
                    {detailsAlim.rating} ({detailsAlim.reviews})
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Fiqh</p>
                  <p className="mt-1 font-bold text-gray-950">{detailsAlim.fiqh}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Experience</p>
                  <p className="mt-1 font-bold text-gray-950">{detailsAlim.experience}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <p>
                  <span className="font-semibold text-gray-950">Languages:</span> {detailsAlim.languages}
                </p>
                <p>{detailsAlim.bio}</p>
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-900">
                  <p className="flex items-center gap-2 font-semibold"><CalendarDays className="h-4 w-4" />Weekly availability</p>
                  <div className="mt-2 divide-y divide-emerald-100 rounded-lg bg-white/70">
                    {weekDays.map((day) => {
                      const slots = detailsAlim.availability?.filter((slot) => slot.day === day) ?? [];
                      return (
                        <div key={day} className="grid grid-cols-1 gap-1 px-3 py-2 text-xs sm:grid-cols-[minmax(100px,0.8fr)_1fr] sm:gap-3">
                          <p className="font-semibold text-emerald-900">{day}</p>
                          <div className="space-y-1 text-gray-700">
                            {slots.length > 0 ? slots.map((slot) => <p key={slot.id}>{slot.startTime} - {slot.endTime}</p>) : <p className="text-gray-400">Not available</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-bold text-gray-950">Reviews</h3>
                    {detailsAlim.reviewsList?.length ? (
                      <div className="mt-3 space-y-3">
                        {detailsAlim.reviewsList.map((review, index) => (
                          <div key={`${review.createdAt}-${index}`} className="rounded-xl bg-gray-50 p-3">
                            <div className="font-semibold text-amber-500">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
                            {review.comment && <p className="mt-1 text-sm text-gray-700">{review.comment}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">No reviews yet.</p>
                    )}
                  </div>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setDetailsAlim(null)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
                <button type="button" onClick={() => { setSelectedAlimId(detailsAlim.id); setDetailsAlim(null); }} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Select this Alim</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
