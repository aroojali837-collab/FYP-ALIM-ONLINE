"use client";

import { useState } from "react";
import { ChevronLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function ServicePage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    service: "Service Request",
    fiqh: "Hanafi",
    location: { lat: 30.776453, lng: 70.957031, address: "" },
    date: "2026-05-01",
    time: "3:00 PM",
  });

  const services = {
    "1": { name: "Nikah", description: "Marriage ceremony" },
    "2": { name: "Dua", description: "Prayer service" },
    "3": { name: "Janaza", description: "Funeral prayer" },
    "4": { name: "Quran Khawani", description: "Quran recitation" },
  };

  const serviceData = services[serviceId as keyof typeof services];
  const serviceTitle = serviceData?.name || "Service Request";

  const fiqhOptions = ["Hanafi", "Shafi", "Maliki", "Hanbali"];

  const handleFiqhChange = (fiqh: string) => {
    setFormData((prev) => ({ ...prev, fiqh }));
  };

  const handleLocationChange = (address: string) => {
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, address },
    }));
  };

  const handleDateChange = (date: string) => {
    setFormData((prev) => ({ ...prev, date }));
  };

  const handleTimeChange = (time: string) => {
    setFormData((prev) => ({ ...prev, time }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFindAlims = () => {
    console.log("Find Alims with data:", formData);
    router.push(`/customer-dashboard/service/${serviceId}/nearby-alims`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <Link href="/customer-dashboard" className="mr-4">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Service Request</h1>
            <p className="text-xs text-gray-500">Step {currentStep} of 4</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full transition ${
                  step <= currentStep ? "bg-teal-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Step 1: Select Fiqh */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Select Your Fiqh</h2>
            <p className="text-sm text-gray-600">
              Which Islamic school of law do you prefer?
            </p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {fiqhOptions.map((fiqh) => (
                <button
                  key={fiqh}
                  onClick={() => handleFiqhChange(fiqh)}
                  className={`py-4 px-4 rounded-lg border-2 font-medium transition ${
                    formData.fiqh === fiqh
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {fiqh}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Choose Location */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Choose Location</h2>
            <p className="text-sm text-gray-600">
              Where do you want the service to be performed?
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address or Location Name
                </label>
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  placeholder="Enter your address or location"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Current coordinates:</p>
                  <p className="text-blue-700">
                    30.776453, 70.957031
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pick Date & Time */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Pick Date & Time</h2>
            <p className="text-sm text-gray-600">
              When would you like the service?
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review Details */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Review Details</h2>
            <p className="text-sm text-teal-600">
              Please verify your request details
            </p>

            <div className="space-y-5 mt-6">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Service
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {serviceTitle}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Fiqh
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {formData.fiqh}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Location
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {formData.location.lat}, {formData.location.lng}
                </p>
                {formData.location.address && (
                  <p className="text-sm text-gray-600">
                    Coordinates: {formData.location.lat.toFixed(3)}, {formData.location.lng.toFixed(3)}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Date
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {formData.date}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Time
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {formData.time}
                </p>
              </div>
            </div>

            {/* Alert Box */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
              <div className="flex items-start gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <p className="text-sm text-yellow-800">
                    <strong>Next,</strong> we&apos;ll show you nearby Alims within 5 KM radius of your selected location
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          {currentStep > 1 && (
            <button
              onClick={handlePrevious}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition"
            >
              ← Previous
            </button>
          )}
          {currentStep < 4 && (
            <button
              onClick={handleNext}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Next →
            </button>
          )}
          {currentStep === 4 && (
            <button
              onClick={handleFindAlims}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              Find Nearby Alims →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
