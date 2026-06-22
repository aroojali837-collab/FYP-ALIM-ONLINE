"use client";

import { useState } from "react";
import { ChevronLeft, Send } from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  question: string;
  category: string;
  date: string;
  status: string;
}

export default function AskPage() {
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      question: "What are the requirements for a valid Nikah?",
      category: "Nikah",
      date: "2024-02-20",
      status: "answered",
    },
    {
      id: "2",
      question: "How do I perform Dua correctly?",
      category: "Dua",
      date: "2024-02-25",
      status: "pending",
    },
  ]);

  const [newQuestion, setNewQuestion] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("General");

  const categories = ["General", "Nikah", "Dua", "Janaza", "Quran"];

  const handleAsk = () => {
    if (newQuestion.trim()) {
      setQuestions([
        ...questions,
        {
          id: Date.now().toString(),
          question: newQuestion,
          category: selectedCategory,
          date: new Date().toISOString().split("T")[0],
          status: "pending",
        },
      ]);
      setNewQuestion("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <Link href="/customer-dashboard" className="mr-4">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Ask a Question</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Ask Question Form */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Category
          </label>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Question
          </label>
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask your Islamic question..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none"
            rows={4}
          />

          <button
            onClick={handleAsk}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Ask Question
          </button>
        </div>

        {/* Questions List */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Questions</h2>
          <div className="space-y-3">
            {questions.length > 0 ? (
              questions.map((q) => (
                <div key={q.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1">{q.question}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ml-2 ${
                      q.status === "answered"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {q.status === "answered" ? "Answered" : "Pending"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{q.category}</p>
                  <p className="text-xs text-gray-400">{q.date}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No questions asked yet</p>
              </div>
            )}
          </div>
        </div>
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
              <span className={tab.id === "ask" ? "text-green-600" : "text-gray-600"}>
                {tab.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
