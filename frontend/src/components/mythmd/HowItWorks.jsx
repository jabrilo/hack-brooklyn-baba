import { FileCheck2, MessageSquareQuote, Microscope } from "lucide-react"

const STEPS = [
  {
    icon: MessageSquareQuote,
    kicker: "Step 01",
    title: "Ask or paste",
    body: "Type a health claim you heard, or drop a link to a video or post you want to understand better.",
  },
  {
    icon: Microscope,
    kicker: "Step 02",
    title: "We review the evidence",
    body: "MythMD scans peer-reviewed studies, meta-analyses and trusted medical sources for what research actually shows.",
  },
  {
    icon: FileCheck2,
    kicker: "Step 03",
    title: "Get a clear answer",
    body: "You get a plainspoken summary, a claim status, and linked sources so you can decide with confidence.",
  },
]

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative border-t border-slate-100/70 py-20 md:py-28"
      data-testid="how-it-works-section"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <div className="max-w-2xl">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#71B48D]">
            How it works
          </div>
          <h2 className="font-serif-display text-3xl font-medium leading-[1.08] tracking-tight text-[#251F47] md:text-[2.5rem]">
            From claim to clarity in three steps.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[#404E7C]">
            A simple path from noisy health content to research you can trust.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:mt-16 md:grid-cols-3 md:gap-6">
          {STEPS.map((step, index) => {
            const Icon = step.icon

            return (
              <div
                key={step.title}
                className="relative rounded-2xl border border-slate-100 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[#86CB92]/60 md:p-7"
                style={{ boxShadow: "0 8px 30px -18px rgba(37, 31, 71, 0.12)" }}
                data-testid={`how-step-${index + 1}`}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#86CB92]/20 to-[#71B48D]/15 text-[#71B48D]">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {step.kicker}
                  </span>
                </div>
                <h3 className="font-serif-display text-[1.4rem] font-semibold leading-tight text-[#251F47]">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-[#404E7C]">
                  {step.body}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
