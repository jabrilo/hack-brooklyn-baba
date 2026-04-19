import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Info,
  ShieldCheck,
} from "lucide-react"

const STATUSES = {
  mixed: {
    label: "Mixed Evidence",
    icon: AlertTriangle,
    bg: "#FEF3C7",
    text: "#92400E",
    border: "#FCD34D",
    dot: "#D97706",
  },
  unsupported: {
    label: "Unsupported",
    icon: AlertTriangle,
    bg: "#FEE2E2",
    text: "#991B1B",
    border: "#FCA5A5",
    dot: "#DC2626",
  },
  likely_true: {
    label: "Likely True",
    icon: CheckCircle2,
    bg: "#DCFCE7",
    text: "#166534",
    border: "#86CB92",
    dot: "#16A34A",
  },
  needs_nuance: {
    label: "Needs Nuance",
    icon: Info,
    bg: "#E0E7FF",
    text: "#3730A3",
    border: "#A5B4FC",
    dot: "#4F46E5",
  },
}

function getStatusKey(verdict, confidenceScore) {
  const normalizedVerdict = (verdict || "").toLowerCase()

  if (normalizedVerdict.startsWith("true:")) {
    return "likely_true"
  }

  if (normalizedVerdict.startsWith("false:")) {
    return "unsupported"
  }

  if (confidenceScore >= 70) {
    return "mixed"
  }

  if (confidenceScore >= 35) {
    return "needs_nuance"
  }

  return "unsupported"
}

function getConfidenceLabel(confidenceScore) {
  if (confidenceScore >= 80) return "Strong"
  if (confidenceScore >= 60) return "Moderate"
  if (confidenceScore >= 35) return "Preliminary"
  return "Limited"
}

function formatHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "Source"
  }
}

function MetaBlock({ label, value, className = "" }) {
  if (!value) {
    return null
  }

  return (
    <div className={`rounded-xl border border-slate-100 bg-slate-50/70 p-4 ${className}`}>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
      <p className="text-[13.5px] leading-relaxed text-[#404E7C]">{value}</p>
    </div>
  )
}

export default function ResultCard({
  claim,
  mode,
  result,
  studyCount = 0,
  speakerText = "",
  reason = "",
  searchFocus = "",
}) {
  const citations = Array.isArray(result?.citations) ? result.citations : []
  const confidenceScore = Math.max(0, Math.min(100, Number(result?.confidence_score) || 0))
  const normalizedStudyCount = Math.max(0, Number(studyCount) || 0)
  const status = STATUSES[getStatusKey(result?.verdict, confidenceScore)]
  const Icon = status.icon

  return (
    <div
      className="relative rounded-[24px] border border-slate-100 bg-white p-6 md:p-7"
      style={{ boxShadow: "0 16px 44px -24px rgba(37, 31, 71, 0.18)" }}
      data-testid="result-card"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {mode === "analyze" ? "Extracted claim" : "Your question"}
          </div>
          <p className="line-clamp-3 text-[15px] font-medium leading-snug text-[#251F47] md:text-base">
            {claim}
          </p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide"
          style={{
            backgroundColor: status.bg,
            color: status.text,
            borderColor: status.border,
          }}
          data-testid="status-badge"
        >
          <span
            className="soft-pulse h-1.5 w-1.5 rounded-full"
            style={{ background: status.dot }}
            aria-hidden="true"
          />
          <Icon size={12} />
          {status.label}
        </span>
      </div>

      {speakerText || reason || searchFocus ? (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetaBlock label="Source text" value={speakerText} />
          <MetaBlock label="Why this was checked" value={reason} />
          <MetaBlock label="Research focus" value={searchFocus} className="sm:col-span-2" />
        </div>
      ) : null}

      <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71B48D]">
          <ShieldCheck size={13} />
          Evidence summary
        </div>
        <p className="text-sm leading-relaxed text-[#260F26] md:text-[14.5px]">
          <span className="font-semibold text-[#251F47]">{result?.verdict || "Uncertain"}</span>{" "}
          {result?.summary || "No summary was returned for this result."}
        </p>
      </div>

      <div className="space-y-2.5" data-testid="study-list">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Sources ({citations.length})
        </div>
        {citations.length > 0 ? (
          citations.map((citation, index) => (
            <a
              key={`${citation.url || citation.title || "citation"}-${index}`}
              href={citation.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3.5 transition-all hover:border-[#86CB92] hover:bg-[#86CB92]/[0.04]"
              data-testid={`study-link-${index}`}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#86CB92]/10 text-[#71B48D] transition group-hover:bg-[#86CB92]/20">
                <BookOpen size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-[13px] font-semibold text-[#251F47]">
                    {formatHost(citation.url)}
                  </span>
                  <span className="text-[11px] text-slate-400">· linked citation</span>
                </div>
                <p className="line-clamp-2 text-[13.5px] leading-snug text-[#404E7C]">
                  {citation.title || citation.url}
                </p>
              </div>
              <ExternalLink
                size={15}
                className="mt-1 shrink-0 text-slate-300 transition group-hover:text-[#71B48D]"
              />
            </a>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-[13.5px] leading-relaxed text-slate-500">
            No citation links were returned for this analysis.
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-5" data-testid="confidence-meter">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-[0.08em] text-slate-500">
            Strength of evidence
          </span>
          <span className="font-semibold text-[#251F47]">
            {confidenceScore}% · {getConfidenceLabel(confidenceScore)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="fill-bar h-full rounded-full"
            style={{
              "--fill": `${confidenceScore}%`,
              background: "linear-gradient(90deg, #86CB92 0%, #71B48D 60%, #404E7C 100%)",
            }}
          />
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-slate-400">
          Based on {normalizedStudyCount} PubMed{" "}
          {normalizedStudyCount === 1 ? "abstract" : "abstracts"} reviewed.
        </p>
      </div>
    </div>
  )
}
