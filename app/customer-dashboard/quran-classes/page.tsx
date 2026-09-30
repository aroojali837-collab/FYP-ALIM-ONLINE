"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, GraduationCap, MapPin, Phone, Search, UserRound } from "lucide-react";

const LocationMap = dynamic(() => import("@/app/customer-dashboard/service/[id]/LocationMap"), { ssr: false });
type Teacher = { id: number; fullName: string; email: string; phone?: string | null; avatarUrl?: string | null; education?: string | null; city?: string | null; area?: string | null; bio?: string | null; experienceYears?: number | null; latitude?: number | null; longitude?: number | null; distanceKm?: number | null; availability?: { weekday: number; startTime: string; endTime: string }[] };
type FormState = { fullName: string; age: string; phone: string; location: string; latitude: number | null; longitude: number | null; notes: string };

const days = [[0, "Sunday"], [1, "Monday"], [2, "Tuesday"], [3, "Wednesday"], [4, "Thursday"], [5, "Friday"], [6, "Saturday"]] as const;

function getMatchingDays(teacher: Teacher, selectedDays: number[], time: string) {
  return selectedDays.filter((day) => teacher.availability?.some((slot) => slot.weekday === day && slot.startTime.slice(0, 5) <= time && slot.endTime.slice(0, 5) >= time));
}

