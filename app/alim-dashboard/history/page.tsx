"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface HistoryItem {
  id: string;
  initials: string;
  name: string;
  service: string;
  date: string;
  time: string;
  rating: number;
  bgColor: string;
}

export default function HistoryPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const history: HistoryItem[] = [
    {
      id: "1",
      initials: "AH",
      name: "Ahmed Hassan",
      service: "Nikah",
      date: "2024-02-20",
      time: "10:00 AM",
      rating: 5,
      bgColor: "bg-green-600",
    },
    {
      id: "2",
      initials: "FK",
      name: "Fatima Khan",
      service: "Dua",
      date: "2024-02-18",
      time: "3:00 PM",
      rating: 4,
      bgColor: "bg-blue-600",
    },
    {
      id: "3",
      initials: "AR",
      name: "Ali Raza",
      service: "Janaza",
      date: "2024-02-15",
      time: "11:00 AM",
      rating: 5,
      bgColor: "bg-teal-600",
    },
    {
      id: "4",
      initials: "AS",
      name: "Ayesha Siddiqui",
      service: "Quran Khawani",
      date: "2024-02-12",
      time: "2:00 PM",
      rating: 5,
      bgColor: "bg-purple-600",
    },
  ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
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
            <h1 className="text-lg font-bold text-gray-900">History</h1>
            <p className="text-xs text-gray-500">5 completed appointments</p>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
          >
            {/* Header with Rating */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div
                  className={`${item.bgColor} w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}
                >
                  {item.initials}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-xs text-gray-500">{item.service}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-semibold text-gray-900">{item.rating}</span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span>📅</span>
                {item.date}
              </div>
              <div className="flex items-center gap-2">
                <span>🕐</span>
                {item.time}
              </div>
            </div>

            {/* View Feedback Button */}
            <button
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-semibold py-2 rounded-lg transition text-sm"
            >
              👁️ View Feedback
            </button>

            {/* Feedback Expanded View */}
            {expandedId === item.id && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-gray-700">
                  "Great service! The Alim was very knowledgeable and patient. Highly recommended!"
                </p>
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
              <span className={tab.id === "history" ? "text-green-600" : "text-gray-600"}>
                {tab.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
