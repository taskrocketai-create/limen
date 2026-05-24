"use client";

import { useState, useCallback } from "react";

interface ComplianceIssue {
  text: string;
  issue: string;
  severity?: "warning" | "violation";
  suggestion?: string;
}

interface ComplianceSection {
  passed: boolean;
  issues: ComplianceIssue[];
  missing?: string[];
}

interface ComplianceResult {
  status: "ready" | "review" | "violation";
  fair_housing: ComplianceSection;
  unsupported_claims: ComplianceSection;
  missing_facts: ComplianceSection;
  platform_completeness: ComplianceSection;
  summary: string;
}

interface ComplianceCheckProps {
  listingId: string;
  outputId: string;
  content: string;
  onResult: (status: "ready" | "review" | "violation") => void;
  initialResult?: ComplianceResult | null;
}

function StatusIcon({ passed }: { passed: boolean }) {
  return passed
    ? <span className="text-emerald-600 text-sm">✓</span>
    : <span className="text-amber-500 text-sm">⚠</span>;
}

function IssueCard({ issue, type }: { issue: ComplianceIssue; type: "fair_housing" | "other" }) {
  const isViolation = issue.severity === "violation" || type === "fair_housing";
  return (
    <div className={`rounded-md p-3 space-y-1.5 ${isViolation ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
      {issue.text && (
        <p className="font-sans text-xs font-medium text-ink">
          <span className="opacity-50">Found: </span>
          &ldquo;{issue.text}&rdquo;
        </p>
      )}
      <p className={`font-sans text-xs ${isViolation ? "text-red-700" : "text-amber-700"}`}>{issue.issue}</p>
      {issue.suggestion && (
        <p className="font-sans text-xs text-stone">
          <span className="font-medium">Suggestion: </span>{issue.suggestion}
        </p>
      )}
    </div>
  );
}

export default function ComplianceCheck({
  listingId, outputId, content, onResult, initialResult
}: ComplianceCheckProps) {
  const [result, setResult] = useState<ComplianceResult | null>(initialResult ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/listings/${listingId}/compliance-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output_id: outputId, content }),
      });
      if (!res.ok) throw new Error("Check failed");
      const data: ComplianceResult = await res.json();
      setResult(data);
      onResult(data.status);
    } catch {
      setError("Compliance check failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [listingId, outputId, content, onResult]);

  const statusConfig = {
    ready: { label: "Ready to approve", color: "bg-emerald-50 border-emerald-200 text-emerald-800", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
    review: { label: "Needs review", color: "bg-amber-50 border-amber-200 text-amber-800", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700" },
    violation: { label: "Risky language found", color: "bg-red-50 border-red-200 text-red-800", dot: "bg-red-500", badge: "bg-red-100 text-red-700" },
  };

  const sections = result ? [
    { key: "fair_housing", label: "Fair Housing", data: result.fair_housing, type: "fair_housing" as const },
    { key: "unsupported_claims", label: "Unsupported Claims", data: result.unsupported_claims, type: "other" as const },
    { key: "missing_facts", label: "Fact Check", data: result.missing_facts, type: "other" as const },
    { key: "platform_completeness", label: "Platform Completeness", data: result.platform_completeness, type: "other" as const },
  ] : [];

  return (
    <div className="bg-white border border-stone/20 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone/10">
        <div>
          <h3 className="font-display text-lg text-ink">Pre-approval compliance check</h3>
          <p className="font-sans text-xs text-stone mt-0.5">Fair Housing · Unsupported claims · Fact check · Platform completeness</p>
        </div>
        <button
          onClick={runCheck}
          disabled={loading}
          className="px-4 py-2 bg-ink text-gilt font-sans text-xs tracking-widest uppercase hover:bg-gilt hover:text-ink transition-colors disabled:opacity-50"
        >
          {loading ? "Checking…" : result ? "Re-check" : "Run check"}
        </button>
      </div>

      {error && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-200">
          <p className="font-sans text-xs text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="px-5 py-8 flex items-center justify-center gap-3">
          <div className="w-4 h-4 border-2 border-gilt border-t-transparent rounded-full animate-spin" />
          <p className="font-sans text-sm text-stone">Reviewing listing content for compliance…</p>
        </div>
      )}

      {!loading && result && (
        <div className="divide-y divide-stone/10">
          {/* Summary bar */}
          <div className={`flex items-center gap-3 px-5 py-3 border ${statusConfig[result.status].color}`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConfig[result.status].dot}`} />
            <div className="flex-1">
              <span className={`font-sans text-xs font-medium px-2 py-0.5 rounded ${statusConfig[result.status].badge}`}>
                {statusConfig[result.status].label}
              </span>
              <p className="font-sans text-xs mt-1 opacity-80">{result.summary}</p>
            </div>
          </div>

          {/* Section breakdown */}
          {sections.map(({ key, label, data, type }) => (
            <div key={key}>
              <button
                onClick={() => setExpanded(expanded === key ? null : key)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-parchment/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <StatusIcon passed={data.passed} />
                  <span className="font-sans text-sm text-ink">{label}</span>
                  {!data.passed && (
                    <span className="font-sans text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      {data.issues?.length ?? 0} issue{(data.issues?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <span className="font-sans text-xs text-stone">{expanded === key ? "▲" : "▼"}</span>
              </button>

              {expanded === key && (
                <div className="px-5 pb-4 space-y-2">
                  {data.passed && !data.missing?.length && (
                    <p className="font-sans text-xs text-emerald-600">No issues found.</p>
                  )}
                  {data.issues?.map((issue, i) => (
                    <IssueCard key={i} issue={issue} type={type} />
                  ))}
                  {data.missing && data.missing.length > 0 && (
                    <div className="bg-parchment rounded-md p-3">
                      <p className="font-sans text-xs text-stone font-medium mb-1">Missing platform content:</p>
                      <div className="flex flex-wrap gap-1">
                        {data.missing.map((m) => (
                          <span key={m} className="font-sans text-xs bg-white border border-stone/20 text-stone px-2 py-0.5 rounded">{m}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Fair Housing badge */}
          {result.status === "ready" && (
            <div className="px-5 py-4 flex items-center gap-3 bg-emerald-50">
              <span className="text-2xl">🏠</span>
              <div>
                <p className="font-sans text-sm font-medium text-emerald-800">Fair Housing Reviewed</p>
                <p className="font-sans text-xs text-emerald-600">This listing passed a Fair Housing language review. Keep a copy of this check for your records.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !result && (
        <div className="px-5 py-8 text-center space-y-2">
          <p className="font-sans text-sm text-stone">Run a compliance check before approving this listing package.</p>
          <p className="font-sans text-xs text-stone/50">Checks for Fair Housing violations, unsupported claims, and platform completeness.</p>
        </div>
      )}
    </div>
  );
}
