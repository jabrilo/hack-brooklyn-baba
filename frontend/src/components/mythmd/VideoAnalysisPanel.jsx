import { FileText, Info, Link2, Microscope } from "lucide-react"
import ResultCard from "./ResultCard"

const STATUS_META = {
  metadata_only: {
    label: "Metadata only",
    tone: {
      bg: "#E0E7FF",
      text: "#3730A3",
      border: "#A5B4FC",
    },
    description: "Analysis used public page text because a spoken transcript was not available.",
  },
  transcript_failed: {
    label: "Transcript unavailable",
    tone: {
      bg: "#FEE2E2",
      text: "#991B1B",
      border: "#FCA5A5",
    },
    description: "We could not retrieve enough public text to analyze this link.",
  },
  unsupported_url: {
    label: "Unsupported URL",
    tone: {
      bg: "#FEE2E2",
      text: "#991B1B",
      border: "#FCA5A5",
    },
    description: "This backend currently supports public TikTok, Instagram, and YouTube URLs.",
  },
  manual_input: {
    label: "Manual input",
    tone: {
      bg: "#DCFCE7",
      text: "#166534",
      border: "#86CB92",
    },
    description: "Analysis used text that was provided directly.",
  },
}

function formatValue(value) {
  if (!value && value !== 0) {
    return "Unavailable"
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function MetaPill({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
      <p className="text-[13.5px] font-medium leading-relaxed text-[#251F47]">{formatValue(value)}</p>
    </div>
  )
}

export default function VideoAnalysisPanel({ response }) {
  const status = STATUS_META[response?.transcript_status] || STATUS_META.metadata_only
  const results = Array.isArray(response?.results) ? response.results : []

  return (
    <div className="space-y-6" data-testid="video-analysis-results">
      <div
        className="rounded-[24px] border border-slate-100 bg-white p-6 md:p-7"
        style={{ boxShadow: "0 16px 44px -24px rgba(37, 31, 71, 0.18)" }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Video or post analysis
            </div>
            <p className="break-all text-[15px] font-medium leading-snug text-[#251F47] md:text-base">
              {response?.video_url}
            </p>
          </div>
          <span
            className="inline-flex shrink-0 items-center rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: status.tone.bg,
              color: status.tone.text,
              borderColor: status.tone.border,
            }}
          >
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetaPill label="Platform" value={response?.platform} />
          <MetaPill label="Transcript source" value={response?.transcript_source} />
          <MetaPill label="Transcript quality" value={response?.transcript_quality} />
          <MetaPill label="Claims found" value={results.length} />
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71B48D]">
            <Info size={13} />
            Status notes
          </div>
          <p className="text-sm leading-relaxed text-[#260F26] md:text-[14.5px]">
            <span className="font-semibold text-[#251F47]">{status.description}</span>{" "}
            {response?.notes || ""}
          </p>
        </div>

        {response?.transcript ? (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71B48D]">
              <FileText size={13} />
              Analyzed text excerpt
            </div>
            <p className="line-clamp-6 whitespace-pre-line text-[13.5px] leading-relaxed text-[#404E7C]">
              {response.transcript}
            </p>
          </div>
        ) : null}

        {results.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              <Microscope size={13} />
              Claim extraction
            </div>
            <p className="text-[14px] leading-relaxed text-[#404E7C]">
              MythMD could not extract a checkable health claim from the available public text for
              this link.
            </p>
          </div>
        ) : null}
      </div>

      {results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#71B48D]">
            <Link2 size={13} />
            Extracted claims
          </div>
          {results.map((item, index) => (
            <ResultCard
              key={`${item.claim}-${index}`}
              claim={item.claim}
              mode="analyze"
              result={item.analysis}
              studyCount={item.pubmed_results_found}
              speakerText={item.speaker_text}
              reason={item.reason}
              searchFocus={item.search_focus}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
