"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Settings } from "lucide-react";
import Link from "next/link";

export default function CustomerProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
  });

  const [editData, setEditData] = useState(profileData);

  useEffect(() => {
    async function loadProfile() {
      try {
        const userRaw = localStorage.getItem("user");
        const user = userRaw ? JSON.parse(userRaw) : null;
        const id = user?.id ?? user?.userId;
        if (!id) {
          setError("No user session found.");
          return;
        }

        setUserId(id);
        const response = await fetch(`/api/users/${id}`);
        const text = await response.text();

        let data: any = {};
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Backend returned non-JSON response.");
        }

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load profile");
        }

        const nextProfile = {
          fullName: data.fullName ?? "",
          email: data.email ?? "",
          phone: data.phoneNumber ?? "",
          city: data.city ?? "",
        };

        setProfileData(nextProfile);
        setEditData(nextProfile);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!userId) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editData.fullName,
          email: editData.email,
          phoneNumber: editData.phone,
          city: editData.city,
        }),
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save profile");
      }

      setProfileData(editData);
      localStorage.setItem("user", JSON.stringify({ ...(JSON.parse(localStorage.getItem("user") || "{}")), ...editData }));
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/customer-dashboard" className="mr-4">
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Profile</h1>
          </div>
          <button onClick={() => setIsEditing(!isEditing)} className="text-gray-600 hover:text-gray-900">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
              👤
            </div>
            <h2 className="text-xl font-bold text-gray-900">{loading ? "Loading..." : profileData.fullName || "Customer"}</h2>
            <p className="text-sm text-gray-600">{profileData.email}</p>
          </div>

          <div className="space-y-4">
            {(["fullName", "email", "phone", "city"] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field === "fullName" ? "Full Name" : field === "phone" ? "Phone" : field === "city" ? "City" : "Email"}
                </label>
                <input
                  type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                  value={editData[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  disabled={!isEditing || loading}
                  className={`w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 text-sm ${isEditing ? "bg-white" : "bg-gray-50"}`}
                />
              </div>
            ))}
          </div>
        </div>

        {isEditing && (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:bg-gray-400"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={handleCancel}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition"
            >
              Cancel
            </button>
          </>
        )}

        <Link href="/alim-dashboard" className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold py-3 rounded-lg transition text-center block">
          💜 Switch to Alim Mode
        </Link>

        <Link href="/" className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-3 rounded-lg transition text-center block">
          🚪 Logout
        </Link>
      </div>


    </div>
  );
}