export default function QuranClassesPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [radiusKm, setRadiusKm] = useState(25);
  const [scheduleDays, setScheduleDays] = useState<number[]>([1]);
  const [scheduleTime, setScheduleTime] = useState("18:00");
  const [selected, setSelected] = useState<Teacher | null>(null);
  const [message, setMessage] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [form, setForm] = useState<FormState>(() => {
    if (typeof window === "undefined") return { fullName: "", age: "", phone: "", location: "", latitude: null, longitude: null, notes: "" };
    const raw = localStorage.getItem("user"); const user = raw ? JSON.parse(raw) : null;
    return { fullName: user?.fullName ?? "", age: user?.age?.toString() ?? "", phone: user?.phoneNumber ?? user?.phone ?? "", location: "", latitude: null, longitude: null, notes: "" };
  });

  useEffect(() => {
    if (!hasSearched || form.latitude === null || form.longitude === null) return;
    let ignore = false;
    const load = async () => {
      setIsSearching(true); setSearchError("");
      try {
        const query = new URLSearchParams({ latitude: String(form.latitude), longitude: String(form.longitude), radiusKm: String(radiusKm), time: scheduleTime });
        scheduleDays.forEach((day) => query.append("days", String(day)));
        const response = await fetch(`/api/quran/teachers?${query}`); const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "Unable to search Quran teachers.");
        if (!ignore) setTeachers(Array.isArray(data) ? data : []);
      } catch (error) { if (!ignore) { setTeachers([]); setSearchError(error instanceof Error ? error.message : "Unable to search Quran teachers."); } }
      finally { if (!ignore) setIsSearching(false); }
    };
    void load(); return () => { ignore = true; };
  }, [hasSearched, form.latitude, form.longitude, radiusKm, scheduleDays, scheduleTime]);

  const searchTeachers = () => {
    if (form.latitude === null || form.longitude === null) { setSearchError("Please select your location on the map first."); return; }
    if (scheduleDays.length === 0) { setSearchError("Please select at least one day."); return; }
    setHasSearched(true);
  };

  const enroll = async () => {
    const raw = localStorage.getItem("user"); const user = raw ? JSON.parse(raw) : null; const studentId = user?.id ?? user?.userId;
    if (!studentId || !selected || !form.fullName.trim() || !form.age || !form.phone.trim() || form.latitude === null || form.longitude === null) { setMessage("Please enter name, age, phone and select your map location."); return; }
    const matchedDay = getMatchingDays(selected, scheduleDays, scheduleTime)[0];
    if (matchedDay === undefined) { setMessage("This teacher is no longer available for your selected days and time."); return; }
    const response = await fetch("/api/quran/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, teacherId: selected.id, studentAge: Number(form.age), location: form.location, latitude: form.latitude, longitude: form.longitude, scheduleDay: matchedDay, scheduleTime, notes: form.notes }) });
    setMessage(response.ok ? "Request sent. The Quran teacher will review it." : "Unable to send enrollment request."); if (response.ok) setSelected(null);
  };

  const nearby = teachers.filter((teacher) => teacher.distanceKm !== null && teacher.distanceKm !== undefined && teacher.distanceKm <= radiusKm);
  const other = teachers.filter((teacher) => !nearby.some((item) => item.id === teacher.id));
  const groups = [{ title: "Nearby Quran Teachers", list: nearby }, { title: "Other Available Quran Teachers", list: other }];

  return <main className="min-h-screen bg-green-50 px-4 py-8"><div className="mx-auto max-w-2xl space-y-6"><header className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-emerald-600">Quran Classes</p><h1 className="mt-1 text-2xl font-bold text-gray-900">Find a Quran Teacher</h1><p className="mt-1 text-sm text-gray-500">Choose your preferred day and time to see teachers who are available then.</p></header>
    <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold">Your request details</h2><div className="grid gap-3 sm:grid-cols-2"><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Your full name" className="rounded-lg border border-gray-200 px-4 py-3" /><input type="number" min="3" max="100" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Age" className="rounded-lg border border-gray-200 px-4 py-3" /><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" className="rounded-lg border border-gray-200 px-4 py-3" /><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Area / location name" className="rounded-lg border border-gray-200 px-4 py-3" /></div><div className="mt-4"><LocationMap latitude={form.latitude} longitude={form.longitude} address={form.location} onChange={(latitude, longitude) => setForm({ ...form, latitude, longitude })} onAddressChange={(location) => setForm((current) => ({ ...current, location }))} /></div><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Class requirements or notes" className="mt-4 min-h-20 w-full rounded-lg border border-gray-200 px-4 py-3" /></section>
    <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-2 text-lg font-bold">Preferred class schedule</h2><p className="mb-4 text-sm text-gray-500">Select as many available days as you like.</p><fieldset><legend className="sr-only">Select class days</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{days.map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${scheduleDays.includes(value) ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}><input type="checkbox" checked={scheduleDays.includes(value)} onChange={(event) => setScheduleDays((current) => event.target.checked ? [...current, value].sort((a, b) => a - b) : current.filter((day) => day !== value))} className="h-4 w-4 accent-emerald-600" />{label}</label>)}</div></fieldset><label className="mt-4 block text-sm font-semibold text-gray-700">Preferred time<input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 font-normal" /></label><label className="mt-4 flex items-center justify-between text-sm font-semibold text-gray-700">Search distance<select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="rounded-lg border border-gray-200 px-3 py-2 font-normal">{[5, 10, 25, 50].map((value) => <option key={value} value={value}>{value} km</option>)}</select></label><button type="button" onClick={searchTeachers} disabled={isSearching || scheduleDays.length === 0} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white disabled:bg-gray-300"><Search className="h-4 w-4" />{isSearching ? "Searching..." : "Find available Quran teachers"}</button></section>
    {message && <div className="rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</div>}{searchError && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{searchError}</div>}
    {hasSearched && groups.map((group) => group.list.length > 0 && <section key={group.title} className="space-y-3"><h2 className="text-lg font-bold text-gray-900">{group.title}</h2>{group.list.map((teacher) => <article key={teacher.id} className="rounded-xl bg-white p-5 shadow-sm"><div className="flex items-start gap-4"><div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-emerald-50">{teacher.avatarUrl ? <Image src={teacher.avatarUrl} alt={`${teacher.fullName} profile photo`} fill sizes="64px" unoptimized className="object-cover" /> : <UserRound className="m-auto mt-4 h-8 w-8 text-emerald-700" />}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-bold text-gray-900">{teacher.fullName}</h3><p className="mt-1 flex items-center gap-1 text-sm text-gray-500"><MapPin className="h-4 w-4" />{teacher.area || teacher.city || "Location not provided"}</p></div><BookOpen className="h-6 w-6 text-emerald-600" /></div><div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">{teacher.phone && <a href={`tel:${teacher.phone}`} className="flex items-center gap-2 font-medium text-emerald-700"><Phone className="h-4 w-4" />{teacher.phone}</a>}<span className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-emerald-600" />{teacher.education || "Education not provided"}</span></div></div></div><div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600"><span>{teacher.distanceKm == null ? "Distance unavailable" : `${teacher.distanceKm.toFixed(1)} km`}</span><span>{teacher.experienceYears ?? 0} years experience</span><span>Available: {getMatchingDays(teacher, scheduleDays, scheduleTime).map((day) => days.find(([value]) => value === day)?.[1]).join(", ")} · {scheduleTime}</span></div><p className="mt-3 text-sm text-gray-600">{teacher.bio || "Teacher profile available for enrollment."}</p><button onClick={() => setSelected(teacher)} className="mt-4 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">View profile and request</button></article>)}</section>)}
    {hasSearched && !isSearching && teachers.length === 0 && <div className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm">No Quran teacher is available on the selected day and time.</div>}
    {selected && <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6"><section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-4"><div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-emerald-50">{selected.avatarUrl ? <Image src={selected.avatarUrl} alt={`${selected.fullName} profile photo`} fill sizes="64px" unoptimized className="object-cover" /> : <UserRound className="m-auto mt-4 h-8 w-8 text-emerald-700" />}</div><div><h2 className="text-xl font-bold text-gray-900">{selected.fullName}</h2><p className="text-sm text-gray-500">{selected.area || selected.city || "Location not provided"}</p></div></div><button onClick={() => setSelected(null)} className="text-gray-500">Close</button></div><div className="mt-4 space-y-3 text-sm text-gray-700">{selected.phone && <a href={`tel:${selected.phone}`} className="flex items-center gap-2 font-semibold text-emerald-700"><Phone className="h-4 w-4" />{selected.phone}</a>}<p className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-emerald-600" /><span><strong>Education:</strong> {selected.education || "Not provided"}</span></p><p className="text-gray-600">{selected.bio || "Quran teacher profile available."}</p></div><p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Request day: {days.find(([value]) => value === getMatchingDays(selected, scheduleDays, scheduleTime)[0])?.[1]} at {scheduleTime}<br />Other selected days can also match this teacher&apos;s schedule.</p><button onClick={() => void enroll()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white"><CheckCircle2 className="h-4 w-4" /> Send enrollment request</button></section></div>}
  </div></main>;
}
