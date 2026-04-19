import { AlertTriangle, ArrowUpRight, CheckCircle2, Info } from "lucide-react"

const CLAIMS = [
  {
    q: "Does seed oil cause inflammation?",
    status: "Mixed Evidence",
    tone: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
    icon: AlertTriangle,
    summary:
      "Meta-analyses show no clear causal link at typical dietary levels. Overall diet quality matters more.",
    sources: 14,
    tag: "Nutrition",
  },
  {
    q: "Is mouth taping actually healthy?",
    status: "Needs Nuance",
    tone: { bg: "#E0E7FF", text: "#3730A3", border: "#A5B4FC" },
    icon: Info,
    summary:
      "Small studies suggest benefits for mild snoring, but risks exist for people with undiagnosed sleep apnea.",
    sources: 9,
    tag: "Sleep",
  },
  {
    q: "Can detox teas help with weight loss?",
    status: "Unsupported",
    tone: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
    icon: AlertTriangle,
    summary:
      "No credible evidence supports detox claims. Most effects come from laxatives or short-term water loss.",
    sources: 11,
    tag: "Weight loss",
  },
  {
    q: "Does creatine help with brain function?",
    status: "Likely True",
    tone: { bg: "#DCFCE7", text: "#166534", border: "#86CB92" },
    icon: CheckCircle2,
    summary:
      "Emerging RCTs show modest cognitive benefits, particularly under sleep deprivation or stress.",
    sources: 12,
    tag: "Cognition",
  },
  {
    q: "Are blue-light glasses worth it?",
    status: "Unsupported",
    tone: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
    icon: AlertTriangle,
    summary:
      "Cochrane reviews find no meaningful benefit on eye strain, sleep, or visual performance.",
    sources: 8,
    tag: "Vision",
  },
  {
    q: "Does cold plunging boost immunity?",
    status: "Needs Nuance",
    tone: { bg: "#E0E7FF", text: "#3730A3", border: "#A5B4FC" },
    icon: Info,
    summary:
      "Short-term immune markers shift, but long-term real-world immunity benefits remain unclear.",
    sources: 10,
    tag: "Recovery",
  },
]

export default function SampleClaims() {
  return (
    <section
      id="sample-claims"
      className="relative border-t border-slate-100/70 py-20 md:py-28"
      data-testid="sample-claims-section"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#71B48D]">
              Sample claims
            </div>
            <h2 className="font-serif-display text-3xl font-medium leading-[1.08] tracking-tight text-[#251F47] md:text-[2.5rem]">
              Real questions, clear answers.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-[#404E7C]">
              A glimpse of the claims people bring to MythMD every day.
            </p>
          </div>
          <a
            href="#tool"
            className="hidden items-center gap-1.5 text-sm font-medium text-[#251F47] transition-colors hover:text-[#71B48D] md:inline-flex"
            data-testid="sample-claims-try-cta"
          >
            Try one yourself
            <ArrowUpRight size={15} />
          </a>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {CLAIMS.map((claim, index) => {
            const Icon = claim.icon

            return (
              <button
                key={claim.q}
                type="button"
                onClick={() => {
                  document.getElementById("tool")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }}
                className="group text-left rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#86CB92]/60 md:p-6"
                style={{ boxShadow: "0 6px 22px -16px rgba(37, 31, 71, 0.10)" }}
                data-testid={`sample-claim-${index}`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {claim.tag}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide"
                    style={{
                      backgroundColor: claim.tone.bg,
                      color: claim.tone.text,
                      borderColor: claim.tone.border,
                    }}
                  >
                    <Icon size={11} />
                    {claim.status}
                  </span>
                </div>
                <p className="font-serif-display text-[1.15rem] font-semibold leading-snug text-[#251F47] md:text-[1.22rem]">
                  {claim.q}
                </p>
                <p className="mt-2.5 line-clamp-3 text-[13.5px] leading-relaxed text-[#404E7C]">
                  {claim.summary}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-[11.5px] text-slate-500">
                    Based on <span className="font-semibold text-[#251F47]">{claim.sources}</span>{" "}
                    studies
                  </span>
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#71B48D] transition-colors group-hover:text-[#251F47]">
                    Explore
                    <ArrowUpRight
                      size={13}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
