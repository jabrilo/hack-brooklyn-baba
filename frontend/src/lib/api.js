const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000"

const configuredBaseUrl = import.meta.env.VITE_BASE_API_URL?.trim()
export const API_BASE_URL = (configuredBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, "")

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

function formatErrorDetail(detail) {
  if (!detail) {
    return ""
  }

  if (typeof detail === "string") {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") {
          return item
        }

        if (item?.msg) {
          return item.msg
        }

        return JSON.stringify(item)
      })
      .join(" ")
  }

  if (typeof detail === "object") {
    if (typeof detail.message === "string") {
      return detail.message
    }

    return JSON.stringify(detail)
  }

  return String(detail)
}

async function requestJson(path, payload) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error(
      `Could not reach the MythMD API at ${API_BASE_URL}. Make sure the FastAPI server is running and VITE_BASE_API_URL is correct.`,
    )
  }

  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(
      formatErrorDetail(data?.detail) || `Request failed with status ${response.status}.`,
    )
  }

  return data
}

export async function analyzeClaim(claim) {
  const trimmedClaim = claim.trim()

  if (!trimmedClaim) {
    throw new Error("Enter a health claim or question to check.")
  }

  const verifyData = await requestJson("/verify", { claim: trimmedClaim })
  const analysis = await requestJson("/analyze", {
    claim: trimmedClaim,
    abstracts: verifyData?.abstracts ?? [],
  })

  return {
    claim: trimmedClaim,
    analysis,
    abstractCount: verifyData?.abstracts?.length ?? 0,
  }
}

export async function analyzeVideoUrl(videoUrl, maxClaims = 3) {
  const trimmedVideoUrl = videoUrl.trim()

  if (!trimmedVideoUrl) {
    throw new Error("Paste a TikTok, Instagram, or YouTube link to analyze.")
  }

  return requestJson("/analyze-video", {
    video_url: trimmedVideoUrl,
    platform: inferPlatform(trimmedVideoUrl),
    max_claims: maxClaims,
  })
}
