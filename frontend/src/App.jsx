import { useState, useEffect } from "react"
import "./App.css"

function App() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/`)
                const payload = await res.json()
                setData(payload)

            } catch (err){
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return <p>Loading...</p>
    if (error) return <p>Error: {error}</p>

    return (
        <>
            <div class="chat-container">
                <div id="chat-box" class="chat-box"></div>
                <div class="chat-input-area">
                    <input id="input" type="text" placeholder="Type a message..." />
                    <button onclick="sendMessage()">Send</button>
                </div>
            </div>
        </>
    )
}

export default App