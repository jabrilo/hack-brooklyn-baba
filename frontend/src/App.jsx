import { useState } from "react"
import "./App.css"

const API_BASE = import.meta.env.VITE_BASE_API_URL

function inferPlatform(url) {
    const value = url.toLowerCase()

    if (value.includes("tiktok")) return "tiktok"
    if (value.includes("youtube") || value.includes("youtu.be")) return "youtube"
    if (value.includes("instagram")) return "instagram"

    return "unknown"
}

async function readJson(response) {
    const text = await response.text()

    if (!text) {
        return null
    }

    try {
        return JSON.parse(text)
    } catch {
        return { detail: text }
    }
}

async function requestJson(path, payload) {
    if (!API_BASE) {
        throw new Error("VITE_BASE_API_URL is not configured in the frontend environment.")
    }

    const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })

    const data = await readJson(response)

    if (!response.ok) {
        throw new Error(data?.detail || `Request failed with status ${response.status}.`)
    }

    return data
}

function App() {
    const [mode, setMode] = useState("claim")
    const [claim, setClaim] = useState("")
    const [content, setContent] = useState("")
    const [videoUrl, setVideoUrl] = useState("")
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const sendClaim = async () => {
        const trimmedClaim = claim.trim()
        if (!trimmedClaim) return

        setLoading(true)
        setError("")

        try {
            const verifyData = await requestJson("/verify", { claim: trimmedClaim })
            const analyzeData = await requestJson("/analyze", {
                abstracts: verifyData?.abstracts ?? [],
                claim: trimmedClaim,
            })

            setMessages((prev) => [
                {
                    id: crypto.randomUUID(),
                    type: "claim",
                    label: trimmedClaim,
                    result: analyzeData,
                },
                ...prev,
            ])
            setClaim("")
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const sendContent = async () => {
        const trimmedContent = content.trim()
        const trimmedVideoUrl = videoUrl.trim()

        if (!trimmedContent) {
            setError(
                trimmedVideoUrl
                    ? "Paste the transcript or post text for this link before analyzing it."
                    : "Paste a transcript or post text to analyze."
            )
            return
        }

        setLoading(true)
        setError("")

        try {
            const analyzeData = await requestJson("/analyze-content", {
                transcript: trimmedContent,
                video_url: trimmedVideoUrl || null,
                platform: inferPlatform(trimmedVideoUrl),
                max_claims: 3,
            })

            setMessages((prev) => [
                {
                    id: crypto.randomUUID(),
                    type: "content",
                    label: trimmedVideoUrl || "Transcript / post text",
                    result: analyzeData,
                },
                ...prev,
            ])
            setContent("")
            setVideoUrl("")
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = () => {
        if (mode === "claim") {
            void sendClaim()
            return
        }

        void sendContent()
    }

    return (
        <div className="page-shell">
            <div className="hero">
                <p className="eyebrow">Health Claim Verifier</p>
                <h1>Check text claims first. Analyze video content safely second.</h1>
                <p className="hero-copy">
                    The normal claim checker stays separate from the transcript flow so one
                    broken request does not take down the whole UI.
                </p>
            </div>

            <div className="panel">
                <div className="mode-switch" role="tablist" aria-label="Analysis mode">
                    <button
                        className={mode === "claim" ? "active" : ""}
                        onClick={() => setMode("claim")}
                        type="button"
                    >
                        Claim Prompt
                    </button>
                    <button
                        className={mode === "content" ? "active" : ""}
                        onClick={() => setMode("content")}
                        type="button"
                    >
                        Video / Post
                    </button>
                </div>

                {mode === "claim" ? (
                    <div className="form-stack">
                        <label className="field-label" htmlFor="claim-input">
                            Health claim
                        </label>
                        <input
                            id="claim-input"
                            type="text"
                            value={claim}
                            onChange={(event) => setClaim(event.target.value)}
                            onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
                            placeholder="Enter a health claim to fact-check..."
                        />
                        <p className="helper-text">
                            This uses the original `/verify` then `/analyze` flow.
                        </p>
                    </div>
                ) : (
                    <div className="form-stack">
                        <label className="field-label" htmlFor="video-url-input">
                            Video link
                        </label>
                        <input
                            id="video-url-input"
                            type="url"
                            value={videoUrl}
                            onChange={(event) => setVideoUrl(event.target.value)}
                            placeholder="https://www.tiktok.com/... or https://www.youtube.com/..."
                        />

                        <label className="field-label" htmlFor="content-input">
                            Transcript or post text
                        </label>
                        <textarea
                            id="content-input"
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            placeholder="Paste the transcript, caption, or post text here..."
                            rows={7}
                        />
                        <p className="helper-text">
                            The URL is stored as context. For now, analysis still requires the
                            transcript or post text to be pasted in.
                        </p>
                    </div>
                )}

                <div className="action-row">
                    <button className="primary-action" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Analyzing..." : "Analyze"}
                    </button>
                </div>

                {error ? <div className="status-banner error">{error}</div> : null}
            </div>

            <div className="results-column">
                {messages.length === 0 ? (
                    <div className="empty-state">
                        Results will appear here after a successful analysis.
                    </div>
                ) : null}

                {messages.map((message) => (
                    <div className="result-card" key={message.id}>
                        <p className="result-label">{message.label}</p>

                        {message.type === "claim" ? (
                            <ClaimResult result={message.result} />
                        ) : (
                            <ContentResult result={message.result} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

function ClaimResult({ result }) {
    const citations = Array.isArray(result?.citations) ? result.citations : []

    return (
        <div className="result-body">
            <p>
                <strong>Verdict:</strong> {result?.verdict || "No verdict returned."}
            </p>
            <p>
                <strong>Confidence:</strong> {result?.confidence_score ?? "N/A"}/100
            </p>
            <p>
                <strong>Summary:</strong> {result?.summary || "No summary returned."}
            </p>
            {citations.length > 0 ? (
                <ul className="citation-list">
                    {citations.map((citation, index) => (
                        <li key={`${citation.url}-${index}`}>
                            <a href={citation.url} target="_blank" rel="noreferrer">
                                {citation.title || citation.url}
                            </a>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    )
}

function ContentResult({ result }) {
    const items = Array.isArray(result?.results) ? result.results : []

    return (
        <div className="result-body">
            {result?.notes ? (
                <p>
                    <strong>Notes:</strong> {result.notes}
                </p>
            ) : null}

            {items.length === 0 ? (
                <p>No checkable claims were returned from this transcript.</p>
            ) : (
                <div className="content-results">
                    {items.map((item, index) => {
                        const citations = Array.isArray(item?.analysis?.citations)
                            ? item.analysis.citations
                            : []

                        return (
                            <div className="content-claim-card" key={`${item.claim}-${index}`}>
                                <p>
                                    <strong>Claim:</strong> {item.claim}
                                </p>
                                {item.speaker_text ? (
                                    <p>
                                        <strong>Original text:</strong> {item.speaker_text}
                                    </p>
                                ) : null}
                                <p>
                                    <strong>Verdict:</strong>{" "}
                                    {item?.analysis?.verdict || "No verdict returned."}
                                </p>
                                <p>
                                    <strong>Confidence:</strong>{" "}
                                    {item?.analysis?.confidence_score ?? "N/A"}/100
                                </p>
                                <p>
                                    <strong>Summary:</strong>{" "}
                                    {item?.analysis?.summary || "No summary returned."}
                                </p>
                                {citations.length > 0 ? (
                                    <ul className="citation-list">
                                        {citations.map((citation, citationIndex) => (
                                            <li key={`${citation.url}-${citationIndex}`}>
                                                <a
                                                    href={citation.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {citation.title || citation.url}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default App
