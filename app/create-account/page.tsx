"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, User, Mail, Lock, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { apiFetch, getApiError } from "@/lib/api";

type UserRole = "customer" | "alim";

export default function CreateAccountPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>("customer");
  const [selectedFiqh, setSelectedFiqh] = useState("Hanafi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    city: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          role: userRole,
          fiqh: userRole === "alim" ? selectedFiqh : undefined,
        }),
      });

      if (!response.ok) {
        setError(await getApiError(response, "Registration failed"));
        return;
      }

      const result = await response.json();

      const registeredUser = result.user ?? {
        id: result.userId,
        userId: result.userId,
        role: userRole,
        fullName: formData.fullName,
        email: formData.email,
      };

      localStorage.setItem("user", JSON.stringify(registeredUser));
      localStorage.setItem("userId", String(registeredUser.id ?? registeredUser.userId));
      localStorage.setItem("userRole", registeredUser.role ?? userRole);

      // Redirect based on user role
      if (userRole === "alim") {
        router.push("/alim-dashboard/profile");
      } else {
        router.push("/customer-dashboard");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fiqhOptions = [
    { name: "Hanafi", col: 0 },
    { name: "Shafi", col: 1 },
    { name: "Maliki", col: 0 },
    { name: "Hanbali", col: 1 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-green-50 p-4">
      <div className="account-container max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            <span className="text-sm">Back</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Create Account</h1>
          <p className="text-green-600 text-sm font-medium">Join Alim Online</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div className="mb-8">
            <p className="text-sm font-medium text-gray-700 mb-4">Select Role</p>
            <div className="flex gap-4">
              {[
                { role: "customer" as const, label: "Customer", icon: "👤" },
                { role: "alim" as const, label: "Alim", icon: "📚" },
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={() => setUserRole(item.role)}
                  className={`flex-1 flex flex-col items-center justify-center py-4 px-6 rounded-xl border-2 transition ${
                    userRole === item.role
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl mb-2">{item.icon}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateAccount} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+92 300 1234567"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Enter your city"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>
            </div>

            {/* Fiqh Selection - Only for Alim */}
            {userRole === "alim" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Fiqh
                </label>
                <p className="text-xs text-gray-500 mb-3">Choose your Islamic school of thought</p>
                <div className="grid grid-cols-2 gap-3">
                  {fiqhOptions.map((fiqh) => (
                    <button
                      key={fiqh.name}
                      type="button"
                      onClick={() => setSelectedFiqh(fiqh.name)}
                      className={`py-3 px-4 rounded-lg border-2 font-medium transition flex items-center justify-center gap-2 ${
                        selectedFiqh === fiqh.name
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {fiqh.name}
                      {selectedFiqh === fiqh.name && (
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
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
            )}

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition duration-200 mt-6 disabled:bg-gray-400"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/" className="text-green-600 hover:text-green-700 font-medium">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
