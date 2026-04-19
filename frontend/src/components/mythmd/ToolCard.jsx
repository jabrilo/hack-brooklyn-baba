import { useRef, useState } from "react"
import { ArrowRight, Link2, Search, ShieldCheck, Sparkles } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { analyzeClaim, analyzeVideoUrl } from "@/lib/api"
import LoadingOverlay from "./LoadingOverlay"
import ResultCard from "./ResultCard"
import VideoAnalysisPanel from "./VideoAnalysisPanel"

const EXAMPLE_CHIPS = [
  "Does seed oil cause inflammation?",
  "Is mouth taping actually healthy?",
  "Can detox teas help with weight loss?",
]

export default function ToolCard() {
  const [tab, setTab] = useState("ask")
  const [question, setQuestion] = useState("")
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState(null)
  const resultRef = useRef(null)

  const activeValue = tab === "ask" ? question : url

  async function handleSubmit(event) {
    event?.preventDefault?.()

    if (!activeValue.trim()) {
      if (tab === "analyze") {
        setError("Paste a TikTok, Instagram, or YouTube link to analyze.")
      }
      return
    }

    setError("")
    setLoading(true)
    setResult(null)

    try {
      if (tab === "ask") {
        const claimResult = await analyzeClaim(question)
        setResult({ type: "claim", payload: claimResult })
      } else {
        const videoResult = await analyzeVideoUrl(url)
        setResult({ type: "video", payload: videoResult })
      }

      window.setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
    } catch (submitError) {
      setError(submitError.message || "Something went wrong while analyzing that request.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="tool" className="relative" data-testid="tool-section">
      {loading ? <LoadingOverlay /> : null}

      <div
        className="fade-up delay-2 relative rounded-[28px] border border-slate-100 bg-white p-6 md:p-8"
        style={{
          boxShadow: "0 18px 60px -20px rgba(37, 31, 71, 0.18), 0 2px 6px rgba(37,31,71,0.04)",
        }}
        data-testid="tool-card"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(134,203,146,0.35), transparent 70%)" }}
        />

        <div className="mb-5 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#71B48D]">
            <Sparkles size={14} />
            Evidence check
          </div>
          <div className="hidden items-center gap-1.5 text-[11px] text-slate-500 sm:inline-flex">
            <ShieldCheck size={13} className="text-[#71B48D]" />
            Peer-reviewed sources
          </div>
        </div>

        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value)
            setError("")
          }}
          className="w-full"
        >
          <TabsList
            className="grid h-auto w-full grid-cols-2 rounded-xl border border-slate-100 bg-slate-50 p-1"
            data-testid="tool-tabs"
          >
            <TabsTrigger
              value="ask"
              className="rounded-lg py-2.5 text-sm font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#251F47] data-[state=active]:shadow-sm"
              data-testid="tab-ask"
            >
              <Search size={15} className="mr-2" /> Ask
            </TabsTrigger>
            <TabsTrigger
              value="analyze"
              className="rounded-lg py-2.5 text-sm font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#251F47] data-[state=active]:shadow-sm"
              data-testid="tab-analyze"
            >
              <Link2 size={15} className="mr-2" /> Analyze Video / Post
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-5">
            <TabsContent value="ask" className="mt-0 focus-visible:outline-none">
              <label htmlFor="ask-input" className="sr-only">
                Health claim or question
              </label>
              <Textarea
                id="ask-input"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Paste a claim you heard, or ask: Does cold plunging really boost immunity?"
                className="mm-focus min-h-[140px] resize-none rounded-2xl border-slate-200 bg-slate-50/70 p-4 text-[15px] text-[#260F26] placeholder:text-slate-400 focus-visible:border-[#86CB92] focus-visible:ring-0"
                data-testid="ask-input"
              />
            </TabsContent>

            <TabsContent value="analyze" className="mt-0 focus-visible:outline-none">
              <div
                className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 md:p-6"
                data-testid="analyze-paste-area"
              >
                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[#404E7C]">
                  <Link2 size={14} className="text-[#71B48D]" />
                  Paste a TikTok, Instagram, or YouTube link
                </div>
                <label htmlFor="url-input" className="sr-only">
                  Video or post URL
                </label>
                <Input
                  id="url-input"
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://www.tiktok.com/@user/video/..."
                  className="mm-focus h-12 rounded-xl border-slate-200 bg-white px-4 text-[15px] text-[#260F26] placeholder:text-slate-400 focus-visible:border-[#86CB92] focus-visible:ring-0"
                  data-testid="analyze-url-input"
                />
                <p className="mt-3 text-xs text-slate-500">
                  MythMD uses available public text from supported links to extract health claims
                  and cross-check them with research.
                </p>
              </div>
            </TabsContent>

            <div className="mt-5 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-xs leading-relaxed text-slate-500">
                Evidence-informed insights backed by peer-reviewed research.
                <span className="block text-slate-400">Not a substitute for medical care.</span>
              </p>
              <Button
                type="submit"
                disabled={!activeValue.trim() || loading}
                className="group h-12 rounded-full bg-[#251F47] px-6 font-medium text-white shadow-lg transition-all hover:bg-[#260F26] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                data-testid="check-evidence-button"
              >
                {loading ? "Checking…" : "Check the Evidence"}
                <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </form>

          {tab === "ask" ? (
            <div className="mt-5 border-t border-slate-100 pt-5" data-testid="example-chips">
              <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Try an example
              </div>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_CHIPS.map((chip, index) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setQuestion(chip)
                      setTab("ask")
                      setError("")
                    }}
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs text-[#404E7C] transition-colors hover:border-[#86CB92] hover:bg-[#86CB92]/5 hover:text-[#251F47] md:text-[13px]"
                    data-testid={`example-chip-${index}`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700"
            >
              {error}
            </div>
          ) : null}
        </Tabs>
      </div>

      {result ? (
        <div ref={resultRef} className="mt-6 fade-up" data-testid="result-wrapper">
          {result.type === "claim" ? (
            <ResultCard
              claim={result.payload.claim}
              mode="ask"
              result={result.payload.analysis}
              studyCount={result.payload.abstractCount}
            />
          ) : (
            <VideoAnalysisPanel response={result.payload} />
          )}
        </div>
      ) : null}
    </div>
  )
}
