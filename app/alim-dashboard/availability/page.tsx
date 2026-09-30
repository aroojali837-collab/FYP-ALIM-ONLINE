"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Calendar,
  CalendarDays,
  Clock,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = [
  "00:00-01:00", "01:00-02:00", "02:00-03:00", "03:00-04:00", "04:00-05:00", "05:00-06:00",
  "06:00-07:00", "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
  "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00",
  "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00", "22:00-23:00", "23:00-00:00",
];

type SavedAvailability = { id: number; slot: string };

export default function AvailabilityPage() {
  const [activeTab, setActiveTab] = useState("weekly");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [savedSlots, setSavedSlots] = useState<string[]>([]);
  const [savedAvailability, setSavedAvailability] = useState<SavedAvailability[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    async function loadAvailability() {
      const userRaw = localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;
      const alimId = user?.id ?? user?.userId;
      if (!alimId) return;

      const response = await fetch(`/api/alim-availability?alimId=${alimId}`);
      const data = response.ok ? await response.json() : [];
      const records: SavedAvailability[] = Array.isArray(data)
        ? data
            .filter((slot) => slot.isRecurring && slot.weekday !== null && slot.startTime && slot.endTime)
            .map((slot) => {
              const dayIndex = (Number(slot.weekday) + 6) % 7;
              const start = String(slot.startTime).slice(0, 5);
              const end = String(slot.endTime).slice(0, 5);
              const timeIndex = timeSlots.findIndex((time) => time === `${start}-${end}`);
              return timeIndex >= 0 ? { id: Number(slot.id), slot: `${dayIndex}-${timeIndex}` } : null;
            })
            .filter((slot): slot is SavedAvailability => slot !== null)
        : [];
      const existing = records.map((record) => record.slot);
      setSavedAvailability(records);
      setSelectedSlots(existing);
      setSavedSlots(existing);
    }

    void loadAvailability();
  }, []);

  const handleSave = async () => {
    const userRaw = localStorage.getItem("user");
    const user = userRaw ? JSON.parse(userRaw) : null;
    const alimId = user?.id ?? user?.userId;
    if (!alimId) {
      setMessage("Please sign in again before saving availability.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      const newSlots = selectedSlots.filter((slot) => !savedSlots.includes(slot));
      const removedSlots = savedAvailability.filter((record) => !selectedSlots.includes(record.slot));
      const addedRecords = await Promise.all(
        newSlots.map(async (slot) => {
          const [dayIndexText, timeIndexText] = slot.split("-");
          const dayIndex = Number(dayIndexText);
          const timeIndex = Number(timeIndexText);
          const [startTime, endTime] = timeSlots[timeIndex].split("-");
          const response = await fetch("/api/alim-availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              alimUserId: alimId,
              dayOfWeek: (dayIndex + 1) % 7,
              startTime,
              endTime,
              isRecurring: true,
            }),
          });
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error ?? "Unable to save availability.");
          }
          const saved = await response.json();
          return { id: Number(saved.id), slot } satisfies SavedAvailability;
        }),
      );
      await Promise.all(removedSlots.map((record) => fetch(`/api/alim-availability/${record.id}?alimId=${alimId}`, { method: "DELETE" }).then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "Unable to remove availability.");
        }
      })));
      const nextRecords = [...savedAvailability.filter((record) => !removedSlots.some((removed) => removed.id === record.id)), ...addedRecords];
      setSavedAvailability(nextRecords);
      setSavedSlots(nextRecords.map((record) => record.slot));
      setMessage(newSlots.length || removedSlots.length ? "Availability updated successfully." : "All selected slots are already saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save availability.");
    } finally {
      setSaving(false);
    }
  };

  const getToday = () => {
    const daysName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Date();
    return {
      date: today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      day: daysName[today.getDay()],
    };
  };

  const { date, day } = getToday();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 pb-28 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-xs transition-all">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <Link
            href="/alim-dashboard"
            aria-label="Back to dashboard"
            className="mr-3 p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900">Set Availability</h1>
            <p className="text-xs font-medium text-gray-500">Choose your recurring weekly time slots</p>
          </div>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className="sticky top-[61px] z-20 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-2xs">
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex gap-2">
          {[
            { id: "weekly", label: "Weekly Schedule", icon: Calendar },
            { id: "specific", label: "Specific Dates", icon: CalendarDays },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  isActive
                    ? "bg-green-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Body */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === "weekly" && (
          <div className="space-y-6">
            {/* Current Date Card */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50/40 border border-green-200/80 rounded-xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100/80 px-2 py-0.5 rounded-md mb-1">
                  Today
                </span>
                <h2 className="text-base font-bold text-gray-900">{day}, {date}</h2>
                <p className="text-xs font-medium text-green-700 mt-0.5">Current day: {day}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-600/10 text-green-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Section Header */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 px-1">
                Select Weekly Availability
              </h2>
              <p className="text-xs text-gray-500 px-1">
                Check the slots when you are open for appointments.
              </p>
            </div>

            {/* Schedule Matrix Table */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200/80">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-green-600 text-white">
                      <th className="sticky left-0 bg-green-600 px-3.5 py-3 text-xs font-bold whitespace-nowrap z-10 shadow-xs">
                        Time Slot
                      </th>
                      {days.map((dayName, idx) => (
                        <th
                          key={idx}
                          className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider min-w-[50px]"
                        >
                          {dayName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {timeSlots.map((time, timeIdx) => (
                      <tr
                        key={timeIdx}
                        className={`transition-colors ${
                          timeIdx % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                        } hover:bg-gray-100/50`}
                      >
                        <td className="sticky left-0 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-700 whitespace-nowrap border-r border-gray-100 z-10 shadow-xs">
                          <div className="font-semibold text-gray-900">{time.split("-")[0]}</div>
                          <div className="text-[11px] text-gray-400">{time.split("-")[1]}</div>
                        </td>
                        {days.map((_, dayIdx) => {
                          const selected = isSlotSelected(dayIdx, timeIdx);
                          return (
                            <td
                              key={dayIdx}
                              className={`px-3 py-2.5 text-center transition-colors ${
                                selected ? "bg-green-50/80" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleSlot(dayIdx, timeIdx)}
                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer accent-green-600 transition-transform active:scale-95"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Specific Dates Tab View */}
        {activeTab === "specific" && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center shadow-sm min-h-[16rem] flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Specific Date Override
            </h3>
            <p className="text-xs text-gray-500 max-w-xs">
              Date-specific availability overrides will be available here soon.
            </p>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-medium text-center transition-all ${
              message.toLowerCase().includes("unable") || message.toLowerCase().includes("please")
                ? "bg-red-50 text-red-700 border border-red-200/80"
                : "bg-green-50 text-green-700 border border-green-200/80"
            }`}
          >
            {message}
          </div>
        )}

        {/* Save Action Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-70 text-white font-semibold py-3 px-4 rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Availability...</span>
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4" />
              <span>Save Availability</span>
            </>
          )}
        </button>
      </main>

    </div>
  );
}
