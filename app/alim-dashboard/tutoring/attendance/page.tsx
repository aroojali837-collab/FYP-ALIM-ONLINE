"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, UserRound, XCircle } from "lucide-react";

type Student = { studentId: number; studentName: string; email: string };
type AttendanceRecord = { id: number; attendanceDate: string; status: string; notes?: string | null };

function getTeacherId() {
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;
  return user?.id ?? user?.userId;
}

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function TutoringAttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const teacherId = getTeacherId();
    if (!teacherId) { setError("Please sign in again to view tutoring attendance."); setIsLoadingStudents(false); return; }
    void fetch(`/api/quran/students?teacherId=${teacherId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load your enrolled students.");
        return response.json();
      })
      .then((data: Student[]) => setStudents(Array.isArray(data) ? data : []))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load students."))
      .finally(() => setIsLoadingStudents(false));
  }, []);

  useEffect(() => {
    const teacherId = getTeacherId();
    if (!teacherId || !selectedStudentId) { setRecords([]); return; }
    let ignore = false;
    setIsLoadingHistory(true); setError("");
    void fetch(`/api/quran/attendance?studentId=${selectedStudentId}&teacherId=${teacherId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load attendance history for this student.");
        return response.json();
      })
      .then((data: AttendanceRecord[]) => { if (!ignore) setRecords(Array.isArray(data) ? data : []); })
      .catch((cause) => { if (!ignore) { setRecords([]); setError(cause instanceof Error ? cause.message : "Unable to load attendance history."); } })
      .finally(() => { if (!ignore) setIsLoadingHistory(false); });
    return () => { ignore = true; };
  }, [selectedStudentId]);

  const selectedStudent = students.find((student) => String(student.studentId) === selectedStudentId);
  const presentCount = records.filter((record) => record.status.toLowerCase() === "present").length;
  const absentCount = records.filter((record) => record.status.toLowerCase() === "absent").length;
  const lateCount = records.filter((record) => record.status.toLowerCase() === "late").length;

  return <main className="min-h-screen bg-slate-50 px-4 py-8 pb-12">
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <Link href="/alim-dashboard/tutoring" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Tutoring</Link>
        <p className="text-sm font-semibold text-blue-700">Aalim Tutor</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Attendance History</h1>
        <p className="mt-1 text-sm text-gray-500">Select a student to view their recorded attendance.</p>
      </header>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <label htmlFor="attendance-student" className="flex items-center gap-2 text-sm font-semibold text-gray-700"><UserRound className="h-4 w-4 text-blue-600" /> Select student</label>
        <select id="attendance-student" value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)} disabled={isLoadingStudents || students.length === 0} className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
          <option value="">{isLoadingStudents ? "Loading students..." : students.length ? "Choose an enrolled student" : "No enrolled students"}</option>
          {students.map((student) => <option key={student.studentId} value={student.studentId}>{student.studentName}</option>)}
        </select>
      </section>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}

      {selectedStudent && <>
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[{ label: "Recorded days", value: records.length, icon: CalendarDays, style: "bg-slate-100 text-slate-700" }, { label: "Present", value: presentCount, icon: CheckCircle2, style: "bg-emerald-50 text-emerald-700" }, { label: "Absent", value: absentCount, icon: XCircle, style: "bg-red-50 text-red-700" }, { label: "Late", value: lateCount, icon: Clock3, style: "bg-amber-50 text-amber-700" }].map((item) => {
            const Icon = item.icon;
            return <article key={item.label} className="rounded-xl bg-white p-4 shadow-sm"><span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${item.style}`}><Icon className="h-4 w-4" /></span><p className="mt-3 text-2xl font-bold text-gray-900">{item.value}</p><p className="mt-1 text-xs text-gray-500">{item.label}</p></article>;
          })}
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4"><h2 className="font-bold text-gray-900">{selectedStudent.studentName}&apos;s attendance</h2><p className="mt-1 text-sm text-gray-500">{selectedStudent.email}</p></div>
          {isLoadingHistory ? <p className="p-6 text-sm text-gray-500">Loading attendance history...</p> : records.length === 0 ? <p className="p-6 text-sm text-gray-500">No attendance has been recorded for this student yet.</p> : <div className="divide-y divide-gray-100">{records.map((record) => {
            const status = record.status.toLowerCase();
            const badge = status === "present" ? "bg-emerald-50 text-emerald-700" : status === "absent" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";
            return <article key={record.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-gray-400" /><div><p className="font-semibold text-gray-900">{formatDate(record.attendanceDate)}</p>{record.notes && <p className="mt-1 text-sm text-gray-500">{record.notes}</p>}</div></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-bold capitalize ${badge}`}>{record.status}</span></article>;
          })}</div>}
        </section>
      </>}
    </div>
  </main>;
}
