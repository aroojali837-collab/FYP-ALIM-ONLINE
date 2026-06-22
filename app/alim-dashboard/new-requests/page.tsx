"use client";

import { useState } from "react";
import { ChevronLeft, Check, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Request {
  id: string;
  initials: string;
  name: string;
  service: string;
  date: string;
  time: string;
  location: string;
  bgColor: string;
}

export default function NewRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([
    {
      id: "1",
      initials: "AH",
      name: "Ahmed Hassan",
      service: "Nikah",
      date: "2024-02-28",
      time: "10:00 AM",
      location: "Karachi",
      bgColor: "bg-teal-600",
    },
    {
      id: "2",
      initials: "FK",
      name: "Fatima Khan",
      service: "Dua",
      date: "2024-03-01",
      time: "3:00 PM",
      location: "Lahore",
      bgColor: "bg-green-600",
    },
    {
      id: "3",
      initials: "AR",
      name: "Ali Raza",
      service: "Janaza",
      date: "2024-02-27",
      time: "11:00 AM",
      location: "Islamabad",
      bgColor: "bg-teal-600",
    },
    {
      id: "4",
      initials: "AS",
      name: "Ayesha Siddiqui",
      service: "Quran",
      date: "2024-02-26",
      time: "2:00 PM",
      location: "Rawalpindi",
      bgColor: "bg-purple-600",
    },
  ]);

  const handleAccept = (id: string) => {
    setRequests(requests.filter((req) => req.id !== id));
  };

  const handleReject = (id: string) => {
    setRequests(requests.filter((req) => req.id !== id));
  };

  const handleRequestClick = (request: Request) => {
    router.push(`/alim-dashboard/service-completed?name=${request.name}&service=${request.service}`);
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
            <h1 className="text-lg font-bold text-gray-900">New Requests</h1>
            <p className="text-xs text-gray-500">{requests.length} pending requests</p>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {requests.length > 0 ? (
          requests.map((request) => (
            <div
              key={request.id}
              onClick={() => handleRequestClick(request)}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
            >
              {/* User Info */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`${request.bgColor} w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}
                >
                  {request.initials}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{request.name}</h3>
                  <p className="text-xs text-gray-500">{request.service}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">📅</span>
                  {request.date}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">🕐</span>
                  {request.time}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">📍</span>
                  {request.location}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAccept(request.id);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Accept
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(request.id);
                  }}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No new requests</p>
          </div>
        )}
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
