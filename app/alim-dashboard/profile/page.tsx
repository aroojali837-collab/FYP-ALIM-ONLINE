"use client";

import { useEffect, useState } from "react";
import {
  User,
  Settings,
  ChevronRight,
  ArrowLeft,
  LogOut,
  UserCheck,
  Camera,
  Save,
  Check,
  Loader2,
  Edit3,
  Award,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  BookOpen,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const LocationMap = dynamic(() => import("@/app/customer-dashboard/service/[id]/LocationMap"), { ssr: false });

const normalizeServiceName = (name: string) => {
  const trimmedName = name.trim();
  return trimmedName.toLowerCase() === "janaza" ? "Janazah" : trimmedName;
};

export default function ProfilePage() {
  const router = useRouter();

  // Screen View States: 'main' (Default Profile) | 'edit' (Edit Form) | 'settings' (Settings View)
  const [currentView, setCurrentView] = useState<"main" | "edit" | "settings">("main");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    area: "",
    latitude: "",
    longitude: "",
    searchRadiusKm: "25",
    qualification: "",
    selectedFiqh: "Hanafi",
    services: [] as string[],
    experienceYears: "",
    bio: "",
    avatarUrl: "",
  });

  const [editData, setEditData] = useState(profileData);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedFiqh, setSelectedFiqh] = useState("Hanafi");

  const allServices = ["Nikah", "Janazah", "Dua", "Quran Khawani", "Quran Tutor"];
  const fiqhOptions = ["Hanafi", "Shafi", "Maliki", "Hanbali"];

  useEffect(() => {
    async function loadProfile() {
      try {
        const userRaw = localStorage.getItem("user");
        const user = userRaw ? JSON.parse(userRaw) : null;
        const id = user?.id ?? user?.userId;

        if (!id) {
          setLoading(false);
          return;
        }
        setUserId(id);

        const [userRes, alimRes] = await Promise.all([
          fetch(`/api/users/${id}`).catch(() => null),
          fetch(`/api/alims/${id}`).catch(() => null),
        ]);

        let userData: any = {};
        let alimData: any = {};

        if (userRes && userRes.ok) {
          const userText = await userRes.text();
          userData = userText ? JSON.parse(userText) : {};
        }

        if (alimRes && alimRes.ok) {
          const alimText = await alimRes.text();
          alimData = alimText ? JSON.parse(alimText) : {};
        }

        const loadedProfile = {
          fullName: userData.fullName || user?.fullName || "Alim User",
          email: userData.email || user?.email || "",
          phone: userData.phoneNumber || userData.phone || user?.phoneNumber || user?.phone || "",
          city: userData.city || alimData.city || "",
          area: alimData.areaLocation || alimData.area || "",
          latitude: alimData.latitude?.toString() || "",
          longitude: alimData.longitude?.toString() || "",
          searchRadiusKm: alimData.searchRadiusKm?.toString() || "25",
          qualification: alimData.qualification || "Islamic Scholar / Aalim",
          selectedFiqh: alimData.fiqh || "Hanafi",
          services: Array.isArray(alimData.services)
            ? alimData.services.map(normalizeServiceName)
            : [],
          experienceYears: alimData.experienceYears?.toString()
            || (typeof alimData.experience === "string" ? alimData.experience.match(/\d+/)?.[0] : "")
            || "",
          bio: alimData.bio || "",
          avatarUrl: userData.avatarUrl || user?.avatarUrl || "",
        };

        setProfileData(loadedProfile);
        setEditData(loadedProfile);
        setSelectedServices(loadedProfile.services);
        setSelectedFiqh(loadedProfile.selectedFiqh);
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleServiceToggle = (service: string) => {
    const normalizedService = normalizeServiceName(service);
    setSelectedServices((current) => current.includes(normalizedService)
      ? current.filter((item) => item !== normalizedService)
      : [...current, normalizedService]);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please choose an image file." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Profile photo must be 2 MB or smaller." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const source = new window.Image();
      source.onload = () => {
        const scale = Math.min(1, 512 / Math.max(source.naturalWidth, source.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          setMessage({ type: "error", text: "Could not process this image. Please choose another one." });
          return;
        }
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
        setEditData((current) => ({ ...current, avatarUrl: canvas.toDataURL("image/jpeg", 0.82) }));
        setMessage(null);
      };
      source.onerror = () => setMessage({ type: "error", text: "Could not open this image. Please choose another one." });
      source.src = reader.result;
    };
    reader.onerror = () => setMessage({ type: "error", text: "Could not read this image. Please choose another one." });
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    let persistedServices = selectedServices.map(normalizeServiceName);

    try {
      if (userId) {
        const responses = await Promise.all([
          fetch(`/api/users/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName: editData.fullName,
              phone: editData.phone,
              city: editData.city,
              avatarUrl: editData.avatarUrl,
            }),
          }),
          fetch(`/api/alims/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              qualification: editData.qualification,
              fiqh: selectedFiqh,
              services: persistedServices,
              experienceYears: editData.experienceYears.trim() ? Number(editData.experienceYears) : null,
              bio: editData.bio,
              area: editData.area,
              latitude: editData.latitude ? Number(editData.latitude) : null,
              longitude: editData.longitude ? Number(editData.longitude) : null,
              searchRadiusKm: editData.searchRadiusKm.trim() ? Number(editData.searchRadiusKm) : 25,
            }),
          }),
        ]);
        const failedResponse = responses.find((response) => !response.ok);
        if (failedResponse) {
          const body = await failedResponse.json().catch(() => ({}));
          throw new Error(body?.error ?? "Could not save your profile and services.");
        }
        const savedProfile = await responses[1].json().catch(() => ({}));
        if (Array.isArray(savedProfile.services)) {
          persistedServices = savedProfile.services.map(normalizeServiceName);
          setSelectedServices(persistedServices);
        }

        const storedUser = JSON.parse(localStorage.getItem("user") ?? "null");
        if (storedUser) {
          localStorage.setItem("user", JSON.stringify({
            ...storedUser,
            fullName: editData.fullName,
            phone: editData.phone,
            phoneNumber: editData.phone,
            city: editData.city,
            fiqh: selectedFiqh,
            avatarUrl: editData.avatarUrl,
          }));
        }
      }

      const updated = {
        ...editData,
        selectedFiqh,
        services: persistedServices,
      };

      setProfileData(updated);
      setMessage({ type: "success", text: "Profile successfully updated!" });
      setTimeout(() => {
        setMessage(null);
        setCurrentView("main");
      }, 1000);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update profile. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleSwitchToCustomer = () => {
    router.push("/customer-dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-800 pb-8">
      {/* Web Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {currentView !== "main" ? (
              <button
                onClick={() => setCurrentView("main")}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label="Back to profile"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white sm:flex">
                <BookOpen className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Alim Online</p>
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 md:text-xl">
                {currentView === "main" && "Professional Profile"}
                {currentView === "edit" && "Edit Profile"}
                {currentView === "settings" && "Account Settings"}
              </h1>
            </div>
          </div>

          <div className="min-w-[64px] flex justify-end">
            {currentView === "main" && (
              <button
                onClick={() => setCurrentView("settings")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            {currentView === "edit" && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Optimized for Web Application */}
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
            <p className="text-sm font-medium">Loading profile details...</p>
          </div>
        ) : (
          <>
            {/* Notification Toast */}
            {message && (
              <div
                className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-xs transition ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {message.text}
                </span>
                {message.type === "success" && <Check className="w-4 h-4 text-emerald-600" />}
              </div>
            )}

            {/* ==================== VIEW 1: MAIN PROFILE VIEW ==================== */}
            {currentView === "main" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Your public presence</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">Profile overview</h2>
                    <p className="mt-1 text-sm text-slate-500">Manage the information customers see when they find you.</p>
                  </div>
                  <span className={`mt-3 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold sm:mt-0 ${profileData.services.length > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                    <span className={`h-2 w-2 rounded-full ${profileData.services.length > 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {profileData.services.length > 0 ? "Listed for customers" : "Choose your services"}
                  </span>
                </div>

                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex h-28 items-end bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-700 px-6 pb-4 md:h-36 md:px-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Alim profile</p>
                  </div>
                  <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between md:p-8">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 text-2xl font-bold text-emerald-800 sm:h-24 sm:w-24 sm:text-3xl">
                        {profileData.avatarUrl ? (
                          <Image src={profileData.avatarUrl} alt={`${profileData.fullName} profile`} fill sizes="96px" unoptimized className="object-cover" />
                        ) : (
                          (profileData.fullName || "Alim User").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-bold tracking-tight text-slate-950 md:text-2xl">{profileData.fullName || "Alim User"}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-600"><Award className="h-4 w-4 shrink-0 text-emerald-700" /><span className="truncate">{profileData.qualification || "Islamic Scholar / Aalim"}</span></p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {profileData.city && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600"><MapPin className="h-3.5 w-3.5" />{profileData.city}</span>}
                      {profileData.selectedFiqh && <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">{profileData.selectedFiqh} fiqh</span>}
                    </div>
                  </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
                  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-slate-900">Professional details</h3>
                        <p className="mt-1 text-sm text-slate-500">A quick introduction for customers.</p>
                      </div>
                      <Briefcase className="h-5 w-5 shrink-0 text-emerald-700" />
                    </div>
                    <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">{profileData.bio || "Add a short introduction about your experience and the services you provide."}</p>
                    <div className="mt-6 grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-medium text-slate-500">Experience</p><p className="mt-1 font-bold text-slate-900">{profileData.experienceYears ? `${profileData.experienceYears} years` : "Add experience"}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-medium text-slate-500">School of thought</p><p className="mt-1 font-bold text-slate-900">{profileData.selectedFiqh}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-medium text-slate-500">Service radius</p><p className="mt-1 font-bold text-slate-900">{profileData.searchRadiusKm} km</p></div>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-slate-900">Services offered</h3>
                        <p className="mt-1 text-sm text-slate-500">Customers can find you by these services.</p>
                      </div>
                      <BookOpen className="h-5 w-5 shrink-0 text-emerald-700" />
                    </div>
                    {profileData.services.length > 0 ? (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {profileData.services.map((service) => (
                          <span key={service} className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{normalizeServiceName(service)}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">No services selected yet. Edit your profile to choose the services you offer.</p>
                    )}
                    <div className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
                      <p className="font-semibold text-slate-800">Contact</p>
                      <p className="mt-2 flex items-center gap-2 break-all"><Mail className="h-4 w-4 shrink-0 text-slate-400" />{profileData.email || "Email not added"}</p>
                      <p className="mt-2 flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-slate-400" />{profileData.phone || "Phone not added"}</p>
                    </div>
                  </section>
                </div>

                {/* Main Action Menu Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Card 1: Edit Profile */}
                  <button
                    onClick={() => {
                      setEditData(profileData);
                      setSelectedServices(profileData.services);
                      setSelectedFiqh(profileData.selectedFiqh);
                      setCurrentView("edit");
                    }}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                        <Edit3 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Edit Profile</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Update details, qualification & services</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                  </button>

                  {/* Card 2: Availability */}
                  <Link
                    href="/alim-dashboard/availability"
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition">
                        <CalendarDays className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Manage availability</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Set when customers can request you</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition" />
                  </Link>
                </div>
              </div>
            )}

            {/* ==================== VIEW 2: EDIT PROFILE FORM ==================== */}
            {currentView === "edit" && (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-100 text-lg font-bold text-emerald-800">
                      {editData.avatarUrl ? (
                        <Image src={editData.avatarUrl} alt="Selected profile" fill sizes="64px" unoptimized className="object-cover" />
                      ) : (
                        (editData.fullName || "Alim User").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">Profile photo</p>
                      <p className="mt-1 text-xs text-slate-500">JPG, PNG, or another image format. Maximum size: 2 MB.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <label htmlFor="alim-profile-photo" className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-700 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800">
                          <Camera className="h-4 w-4" />Choose photo
                        </label>
                        <input id="alim-profile-photo" type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
                        {editData.avatarUrl && (
                          <button type="button" onClick={() => setEditData((current) => ({ ...current, avatarUrl: "" }))} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                            Remove photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-600" />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      value={editData.fullName}
                      onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>Email (Read Only)</span>
                      </label>
                      <input
                        type="email"
                        disabled
                        value={editData.email}
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 outline-none cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <span>Phone Number</span>
                      </label>
                      <input
                        type="text"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>City</span>
                      </label>
                      <input
                        type="text"
                        value={editData.city}
                        onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                        placeholder="City"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-emerald-600" />
                        <span>Experience (Years)</span>
                      </label>
                      <input
                        type="number"
                        value={editData.experienceYears}
                        onChange={(e) => setEditData({ ...editData, experienceYears: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                        placeholder="Years of experience"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Area / Location</label>
                    <LocationMap
                      latitude={editData.latitude ? Number(editData.latitude) : null}
                      longitude={editData.longitude ? Number(editData.longitude) : null}
                      address={editData.area}
                      onChange={(latitude, longitude) => setEditData((current) => ({ ...current, latitude: String(latitude), longitude: String(longitude) }))}
                      onAddressChange={(area) => setEditData((current) => ({ ...current, area }))}
                    />
                    <p className="mt-1 text-xs text-slate-500">Location type karte waqt neeche suggestions mein se apna exact area select karein.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Customer Search Range (KM)</label>
                    <input type="number" min="1" max="500" step="1" value={editData.searchRadiusKm} onChange={(e) => setEditData({ ...editData, searchRadiusKm: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 outline-none" placeholder="e.g. 25" />
                    <p className="mt-1 text-xs text-slate-500">Customers will see you in normal range search only within this distance.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <span>Qualification / Degree</span>
                    </label>
                    <input
                      type="text"
                      value={editData.qualification}
                      onChange={(e) => setEditData({ ...editData, qualification: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                      placeholder="e.g. Dars-e-Nizami, M.A. Islamic Studies"
                    />
                  </div>

                  {/* Fiqh Options */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Fiqh / School of Thought
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                      {fiqhOptions.map((fiqh) => (
                        <button
                          key={fiqh}
                          type="button"
                          onClick={() => setSelectedFiqh(fiqh)}
                          className={`py-2.5 rounded-xl text-sm font-medium border transition ${
                            selectedFiqh === fiqh
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {fiqh}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Services Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">Services Offered</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {allServices.map((service) => {
                        const isSelected = selectedServices.includes(service);
                        return (
                          <button
                            key={service}
                            type="button"
                            onClick={() => handleServiceToggle(service)}
                            className={`inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium border transition ${
                              isSelected
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold shadow-xs"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span>{isSelected ? "✓" : "+"}</span>
                            <span>{service}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bio / Brief Summary</label>
                    <textarea
                      rows={3}
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition resize-none"
                      placeholder="Write brief description..."
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentView("main")}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ==================== VIEW 3: SETTINGS VIEW ==================== */}
            {currentView === "settings" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
                  {/* Switch Mode Option */}
                  <button
                    onClick={handleSwitchToCustomer}
                    className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">Login as Customer</span>
                        <span className="text-xs text-slate-500">Switch to customer dashboard view</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition" />
                  </button>

                  {/* Logout Option */}
                  <button
                    onClick={handleLogout}
                    className="w-full p-5 flex items-center justify-between hover:bg-red-50/50 transition group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition">
                        <LogOut className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-red-600 block">Logout</span>
                        <span className="text-xs text-slate-500">Sign out of your account securely</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

    </div>
  );
}
