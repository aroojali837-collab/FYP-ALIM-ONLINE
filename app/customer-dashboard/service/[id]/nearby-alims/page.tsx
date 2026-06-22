"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Clock,
  Eye,
  LocateFixed,
  MapPin,
  Navigation,
  Send,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";

type SortMode = "distance" | "rating";

type Alim = {
  id: number;
  name: string;
  initials: string;
  distance: string;
  rating: number;
  reviews: number;
  time: string;
  area: string;
  fiqh: string;
  experience: string;
  languages: string;
  bio: string;
};

const fallbackAlims: Alim[] = [
  {
    id: 1,
    name: "Mufti Ahmed Khan",
    initials: "MA",
    distance: "1.2 KM",
    rating: 4.9,
    reviews: 342,
    time: "10:00 AM - 2:00 PM",
    area: "Block 5, Clifton",
    fiqh: "Hanafi",
    experience: "12 years",
    languages: "Urdu, English",
    bio: "Specializes in Nikah, family guidance, and Quranic consultation.",
  },
  {
    id: 2,
    name: "Mufti Yusuf Ali",
    initials: "MY",
    distance: "2.1 KM",
    rating: 4.9,
    reviews: 523,
    time: "9:00 AM - 3:00 PM",
    area: "North Nazimabad",
    fiqh: "Hanafi",
    experience: "15 years",
    languages: "Urdu, Arabic",
    bio: "Known for service ceremonies, Islamic counselling, and local community support.",
  },
  {
    id: 3,
    name: "Molana Abdul Rahman",
    initials: "MA",
    distance: "2.5 KM",
    rating: 4.8,
    reviews: 289,
    time: "9:00 AM - 5:00 PM",
    area: "Gulshan-e-Iqbal",
    fiqh: "Shafi",
    experience: "9 years",
    languages: "Urdu, Sindhi",
    bio: "Provides Dua, Janaza, and Quran Khawani services with flexible scheduling.",
  },
  {
    id: 4,
    name: "Sheikh Muhammad Ali",
    initials: "SM",
    distance: "3.1 KM",
    rating: 4.7,
    reviews: 215,
    time: "11:00 AM - 4:00 PM",
    area: "Defence Phase 6",
    fiqh: "Hanbali",
    experience: "10 years",
    languages: "Urdu, English, Arabic",
    bio: "Experienced in formal ceremonies and Islamic guidance for families.",
  },
  {
    id: 5,
    name: "Qari Bilal Siddiqui",
    initials: "QB",
    distance: "4.4 KM",
    rating: 4.6,
    reviews: 178,
    time: "8:00 AM - 1:00 PM",
    area: "Saddar",
    fiqh: "Hanafi",
    experience: "8 years",
    languages: "Urdu, Punjabi",
    bio: "Offers Quran recitation, Dua gatherings, and appointment-based visits.",
  },
  {
    id: 6,
    name: "Molana Hamza Farooq",
    initials: "MH",
    distance: "4.8 KM",
    rating: 4.6,
    reviews: 164,
    time: "2:00 PM - 7:00 PM",
    area: "PECHS",
    fiqh: "Maliki",
    experience: "7 years",
    languages: "Urdu, English",
    bio: "Available for household services and short-notice Islamic guidance.",
  },
  {
    id: 7,
    name: "Mufti Saad Qureshi",
    initials: "MS",
    distance: "4.9 KM",
    rating: 4.5,
    reviews: 141,
    time: "12:00 PM - 6:00 PM",
    area: "Bahadurabad",
    fiqh: "Hanafi",
    experience: "6 years",
    languages: "Urdu",
    bio: "Focuses on service requests, counselling, and Quranic recitation events.",
  },
  {
    id: 8,
    name: "Allama Noman Raza",
    initials: "AN",
    distance: "5.0 KM",
    rating: 4.5,
    reviews: 126,
    time: "3:00 PM - 8:00 PM",
    area: "Tariq Road",
    fiqh: "Shafi",
    experience: "11 years",
    languages: "Urdu, Arabic",
    bio: "Serves community events, Nikah ceremonies, and religious Q&A sessions.",
  },
];

