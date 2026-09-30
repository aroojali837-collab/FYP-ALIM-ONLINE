"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, Save, UserRound } from "lucide-react";

type Student = { studentId: number; studentName: string; email: string };
type Surah = { number: number; arabicName: string; transliteration: string; englishName: string; ayahCount: number };
type LessonRange = { start: number; end: number; label: string };

export default function StudentHistoryPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [date] = useState(() => { const today = new Date(); return new Date(today.getTime() - today.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); });
  const [attendance, setAttendance] = useState("Present");
  const [surahNumber, setSurahNumber] = useState<number | null>(null);
  const [rangeIndex, setRangeIndex] = useState(0);
  const [lessonStatus, setLessonStatus] = useState("In Progress");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const getId = () => { const raw = localStorage.getItem("user"); const user = raw ? JSON.parse(raw) : null; return user?.id ?? user?.userId; };
  const surah = surahs.find((item) => item.number === surahNumber);
  const ranges = useMemo<LessonRange[]>(() => surah ? Array.from({ length: Math.ceil(surah.ayahCount / 5) }, (_, index) => { const start = index * 5 + 1; const end = Math.min(start + 4, surah.ayahCount); return { start, end, label: `Ayat ${start}-${end}` }; }) : [], [surah]);
  const range = ranges[rangeIndex];
  const [content, setContent] = useState<{ arabicText: string; urduTranslation: string }[] | null>(null);

  const loadStudents = () => { const id = getId(); if (!id) return; void fetch(`/api/quran/students?teacherId=${id}`).then((r) => r.json()).then((data: Student[]) => setStudents(Array.isArray(data) ? data : [])).catch(() => setStudents([])); };
  useEffect(() => { loadStudents(); void fetch("/api/quran/catalog").then((response) => response.ok ? response.json() : []).then((data: Surah[]) => { setSurahs(Array.isArray(data) ? data : []); if (Array.isArray(data) && data.length > 0) setSurahNumber(data[0].number); }).catch(() => setSurahs([])); }, []);
  useEffect(() => { setRangeIndex(0); }, [surahNumber]);
  useEffect(() => { if (!surahNumber || !range) { setContent(null); return; } void fetch(`/api/quran/content?surahNumber=${surahNumber}&ayahStart=${range.start}&ayahEnd=${range.end}`).then((response) => response.ok ? response.json() : null).then((data) => setContent(data?.ayahs ?? null)).catch(() => setContent(null)); }, [surahNumber, range]);

  const saveSession = async () => {
    const teacherId = getId();
    if (!teacherId || !selected || !surah || !range) return;
    setSaving(true); setMessage("");
    const lessonTitle = `Surah ${surah.englishName} Ayat ${range.start}-${range.end}`;
    try {
      const lessonResponse = await fetch(`/api/quran/lessons?teacherId=${teacherId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: selected.studentId, lessonTitle, lessonType: "Quran", lessonReference: `${surah.number}:${range.start}-${range.end}`, lessonDate: date, status: lessonStatus, notes }) });
      if (!lessonResponse.ok) throw new Error("Lesson save failed");
      const lesson = await lessonResponse.json();
      const attendanceResponse = await fetch(`/api/quran/attendance?teacherId=${teacherId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: selected.studentId, lessonId: lesson.id, attendanceDate: date, status: attendance, notes }) });
      if (!attendanceResponse.ok) throw new Error("Attendance save failed");
      setMessage("Lesson and attendance saved successfully."); setNotes("");
    } catch { setMessage("Unable to save lesson and attendance."); } finally { setSaving(false); }
  };

  return <main className="min-h-screen bg-slate-50 px-4 py-8 pb-12"><div className="mx-auto max-w-3xl"><Link href="/alim-dashboard/tutoring" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-600"><ArrowLeft className="h-4 w-4" />Tutoring</Link><h1 className="text-2xl font-bold text-gray-900">Quran Lessons</h1>
    <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm"><label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><UserRound className="h-4 w-4 text-emerald-600" />Select enrolled student</label><select value={selected?.studentId ?? ""} onChange={(event) => setSelected(students.find((student) => student.studentId === Number(event.target.value)) ?? null)} className="mt-3 w-full rounded-lg border border-gray-200 px-4 py-3"><option value="">Choose an assigned student</option>{students.map((student) => <option key={student.studentId} value={student.studentId}>{student.studentName} - {student.email}</option>)}</select></section>
    {selected && <><section className="mt-4 rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Lesson {surah?.number ?? "-"}</p><h2 className="text-lg font-bold text-gray-900">{selected.studentName}</h2></div><span className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">Today: {new Date(`${date}T00:00:00`).toLocaleDateString()}</span></div>{surahs.length === 0 ? <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-700">No verified Quran dataset is imported yet. Ask the administrator to import the licensed dataset.</p> : <div className="mt-5 grid gap-3 sm:grid-cols-2"><div><label className="text-xs font-semibold text-gray-500">Surah</label><select value={surahNumber ?? ""} onChange={(e) => setSurahNumber(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-3">{surahs.map((item) => <option key={item.number} value={item.number}>{item.number}. {item.transliteration} ({item.ayahCount} ayahs)</option>)}</select></div><div><label className="text-xs font-semibold text-gray-500">Lesson (5 ayah)</label><select value={rangeIndex} onChange={(e) => setRangeIndex(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-3">{ranges.map((item, index) => <option key={item.label} value={index}>{item.label}</option>)}</select></div></div>}</section>
      <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-emerald-600" /><h2 className="font-bold text-gray-900">{surah ? `${surah.transliteration} · ${range?.label ?? ""}` : "Verified Quran content"}</h2></div>{content ? <>{content.map((ayah) => <div key={ayah.arabicText} className="mt-4"><div className="rounded-xl bg-emerald-50 p-5 text-center text-2xl leading-loose" dir="rtl">{ayah.arabicText}</div><div className="mt-2 border-l-2 border-emerald-500 pl-3"><p className="text-xs font-bold uppercase text-emerald-600">Urdu translation</p><p className="mt-1 text-sm text-gray-600" dir="rtl">{ayah.urduTranslation}</p></div></div>)}</> : <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-gray-500">Verified Arabic and Urdu content will appear here after the approved dataset is imported.</p>}<label className="mt-5 block text-sm font-semibold text-gray-700">Teaching notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was taught or needs revision?" className="mt-2 min-h-24 w-full rounded-lg border border-gray-200 px-4 py-3" /></section>
      <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-gray-500" /><h2 className="font-bold text-gray-900">Attendance</h2></div><div className="mt-4 grid grid-cols-3 gap-2">{["Present", "Absent", "Late"].map((status) => <button key={status} onClick={() => setAttendance(status)} className={`rounded-lg border px-3 py-3 text-sm font-semibold ${attendance === status ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500"}`}>{status}</button>)}</div><div className="mt-5 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><h2 className="font-bold text-gray-900">Lesson status</h2></div><div className="mt-3 grid grid-cols-2 gap-2">{["Completed", "In Progress"].map((status) => <button key={status} onClick={() => setLessonStatus(status)} className={`rounded-lg border px-3 py-3 text-sm font-semibold ${lessonStatus === status ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500"}`}>{status}</button>)}</div></section>
      <button disabled={saving} onClick={() => void saveSession()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-4 font-bold text-white shadow-sm hover:bg-emerald-700 disabled:bg-gray-300"><Save className="h-5 w-5" />{saving ? "Saving..." : "Save Attendance and Lesson"}</button>{message && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700">{message}</p>}
      </>}
  </div></main>;
}
