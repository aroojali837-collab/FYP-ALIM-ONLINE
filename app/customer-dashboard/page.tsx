"use client";

import { useState } from "react";
import { Heart, BookOpen, Droplet, MessageCircle, Home, HelpCircle, Calendar, User } from "lucide-react";
import Link from "next/link";

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("home");

  const services = [
    {
      id: 1,
      title: "Nikah",
      description: "Marriage ceremony",
      icon: Heart,
      color: "bg-pink-100",
      iconColor: "text-pink-600",
    },
    {
      id: 2,
      title: "Dua",
      description: "Prayer service",
      icon: BookOpen,
      color: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      id: 3,
      title: "Janaza",
      description: "Funeral prayer",
      icon: Droplet,
      color: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      id: 4,
      title: "Quran Khawani",
      description: "Quran recitation",
      icon: BookOpen,
      color: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      id: 5,
      title: "Ask Question",
      description: "Islamic guidance",
      icon: MessageCircle,
      color: "bg-pink-100",
      iconColor: "text-pink-600",
    },
  ];

  const recentActivity = [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alim Online</h1>
            <p className="text-sm text-gray-500 mt-1">Islamic Services</p>
          </div>
          <Link href="/customer-dashboard/profile" className="bg-green-600 hover:bg-green-700 text-white rounded-full p-3 transition">
            <User className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Services Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {services.filter(s => s.id !== 5).map((service) => {
            const IconComponent = service.icon;
            return (
              <Link
                key={service.id}
                href={`/customer-dashboard/service/${service.id}`}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer block text-center"
              >
                <div className={`${service.color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <IconComponent className={`w-6 h-6 ${service.iconColor}`} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{service.title}</h3>
                <p className="text-xs text-gray-500">{service.description}</p>
              </Link>
            );
          })}
          <Link
            href="/customer-dashboard/ask"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer block text-center"
          >
            <div className="bg-pink-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Ask Question</h3>
            <p className="text-xs text-gray-500">Islamic guidance</p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg p-8 text-center text-gray-500 shadow-sm">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {/* Activity items would go here */}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Calendar className="w-12 h-12 text-gray-300 mb-3" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-2xl mx-auto px-4 flex justify-around">
          {[
            { id: "home", label: "Home", icon: Home },
            { id: "ask", label: "Ask", icon: HelpCircle },
            { id: "appointments", label: "Appointments", icon: Calendar },
            { id: "profile", label: "Profile", icon: User },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            const href =
              tab.id === "home"
                ? "/customer-dashboard"
                : `/customer-dashboard/${tab.id}`;

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
