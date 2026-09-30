"use client";

import { useEffect, useState } from "react";
import { Heart, BookOpen, Droplet, Home, Calendar, User } from "lucide-react";
import Link from "next/link";

type Service = {
  id: number;
  name: string;
  description?: string | null;
};

type DashboardService = {
  name: string;
  description: string;
  icon: typeof Heart;
  color: string;
  iconColor: string;
};

type Favorite = { alimId: number; name: string; area?: string | null };

const dashboardServices: DashboardService[] = [
  {
    name: "Nikah",
    description: "Marriage ceremony",
    icon: Heart,
    color: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  {
    name: "Janazah",
    description: "Funeral prayer",
    icon: Droplet,
    color: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    name: "Dua",
    description: "Prayer service",
    icon: BookOpen,
    color: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    name: "Quran Khawani",
    description: "Quran recitation",
    icon: BookOpen,
    color: "bg-purple-100",
    iconColor: "text-purple-600",
  },
];

const normalizeName = (value: string) => value.trim().toLowerCase();

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [services, setServices] = useState<Service[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const recentActivity: unknown[] = [];

  useEffect(() => {
    let ignore = false;

    async function loadServices() {
      try {
        setErrorMessage("");
        const response = await fetch("/api/services");
        const data = await response.json();
        const serviceList = Array.isArray(data) ? data : data?.services ?? [];

        if (!ignore) {
          setServices(serviceList);
        }
      } catch {
        if (!ignore) {
          setErrorMessage("Unable to load services from the database.");
          setServices([]);
        }
      }
    }

    loadServices();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;
    const customerId = user?.id ?? user?.userId;
    if (!customerId) return;
    void fetch(`/api/favorites?customerId=${customerId}`)
      .then((response) => response.ok ? response.json() : [])
      .then((data: Favorite[]) => setFavorites(Array.isArray(data) ? data : []))
      .catch(() => setFavorites([]));
  }, []);

  return (
    <div className="customer-dashboard min-h-screen bg-green-50 pb-24">
      <div className="bg-white border-b border-gray-200">
      <div className="customer-dashboard-content mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alim Online</h1>
            <p className="text-sm text-gray-500 mt-1">Islamic Services</p>
          </div>
          <Link href="/customer-dashboard/profile" className="bg-green-600 hover:bg-green-700 text-white rounded-full p-3 transition">
            <User className="w-6 h-6" />
          </Link>
        </div>
      </div>

      <main className="customer-dashboard-content mx-auto px-4 py-8 md:py-10">
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="customer-dashboard-services grid gap-4 mb-8 md:gap-6">
          {dashboardServices.map((service) => {
            const serviceRecord = services.find(
              (item) => normalizeName(item.name) === normalizeName(service.name),
            );
            const href = serviceRecord
              ? `/customer-dashboard/service/${serviceRecord.id}`
              : "#";
            const IconComponent = service.icon;

            return (
              <Link
                key={service.name}
                href={href}
                aria-disabled={!serviceRecord}
                onClick={(event) => {
                  if (!serviceRecord) {
                    event.preventDefault();
                  }
                }}
                className={`bg-white rounded-xl p-6 shadow-sm transition block text-center ${
                  serviceRecord ? "cursor-pointer hover:shadow-md" : "cursor-not-allowed opacity-70"
                }`}
              >
                <div className={`${service.color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <IconComponent className={`w-6 h-6 ${service.iconColor}`} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{service.name}</h3>
                <p className="text-xs text-gray-500">{service.description}</p>
              </Link>
            );
          })}
        </div>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Favorite Aalims</h2>
            <Heart className="h-5 w-5 text-rose-500" />
          </div>
          <div className="space-y-3">
            {favorites.length === 0 ? (
              <div className="rounded-lg bg-white p-5 text-sm text-gray-500 shadow-sm">No favorite Aalims yet.</div>
            ) : favorites.map((favorite) => (
              <div key={favorite.alimId} className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
                <div>
                  <p className="font-semibold text-gray-900">{favorite.name}</p>
                  <p className="text-sm text-gray-500">{favorite.area || "Location not provided"}</p>
                </div>
                <Heart className="h-5 w-5 fill-current text-rose-500" />
              </div>
            ))}
          </div>
        </section>

        <Link href="/customer-dashboard/quran-progress" className="mb-8 flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm hover:shadow-md">
          <BookOpen className="h-6 w-6 text-emerald-600" />
          <span><span className="block font-semibold text-gray-900">Aalim Tutor progress</span><span className="text-sm text-gray-500">Review your tutor&apos;s lessons and attendance</span></span>
        </Link>

        <Link href="/customer-dashboard/quran-classes" className="mb-8 flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm hover:shadow-md">
          <BookOpen className="h-6 w-6 text-emerald-600" />
          <span><span className="block font-semibold text-gray-900">Find a Quran teacher</span><span className="text-sm text-gray-500">Enroll in Quran or Qaida classes</span></span>
        </Link>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg p-8 text-center text-gray-500 shadow-sm">
            {recentActivity.length > 0 ? (
              <div className="space-y-4" />
            ) : (
              <div className="flex flex-col items-center">
                <Calendar className="w-12 h-12 text-gray-300 mb-3" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <nav aria-label="Customer navigation" className="customer-dashboard-nav fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:static">
        <div className="customer-dashboard-nav-inner mx-auto px-4 flex justify-around">
          {[
            { id: "home", label: "Home", icon: Home },
            { id: "appointments", label: "Appointments", icon: Calendar },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            const href = tab.id === "home" ? "/customer-dashboard" : `/customer-dashboard/${tab.id}`;

            return (
              <Link
                key={tab.id}
                href={href}
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className="customer-dashboard-nav-link flex-1 flex flex-col items-center justify-center py-4 text-xs font-medium transition"
              >
                <IconComponent className={`w-6 h-6 mb-1 ${isActive ? "text-green-600" : "text-gray-400"}`} />
                <span className={isActive ? "text-green-600" : "text-gray-600"}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
