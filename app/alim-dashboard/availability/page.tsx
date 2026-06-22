"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function AvailabilityPage() {
  const [activeTab, setActiveTab] = useState("weekly");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  const timeSlots = [
    "00:00-01:00",
    "01:00-02:00",
    "02:00-03:00",
    "03:00-04:00",
    "04:00-05:00",
    "05:00-06:00",
    "06:00-07:00",
    "07:00-08:00",
    "08:00-09:00",
    "09:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
    "17:00-18:00",
    "18:00-19:00",
    "19:00-20:00",
    "20:00-21:00",
    "21:00-22:00",
    "22:00-23:00",
    "23:00-00:00",
  ];

  const toggleSlot = (dayIndex: number, timeIndex: number) => {
    const slotId = `${dayIndex}-${timeIndex}`;
    if (selectedSlots.includes(slotId)) {
      setSelectedSlots(selectedSlots.filter((id) => id !== slotId));
    } else {
      setSelectedSlots([...selectedSlots, slotId]);
    }
  };

  const isSlotSelected = (dayIndex: number, timeIndex: number) => {
    return selectedSlots.includes(`${dayIndex}-${timeIndex}`);
  };

  const handleSave = () => {
    console.log("Saving availability:", selectedSlots);
  };

  const getToday = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Date();
    return {
      date: today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      day: days[today.getDay()],
    };
  };

  const { date, day } = getToday();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <Link href="/alim-dashboard" className="mr-4">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Set Availability</h1>
            <p className="text-xs text-gray-500">Choose your available time slots</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-2xl mx-auto px-4 flex gap-3">
          {[
            { id: "weekly", label: "Weekly Schedule", icon: "📅" },
            { id: "specific", label: "Specific Dates", icon: "📆" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-green-600 text-white rounded-lg"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === "weekly" && (
          <>
            {/* Current Date Card */}
            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
              <p className="text-xs text-green-700 font-medium mb-1">Today</p>
              <h3 className="text-lg font-bold text-gray-900">{day}, {date}</h3>
              <p className="text-xs text-green-700">Current: {day}</p>
            </div>

            {/* Select Weekly Availability */}
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Select Your Weekly Availability
            </h3>

            {/* Table */}
            <div className="bg-white rounded-lg overflow-x-auto shadow-sm border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="px-3 py-3 text-left text-sm font-semibold">
                      Time Slot
                    </th>
                    {days.map((day, idx) => (
                      <th
                        key={idx}
                        className="px-3 py-3 text-center text-xs font-semibold"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((time, timeIdx) => (
                    <tr
                      key={timeIdx}
                      className={`border-t border-gray-200 ${
                        timeIdx % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <td className="px-3 py-3 text-xs font-medium text-gray-700 whitespace-nowrap">
                        <div>{time.split("-")[0]}</div>
                        <div className="text-gray-500">{time.split("-")[1]}</div>
                      </td>
                      {days.map((_, dayIdx) => (
                        <td
                          key={dayIdx}
                          className="px-3 py-3 text-center"
                        >
                          <input
                            type="checkbox"
                            checked={isSlotSelected(dayIdx, timeIdx)}
                            onChange={() => toggleSlot(dayIdx, timeIdx)}
                            className="w-4 h-4 cursor-pointer accent-green-600"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "specific" && (
          <div className="bg-white rounded-lg p-6 text-center text-gray-500">
            <p>Coming soon...</p>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          📅 Save Availability
        </button>
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
              <span className="text-gray-600">{tab.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
