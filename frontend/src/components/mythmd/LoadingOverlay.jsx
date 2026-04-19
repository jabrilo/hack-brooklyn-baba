import { useEffect, useState } from "react"

const PHRASES = [
  "Reviewing peer-reviewed studies…",
  "Cross-checking evidence…",
  "Analyzing claim strength…",
]

export default function LoadingOverlay() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setIndex((value) => (value + 1) % PHRASES.length)
    }, 900)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <>
      <div className="mm-progress" aria-hidden="true" />
      <div
        role="status"
        aria-live="polite"
        className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[28px] bg-white/70 px-6 text-center backdrop-blur-[2px]"
        data-testid="loading-overlay"
      >
        <div className="relative mb-4 h-12 w-12">
          <span
            className="absolute inset-0 rounded-full border-2 border-[#86CB92]/30"
            aria-hidden="true"
          />
          <span
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#71B48D] animate-spin"
            aria-hidden="true"
          />
        </div>
        <div
          key={index}
          className="phrase-in text-sm font-medium text-[#404E7C] md:text-[15px]"
          data-testid="loading-phrase"
        >
          {PHRASES[index]}
        </div>
        <div className="mt-2 text-xs text-slate-400">Scanning trusted medical databases</div>
      </div>
    </>
  )
}
