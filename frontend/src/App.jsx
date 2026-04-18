import { useState, useEffect } from "react"

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

    return <h1>{data.message}</h1>
}

export default App