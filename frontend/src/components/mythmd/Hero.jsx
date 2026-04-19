import { BookOpen, ShieldCheck, Stethoscope } from "lucide-react"
import ToolCard from "./ToolCard"

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0">
        <div
          className="absolute -left-24 -top-24 h-[520px] w-[520px] rounded-full blur-3xl opacity-50"
          style={{ background: "radial-gradient(circle, rgba(134,203,146,0.35), transparent 65%)" }}
        />
        <div
          className="absolute right-[-120px] top-40 h-[420px] w-[420px] rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle, rgba(64,78,124,0.22), transparent 65%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-10 md:px-10 md:pb-28 md:pt-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="order-1 lg:col-span-5">
            <div
              className="fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-[#86CB92]/30 bg-white/70 px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#71B48D] backdrop-blur"
              data-testid="hero-eyebrow"
            >
              <ShieldCheck size={13} />
              Evidence-first health insights
            </div>

            <h1
              className="fade-up delay-1 font-serif-display text-[2.6rem] font-medium leading-[1.02] tracking-tight text-[#251F47] sm:text-[3.2rem] lg:text-[3.75rem]"
              data-testid="hero-headline"
            >
              A trusted way to{" "}
              <span
                className="relative inline-block"
                style={{
                  background: "linear-gradient(100deg, #71B48D 20%, #404E7C 90%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                check health claims.
              </span>
            </h1>

            <p
              className="fade-up delay-2 mt-5 max-w-lg text-[17px] leading-relaxed text-[#404E7C] md:text-[18px]"
              data-testid="hero-subheadline"
            >
              Ask about a health claim, or paste a video or post. MythMD reviews what the
              research actually says, not the hype.
            </p>

            <div className="fade-up delay-3 mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <div className="flex items-center gap-2 text-[#251F47]">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#86CB92]/15">
                  <BookOpen size={15} className="text-[#71B48D]" />
                </div>
                <span className="font-medium">Peer-reviewed sources</span>
              </div>
              <div className="flex items-center gap-2 text-[#251F47]">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#86CB92]/15">
                  <Stethoscope size={15} className="text-[#71B48D]" />
                </div>
                <span className="font-medium">Plainspoken summaries</span>
              </div>
            </div>

            <p
              className="fade-up delay-4 mt-7 max-w-md text-xs leading-relaxed text-slate-500"
              data-testid="hero-trustline"
            >
              Evidence-informed insights backed by peer-reviewed research. MythMD is educational,
              not a substitute for medical care.
            </p>
          </div>

          <div className="order-2 lg:col-span-7">
            <ToolCard />
          </div>
        </div>
      </div>
    </section>
  )
}
