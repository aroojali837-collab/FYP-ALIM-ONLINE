"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface Appointment {
  id: string;
  initials: string;
  name: string;
  service: string;
  date: string;
  time: string;
  status: string;
  bgColor: string;
}

export default function AppointmentsPage() {
  const [appointments] = useState<Appointment[]>([
    {
      id: "1",
      initials: "AH",
      name: "Mufti Ahmed Khan",
      service: "Nikah",
      date: "2024-03-05",
      time: "10:00 AM",
      status: "confirmed",
      bgColor: "bg-teal-600",
    },
    {
      id: "2",
      initials: "MF",
      name: "Mufti Farooq",
      service: "Dua",
      date: "2024-03-10",
      time: "3:00 PM",
      status: "pending",
      bgColor: "bg-blue-600",
    },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <Link href="/customer-dashboard" className="mr-4">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">My Appointments</h1>
            <p className="text-xs text-gray-500">{appointments.length} appointments</p>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {appointments.length > 0 ? (
          appointments.map((apt) => (
            <div key={apt.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`${apt.bgColor} w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}
                >
                  {apt.initials}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{apt.name}</h3>
                  <p className="text-xs text-gray-500">{apt.service}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  apt.status === "confirmed"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {apt.status === "confirmed" ? "Confirmed" : "Pending"}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  {apt.date}
                </div>
                <div className="flex items-center gap-2">
                  <span>🕐</span>
                  {apt.time}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No appointments yet</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-2xl mx-auto px-4 flex justify-around">
          {[
            { id: "home", label: "Home", icon: "🏠" },
            { id: "ask", label: "Ask", icon: "❓" },
            { id: "appointments", label: "Appointments", icon: "📅" },
            { id: "profile", label: "Profile", icon: "👤" },
          ].map((tab) => (
            <Link
              key={tab.id}
              href={
                tab.id === "home"
                  ? "/customer-dashboard"
                  : `/customer-dashboard/${tab.id}`
              }
              className="flex-1 flex flex-col items-center justify-center py-4 text-xs font-medium transition"
            >
              <span className="text-lg mb-1">{tab.icon}</span>
              <span className={tab.id === "appointments" ? "text-green-600" : "text-gray-600"}>
                {tab.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
