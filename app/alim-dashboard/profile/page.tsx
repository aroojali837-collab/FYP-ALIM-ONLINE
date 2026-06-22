"use client";

import { useState } from "react";
import { ChevronLeft, Settings } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "Alim Name",
    email: "alim@example.com",
    phone: "+92 300 1234567",
    city: "Karachi",
    qualification: "Dars-e-Nizami, Islamic Studies",
    selectedFiqh: "Hanafi",
    services: ["Nikah", "Dua", "Janaza", "Quran Khawani"],
  });

  const [editData, setEditData] = useState(profileData);
  const [selectedServices, setSelectedServices] = useState(profileData.services);
  const [selectedFiqh, setSelectedFiqh] = useState(profileData.selectedFiqh);

  const allServices = ["Nikah", "Dua", "Janaza", "Quran Khawani"];
  const fiqhOptions = ["Hanafi", "Shafi", "Maliki", "Hanbali"];

  const handleInputChange = (field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleServiceToggle = (service: string) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter((s) => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleSave = () => {
    setProfileData({
      ...editData,
      services: selectedServices,
      selectedFiqh: selectedFiqh,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(profileData);
    setSelectedServices(profileData.services);
    setSelectedFiqh(profileData.selectedFiqh);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/alim-dashboard" className="mr-4">
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Profile</h1>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 relative">
              👤
              <button className="absolute bottom-0 right-0 bg-green-600 border-2 border-white rounded-full p-1">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 12.172V16h3.828l9.586-9.586a2 2 0 000-2.828z" />
                </svg>
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{profileData.fullName}</h2>
            <p className="text-sm text-gray-600">{profileData.email}</p>
          </div>

          {/* Basic Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={editData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 text-sm ${
                  isEditing ? "bg-white" : "bg-gray-50"
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={editData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 text-sm ${
                  isEditing ? "bg-white" : "bg-gray-50"
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={editData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 text-sm ${
                  isEditing ? "bg-white" : "bg-gray-50"
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={editData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 text-sm ${
                  isEditing ? "bg-white" : "bg-gray-50"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Qualification Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Qualification
          </label>
          <input
            type="text"
            value={editData.qualification}
            onChange={(e) => handleInputChange("qualification", e.target.value)}
            disabled={!isEditing}
            className={`w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 text-sm ${
              isEditing ? "bg-white" : "bg-gray-50"
            }`}
          />
        </div>

        {/* Fiqh Selection */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Your Fiqh
          </label>
          <div className="grid grid-cols-2 gap-3">
            {fiqhOptions.map((fiqh) => (
              <button
                key={fiqh}
                onClick={() => isEditing && setSelectedFiqh(fiqh)}
                disabled={!isEditing}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition flex items-center justify-center gap-2 ${
                  selectedFiqh === fiqh
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 bg-white text-gray-700"
                } ${!isEditing ? "cursor-not-allowed opacity-75" : ""}`}
              >
                {fiqh}
                {selectedFiqh === fiqh && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Your Services
          </label>
          <div className="grid grid-cols-2 gap-3">
            {allServices.map((service) => (
              <button
                key={service}
                onClick={() => isEditing && handleServiceToggle(service)}
                disabled={!isEditing}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition flex items-center justify-center gap-2 ${
                  selectedServices.includes(service)
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 bg-white text-gray-700"
                } ${!isEditing ? "cursor-not-allowed opacity-75" : ""}`}
              >
                {service}
                {selectedServices.includes(service) && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <>
            <button
              onClick={handleSave}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition"
            >
              Cancel
            </button>
          </>
        )}

        <Link
          href="/customer-dashboard"
          className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold py-3 rounded-lg transition text-center block"
        >
          💜 Switch to Customer Mode
        </Link>

        <Link
          href="/"
          className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-3 rounded-lg transition text-center block"
        >
          🚪 Logout
        </Link>
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
              <span className={tab.id === "profile" ? "text-green-600" : "text-gray-600"}>
                {tab.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
