"use client";

import { useState } from "react";
import AdminTranscriptView from "@/components/AdminTranscriptView";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

type AdminTab = "transcripts" | "intelligence";

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("transcripts");

  const envToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN;

  if (!submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-sm shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800 mb-1">Advisory Evaluation</h1>
          <p className="text-sm text-gray-500 mb-6">Admin access · ETAP 8.5</p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSubmitted(true)}
            placeholder="Admin token"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-profitia-blue mb-3"
            autoFocus
          />
          <button
            onClick={() => setSubmitted(true)}
            className="w-full bg-profitia-navy hover:bg-profitia-blue text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            Access
          </button>
          {envToken && (
            <button
              onClick={() => { setToken(envToken); setSubmitted(true); }}
              className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Use env token
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Behavioral Feedback Intelligence</h1>
            <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-widest">
              Advisory Evaluation · ETAP 8.5 · EVAL-1
            </p>
          </div>
          <button
            onClick={() => { setSubmitted(false); setToken(""); }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Exit
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center border-b border-gray-200 mb-8">
          {([
            { key: "transcripts" as AdminTab, label: "Transcripts" },
            { key: "intelligence" as AdminTab, label: "Intelligence" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={[
                "px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === key
                  ? "border-profitia-navy text-profitia-navy"
                  : "border-transparent text-gray-400 hover:text-gray-600",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "transcripts" && (
          <AdminTranscriptView adminToken={token} />
        )}
        {activeTab === "intelligence" && (
          <AnalyticsDashboard adminToken={token} />
        )}
      </div>
    </div>
  );
}
