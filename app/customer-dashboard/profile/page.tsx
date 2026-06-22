"use client";

import { useState } from "react";
import { ChevronLeft, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CustomerProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "Customer Name",
    email: "customer@example.com",
    phone: "+92 300 1234567",
    city: "Karachi",
  });

  const [editData, setEditData] = useState(profileData);

  const handleInputChange = (field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    setProfileData(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/customer-dashboard" className="mr-4">
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
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
              👤
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
          href="/alim-dashboard"
          className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold py-3 rounded-lg transition text-center block"
        >
          💜 Switch to Alim Mode
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
            { id: "ask", label: "Ask", icon: "❓" },
            { id: "appointments", label: "Appointments", icon: "📅" },
            { id: "profile", label: "Profile", icon: "👤" },
          ].map((tab) => (
            <Link
              key={tab.id}
              href={
                tab.id === "home"
                  ? "/customer-dashboard"
                  : `/customer-dashboard/${tab.id}`
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
