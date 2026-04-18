import { useState } from "react"
import './App.css';

function App() {
    const [claim, setClaim] = useState("")
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const sendMessage = async () => {
        if (!claim.trim()) return
        setLoading(true)
        setError(null)

        try {
            const verifyRes = await fetch(`${import.meta.env.VITE_BASE_API_URL}/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ claim })
            })
            const verifyData = await verifyRes.json()
            console.log(verifyData);
            const analyzeRes = await fetch(`${import.meta.env.VITE_BASE_API_URL}/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ abstracts: verifyData.abstracts, claim: claim})
            })
            const analyzeData = await analyzeRes.json()

            setMessages(prev => [...prev, { claim, result: analyzeData }])
            setClaim("")
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
       
        <div id="heading">
            <p id="pgtitle">Health Claim Verifier</p>
            <p id="headtxt">Enter a health claim and we'll check it against real research</p>
        </div>
        <div className="chat-container">
            <div id="chat-box" className="chat-box">
                {messages.map((msg, i) => (
                    <div key={i} className="message">
                        <p><strong>Claim:</strong> {msg.claim}</p>
                        <p><strong>Verdict:</strong> {msg.result.verdict}</p>
                        <p><strong>Confidence:</strong> {msg.result.confidence_score}/100</p>
                        <p><strong>Summary:</strong> {msg.result.summary}</p>
                        <ul>
                            {msg.result.citations.map((c, j) => (
                                <li key={j}><a href={c.url} target="_blank" rel="noreferrer">{c.title}</a></li>
                            ))}
                        </ul>
                    </div>
                ))}
                {loading && <p>Analyzing...</p>}
                {error && <p>Error: {error}</p>}
            </div>

            <div className="chat-input-area">
                <input
                    type="text"
                    value={claim}
                    onChange={(e) => setClaim(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Enter a health claim..."
                />
                <button onClick={sendMessage} disabled={loading}>Send</button>
            </div>
        </div>
        </>
    )
}

export default App