"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Appointment {
  id: string;
  initials: string;
  name: string;
  service: string;
  date: string;
  time: string;
  location: string;
  status: "pending" | "accepted" | "completed";
  bgColor: string;
  statusColor: string;
  statusLabel: string;
}

export default function MyAppointmentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");

  const appointments: Appointment[] = [
    {
      id: "1",
      initials: "MT",
      name: "Maulana Tariq",
      service: "Dua",
      date: "2024-02-27",
      time: "11:00 AM",
      location: "Islamabad",
      status: "pending",
      bgColor: "bg-orange-500",
      statusColor: "bg-orange-100",
      statusLabel: "Pending",
    },
    {
      id: "2",
      initials: "MY",
      name: "Mufti Yusuf",
      service: "Janaza",
      date: "2024-02-26",
      time: "9:00 AM",
      location: "Rawalpindi",
      status: "completed",
      bgColor: "bg-green-600",
      statusColor: "bg-green-100",
      statusLabel: "Completed",
    },
    {
      id: "3",
      initials: "QH",
      name: "Qari Hassan",
      service: "Nikah",
      date: "2024-02-25",
      time: "4:00 PM",
      location: "Karachi",
      status: "completed",
      bgColor: "bg-green-600",
      statusColor: "bg-green-100",
      statusLabel: "Completed",
    },
  ];

  const filteredAppointments =
    activeTab === "all"
      ? appointments
      : appointments.filter((apt) => apt.status === activeTab);

  const tabs = [
    { id: "all", label: "All", count: 6 },
    { id: "pending", label: "Pending", count: 2 },
    { id: "accepted", label: "Accepted", count: 1 },
    { id: "completed", label: "Completed", count: 3 },
  ];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-orange-600 bg-orange-50";
      case "completed":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <Link href="/alim-dashboard" className="mr-4">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">My Appointments</h1>
            <p className="text-xs text-gray-500">2 pending • 1 accepted • 3 completed</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-2xl mx-auto px-4 flex gap-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 ${
                activeTab === tab.id
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}{" "}
              <span className="text-xs opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {filteredAppointments.map((apt) => (
          <div
            key={apt.id}
            className={`rounded-lg p-4 border-l-4 ${apt.statusColor} ${
              apt.status === "pending" ? "bg-orange-50" : "bg-green-50"
            }`}
          >
            {/* Header with Status */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div
                  className={`${apt.bgColor} w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}
                >
                  {apt.initials}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{apt.name}</h3>
                  <p className="text-xs text-gray-600">{apt.service}</p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${getStatusBadgeColor(
                    apt.status
                  )}`}
                >
                  {apt.status === "pending" && (
                    <>
                      <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                      {apt.statusLabel}
                    </>
                  )}
                  {apt.status === "completed" && (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {apt.statusLabel}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span>📅</span>
                {apt.date}
              </div>
              <div className="flex items-center gap-2">
                <span>🕐</span>
                {apt.time}
              </div>
              <div className="flex items-center gap-2">
                <span>📍</span>
                {apt.location}
              </div>
            </div>

            {/* Status-specific Content */}
            {apt.status === "pending" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-700">
                ⏳ Waiting for Alim to accept
              </div>
            )}

            {apt.status === "completed" && (
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/alim-dashboard/service-completed?name=${apt.name}&service=${apt.service}`)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  📋 Give Feedback
                </button>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">
                  👁️ View Feedback from Alim
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-2xl mx-auto px-4 flex justify-around">
          {[
            { id: "home", label: "Home", icon: "🏠" },
            { id: "requests", label: "Requests", icon: "📋" },
            { id: "history", label: "History", icon: "📄" },
            { id: "profile", label: "Profile", icon: "👤" },
          ].map((tab) => (
            <Link
              key={tab.id}
              href={
                tab.id === "home"
                  ? "/alim-dashboard"
                  : tab.id === "requests"
                  ? "/alim-dashboard/new-requests"
                  : `/alim-dashboard/${tab.id}`
              }
              className="flex-1 flex flex-col items-center justify-center py-4 text-xs font-medium transition"
            >
              <span className="text-lg mb-1">{tab.icon}</span>
              <span className={tab.id === "requests" ? "text-green-600" : "text-gray-600"}>
                {tab.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
