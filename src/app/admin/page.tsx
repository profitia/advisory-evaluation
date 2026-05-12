"use client";

import { useState } from "react";
import AdminTranscriptView from "@/components/AdminTranscriptView";

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const envToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN; // optional: pre-fill in dev

  if (!submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-sm shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800 mb-1">Admin Access</h1>
          <p className="text-sm text-gray-500 mb-6">Enter the admin token to view transcripts.</p>
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
            Access transcripts
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
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Evaluation Transcripts</h1>
            <p className="text-sm text-gray-500 mt-0.5">ETAP 8.5 — Human Feedback Environment</p>
          </div>
          <button
            onClick={() => { setSubmitted(false); setToken(""); }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Log out
          </button>
        </div>

        <AdminTranscriptView adminToken={token} />
      </div>
    </div>
  );
}
