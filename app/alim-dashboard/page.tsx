"use client";

import { useState } from "react";
import {
  Home,
  Calendar,
  FileText,
  User,
  FileStack,
  Clock,
  MessageSquare,
  UserCheck,
} from "lucide-react";
import Link from "next/link";

export default function AlimDashboard() {
  const [activeTab, setActiveTab] = useState("home");

  const stats = [
    { label: "Pending", count: 8, color: "text-teal-600" },
    { label: "Scheduled", count: 12, color: "text-blue-600" },
    { label: "Completed", count: 24, color: "text-green-600" },
  ];

  const quickActions = [
    {
      title: "New Requests",
      icon: FileStack,
      badge: 1,
      color: "bg-teal-100",
      iconColor: "text-teal-600",
      href: "/alim-dashboard/new-requests",
    },
    {
      title: "My Appointments",
      icon: Calendar,
      badge: 12,
      color: "bg-blue-100",
      iconColor: "text-blue-600",
      href: "/alim-dashboard/my-appointments",
    },
    {
      title: "Availability",
      icon: Clock,
      badge: null,
      color: "bg-purple-100",
      iconColor: "text-purple-600",
      href: "/alim-dashboard/availability",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alim Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your services</p>
          </div>
          <Link href="/alim-dashboard/profile" className="bg-green-600 hover:bg-green-700 text-white rounded-full p-3 transition">
            <User className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer block"
              >
                <div className="relative mb-4">
                  <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <IconComponent className={`w-6 h-6 ${action.iconColor}`} />
                  </div>
                  {action.badge !== null && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {action.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{action.title}</h3>
              </Link>
            );
          })}
        </div>

        {/* Today's Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Today's Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                  {stat.count}
                </div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Placeholder content */}
        <div className="bg-white rounded-lg p-8 text-center text-gray-500 min-h-96 flex items-center justify-center">
          <p>Welcome to your Alim Dashboard</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-2xl mx-auto px-4 flex justify-around">
          {[
            { id: "home", label: "Home", icon: Home },
            { id: "requests", label: "Requests", icon: Calendar },
            { id: "history", label: "History", icon: FileText },
            { id: "profile", label: "Profile", icon: User },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            const href =
              tab.id === "home"
                ? "/alim-dashboard"
                : tab.id === "requests"
                ? "/alim-dashboard/new-requests"
                : `/alim-dashboard/${tab.id}`;
            
            return (
              <Link
                key={tab.id}
                href={href}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center justify-center py-4 text-xs font-medium transition"
              >
                <IconComponent
                  className={`w-6 h-6 mb-1 ${
                    isActive ? "text-green-600" : "text-gray-400"
                  }`}
                />
                <span
                  className={isActive ? "text-green-600" : "text-gray-600"}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
