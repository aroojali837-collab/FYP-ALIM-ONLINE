"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, ClipboardList, Plus, Users } from "lucide-react";

type DashboardStats = { totalStudents: number; classesToday: number; presentToday: number; lessonsCompleted: number };

const emptyStats: DashboardStats = { totalStudents: 0, classesToday: 0, presentToday: 0, lessonsCompleted: 0 };

export default function TutoringPage() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;
    const id = user?.id ?? user?.userId;
    if (!id) return;
    fetch(`/api/quran/dashboard?teacherId=${id}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load tutoring dashboard.");
        return response.json();
      })
      .then(setStats)
      .catch(() => setError("Enable Quran Tutor in your profile services to use this section."));
  }, []);

  const cards = [
    { label: "Total Students", value: stats.totalStudents, icon: Users, color: "bg-emerald-50 text-emerald-600" },
    { label: "Classes Today", value: stats.classesToday, icon: CalendarDays, color: "bg-blue-50 text-blue-600" },
    { label: "Present Today", value: stats.presentToday, icon: CheckCircle2, color: "bg-teal-50 text-teal-600" },
    { label: "Lessons Completed", value: stats.lessonsCompleted, icon: ClipboardList, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 pb-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/alim-dashboard" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800">
              <ArrowLeft className="h-4 w-4" /> Alim Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Tutoring</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your Quran and Qaida students</p>
          </div>
          <Link href="/alim-dashboard/tutoring/new-requests" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Add Students
          </Link>
        </div>

        {error && <p className="mb-5 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-700">{error}</p>}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return <article key={card.label} className="rounded-xl bg-white p-5 shadow-sm">
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}><Icon className="h-5 w-5" /></div>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="mt-1 text-sm text-gray-500">{card.label}</p>
            </article>;
          })}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Link href="/alim-dashboard/tutoring/student-history" className="rounded-xl bg-emerald-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <BookOpen className="h-6 w-6 text-emerald-600" /><h2 className="mt-5 font-bold text-gray-900">Quran Lessons</h2><p className="mt-1 text-sm text-gray-500">Mark lessons and view student history</p>
          </Link>
          <Link href="/alim-dashboard/tutoring/attendance" className="rounded-xl bg-blue-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <CheckCircle2 className="h-6 w-6 text-blue-600" /><h2 className="mt-5 font-bold text-gray-900">Attendance</h2><p className="mt-1 text-sm text-gray-500">Record present, absent or late</p>
          </Link>
          <Link href="/alim-dashboard/availability" className="rounded-xl bg-violet-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <CalendarDays className="h-6 w-6 text-violet-600" /><h2 className="mt-5 font-bold text-gray-900">Schedule</h2><p className="mt-1 text-sm text-gray-500">Manage your available teaching times</p>
          </Link>
        </section>
      </div>
    </main>
  );
}
