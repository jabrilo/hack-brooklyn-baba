import { useState, useRef } from "react"
import './App.css';

function AnimatedLoader({ message }) {
    return (
        <div className="loader-wrapper">
            <div className="loader-dots">
                <span /><span /><span />
            </div>
            <p className="loader-word">{message}</p>
        </div>
    )
}

function VerdictBadge({ verdict }) {
    const map = {
        "True":      { label: "Supported",   cls: "badge-true" },
        "False":     { label: "Unsupported",  cls: "badge-false" },
        "Uncertain": { label: "Uncertain",    cls: "badge-uncertain" },
    }
    const { label, cls } = map[verdict] ?? { label: verdict, cls: "badge-uncertain" }
    return <span className={`badge ${cls}`}>{label}</span>
}

function ResearchSupportBar({ score }) {
    return (
        <div className="conf-wrap">
            <span className="conf-label">Research Support</span>
            <div className="conf-track">
                <div className="conf-fill" style={{ width: `${score}%` }} />
            </div>
            <span className="conf-num">{score}/100</span>
        </div>
    )
}

function ResultCard({ msg }) {
    const [copyText, setCopyText] = useState("Copy");
    const audioRef = useRef(null)
    const [isPlaying, setIsPlaying] = useState(false)

    async function playAudio() {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
            setIsPlaying(false)
            return
        }
        setIsPlaying(true)
        try {
            const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/speak`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: msg.result.summary })
            })
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const audio = new Audio(url)
            audioRef.current = audio
            audio.onended = () => {
                setIsPlaying(false)
                audioRef.current = null
            }
            audio.play()
        }
        catch {
            setIsPlaying(false)
            audioRef.current = null
        }
    }

    function copyToClipboard() {
        setCopyText("Copied!")
        const text = `Claim: ${msg.claim}\nVerdict: ${msg.result.verdict}\nResearch Supported: ${msg.result.research_support}/100\n\nSummary: ${msg.result.summary}\n\nSources:\n${msg.result.citations.map(c => `- ${c.title} (${c.url})`).join("\n")}`

        navigator.clipboard.writeText(text)
        setTimeout(() => {
            setCopyText("Copy")
        }, 2000)

    }

    return (
        <div className="result-card">
            <p className="result-claim">"{msg.claim}"</p>
            <div className="result-header">
                <VerdictBadge verdict={msg.result.verdict} />
                <ResearchSupportBar score={msg.result.research_support} />
            </div>
            <p className="result-summary">{msg.result.summary}</p>
            {msg.result.citations?.length > 0 && (
                <div className="citations">
                    <p className="cit-label">Sources</p>
                    <ul>
                        {msg.result.citations.map((c, j) => (
                            <li key={j}>
                                <a href={c.url} target="_blank" rel="noreferrer">{c.title}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <button 
                className={`copy-btn ${copyText === "Copied!" ? "copied" : ""}`}
                onClick={copyToClipboard}
                title="Copy to clipboard"
            >
                {copyText}
            </button>
            <button
                className={`speak-btn ${isPlaying ? "speaking" : ""}`}
                onClick={playAudio}
                disabled={isPlaying}
                title="Read summary aloud"
            >
                {isPlaying ? "🔊" : "🔈"}
            </button>     
        </div>
    )
}

function App() {
    const [claim, setClaim] = useState("")
    const [messages, setMessages] = useState([])
    const [statusMsg, setStatusMsg] = useState(null)   // real-time message from stream
    const [error, setError] = useState(null)
    const bottomRef = useRef(null)

    const isStreaming = statusMsg !== null
    const hasContent = messages.length > 0 || isStreaming || error !== null

    const scrollToBottom = () =>
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)

    const sendMessage = async () => {
        if (!claim.trim() || isStreaming) return

        const currentClaim = claim
        setClaim("")
        setError(null)
        setStatusMsg("Starting...")
        scrollToBottom()

        try {
            const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ claim: currentClaim }),
            })

            if (!res.ok) throw new Error(`Server error: ${res.status}`)

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ""

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })

                // SSE lines look like: "data: {...}\n\n"
                // Split on double newlines to get complete events
                const parts = buffer.split("\n\n")
                buffer = parts.pop()  // last chunk may be incomplete, keep it

                for (const part of parts) {
                    const line = part.trim()
                    if (!line.startsWith("data:")) continue

                    const jsonStr = line.slice("data:".length).trim()
                    let payload
                    try { payload = JSON.parse(jsonStr) } catch { continue }

                    if (payload.event === "complete") {
                        setMessages(prev => [...prev, { claim: currentClaim, result: payload.result }])
                        setStatusMsg(null)
                        scrollToBottom()
                    } else if (payload.event === "error") {
                        setError(payload.message)
                        setStatusMsg(null)
                    } else if (payload.message) {
                        // extracting / searching / fetching / found / analyzing
                        setStatusMsg(payload.message)
                    }
                }
            }
        } catch (err) {
            setError(err.message)
            setStatusMsg(null)
        }
    }

    return (
        <div className={`app-shell ${hasContent ? "has-content" : "empty"}`}>

            {/* ── Hero (empty state only) ── */}
            {!hasContent && (
                <div className="hero">
                    <div className="hero-icon">🩺</div>
                    <h1 className="hero-title">Health Claim Verifier</h1>
                    <p className="hero-sub">Enter a health claim and we'll check it against real research</p>
                </div>
            )}

            {/* ── Feed ── */}
            {hasContent && (
                <div className="feed">
                    {messages.map((msg, i) => (
                        <ResultCard key={i} msg={msg} />
                    ))}
                    {isStreaming && <AnimatedLoader message={statusMsg} />}
                    {error && <p className="error-msg">⚠️ {error}</p>}
                    <div ref={bottomRef} />
                </div>
            )}

            {/* ── Input bar ── */}
            <div className={`input-dock ${hasContent ? "docked" : "centered"}`}>
                <div className="input-bar">
                    <input
                        type="text"
                        value={claim}
                        onChange={(e) => setClaim(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="e.g. Vitamin C prevents the common cold..."
                        disabled={isStreaming}
                    />
                    <button onClick={sendMessage} disabled={isStreaming || !claim.trim()}>
                        {isStreaming ? (
                            <span className="btn-spinner" />
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        )}
                    </button>
                </div>
                {!hasContent && <p className="input-hint">Powered by PubMed + Claude</p>}
            </div>

        </div>
    )
}

export default App