export default function NearbyAlimsPage() {
  const params = useParams();
  const serviceId = Number(params.id);
  const [sortMode, setSortMode] = useState<SortMode>("distance");
  const [alims, setAlims] = useState<Alim[]>(fallbackAlims);
  const [selectedAlimId, setSelectedAlimId] = useState(fallbackAlims[0].id);
  const [detailsAlim, setDetailsAlim] = useState<Alim | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadAlims() {
      try {
        setErrorMessage("");
        const response = await fetch(`/api/alims?sort=${sortMode}`);
        const data = (await response.json()) as { alims?: Alim[]; error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load nearby Alims");
        }

        if (!ignore && data.alims?.length) {
          setAlims(data.alims);
          setSelectedAlimId((currentId) =>
            data.alims?.some((alim) => alim.id === currentId)
              ? currentId
              : data.alims?.[0]?.id ?? currentId,
          );
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load nearby Alims",
          );
          setAlims(fallbackAlims);
        }
      }
    }

    loadAlims();

    return () => {
      ignore = true;
    };
  }, [sortMode]);

  const selectedAlim = alims.find((alim) => alim.id === selectedAlimId);

  const handleSendRequest = async () => {
    if (!selectedAlim) {
      return;
    }

    try {
      setIsSending(true);
      setErrorMessage("");

      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alimId: selectedAlim.id,
          serviceId,
          fiqh: selectedAlim.fiqh,
          locationAddress: "Selected customer location",
          latitude: 30.776453,
          longitude: 70.957031,
          requestDate: "2026-05-01",
          requestTime: "15:00:00",
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send request");
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
              <p className="text-xs text-gray-500">Within 5 KM of Your Location</p>
            </div>
          </div>
        </header>

        <section className="bg-white">
          <div className="relative mx-auto flex h-44 max-w-2xl items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 via-emerald-200 to-teal-100">
            <div className="absolute right-4 top-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow">
              5 KM Range
            </div>
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-emerald-500 bg-white text-emerald-600 shadow-sm">
                <Navigation className="h-8 w-8 fill-current" />
              </div>
              <div className="-mt-1 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                Your Location
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-2xl px-4 py-6 pb-36">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                Sort By:
              </div>
              <span className="text-sm text-gray-500">{alims.length} Alims Found</span>
            </div>
            {errorMessage && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}
            <div className="mt-4 grid max-w-md grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSortMode("distance")}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${
                  sortMode === "distance"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <MapPin className="h-4 w-4" />
                Distance
              </button>
              <button
                type="button"
                onClick={() => setSortMode("rating")}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${
                  sortMode === "rating"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <Star className="h-4 w-4" />
                Rating
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-3">
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
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600 shadow">
                        {alim.initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-bold leading-snug text-gray-950">{alim.name}</span>
                        <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                            <LocateFixed className="h-4 w-4" />
                            {alim.distance}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            {alim.rating} ({alim.reviews})
                          </span>
                        </span>
                        <span className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {alim.time}
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
                  </div>
                </article>
              );
            })}
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
              <p className="text-lg font-bold text-gray-950">{selectedAlim?.name}</p>
            </div>
            <button
              type="button"
              onClick={handleSendRequest}
              disabled={isSending}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-10 py-4 text-sm font-bold transition sm:w-auto ${
                requestSent || isSending
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
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
            <section className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-base font-bold text-slate-700">
                    {detailsAlim.initials}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-950">{detailsAlim.name}</h2>
                    <p className="text-sm text-gray-500">{detailsAlim.area}</p>
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

              <div className="grid gap-3 text-sm sm:grid-cols-4">
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
                  <span className="font-semibold text-gray-950">Available:</span> {detailsAlim.time}
                </p>
                <p>
                  <span className="font-semibold text-gray-950">Languages:</span> {detailsAlim.languages}
                </p>
                <p>{detailsAlim.bio}</p>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
