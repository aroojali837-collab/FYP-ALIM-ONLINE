"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, CheckCircle2, ChevronDown, Clock3, LoaderCircle, UserRound } from "lucide-react";

type Lesson = { id: number; lessonTitle: string; lessonReference?: string | null; status: string; lessonDate: string; notes?: string | null };
type Progress = { totalLessons: number; completedLessons: number; attendancePresent: number; attendancePresentOnly: number; attendanceAbsent: number; attendanceLate: number; attendanceTotal: number; currentLesson?: Lesson | null; previousLessons: Lesson[]; scheduleDay?: number | null; scheduleTime?: string | null; teacherName?: string | null };
type Enrollment = { id: number; teacherId: number; teacherName: string; createdAt: string };
type Surah = { number: number; transliteration: string; englishName: string };
type Ayah = { number: number; arabicText: string; urduTranslation: string };
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function QuranProgressPage() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attendance, setAttendance] = useState<{ id: number; attendanceDate: string; status: string }[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [tab, setTab] = useState<"current" | "previous">("current");
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [expandedLessonId, setExpandedLessonId] = useState<number | null>(null);
  const [expandedAyahs, setExpandedAyahs] = useState<Ayah[]>([]);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState(false);
  const [ayahError, setAyahError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("user"); const user = raw ? JSON.parse(raw) : null; const studentId = user?.id ?? user?.userId;
    if (!studentId) return;
    void fetch(`/api/quran/enrollments?studentId=${studentId}`).then((r) => r.ok ? r.json() : []).then((data: Enrollment[]) => { const active = Array.isArray(data) ? data : []; setEnrollments(active); setTeacherId(active[0]?.teacherId ?? null); }).catch(() => setEnrollments([]));
  }, []);

  useEffect(() => {
    void fetch("/api/quran/catalog").then((response) => response.ok ? response.json() : []).then((data: Surah[]) => setSurahs(Array.isArray(data) ? data : [])).catch(() => setSurahs([]));
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("user"); const user = raw ? JSON.parse(raw) : null; const studentId = user?.id ?? user?.userId;
    if (!studentId || !teacherId) { setProgress(null); setLessons([]); setAttendance([]); return; }
    void Promise.all([
      fetch(`/api/quran/progress/${studentId}?teacherId=${teacherId}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/quran/lessons?studentId=${studentId}&teacherId=${teacherId}`).then((r) => r.ok ? r.json() : []),
      fetch(`/api/quran/attendance?studentId=${studentId}&teacherId=${teacherId}`).then((r) => r.ok ? r.json() : [])
    ]).then(([summary, lessonList, attendanceList]) => { setProgress(summary); setLessons(Array.isArray(lessonList) ? lessonList : []); setAttendance(Array.isArray(attendanceList) ? attendanceList : []); }).catch(() => { setProgress(null); setLessons([]); setAttendance([]); });
  }, [teacherId]);

  const totalAttendance = progress?.attendanceTotal ?? 0;
  const attendanceRate = totalAttendance ? Math.round(((progress?.attendancePresentOnly ?? 0) / totalAttendance) * 100) : 0;
  const upcomingDay = progress?.scheduleDay == null ? "Schedule pending" : dayNames[progress.scheduleDay];
  const previousLessons = progress?.previousLessons?.length ? progress.previousLessons : lessons.filter((lesson) => lesson.status.toLowerCase() === "completed");

  const toggleLesson = async (lesson: Lesson) => {
    if (expandedLessonId === lesson.id) { setExpandedLessonId(null); return; }
    setExpandedLessonId(lesson.id); setExpandedAyahs([]); setAyahError(""); setIsLoadingAyahs(true);
    try {
      let reference = lesson.lessonReference?.match(/^(\d+):(\d+)-(\d+)$/);
      let surahNumber = reference?.[1];
      let ayahStart = reference?.[2];
      let ayahEnd = reference?.[3];
      if (!reference) {
        const title = lesson.lessonTitle.match(/Surah\s+(.+?)\s+Ayat\s+(\d+)\s*-\s*(\d+)/i);
        if (title) {
          const surahName = title[1].trim().toLocaleLowerCase();
          const surah = surahs.find((item) => item.englishName.toLocaleLowerCase() === surahName || item.transliteration.toLocaleLowerCase() === surahName);
          if (surah) { surahNumber = String(surah.number); ayahStart = title[2]; ayahEnd = title[3]; }
        }
      }
      if (!surahNumber || !ayahStart || !ayahEnd) throw new Error("Ayat details are not available for this lesson.");
      const response = await fetch(`/api/quran/content?surahNumber=${surahNumber}&ayahStart=${ayahStart}&ayahEnd=${ayahEnd}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "Unable to load ayat for this lesson.");
      setExpandedAyahs(Array.isArray(data?.ayahs) ? data.ayahs : []);
      if (!Array.isArray(data?.ayahs) || data.ayahs.length === 0) setAyahError("No ayat were found for this lesson range.");
    } catch (error) {
      setAyahError(error instanceof Error ? error.message : "Unable to load lesson ayat.");
    } finally {
      setIsLoadingAyahs(false);
    }
  };

  const renderLessonAyahs = (lessonId: number) => expandedLessonId !== lessonId ? null : <div className="mt-4 border-t border-emerald-100 pt-4">{isLoadingAyahs ? <p className="flex items-center gap-2 text-sm text-gray-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading ayat...</p> : ayahError ? <p className="text-sm text-amber-700">{ayahError}</p> : <div className="space-y-4">{expandedAyahs.map((ayah) => <article key={ayah.number} className="rounded-xl border border-emerald-100 bg-white p-4"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-700">Ayat {ayah.number}</p><p className="text-right text-2xl leading-loose text-gray-900" dir="rtl">{ayah.arabicText}</p><div className="mt-3 border-t border-gray-100 pt-3"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Urdu translation</p><p className="mt-1 text-base leading-8 text-gray-700" dir="rtl">{ayah.urduTranslation}</p></div></article>)}</div>}</div>;

  return <main className="min-h-screen bg-green-50 px-4 py-8"><div className="mx-auto max-w-2xl space-y-6"><header className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-emerald-600">Aalim Tutor</p><h1 className="mt-1 text-2xl font-bold text-gray-900">Quran Learning Progress</h1><p className="mt-1 text-sm text-gray-500">Your accepted Aalim Tutor&apos;s saved lessons and attendance history.</p>{enrollments.length > 0 && <select value={teacherId ?? ""} onChange={(event) => setTeacherId(Number(event.target.value))} className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm"><option value="">Select Aalim Tutor</option>{enrollments.map((item) => <option key={item.id} value={item.teacherId}>{item.teacherName}</option>)}</select>}</header>
    {enrollments.length === 0 ? <section className="rounded-2xl bg-white p-6 text-center shadow-sm"><BookOpen className="mx-auto h-10 w-10 text-emerald-600" /><h2 className="mt-3 font-bold text-gray-900">No accepted Aalim Tutor yet</h2><p className="mt-2 text-sm text-gray-500">Find an Aalim who offers Quran Tutor service. Progress will appear here after the Aalim accepts your request.</p><Link href="/customer-dashboard/quran-classes" className="mt-5 inline-flex rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">Find Quran Tutor</Link></section> : <>
    <section className="grid grid-cols-2 gap-2 rounded-xl bg-white p-2 shadow-sm"><button onClick={() => setTab("previous")} className={`rounded-lg px-4 py-3 text-sm font-bold ${tab === "previous" ? "bg-emerald-100 text-emerald-700" : "text-gray-500"}`}>Previous Lessons</button><button onClick={() => setTab("current")} className={`rounded-lg px-4 py-3 text-sm font-bold ${tab === "current" ? "bg-emerald-100 text-emerald-700" : "text-gray-500"}`}>Current Lesson</button></section>
    <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Upcoming Session</p><h2 className="mt-1 text-lg font-bold text-gray-900">Physical Teaching Session</h2></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">Upcoming</span></div><div className="mt-5 grid gap-3 text-sm text-gray-600 sm:grid-cols-2"><p className="flex items-center gap-2"><UserRound className="h-4 w-4 text-emerald-600" />{progress?.teacherName || "Assigned Quran teacher"}</p><p className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-emerald-600" />Quran</p><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-600" />{upcomingDay}</p><p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-emerald-600" />{progress?.scheduleTime || "Time pending"}</p></div></section>
    <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">{tab === "current" ? "Current Lesson" : "Previous Lessons"}</h2>{tab === "current" ? progress?.currentLesson ? <article className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4"><button type="button" onClick={() => void toggleLesson(progress.currentLesson!)} aria-expanded={expandedLessonId === progress.currentLesson.id} className="flex w-full items-center justify-between gap-3 text-left"><span className="font-bold text-gray-900">{progress.currentLesson.lessonTitle}</span><ChevronDown className={`h-5 w-5 shrink-0 text-emerald-700 transition-transform ${expandedLessonId === progress.currentLesson.id ? "rotate-180" : ""}`} /></button>{progress.currentLesson.notes && <p className="mt-2 text-sm text-gray-600">{progress.currentLesson.notes}</p>}<p className="mt-2 text-xs font-semibold text-emerald-700">{progress.currentLesson.status}</p>{renderLessonAyahs(progress.currentLesson.id)}</article> : <div className="mt-4 rounded-xl bg-emerald-50 p-4"><p className="font-bold text-gray-900">No current lesson recorded</p><p className="mt-2 text-xs font-semibold text-emerald-700">Waiting for teacher</p></div> : <div className="mt-4 space-y-3">{previousLessons.length === 0 ? <p className="text-sm text-gray-500">No previous lessons recorded.</p> : previousLessons.map((lesson) => <article key={lesson.id} className="rounded-xl border border-gray-100 p-4"><button type="button" onClick={() => void toggleLesson(lesson)} aria-expanded={expandedLessonId === lesson.id} className="flex w-full items-center justify-between gap-3 text-left"><span className="font-semibold text-gray-900">{lesson.lessonTitle}</span><ChevronDown className={`h-5 w-5 shrink-0 text-emerald-700 transition-transform ${expandedLessonId === lesson.id ? "rotate-180" : ""}`} /></button><p className="mt-1 text-xs text-gray-500">{lesson.lessonDate} · {lesson.status}</p>{renderLessonAyahs(lesson.id)}</article>)}</div>}</section>
    <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Attendance Summary</h2><div className="mt-4 grid grid-cols-4 gap-2 text-center"><div className="rounded-lg bg-gray-50 p-3"><p className="text-xl font-bold">{totalAttendance}</p><p className="text-xs text-gray-500">Total</p></div><div className="rounded-lg bg-emerald-50 p-3"><p className="text-xl font-bold text-emerald-600">{progress?.attendancePresentOnly ?? 0}</p><p className="text-xs text-emerald-600">Present</p></div><div className="rounded-lg bg-red-50 p-3"><p className="text-xl font-bold text-red-600">{progress?.attendanceAbsent ?? 0}</p><p className="text-xs text-red-600">Absent</p></div><div className="rounded-lg bg-amber-50 p-3"><p className="text-xl font-bold text-amber-600">{progress?.attendanceLate ?? 0}</p><p className="text-xs text-amber-600">Late</p></div></div><div className="mt-5"><div className="mb-2 flex justify-between text-xs font-semibold text-gray-500"><span>Attendance rate</span><span>{attendanceRate}%</span></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${attendanceRate}%` }} /></div></div><a href="#recent-attendance" className="mt-5 flex w-full justify-center rounded-xl border-2 border-emerald-500 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50">View Attendance</a></section>
    <section id="recent-attendance" tabIndex={-1} className="scroll-mt-6 rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-3 text-lg font-bold text-gray-900">Recent Attendance</h2>{attendance.length === 0 ? <p className="text-sm text-gray-500">No attendance recorded yet.</p> : attendance.slice(0, 10).map((item) => <div key={item.id} className="flex justify-between border-b border-gray-100 py-2 text-sm"><span>{item.attendanceDate}</span><span className="font-semibold text-gray-700">{item.status}</span></div>)}</section>
  </>}</div></main>;
}
